import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Sparkles,
  AlertCircle,
  HelpCircle,
  Lightbulb,
  Check,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { InsightsData } from '../types';
import { api } from '../services/api';

interface InsightsPageProps {
  insights: InsightsData | null;
  loading: boolean;
  onRefresh: () => void;
  onBudgetAdopted: () => void;
}

export const InsightsPage: React.FC<InsightsPageProps> = ({
  insights,
  loading,
  onRefresh,
  onBudgetAdopted,
}) => {
  const [adoptingCategory, setAdoptingCategory] = useState<string | null>(null);
  const [adoptedMessage, setAdoptedMessage] = useState<string | null>(null);

  if (loading && !insights) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-stone-500 font-medium">Analyzing historical spending trends...</p>
        </div>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-stone-200">
        <p className="text-stone-600 text-xs">Could not load insights at this time.</p>
      </div>
    );
  }

  const handleAdoptRecommendation = async (category: string, suggestedLimit: number) => {
    setAdoptingCategory(category);
    try {
      await api.saveBudget({
        category,
        monthly_limit: suggestedLimit,
      });
      setAdoptedMessage(`Adopted budget limit of ₹${suggestedLimit.toLocaleString('en-IN')} for ${category}!`);
      setTimeout(() => setAdoptedMessage(null), 4000);
      onBudgetAdopted();
    } catch {
      // ignore
    } finally {
      setAdoptingCategory(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-stone-900">Financial Insights & Forecasting</h2>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              Explainable Analytics
            </span>
          </div>
          <p className="text-xs text-stone-500">
            Compare monthly trends, see data-backed forecasts, and optimize your student budget.
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 self-start sm:self-auto"
        >
          Refresh Analysis
        </button>
      </div>

      {adoptedMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{adoptedMessage}</span>
        </div>
      )}

      {!insights.hasEnoughData ? (
        /* Empty State if < 5 transactions */
        <div className="bg-white p-12 text-center rounded-2xl border border-stone-200/90 shadow-xs space-y-3">
          <Layers className="w-12 h-12 mx-auto text-stone-300 stroke-1" />
          <h3 className="text-sm font-bold text-stone-800">Not Enough Data Yet</h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
            PocketWise AI requires at least 5 recorded transactions across multiple dates to compute explainable month-over-month comparisons, trends, and projections. Start by logging your daily expenses!
          </p>
        </div>
      ) : (
        <>
          {/* Key Findings Card */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-stone-900">Observed Spending Patterns</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {insights.findings.map((f, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/70 text-xs text-stone-800 flex items-start gap-2.5 leading-relaxed"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Month over Month Comparison Table */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-stone-900">
                Current Month vs Previous Month by Category
              </h3>
              <p className="text-xs text-stone-500">
                Tracking how your canteen, travel, and shopping spending shifts across months.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-stone-50/80 border-b border-stone-200 text-[11px] uppercase font-semibold text-stone-500">
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-right">This Month (₹)</th>
                    <th className="py-2.5 px-3 text-right">Last Month (₹)</th>
                    <th className="py-2.5 px-3 text-right">Difference (₹)</th>
                    <th className="py-2.5 px-3 text-right">Trend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {insights.categoryComparisons.map((c, idx) => {
                    const isIncrease = c.diff > 0;
                    const isZero = c.diff === 0;

                    return (
                      <tr key={idx} className="hover:bg-stone-50/50">
                        <td className="py-2.5 px-3 font-semibold text-stone-800">{c.category}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-stone-900">
                          ₹{c.currentSpent.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-stone-600">
                          ₹{c.prevSpent.toLocaleString('en-IN')}
                        </td>
                        <td
                          className={`py-2.5 px-3 text-right font-mono font-bold ${
                            isIncrease ? 'text-rose-600' : isZero ? 'text-stone-500' : 'text-emerald-600'
                          }`}
                        >
                          {isIncrease ? '+' : ''}₹{c.diff.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span
                            className={`inline-flex items-center gap-1 font-semibold text-[11px] ${
                              isIncrease ? 'text-rose-600' : isZero ? 'text-stone-500' : 'text-emerald-600'
                            }`}
                          >
                            {isIncrease ? (
                              <>
                                <TrendingUp className="w-3 h-3" />
                                <span>+{c.pctChange}%</span>
                              </>
                            ) : isZero ? (
                              <span>0%</span>
                            ) : (
                              <>
                                <TrendingDown className="w-3 h-3" />
                                <span>{c.pctChange}%</span>
                              </>
                            )}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Expense Forecast Card */}
          {insights.forecast && (
            <div className="bg-gradient-to-br from-stone-900 to-emerald-950 text-white p-5 sm:p-6 rounded-2xl shadow-md space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">Monthly Expense Forecast</h3>
                    <p className="text-xs text-emerald-300/80">Projected end-of-month spend</p>
                  </div>
                </div>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Statistical Estimate
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white/5 p-3.5 rounded-xl border border-white/10">
                  <span className="text-[11px] text-emerald-300">Average Daily Spend</span>
                  <div className="text-xl font-bold font-mono text-white mt-1">
                    ₹{insights.forecast.avgDailySpend.toLocaleString('en-IN')}/day
                  </div>
                  <span className="text-[10px] text-stone-400">
                    Based on Day {insights.forecast.currentDay} of {insights.forecast.daysInMonth}
                  </span>
                </div>

                <div className="bg-white/5 p-3.5 rounded-xl border border-white/10">
                  <span className="text-[11px] text-emerald-300">Projected Month Total</span>
                  <div className="text-xl font-bold font-mono text-emerald-300 mt-1">
                    ₹{insights.forecast.projectedMonthTotal.toLocaleString('en-IN')}
                  </div>
                  <span className="text-[10px] text-stone-400">
                    {insights.forecast.daysRemaining} days remaining in month
                  </span>
                </div>

                <div className="bg-white/5 p-3.5 rounded-xl border border-white/10">
                  <span className="text-[11px] text-emerald-300">Periods Analyzed</span>
                  <div className="text-xl font-bold font-mono text-white mt-1">
                    {insights.forecast.periodsAnalyzed} months
                  </div>
                  <span className="text-[10px] text-stone-400">Current + Previous cycle</span>
                </div>
              </div>

              <div className="text-[11px] text-stone-300/90 leading-relaxed bg-black/20 p-3 rounded-xl border border-white/5">
                <strong>Methodology & Uncertainty:</strong> {insights.forecast.method} {insights.forecast.disclaimer}
              </div>
            </div>
          )}

          {/* Budget Recommendations */}
          {insights.recommendations.length > 0 && (
            <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-emerald-600" />
                <div>
                  <h3 className="text-sm font-bold text-stone-900">Recommended Budget Adjustments</h3>
                  <p className="text-xs text-stone-500">
                    Smart limits tailored to your actual median spending patterns with a 10% buffer.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {insights.recommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-stone-50 border border-stone-200/80 flex flex-col justify-between"
                  >
                    <div>
                      <div className="font-bold text-stone-900 text-xs mb-1">{rec.category}</div>
                      <p className="text-[11px] text-stone-500 mb-2 leading-snug">{rec.rationale}</p>
                    </div>

                    <div className="pt-2 border-t border-stone-200/70 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-stone-400 uppercase">Suggested Limit</span>
                        <div className="font-mono font-bold text-emerald-800 text-sm">
                          ₹{rec.suggestedLimit.toLocaleString('en-IN')}
                        </div>
                      </div>

                      <button
                        onClick={() => handleAdoptRecommendation(rec.category, rec.suggestedLimit)}
                        disabled={adoptingCategory === rec.category}
                        className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
                      >
                        {adoptingCategory === rec.category ? 'Applying...' : 'Apply Limit'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
