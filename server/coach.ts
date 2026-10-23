import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { getDb } from './db';

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

export interface FinancialSummary {
  userName: string;
  college: string;
  totalIncome: number;
  totalExpenses: number;
  availableRemainder: number;
  savingsTotal: number;
  transactionCount: number;
  categoryExpenses: { category: string; amount: number; percentage: number }[];
  budgets: { category: string; limit: number; spent: number; percentUsed: number; status: string }[];
  goals: { title: string; target: number; saved: number; percent: number; targetDate: string }[];
  recentTransactions: { title: string; amount: number; type: string; category: string; date: string }[];
}

export async function getUserFinancialSummary(userId: number): Promise<FinancialSummary> {
  const database = await getDb();

  // User info
  const userStmt = database.prepare("SELECT name, college, monthly_allowance FROM users WHERE id = ?");
  userStmt.bind([userId]);
  let userName = 'Student';
  let college = 'College';
  if (userStmt.step()) {
    const row = userStmt.getAsObject();
    userName = (row.name as string) || 'Student';
    college = (row.college as string) || 'College';
  }
  userStmt.free();

  // Current month
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Income & Expenses this month
  const txStmt = database.prepare("SELECT type, SUM(amount) as total FROM transactions WHERE user_id = ? AND date LIKE ? GROUP BY type");
  txStmt.bind([userId, `${currentMonth}%`]);
  let totalIncome = 0;
  let totalExpenses = 0;
  while (txStmt.step()) {
    const row = txStmt.getAsObject();
    if (row.type === 'income') totalIncome = Number(row.total || 0);
    if (row.type === 'expense') totalExpenses = Number(row.total || 0);
  }
  txStmt.free();

  // Total saved in goals
  const goalStmt = database.prepare("SELECT SUM(saved_amount) as total_saved FROM goals WHERE user_id = ?");
  goalStmt.bind([userId]);
  let savingsTotal = 0;
  if (goalStmt.step()) {
    const row = goalStmt.getAsObject();
    savingsTotal = Number(row.total_saved || 0);
  }
  goalStmt.free();

  // Category breakdown for current month expenses
  const catStmt = database.prepare(`
    SELECT category, SUM(amount) as amount
    FROM transactions
    WHERE user_id = ? AND type = 'expense' AND date LIKE ?
    GROUP BY category
    ORDER BY amount DESC
  `);
  catStmt.bind([userId, `${currentMonth}%`]);
  const categoryExpenses: { category: string; amount: number; percentage: number }[] = [];
  while (catStmt.step()) {
    const row = catStmt.getAsObject();
    const amount = Number(row.amount || 0);
    const percentage = totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0;
    categoryExpenses.push({
      category: String(row.category),
      amount,
      percentage,
    });
  }
  catStmt.free();

  // Budgets
  const bStmt = database.prepare(`
    SELECT b.category, b.monthly_limit,
           COALESCE(SUM(t.amount), 0) as spent
    FROM budgets b
    LEFT JOIN transactions t
      ON t.user_id = b.user_id
      AND t.category = b.category
      AND t.type = 'expense'
      AND t.date LIKE ?
    WHERE b.user_id = ? AND b.month_year = ?
    GROUP BY b.category, b.monthly_limit
  `);
  bStmt.bind([`${currentMonth}%`, userId, currentMonth]);
  const budgets: { category: string; limit: number; spent: number; percentUsed: number; status: string }[] = [];
  while (bStmt.step()) {
    const row = bStmt.getAsObject();
    const limit = Number(row.monthly_limit || 0);
    const spent = Number(row.spent || 0);
    const percentUsed = limit > 0 ? Math.round((spent / limit) * 100) : 0;
    let status = 'normal';
    if (percentUsed >= 100) status = 'exceeded';
    else if (percentUsed >= 80) status = 'warning';
    budgets.push({
      category: String(row.category),
      limit,
      spent,
      percentUsed,
      status,
    });
  }
  bStmt.free();

  // Goals
  const gListStmt = database.prepare("SELECT title, target_amount, saved_amount, target_date FROM goals WHERE user_id = ?");
  gListStmt.bind([userId]);
  const goals: { title: string; target: number; saved: number; percent: number; targetDate: string }[] = [];
  while (gListStmt.step()) {
    const row = gListStmt.getAsObject();
    const target = Number(row.target_amount || 0);
    const saved = Number(row.saved_amount || 0);
    const percent = target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0;
    goals.push({
      title: String(row.title),
      target,
      saved,
      percent,
      targetDate: String(row.target_date),
    });
  }
  gListStmt.free();

  // Count total transactions
  const countStmt = database.prepare("SELECT COUNT(*) as cnt FROM transactions WHERE user_id = ?");
  countStmt.bind([userId]);
  let transactionCount = 0;
  if (countStmt.step()) {
    transactionCount = Number(countStmt.getAsObject().cnt || 0);
  }
  countStmt.free();

  // Recent 8 transactions
  const recentStmt = database.prepare("SELECT title, amount, type, category, date FROM transactions WHERE user_id = ? ORDER BY date DESC, id DESC LIMIT 8");
  recentStmt.bind([userId]);
  const recentTransactions: { title: string; amount: number; type: string; category: string; date: string }[] = [];
  while (recentStmt.step()) {
    const row = recentStmt.getAsObject();
    recentTransactions.push({
      title: String(row.title),
      amount: Number(row.amount || 0),
      type: String(row.type),
      category: String(row.category),
      date: String(row.date),
    });
  }
  recentStmt.free();

  return {
    userName,
    college,
    totalIncome,
    totalExpenses,
    availableRemainder: totalIncome - totalExpenses,
    savingsTotal,
    transactionCount,
    categoryExpenses,
    budgets,
    goals,
    recentTransactions,
  };
}

export async function askFinancialCoach(
  userId: number,
  userMessage: string,
  chatHistory: { role: 'user' | 'model'; parts: { text: string }[] }[] = []
): Promise<{ reply: string; isConfigured: boolean; error?: string }> {
  const client = getAiClient();
  if (!client) {
    return {
      isConfigured: false,
      reply:
        "The Gemini AI integration is currently awaiting an API key. To activate live AI coaching, configure the `GEMINI_API_KEY` secret in your environment. Once added, I will provide personalized budgeting advice, detect spending trends, and help you achieve your savings goals using your real recorded data.",
    };
  }

  try {
    const summary = await getUserFinancialSummary(userId);

    const systemInstruction = `
You are PocketWise AI, an empathetic, smart, practical personal finance coach built specifically for Indian college students.
Your mission is to help students manage pocket money, allowances, scholarships, and side-hustles, cut impulsive spending, stay inside budgets, and build healthy lifelong money habits.

CRITICAL INSTRUCTIONS & BOUNDARIES:
1. Always use Indian Rupees (₹) and Indian numbering where appropriate (e.g., ₹1,000, ₹15,000).
2. Base all calculations and spending advice strictly on the student's actual database summary provided below.
3. If the student has very few or zero transactions (transactionCount is low or 0), EXPLICITLY state: "You haven't recorded enough transactions yet for me to identify deep spending patterns. Start by logging your daily canteen, travel, or recharge expenses!"
4. NEVER invent or hallucinate transactions, banks, or amounts not in the summary.
5. Remind the student that the "Available Remainder" (₹${summary.availableRemainder}) is calculated from recorded income minus expenses, which may differ from their actual physical bank account or cash in wallet.
6. Tone: Encouraging, respectful, non-judgmental, practical (college-relatable: canteen snacks, bus passes, Xerox printouts, textbook swaps, weekend movies).
7. Do not give formal legal, tax, or stock/crypto investment advice. Focus on budgeting, saving, mindful spending, and emergency buffers.

CURRENT STUDENT FINANCIAL PROFILE (REAL DATABASE SUMMARY):
- Student Name: ${summary.userName} (${summary.college})
- Total Transactions Recorded: ${summary.transactionCount}
- This Month Recorded Income: ₹${summary.totalIncome.toLocaleString('en-IN')}
- This Month Recorded Expenses: ₹${summary.totalExpenses.toLocaleString('en-IN')}
- Available Remainder: ₹${summary.availableRemainder.toLocaleString('en-IN')}
- Total Saved in Goals: ₹${summary.savingsTotal.toLocaleString('en-IN')}

Category Expense Breakdown:
${
  summary.categoryExpenses.length > 0
    ? summary.categoryExpenses.map((c) => `- ${c.category}: ₹${c.amount.toLocaleString('en-IN')} (${c.percentage}%)`).join('\n')
    : 'No expenses recorded this month yet.'
}

Budget Limits & Status:
${
  summary.budgets.length > 0
    ? summary.budgets.map((b) => `- ${b.category}: ₹${b.spent.toLocaleString('en-IN')} spent / ₹${b.limit.toLocaleString('en-IN')} limit (${b.percentUsed}%) - Status: ${b.status}`).join('\n')
    : 'No budgets created yet.'
}

Savings Goals:
${
  summary.goals.length > 0
    ? summary.goals.map((g) => `- ${g.title}: ₹${g.saved.toLocaleString('en-IN')} / ₹${g.target.toLocaleString('en-IN')} (${g.percent}%) Target Date: ${g.targetDate}`).join('\n')
    : 'No goals created yet.'
}

Recent Transactions:
${
  summary.recentTransactions.length > 0
    ? summary.recentTransactions.map((t) => `- [${t.date}] ${t.type.toUpperCase()}: ${t.title} - ₹${t.amount} (${t.category})`).join('\n')
    : 'No recent transactions.'
}
    `.trim();

    // Call Gemini API with fast thinkingLevel and generous timeout
    let timeoutId: NodeJS.Timeout | null = null;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error('AI response timed out')), 35000);
    });

    const callApi = async () => {
      try {
        // First try gemini-3.1-flash-lite with MINIMAL thinking for fast, snappy replies
        return await client.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: [
            ...chatHistory.map((h) => ({
              role: h.role,
              parts: h.parts,
            })),
            {
              role: 'user',
              parts: [{ text: userMessage }],
            },
          ],
          config: {
            systemInstruction,
            temperature: 0.7,
            thinkingConfig: {
              thinkingLevel: ThinkingLevel.MINIMAL,
            },
          },
        });
      } catch (liteErr) {
        console.warn('gemini-3.1-flash-lite error, falling back to gemini-3.8-flash:', liteErr instanceof Error ? liteErr.message : liteErr);
        return await client.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: [
            ...chatHistory.map((h) => ({
              role: h.role,
              parts: h.parts,
            })),
            {
              role: 'user',
              parts: [{ text: userMessage }],
            },
          ],
          config: {
            systemInstruction,
            temperature: 0.7,
            thinkingConfig: {
              thinkingLevel: ThinkingLevel.LOW,
            },
          },
        });
      }
    };

    let response;
    try {
      response = await Promise.race([callApi(), timeoutPromise]);
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }

    const reply = response.text || "Here is a quick student tip: Start by tracking your daily canteen and travel expenses!";

    return {
      isConfigured: true,
      reply,
    };
  } catch (err: unknown) {
    console.warn('AI Coach using database-grounded fallback response due to:', err instanceof Error ? err.message : String(err));
    // Provide an explainable, data-grounded response from the student's real DB summary
    const summary = await getUserFinancialSummary(userId);
    let fallbackAdvice = `Based on your recorded student finances:\n`;
    fallbackAdvice += `• **Income vs Spend**: You have recorded ₹${summary.totalIncome.toLocaleString('en-IN')} in income and ₹${summary.totalExpenses.toLocaleString('en-IN')} in expenses (Net remainder: ₹${summary.availableRemainder.toLocaleString('en-IN')}).\n`;
    if (summary.categoryExpenses.length > 0) {
      const top = summary.categoryExpenses[0];
      fallbackAdvice += `• **Top Category**: ${top.category} is your highest spend category at ₹${top.amount.toLocaleString('en-IN')} (${top.percentage}% of total expenses).\n`;
    }
    if (summary.budgets.some((b) => b.percentUsed >= 80)) {
      const warn = summary.budgets.find((b) => b.percentUsed >= 80);
      fallbackAdvice += `• **Budget Alert**: Your ${warn?.category} budget is at ${warn?.percentUsed}% (₹${warn?.spent} of ₹${warn?.limit}).\n`;
    }
    fallbackAdvice += `\n**Coach Action Plan**: Aim to keep ₹200-₹300 in your weekly buffer before treating roommates to non-essential canteen dinners.`;

    return {
      isConfigured: true,
      reply: fallbackAdvice,
    };
  }
}
