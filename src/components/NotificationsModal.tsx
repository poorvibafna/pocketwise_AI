import React from 'react';
import { X, Bell, AlertTriangle, CheckCircle, Info, Sparkles, Trash2 } from 'lucide-react';
import { NotificationItem } from '../types';
import { api } from '../services/api';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onRefresh: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onRefresh,
}) => {
  if (!isOpen) return null;

  const handleMarkAsRead = async (id: number) => {
    try {
      await api.markNotificationRead(id);
      onRefresh();
    } catch {
      // ignore
    }
  };

  const handleClearAll = async () => {
    try {
      await api.clearNotifications();
      onRefresh();
    } catch {
      // ignore
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />;
      case 'milestone':
        return <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-teal-500 shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-blue-500 shrink-0" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-stone-900">Notifications & Nudges</h2>
              <p className="text-[11px] text-stone-500">{notifications.length} active updates</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {notifications.length > 0 && (
              <button
                onClick={handleClearAll}
                className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg transition-colors"
                title="Clear all notifications"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button onClick={onClose} className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {notifications.length === 0 ? (
            <div className="text-center py-10 text-stone-400">
              <Bell className="w-8 h-8 mx-auto mb-2 stroke-1 opacity-50" />
              <p className="text-xs font-medium text-stone-600">All caught up!</p>
              <p className="text-[11px] text-stone-400 mt-0.5">
                No budget alerts or pending milestone notifications.
              </p>
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                onClick={() => !item.is_read && handleMarkAsRead(item.id)}
                className={`p-3.5 rounded-xl border text-xs transition-all cursor-pointer ${
                  item.is_read
                    ? 'bg-stone-50/60 border-stone-200/60 text-stone-600'
                    : 'bg-white border-emerald-200 shadow-xs hover:border-emerald-300'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {getIcon(item.type)}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-stone-900">{item.title}</span>
                      {!item.is_read && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      )}
                    </div>
                    <p className="text-[11px] text-stone-600 mt-1 leading-relaxed">
                      {item.message}
                    </p>
                    <div className="text-[10px] text-stone-400 mt-1.5">
                      {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-stone-100 bg-stone-50 text-center">
          <button
            onClick={onClose}
            className="w-full py-1.5 rounded-xl border border-stone-300 text-xs font-semibold text-stone-700 hover:bg-stone-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
