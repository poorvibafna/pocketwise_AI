import React, { useState, useEffect } from 'react';
import { X, Sparkles, AlertCircle, Check } from 'lucide-react';
import { Transaction, Category } from '../types';
import { api } from '../services/api';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialTransaction?: Transaction | null;
  categories: Category[];
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialTransaction,
  categories,
}) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
  const [notes, setNotes] = useState('');

  const [suggestion, setSuggestion] = useState<{
    category: string;
    explanation: string;
    type?: 'expense' | 'income';
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialTransaction) {
      setTitle(initialTransaction.title);
      setAmount(String(initialTransaction.amount));
      setType(initialTransaction.type);
      setCategory(initialTransaction.category);
      setDate(initialTransaction.date);
      setNotes(initialTransaction.notes || '');
      setSuggestion(null);
    } else {
      setTitle('');
      setAmount('');
      setType('expense');
      setCategory(categories.length > 0 ? categories[0].name : 'Food');
      setDate(new Date().toISOString().substring(0, 10));
      setNotes('');
      setSuggestion(null);
    }
    setError(null);
  }, [initialTransaction, isOpen, categories]);

  // Smart Category Suggestion debounced on title change
  useEffect(() => {
    if (initialTransaction || !title || title.trim().length < 3) {
      setSuggestion(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await api.suggestCategory(title);
        if (res.suggestion && res.suggestion !== category) {
          setSuggestion({
            category: res.suggestion,
            explanation: res.explanation,
            type: res.type,
          });
        } else {
          setSuggestion(null);
        }
      } catch {
        setSuggestion(null);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [title, category, initialTransaction]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Please provide a title or description for the transaction.');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Amount must be a positive number greater than ₹0.');
      return;
    }

    if (!category.trim()) {
      setError('Please select a category.');
      return;
    }

    if (!date) {
      setError('Please select a valid date.');
      return;
    }

    setLoading(true);
    try {
      if (initialTransaction) {
        await api.updateTransaction(initialTransaction.id, {
          title: title.trim(),
          amount: parsedAmount,
          type,
          category: category.trim(),
          date,
          notes: notes.trim(),
        });
      } else {
        await api.createTransaction({
          title: title.trim(),
          amount: parsedAmount,
          type,
          category: category.trim(),
          date,
          notes: notes.trim(),
        });
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save transaction';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter((c) => c.type === type);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <div>
            <h2 className="text-lg font-bold text-stone-900">
              {initialTransaction ? 'Edit Transaction' : 'Record New Transaction'}
            </h2>
            <p className="text-xs text-stone-500">
              Track student expenses, canteen food, travel, or allowance income.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Transaction Type Segmented Switch */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">Transaction Type</label>
            <div className="grid grid-cols-2 p-1 bg-stone-100 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setType('expense');
                  setCategory('Food');
                }}
                className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                  type === 'expense'
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Expense (−)
              </button>
              <button
                type="button"
                onClick={() => {
                  setType('income');
                  setCategory('Allowance');
                }}
                className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                  type === 'income'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Income (+)
              </button>
            </div>
          </div>

          {/* Title with Smart Suggestion */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Description / Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Canteen lunch, Bus pass, Tutoring fee, Xerox notes"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-sm placeholder:text-stone-400"
              required
            />

            {/* Smart Category Suggestion Card */}
            {suggestion && (
              <div className="mt-2 p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-semibold">Suggested Category: {suggestion.category}</span>
                    <p className="text-[11px] text-emerald-700">{suggestion.explanation}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCategory(suggestion.category);
                    if (suggestion.type) setType(suggestion.type);
                    setSuggestion(null);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors shrink-0 flex items-center gap-1"
                >
                  <Check className="w-3 h-3" />
                  <span>Apply</span>
                </button>
              </div>
            )}
          </div>

          {/* Amount & Date in 2 columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Amount (₹) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-stone-500 text-sm font-semibold">₹</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-sm font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-sm"
                required
              />
            </div>
          </div>

          {/* Category Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Category <span className="text-rose-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-sm bg-white"
              required
            >
              {filteredCategories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
              {/* Fallback if category not in filtered */}
              {!filteredCategories.some((c) => c.name === category) && category && (
                <option value={category}>{category}</option>
              )}
            </select>
          </div>

          {/* Optional Notes */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">Notes (Optional)</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Split with Rohan, paid via Google Pay, mid-term prep"
              className="w-full px-3.5 py-2 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-xs placeholder:text-stone-400"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl border border-stone-300 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
            >
              {loading ? 'Saving...' : initialTransaction ? 'Update Transaction' : 'Save Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
