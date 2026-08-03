import React, { useState, useEffect } from 'react';
import { History, Search, RefreshCw, ShieldAlert } from 'lucide-react';
import { AuditLog } from '../types';
import { api } from '../api';

export const AuditLogView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getAuditLogs();
      setLogs(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = logs.filter((l) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      l.performed_by.toLowerCase().includes(q) ||
      l.action_type.toLowerCase().includes(q) ||
      l.details.toLowerCase().includes(q) ||
      (l.entity_id || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 pb-12">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <History className="w-6 h-6 text-slate-800" />
            <span>აუდიტის სისტემური ჟურნალი (Audit Logs)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            სისტემაში განხორციელებული ყველა მოქმედების უცვლელი და უსაფრთხო ჩანაწერი.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ძიება ჟურნალში..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl"
            />
          </div>

          <button
            onClick={loadLogs}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="bg-slate-950 rounded-2xl border border-slate-800 shadow-xl overflow-hidden text-slate-200 font-mono text-xs">
        <div className="p-4 bg-slate-900 border-b border-slate-800 font-bold flex items-center justify-between">
          <span className="flex items-center gap-2 text-emerald-400">
            <ShieldAlert className="w-4 h-4" />
            <span>სისტემური მოქმედებების ქრონოლოგია</span>
          </span>
          <span className="text-slate-400 text-[11px]">სულ: {filteredLogs.length} ჩანაწერი</span>
        </div>

        <div className="divide-y divide-slate-800 max-h-[500px] overflow-y-auto">
          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-slate-500">ჟურნალი ცარიელია.</div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className="p-3 hover:bg-slate-900/60 transition space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-blue-400 font-bold">[{log.timestamp}]</span>
                  <span className="text-purple-400">ავტორი: {log.performed_by}</span>
                  <span className="text-emerald-400 font-bold">{log.action_type}</span>
                </div>
                <p className="text-slate-300 pl-2 border-l-2 border-blue-500">{log.details}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
