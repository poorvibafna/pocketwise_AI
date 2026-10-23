import {
  User,
  Transaction,
  Category,
  Budget,
  Goal,
  DashboardData,
  InsightsData,
  NotificationItem,
  Lesson,
} from '../types';

let currentUserId = parseInt(localStorage.getItem('pocketwise_user_id') || '1', 10);

export function getActiveUserId(): number {
  return currentUserId;
}

export function setActiveUserId(id: number): void {
  currentUserId = id;
  localStorage.setItem('pocketwise_user_id', String(id));
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  headers.set('x-user-id', String(getActiveUserId()));

  const res = await fetch(`/api${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorMsg = `HTTP Error ${res.status}`;
    try {
      const errorJson = await res.json();
      if (errorJson.error) errorMsg = errorJson.error;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  return res.json();
}

export const api = {
  // Users
  getUser: () => request<{ user: User; allUsers: User[] }>('/user'),
  createUser: (data: { name: string; email: string; college?: string; monthly_allowance?: number }) =>
    request<{ success: boolean; userId: number }>('/user', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Categories & Smart suggestions
  getCategories: () => request<{ categories: Category[] }>('/categories'),
  suggestCategory: (title: string) =>
    request<{ suggestion: string | null; explanation: string; type?: 'income' | 'expense' }>(
      '/categories/suggest',
      {
        method: 'POST',
        body: JSON.stringify({ title }),
      }
    ),

  // Transactions
  getTransactions: (params?: {
    category?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.type) query.set('type', params.type);
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    if (params?.search) query.set('search', params.search);
    return request<{ transactions: Transaction[] }>(`/transactions?${query.toString()}`);
  },
  createTransaction: (data: {
    title: string;
    amount: number;
    type: 'income' | 'expense';
    category: string;
    date: string;
    notes?: string;
  }) =>
    request<{ success: boolean; message: string }>('/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateTransaction: (
    id: number,
    data: {
      title: string;
      amount: number;
      type: 'income' | 'expense';
      category: string;
      date: string;
      notes?: string;
    }
  ) =>
    request<{ success: boolean; message: string }>(`/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteTransaction: (id: number) =>
    request<{ success: boolean; message: string }>(`/transactions/${id}`, {
      method: 'DELETE',
    }),

  // Budgets
  getBudgets: (month?: string) => {
    const query = month ? `?month=${month}` : '';
    return request<{ budgets: Budget[]; month: string }>(`/budgets${query}`);
  },
  saveBudget: (data: { category: string; monthly_limit: number; month_year?: string }) =>
    request<{ success: boolean; message: string }>('/budgets', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteBudget: (id: number) =>
    request<{ success: boolean; message: string }>(`/budgets/${id}`, {
      method: 'DELETE',
    }),

  // Goals
  getGoals: () => request<{ goals: Goal[] }>('/goals'),
  createGoal: (data: {
    title: string;
    target_amount: number;
    target_date: string;
    description?: string;
    category?: string;
  }) =>
    request<{ success: boolean; message: string }>('/goals', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateGoal: (
    id: number,
    data: {
      title: string;
      target_amount: number;
      target_date: string;
      description?: string;
      category?: string;
    }
  ) =>
    request<{ success: boolean; message: string }>(`/goals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteGoal: (id: number) =>
    request<{ success: boolean; message: string }>(`/goals/${id}`, {
      method: 'DELETE',
    }),
  contributeToGoal: (id: number, data: { amount: number; date?: string; notes?: string }) =>
    request<{ success: boolean; message: string }>(`/goals/${id}/contribute`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Dashboard
  getDashboard: (month?: string) => {
    const query = month ? `?month=${month}` : '';
    return request<DashboardData>(`/dashboard${query}`);
  },

  // Insights & Forecast
  getInsights: () => request<InsightsData>('/insights'),

  // Notifications
  getNotifications: () => request<{ notifications: NotificationItem[] }>('/notifications'),
  markNotificationRead: (id: number) =>
    request<{ success: boolean }>(`/notifications/${id}/read`, { method: 'POST' }),
  clearNotifications: () =>
    request<{ success: boolean; message: string }>('/notifications/clear', { method: 'POST' }),

  // AI Coach Chat
  chatWithCoach: (message: string, history: { role: 'user' | 'model'; parts: { text: string }[] }[]) =>
    request<{ reply: string; isConfigured: boolean; error?: string }>('/coach/chat', {
      method: 'POST',
      body: JSON.stringify({ message, history }),
    }),

  // Financial Learning & Quizzes
  getLessons: () => request<{ lessons: Lesson[] }>('/learning'),
  submitQuiz: (lesson_id: string, answers: number[]) =>
    request<{
      success: boolean;
      score: number;
      max_score: number;
      feedback: { questionIndex: number; isCorrect: boolean; correctIndex: number; userAnswer: number; explanation: string }[];
    }>('/learning/quiz', {
      method: 'POST',
      body: JSON.stringify({ lesson_id, answers }),
    }),

  // Data management
  resetDemoData: () => request<{ success: boolean; message: string }>('/data/reset', { method: 'POST' }),
  clearUserData: () => request<{ success: boolean; message: string }>('/data/clear', { method: 'POST' }),
};
