import {
  User,
  Person,
  SystemSettings,
  AuditLog,
  DashboardStats,
  PersonStatus,
  PlacementType,
  SmallFamilyHome,
  CaseReview,
} from './types';

const TOKEN_KEY = 'foster_portal_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'მოთხოვნის შესრულებისას დაფიქსირდა შეცდომა');
  }

  return data as T;
}

export const api = {
  // Auth
  login: async (username: string, password: string) => {
    const res = await request<{ token: string; user: User; mustChangePassword?: boolean }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    setStoredToken(res.token);
    return res;
  },

  getCurrentUser: async () => {
    return request<{ user: User }>('/api/auth/me');
  },

  logout: async () => {
    try {
      await request('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    } finally {
      removeStoredToken();
    }
  },

  changePassword: async (newPassword: string) => {
    return request<{ success: boolean; message: string }>('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    });
  },

  // Users
  getUsers: async () => {
    return request<User[]>('/api/users');
  },

  createUser: async (userData: any) => {
    return request<User>('/api/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  updateUser: async (id: string, updates: any) => {
    return request<User>(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  deleteUser: async (id: string) => {
    return request<{ success: boolean; message: string }>(`/api/users/${id}`, {
      method: 'DELETE',
    });
  },

  // Small Family Homes Dictionary
  getSmallHomes: async () => {
    return request<SmallFamilyHome[]>('/api/small-homes');
  },

  createSmallHome: async (data: Omit<SmallFamilyHome, 'id' | 'created_at'>) => {
    return request<SmallFamilyHome>('/api/small-homes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateSmallHome: async (id: string, updates: Partial<SmallFamilyHome>) => {
    return request<SmallFamilyHome>(`/api/small-homes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  deleteSmallHome: async (id: string) => {
    return request<{ success: boolean }>(`/api/small-homes/${id}`, {
      method: 'DELETE',
    });
  },

  // Persons
  getPersons: async (params?: {
    search?: string;
    placement_type?: string;
    person_status?: string;
    case_status?: string;
    reminder_status?: string;
    is_locked?: boolean;
    include_archived?: boolean;
  }) => {
    const query = new URLSearchParams();
    if (params) {
      if (params.search) query.set('search', params.search);
      if (params.placement_type) query.set('placement_type', params.placement_type);
      if (params.person_status) query.set('person_status', params.person_status);
      if (params.case_status) query.set('case_status', params.case_status);
      if (params.reminder_status) query.set('reminder_status', params.reminder_status);
      if (typeof params.is_locked === 'boolean') query.set('is_locked', String(params.is_locked));
      if (params.include_archived) query.set('include_archived', 'true');
    }
    const qStr = query.toString();
    return request<Person[]>(`/api/persons${qStr ? `?${qStr}` : ''}`);
  },

  getPersonById: async (id: string) => {
    return request<Person>(`/api/persons/${id}`);
  },

  createPerson: async (data: {
    first_name: string;
    last_name: string;
    personal_number: string;
    birth_date: string;
    admission_date: string;
    admission_reason: string;
    admission_source: string;
    person_status: PersonStatus;
    contact_person: {
      first_name: string;
      last_name: string;
      personal_number: string;
      phone: string;
    };
    initial_placement?: any;
  }) => {
    return request<Person>('/api/persons', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updatePerson: async (id: string, updates: Partial<Person>) => {
    return request<Person>(`/api/persons/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  deletePerson: async (id: string) => {
    return request<{ success: boolean; message: string }>(`/api/persons/${id}`, {
      method: 'DELETE',
    });
  },

  transitionPlacement: async (
    id: string,
    data: any
  ) => {
    return request<Person>(`/api/persons/${id}/transition`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  extendPlacement: async (
    id: string,
    data: {
      new_end_date: string;
      extension_reason: string;
      decision_date: string;
    }
  ) => {
    return request<Person>(`/api/persons/${id}/extend`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  lockCase: async (id: string, lock_reason: string) => {
    return request<Person>(`/api/persons/${id}/lock`, {
      method: 'POST',
      body: JSON.stringify({ lock_reason }),
    });
  },

  unlockCase: async (id: string, unlock_reason?: string) => {
    return request<Person>(`/api/persons/${id}/unlock`, {
      method: 'POST',
      body: JSON.stringify({ unlock_reason }),
    });
  },

  archivePerson: async (id: string, reason: string) => {
    return request<Person>(`/api/persons/${id}/archive`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  unarchivePerson: async (id: string) => {
    return request<Person>(`/api/persons/${id}/unarchive`, {
      method: 'POST',
    });
  },

  // Reviews (6-Month Interim Review Cycle)
  getReviews: async () => {
    return request<CaseReview[]>('/api/reviews');
  },

  performReview: async (reviewId: string, data: {
    review_date: string;
    result?: string;
    program_decision?: 'გაგრძელება' | 'დასრულება';
    comment?: string;
    new_planned_end_date?: string;
    notes?: string;
    attachment_name?: string;
  }) => {
    return request<Person>(`/api/reviews/${reviewId}/perform`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Dashboard & Settings & Audit
  getDashboardStats: async () => {
    return request<DashboardStats>('/api/dashboard');
  },

  getSettings: async () => {
    return request<SystemSettings>('/api/settings');
  },

  updateSettings: async (settings: Partial<SystemSettings>) => {
    return request<SystemSettings>('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },

  getAuditLogs: async () => {
    return request<AuditLog[]>('/api/audit');
  },
};
