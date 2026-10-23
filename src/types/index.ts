export interface User {
  id: number;
  name: string;
  email: string;
  college: string;
  monthly_allowance: number;
  created_at?: string;
}

export interface Transaction {
  id: number;
  user_id: number;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  notes?: string;
  created_at?: string;
}

export interface Category {
  id: number;
  name: string;
  type: 'income' | 'expense';
  icon?: string;
  color?: string;
}

export interface Budget {
  id: number;
  user_id: number;
  category: string;
  monthly_limit: number;
  month_year: string;
  spent: number;
  remaining: number;
  percentUsed: number;
  status: 'normal' | 'warning' | 'exceeded';
}

export interface GoalContribution {
  id: number;
  goal_id: number;
  amount: number;
  date: string;
  notes?: string;
}

export interface Goal {
  id: number;
  title: string;
  target_amount: number;
  saved_amount: number;
  remaining_amount: number;
  target_date: string;
  description?: string;
  category?: string;
  percent_completed: number;
  months_remaining: number;
  suggested_monthly: number;
  contributions?: GoalContribution[];
}

export interface NotificationItem {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: 'warning' | 'info' | 'success' | 'milestone';
  is_read: number;
  created_at: string;
}

export interface DashboardData {
  month: string;
  totalIncome: number;
  totalExpenses: number;
  availableRemainder: number;
  totalSaved: number;
  categoryBreakdown: { category: string; amount: number; percentage: number }[];
  trendData: { month: string; monthYear: string; income: number; expenses: number }[];
  recentTransactions: Transaction[];
  goalsSummary: Goal[];
  budgetUsage: { category: string; monthly_limit: number; spent: number; percentUsed: number }[];
  totalBudgetLimit: number;
  totalBudgetSpent: number;
  warnings: string[];
}

export interface CategoryComparison {
  category: string;
  currentSpent: number;
  prevSpent: number;
  diff: number;
  pctChange: number;
}

export interface ExpenseForecast {
  currentDay: number;
  daysInMonth: number;
  daysRemaining: number;
  avgDailySpend: number;
  projectedMonthTotal: number;
  method: string;
  disclaimer: string;
  periodsAnalyzed: number;
}

export interface BudgetRecommendation {
  category: string;
  currentSpending: number;
  suggestedLimit: number;
  rationale: string;
}

export interface InsightsData {
  hasEnoughData: boolean;
  currentMonthExpenses: number;
  prevMonthExpenses: number;
  categoryComparisons: CategoryComparison[];
  findings: string[];
  forecast: ExpenseForecast | null;
  recommendations: BudgetRecommendation[];
}

export interface QuizQuestion {
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

export interface Lesson {
  id: string;
  title: string;
  category: string;
  readTime: string;
  summary: string;
  content: string;
  quiz: QuizQuestion[];
  progress?: {
    score: number;
    max_score: number;
    completed_at: string;
  } | null;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'coach';
  text: string;
  timestamp: string;
}
