import React, { useState } from 'react';
import { Menu, Plus, Bell, User as UserIcon, Check } from 'lucide-react';
import { User, NotificationItem } from '../types';

interface HeaderProps {
  title: string;
  subtitle?: string;
  user: User | null;
  allUsers: User[];
  notifications: NotificationItem[];
  onOpenMobileNav: () => void;
  onOpenAddTransaction: () => void;
  onOpenNotifications: () => void;
  onSwitchUser: (userId: number) => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  user,
  allUsers,
  notifications,
  onOpenMobileNav,
  onOpenAddTransaction,
  onOpenNotifications,
  onSwitchUser,
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const todayStr = new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-stone-200/80 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between transition-colors">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileNav}
          className="lg:hidden p-2 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-stone-900 tracking-tight">{title}</h1>
          {subtitle ? (
            <p className="text-xs text-stone-500 hidden sm:block">{subtitle}</p>
          ) : (
            <p className="text-xs text-stone-500 hidden sm:block">{todayStr}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Date indicator for desktop */}
        <div className="hidden md:flex items-center text-xs font-medium text-stone-500 bg-stone-100/80 px-3 py-1.5 rounded-lg border border-stone-200/60">
          <span>{todayStr}</span>
        </div>

        {/* Notifications Bell */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
          title="Notifications & Alerts"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* User Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-stone-200/90 hover:bg-stone-50 text-stone-700 transition-all text-xs font-medium"
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              {user?.name ? user.name[0].toUpperCase() : 'S'}
            </div>
            <div className="hidden sm:block text-left">
              <div className="font-semibold text-stone-900 leading-tight">{user?.name || 'Student'}</div>
              <div className="text-[10px] text-stone-500 leading-none truncate max-w-[120px]">{user?.college || 'College'}</div>
            </div>
          </button>

          {showUserDropdown && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowUserDropdown(false)}
              />
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-stone-200/90 p-2 z-50">
                <div className="px-3 py-2 border-b border-stone-100">
                  <div className="text-xs font-bold text-stone-900">Student Profile</div>
                  <div className="text-[11px] text-stone-500">{user?.email}</div>
                  <div className="mt-1 text-[11px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded inline-block">
                    Allowance: ₹{user?.monthly_allowance?.toLocaleString('en-IN') || 0}/mo
                  </div>
                </div>

                <div className="py-1">
                  <div className="px-3 py-1 text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                    Switch Student Account
                  </div>
                  {allUsers.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        onSwitchUser(u.id);
                        setShowUserDropdown(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg hover:bg-stone-50 text-stone-700"
                    >
                      <div className="text-left">
                        <div className="font-semibold text-stone-900">{u.name}</div>
                        <div className="text-[10px] text-stone-500">{u.college}</div>
                      </div>
                      {u.id === user?.id && <Check className="w-4 h-4 text-emerald-600" />}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Primary CTA: Add Transaction */}
        <button
          onClick={onOpenAddTransaction}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs sm:text-sm font-semibold shadow-xs shadow-emerald-600/20 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Transaction</span>
        </button>
      </div>
    </header>
  );
};
