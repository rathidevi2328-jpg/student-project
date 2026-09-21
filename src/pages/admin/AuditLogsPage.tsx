import React, { useState, useEffect } from 'react';
import { History, Search, Shield, User, Clock, Filter, Code } from 'lucide-react';
import { AuditLog } from '../../types';
import { dataService } from '../../services/dataService';
import { Card, Badge, Modal } from '../../components/common/UIComponents';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    const loadLogs = async () => {
      const all = await dataService.getAuditLogs();
      setLogs(all);
    };
    loadLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchSearch =
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = roleFilter === 'ALL' || log.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">System Audit Log</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Immutable chronological ledger of institutional actions, security events, and attendance operations
          </p>
        </div>
        <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
          {filteredLogs.length} Events Recorded
        </span>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search actions or actors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              <option value="ALL">All Roles</option>
              <option value="admin">Admin Actions</option>
              <option value="faculty">Faculty Actions</option>
              <option value="student">Student Actions</option>
            </select>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Action Event</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No audit records matching criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.logId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{log.userName}</p>
                      <p className="text-[10px] font-mono text-slate-400">{log.userId}</p>
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          log.role === 'admin'
                            ? 'danger'
                            : log.role === 'faculty'
                            ? 'info'
                            : 'neutral'
                        }
                        className="capitalize"
                      >
                        {log.role}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{log.action}</td>
                    <td className="py-3 px-4 text-right">
                      {log.metadata ? (
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="px-2 py-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-all"
                        >
                          Inspect JSON
                        </button>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Metadata Detail Modal */}
      {selectedLog && (
        <Modal
          isOpen={Boolean(selectedLog)}
          onClose={() => setSelectedLog(null)}
          title="Audit Log Event Metadata"
          subtitle={`Action: ${selectedLog.action}`}
        >
          <div className="space-y-3">
            <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs overflow-x-auto">
              <pre>{JSON.stringify(selectedLog.metadata, null, 2)}</pre>
            </div>
            <div className="text-xs text-slate-500">
              <p>Actor: <strong>{selectedLog.userName}</strong> ({selectedLog.role})</p>
              <p>Timestamp: {selectedLog.timestamp}</p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
