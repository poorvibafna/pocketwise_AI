import React, { useState } from 'react';
import { Plus, Trash2, Edit2, AlertTriangle, CheckCircle, PieChart, ShieldAlert } from 'lucide-react';
import { Budget } from '../types';
import { api } from '../services/api';

interface BudgetsPageProps {
  budgets: Budget[];
  currentMonth: string;
  onRefresh: () => void;
  onOpenBudgetModal: (budget?: Budget) => void;
}

export const BudgetsPage: React.FC<BudgetsPageProps> = ({
  budgets,
  currentMonth,
  onRefresh,
  onOpenBudgetModal,
}) => {
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this budget limit?')) return;
    setDeletingId(id);
    try {
      await api.deleteBudget(id);
      onRefresh();
    } catch {
      // ignore
    } finally {
      setDeletingId(null);
    }
  };

  // Separate Total Spending Limit from Category Budgets
  const totalLimitBudget = budgets.find((b) => b.category === 'Total Spending Limit');
  const categoryBudgets = budgets.filter((b) => b.category !== 'Total Spending Limit');

  const totalAllocated = categoryBudgets.reduce((acc, b) => acc + b.monthly_limit, 0);
  const totalSpent = categoryBudgets.reduce((acc, b) => acc + b.spent, 0);
  const overallPercent = totalAllocated > 0 ? Math.round((totalSpent / totalAllocated) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200/90 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-stone-900">Student Budget Planner</h2>
          <p className="text-xs text-stone-500">
            Monthly envelope limits for {currentMonth}. Prevent running out of allowance mid-month.
          </p>
        </div>
        <button
          onClick={() => onOpenBudgetModal()}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Set Budget Limit</span>
        </button>
      </div>

      {/* Total Monthly Spending Limit Card if set */}
      {totalLimitBudget && (
        <div className="bg-gradient-to-br from-emerald-900 to-teal-950 text-white p-5 rounded-2xl shadow-md border border-emerald-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="text-sm font-bold">Overall Monthly Spending Ceiling</h3>
                <p className="text-xs text-emerald-300">All student expenses combined</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onOpenBudgetModal(totalLimitBudget)}
                className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-800"
                title="Edit total limit"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-3">
            <div className="bg-emerald-950/60 p-3 rounded-xl border border-emerald-800/80">
              <div className="text-[11px] text-emerald-300">Cap Limit</div>
              <div className="text-lg font-bold font-mono">
                ₹{totalLimitBudget.monthly_limit.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="bg-emerald-950/60 p-3 rounded-xl border border-emerald-800/80">
              <div className="text-[11px] text-emerald-300">Total Spent</div>
              <div className="text-lg font-bold font-mono text-emerald-200">
                ₹{totalLimitBudget.spent.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="bg-emerald-950/60 p-3 rounded-xl border border-emerald-800/80">
              <div className="text-[11px] text-emerald-300">Remainder</div>
              <div className="text-lg font-bold font-mono text-white">
                ₹{totalLimitBudget.remaining.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          <div className="w-full h-2.5 bg-emerald-950 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                totalLimitBudget.percentUsed > 100
                  ? 'bg-rose-500'
                  : totalLimitBudget.percentUsed >= 80
                  ? 'bg-amber-400'
                  : 'bg-emerald-400'
              }`}
              style={{ width: `${Math.min(100, totalLimitBudget.percentUsed)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-emerald-300 mt-2 font-medium">
            <span>{totalLimitBudget.percentUsed}% Used</span>
            <span>
              {totalLimitBudget.percentUsed >= 100
                ? '⚠️ Budget Exceeded!'
                : totalLimitBudget.percentUsed >= 80
                ? '🔔 Approaching Limit'
                : '✅ Within Safe Limits'}
            </span>
          </div>
        </div>
      )}

      {/* Category Budgets Grid */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-stone-900">Category Budgets</h3>
            <p className="text-xs text-stone-500">
              {categoryBudgets.length} category caps active for this month
            </p>
          </div>
          <div className="text-xs font-semibold text-stone-600">
            Total Allocated: <span className="font-mono text-stone-900">₹{totalAllocated.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {categoryBudgets.length === 0 ? (
          <div className="py-12 text-center text-stone-400">
            <PieChart className="w-10 h-10 mx-auto mb-2 opacity-40 stroke-1" />
            <p className="text-xs font-semibold text-stone-700">No category budgets created</p>
            <p className="text-[11px] text-stone-400 mt-0.5">
              Set realistic caps for Food, Travel, or Entertainment to prevent overspending.
            </p>
            <button
              onClick={() => onOpenBudgetModal()}
              className="mt-3 px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold"
            >
              Add First Budget
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryBudgets.map((b) => {
              const isWarning = b.percentUsed >= 80 && b.percentUsed < 100;
              const isExceeded = b.percentUsed >= 100;

              return (
                <div
                  key={b.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isExceeded
                      ? 'bg-rose-50/40 border-rose-200'
                      : isWarning
                      ? 'bg-amber-50/30 border-amber-200'
                      : 'bg-stone-50/60 border-stone-200/80 hover:border-emerald-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-stone-900">{b.category}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onOpenBudgetModal(b)}
                        className="p-1 text-stone-400 hover:text-stone-700"
                        title="Edit limit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(b.id)}
                        disabled={deletingId === b.id}
                        className="p-1 text-stone-400 hover:text-rose-600"
                        title="Delete budget"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-baseline justify-between text-xs mb-1.5">
                    <div>
                      <span className="text-stone-500">Spent: </span>
                      <span className="font-mono font-bold text-stone-900">
                        ₹{b.spent.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div>
                      <span className="text-stone-500">Limit: </span>
                      <span className="font-mono font-semibold text-stone-700">
                        ₹{b.monthly_limit.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden my-2">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isExceeded ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, b.percentUsed)}%` }}
                    />
                  </div>

                  {/* Status Footer */}
                  <div className="flex items-center justify-between text-[11px] font-medium pt-1">
                    <span
                      className={`flex items-center gap-1 ${
                        isExceeded
                          ? 'text-rose-600 font-semibold'
                          : isWarning
                          ? 'text-amber-700 font-semibold'
                          : 'text-stone-600'
                      }`}
                    >
                      {isExceeded ? (
                        <>
                          <AlertTriangle className="w-3 h-3 text-rose-500" />
                          <span>Over by ₹{(b.spent - b.monthly_limit).toLocaleString('en-IN')}</span>
                        </>
                      ) : (
                        <span>₹{b.remaining.toLocaleString('en-IN')} remaining</span>
                      )}
                    </span>
                    <span className="font-mono text-stone-700 font-bold">{b.percentUsed}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Student Budgeting Guidelines Card */}
      <div className="bg-emerald-50/70 border border-emerald-200/80 p-5 rounded-2xl text-xs text-emerald-950 space-y-2">
        <h4 className="font-bold flex items-center gap-1.5 text-emerald-900">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>PocketWise Student Budgeting Rules</span>
        </h4>
        <p className="text-emerald-800 leading-relaxed">
          • <strong>80% Warning Threshold:</strong> When your category hits 80%, you receive an in-app nudge so you can moderate non-essential treats before running out.
        </p>
        <p className="text-emerald-800 leading-relaxed">
          • <strong>Envelope Isolation:</strong> Spending on Food doesn’t subtract from your Travel pass budget. Each envelope stays isolated to prevent one category from draining your essentials.
        </p>
      </div>
    </div>
  );
};
