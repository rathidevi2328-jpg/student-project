import React from 'react';
import { Bell, CheckCircle2, AlertTriangle, Info, CheckCheck } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
import { Card, Button, Badge } from '../../components/common/UIComponents';

export const StudentNotificationsPage: React.FC = () => {
  const { notifications, markAsRead, refreshNotifications } = useNotifications();

  const handleMarkAllRead = async () => {
    for (const n of notifications) {
      if (!n.read) await markAsRead(n.notificationId);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Bell className="w-6 h-6 text-indigo-600" /> Notifications & Alerts
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Attendance notices, threshold alerts, and faculty announcements
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          icon={CheckCheck}
          onClick={handleMarkAllRead}
          disabled={notifications.filter((n) => !n.read).length === 0}
        >
          Mark All as Read
        </Button>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="divide-y divide-slate-100">
          {notifications.length === 0 ? (
            <div className="text-center py-12 px-4 text-slate-400">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">No notifications right now.</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.notificationId}
                onClick={() => markAsRead(n.notificationId)}
                className={`p-4 flex items-start gap-3.5 cursor-pointer transition-colors ${
                  !n.read ? 'bg-indigo-50/40 hover:bg-indigo-50/70' : 'hover:bg-slate-50'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    n.type === 'warning'
                      ? 'bg-amber-100 text-amber-700'
                      : n.type === 'success'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-indigo-100 text-indigo-700'
                  }`}
                >
                  {n.type === 'warning' && <AlertTriangle className="w-4 h-4" />}
                  {n.type === 'success' && <CheckCircle2 className="w-4 h-4" />}
                  {n.type === 'info' && <Info className="w-4 h-4" />}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className={`text-xs font-bold ${!n.read ? 'text-slate-900' : 'text-slate-700'}`}>
                      {n.title}
                    </h3>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                </div>

                {!n.read && (
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 flex-shrink-0 mt-2" />
                )}
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};
