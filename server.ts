import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import bcrypt from 'bcryptjs';
import { createServer as createViteServer } from 'vite';
import { store } from './server/store.js';
import { User, UserRole } from './src/types.js';

// In-memory active session tokens map: token -> username
const activeSessions = new Map<string, { username: string; createdAt: number }>();

function generateSessionToken(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
}

// Custom authenticated request interface
export interface AuthRequest extends Request {
  user?: User;
}

// Authentication Middleware
function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'ავტორიზაცია აუცილებელია' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const session = activeSessions.get(token);
  if (!session) {
    res.status(401).json({ error: 'სესია ვადაგადაცილებულია ან არასწორია' });
    return;
  }

  const user = store.getUserByUsername(session.username);
  if (!user || !user.is_active) {
    activeSessions.delete(token);
    res.status(401).json({ error: 'მომხმარებელი დაბლოკილია ან ვერ მოიძებნა' });
    return;
  }

  req.user = user;
  next();
}

// Admin only middleware
function adminOnly(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'ადმინისტრატორი') {
    res.status(403).json({ error: 'მოქმედება ნებადართულია მხოლოდ ადმინისტრატორისთვის' });
    return;
  }
  next();
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API Routes ---

  // Health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', serverTime: new Date().toISOString() });
  });

  // Auth: Login
  app.post('/api/auth/login', (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        res.status(400).json({ error: 'გთხოვთ, მიუთითოთ მომხმარებელი და პაროლი' });
        return;
      }

      const user = store.getUserByUsername(username);
      if (!user) {
        res.status(401).json({ error: 'არასწორი მომხმარებელი ან პაროლი' });
        return;
      }

      if (!user.is_active) {
        res.status(403).json({ error: 'თქვენი ანგარიში შეჩერებულია. მიმართეთ ადმინისტრატორს.' });
        return;
      }

      const passwordHash = (user as any).password_hash;
      const match = passwordHash ? bcrypt.compareSync(password, passwordHash) : false;

      if (!match) {
        res.status(401).json({ error: 'არასწორი მომხმარებელი ან პაროლი' });
        return;
      }

      // Generate session token
      const token = generateSessionToken();
      activeSessions.set(token, { username: user.username, createdAt: Date.now() });

      const cleanUser: Partial<User> = { ...user };
      delete (cleanUser as any).password_hash;

      res.json({
        token,
        user: cleanUser,
        mustChangePassword: !!user.must_change_password,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'სისტემური შეცდომა' });
    }
  });

  // Auth: Get Current User
  app.get('/api/auth/me', authMiddleware, (req: AuthRequest, res: Response) => {
    const cleanUser = { ...req.user };
    delete (cleanUser as any).password_hash;
    res.json({ user: cleanUser });
  });

  // Auth: Logout
  app.post('/api/auth/logout', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      activeSessions.delete(token);
    }
    res.json({ success: true });
  });

  // Auth: Change Password
  app.post('/api/auth/change-password', authMiddleware, (req: AuthRequest, res: Response) => {
    try {
      const { newPassword } = req.body;
      if (!newPassword || newPassword.length < 6) {
        res.status(400).json({ error: 'ახალი პაროლი უნდა შეიცავდეს მინიმუმ 6 სიმბოლოს' });
        return;
      }

      const user = req.user!;
      store.setUserPassword(user.username, newPassword, `${user.first_name} ${user.last_name}`);
      res.json({ success: true, message: 'პაროლი წარმატებით შეიცვალა' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'შეცდომა პაროლის შეცვლისას' });
    }
  });

  // User Management (Admin only)
  app.get('/api/users', authMiddleware, adminOnly, (req: AuthRequest, res: Response) => {
    res.json(store.getUsers());
  });

  app.post('/api/users', authMiddleware, adminOnly, (req: AuthRequest, res: Response) => {
    try {
      const creator = `${req.user!.first_name} ${req.user!.last_name}`;
      const newUser = store.createUser(req.body, creator);
      res.json(newUser);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/users/:id', authMiddleware, adminOnly, (req: AuthRequest, res: Response) => {
    try {
      const modifier = `${req.user!.first_name} ${req.user!.last_name}`;
      const updatedUser = store.updateUser(req.params.id, req.body, modifier);
      res.json(updatedUser);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/users/:id', authMiddleware, adminOnly, (req: AuthRequest, res: Response) => {
    try {
      const modifier = `${req.user!.first_name} ${req.user!.last_name}`;
      store.deleteUser(req.params.id, modifier);
      res.json({ success: true, message: 'მომხმარებელი წარმატებით წაიშალა' });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Small Family Homes Dictionary
  app.get('/api/small-homes', authMiddleware, (req: AuthRequest, res: Response) => {
    res.json(store.getSmallHomes());
  });

  app.post('/api/small-homes', authMiddleware, adminOnly, (req: AuthRequest, res: Response) => {
    try {
      const modifier = `${req.user!.first_name} ${req.user!.last_name}`;
      const home = store.createSmallHome(req.body, modifier);
      res.json(home);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/small-homes/:id', authMiddleware, adminOnly, (req: AuthRequest, res: Response) => {
    try {
      const modifier = `${req.user!.first_name} ${req.user!.last_name}`;
      const home = store.updateSmallHome(req.params.id, req.body, modifier);
      res.json(home);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/small-homes/:id', authMiddleware, adminOnly, (req: AuthRequest, res: Response) => {
    try {
      const modifier = `${req.user!.first_name} ${req.user!.last_name}`;
      store.deleteSmallHome(req.params.id, modifier);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Person & Case Management
  app.get('/api/persons', authMiddleware, (req: AuthRequest, res: Response) => {
    try {
      const filters = {
        search: req.query.search as string,
        placement_type: req.query.placement_type as string,
        person_status: req.query.person_status as string,
        case_status: req.query.case_status as string,
        reminder_status: req.query.reminder_status as string,
        is_locked: req.query.is_locked ? req.query.is_locked === 'true' : undefined,
        include_archived: req.query.include_archived === 'true',
      };
      const list = store.getPersons(filters);
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/persons/:id', authMiddleware, (req: AuthRequest, res: Response) => {
    const person = store.getPersonById(req.params.id);
    if (!person) {
      res.status(404).json({ error: 'პირი ვერ მოიძებნა' });
      return;
    }
    res.json(person);
  });

  app.post('/api/persons', authMiddleware, (req: AuthRequest, res: Response) => {
    try {
      const creator = `${req.user!.first_name} ${req.user!.last_name}`;
      const person = store.createPerson(req.body, creator);
      res.json(person);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/persons/:id', authMiddleware, (req: AuthRequest, res: Response) => {
    try {
      const modifier = `${req.user!.first_name} ${req.user!.last_name}`;
      const isAdmin = req.user!.role === 'ადმინისტრატორი';
      const person = store.updatePerson(req.params.id, req.body, modifier, isAdmin);
      res.json(person);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/persons/:id', authMiddleware, adminOnly, (req: AuthRequest, res: Response) => {
    try {
      const modifier = `${req.user!.first_name} ${req.user!.last_name}`;
      store.deletePerson(req.params.id, modifier);
      res.json({ success: true, message: 'ქეისი სრულად წაიშალა' });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/persons/:id/transition', authMiddleware, (req: AuthRequest, res: Response) => {
    try {
      const modifier = `${req.user!.first_name} ${req.user!.last_name}`;
      const isAdmin = req.user!.role === 'ადმინისტრატორი';
      const person = store.transitionPlacement(req.params.id, req.body, modifier, isAdmin);
      res.json(person);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/persons/:id/extend', authMiddleware, (req: AuthRequest, res: Response) => {
    try {
      const modifier = `${req.user!.first_name} ${req.user!.last_name}`;
      const isAdmin = req.user!.role === 'ადმინისტრატორი';
      const person = store.extendPlacement(req.params.id, req.body, modifier, isAdmin);
      res.json(person);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/persons/:id/lock', authMiddleware, adminOnly, (req: AuthRequest, res: Response) => {
    try {
      const modifier = `${req.user!.first_name} ${req.user!.last_name}`;
      const { lock_reason } = req.body;
      if (!lock_reason) {
        res.status(400).json({ error: 'გთხოვთ, მიუთითოთ ქეისის დაბლოკვის მიზეზი' });
        return;
      }
      const person = store.setCaseLock(req.params.id, true, lock_reason, modifier);
      res.json(person);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/persons/:id/unlock', authMiddleware, adminOnly, (req: AuthRequest, res: Response) => {
    try {
      const modifier = `${req.user!.first_name} ${req.user!.last_name}`;
      const { unlock_reason } = req.body;
      const person = store.setCaseLock(req.params.id, false, unlock_reason || 'ადმინისტრატორმა განაბლოკა', modifier);
      res.json(person);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/persons/:id/archive', authMiddleware, adminOnly, (req: AuthRequest, res: Response) => {
    try {
      const modifier = `${req.user!.first_name} ${req.user!.last_name}`;
      const { reason } = req.body;
      if (!reason) {
        res.status(400).json({ error: 'გთხოვთ, მიუთითოთ არქივში გადატანის მიზეზი' });
        return;
      }
      const person = store.archivePerson(req.params.id, reason, modifier);
      res.json(person);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/persons/:id/unarchive', authMiddleware, adminOnly, (req: AuthRequest, res: Response) => {
    try {
      const modifier = `${req.user!.first_name} ${req.user!.last_name}`;
      const person = store.unarchivePerson(req.params.id, modifier);
      res.json(person);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Reviews (6-Month Interim Review Cycle)
  app.get('/api/reviews', authMiddleware, (req: AuthRequest, res: Response) => {
    res.json(store.getReviews());
  });

  app.post('/api/reviews/:id/perform', authMiddleware, (req: AuthRequest, res: Response) => {
    try {
      const modifier = `${req.user!.first_name} ${req.user!.last_name}`;
      const updatedPerson = store.performReview(req.params.id, req.body, modifier);
      res.json(updatedPerson);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Dashboard Stats
  app.get('/api/dashboard', authMiddleware, (req: AuthRequest, res: Response) => {
    try {
      const all = store.getPersons();
      const active = all.filter((p) => p.case_status === 'აქტიური');

      const stats = {
        total_persons: all.length,
        active_cases: active.length,
        locked_cases: active.filter((p) => p.is_locked).length,
        emergency_count: active.filter((p) => p.current_placement?.placement_type === 'გადაუდებელი მინდობითი აღზრდა').length,
        regular_count: active.filter((p) => p.current_placement?.placement_type === 'რეგულარული მინდობითი აღზრდა').length,
        kinship_count: active.filter((p) => p.current_placement?.placement_type === 'ნათესაური მინდობითი აღზრდა').length,
        group_home_count: active.filter((p) => p.current_placement?.placement_type === 'მცირე საოჯახო ტიპის სახლი').length,
        reintegration_count: active.filter((p) => p.current_placement?.placement_type === 'რეინტეგრაცია').length,
        renewal_due_count: active.filter((p) => p.reminder_status === 'გასაგრძელებელი').length,
        critical_count: active.filter((p) => p.reminder_status === 'კრიტიკული').length,
        overdue_count: active.filter((p) => p.reminder_status === 'ვადაგადაცილებული').length,
        approaching_18_count: active.filter((p) => p.days_until_adulthood !== undefined && p.days_until_adulthood >= 0 && p.days_until_adulthood <= 60).length,
        approaching_21_count: active.filter((p) => p.days_until_21 !== undefined && p.days_until_21 >= 0 && p.days_until_21 <= 60).length,
        reviews_due_count: active.filter((p) => p.next_review?.status === 'გადასახედი').length,
        reviews_overdue_count: active.filter((p) => p.next_review?.status === 'ვადაგადაცილებული').length,
      };

      res.json(stats);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Settings
  app.get('/api/settings', authMiddleware, adminOnly, (req: AuthRequest, res: Response) => {
    res.json(store.getSettings());
  });

  app.put('/api/settings', authMiddleware, adminOnly, (req: AuthRequest, res: Response) => {
    try {
      const modifier = `${req.user!.first_name} ${req.user!.last_name}`;
      const settings = store.updateSettings(req.body, modifier);
      res.json(settings);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Audit Logs
  app.get('/api/audit', authMiddleware, adminOnly, (req: AuthRequest, res: Response) => {
    res.json(store.getAuditLogs());
  });

  // Vite Middleware for Dev Mode
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`მინდობითი აღზრდის პორტალის სერვერი გაშვეულია: http://0.0.0.0:${PORT}`);
  });
}

startServer();
