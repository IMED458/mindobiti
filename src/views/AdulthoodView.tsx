import React, { useState } from 'react';
import { CalendarDays, Sparkles, Lock } from 'lucide-react';
import { Person } from '../types';
import { formatDateToGeorgian } from '../../server/utils';

interface AdulthoodViewProps {
  persons: Person[];
  onSelectPerson: (person: Person) => void;
  filterAge?: 18 | 21;
}

export const AdulthoodView: React.FC<AdulthoodViewProps> = ({
  persons,
  onSelectPerson,
  filterAge = 18,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | '3days' | '30days' | '60days' | 'reached'>('60days');

  // Filter Active cases
  const activePersons = persons.filter((p) => p.case_status === 'აქტიური');

  const filteredPersons = activePersons.filter((p) => {
    if (filterAge === 21) {
      const isApproaching21 = p.calculated_age !== undefined && (p.calculated_age === 20 || p.calculated_age === 21);
      return isApproaching21;
    }

    const days = p.days_until_adulthood ?? 999;
    if (filterMode === 'reached') return p.calculated_age !== undefined && p.calculated_age >= 18;
    if (filterMode === '3days') return days >= 0 && days <= 3;
    if (filterMode === '30days') return days >= 0 && days <= 30;
    if (filterMode === '60days') return days >= 0 && days <= 60;
    return true;
  });

  const is21 = filterAge === 21;

  return (
    <div className="space-y-6 pb-12">
      {/* Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            {is21 ? (
              <Sparkles className="w-6 h-6 text-indigo-600" />
            ) : (
              <CalendarDays className="w-6 h-6 text-purple-600" />
            )}
            <span>
              {is21
                ? '21 წლის ასაკის მიღწევა (მცირე საოჯახო სახლებიდან გასვლა / პროგრამის დასრულება)'
                : 'სრულწლოვანების მოახლოება (18 წელი)'}
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {is21
              ? '21 წლის ასაკის მიღწევისას ბენეფიციარის მომსახურებიდან გასვლისა და დამოუკიდებელი ცხოვრებისთვის მომზადების მონიტორინგი.'
              : 'სრულწლოვანების თარიღის ზუსტი გამოთვლა ნაკიანი წლების გათვალისწინებით.'}
          </p>
        </div>

        {/* Filter Buttons */}
        {!is21 && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              onClick={() => setFilterMode('3days')}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                filterMode === '3days'
                  ? 'bg-purple-900 text-white shadow-xs'
                  : 'bg-purple-100 text-purple-900 hover:bg-purple-200'
              }`}
            >
              ≤ 3 დღეში
            </button>

            <button
              onClick={() => setFilterMode('30days')}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                filterMode === '30days'
                  ? 'bg-purple-900 text-white shadow-xs'
                  : 'bg-purple-100 text-purple-900 hover:bg-purple-200'
              }`}
            >
              ≤ 30 დღეში
            </button>

            <button
              onClick={() => setFilterMode('60days')}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                filterMode === '60days'
                  ? 'bg-purple-900 text-white shadow-xs'
                  : 'bg-purple-100 text-purple-900 hover:bg-purple-200'
              }`}
            >
              ≤ 60 დღეში (2 თვე)
            </button>

            <button
              onClick={() => setFilterMode('reached')}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                filterMode === 'reached'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              უკვე სრულწლოვანი (≥18 წ)
            </button>

            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                filterMode === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              ყველა
            </button>
          </div>
        )}
      </div>

      {/* Grid Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-900 text-white font-semibold">
              <th className="py-3 px-4">ქეისის №</th>
              <th className="py-3 px-4">სახელი, გვარი</th>
              <th className="py-3 px-4">პირადი №</th>
              <th className="py-3 px-4">დაბადების თარიღი</th>
              <th className="py-3 px-4">მიმდინარე ასაკი</th>
              <th className="py-3 px-4">მიმდინარე პროგრამა</th>
              <th className="py-3 px-4">{is21 ? '21 წლის შესრულება' : '18 წელი უსრულდება'}</th>
              <th className="py-3 px-4 text-center">მოქმედება</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredPersons.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-500 font-semibold">
                  {is21
                    ? '20-21 წლის ასაკის ბენეფიციარები ამ ეტაპზე არ ირიცხებიან.'
                    : 'მითითებული ფილტრით პირები ვერ მოიძებნა.'}
                </td>
              </tr>
            ) : (
              filteredPersons.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => onSelectPerson(p)}
                  className="hover:bg-purple-50/40 transition cursor-pointer"
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
                  <td className="py-3 px-4 text-slate-700">{formatDateToGeorgian(p.birth_date)}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{p.calculated_age} წელი</td>
                  <td className="py-3 px-4 font-semibold text-slate-700">
                    {p.current_placement?.placement_type || '—'}
                  </td>
                  <td className="py-3 px-4 font-bold text-purple-800">
                    {formatDateToGeorgian(p.adulthood_date)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectPerson(p);
                      }}
                      className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg text-xs transition cursor-pointer"
                    >
                      ნახვა
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
