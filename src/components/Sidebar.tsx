import React from 'react';
import {
  LayoutDashboard,
  ArrowLeftRight,
  PieChart,
  Target,
  Sparkles,
  TrendingUp,
  GraduationCap,
  Sliders,
  Wallet,
  X
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'transactions'
  | 'budgets'
  | 'goals'
  | 'coach'
  | 'insights'
  | 'learning'
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  availableRemainder?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  mobileOpen,
  onCloseMobile,
  availableRemainder = 0,
}) => {
  const navItems: { id: NavTab; label: string; icon: React.FC<{ className?: string }>; badge?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
    { id: 'budgets', label: 'Budgets', icon: PieChart },
    { id: 'goals', label: 'Savings Goals', icon: Target },
    { id: 'coach', label: 'AI Coach', icon: Sparkles, badge: 'Live AI' },
    { id: 'insights', label: 'Insights & Forecast', icon: TrendingUp },
    { id: 'learning', label: 'Financial Learning', icon: GraduationCap },
    { id: 'settings', label: 'Settings & Data', icon: Sliders },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-stone-900/40 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-emerald-950 text-emerald-50 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } border-r border-emerald-900/60 shadow-xl lg:shadow-none`}
      >
        {/* Brand Header */}
        <div className="p-6 border-b border-emerald-900/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-emerald-950 shadow-md">
              <Wallet className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg tracking-tight text-white">PocketWise</span>
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">AI</span>
              </div>
              <p className="text-xs text-emerald-300/80">Student Finance Coach</p>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-900/60"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-500 text-emerald-950 font-semibold shadow-xs'
                    : 'text-emerald-100/90 hover:bg-emerald-900/50 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-950' : 'text-emerald-300'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                      isActive
                        ? 'bg-emerald-950/15 text-emerald-950'
                        : 'bg-emerald-400/15 text-emerald-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Available Remainder Micro-Card */}
        <div className="p-4 m-3 rounded-2xl bg-emerald-900/60 border border-emerald-800/80">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-emerald-300">Net Remainder</span>
            <span className="text-[10px] text-emerald-400/80">Income − Expenses</span>
          </div>
          <div className="text-xl font-bold font-mono text-white">
            ₹{availableRemainder.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-emerald-300/70 mt-1 leading-snug">
            Calculated from recorded transactions. Not a verified bank feed.
          </p>
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-emerald-900/80 text-[11px] text-emerald-400/60 flex items-center justify-between">
          <span>College Hackathon Build</span>
          <span>v1.0.0</span>
        </div>
      </aside>
    </>
  );
};
