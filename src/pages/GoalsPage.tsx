import React, { useState } from 'react';
import {
  Plus,
  Target,
  Calendar,
  Sparkles,
  TrendingUp,
  Edit2,
  Trash2,
  PiggyBank,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { Goal } from '../types';
import { api } from '../services/api';

interface GoalsPageProps {
  goals: Goal[];
  onRefresh: () => void;
  onOpenCreateGoal: () => void;
  onOpenEditGoal: (goal: Goal) => void;
  onOpenContribute: (goal: Goal) => void;
}

export const GoalsPage: React.FC<GoalsPageProps> = ({
  goals,
  onRefresh,
  onOpenCreateGoal,
  onOpenEditGoal,
  onOpenContribute,
}) => {
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this savings goal?')) return;
    setDeletingId(id);
    try {
      await api.deleteGoal(id);
      onRefresh();
    } catch {
      // ignore
    } finally {
      setDeletingId(null);
    }
  };

  const totalTarget = goals.reduce((acc, g) => acc + g.target_amount, 0);
  const totalSaved = goals.reduce((acc, g) => acc + g.saved_amount, 0);
  const overallPercent = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200/90 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-stone-900">Student Savings Goals</h2>
          <p className="text-xs text-stone-500">
            Set ambitious college targets, calculate required monthly savings, and track your progress.
          </p>
        </div>
        <button
          onClick={onOpenCreateGoal}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Savings Goal</span>
        </button>
      </div>

      {/* Aggregate Overview Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-xs">
          <div className="text-xs text-stone-500 font-medium">Total Goals Target</div>
          <div className="text-2xl font-bold font-mono text-stone-900 mt-1">
            ₹{totalTarget.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-stone-400 mt-0.5">{goals.length} target milestones</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-xs">
          <div className="text-xs text-stone-500 font-medium">Total Accumulated Savings</div>
          <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">
            ₹{totalSaved.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-stone-400 mt-0.5">Stored in separate savings accounts/lockers</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-xs">
          <div className="text-xs text-stone-500 font-medium">Overall Completion</div>
          <div className="text-2xl font-bold font-mono text-teal-800 mt-1">
            {overallPercent}%
          </div>
          <div className="w-full h-1.5 bg-stone-100 rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${overallPercent}%` }} />
          </div>
        </div>
      </div>

      {/* Goals Cards List */}
      <div className="space-y-4">
        {goals.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-stone-200 text-stone-400">
            <Target className="w-12 h-12 mx-auto mb-3 opacity-30 stroke-1" />
            <h3 className="text-sm font-semibold text-stone-700">No savings goals yet</h3>
            <p className="text-xs text-stone-400 mt-1 max-w-sm mx-auto">
              Whether you are saving for a new coding laptop, semester books, or an emergency buffer, create your first goal to get a tailored monthly plan!
            </p>
            <button
              onClick={onOpenCreateGoal}
              className="mt-4 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold shadow-xs"
            >
              Create Your First Goal
            </button>
          </div>
        ) : (
          goals.map((goal) => {
            const isCompleted = goal.saved_amount >= goal.target_amount;

            return (
              <div
                key={goal.id}
                className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200/90 shadow-xs hover:border-emerald-200 transition-all space-y-4"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                      <Target className="w-5 h-5 text-emerald-700" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-stone-900">{goal.title}</h3>
                        {goal.category && (
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-stone-100 text-stone-600">
                            {goal.category}
                          </span>
                        )}
                        {isCompleted && (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            <span>Goal Reached!</span>
                          </span>
                        )}
                      </div>
                      {goal.description && (
                        <p className="text-xs text-stone-500 mt-0.5">{goal.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      onClick={() => onOpenContribute(goal)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
                    >
                      <PiggyBank className="w-3.5 h-3.5" />
                      <span>Deposit</span>
                    </button>
                    <button
                      onClick={() => onOpenEditGoal(goal)}
                      className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100"
                      title="Edit Goal"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(goal.id)}
                      disabled={deletingId === goal.id}
                      className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                      title="Delete Goal"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Numbers row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-stone-50 rounded-xl">
                    <span className="text-stone-500 text-[11px]">Saved So Far</span>
                    <div className="text-lg font-bold font-mono text-emerald-700">
                      ₹{goal.saved_amount.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div className="p-3 bg-stone-50 rounded-xl">
                    <span className="text-stone-500 text-[11px]">Target Amount</span>
                    <div className="text-lg font-bold font-mono text-stone-900">
                      ₹{goal.target_amount.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div className="p-3 bg-stone-50 rounded-xl">
                    <span className="text-stone-500 text-[11px]">Remaining to Save</span>
                    <div className="text-lg font-bold font-mono text-stone-700">
                      ₹{goal.remaining_amount.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-100">
                    <span className="text-emerald-800 text-[11px] font-medium">Suggested Monthly</span>
                    <div className="text-lg font-bold font-mono text-emerald-900">
                      {isCompleted ? 'Done 🎉' : `₹${goal.suggested_monthly.toLocaleString('en-IN')}/mo`}
                    </div>
                    <span className="text-[10px] text-emerald-700/80">
                      Over {goal.months_remaining} month{goal.months_remaining > 1 ? 's' : ''} left
                    </span>
                  </div>
                </div>

                {/* Progress bar with milestones */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-stone-700">
                      Progress: {goal.percent_completed}%
                    </span>
                    <span className="text-stone-500 flex items-center gap-1 text-[11px]">
                      <Calendar className="w-3 h-3" />
                      <span>Target Date: {goal.target_date}</span>
                    </span>
                  </div>
                  <div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden p-0.5 border border-stone-200">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                      style={{ width: `${goal.percent_completed}%` }}
                    />
                  </div>
                </div>

                {/* Recent deposits list if any */}
                {goal.contributions && goal.contributions.length > 0 && (
                  <div className="pt-2">
                    <div className="text-[11px] font-semibold text-stone-500 mb-1.5">
                      Recent Deposits ({goal.contributions.length}):
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {goal.contributions.slice(0, 4).map((c) => (
                        <span
                          key={c.id}
                          className="px-2.5 py-1 rounded-lg bg-stone-100 border border-stone-200/80 text-[11px] text-stone-700 flex items-center gap-1"
                        >
                          <span className="font-mono font-bold text-emerald-700">+₹{c.amount}</span>
                          <span className="text-stone-400">·</span>
                          <span>{c.date}</span>
                          {c.notes && <span className="text-stone-500 italic">({c.notes})</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
