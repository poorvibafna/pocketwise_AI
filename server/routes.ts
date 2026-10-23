import { Router, Request, Response } from 'express';
import { getDb, saveDb, resetToDemo, clearAllUserData } from './db';
import { askFinancialCoach, getUserFinancialSummary } from './coach';

export const apiRouter = Router();

// Helper to extract active user ID (defaults to 1 - Aarav Sharma)
function getActiveUserId(req: Request): number {
  const headerVal = req.headers['x-user-id'];
  if (headerVal && typeof headerVal === 'string') {
    const parsed = parseInt(headerVal, 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  return 1;
}

// -------------------------------------------------------------
// USER ROUTES
// -------------------------------------------------------------
apiRouter.get('/user', async (req: Request, res: Response) => {
  try {
    const userId = getActiveUserId(req);
    const db = await getDb();
    
    // Get active user
    const stmt = db.prepare("SELECT id, name, email, college, monthly_allowance, created_at FROM users WHERE id = ?");
    stmt.bind([userId]);
    let user = null;
    if (stmt.step()) {
      user = stmt.getAsObject();
    }
    stmt.free();

    // Get all users for switching
    const allUsersStmt = db.prepare("SELECT id, name, email, college FROM users");
    const allUsers = [];
    while (allUsersStmt.step()) {
      allUsers.push(allUsersStmt.getAsObject());
    }
    allUsersStmt.free();

    res.json({ user, allUsers });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch user';
    res.status(500).json({ error: msg });
  }
});

apiRouter.post('/user', async (req: Request, res: Response) => {
  try {
    const { name, email, college, monthly_allowance } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required.' });
    }

    const db = await getDb();
    db.run(
      "INSERT INTO users (name, email, college, monthly_allowance) VALUES (?, ?, ?, ?)",
      [name.trim(), email.trim().toLowerCase(), college || 'College', Number(monthly_allowance) || 5000]
    );
    saveDb();

    // Get inserted user id
    const resStmt = db.exec("SELECT last_insert_rowid() as id");
    const newId = resStmt[0]?.values[0]?.[0];

    res.status(201).json({ success: true, userId: newId });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to create user profile';
    res.status(500).json({ error: msg });
  }
});

// -------------------------------------------------------------
// CATEGORIES & SMART SUGGESTION
// -------------------------------------------------------------
apiRouter.get('/categories', async (_req: Request, res: Response) => {
  try {
    const db = await getDb();
    const stmt = db.prepare("SELECT * FROM categories ORDER BY type, name");
    const categories = [];
    while (stmt.step()) {
      categories.push(stmt.getAsObject());
    }
    stmt.free();
    res.json({ categories });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch categories';
    res.status(500).json({ error: msg });
  }
});

// Smart Category Suggestion endpoint
apiRouter.post('/categories/suggest', (req: Request, res: Response) => {
  const { title } = req.body;
  if (!title || typeof title !== 'string') {
    return res.json({ suggestion: null, explanation: 'No description provided' });
  }

  const query = title.toLowerCase().trim();

  const rules: { keywords: string[]; category: string; explanation: string; type: 'expense' | 'income' }[] = [
    // Income
    { keywords: ['allowance', 'pocket money', 'parents', 'mom', 'dad', 'home'], category: 'Allowance', explanation: 'Matched allowance/pocket money keywords', type: 'income' },
    { keywords: ['tutoring', 'tutor', 'stipend', 'teaching', 'part-time', 'job', 'shift', 'salary'], category: 'Part-time Income', explanation: 'Matched part-time student work/tutoring keywords', type: 'income' },
    { keywords: ['scholarship', 'fellowship', 'grant', 'bursary'], category: 'Scholarship', explanation: 'Matched scholarship keyword', type: 'income' },
    { keywords: ['freelance', 'web design', 'coding', 'project gig', 'fiverr', 'upwork'], category: 'Freelance', explanation: 'Matched freelance work keywords', type: 'income' },

    // Expenses
    { keywords: ['canteen', 'mess', 'food', 'lunch', 'dinner', 'breakfast', 'swiggy', 'zomato', 'biryani', 'pizza', 'burger', 'chai', 'tea', 'coffee', 'cafe', 'mcdonalds', 'kfc', 'maggi', 'snack', 'dosa', 'samosa'], category: 'Food', explanation: 'Matched college food, mess, or dining keywords', type: 'expense' },
    { keywords: ['bus', 'metro', 'train', 'auto', 'uber', 'ola', 'rapido', 'fuel', 'petrol', 'fare', 'ticket', 'flight', 'pass'], category: 'Travel', explanation: 'Matched transport, transit pass, or commute keywords', type: 'expense' },
    { keywords: ['book', 'textbook', 'xerox', 'photocopy', 'print', 'stationery', 'notebook', 'pen', 'tuition', 'exam fee', 'course', 'udemy', 'coursera', 'lab manual', 'calculator'], category: 'Education', explanation: 'Matched study materials, academic fees, or bookstore keywords', type: 'expense' },
    { keywords: ['movie', 'cinema', 'netflix', 'spotify', 'prime', 'game', 'gaming', 'steam', 'concert', 'outing', 'party', 'bowling'], category: 'Entertainment', explanation: 'Matched leisure, media subscription, or entertainment keywords', type: 'expense' },
    { keywords: ['recharge', 'wifi', 'broadband', 'electricity', 'jio', 'airtel', 'vi', 'bill', 'hostel rent', 'laundry'], category: 'Bills', explanation: 'Matched utility, phone plan, or hostel utility keywords', type: 'expense' },
    { keywords: ['shirt', 't-shirt', 'pants', 'jeans', 'dress', 'shoes', 'sneakers', 'amazon', 'flipkart', 'myntra', 'zudio', 'shopping', 'mall'], category: 'Shopping', explanation: 'Matched apparel, footwear, or e-commerce keywords', type: 'expense' },
    { keywords: ['medicine', 'doctor', 'pharmacy', 'hospital', 'clinic', 'tablet', 'cough', 'fever', 'bandage', 'dentist'], category: 'Health', explanation: 'Matched medical or wellness keywords', type: 'expense' },
    { keywords: ['haircut', 'salon', 'barber', 'shampoo', 'skincare', 'perfume', 'deodorant', 'soap'], category: 'Personal Care', explanation: 'Matched personal grooming keywords', type: 'expense' }
  ];

  for (const rule of rules) {
    if (rule.keywords.some(k => query.includes(k))) {
      return res.json({
        suggestion: rule.category,
        type: rule.type,
        explanation: rule.explanation,
        confidence: 'high'
      });
    }
  }

  return res.json({
    suggestion: null,
    explanation: 'No specific category rule matched. Please select from the dropdown.',
    confidence: 'none'
  });
});

// -------------------------------------------------------------
// TRANSACTIONS CRUD
// -------------------------------------------------------------
apiRouter.get('/transactions', async (req: Request, res: Response) => {
  try {
    const userId = getActiveUserId(req);
    const { category, type, startDate, endDate, search, limit, offset } = req.query;
    const db = await getDb();

    let sql = "SELECT * FROM transactions WHERE user_id = ?";
    const params: (string | number)[] = [userId];

    if (category && typeof category === 'string' && category !== 'all') {
      sql += " AND category = ?";
      params.push(category);
    }
    if (type && typeof type === 'string' && type !== 'all') {
      sql += " AND type = ?";
      params.push(type);
    }
    if (startDate && typeof startDate === 'string') {
      sql += " AND date >= ?";
      params.push(startDate);
    }
    if (endDate && typeof endDate === 'string') {
      sql += " AND date <= ?";
      params.push(endDate);
    }
    if (search && typeof search === 'string' && search.trim() !== '') {
      sql += " AND (title LIKE ? OR notes LIKE ?)";
      params.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }

    sql += " ORDER BY date DESC, id DESC";

    if (limit) {
      sql += " LIMIT ?";
      params.push(Number(limit));
      if (offset) {
        sql += " OFFSET ?";
        params.push(Number(offset));
      }
    }

    const stmt = db.prepare(sql);
    stmt.bind(params);
    const transactions = [];
    while (stmt.step()) {
      transactions.push(stmt.getAsObject());
    }
    stmt.free();

    res.json({ transactions });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch transactions';
    res.status(500).json({ error: msg });
  }
});

apiRouter.post('/transactions', async (req: Request, res: Response) => {
  try {
    const userId = getActiveUserId(req);
    const { title, amount, type, category, date, notes } = req.body;

    // Strict Validations
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ error: 'Transaction title is required.' });
    }
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number greater than ₹0.' });
    }
    if (type !== 'income' && type !== 'expense') {
      return res.status(400).json({ error: "Type must be either 'income' or 'expense'." });
    }
    if (!category || typeof category !== 'string' || category.trim() === '') {
      return res.status(400).json({ error: 'Category is required.' });
    }
    if (!date || isNaN(Date.parse(date))) {
      return res.status(400).json({ error: 'A valid date is required (YYYY-MM-DD).' });
    }

    const db = await getDb();
    db.run(
      `INSERT INTO transactions (user_id, title, amount, type, category, date, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, title.trim(), numAmount, type, category.trim(), date, notes ? notes.trim() : '']
    );

    // Check budget alert if expense
    if (type === 'expense') {
      const txMonth = date.substring(0, 7); // YYYY-MM
      const bStmt = db.prepare(`
        SELECT monthly_limit FROM budgets WHERE user_id = ? AND category = ? AND month_year = ?
      `);
      bStmt.bind([userId, category.trim(), txMonth]);
      if (bStmt.step()) {
        const limit = Number(bStmt.getAsObject().monthly_limit || 0);
        bStmt.free();

        // Calculate total spent in category this month
        const spentStmt = db.prepare(`
          SELECT SUM(amount) as spent FROM transactions
          WHERE user_id = ? AND category = ? AND type = 'expense' AND date LIKE ?
        `);
        spentStmt.bind([userId, category.trim(), `${txMonth}%`]);
        let spent = 0;
        if (spentStmt.step()) {
          spent = Number(spentStmt.getAsObject().spent || 0);
        }
        spentStmt.free();

        const pct = limit > 0 ? (spent / limit) * 100 : 0;
        if (pct >= 100) {
          db.run(
            `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)`,
            [
              userId,
              `Budget Exceeded: ${category}`,
              `You have exceeded your ₹${limit} monthly budget for ${category}. Total spent is ₹${spent}.`,
              'warning'
            ]
          );
        } else if (pct >= 80) {
          db.run(
            `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)`,
            [
              userId,
              `Budget Alert: ${category} at ${Math.round(pct)}%`,
              `You've used ${Math.round(pct)}% of your ${category} budget (₹${spent} of ₹${limit}). Keep an eye on upcoming expenses!`,
              'warning'
            ]
          );
        }
      } else {
        bStmt.free();
      }
    }

    saveDb();
    res.status(201).json({ success: true, message: 'Transaction recorded successfully.' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to record transaction';
    res.status(500).json({ error: msg });
  }
});

apiRouter.put('/transactions/:id', async (req: Request, res: Response) => {
  try {
    const userId = getActiveUserId(req);
    const id = parseInt(req.params.id, 10);
    const { title, amount, type, category, date, notes } = req.body;

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ error: 'Transaction title is required.' });
    }
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number greater than ₹0.' });
    }
    if (type !== 'income' && type !== 'expense') {
      return res.status(400).json({ error: "Type must be either 'income' or 'expense'." });
    }
    if (!category) {
      return res.status(400).json({ error: 'Category is required.' });
    }

    const db = await getDb();
    // Verify ownership
    const checkStmt = db.prepare("SELECT id FROM transactions WHERE id = ? AND user_id = ?");
    checkStmt.bind([id, userId]);
    if (!checkStmt.step()) {
      checkStmt.free();
      return res.status(404).json({ error: 'Transaction not found or unauthorized.' });
    }
    checkStmt.free();

    db.run(
      `UPDATE transactions
       SET title = ?, amount = ?, type = ?, category = ?, date = ?, notes = ?
       WHERE id = ? AND user_id = ?`,
      [title.trim(), numAmount, type, category.trim(), date, notes ? notes.trim() : '', id, userId]
    );

    saveDb();
    res.json({ success: true, message: 'Transaction updated successfully.' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update transaction';
    res.status(500).json({ error: msg });
  }
});

apiRouter.delete('/transactions/:id', async (req: Request, res: Response) => {
  try {
    const userId = getActiveUserId(req);
    const id = parseInt(req.params.id, 10);
    const db = await getDb();

    // Verify ownership
    const checkStmt = db.prepare("SELECT id FROM transactions WHERE id = ? AND user_id = ?");
    checkStmt.bind([id, userId]);
    if (!checkStmt.step()) {
      checkStmt.free();
      return res.status(404).json({ error: 'Transaction not found or unauthorized.' });
    }
    checkStmt.free();

    db.run("DELETE FROM transactions WHERE id = ? AND user_id = ?", [id, userId]);
    saveDb();
    res.json({ success: true, message: 'Transaction deleted.' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to delete transaction';
    res.status(500).json({ error: msg });
  }
});

// -------------------------------------------------------------
// BUDGET MANAGEMENT
// -------------------------------------------------------------
apiRouter.get('/budgets', async (req: Request, res: Response) => {
  try {
    const userId = getActiveUserId(req);
    const month = (req.query.month as string) || new Date().toISOString().substring(0, 7);
    const db = await getDb();

    const stmt = db.prepare(`
      SELECT b.id, b.category, b.monthly_limit, b.month_year,
             COALESCE(SUM(t.amount), 0) as spent
      FROM budgets b
      LEFT JOIN transactions t
        ON t.user_id = b.user_id
        AND (b.category = 'Total Spending Limit' OR t.category = b.category)
        AND t.type = 'expense'
        AND t.date LIKE ?
      WHERE b.user_id = ? AND b.month_year = ?
      GROUP BY b.id, b.category, b.monthly_limit, b.month_year
      ORDER BY b.category
    `);
    stmt.bind([`${month}%`, userId, month]);

    const budgets = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      const limit = Number(row.monthly_limit || 0);
      const spent = Number(row.spent || 0);
      const remaining = Math.max(0, limit - spent);
      const percentUsed = limit > 0 ? Math.round((spent / limit) * 100) : 0;
      let status = 'normal';
      if (percentUsed >= 100) status = 'exceeded';
      else if (percentUsed >= 80) status = 'warning';

      budgets.push({
        id: row.id,
        category: row.category,
        monthly_limit: limit,
        month_year: row.month_year,
        spent,
        remaining,
        percentUsed,
        status,
      });
    }
    stmt.free();

    res.json({ budgets, month });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch budgets';
    res.status(500).json({ error: msg });
  }
});

apiRouter.post('/budgets', async (req: Request, res: Response) => {
  try {
    const userId = getActiveUserId(req);
    const { category, monthly_limit, month_year } = req.body;

    if (!category || typeof category !== 'string') {
      return res.status(400).json({ error: 'Category is required.' });
    }
    const limit = Number(monthly_limit);
    if (isNaN(limit) || limit <= 0) {
      return res.status(400).json({ error: 'Budget limit must be greater than ₹0.' });
    }
    const month = month_year || new Date().toISOString().substring(0, 7);

    const db = await getDb();
    db.run(
      `INSERT INTO budgets (user_id, category, monthly_limit, month_year)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(user_id, category, month_year)
       DO UPDATE SET monthly_limit = excluded.monthly_limit`,
      [userId, category.trim(), limit, month]
    );

    saveDb();
    res.status(201).json({ success: true, message: `Budget set for ${category}: ₹${limit}` });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to save budget';
    res.status(500).json({ error: msg });
  }
});

apiRouter.delete('/budgets/:id', async (req: Request, res: Response) => {
  try {
    const userId = getActiveUserId(req);
    const id = parseInt(req.params.id, 10);
    const db = await getDb();

    db.run("DELETE FROM budgets WHERE id = ? AND user_id = ?", [id, userId]);
    saveDb();
    res.json({ success: true, message: 'Budget removed.' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to delete budget';
    res.status(500).json({ error: msg });
  }
});

// -------------------------------------------------------------
// SAVINGS GOALS
// -------------------------------------------------------------
apiRouter.get('/goals', async (req: Request, res: Response) => {
  try {
    const userId = getActiveUserId(req);
    const db = await getDb();

    const stmt = db.prepare(`
      SELECT id, title, target_amount, saved_amount, target_date, description, category, created_at
      FROM goals
      WHERE user_id = ?
      ORDER BY target_date ASC
    `);
    stmt.bind([userId]);

    const now = new Date();
    const goals = [];

    while (stmt.step()) {
      const row = stmt.getAsObject();
      const target = Number(row.target_amount || 0);
      const saved = Number(row.saved_amount || 0);
      const remaining = Math.max(0, target - saved);
      const percent = target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0;

      // Calculate suggested monthly contribution
      const targetDate = new Date(row.target_date as string);
      let monthsRemaining = Math.max(1, (targetDate.getFullYear() - now.getFullYear()) * 12 + (targetDate.getMonth() - now.getMonth()));
      if (isNaN(monthsRemaining) || monthsRemaining <= 0) monthsRemaining = 1;

      const suggestedMonthly = remaining > 0 ? Math.ceil(remaining / monthsRemaining) : 0;

      // Get contributions
      const cStmt = db.prepare("SELECT id, amount, date, notes FROM goal_contributions WHERE goal_id = ? ORDER BY date DESC");
      cStmt.bind([row.id as number]);
      const contributions = [];
      while (cStmt.step()) {
        contributions.push(cStmt.getAsObject());
      }
      cStmt.free();

      goals.push({
        id: row.id,
        title: row.title,
        target_amount: target,
        saved_amount: saved,
        remaining_amount: remaining,
        target_date: row.target_date,
        description: row.description,
        category: row.category,
        percent_completed: percent,
        months_remaining: monthsRemaining,
        suggested_monthly: suggestedMonthly,
        contributions,
      });
    }
    stmt.free();

    res.json({ goals });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch goals';
    res.status(500).json({ error: msg });
  }
});

apiRouter.post('/goals', async (req: Request, res: Response) => {
  try {
    const userId = getActiveUserId(req);
    const { title, target_amount, target_date, description, category } = req.body;

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ error: 'Goal title is required.' });
    }
    const target = Number(target_amount);
    if (isNaN(target) || target <= 0) {
      return res.status(400).json({ error: 'Target amount must be greater than ₹0.' });
    }
    if (!target_date || isNaN(Date.parse(target_date))) {
      return res.status(400).json({ error: 'A valid target date is required.' });
    }

    const db = await getDb();
    db.run(
      `INSERT INTO goals (user_id, title, target_amount, saved_amount, target_date, description, category)
       VALUES (?, ?, ?, 0, ?, ?, ?)`,
      [userId, title.trim(), target, target_date, description ? description.trim() : '', category || 'General']
    );

    saveDb();
    res.status(201).json({ success: true, message: 'Savings goal created.' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to create goal';
    res.status(500).json({ error: msg });
  }
});

apiRouter.put('/goals/:id', async (req: Request, res: Response) => {
  try {
    const userId = getActiveUserId(req);
    const id = parseInt(req.params.id, 10);
    const { title, target_amount, target_date, description, category } = req.body;

    const target = Number(target_amount);
    if (isNaN(target) || target <= 0) {
      return res.status(400).json({ error: 'Target amount must be greater than ₹0.' });
    }

    const db = await getDb();
    db.run(
      `UPDATE goals
       SET title = ?, target_amount = ?, target_date = ?, description = ?, category = ?
       WHERE id = ? AND user_id = ?`,
      [title.trim(), target, target_date, description ? description.trim() : '', category || 'General', id, userId]
    );

    saveDb();
    res.json({ success: true, message: 'Goal updated.' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update goal';
    res.status(500).json({ error: msg });
  }
});

apiRouter.delete('/goals/:id', async (req: Request, res: Response) => {
  try {
    const userId = getActiveUserId(req);
    const id = parseInt(req.params.id, 10);
    const db = await getDb();

    db.run("DELETE FROM goal_contributions WHERE goal_id = ? AND user_id = ?", [id, userId]);
    db.run("DELETE FROM goals WHERE id = ? AND user_id = ?", [id, userId]);
    saveDb();
    res.json({ success: true, message: 'Goal deleted.' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to delete goal';
    res.status(500).json({ error: msg });
  }
});

apiRouter.post('/goals/:id/contribute', async (req: Request, res: Response) => {
  try {
    const userId = getActiveUserId(req);
    const id = parseInt(req.params.id, 10);
    const { amount, date, notes } = req.body;

    const contribution = Number(amount);
    if (isNaN(contribution) || contribution <= 0) {
      return res.status(400).json({ error: 'Contribution amount must be greater than ₹0.' });
    }

    const contributionDate = date || new Date().toISOString().substring(0, 10);
    const db = await getDb();

    // Verify goal exists and belongs to user
    const gStmt = db.prepare("SELECT title, target_amount, saved_amount FROM goals WHERE id = ? AND user_id = ?");
    gStmt.bind([id, userId]);
    if (!gStmt.step()) {
      gStmt.free();
      return res.status(404).json({ error: 'Goal not found.' });
    }
    const goalRow = gStmt.getAsObject();
    const oldSaved = Number(goalRow.saved_amount || 0);
    const target = Number(goalRow.target_amount || 0);
    const title = String(goalRow.title);
    gStmt.free();

    const newSaved = oldSaved + contribution;

    // Record contribution in separate table (separate accounting rule as required)
    db.run(
      `INSERT INTO goal_contributions (goal_id, user_id, amount, date, notes) VALUES (?, ?, ?, ?, ?)`,
      [id, userId, contribution, contributionDate, notes ? notes.trim() : 'Goal deposit']
    );

    // Update goal progress
    db.run(
      `UPDATE goals SET saved_amount = ? WHERE id = ? AND user_id = ?`,
      [newSaved, id, userId]
    );

    // Check if goal completed or reached milestone
    if (newSaved >= target && oldSaved < target) {
      db.run(
        `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)`,
        [
          userId,
          `Goal Completed! 🎉`,
          `Fantastic work! You have successfully reached your savings goal: "${title}" (₹${target.toLocaleString('en-IN')})!`,
          'milestone'
        ]
      );
    } else if (newSaved >= target * 0.5 && oldSaved < target * 0.5) {
      db.run(
        `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)`,
        [
          userId,
          `Halfway There! 🌟`,
          `You've reached 50% of your goal "${title}". Keep up the strong saving habit!`,
          'milestone'
        ]
      );
    }

    saveDb();
    res.json({ success: true, message: `Added ₹${contribution.toLocaleString('en-IN')} towards "${title}".` });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to add contribution';
    res.status(500).json({ error: msg });
  }
});

// -------------------------------------------------------------
// DASHBOARD OVERVIEW & ANALYTICS
// -------------------------------------------------------------
apiRouter.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const userId = getActiveUserId(req);
    const month = (req.query.month as string) || new Date().toISOString().substring(0, 7);
    const db = await getDb();

    // 1. Total income for period
    const incStmt = db.prepare("SELECT SUM(amount) as total FROM transactions WHERE user_id = ? AND type = 'income' AND date LIKE ?");
    incStmt.bind([userId, `${month}%`]);
    let totalIncome = 0;
    if (incStmt.step()) totalIncome = Number(incStmt.getAsObject().total || 0);
    incStmt.free();

    // 2. Total expenses for period
    const expStmt = db.prepare("SELECT SUM(amount) as total FROM transactions WHERE user_id = ? AND type = 'expense' AND date LIKE ?");
    expStmt.bind([userId, `${month}%`]);
    let totalExpenses = 0;
    if (expStmt.step()) totalExpenses = Number(expStmt.getAsObject().total || 0);
    expStmt.free();

    // 3. Available remainder
    const availableRemainder = totalIncome - totalExpenses;

    // 4. Total saved toward goals
    const goalStmt = db.prepare("SELECT SUM(saved_amount) as total FROM goals WHERE user_id = ?");
    goalStmt.bind([userId]);
    let totalSaved = 0;
    if (goalStmt.step()) totalSaved = Number(goalStmt.getAsObject().total || 0);
    goalStmt.free();

    // 5. Category breakdown
    const catStmt = db.prepare(`
      SELECT category, SUM(amount) as amount
      FROM transactions
      WHERE user_id = ? AND type = 'expense' AND date LIKE ?
      GROUP BY category
      ORDER BY amount DESC
    `);
    catStmt.bind([userId, `${month}%`]);
    const categoryBreakdown = [];
    while (catStmt.step()) {
      const row = catStmt.getAsObject();
      const amount = Number(row.amount || 0);
      const percentage = totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0;
      categoryBreakdown.push({
        category: row.category,
        amount,
        percentage,
      });
    }
    catStmt.free();

    // 6. Income vs Expense Trend (Last 6 months)
    const trendData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const mLabel = d.toLocaleString('default', { month: 'short' });

      const tIncStmt = db.prepare("SELECT SUM(amount) as val FROM transactions WHERE user_id = ? AND type = 'income' AND date LIKE ?");
      tIncStmt.bind([userId, `${mStr}%`]);
      let inc = 0;
      if (tIncStmt.step()) inc = Number(tIncStmt.getAsObject().val || 0);
      tIncStmt.free();

      const tExpStmt = db.prepare("SELECT SUM(amount) as val FROM transactions WHERE user_id = ? AND type = 'expense' AND date LIKE ?");
      tExpStmt.bind([userId, `${mStr}%`]);
      let exp = 0;
      if (tExpStmt.step()) exp = Number(tExpStmt.getAsObject().val || 0);
      tExpStmt.free();

      trendData.push({
        month: mLabel,
        monthYear: mStr,
        income: inc,
        expenses: exp,
      });
    }

    // 7. Recent transactions (8 items)
    const recStmt = db.prepare("SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC, id DESC LIMIT 8");
    recStmt.bind([userId]);
    const recentTransactions = [];
    while (recStmt.step()) {
      recentTransactions.push(recStmt.getAsObject());
    }
    recStmt.free();

    // 8. Savings goals summary (top 3)
    const goalsSummaryStmt = db.prepare("SELECT id, title, target_amount, saved_amount, target_date FROM goals WHERE user_id = ? ORDER BY target_date ASC LIMIT 3");
    goalsSummaryStmt.bind([userId]);
    const goalsSummary = [];
    while (goalsSummaryStmt.step()) {
      const row = goalsSummaryStmt.getAsObject();
      const target = Number(row.target_amount || 0);
      const saved = Number(row.saved_amount || 0);
      const percent = target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0;
      goalsSummary.push({
        id: row.id,
        title: row.title,
        target_amount: target,
        saved_amount: saved,
        percent_completed: percent,
        target_date: row.target_date,
      });
    }
    goalsSummaryStmt.free();

    // 9. Monthly Budget Usage
    const bStmt = db.prepare(`
      SELECT b.category, b.monthly_limit, COALESCE(SUM(t.amount), 0) as spent
      FROM budgets b
      LEFT JOIN transactions t
        ON t.user_id = b.user_id
        AND (b.category = 'Total Spending Limit' OR t.category = b.category)
        AND t.type = 'expense'
        AND t.date LIKE ?
      WHERE b.user_id = ? AND b.month_year = ?
      GROUP BY b.category, b.monthly_limit
    `);
    bStmt.bind([`${month}%`, userId, month]);
    const budgetUsage = [];
    let totalBudgetLimit = 0;
    let totalBudgetSpent = 0;
    while (bStmt.step()) {
      const row = bStmt.getAsObject();
      const limit = Number(row.monthly_limit || 0);
      const spent = Number(row.spent || 0);
      const percentUsed = limit > 0 ? Math.round((spent / limit) * 100) : 0;
      if (row.category !== 'Total Spending Limit') {
        totalBudgetLimit += limit;
        totalBudgetSpent += spent;
      }
      budgetUsage.push({
        category: row.category,
        monthly_limit: limit,
        spent,
        percentUsed,
      });
    }
    bStmt.free();

    // 10. Budget Warnings & Actionable Insights
    const warnings: string[] = [];
    for (const b of budgetUsage) {
      if (b.percentUsed >= 100) {
        warnings.push(`⚠️ You exceeded your ${b.category} budget (₹${b.spent} / ₹${b.monthly_limit}). Consider slowing down non-essential spending.`);
      } else if (b.percentUsed >= 80) {
        warnings.push(`🔔 Heads up: ${b.category} is at ${b.percentUsed}% (₹${b.monthly_limit - b.spent} remaining).`);
      }
    }
    if (totalIncome > 0 && totalExpenses > totalIncome) {
      warnings.push(`🚨 You have spent ₹${(totalExpenses - totalIncome).toLocaleString('en-IN')} more than your recorded income this month.`);
    }

    res.json({
      month,
      totalIncome,
      totalExpenses,
      availableRemainder,
      totalSaved,
      categoryBreakdown,
      trendData,
      recentTransactions,
      goalsSummary,
      budgetUsage,
      totalBudgetLimit,
      totalBudgetSpent,
      warnings,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch dashboard data';
    res.status(500).json({ error: msg });
  }
});

// -------------------------------------------------------------
// INSIGHTS & EXPENSE FORECASTING
// -------------------------------------------------------------
apiRouter.get('/insights', async (req: Request, res: Response) => {
  try {
    const userId = getActiveUserId(req);
    const db = await getDb();

    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

    // Total expenses current month
    const curExpStmt = db.prepare("SELECT SUM(amount) as total FROM transactions WHERE user_id = ? AND type = 'expense' AND date LIKE ?");
    curExpStmt.bind([userId, `${currentMonthStr}%`]);
    let curExpenses = 0;
    if (curExpStmt.step()) curExpenses = Number(curExpStmt.getAsObject().total || 0);
    curExpStmt.free();

    // Total expenses previous month
    const prevExpStmt = db.prepare("SELECT SUM(amount) as total FROM transactions WHERE user_id = ? AND type = 'expense' AND date LIKE ?");
    prevExpStmt.bind([userId, `${prevMonthStr}%`]);
    let prevExpenses = 0;
    if (prevExpStmt.step()) prevExpenses = Number(prevExpStmt.getAsObject().total || 0);
    prevExpStmt.free();

    // Check count of historical transactions
    const countStmt = db.prepare("SELECT COUNT(*) as count FROM transactions WHERE user_id = ?");
    countStmt.bind([userId]);
    let txCount = 0;
    if (countStmt.step()) txCount = Number(countStmt.getAsObject().count || 0);
    countStmt.free();

    const hasEnoughData = txCount >= 5;

    // Category comparison current vs prev
    const catCompStmt = db.prepare(`
      SELECT
        c.category,
        COALESCE(curr.spent, 0) as current_spent,
        COALESCE(prev.spent, 0) as prev_spent
      FROM (
        SELECT DISTINCT category FROM transactions WHERE user_id = ? AND type = 'expense'
      ) c
      LEFT JOIN (
        SELECT category, SUM(amount) as spent
        FROM transactions
        WHERE user_id = ? AND type = 'expense' AND date LIKE ?
        GROUP BY category
      ) curr ON curr.category = c.category
      LEFT JOIN (
        SELECT category, SUM(amount) as spent
        FROM transactions
        WHERE user_id = ? AND type = 'expense' AND date LIKE ?
        GROUP BY category
      ) prev ON prev.category = c.category
      ORDER BY curr.spent DESC
    `);
    catCompStmt.bind([userId, userId, `${currentMonthStr}%`, userId, `${prevMonthStr}%`]);

    const categoryComparisons = [];
    while (catCompStmt.step()) {
      const row = catCompStmt.getAsObject();
      const cur = Number(row.current_spent || 0);
      const prv = Number(row.prev_spent || 0);
      const diff = cur - prv;
      const pctChange = prv > 0 ? Math.round((diff / prv) * 100) : cur > 0 ? 100 : 0;
      categoryComparisons.push({
        category: row.category,
        currentSpent: cur,
        prevSpent: prv,
        diff,
        pctChange,
      });
    }
    catCompStmt.free();

    // Findings (explainable rules)
    const findings: string[] = [];
    if (hasEnoughData) {
      if (prevExpenses > 0) {
        const diff = curExpenses - prevExpenses;
        const diffAbs = Math.abs(diff);
        if (diff > 0) {
          findings.push(`Your overall spending this month (₹${curExpenses.toLocaleString('en-IN')}) is ₹${diffAbs.toLocaleString('en-IN')} higher (+${Math.round((diff / prevExpenses) * 100)}%) than last month.`);
        } else if (diff < 0) {
          findings.push(`Great discipline! You have spent ₹${diffAbs.toLocaleString('en-IN')} less (-${Math.round((diffAbs / prevExpenses) * 100)}%) this month compared to the same time last month.`);
        }
      }

      // Top category observation
      if (categoryComparisons.length > 0 && curExpenses > 0) {
        const top = categoryComparisons[0];
        const topPct = Math.round((top.currentSpent / curExpenses) * 100);
        findings.push(`${top.category} is your highest spending category this month, accounting for ${topPct}% (₹${top.currentSpent.toLocaleString('en-IN')}) of total expenses.`);
      }

      // Biggest spike
      const spiked = categoryComparisons.find(c => c.diff > 200 && c.prevSpent > 0);
      if (spiked) {
        findings.push(`You spent ₹${spiked.diff.toLocaleString('en-IN')} more on ${spiked.category} this month compared to last month (+${spiked.pctChange}%).`);
      }
    }

    // Expense Forecasting (explainable average daily spend projection)
    let forecast = null;
    if (hasEnoughData && curExpenses > 0) {
      const currentDay = Math.max(1, now.getDate());
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const avgDailySpend = Math.round(curExpenses / currentDay);
      const projectedMonthTotal = Math.round(avgDailySpend * daysInMonth);
      const daysRemaining = daysInMonth - currentDay;

      forecast = {
        currentDay,
        daysInMonth,
        daysRemaining,
        avgDailySpend,
        projectedMonthTotal,
        method: "Calculated from current month's daily expenditure rate extrapolated across all days in the month.",
        disclaimer: "Forecast is an estimate based on your recorded daily average. Actual end-of-month spending may fluctuate based on irregular expenses or exam schedules.",
        periodsAnalyzed: 2,
      };
    }

    // Suggested Budget Recommendations (users can accept or edit)
    const recommendations = [];
    for (const comp of categoryComparisons) {
      if (comp.currentSpent > 0) {
        const suggested = Math.round((comp.currentSpent * 1.1) / 100) * 100; // 10% buffer
        recommendations.push({
          category: comp.category,
          currentSpending: comp.currentSpent,
          suggestedLimit: suggested,
          rationale: `Based on your recent ₹${comp.currentSpent} spend, a ₹${suggested} limit gives a comfortable 10% buffer.`,
        });
      }
    }

    res.json({
      hasEnoughData,
      currentMonthExpenses: curExpenses,
      prevMonthExpenses: prevExpenses,
      categoryComparisons,
      findings,
      forecast,
      recommendations,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to generate insights';
    res.status(500).json({ error: msg });
  }
});

// -------------------------------------------------------------
// NOTIFICATIONS
// -------------------------------------------------------------
apiRouter.get('/notifications', async (req: Request, res: Response) => {
  try {
    const userId = getActiveUserId(req);
    const db = await getDb();

    const stmt = db.prepare("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20");
    stmt.bind([userId]);
    const notifications = [];
    while (stmt.step()) {
      notifications.push(stmt.getAsObject());
    }
    stmt.free();

    res.json({ notifications });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch notifications';
    res.status(500).json({ error: msg });
  }
});

apiRouter.post('/notifications/:id/read', async (req: Request, res: Response) => {
  try {
    const userId = getActiveUserId(req);
    const id = parseInt(req.params.id, 10);
    const db = await getDb();

    db.run("UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?", [id, userId]);
    saveDb();
    res.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update notification';
    res.status(500).json({ error: msg });
  }
});

apiRouter.post('/notifications/clear', async (req: Request, res: Response) => {
  try {
    const userId = getActiveUserId(req);
    const db = await getDb();

    db.run("DELETE FROM notifications WHERE user_id = ?", [userId]);
    saveDb();
    res.json({ success: true, message: 'All notifications cleared.' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to clear notifications';
    res.status(500).json({ error: msg });
  }
});

// -------------------------------------------------------------
// AI COACH CHATBOT
// -------------------------------------------------------------
apiRouter.post('/coach/chat', async (req: Request, res: Response) => {
  try {
    const userId = getActiveUserId(req);
    const { message, history } = req.body;

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({ error: 'Message cannot be empty.' });
    }

    const result = await askFinancialCoach(userId, message.trim(), history || []);
    res.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'AI coach request failed';
    res.status(500).json({ error: msg });
  }
});

// -------------------------------------------------------------
// FINANCIAL LEARNING & QUIZZES
// -------------------------------------------------------------
const LESSONS = [
  {
    id: 'lesson-1',
    title: 'The College Budgeting Blueprint: 50/30/20 & Envelopes',
    category: 'Budgeting Basics',
    readTime: '4 min',
    summary: 'How to allocate monthly pocket money or part-time earnings so you never run out before the month ends.',
    content: `
### Why Traditional Budgeting Fails Students
Most college students receive pocket money in one lump sum at the start of the month. By the 20th, funds run dangerously dry.

The **College 50/30/20 Rule** adapts the classic formula for campus life:
- **50% Needs**: Essential meals (mess/canteen), hostel rent, monthly bus/metro pass, phone recharge, lab printouts.
- **30% Wants**: Weekend outings, Netflix or Spotify, treats with friends, new clothes.
- **20% Savings**: Emergency buffer for broken phones, travel tickets home, or your next tech purchase.

### The Digital Envelope System
Assign strict caps to variable categories (like Canteen & Cafe). Once that envelope is empty, pause non-essential purchases until next month.
    `,
    quiz: [
      {
        question: 'Under the student 50/30/20 rule, which category does a monthly college bus pass fall under?',
        options: ['Wants (30%)', 'Needs (50%)', 'Savings (20%)', 'Optional Luxury'],
        answerIndex: 1,
        explanation: 'A daily bus or metro pass is essential transportation required to attend classes, making it a "Need".'
      },
      {
        question: 'What is the primary danger of spending without a budget in college?',
        options: ['You gain too much interest', 'Running out of money before month-end and relying on emergency borrowing', 'Over-saving for emergencies', 'Paying higher taxes'],
        answerIndex: 1,
        explanation: 'Students without spending limits often exhaust allowances in the first 2-3 weeks, leaving zero funds for final exams or emergencies.'
      },
      {
        question: 'If you receive an ₹8,000 allowance, how much should ideally go into your savings buffer under 50/30/20?',
        options: ['₹800', '₹1,600', '₹2,500', '₹4,000'],
        answerIndex: 1,
        explanation: '20% of ₹8,000 is ₹1,600.'
      }
    ]
  },
  {
    id: 'lesson-2',
    title: 'Needs vs. Wants on Campus (Overcoming FOMO)',
    category: 'Mindful Spending',
    readTime: '3 min',
    summary: 'Distinguishing genuine requirements from peer-pressure spending and impulse food deliveries.',
    content: `
### The Campus FOMO Trap
"Fear Of Missing Out" often drives unnecessary dining out, group subscriptions, and spontaneous apparel shopping.

### The 48-Hour Rule
Before buying something that isn't food or medicine:
1. Add it to a wishlist instead of purchasing instantly.
2. Wait 48 hours.
3. If the desire fades, you just saved that money without feeling deprived.

### Practical Needs vs Wants Test
- **Need**: You cannot complete your coursework or maintain health/safety without it.
- **Want**: You desire convenience, luxury, social status, or instant dopamine.
    `,
    quiz: [
      {
        question: 'Which of the following is considered a "Want" for a college student?',
        options: ['Semester prescribed textbook', 'Prescription cough medicine', 'Ordering midnight pizza after canteen dinner', 'Bus pass renewal'],
        answerIndex: 2,
        explanation: 'Midnight pizza after already having dinner is an impulse craving / convenience want, not a health or survival need.'
      },
      {
        question: 'What is the purpose of the 48-Hour Rule?',
        options: ['To delay paying rent', 'To allow impulse emotional urges to cool off before buying non-essentials', 'To wait for bank holidays', 'To guarantee delivery discounts'],
        answerIndex: 1,
        explanation: 'Waiting 48 hours breaks impulsive buying habits and helps you evaluate whether you truly need the item.'
      }
    ]
  },
  {
    id: 'lesson-3',
    title: 'Building a ₹5,000 Emergency Pocket Cushion',
    category: 'Emergency Savings',
    readTime: '4 min',
    summary: 'Why every student needs an emergency safety net and how to build one ₹300 at a time.',
    content: `
### What is a Student Emergency Fund?
An emergency fund is money set aside exclusively for unplanned, unavoidable events:
- Cracked smartphone screen before online submissions
- Urgent medical bill or dental checkup
- Sudden emergency bus/train ticket home
- Laptop charger replacement during project submission week

### How to Build it on a Student Budget
You don't need a massive salary to build a buffer:
- Save ₹300–₹500 per month from your allowance.
- Direct 50% of side-income (tutoring, freelance gigs) into this fund.
- Keep it in a separate savings sub-account or liquid digital locker so you aren't tempted to spend it on snacks.
    `,
    quiz: [
      {
        question: 'Which of the following is a legitimate use of an emergency fund?',
        options: ['Buying new sneakers on a flash discount sale', 'Fixing a shattered phone screen needed for classes', 'Funding a weekend road trip with friends', 'Pre-ordering a video game'],
        answerIndex: 1,
        explanation: 'An emergency fund is strictly for unexpected, unavoidable emergencies that impact your education, health, or safety.'
      },
      {
        question: 'If you save ₹400 every month, how many months will it take to reach a ₹4,000 student safety cushion?',
        options: ['6 months', '8 months', '10 months', '12 months'],
        answerIndex: 2,
        explanation: '₹4,000 ÷ ₹400/month = 10 months.'
      }
    ]
  },
  {
    id: 'lesson-4',
    title: 'Smart Side-Hustles: Freelance & Tutoring Income',
    category: 'Earning & Growth',
    readTime: '5 min',
    summary: 'Monetizing academic skills, campus services, and freelance development ethically and effectively.',
    content: `
### High-Leverage Student Income Streams
1. **Academic Peer Tutoring**: Teach 1st-year calculus, physics, or programming languages.
2. **Technical Freelancing**: Build websites, debug scripts, or design posters for student clubs and local businesses.
3. **Campus Content & Notes**: Publish clean, verified lecture summaries or exam prep cheat sheets.

### The Golden Rule of Student Income
Never let a side-hustle jeopardize your GPA or sleep. Set a strict cap of 6–10 hours per week during active semesters.
    `,
    quiz: [
      {
        question: 'What is the recommended balance between side-income and college studies?',
        options: ['Drop all classes to freelance full-time', 'Keep side-work capped (around 6-10 hours/week) to preserve academic health', 'Work 40 hours a week on gigs', 'Never earn any money during college'],
        answerIndex: 1,
        explanation: 'Capping side-hustles to reasonable weekly hours ensures your academic performance and health remain protected.'
      }
    ]
  }
];

apiRouter.get('/learning', async (req: Request, res: Response) => {
  try {
    const userId = getActiveUserId(req);
    const db = await getDb();

    const stmt = db.prepare("SELECT lesson_id, score, max_score, completed_at FROM quiz_progress WHERE user_id = ?");
    stmt.bind([userId]);
    const progressMap: Record<string, { score: number; max_score: number; completed_at: string }> = {};
    while (stmt.step()) {
      const row = stmt.getAsObject();
      progressMap[String(row.lesson_id)] = {
        score: Number(row.score),
        max_score: Number(row.max_score),
        completed_at: String(row.completed_at),
      };
    }
    stmt.free();

    const lessonsWithStatus = LESSONS.map(lesson => ({
      ...lesson,
      progress: progressMap[lesson.id] || null,
    }));

    res.json({ lessons: lessonsWithStatus });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch lessons';
    res.status(500).json({ error: msg });
  }
});

apiRouter.post('/learning/quiz', async (req: Request, res: Response) => {
  try {
    const userId = getActiveUserId(req);
    const { lesson_id, answers } = req.body;

    const lesson = LESSONS.find(l => l.id === lesson_id);
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found.' });
    }

    if (!Array.isArray(answers)) {
      return res.status(400).json({ error: 'Answers must be provided as an array.' });
    }

    let score = 0;
    const feedback = lesson.quiz.map((q, idx) => {
      const userAnswer = answers[idx];
      const isCorrect = userAnswer === q.answerIndex;
      if (isCorrect) score += 1;
      return {
        questionIndex: idx,
        isCorrect,
        correctIndex: q.answerIndex,
        userAnswer,
        explanation: q.explanation,
      };
    });

    const max_score = lesson.quiz.length;
    const db = await getDb();
    db.run(
      `INSERT INTO quiz_progress (user_id, lesson_id, score, max_score)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(user_id, lesson_id)
       DO UPDATE SET score = excluded.score, max_score = excluded.max_score, completed_at = datetime('now')`,
      [userId, lesson_id, score, max_score]
    );

    // Give notification if perfect score
    if (score === max_score) {
      db.run(
        `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)`,
        [
          userId,
          `Quiz Mastered! 🎓`,
          `Awesome job! You scored ${score}/${max_score} on "${lesson.title}".`,
          'success'
        ]
      );
    }

    saveDb();
    res.json({ success: true, score, max_score, feedback });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to submit quiz';
    res.status(500).json({ error: msg });
  }
});

// -------------------------------------------------------------
// DATA MANAGEMENT & EXPORT
// -------------------------------------------------------------
apiRouter.post('/data/reset', async (_req: Request, res: Response) => {
  try {
    await resetToDemo();
    res.json({ success: true, message: 'Database reset to demo state with realistic student transactions.' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to reset database';
    res.status(500).json({ error: msg });
  }
});

apiRouter.post('/data/clear', async (req: Request, res: Response) => {
  try {
    const userId = getActiveUserId(req);
    await clearAllUserData(userId);
    res.json({ success: true, message: 'All user transactions, budgets, and goals cleared.' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to clear data';
    res.status(500).json({ error: msg });
  }
});

apiRouter.get('/export/csv', async (req: Request, res: Response) => {
  try {
    const userId = getActiveUserId(req);
    const db = await getDb();

    const stmt = db.prepare("SELECT date, title, type, category, amount, notes FROM transactions WHERE user_id = ? ORDER BY date DESC");
    stmt.bind([userId]);

    let csv = "Date,Title,Type,Category,Amount (INR),Notes\n";
    while (stmt.step()) {
      const row = stmt.getAsObject();
      const esc = (val: unknown) => `"${String(val ?? '').replace(/"/g, '""')}"`;
      csv += `${esc(row.date)},${esc(row.title)},${esc(row.type)},${esc(row.category)},${row.amount},${esc(row.notes)}\n`;
    }
    stmt.free();

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="pocketwise_transactions.csv"');
    res.send(csv);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to export CSV';
    res.status(500).json({ error: msg });
  }
});
