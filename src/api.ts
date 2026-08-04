// Client-side API — Google AI Studio სერვერის ნაცვლად, პირდაპირ Firebase Firestore-ზე.
// ინტერფეისი უცვლელია, ამიტომ ხედებს კოდის შეცვლა არ სჭირდებათ.
import {
  User,
  Person,
  SystemSettings,
  AuditLog,
  DashboardStats,
  PersonStatus,
  SmallFamilyHome,
} from './types';
import { store } from './store';

// მხოლოდ სესიის მაჩვენებელი (uid) ინახება ლოკალურად — მონაცემები არა, ისინი Firebase-ზეა.
const UID_KEY = 'foster_portal_uid';

let currentUser: User | null = null;

function modifier(): string {
  return currentUser ? `${currentUser.first_name} ${currentUser.last_name}` : 'უცნობი';
}
function isAdmin(): boolean {
  return currentUser?.role === 'ადმინისტრატორი';
}

export function getStoredToken(): string | null {
  return localStorage.getItem(UID_KEY);
}
export function setStoredToken(token: string) {
  localStorage.setItem(UID_KEY, token);
}
export function removeStoredToken() {
  localStorage.removeItem(UID_KEY);
}

export const api = {
  // ---------------- Auth ----------------
  login: async (username: string, password: string) => {
    await store.ensureLoaded();
    const { user, mustChangePassword } = store.verifyLogin(username, password);
    currentUser = user;
    setStoredToken(user.id);
    return { token: user.id, user, mustChangePassword };
  },

  getCurrentUser: async () => {
    await store.ensureLoaded();
    const uid = getStoredToken();
    if (!uid) throw new Error('სესია ვერ მოიძებნა');
    const user = store.getUserById(uid);
    if (!user || !user.is_active) {
      removeStoredToken();
      throw new Error('მომხმარებელი ვერ მოიძებნა ან დაბლოკილია');
    }
    currentUser = user;
    return { user };
  },

  logout: async () => {
    currentUser = null;
    removeStoredToken();
  },

  changePassword: async (newPassword: string) => {
    if (!currentUser) throw new Error('სესია ვერ მოიძებნა');
    await store.setUserPassword(currentUser.username, newPassword, modifier());
    return { success: true, message: 'პაროლი წარმატებით შეიცვალა' };
  },

  // ---------------- Users ----------------
  getUsers: async () => store.getUsers(),
  createUser: async (userData: any) => store.createUser(userData, modifier()),
  updateUser: async (id: string, updates: any) => store.updateUser(id, updates, modifier()),
  deleteUser: async (id: string) => {
    await store.deleteUser(id, modifier());
    return { success: true, message: 'მომხმარებელი წარმატებით წაიშალა' };
  },

  // ---------------- Small Family Homes ----------------
  getSmallHomes: async () => store.getSmallHomes(),
  createSmallHome: async (data: Omit<SmallFamilyHome, 'id' | 'created_at'>) => store.createSmallHome(data, modifier()),
  updateSmallHome: async (id: string, updates: Partial<SmallFamilyHome>) => store.updateSmallHome(id, updates, modifier()),
  deleteSmallHome: async (id: string) => {
    await store.deleteSmallHome(id, modifier());
    return { success: true };
  },

  // ---------------- Persons ----------------
  getPersons: async (params?: any) => store.getPersons(params),
  getPersonById: async (id: string) => {
    const p = store.getPersonById(id);
    if (!p) throw new Error('პირი ვერ მოიძებნა');
    return p;
  },
  createPerson: async (data: any) => store.createPerson(data, modifier()),
  updatePerson: async (id: string, updates: Partial<Person>) => store.updatePerson(id, updates, modifier(), isAdmin()),
  deletePerson: async (id: string) => {
    await store.deletePerson(id, modifier());
    return { success: true, message: 'ქეისი სრულად წაიშალა' };
  },
  transitionPlacement: async (id: string, data: any) => store.transitionPlacement(id, data, modifier(), isAdmin()),
  extendPlacement: async (id: string, data: any) => store.extendPlacement(id, data, modifier(), isAdmin()),
  lockCase: async (id: string, lock_reason: string) => store.setCaseLock(id, true, lock_reason, modifier()),
  unlockCase: async (id: string, unlock_reason?: string) =>
    store.setCaseLock(id, false, unlock_reason || 'ადმინისტრატორმა განაბლოკა', modifier()),
  archivePerson: async (id: string, reason: string) => store.archivePerson(id, reason, modifier()),
  unarchivePerson: async (id: string) => store.unarchivePerson(id, modifier()),

  // ---------------- Reviews ----------------
  getReviews: async () => store.getReviews(),
  performReview: async (reviewId: string, data: any) => store.performReview(reviewId, data, modifier()),
  reviewPerson: async (personId: string) => store.reviewPerson(personId, modifier()),

  // ---------------- Foster Parents (მიმღები მშობლები) ----------------
  getFosterParents: async () => store.getFosterParents(),
  getFosterParentById: async (id: string) => store.getFosterParentById(id),
  createFosterParent: async (data: any) => store.createFosterParent(data, modifier()),
  updateFosterParent: async (id: string, updates: any) => store.updateFosterParent(id, updates, modifier()),
  setChildrenException: async (id: string, enabled: boolean, reason?: string) => {
    if (!isAdmin()) throw new Error('ლიმიტის გამონაკლისის მართვა შეუძლია მხოლოდ ადმინისტრატორს.');
    return store.setChildrenException(id, enabled, reason, modifier());
  },
  deleteFosterParent: async (id: string) => {
    await store.deleteFosterParent(id, modifier());
    return { success: true };
  },
  attachChild: async (childId: string, fosterParentId: string) => store.attachChild(childId, fosterParentId, modifier()),
  detachChild: async (childId: string) => store.detachChild(childId, modifier()),
  transferChild: async (childId: string, newFosterParentId: string) => store.transferChild(childId, newFosterParentId, modifier()),

  // ---------------- Dashboard / Settings / Audit ----------------
  getDashboardStats: async (): Promise<DashboardStats> => store.getDashboardStats(),
  getSettings: async (): Promise<SystemSettings> => store.getSettings(),
  updateSettings: async (settings: Partial<SystemSettings>) => store.updateSettings(settings, modifier()),
  getAuditLogs: async (): Promise<AuditLog[]> => store.getAuditLogs(),
};

export type { User, Person, PersonStatus };
