import React, { useState, useEffect } from 'react';
import { Person, CaseReview } from '../types';
import { api } from '../api';
import {
  RefreshCw,
  Search,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  User as UserIcon,
  FileText,
  Building,
  ChevronRight,
  Filter,
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

  // Modal for performing review
  const [selectedReview, setSelectedReview] = useState<CaseReview | null>(null);
  const [reviewDate, setReviewDate] = useState(new Date().toISOString().split('T')[0]);
  const [programDecision, setProgramDecision] = useState<'გაგრძელება' | 'დასრულება'>('გაგრძელება');
  const [result, setResult] = useState('');
  const [comment, setComment] = useState('');
  const [notes, setNotes] = useState('');
  const [newPlannedEndDate, setNewPlannedEndDate] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const data = await api.getReviews();
      setReviews(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handlePerformReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReview) return;
    setSubmitting(true);
    setErrorMsg(null);

    try {
      await api.performReview(selectedReview.id, {
        review_date: reviewDate,
        program_decision: programDecision,
        result,
        comment,
        notes,
        new_planned_end_date: programDecision === 'გაგრძელება' && newPlannedEndDate ? newPlannedEndDate : undefined,
        attachment_name: attachmentName || undefined,
      });

      setSelectedReview(null);
      fetchReviews();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'შეცდომა გადასინჯვის დაფიქსირებისას');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter reviews
  const filteredReviews = reviews.filter((rev) => {
    const person = persons.find((p) => p.id === rev.person_id);
    const personName = person ? `${person.first_name} ${person.last_name} ${person.personal_number}` : '';

    const matchesSearch = search === '' || personName.toLowerCase().includes(search.toLowerCase());

    let matchesStatus = true;
    if (statusFilter === 'due') matchesStatus = rev.status === 'გადასახედი';
    if (statusFilter === 'overdue') matchesStatus = rev.status === 'ვადაგადაცილებული';
    if (statusFilter === 'completed') matchesStatus = rev.status === 'განხილული';

    return matchesSearch && matchesStatus;
  });

  const overdueCount = reviews.filter((r) => r.status === 'ვადაგადაცილებული').length;
  const dueCount = reviews.filter((r) => r.status === 'გადასახედი').length;
  const completedCount = reviews.filter((r) => r.status === 'განხილული').length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                6-თვიანი შუალედური გადასინჯვები
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                პროგრამაში განთავსებულ ბენეფიციართა ქეისების გეგმიური 6-თვიანი მონიტორინგი და გადასინჯვა
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stat Badges */}
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
            <span className="block text-xs text-emerald-700 font-bold uppercase">განხილული</span>
            <span className="text-lg font-black text-emerald-700">{completedCount}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 flex flex-col md:flex-row gap-3 justify-between items-center">
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ძებნა სახელის, გვარის ან პირადი ნომრის მიხედვით..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            ყველა ({reviews.length})
          </button>
          <button
            onClick={() => setStatusFilter('overdue')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              statusFilter === 'overdue'
                ? 'bg-rose-600 text-white'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            ვადაგადაცილებული ({overdueCount})
          </button>
          <button
            onClick={() => setStatusFilter('due')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              statusFilter === 'due'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            გადასახედი ({dueCount})
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              statusFilter === 'completed'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            განხილული ({completedCount})
          </button>
        </div>
      </div>

      {/* Reviews List Grid */}
      {loading ? (
        <div className="bg-white rounded-2xl p-12 text-center text-slate-500 text-xs">
          მონაცემები იტვირთება...
        </div>
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
            const isCompleted = rev.status === 'განხილული';

            return (
              <div
                key={rev.id}
                className={`bg-white rounded-2xl p-5 border transition shadow-xs flex flex-col justify-between space-y-4 ${
                  isOverdue
                    ? 'border-rose-300 bg-rose-50/20'
                    : isDue
                    ? 'border-amber-300 bg-amber-50/20'
                    : 'border-slate-200'
                }`}
              >
                <div className="space-y-3">
                  {/* Status & Review Cycle Header */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                      მე-{rev.review_cycle} 6-თვიანი ციკლი
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                        isOverdue
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : isDue
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      }`}
                    >
                      {isOverdue && <AlertTriangle className="w-3 h-3 text-rose-600" />}
                      {isDue && <Clock className="w-3 h-3 text-amber-600" />}
                      {isCompleted && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                      {rev.status}
                    </span>
                  </div>

                  {/* Person Info */}
                  {person ? (
                    <div>
                      <button
                        onClick={() => onSelectPerson(person)}
                        className="text-left font-bold text-slate-900 text-sm hover:text-blue-600 transition flex items-center gap-1 group"
                      >
                        <span>
                          {person.first_name} {person.last_name}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
                      </button>
                      <p className="text-xs text-slate-500 font-medium">
                        პირადი №: <span className="font-semibold text-slate-700">{person.personal_number}</span>
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">ბენეფიციარის ID: {rev.person_id}</p>
                  )}

                  {/* Placement Details */}
                  <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Building className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="font-semibold text-slate-800 truncate">
                        {rev.placement_type || 'მინდობითი აღზრდა'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-500 text-[11px]">
                      <span>გადასინჯვის ვადა:</span>
                      <span className="font-bold text-slate-800">{rev.due_date}</span>
                    </div>
                  </div>

                  {/* Execution Details if completed */}
                  {isCompleted && (
                    <div className="p-3 bg-emerald-50/60 border border-emerald-200/60 rounded-xl space-y-1 text-xs">
                      <p className="font-bold text-emerald-900 flex items-center justify-between">
                        <span>ჩატარების თარიღი:</span>
                        <span>{rev.review_date}</span>
                      </p>
                      {rev.program_decision && (
                        <p className="text-emerald-800">
                          გადაწყვეტილება: <span className="font-bold">{rev.program_decision}</span>
                        </p>
                      )}
                      {rev.result && <p className="text-slate-700 italic">"{rev.result}"</p>}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-slate-100 flex gap-2">
                  {person && (
                    <button
                      onClick={() => onSelectPerson(person)}
                      className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition cursor-pointer"
                    >
                      ქეისის ნახვა
                    </button>
                  )}

                  {!isCompleted && (
                    <button
                      onClick={() => {
                        setSelectedReview(rev);
                        setReviewDate(new Date().toISOString().split('T')[0]);
                        setProgramDecision('გაგრძელება');
                        setResult('');
                        setComment('');
                        setNotes('');
                        setNewPlannedEndDate('');
                        setAttachmentName('');
                        setErrorMsg(null);
                      }}
                      className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center gap-1"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>გადასინჯვა</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Perform Review Modal */}
      {selectedReview && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
                <RefreshCw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  6-თვიანი გადასინჯვის დაფიქსირება
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  შუალედური მონიტორინგის შედეგების შეყვანა
                </p>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handlePerformReviewSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">გადასინჯვის ჩატარების თარიღი *</label>
                <input
                  type="date"
                  value={reviewDate}
                  onChange={(e) => setReviewDate(e.target.value)}
                  required
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">პროგრამული გადაწყვეტილება *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setProgramDecision('გაგრძელება')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                      programDecision === 'გაგრძელება'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    პროგრამის გაგრძელება
                  </button>
                  <button
                    type="button"
                    onClick={() => setProgramDecision('დასრულება')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                      programDecision === 'დასრულება'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    პროგრამის დასრულება
                  </button>
                </div>
              </div>

              {programDecision === 'გაგრძელება' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    ახალი დაგეგმილი დასრულების თარიღი (ხელით შეყვანა)
                  </label>
                  <input
                    type="date"
                    value={newPlannedEndDate}
                    onChange={(e) => setNewPlannedEndDate(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    თუ თარიღი არ შეიცვლება, დარჩება არსებული დაგეგმილი დასრულების თარიღი.
                  </p>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">გადასინჯვის შედეგები / დასკვნა</label>
                <textarea
                  value={result}
                  onChange={(e) => setResult(e.target.value)}
                  placeholder="აღწერეთ გადასინჯვის შედეგები და ბავშვის მდგომარეობა..."
                  rows={3}
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">შენიშვნები & რეკომენდაციები</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="დამატებითი კომენტარი ან სოციალური მუშაკის შენიშვნა..."
                  rows={2}
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">თანდართული დოკუმენტის დასახელება / ნომერი</label>
                <input
                  type="text"
                  value={attachmentName}
                  onChange={(e) => setAttachmentName(e.target.value)}
                  placeholder="მაგ: ოქმი №12-34 ან დასკვნა_2026.pdf"
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedReview(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 font-semibold text-slate-700 rounded-xl cursor-pointer"
                >
                  გაუქმება
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs cursor-pointer transition disabled:opacity-50"
                >
                  {submitting ? 'ინახება...' : 'დადასტურება & შენახვა'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
