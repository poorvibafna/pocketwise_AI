import React, { useState } from 'react';
import { X, PiggyBank, AlertCircle } from 'lucide-react';
import { Goal } from '../types';
import { api } from '../services/api';

interface ContributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  goal: Goal | null;
}

export const ContributionModal: React.FC<ContributionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  goal,
}) => {
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !goal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const depositAmount = parseFloat(amount);
    if (isNaN(depositAmount) || depositAmount <= 0) {
      setError('Please enter a valid deposit amount greater than ₹0.');
      return;
    }

    setLoading(true);
    try {
      await api.contributeToGoal(goal.id, {
        amount: depositAmount,
        date,
        notes: notes.trim(),
      });
      setAmount('');
      setNotes('');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to record contribution';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const remaining = Math.max(0, goal.target_amount - goal.saved_amount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <PiggyBank className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-stone-900">Add to Goal</h2>
              <p className="text-[11px] text-stone-500 truncate max-w-[190px]">{goal.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-stone-400 hover:text-stone-700">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current status micro-banner */}
        <div className="p-3 bg-stone-50 border-b border-stone-100 flex items-center justify-between text-xs">
          <div>
            <span className="text-stone-500">Saved: </span>
            <span className="font-bold text-emerald-700">₹{goal.saved_amount.toLocaleString('en-IN')}</span>
          </div>
          <div>
            <span className="text-stone-500">Needed: </span>
            <span className="font-bold text-stone-800">₹{remaining.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {error && (
          <div className="m-4 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Contribution Amount (₹) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-stone-500 text-sm font-semibold">₹</span>
              <input
                type="number"
                step="1"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="500"
                className="w-full pl-8 pr-3 py-2 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-sm font-mono"
                required
                autoFocus
              />
            </div>
            <div className="flex gap-1.5 mt-2">
              {[200, 500, 1000, 2000].map((preset) => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => setAmount(String(preset))}
                  className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-stone-100 text-stone-700 hover:bg-stone-200"
                >
                  +₹{preset}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-xs"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Notes (Optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Saved from freelance, tutoring bonus"
              className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-xs"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-3.5 py-1.5 rounded-xl border border-stone-300 text-xs font-semibold text-stone-700 hover:bg-stone-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Deposit Funds'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
