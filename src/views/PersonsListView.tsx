import React, { useState } from 'react';
import {
  Search,
  Filter,
  Download,
  Printer,
  X,
  Lock,
  ChevronLeft,
  ChevronRight,
  Eye,
  UserPlus,
  RefreshCw,
} from 'lucide-react';
import { Person } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { formatDateToGeorgian } from '../utils';
import { exportStyledExcel, PrintableReport, ReportColumn } from '../lib/reportExport';

const LIST_COLUMNS: ReportColumn[] = [
  { header: 'ქეისის №', width: 15 },
  { header: 'სახელი', width: 12 },
  { header: 'გვარი', width: 14 },
  { header: 'პირადი ნომერი', width: 14 },
  { header: 'დაბადების თარიღი', width: 14 },
  { header: 'ასაკი', width: 6 },
  { header: 'ჩარიცხვის თარიღი', width: 14 },
  { header: 'ჩარიცხვის წყარო', width: 20 },
  { header: 'ჩარიცხვის მიზეზი', width: 24 },
  { header: 'სტატუსი', width: 10 },
  { header: 'მიმდინარე პროგრამა', width: 26 },
  { header: 'პროგრამის დაწყება', width: 14 },
  { header: 'პროგრამის დასრულება', width: 15 },
  { header: 'ვადის მდგომარეობა', width: 16 },
  { header: 'ქეისის მდგომარეობა', width: 14 },
];

interface PersonsListViewProps {
  persons: Person[];
  onSelectPerson: (person: Person) => void;
  onNavigateRegister: () => void;
  onRefresh: () => void;
  loading?: boolean;
}

export const PersonsListView: React.FC<PersonsListViewProps> = ({
  persons,
  onSelectPerson,
  onNavigateRegister,
  onRefresh,
  loading,
}) => {
  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  // Filter states
  const [selectedPlacementType, setSelectedPlacementType] = useState<string>('all');
  const [selectedPersonStatus, setSelectedPersonStatus] = useState<string>('all');
  const [selectedReminderStatus, setSelectedReminderStatus] = useState<string>('all');
  const [selectedLockStatus, setSelectedLockStatus] = useState<string>('all');
  const [showArchived, setShowArchived] = useState<boolean>(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Filter logic
  const filteredPersons = persons.filter((p) => {
    // Search
    if (searchTerm) {
      const q = searchTerm.toLowerCase().trim();
      const matchName = `${p.first_name} ${p.last_name}`.toLowerCase().includes(q);
      const matchPersonal = p.personal_number.includes(q);
      const matchCase = p.case_number.toLowerCase().includes(q);
      const matchSource = (p.admission_source || '').toLowerCase().includes(q);
      if (!matchName && !matchPersonal && !matchCase && !matchSource) {
        return false;
      }
    }

    // Archived filter
    if (!showArchived && p.case_status === 'არქივირებული') {
      return false;
    }
    if (showArchived && p.case_status !== 'არქივირებული') {
      return false;
    }

    // Placement filter
    if (selectedPlacementType !== 'all') {
      if (p.current_placement?.placement_type !== selectedPlacementType) {
        return false;
      }
    }

    // Person Status filter
    if (selectedPersonStatus !== 'all') {
      if (p.person_status !== selectedPersonStatus) {
        return false;
      }
    }

    // Reminder Status filter
    if (selectedReminderStatus !== 'all') {
      if (p.reminder_status !== selectedReminderStatus) {
        return false;
      }
    }

    // Lock filter
    if (selectedLockStatus !== 'all') {
      if (selectedLockStatus === 'locked' && !p.is_locked) return false;
      if (selectedLockStatus === 'unlocked' && p.is_locked) return false;
    }

    return true;
  });

  // Pagination Math
  const totalPages = Math.ceil(filteredPersons.length / pageSize) || 1;
  const currentSlice = filteredPersons.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedPlacementType('all');
    setSelectedPersonStatus('all');
    setSelectedReminderStatus('all');
    setSelectedLockStatus('all');
    setShowArchived(false);
    setCurrentPage(1);
  };

  // მწკრივების აგება (Excel + ბეჭდვა)
  const listRows: (string | number)[][] = filteredPersons.map((p) => [
    p.case_number,
    p.first_name,
    p.last_name,
    p.personal_number,
    formatDateToGeorgian(p.birth_date),
    p.calculated_age ?? '',
    formatDateToGeorgian(p.admission_date),
    p.admission_source,
    p.admission_reason,
    p.person_status,
    p.current_placement?.placement_type || 'არ არის',
    formatDateToGeorgian(p.current_placement?.start_date),
    formatDateToGeorgian(p.current_placement?.planned_end_date),
    p.reminder_status || 'ნორმალური',
    p.is_locked ? 'დაბლოკილია' : 'ღიაა',
  ]);

  const listTitle = showArchived ? 'ბენეფიციართა ბაზა — არქივირებული ქეისები' : 'ბენეფიციართა ბაზა — აქტიური ქეისები';
  const listMeta = () => [
    `პროგრამა: ${selectedPlacementType === 'all' ? 'ყველა' : selectedPlacementType} · სტატუსი: ${selectedPersonStatus === 'all' ? 'ყველა' : selectedPersonStatus} · ვადა: ${selectedReminderStatus === 'all' ? 'ყველა' : selectedReminderStatus}`,
    `გენერირების თარიღი: ${new Date().toLocaleString('ka-GE')} · სულ ჩანაწერი: ${filteredPersons.length}`,
  ];

  // Excel Export (სტილიზებული)
  const exportToExcel = () => {
    exportStyledExcel({
      fileName: `Mindobiti_Baza_${new Date().toISOString().split('T')[0]}.xlsx`,
      sheetName: 'პირთა ბაზა',
      title: listTitle,
      meta: listMeta(),
      columns: LIST_COLUMNS,
      rows: listRows,
    });
  };

  // Print view
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Top Header & Search / Export Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="ძიება (სახელი, გვარი, პირადი #, ქეისი #)..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={onRefresh}
            title="მონაცემების განახლება"
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Export & Action Buttons */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            onClick={exportToExcel}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Excel ექსპორტი</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>ბეჭდვა</span>
          </button>

          <button
            onClick={onNavigateRegister}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>ახალი რეგისტრაცია</span>
          </button>
        </div>
      </div>

      {/* Multi-Filter Bar */}
      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
        {/* Filter 1: Placement */}
        <div>
          <label className="block font-semibold text-slate-600 mb-1">პროგრამის ტიპი</label>
          <select
            value={selectedPlacementType}
            onChange={(e) => {
              setSelectedPlacementType(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">ყველა პროგრამა</option>
            <option value="გადაუდებელი მინდობითი აღზრდა">გადაუდებელი მინდობითი აღზრდა</option>
            <option value="რეგულარული მინდობითი აღზრდა">რეგულარული მინდობითი აღზრდა</option>
            <option value="მცირე საოჯახო ტიპის სახლი">მცირე საოჯახო ტიპის სახლი</option>
            <option value="რეინტეგრაცია">რეინტეგრაცია</option>
          </select>
        </div>

        {/* Filter 2: Person Status */}
        <div>
          <label className="block font-semibold text-slate-600 mb-1">პიროვნების სტატუსი</label>
          <select
            value={selectedPersonStatus}
            onChange={(e) => {
              setSelectedPersonStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">ყველა სტატუსი</option>
            <option value="ჯანმრთელი">ჯანმრთელი</option>
            <option value="შშმ">შშმ</option>
            <option value="სსმ">სსმ</option>
          </select>
        </div>

        {/* Filter 3: Reminder Status */}
        <div>
          <label className="block font-semibold text-slate-600 mb-1">ვადის მდგომარეობა</label>
          <select
            value={selectedReminderStatus}
            onChange={(e) => {
              setSelectedReminderStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">ყველა მდგომარეობა</option>
            <option value="ვადაგადაცილებული">ვადაგადაცილებული</option>
            <option value="კრიტიკული">კრიტიკული (≤3 დღე)</option>
            <option value="გასაგრძელებელი">გასაგრძელებელი (2 თვე)</option>
            <option value="ნორმალური">ნორმალური</option>
          </select>
        </div>

        {/* Filter 4: Lock state */}
        <div>
          <label className="block font-semibold text-slate-600 mb-1">ქეისის მდგომარეობა</label>
          <select
            value={selectedLockStatus}
            onChange={(e) => {
              setSelectedLockStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">ყველა ქეისი</option>
            <option value="unlocked">ღია ქეისები</option>
            <option value="locked">დაბლოკილი ქეისები</option>
          </select>
        </div>

        {/* Filter 5: Show Archived */}
        <div>
          <label className="block font-semibold text-slate-600 mb-1">არქივი</label>
          <button
            type="button"
            onClick={() => {
              setShowArchived(!showArchived);
              setCurrentPage(1);
            }}
            className={`w-full py-1.5 px-2 rounded-lg text-xs font-semibold border transition cursor-pointer ${
              showArchived
                ? 'bg-slate-800 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
          >
            {showArchived ? 'არქივირებული პირები' : 'აქტიური პირები'}
          </button>
        </div>

        {/* Clear Filters */}
        <div className="flex items-end">
          <button
            onClick={resetFilters}
            className="w-full py-1.5 px-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg text-xs transition cursor-pointer flex items-center justify-center gap-1"
          >
            <X className="w-3.5 h-3.5" />
            <span>ფილტრების გასუფთავება</span>
          </button>
        </div>
      </div>

      {/* Main Database Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-white border-b border-slate-800 font-semibold">
                <th className="py-3 px-3.5">ქეისის №</th>
                <th className="py-3 px-3.5">სახელი, გვარი</th>
                <th className="py-3 px-3.5">პირადი №</th>
                <th className="py-3 px-3.5">დაბადების თარიღი (ასაკი)</th>
                <th className="py-3 px-3.5">ჩარიცხვის თარიღი</th>
                <th className="py-3 px-3.5">სტატუსი</th>
                <th className="py-3 px-3.5">მიმდინარე პროგრამა</th>
                <th className="py-3 px-3.5">პროგრამის დასრულება</th>
                <th className="py-3 px-3.5 text-center">მოქმედება</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {currentSlice.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    მითითებული პარამეტრებით ჩანაწერები ვერ მოიძებნა.
                  </td>
                </tr>
              ) : (
                currentSlice.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => onSelectPerson(p)}
                    className="hover:bg-blue-50/40 transition cursor-pointer group"
                  >
                    <td className="py-3 px-3.5 font-mono font-bold text-blue-700">
                      <div className="flex items-center gap-1.5">
                        <span>{p.case_number}</span>
                        {p.is_locked && <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" title="დაბლოკილია" />}
                      </div>
                    </td>
                    <td className="py-3 px-3.5 font-bold text-slate-900">
                      {p.first_name} {p.last_name}
                    </td>
                    <td className="py-3 px-3.5 font-mono text-slate-700">{p.personal_number}</td>
                    <td className="py-3 px-3.5 text-slate-700">
                      {formatDateToGeorgian(p.birth_date)} ({p.calculated_age} წ)
                    </td>
                    <td className="py-3 px-3.5 text-slate-700">{formatDateToGeorgian(p.admission_date)}</td>
                    <td className="py-3 px-3.5">
                      <StatusBadge type="person_status" value={p.person_status} />
                    </td>
                    <td className="py-3 px-3.5 font-semibold text-slate-800">
                      {p.current_placement?.placement_type || 'არ არის'}
                    </td>
                    <td className="py-3 px-3.5">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900">
                          {formatDateToGeorgian(p.current_placement?.planned_end_date)}
                        </span>
                        <div className="mt-0.5">
                          <StatusBadge type="reminder" value={p.reminder_status || 'ნორმალური'} count={p.days_overdue} />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3.5 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectPerson(p);
                        }}
                        className="p-1.5 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white rounded-lg transition"
                        title="პროფილის ნახვა"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <div>
            ნაშვენებია <span className="font-bold">{currentSlice.length}</span> ჩანაწერი (სულ:{' '}
            <span className="font-bold">{filteredPersons.length}</span>)
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="p-1.5 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold">
              გვერდი {currentPage} / {totalPages}
            </span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="p-1.5 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ბეჭდვის ვერსია (ეკრანზე დამალული) */}
      <PrintableReport title={listTitle} meta={listMeta()} columns={LIST_COLUMNS} rows={listRows} />
    </div>
  );
};
