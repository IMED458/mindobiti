import React, { useState } from 'react';
import { FileSpreadsheet, Download, Printer } from 'lucide-react';
import { Person } from '../types';
import { formatDateToGeorgian } from '../utils';
import { exportStyledExcel, PrintableReport, ReportColumn } from '../lib/reportExport';

interface ReportsViewProps {
  persons: Person[];
}

const REPORT_COLUMNS: ReportColumn[] = [
  { header: 'ქეისის №', width: 15 },
  { header: 'სახელი', width: 12 },
  { header: 'გვარი', width: 14 },
  { header: 'პირადი ნომერი', width: 14 },
  { header: 'დაბადების თარიღი', width: 14 },
  { header: 'ასაკი', width: 6 },
  { header: 'ჩარიცხვის თარიღი', width: 14 },
  { header: 'ჩარიცხვის წყარო', width: 22 },
  { header: 'სტატუსი', width: 10 },
  { header: 'მიმდინარე პროგრამა', width: 26 },
  { header: 'პროგრამის დაწყება', width: 14 },
  { header: 'პროგრამის დასრულება', width: 15 },
  { header: 'ვადის მდგომარეობა', width: 16 },
];

export const ReportsView: React.FC<ReportsViewProps> = ({ persons }) => {
  const [placementFilter, setPlacementFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [caseStatusFilter, setCaseStatusFilter] = useState<string>('active');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Filter logic
  const filteredData = persons.filter((p) => {
    if (caseStatusFilter === 'active' && p.case_status !== 'აქტიური') return false;
    if (caseStatusFilter === 'archived' && p.case_status !== 'არქივირებული') return false;

    if (placementFilter !== 'all' && p.current_placement?.placement_type !== placementFilter) {
      return false;
    }

    if (statusFilter !== 'all' && p.person_status !== statusFilter) {
      return false;
    }

    if (startDate && p.admission_date < startDate) return false;
    if (endDate && p.admission_date > endDate) return false;

    return true;
  });

  // მწკრივების აგება (ერთი წყარო Excel-სა და ბეჭდვისთვის)
  const reportRows: (string | number)[][] = filteredData.map((p) => [
    p.case_number,
    p.first_name,
    p.last_name,
    p.personal_number,
    formatDateToGeorgian(p.birth_date),
    p.calculated_age ?? '',
    formatDateToGeorgian(p.admission_date),
    p.admission_source,
    p.person_status,
    p.current_placement?.placement_type || 'არ არის',
    formatDateToGeorgian(p.current_placement?.start_date),
    formatDateToGeorgian(p.current_placement?.planned_end_date),
    p.reminder_status || 'ნორმალური',
  ]);

  const metaLines = () => {
    const caseLbl = caseStatusFilter === 'active' ? 'აქტიური ქეისები' : caseStatusFilter === 'archived' ? 'არქივირებული ქეისები' : 'ყველა ქეისი';
    const lines = [
      `ფილტრი: ${caseLbl} · პროგრამა: ${placementFilter === 'all' ? 'ყველა' : placementFilter} · სტატუსი: ${statusFilter === 'all' ? 'ყველა' : statusFilter}`,
    ];
    if (startDate || endDate) {
      lines.push(`ჩარიცხვის პერიოდი: ${startDate ? formatDateToGeorgian(startDate) : '—'} – ${endDate ? formatDateToGeorgian(endDate) : '—'}`);
    }
    lines.push(`გენერირების თარიღი: ${new Date().toLocaleString('ka-GE')} · სულ ჩანაწერი: ${filteredData.length}`);
    return lines;
  };

  const reportTitle = 'მინდობითი აღზრდის სტატისტიკური ანგარიში';

  // Excel Export (სტილიზებული)
  const handleExportExcel = () => {
    exportStyledExcel({
      fileName: `Mindobiti_Angarishi_${new Date().toISOString().split('T')[0]}.xlsx`,
      sheetName: 'ანგარიში',
      title: reportTitle,
      meta: metaLines(),
      columns: REPORT_COLUMNS,
      rows: reportRows,
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
            <span>ანგარიშები და სტატისტიკური ექსპორტი</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            სტატისტიკური რეპორტების გენერირება, გაფილტვრა და Excel/ბეჭდვის ფორმატებში ჩამოტვირთვა.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Excel-ში ჩამოტვირთვა</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-xl transition flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>ბეჭდვა</span>
          </button>
        </div>
      </div>

      {/* Filter Options */}
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
        <div>
          <label className="block font-semibold text-slate-700 mb-1">პროგრამის ტიპი</label>
          <select
            value={placementFilter}
            onChange={(e) => setPlacementFilter(e.target.value)}
            className="w-full p-2 bg-white border border-slate-300 rounded-lg"
          >
            <option value="all">ყველა პროგრამა</option>
            <option value="გადაუდებელი მინდობითი აღზრდა">გადაუდებელი მინდობითი აღზრდა</option>
            <option value="რეგულარული მინდობითი აღზრდა">რეგულარული მინდობითი აღზრდა</option>
            <option value="მცირე საოჯახო ტიპის სახლი">მცირე საოჯახო ტიპის სახლი</option>
            <option value="რეინტეგრაცია">რეინტეგრაცია</option>
          </select>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">პიროვნების სტატუსი</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full p-2 bg-white border border-slate-300 rounded-lg"
          >
            <option value="all">ყველა სტატუსი</option>
            <option value="ჯანმრთელი">ჯანმრთელი</option>
            <option value="შშმ">შშმ</option>
            <option value="სსმ">სსმ</option>
          </select>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">ჩარიცხვის თარიღი (დან)</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full p-2 bg-white border border-slate-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">ჩარიცხვის თარიღი (მდე)</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full p-2 bg-white border border-slate-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">ქეისების ტიპი</label>
          <select
            value={caseStatusFilter}
            onChange={(e) => setCaseStatusFilter(e.target.value)}
            className="w-full p-2 bg-white border border-slate-300 rounded-lg"
          >
            <option value="active">აქტიური ქეისები</option>
            <option value="archived">არქივირებული ქეისები</option>
            <option value="all">ყველა</option>
          </select>
        </div>
      </div>

      {/* Preview Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 bg-slate-900 text-white font-bold text-xs flex justify-between items-center">
          <span>ანგარიშის წინასწარი გადახედვა (სულ ჩანაწერი: {filteredData.length})</span>
          <span className="text-slate-400 font-mono">თარიღის ფორმატი: DD/MM/YYYY</span>
        </div>
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100 text-slate-800 font-semibold border-b border-slate-200">
              <th className="py-2.5 px-3">ქეისი №</th>
              <th className="py-2.5 px-3">სახელი, გვარი</th>
              <th className="py-2.5 px-3">პირადი №</th>
              <th className="py-2.5 px-3">დაბადება</th>
              <th className="py-2.5 px-3">ჩარიცხვა</th>
              <th className="py-2.5 px-3">სტატუსი</th>
              <th className="py-2.5 px-3">პროგრამა</th>
              <th className="py-2.5 px-3">დასრულება</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredData.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{p.case_number}</td>
                <td className="py-2.5 px-3 font-bold text-slate-900">
                  {p.first_name} {p.last_name}
                </td>
                <td className="py-2.5 px-3 font-mono text-slate-700">{p.personal_number}</td>
                <td className="py-2.5 px-3">{formatDateToGeorgian(p.birth_date)}</td>
                <td className="py-2.5 px-3">{formatDateToGeorgian(p.admission_date)}</td>
                <td className="py-2.5 px-3">{p.person_status}</td>
                <td className="py-2.5 px-3 font-semibold">{p.current_placement?.placement_type}</td>
                <td className="py-2.5 px-3 font-bold text-blue-800">
                  {formatDateToGeorgian(p.current_placement?.planned_end_date)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ბეჭდვის ვერსია (ეკრანზე დამალული) */}
      <PrintableReport title={reportTitle} meta={metaLines()} columns={REPORT_COLUMNS} rows={reportRows} />
    </div>
  );
};
