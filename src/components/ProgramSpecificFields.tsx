// გაზიარებული პროგრამა-სპეციფიკური ველები — გამოიყენება ერთდროულად
// რეგისტრაციაშიც (RegisterPersonView) და გადაყვანაშიც (PersonDetailView).
// ამით გარანტირებულია, რომ ორივე ადგილას ზუსტად ერთი და იგივე ველები იხსნება.
import React from 'react';
import { PlacementType, SmallFamilyHome, ContactPerson } from '../types';

export interface ProgramData {
  // Foster (გადაუდებელი / რეგულარული / ნათესაური)
  fosterName: string;
  fosterPersonalNumber: string;
  fosterPhone: string;
  fosterAddress: string;
  contractNumber: string;
  contractDate: string;
  // ნათესაური
  kinshipRelation: string;
  kinshipDecisionNumber: string;
  // მცირე საოჯახო სახლი
  selectedSmallHomeId: string;
  smallHomeOrderNumber: string;
  // რეინტეგრაცია
  bioParentName: string;
  bioRelation: string;
  allowanceAmount: string;
}

export function emptyProgramData(): ProgramData {
  const today = new Date().toISOString().split('T')[0];
  return {
    fosterName: '',
    fosterPersonalNumber: '',
    fosterPhone: '',
    fosterAddress: '',
    contractNumber: '',
    contractDate: today,
    kinshipRelation: 'ბებია/ბაბუა',
    kinshipDecisionNumber: '',
    selectedSmallHomeId: '',
    smallHomeOrderNumber: '',
    bioParentName: '',
    bioRelation: 'დედა',
    allowanceAmount: '',
  };
}

/** ვალიდაცია — აბრუნებს შეცდომის ტექსტს ან null-ს. */
export function validateProgram(program: PlacementType, d: ProgramData): string | null {
  if (program === 'გადაუდებელი მინდობითი აღზრდა' || program === 'რეგულარული მინდობითი აღზრდა') {
    if (!d.fosterName.trim()) return 'გთხოვთ, მიუთითოთ მიმღები მშობლის სახელი და გვარი.';
  } else if (program === 'ნათესაური მინდობითი აღზრდა') {
    if (!d.fosterName.trim()) return 'გთხოვთ, მიუთითოთ ნათესავი აღმზრდელის სახელი და გვარი.';
  } else if (program === 'მცირე საოჯახო ტიპის სახლი') {
    if (!d.selectedSmallHomeId) return 'გთხოვთ, აირჩიოთ მცირე საოჯახო ტიპის სახლი.';
  } else if (program === 'რეინტეგრაცია') {
    if (!d.bioParentName.trim()) return 'გთხოვთ, მიუთითოთ ბიოლოგიური ოჯახის წევრის სახელი და გვარი.';
  }
  return null;
}

/** განთავსების (placement) დამატებითი ველების აგება პროგრამის მიხედვით. */
export function buildPlacementPatch(
  program: PlacementType,
  d: ProgramData,
  smallHomes: SmallFamilyHome[]
): Record<string, any> {
  const patch: Record<string, any> = {};
  if (program === 'გადაუდებელი მინდობითი აღზრდა' || program === 'რეგულარული მინდობითი აღზრდა') {
    patch.foster_parent_name = d.fosterName;
    patch.foster_parent_personal_number = d.fosterPersonalNumber;
    patch.foster_parent_phone = d.fosterPhone;
    patch.foster_parent_address = d.fosterAddress;
    patch.contract_number = d.contractNumber;
    patch.contract_date = d.contractDate;
    patch.location_or_organization = `მინდობითი ოჯახი: ${d.fosterName}`;
  } else if (program === 'ნათესაური მინდობითი აღზრდა') {
    patch.foster_parent_name = d.fosterName;
    patch.foster_parent_personal_number = d.fosterPersonalNumber;
    patch.foster_parent_phone = d.fosterPhone;
    patch.foster_parent_address = d.fosterAddress;
    patch.kinship_relation = d.kinshipRelation;
    patch.kinship_decision_number = d.kinshipDecisionNumber;
    patch.location_or_organization = `ნათესაური ოჯახი (${d.kinshipRelation}): ${d.fosterName}`;
  } else if (program === 'მცირე საოჯახო ტიპის სახლი') {
    const home = smallHomes.find((h) => h.id === d.selectedSmallHomeId);
    patch.small_home_id = d.selectedSmallHomeId;
    patch.small_home_name = home?.name || 'მცირე საოჯახო სახლი';
    patch.small_home_address = home?.address || '';
    patch.small_home_order_number = d.smallHomeOrderNumber;
    patch.responsible_person = home?.responsible_person || '';
    patch.location_or_organization = home?.name || 'მცირე საოჯახო სახლი';
  } else if (program === 'რეინტეგრაცია') {
    patch.bio_family_member_name = d.bioParentName;
    patch.bio_family_relation = d.bioRelation;
    patch.reintegration_allowance = d.allowanceAmount ? Number(d.allowanceAmount) : undefined;
    patch.location_or_organization = `ბიოლოგიური ოჯახი (${d.bioRelation}): ${d.bioParentName}`;
  }
  return patch;
}

/** კონტაქტ პირის აგება პროგრამის მიხედვით. */
export function buildContactPerson(
  program: PlacementType,
  d: ProgramData,
  smallHomes: SmallFamilyHome[]
): ContactPerson {
  if (program === 'მცირე საოჯახო ტიპის სახლი') {
    const home = smallHomes.find((h) => h.id === d.selectedSmallHomeId);
    return {
      first_name: 'მცირე საოჯახო სახლი',
      last_name: home ? home.name : 'სახლი',
      personal_number: '00000000000',
      phone: home?.phone || '',
    };
  }
  if (program === 'რეინტეგრაცია') {
    const parts = d.bioParentName.trim().split(' ');
    return {
      first_name: parts[0] || 'ბიოლოგიური',
      last_name: parts.slice(1).join(' ') || 'მშობელი',
      personal_number: '00000000000',
      phone: d.fosterPhone || '',
    };
  }
  // foster / kinship
  const parts = d.fosterName.trim().split(' ');
  return {
    first_name: parts[0] || '',
    last_name: parts.slice(1).join(' ') || parts[0] || '',
    personal_number: d.fosterPersonalNumber || '00000000000',
    phone: d.fosterPhone || '',
  };
}

interface Props {
  program: PlacementType;
  data: ProgramData;
  onChange: (patch: Partial<ProgramData>) => void;
  smallHomes: SmallFamilyHome[];
}

const inputCls = 'w-full p-2.5 border border-slate-300 rounded-xl';

export const ProgramSpecificFields: React.FC<Props> = ({ program, data, onChange, smallHomes }) => {
  const set = (patch: Partial<ProgramData>) => onChange(patch);

  if (program === 'გადაუდებელი მინდობითი აღზრდა' || program === 'რეგულარული მინდობითი აღზრდა') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
        <div>
          <label className="block font-semibold text-slate-700 mb-1">მიმღები მშობლის სახელი და გვარი *</label>
          <input type="text" value={data.fosterName} onChange={(e) => set({ fosterName: e.target.value })}
            placeholder="მაგ: მარიამ ნათენაძე" className={inputCls} />
        </div>
        <div>
          <label className="block font-semibold text-slate-700 mb-1">მიმღები მშობლის პირადი № (11 ციფრი)</label>
          <input type="text" maxLength={11} value={data.fosterPersonalNumber}
            onChange={(e) => set({ fosterPersonalNumber: e.target.value.replace(/\D/g, '') })}
            placeholder="20001012345" className={`${inputCls} font-mono`} />
        </div>
        <div>
          <label className="block font-semibold text-slate-700 mb-1">ტელეფონის ნომერი</label>
          <input type="text" value={data.fosterPhone} onChange={(e) => set({ fosterPhone: e.target.value })}
            placeholder="599 00 00 00" className={inputCls} />
        </div>
        <div>
          <label className="block font-semibold text-slate-700 mb-1">ფაქტობრივი მისამართი</label>
          <input type="text" value={data.fosterAddress} onChange={(e) => set({ fosterAddress: e.target.value })}
            placeholder="ქ. თელავი, რუსთაველის №5" className={inputCls} />
        </div>
        <div>
          <label className="block font-semibold text-slate-700 mb-1">ხელშეკრულების ნომერი</label>
          <input type="text" value={data.contractNumber} onChange={(e) => set({ contractNumber: e.target.value })}
            placeholder="ხელშ. №123-2026" className={inputCls} />
        </div>
        <div>
          <label className="block font-semibold text-slate-700 mb-1">ხელშეკრულების თარიღი</label>
          <input type="date" value={data.contractDate} onChange={(e) => set({ contractDate: e.target.value })}
            className={inputCls} />
        </div>
      </div>
    );
  }

  if (program === 'ნათესაური მინდობითი აღზრდა') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
        <div>
          <label className="block font-semibold text-slate-700 mb-1">ნათესავი აღმზრდელის სახელი და გვარი *</label>
          <input type="text" value={data.fosterName} onChange={(e) => set({ fosterName: e.target.value })}
            placeholder="მაგ: ნინო ბერიძე" className={inputCls} />
        </div>
        <div>
          <label className="block font-semibold text-slate-700 mb-1">ნათესაური კავშირი ბავშვთან *</label>
          <select value={data.kinshipRelation} onChange={(e) => set({ kinshipRelation: e.target.value })}
            className={`${inputCls} font-medium`}>
            <option value="ბებია/ბაბუა">ბებია / ბაბუა</option>
            <option value="დეიდა/მამიდა">დეიდა / მამიდა</option>
            <option value="ბიძა">ბიძა</option>
            <option value="და/ძმა">და / ძმა</option>
            <option value="სხვა ნათესავი">სხვა ნათესავი</option>
          </select>
        </div>
        <div>
          <label className="block font-semibold text-slate-700 mb-1">პირადი № (11 ციფრი)</label>
          <input type="text" maxLength={11} value={data.fosterPersonalNumber}
            onChange={(e) => set({ fosterPersonalNumber: e.target.value.replace(/\D/g, '') })}
            placeholder="10001098765" className={`${inputCls} font-mono`} />
        </div>
        <div>
          <label className="block font-semibold text-slate-700 mb-1">ტელეფონის ნომერი</label>
          <input type="text" value={data.fosterPhone} onChange={(e) => set({ fosterPhone: e.target.value })}
            placeholder="599 11 22 33" className={inputCls} />
        </div>
        <div>
          <label className="block font-semibold text-slate-700 mb-1">მისამართი</label>
          <input type="text" value={data.fosterAddress} onChange={(e) => set({ fosterAddress: e.target.value })}
            placeholder="სოფ. ყვარელი" className={inputCls} />
        </div>
        <div>
          <label className="block font-semibold text-slate-700 mb-1">გადაწყვეტილების/ბრძანების №</label>
          <input type="text" value={data.kinshipDecisionNumber} onChange={(e) => set({ kinshipDecisionNumber: e.target.value })}
            placeholder="ბრძ. №45-ნ" className={inputCls} />
        </div>
      </div>
    );
  }

  if (program === 'მცირე საოჯახო ტიპის სახლი') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div>
          <label className="block font-semibold text-slate-700 mb-1">მცირე საოჯახო სახლის არჩევა *</label>
          <select value={data.selectedSmallHomeId} onChange={(e) => set({ selectedSmallHomeId: e.target.value })}
            className={`${inputCls} font-medium`}>
            <option value="">-- აირჩიეთ მცირე საოჯახო სახლი --</option>
            {smallHomes.map((h) => (
              <option key={h.id} value={h.id}>{h.name} ({h.address})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-semibold text-slate-700 mb-1">ჩარიცხვის ბრძანების ნომერი</label>
          <input type="text" value={data.smallHomeOrderNumber} onChange={(e) => set({ smallHomeOrderNumber: e.target.value })}
            placeholder="ბრძ. №89/ს" className={inputCls} />
        </div>
      </div>
    );
  }

  if (program === 'რეინტეგრაცია') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
        <div>
          <label className="block font-semibold text-slate-700 mb-1">ბიოლოგიური ოჯახის წევრის სახელი და გვარი *</label>
          <input type="text" value={data.bioParentName} onChange={(e) => set({ bioParentName: e.target.value })}
            placeholder="მაგ: ნათია ჭავჭავაძე" className={inputCls} />
        </div>
        <div>
          <label className="block font-semibold text-slate-700 mb-1">ნათესაური კავშირი</label>
          <select value={data.bioRelation} onChange={(e) => set({ bioRelation: e.target.value })}
            className={`${inputCls} font-medium`}>
            <option value="დედა">დედა</option>
            <option value="მამა">მამა</option>
            <option value="დედ-მამა">დედ-მამა</option>
          </select>
        </div>
        <div>
          <label className="block font-semibold text-slate-700 mb-1">ფინანსური დახმარების ოდენობა (ლარი/თვე)</label>
          <input type="number" value={data.allowanceAmount} onChange={(e) => set({ allowanceAmount: e.target.value })}
            placeholder="მაგ: 300" className={`${inputCls} font-bold`} />
        </div>
      </div>
    );
  }

  return null;
};
