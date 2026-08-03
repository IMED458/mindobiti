import React from 'react';
import {
  Users,
  Clock,
  AlertOctagon,
  AlertTriangle,
  CalendarDays,
  Lock,
  UserCheck,
  Home,
  Heart,
  Search,
  UserPlus,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { DashboardStats, Person, NavTab } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { formatDateToGeorgian } from '../../server/utils';

interface DashboardViewProps {
  stats?: DashboardStats;
  persons: Person[];
  onNavigate: (tab: NavTab) => void;
  onSelectPerson: (person: Person) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  persons,
  onNavigate,
  onSelectPerson,
}) => {
  // Urgent & Priority Lists
  const overdueList = persons.filter((p) => p.reminder_status === 'ვადაგადაცილებული');
  const criticalList = persons.filter((p) => p.reminder_status === 'კრიტიკული');
  const renewalDueList = persons.filter((p) => p.reminder_status === 'გასაგრძელებელი');

  const adulthoodList = persons
    .filter((p) => p.days_until_adulthood !== undefined && p.days_until_adulthood >= 0 && p.days_until_adulthood <= 60)
    .sort((a, b) => (a.days_until_adulthood || 0) - (b.days_until_adulthood || 0));

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Quick Action */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
            სისტემური მიმოხილვა
          </span>
          <h2 className="text-2xl font-bold tracking-tight mt-2">მინდობითი აღზრდის პორტალი</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            კახეთის რეგიონულ ცენტრში აღრიცხული ბავშვებისა და პირების მინდობით აღზრდაში, მცირე საოჯახო ტიპის სახლსა და რეინტეგრაციის პროგრამაში განთავსების მართვა.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('register')}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-sm transition flex items-center gap-2 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>ახალი პირის რეგისტრაცია</span>
          </button>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Metric 1: Total Registered */}
        <div
          onClick={() => onNavigate('persons')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">სულ რეგისტრირებული</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:scale-105 transition">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{stats?.total_persons || 0}</p>
          <span className="text-[11px] text-slate-400 font-medium">აქტიური ქეისები: {stats?.active_cases || 0}</span>
        </div>

        {/* Metric 2: Overdue (Dark Red) */}
        <div
          onClick={() => onNavigate('renewals')}
          className="bg-rose-950/90 text-white p-4 rounded-xl border border-rose-800 shadow-md hover:shadow-lg transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-200">ვადაგადაცილებული</span>
            <div className="p-2 bg-rose-800 text-rose-200 rounded-lg group-hover:scale-105 transition animate-pulse">
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white mt-2">{stats?.overdue_count || 0}</p>
          <span className="text-[11px] text-rose-300 font-medium">საჭიროებს სასწრაფო რეაგირებას</span>
        </div>

        {/* Metric 3: Critical (<=3 days) */}
        <div
          onClick={() => onNavigate('renewals')}
          className="bg-white p-4 rounded-xl border-2 border-red-200 shadow-2xs hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-red-700">კრიტიკული (≤3 დღე)</span>
            <div className="p-2 bg-red-100 text-red-600 rounded-lg group-hover:scale-105 transition">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-red-600 mt-2">{stats?.critical_count || 0}</p>
          <span className="text-[11px] text-red-500 font-medium">ვადის გასვლამდე მცირე დროა</span>
        </div>

        {/* Metric 4: Renewal Due (Advance 2 months) */}
        <div
          onClick={() => onNavigate('renewals')}
          className="bg-white p-4 rounded-xl border border-amber-200 shadow-2xs hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700">გასაგრძელებელი</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg group-hover:scale-105 transition">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-600 mt-2">{stats?.renewal_due_count || 0}</p>
          <span className="text-[11px] text-amber-600 font-medium">წინასწარი შეხსენების პერიოდში</span>
        </div>

        {/* Metric 5: Approaching Adulthood */}
        <div
          onClick={() => onNavigate('adulthood')}
          className="bg-white p-4 rounded-xl border border-purple-200 shadow-2xs hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-700">სრულწლოვანება (18)</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg group-hover:scale-105 transition">
              <CalendarDays className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-purple-700 mt-2">{stats?.approaching_18_count || 0}</p>
          <span className="text-[11px] text-purple-500 font-medium">მომდევნო 60 დღეში</span>
        </div>

        {/* Metric 6: Locked Cases */}
        <div
          onClick={() => onNavigate('persons')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">დაბლოკილი ქეისები</span>
            <div className="p-2 bg-slate-100 text-slate-700 rounded-lg group-hover:scale-105 transition">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-800 mt-2">{stats?.locked_cases || 0}</p>
          <span className="text-[11px] text-slate-400 font-medium">მხოლოდ ადმინისტრატორის წვდომა</span>
        </div>
      </div>

      {/* Program Distribution Breakdown */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-600" />
          <span>განაწილება პროგრამების მიხედვით</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-500">გადაუდებელი მინდობითი აღზრდა</p>
              <p className="text-xl font-bold text-slate-900 mt-1">{stats?.emergency_count || 0}</p>
            </div>
            <span className="text-xs px-2 py-1 rounded-md bg-amber-100 text-amber-800 font-semibold">90 დღე</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-500">რეგულარული მინდობითი აღზრდა</p>
              <p className="text-xl font-bold text-slate-900 mt-1">{stats?.regular_count || 0}</p>
            </div>
            <span className="text-xs px-2 py-1 rounded-md bg-blue-100 text-blue-800 font-semibold">ხანგრძლივი</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-500">მცირე საოჯახო ტიპის სახლი</p>
              <p className="text-xl font-bold text-slate-900 mt-1">{stats?.group_home_count || 0}</p>
            </div>
            <span className="text-xs px-2 py-1 rounded-md bg-indigo-100 text-indigo-800 font-semibold">საოჯახო</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-500">რეინტეგრაცია</p>
              <p className="text-xl font-bold text-slate-900 mt-1">{stats?.reintegration_count || 0}</p>
            </div>
            <span className="text-xs px-2 py-1 rounded-md bg-emerald-100 text-emerald-800 font-semibold">ოჯახში</span>
          </div>
        </div>
      </div>

      {/* Main Panels: Renewals Panel & Approaching Adulthood Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel 1: Renewals & Deadlines */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-sm">გასაგრძელებლები და ვადები</h3>
            </div>
            <button
              onClick={() => onNavigate('renewals')}
              className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 cursor-pointer"
            >
              <span>სრული სია</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-[420px]">
            {overdueList.length === 0 && criticalList.length === 0 && renewalDueList.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                ყველა პროგრამის ვადა მოწესრიგებულია. გასასვლელი ვადები არ არის.
              </div>
            ) : (
              <>
                {/* Overdue Section */}
                {overdueList.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => onSelectPerson(p)}
                    className="p-3 bg-rose-50 border-l-4 border-rose-600 rounded-lg hover:bg-rose-100/80 transition cursor-pointer flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">
                          {p.first_name} {p.last_name}
                        </span>
                        <span className="text-xs font-mono text-slate-500">({p.personal_number})</span>
                        {p.is_locked && <Lock className="w-3.5 h-3.5 text-amber-600" />}
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">
                        პროგრამა: <span className="font-medium text-slate-800">{p.current_placement?.placement_type}</span>
                      </p>
                      <p className="text-xs text-rose-700 font-semibold mt-0.5">
                        დასრულდა: {formatDateToGeorgian(p.current_placement?.planned_end_date)} ({p.days_overdue} დღით ვადაგადაცილებული)
                      </p>
                    </div>
                    <StatusBadge type="reminder" value="ვადაგადაცილებული" count={p.days_overdue} />
                  </div>
                ))}

                {/* Critical Section */}
                {criticalList.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => onSelectPerson(p)}
                    className="p-3 bg-red-50/60 border-l-4 border-red-500 rounded-lg hover:bg-red-100/60 transition cursor-pointer flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">
                          {p.first_name} {p.last_name}
                        </span>
                        <span className="text-xs font-mono text-slate-500">({p.personal_number})</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">
                        პროგრამა: <span className="font-medium text-slate-800">{p.current_placement?.placement_type}</span>
                      </p>
                      <p className="text-xs text-red-600 font-semibold mt-0.5">
                        გადის: {formatDateToGeorgian(p.current_placement?.planned_end_date)} (დარჩენილია {p.days_remaining_in_placement} დღე)
                      </p>
                    </div>
                    <StatusBadge type="reminder" value="კრიტიკული" />
                  </div>
                ))}

                {/* Renewal Due Section */}
                {renewalDueList.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => onSelectPerson(p)}
                    className="p-3 bg-amber-50/50 border-l-4 border-amber-400 rounded-lg hover:bg-amber-100/50 transition cursor-pointer flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">
                          {p.first_name} {p.last_name}
                        </span>
                        <span className="text-xs font-mono text-slate-500">({p.personal_number})</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">
                        პროგრამა: <span className="font-medium text-slate-800">{p.current_placement?.placement_type}</span>
                      </p>
                      <p className="text-xs text-amber-700 font-medium mt-0.5">
                        დასრულება: {formatDateToGeorgian(p.current_placement?.planned_end_date)}
                      </p>
                    </div>
                    <StatusBadge type="reminder" value="გასაგრძელებელი" />
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Panel 2: Approaching Adulthood */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-purple-400" />
              <h3 className="font-bold text-sm">სრულწლოვანების მოახლოება (18 წელი)</h3>
            </div>
            <button
              onClick={() => onNavigate('adulthood')}
              className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 cursor-pointer"
            >
              <span>სრული სია</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-[420px]">
            {adulthoodList.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                ახლო მომავალში (60 დღე) სრულწლოვანი არცერთი პირი არ ხდება.
              </div>
            ) : (
              adulthoodList.map((p) => (
                <div
                  key={p.id}
                  onClick={() => onSelectPerson(p)}
                  className="p-3 bg-purple-50/50 border border-purple-200 rounded-lg hover:bg-purple-100/60 transition cursor-pointer flex items-center justify-between gap-2"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">
                        {p.first_name} {p.last_name}
                      </span>
                      <span className="text-xs font-mono text-slate-500">({p.personal_number})</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      დაბადების თარიღი: <span className="font-medium text-slate-800">{formatDateToGeorgian(p.birth_date)}</span> (ასაკი: {p.calculated_age} წელი)
                    </p>
                    <p className="text-xs text-purple-700 font-semibold mt-0.5">
                      18 წელი უსრულდება: {formatDateToGeorgian(p.adulthood_date)}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-purple-200 text-purple-900">
                      {p.days_until_adulthood === 0 ? 'დღეს!' : `${p.days_until_adulthood} დღეში`}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
