import React, { useState } from 'react';
import { Clock, AlertOctagon, AlertTriangle, CheckCircle2, ArrowRight, Lock } from 'lucide-react';
import { Person } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { formatDateToGeorgian } from '../../server/utils';

interface RenewalsViewProps {
  persons: Person[];
  onSelectPerson: (person: Person) => void;
}

export const RenewalsView: React.FC<RenewalsViewProps> = ({ persons, onSelectPerson }) => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'overdue' | 'critical' | 'renewal'>('all');

  // Categorize Active Cases
  const activePersons = persons.filter((p) => p.case_status === 'აქტიური');

  const overdueList = activePersons.filter((p) => p.reminder_status === 'ვადაგადაცილებული');
  const criticalList = activePersons.filter((p) => p.reminder_status === 'კრიტიკული');
  const renewalDueList = activePersons.filter((p) => p.reminder_status === 'გასაგრძელებელი');
  const normalList = activePersons.filter((p) => p.reminder_status === 'ნორმალური');

  const filteredDisplay = () => {
    if (activeCategory === 'overdue') return overdueList;
    if (activeCategory === 'critical') return criticalList;
    if (activeCategory === 'renewal') return renewalDueList;
    return [...overdueList, ...criticalList, ...renewalDueList, ...normalList];
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-6 h-6 text-amber-500" />
            <span>გასაგრძელებლები და ვადების მართვა</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            პროგრამების ვადების მონიტორინგი. წინასწარი შეხსენება (2 თვე) და კრიტიკული პერიოდი (3 დღე).
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeCategory === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            ყველა ({activePersons.length})
          </button>

          <button
            onClick={() => setActiveCategory('overdue')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeCategory === 'overdue'
                ? 'bg-rose-950 text-rose-200 shadow-xs'
                : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
            }`}
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>ვადაგადაცილებული ({overdueList.length})</span>
          </button>

          <button
            onClick={() => setActiveCategory('critical')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeCategory === 'critical'
                ? 'bg-red-700 text-white shadow-xs'
                : 'bg-red-100 text-red-800 hover:bg-red-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>კრიტიკული ({criticalList.length})</span>
          </button>

          <button
            onClick={() => setActiveCategory('renewal')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeCategory === 'renewal'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>გასაგრძელებელი ({renewalDueList.length})</span>
          </button>
        </div>
      </div>

      {/* Main List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-900 text-white font-semibold">
              <th className="py-3 px-4">ქეისის №</th>
              <th className="py-3 px-4">სახელი, გვარი</th>
              <th className="py-3 px-4">პირადი №</th>
              <th className="py-3 px-4">პროგრამა</th>
              <th className="py-3 px-4">დაწყების თარიღი</th>
              <th className="py-3 px-4">დასრულების თარიღი</th>
              <th className="py-3 px-4">ვადის სტატუსი</th>
              <th className="py-3 px-4 text-center">მოქმედება</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredDisplay().length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-500">
                  ამ კატეგორიაში ჩანაწერები არ არის.
                </td>
              </tr>
            ) : (
              filteredDisplay().map((p) => (
                <tr
                  key={p.id}
                  onClick={() => onSelectPerson(p)}
                  className="hover:bg-blue-50/40 transition cursor-pointer"
                >
                  <td className="py-3 px-4 font-mono font-bold text-blue-700">
                    <div className="flex items-center gap-1.5">
                      <span>{p.case_number}</span>
                      {p.is_locked && <Lock className="w-3.5 h-3.5 text-amber-600" />}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900">
                    {p.first_name} {p.last_name}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-700">{p.personal_number}</td>
                  <td className="py-3 px-4 font-semibold text-slate-800">
                    {p.current_placement?.placement_type}
                  </td>
                  <td className="py-3 px-4 text-slate-700">
                    {formatDateToGeorgian(p.current_placement?.start_date)}
                  </td>
                  <td className="py-3 px-4 font-bold text-blue-800">
                    {formatDateToGeorgian(p.current_placement?.planned_end_date)}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge type="reminder" value={p.reminder_status || 'ნორმალური'} count={p.days_overdue} />
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectPerson(p);
                      }}
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs transition cursor-pointer"
                    >
                      მართვა
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
