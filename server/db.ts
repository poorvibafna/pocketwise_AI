import fs from 'fs';
import path from 'path';
import initSqlJs, { Database, SqlJsStatic } from 'sql.js';

let SQL: SqlJsStatic | null = null;
let db: Database | null = null;

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'pocketwise.sqlite');

export interface User {
  id: number;
  name: string;
  email: string;
  college: string;
  monthly_allowance: number;
  created_at: string;
}

export interface Transaction {
  id: number;
  user_id: number;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  notes: string;
  created_at: string;
}

export interface Budget {
  id: number;
  user_id: number;
  category: string;
  monthly_limit: number;
  month_year: string; // YYYY-MM
  created_at: string;
}

export interface Goal {
  id: number;
  user_id: number;
  title: string;
  target_amount: number;
  saved_amount: number;
  target_date: string;
  description: string;
  category: string;
  created_at: string;
}

export interface GoalContribution {
  id: number;
  goal_id: number;
  user_id: number;
  amount: number;
  date: string;
  notes: string;
  created_at: string;
}

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: 'warning' | 'info' | 'success' | 'milestone';
  is_read: number;
  created_at: string;
}

export interface QuizProgress {
  id: number;
  user_id: number;
  lesson_id: string;
  score: number;
  max_score: number;
  completed_at: string;
}

// Persist the database to disk
export function saveDb(): void {
  if (!db) return;
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE, buffer);
  } catch (err) {
    console.error('Failed to save SQLite database to disk:', err);
  }
}

// Initialize SQLite Database
export async function getDb(): Promise<Database> {
  if (db) return db;

  if (!SQL) {
    SQL = await initSqlJs();
  }

  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const fileBuffer = fs.readFileSync(DB_FILE);
      db = new SQL.Database(fileBuffer);
    } catch (err) {
      console.warn('Could not read existing SQLite file, creating fresh database:', err);
      db = new SQL.Database();
    }
  } else {
    db = new SQL.Database();
  }

  initSchema(db);
  seedDemoDataIfEmpty(db);
  saveDb();

  return db;
}

function initSchema(database: Database) {
  database.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      college TEXT,
      monthly_allowance REAL DEFAULT 8000,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL, -- 'income' or 'expense'
      icon TEXT,
      color TEXT
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL, -- 'income' or 'expense'
      category TEXT NOT NULL,
      date TEXT NOT NULL,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      category TEXT NOT NULL,
      monthly_limit REAL NOT NULL,
      month_year TEXT NOT NULL, -- 'YYYY-MM'
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(user_id) REFERENCES users(id),
      UNIQUE(user_id, category, month_year)
    );

    CREATE TABLE IF NOT EXISTS goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      target_amount REAL NOT NULL,
      saved_amount REAL DEFAULT 0,
      target_date TEXT NOT NULL,
      description TEXT,
      category TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS goal_contributions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      goal_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(goal_id) REFERENCES goals(id) ON DELETE CASCADE,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL, -- 'warning', 'info', 'success', 'milestone'
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS quiz_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      lesson_id TEXT NOT NULL,
      score INTEGER NOT NULL,
      max_score INTEGER NOT NULL,
      completed_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(user_id) REFERENCES users(id),
      UNIQUE(user_id, lesson_id)
    );
  `);
}

export function seedDemoDataIfEmpty(database: Database) {
  // Check if users exist
  const res = database.exec("SELECT COUNT(*) as count FROM users");
  const count = res[0]?.values[0]?.[0] as number || 0;
  if (count > 0) return;

  // Insert default demo user (Aarav Sharma - 2nd year college student)
  database.run(`
    INSERT INTO users (id, name, email, college, monthly_allowance)
    VALUES (1, 'Aarav Sharma', 'aarav.student@college.edu', 'National Institute of Technology', 8500);
  `);

  // Default Categories
  const categories = [
    ['Food', 'expense', 'Utensils', '#10b981'],
    ['Travel', 'expense', 'Bus', '#3b82f6'],
    ['Education', 'expense', 'BookOpen', '#8b5cf6'],
    ['Entertainment', 'expense', 'Film', '#ec4899'],
    ['Shopping', 'expense', 'ShoppingBag', '#f59e0b'],
    ['Bills', 'expense', 'Receipt', '#6366f1'],
    ['Health', 'expense', 'HeartPulse', '#ef4444'],
    ['Personal Care', 'expense', 'Sparkles', '#14b8a6'],
    ['Other', 'expense', 'HelpCircle', '#64748b'],
    ['Allowance', 'income', 'Wallet', '#10b981'],
    ['Part-time Income', 'income', 'Briefcase', '#3b82f6'],
    ['Scholarship', 'income', 'GraduationCap', '#8b5cf6'],
    ['Freelance', 'income', 'Laptop', '#06b6d4'],
    ['Other Income', 'income', 'PlusCircle', '#10b981']
  ];

  for (const cat of categories) {
    database.run(
      `INSERT OR IGNORE INTO categories (name, type, icon, color) VALUES (?, ?, ?, ?)`,
      cat
    );
  }

  // Realistic Dates: current month & previous month
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthNum = now.getMonth() + 1;
  const currentMonthStr = `${currentYear}-${String(currentMonthNum).padStart(2, '0')}`;
  
  const prevMonthDate = new Date(currentYear, currentMonthNum - 2, 1);
  const prevMonthStr = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;

  // Seed sample transactions for Aarav
  const sampleTransactions = [
    // Current Month Income
    [1, 'Monthly Allowance from Parents', 8500, 'income', 'Allowance', `${currentMonthStr}-01`, 'Monthly hostel & food allowance'],
    [1, 'Physics Doubt Clearing Tutoring', 3000, 'income', 'Part-time Income', `${currentMonthStr}-05`, 'Tutored 1st year students'],
    [1, 'Freelance Web Design Task', 2500, 'income', 'Freelance', `${currentMonthStr}-12`, 'Small college club landing page'],

    // Current Month Expenses
    [1, 'Hostel Mess & Canteen Meals', 2200, 'expense', 'Food', `${currentMonthStr}-02`, 'Mess card recharge & evening snacks'],
    [1, 'College Monthly Bus Pass', 750, 'expense', 'Travel', `${currentMonthStr}-03`, 'BMTC student monthly bus pass'],
    [1, 'Data Structures & Algorithms Book', 650, 'expense', 'Education', `${currentMonthStr}-04`, 'Reference textbook second-hand'],
    [1, 'Mobile 5G Data Recharge', 399, 'expense', 'Bills', `${currentMonthStr}-06`, 'Monthly unlimited student plan'],
    [1, 'Weekend Movie with Roommates', 350, 'expense', 'Entertainment', `${currentMonthStr}-08`, 'Student discount ticket'],
    [1, 'Cafe Coffee & Group Study', 280, 'expense', 'Food', `${currentMonthStr}-10`, 'Project discussion with team'],
    [1, 'Notebooks, Pens & Printouts', 220, 'expense', 'Education', `${currentMonthStr}-11`, 'Lab manual printing and binding'],
    [1, 'Casual T-shirt & Socks', 899, 'expense', 'Shopping', `${currentMonthStr}-14`, 'End of season sale discount'],
    [1, 'Campus Auto Rickshaw Rides', 180, 'expense', 'Travel', `${currentMonthStr}-15`, 'Split with classmate to station'],
    [1, 'Pharmacy Cold Medicine & Vitamin C', 240, 'expense', 'Health', `${currentMonthStr}-16`, 'Prescription cough syrup and paracetamol'],
    [1, 'Swiggy Biryani Dinner with Friends', 420, 'expense', 'Food', `${currentMonthStr}-18`, 'Celebrated mid-term test completion'],
    [1, 'Haircut & Grooming at Campus Salon', 200, 'expense', 'Personal Care', `${currentMonthStr}-20`, 'Regular grooming'],

    // Previous Month Transactions (for spending comparisons & forecasting)
    [1, 'Monthly Allowance from Parents', 8000, 'income', 'Allowance', `${prevMonthStr}-01`, 'Allowance'],
    [1, 'Tutoring 1st Years', 2000, 'income', 'Part-time Income', `${prevMonthStr}-07`, 'Tutoring'],
    [1, 'Hostel Mess & Canteen', 2000, 'expense', 'Food', `${prevMonthStr}-04`, 'Mess'],
    [1, 'Bus Pass', 750, 'expense', 'Travel', `${prevMonthStr}-05`, 'Travel'],
    [1, 'Engineering Chemistry Xerox', 450, 'expense', 'Education', `${prevMonthStr}-10`, 'Notes'],
    [1, 'Mobile Recharge', 399, 'expense', 'Bills', `${prevMonthStr}-12`, 'Plan'],
    [1, 'Food Delivery Snacks', 680, 'expense', 'Food', `${prevMonthStr}-18`, 'Snacks'],
    [1, 'Sneakers purchase', 1400, 'expense', 'Shopping', `${prevMonthStr}-22`, 'Shoes'],
    [1, 'Cinema Ticket', 300, 'expense', 'Entertainment', `${prevMonthStr}-26`, 'Movie']
  ];

  for (const tx of sampleTransactions) {
    database.run(
      `INSERT INTO transactions (user_id, title, amount, type, category, date, notes) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      tx
    );
  }

  // Seed Budgets for current month
  const sampleBudgets = [
    [1, 'Food', 3200, currentMonthStr],
    [1, 'Travel', 1200, currentMonthStr],
    [1, 'Education', 1500, currentMonthStr],
    [1, 'Entertainment', 800, currentMonthStr],
    [1, 'Shopping', 1500, currentMonthStr],
    [1, 'Bills', 600, currentMonthStr],
    [1, 'Total Spending Limit', 9000, currentMonthStr]
  ];

  for (const b of sampleBudgets) {
    database.run(
      `INSERT OR REPLACE INTO budgets (user_id, category, monthly_limit, month_year) VALUES (?, ?, ?, ?)`,
      b
    );
  }

  // Seed Savings Goals
  // e.g. Laptop replacement: target ₹30,000, saved ₹6,000; Hackathon Trip: target ₹5,000, saved ₹2,500
  const futureYear = currentYear + 1;
  const sampleGoals = [
    [1, 'Coding Laptop Upgrade', 30000, 6000, `${futureYear}-06-30`, 'Replacing old laptop for AI & development', 'Tech'],
    [1, 'Inter-College Hackathon Trip', 5000, 2500, `${currentYear}-12-15`, 'Travel and stay in Bangalore for national hackathon', 'Travel'],
    [1, 'Emergency Pocket Cushion', 4000, 3000, `${currentYear}-11-30`, 'Safety cushion for unplanned medical or phone repairs', 'Savings']
  ];

  for (const g of sampleGoals) {
    database.run(
      `INSERT INTO goals (user_id, title, target_amount, saved_amount, target_date, description, category) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      g
    );
  }

  // Seed contributions
  database.run(`
    INSERT INTO goal_contributions (goal_id, user_id, amount, date, notes) VALUES
    (1, 1, 3000, '${prevMonthStr}-15', 'Saved from freelance project'),
    (1, 1, 3000, '${currentMonthStr}-12', 'Saved from tutoring bonus'),
    (2, 1, 1500, '${prevMonthStr}-20', 'Initial deposit'),
    (2, 1, 1000, '${currentMonthStr}-10', 'Monthly allocation'),
    (3, 1, 2000, '${prevMonthStr}-02', 'Initial buffer'),
    (3, 1, 1000, '${currentMonthStr}-05', 'Added from allowance remainder');
  `);

  // Seed Notifications
  database.run(`
    INSERT INTO notifications (user_id, title, message, type, is_read) VALUES
    (1, 'Food Budget at 81%', 'You have spent ₹2,900 of your ₹3,200 Food budget. You have ₹300 remaining for the rest of the month.', 'warning', 0),
    (1, 'Goal Milestone Reached! 🚀', 'Congratulations! You reached 50% of your Inter-College Hackathon Trip goal (₹2,500 saved).', 'milestone', 0),
    (1, 'Healthy Savings Habit', 'You have saved over 25% of your recorded income this month. Keep it up!', 'success', 0);
  `);

  // Seed Quiz progress for lesson 1
  database.run(`
    INSERT INTO quiz_progress (user_id, lesson_id, score, max_score) VALUES
    (1, 'lesson-1', 3, 3);
  `);
}

// Reset database back to clean demo state
export async function resetToDemo(): Promise<void> {
  const database = await getDb();
  database.run(`
    DELETE FROM quiz_progress;
    DELETE FROM notifications;
    DELETE FROM goal_contributions;
    DELETE FROM goals;
    DELETE FROM budgets;
    DELETE FROM transactions;
    DELETE FROM categories;
    DELETE FROM users;
  `);
  seedDemoDataIfEmpty(database);
  saveDb();
}

// Clear all data (for user starting from clean scratch)
export async function clearAllUserData(userId: number): Promise<void> {
  const database = await getDb();
  database.run(`DELETE FROM quiz_progress WHERE user_id = ?`, [userId]);
  database.run(`DELETE FROM notifications WHERE user_id = ?`, [userId]);
  database.run(`DELETE FROM goal_contributions WHERE user_id = ?`, [userId]);
  database.run(`DELETE FROM goals WHERE user_id = ?`, [userId]);
  database.run(`DELETE FROM budgets WHERE user_id = ?`, [userId]);
  database.run(`DELETE FROM transactions WHERE user_id = ?`, [userId]);
  saveDb();
}
