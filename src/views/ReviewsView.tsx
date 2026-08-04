import React, { useState, useEffect } from 'react';
import { Person, CaseReview } from '../types';
import { api } from '../api';
import { formatDateToGeorgian } from '../utils';
import {
  RefreshCw,
  Search,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Building,
  ChevronRight,
} from 'lucide-react';

interface ReviewsViewProps {
  persons: Person[];
  onSelectPerson: (person: Person) => void;
  onRefresh?: () => void;
}

export const ReviewsView: React.FC<ReviewsViewProps> = ({ persons, onSelectPerson, onRefresh }) => {
  const [reviews, setReviews] = useState<CaseReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'due' | 'overdue' | 'completed'>('all');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      setReviews(await api.getReviews());
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [persons]);

  // ერთი დაწკაპებით — გადასინჯვა შესრულებულია
  const handleQuickReview = async (rev: CaseReview) => {
    setBusyId(rev.id);
    setErrorMsg(null);
    try {
      await api.performReview(rev.id, {});
      await fetchReviews();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'შეცდომა გადასინჯვისას');
    } finally {
      setBusyId(null);
    }
  };

  const filteredReviews = reviews.filter((rev) => {
    const person = persons.find((p) => p.id === rev.person_id);
    const personName = person ? `${person.first_name} ${person.last_name} ${person.personal_number}` : '';
    const matchesSearch = search === '' || personName.toLowerCase().includes(search.toLowerCase());

    let matchesStatus = true;
    if (statusFilter === 'due') matchesStatus = rev.status === 'გადასახედი';
    if (statusFilter === 'overdue') matchesStatus = rev.status === 'ვადაგადაცილებული';
    if (statusFilter === 'completed') matchesStatus = rev.status === 'შესრულებული';
    return matchesSearch && matchesStatus;
  });

  const overdueCount = reviews.filter((r) => r.status === 'ვადაგადაცილებული').length;
  const dueCount = reviews.filter((r) => r.status === 'გადასახედი').length;
  const completedCount = reviews.filter((r) => r.status === 'შესრულებული').length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
            <RefreshCw className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">გადასინჯვები</h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              ბენეფიციარის შემოწმება — ერთი დაწკაპებით მიენიჭება „გადასინჯვა შესრულებულია".
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 bg-rose-50 border border-rose-200 rounded-xl text-center">
            <span className="block text-xs text-rose-700 font-bold uppercase">ვადაგადაცილებული</span>
            <span className="text-lg font-black text-rose-700">{overdueCount}</span>
          </div>
          <div className="px-3.5 py-2 bg-amber-50 border border-amber-200 rounded-xl text-center">
            <span className="block text-xs text-amber-700 font-bold uppercase">გადასახედი</span>
            <span className="text-lg font-black text-amber-700">{dueCount}</span>
          </div>
          <div className="px-3.5 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
            <span className="block text-xs text-emerald-700 font-bold uppercase">შესრულებული</span>
            <span className="text-lg font-black text-emerald-700">{completedCount}</span>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl">{errorMsg}</div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 flex flex-col md:flex-row gap-3 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ძებნა სახელით, გვარით ან პირადი ნომრით..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {(['all', 'overdue', 'due', 'completed'] as const).map((key) => {
            const labels: Record<string, string> = { all: `ყველა (${reviews.length})`, overdue: `ვადაგადაცილებული (${overdueCount})`, due: `გადასახედი (${dueCount})`, completed: `შესრულებული (${completedCount})` };
            const colors: Record<string, string> = {
              all: statusFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
              overdue: statusFilter === 'overdue' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200',
              due: statusFilter === 'due' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200',
              completed: statusFilter === 'completed' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200',
            };
            return (
              <button key={key} onClick={() => setStatusFilter(key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${colors[key]}`}>
                {labels[key]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Reviews Grid */}
      {loading ? (
        <div className="bg-white rounded-2xl p-12 text-center text-slate-500 text-xs">მონაცემები იტვირთება...</div>
      ) : filteredReviews.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-slate-500 text-xs font-semibold">
          არჩეული ფილტრით გადასინჯვის ჩანაწერები ვერ მოიძებნა.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReviews.map((rev) => {
            const person = persons.find((p) => p.id === rev.person_id);
            const isOverdue = rev.status === 'ვადაგადაცილებული';
            const isDue = rev.status === 'გადასახედი';
            const isCompleted = rev.status === 'შესრულებული';

            return (
              <div key={rev.id}
                className={`bg-white rounded-2xl p-5 border transition shadow-xs flex flex-col justify-between space-y-4 ${
                  isOverdue ? 'border-rose-300 bg-rose-50/20' : isDue ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'
                }`}>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                      გადასინჯვა #{rev.review_number}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                      isOverdue ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : isDue ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    }`}>
                      {isOverdue && <AlertTriangle className="w-3 h-3 text-rose-600" />}
                      {isDue && <Clock className="w-3 h-3 text-amber-600" />}
                      {isCompleted && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                      {isCompleted ? 'შესრულებული' : rev.status}
                    </span>
                  </div>

                  {person ? (
                    <div>
                      <button onClick={() => onSelectPerson(person)}
                        className="text-left font-bold text-slate-900 text-sm hover:text-blue-600 transition flex items-center gap-1 group">
                        <span>{person.first_name} {person.last_name}</span>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
                      </button>
                      <p className="text-xs text-slate-500 font-medium">
                        პირადი №: <span className="font-semibold text-slate-700">{person.personal_number}</span>
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">ბენეფიციარის ID: {rev.person_id}</p>
                  )}

                  <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Building className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="font-semibold text-slate-800 truncate">
                        {rev.placement_type || person?.current_placement?.placement_type || 'მინდობითი აღზრდა'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-500 text-[11px]">
                      <span>ვადა:</span>
                      <span className="font-bold text-slate-800">{formatDateToGeorgian(rev.due_date)}</span>
                    </div>
                  </div>

                  {isCompleted && (
                    <div className="p-3 bg-emerald-50/60 border border-emerald-200/60 rounded-xl space-y-1 text-xs">
                      <p className="font-bold text-emerald-900">გადასინჯვა შესრულებულია</p>
                      <p className="text-emerald-800">
                        {rev.performed_by || 'უცნობი'}
                        {rev.performed_at ? ` · ${new Date(rev.performed_at).toLocaleString('ka-GE')}` : ''}
                      </p>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 flex gap-2">
                  {person && (
                    <button onClick={() => onSelectPerson(person)}
                      className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition cursor-pointer">
                      ქეისის ნახვა
                    </button>
                  )}
                  {!isCompleted && (
                    <button onClick={() => handleQuickReview(rev)} disabled={busyId === rev.id}
                      className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center gap-1 disabled:opacity-50">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{busyId === rev.id ? 'ინახება...' : 'გადასინჯვა'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
