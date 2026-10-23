import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Target,
  PieChart as PieIcon,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  Plus,
  HelpCircle,
  Calendar,
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { DashboardData, Goal, Transaction } from '../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

interface DashboardPageProps {
  data: DashboardData | null;
  loading: boolean;
  selectedMonth: string;
  onSelectMonth: (month: string) => void;
  onOpenAddTransaction: () => void;
  onOpenContribute: (goal: Goal) => void;
  onNavigateToTab: (tab: any) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  data,
  loading,
  selectedMonth,
  onSelectMonth,
  onOpenAddTransaction,
  onOpenContribute,
  onNavigateToTab,
}) => {
  const [showRemainderTooltip, setShowRemainderTooltip] = useState(false);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-stone-500 font-medium">Crunching student finance numbers...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-stone-200">
        <p className="text-stone-600">Failed to load dashboard data. Please try again.</p>
      </div>
    );
  }

  // Doughnut Chart Data for Categories
  const categoryLabels = data.categoryBreakdown.map((c) => c.category);
  const categoryValues = data.categoryBreakdown.map((c) => c.amount);
  const categoryColors = [
    '#10b981', // emerald
    '#3b82f6', // blue
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#f59e0b', // amber
    '#6366f1', // indigo
    '#ef4444', // red
    '#14b8a6', // teal
    '#64748b', // slate
  ];

  const doughnutData = {
    labels: categoryLabels.length > 0 ? categoryLabels : ['No Expenses Yet'],
    datasets: [
      {
        data: categoryValues.length > 0 ? categoryValues : [1],
        backgroundColor: categoryValues.length > 0 ? categoryColors.slice(0, categoryLabels.length) : ['#e2e8f0'],
        borderWidth: 0,
      },
    ],
  };

  // Bar Chart Data for Income vs Expenses (Last 6 Months)
  const barData = {
    labels: data.trendData.map((t) => t.month),
    datasets: [
      {
        label: 'Income (₹)',
        data: data.trendData.map((t) => t.income),
        backgroundColor: '#10b981',
        borderRadius: 6,
      },
      {
        label: 'Expenses (₹)',
        data: data.trendData.map((t) => t.expenses),
        backgroundColor: '#f43f5e',
        borderRadius: 6,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: { family: 'Plus Jakarta Sans', size: 11 },
          usePointStyle: true,
          boxWidth: 8,
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => `₹${context.raw?.toLocaleString('en-IN')}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { family: 'Plus Jakarta Sans', size: 11 } },
      },
      y: {
        grid: { color: 'rgba(0,0,0,0.05)' },
        ticks: {
          font: { family: 'Plus Jakarta Sans', size: 10 },
          callback: (value: any) => `₹${value}`,
        },
      },
    },
  };

  // Generate available month options (last 6 months)
  const monthOptions = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
    monthOptions.push({ val, label });
  }

  const budgetProgressPercent =
    data.totalBudgetLimit > 0
      ? Math.round((data.totalBudgetSpent / data.totalBudgetLimit) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Month Filter Bar & AI Quick Nudge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200/90 shadow-xs">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-700" />
          <span className="text-xs font-semibold text-stone-700">Financial Period:</span>
          <select
            value={selectedMonth}
            onChange={(e) => onSelectMonth(e.target.value)}
            className="text-xs font-semibold text-stone-900 bg-stone-100 hover:bg-stone-200/80 px-2.5 py-1.5 rounded-lg border border-stone-200 focus:outline-hidden"
          >
            {monthOptions.map((m) => (
              <option key={m.val} value={m.val}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        {/* AI Quick Banner */}
        <button
          onClick={() => onNavigateToTab('coach')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 hover:border-emerald-300 text-xs font-semibold text-emerald-900 transition-all text-left group"
        >
          <Sparkles className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
          <span>Need advice? Ask your AI Finance Coach</span>
          <ArrowRight className="w-3.5 h-3.5 text-emerald-700" />
        </button>
      </div>

      {/* 5 Core Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* 1. Total Income */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-xs hover:border-emerald-200 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-stone-500">Total Income</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-stone-900">
            ₹{data.totalIncome.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-stone-500 mt-1">Allowance & tutoring</p>
        </div>

        {/* 2. Total Expenses */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-xs hover:border-rose-200 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-stone-500">Total Expenses</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-rose-600">
            ₹{data.totalExpenses.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-stone-500 mt-1">Canteen, travel & bills</p>
        </div>

        {/* 3. Available Remainder (with clear disclaimer) */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-xs relative group">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1">
              <span className="text-xs font-medium text-stone-500">Net Remainder</span>
              <button
                type="button"
                onClick={() => setShowRemainderTooltip(!showRemainderTooltip)}
                className="text-stone-400 hover:text-stone-600"
                title="Explanation"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`text-2xl font-bold font-mono ${
              data.availableRemainder >= 0 ? 'text-emerald-700' : 'text-rose-600'
            }`}
          >
            ₹{data.availableRemainder.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-stone-500 mt-1">Income minus recorded expenses</p>

          {/* Explanation popup on demand */}
          {showRemainderTooltip && (
            <div className="absolute left-0 right-0 top-full mt-2 p-3 bg-stone-900 text-stone-100 text-[11px] rounded-xl shadow-xl z-20 border border-stone-700 leading-relaxed">
              <div className="font-semibold text-white mb-0.5">Understanding Remainder:</div>
              This reflects recorded income minus recorded expenses. It may differ from your bank
              balance or physical cash because unrecorded transactions or past balances are not
              included.
            </div>
          )}
        </div>

        {/* 4. Total Saved in Goals */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-xs hover:border-teal-200 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-stone-500">Total Saved</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-700">
            ₹{data.totalSaved.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-stone-500 mt-1">Across all savings goals</p>
        </div>

        {/* 5. Monthly Budget Usage */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-xs hover:border-amber-200 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-stone-500">Budget Used</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <PieIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-stone-900">
            {budgetProgressPercent}%
          </div>
          <div className="w-full h-1.5 bg-stone-100 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                budgetProgressPercent > 100
                  ? 'bg-rose-500'
                  : budgetProgressPercent >= 80
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, budgetProgressPercent)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Warnings & Nudges Banner if any */}
      {data.warnings.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs space-y-1.5 shadow-xs">
          <div className="flex items-center gap-2 font-bold text-amber-950">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Budget Warnings & Student Nudges</span>
          </div>
          <div className="space-y-1 pl-6">
            {data.warnings.map((w, idx) => (
              <p key={idx} className="leading-snug">{w}</p>
            ))}
          </div>
        </div>
      )}

      {/* 2 Main Visual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Income vs Expenses Bar Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-stone-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-stone-900">Income vs Expenses (6-Month Trend)</h3>
              <p className="text-xs text-stone-500">Compare monthly cash flow and savings capacity</p>
            </div>
            <button
              onClick={() => onNavigateToTab('insights')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <span>Detailed Insights</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="h-64 w-full">
            <Bar data={barData} options={barOptions} />
          </div>
        </div>

        {/* Expense Breakdown Doughnut Chart */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-stone-900">Category Breakdown</h3>
                <p className="text-xs text-stone-500">Expenses for {selectedMonth}</p>
              </div>
            </div>

            <div className="h-48 relative flex items-center justify-center my-2">
              <Doughnut
                data={doughnutData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  cutout: '70%',
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      callbacks: {
                        label: (ctx: any) => `₹${ctx.raw?.toLocaleString('en-IN')}`,
                      },
                    },
                  },
                }}
              />
              <div className="absolute text-center pointer-events-none">
                <span className="text-[10px] uppercase font-bold text-stone-400">Total</span>
                <div className="text-sm font-bold font-mono text-stone-900">
                  ₹{data.totalExpenses.toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          </div>

          {/* Top 3 categories list */}
          <div className="space-y-1.5 pt-3 border-t border-stone-100">
            {data.categoryBreakdown.slice(0, 3).map((cat, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: categoryColors[idx % categoryColors.length] }}
                  />
                  <span className="text-stone-700 font-medium">{cat.category}</span>
                </div>
                <div className="font-mono text-stone-900 font-semibold">
                  ₹{cat.amount.toLocaleString('en-IN')} ({cat.percentage}%)
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Recent Transactions & Savings Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-stone-900">Recent Transactions</h3>
                <p className="text-xs text-stone-500">Latest recorded spending and income</p>
              </div>
              <button
                onClick={onOpenAddTransaction}
                className="flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>

            <div className="divide-y divide-stone-100">
              {data.recentTransactions.length === 0 ? (
                <div className="text-center py-8 text-stone-400 text-xs">
                  No transactions recorded yet. Tap "+ Add Transaction" to log your first expense!
                </div>
              ) : (
                data.recentTransactions.slice(0, 5).map((tx) => (
                  <div key={tx.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-stone-900">{tx.title}</div>
                      <div className="text-[11px] text-stone-500 flex items-center gap-2">
                        <span>{tx.category}</span>
                        <span>·</span>
                        <span>{tx.date}</span>
                      </div>
                    </div>
                    <div
                      className={`font-mono font-bold ${
                        tx.type === 'income' ? 'text-emerald-600' : 'text-stone-900'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : '−'}₹{tx.amount.toLocaleString('en-IN')}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-stone-100 mt-2">
            <button
              onClick={() => onNavigateToTab('transactions')}
              className="w-full py-2 rounded-xl text-center text-xs font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors"
            >
              View Full Transaction History →
            </button>
          </div>
        </div>

        {/* Savings Goals Overview */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-stone-900">Savings Goals Progress</h3>
                <p className="text-xs text-stone-500">Laptops, trips, and emergency buffers</p>
              </div>
              <button
                onClick={() => onNavigateToTab('goals')}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
              >
                Manage Goals →
              </button>
            </div>

            <div className="space-y-4">
              {data.goalsSummary.length === 0 ? (
                <div className="text-center py-8 text-stone-400 text-xs">
                  No active goals. Set your first savings target today!
                </div>
              ) : (
                data.goalsSummary.map((goal) => (
                  <div key={goal.id} className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/80">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="font-semibold text-stone-900 text-xs">{goal.title}</div>
                      <button
                        onClick={() => onOpenContribute(goal)}
                        className="px-2 py-0.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold transition-colors flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Deposit</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-stone-500 mb-1.5">
                      <span>Saved: ₹{goal.saved_amount.toLocaleString('en-IN')}</span>
                      <span>Target: ₹{goal.target_amount.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                        style={{ width: `${goal.percent_completed}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-stone-500 mt-1">
                      <span>{goal.percent_completed}% Achieved</span>
                      <span>Target: {goal.target_date}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-stone-100 mt-2">
            <button
              onClick={() => onNavigateToTab('goals')}
              className="w-full py-2 rounded-xl text-center text-xs font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors"
            >
              Explore All Goals & Monthly Plan →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
