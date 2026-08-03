// გაზიარებული ანგარიშის ექსპორტი (სტილიზებული Excel) + ბეჭდვის კომპონენტი.
import React from 'react';
import * as XLSX from 'xlsx-js-style';

export interface ReportColumn {
  header: string;
  width?: number; // სიმბოლოების დაახლოებითი სიგანე
}

const ORG_NAME = 'სახელმწიფო ზრუნვისა და ტრეფიკინგის მსხვერპლთა, დაზარალებულთა დახმარების სააგენტო';
const CENTER_NAME = 'კახეთის რეგიონული ცენტრი — მინდობითი აღზრდის პორტალი';

// ---------- ფერები / სტილები ----------
const border = {
  top: { style: 'thin', color: { rgb: '94A3B8' } },
  bottom: { style: 'thin', color: { rgb: '94A3B8' } },
  left: { style: 'thin', color: { rgb: '94A3B8' } },
  right: { style: 'thin', color: { rgb: '94A3B8' } },
};

const titleStyle = {
  font: { bold: true, sz: 15, color: { rgb: '0F172A' } },
  alignment: { horizontal: 'center', vertical: 'center' },
};
const orgStyle = {
  font: { bold: true, sz: 10, color: { rgb: '1E3A8A' } },
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
};
const metaStyle = {
  font: { sz: 9, italic: true, color: { rgb: '475569' } },
  alignment: { horizontal: 'center', vertical: 'center' },
};
const headerStyle = {
  font: { bold: true, sz: 10, color: { rgb: 'FFFFFF' } },
  fill: { fgColor: { rgb: '1E293B' } },
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
  border,
};
const dataStyle = (even: boolean) => ({
  font: { sz: 10, color: { rgb: '0F172A' } },
  alignment: { vertical: 'center', wrapText: true },
  fill: { fgColor: { rgb: even ? 'F1F5F9' : 'FFFFFF' } },
  border,
});

/** სტილიზებული Excel ფაილის გენერაცია და ჩამოტვირთვა. */
export function exportStyledExcel(opts: {
  fileName: string;
  sheetName: string;
  title: string;
  meta: string[];
  columns: ReportColumn[];
  rows: (string | number)[][];
}) {
  const { fileName, sheetName, title, meta, columns, rows } = opts;
  const colCount = columns.length;
  const lastColIdx = colCount - 1;

  const aoa: any[][] = [];
  aoa.push([ORG_NAME]); // 0
  aoa.push([title]); // 1
  meta.forEach((m) => aoa.push([m])); // 2 .. 2+meta.length-1
  aoa.push([]); // blank
  const headerRowIdx = aoa.length;
  aoa.push(columns.map((c) => c.header));
  rows.forEach((r) => aoa.push(r));

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Merges — org / title / meta რიგები მთელ სიგანეზე
  const merges: any[] = [];
  const topRows = 2 + meta.length; // org(1) + title(1) + meta
  for (let r = 0; r < topRows; r++) {
    merges.push({ s: { r, c: 0 }, e: { r, c: lastColIdx } });
  }
  ws['!merges'] = merges;

  // სვეტების სიგანე
  ws['!cols'] = columns.map((c) => ({ wch: c.width || 16 }));

  // რიგების სიმაღლე (header)
  ws['!rows'] = [];
  ws['!rows'][0] = { hpt: 30 };
  ws['!rows'][1] = { hpt: 22 };
  ws['!rows'][headerRowIdx] = { hpt: 30 };

  // სტილების მინიჭება
  const setStyle = (r: number, c: number, style: any) => {
    const addr = XLSX.utils.encode_cell({ r, c });
    if (!ws[addr]) ws[addr] = { t: 's', v: '' };
    ws[addr].s = style;
  };

  setStyle(0, 0, orgStyle);
  setStyle(1, 0, titleStyle);
  for (let i = 0; i < meta.length; i++) setStyle(2 + i, 0, metaStyle);

  // header
  for (let c = 0; c < colCount; c++) setStyle(headerRowIdx, c, headerStyle);

  // data
  for (let r = 0; r < rows.length; r++) {
    for (let c = 0; c < colCount; c++) {
      setStyle(headerRowIdx + 1 + r, c, dataStyle(r % 2 === 1));
    }
  }

  // AutoFilter header-იდან ბოლო რიგამდე
  const firstRef = XLSX.utils.encode_cell({ r: headerRowIdx, c: 0 });
  const lastRef = XLSX.utils.encode_cell({ r: headerRowIdx + rows.length, c: lastColIdx });
  ws['!autofilter'] = { ref: `${firstRef}:${lastRef}` };

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, fileName);
}

// ---------- ბეჭდვის კომპონენტი ----------
export const PrintableReport: React.FC<{
  title: string;
  meta: string[];
  columns: ReportColumn[];
  rows: (string | number)[][];
}> = ({ title, meta, columns, rows }) => {
  return (
    <div className="print-container">
      <div style={{ textAlign: 'center', marginBottom: '10px' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: '#1e3a8a' }}>{ORG_NAME}</div>
        <div style={{ fontSize: '10px', color: '#475569' }}>{CENTER_NAME}</div>
        <h1 style={{ fontSize: '16px', fontWeight: 800, margin: '8px 0 4px', color: '#0f172a' }}>{title}</h1>
        {meta.map((m, i) => (
          <div key={i} style={{ fontSize: '10px', color: '#475569' }}>{m}</div>
        ))}
      </div>
      <table>
        <thead>
          <tr>
            {columns.map((c, i) => (
              <th key={i}>{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri}>
              {r.map((cell, ci) => (
                <td key={ci}>{cell === undefined || cell === null ? '' : String(cell)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#334155' }}>
        <span>დაბეჭდვის თარიღი: {new Date().toLocaleString('ka-GE')}</span>
        <span>სულ ჩანაწერი: {rows.length}</span>
      </div>
    </div>
  );
};
