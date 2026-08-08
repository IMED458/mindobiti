import React, { useState, useEffect } from 'react';
import {
  UserPlus,
  User,
  FileText,
  CheckCircle2,
  AlertCircle,
  Building2,
  Home,
  HeartHandshake,
  ShieldAlert,
} from 'lucide-react';
import { PersonStatus, PlacementType, SmallFamilyHome, FosterParent } from '../types';
import { api } from '../api';
import { addDaysISO } from '../utils';
import {
  ProgramData,
  ProgramSpecificFields,
  emptyProgramData,
  validateProgram,
  buildPlacementPatch,
  buildContactPerson,
} from '../components/ProgramSpecificFields';

interface RegisterPersonViewProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const RegisterPersonView: React.FC<RegisterPersonViewProps> = ({ onSuccess, onCancel }) => {
  const today = new Date().toISOString().split('T')[0];

  const [smallHomes, setSmallHomes] = useState<SmallFamilyHome[]>([]);
  const [fosterParents, setFosterParents] = useState<FosterParent[]>([]);

  // Person State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [personalNumber, setPersonalNumber] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [admissionDate, setAdmissionDate] = useState(today);
  const [admissionReason, setAdmissionReason] = useState('');
  const [admissionSource, setAdmissionSource] = useState('კახეთის რეგიონული ცენტრი');
  const [personStatus, setPersonStatus] = useState<PersonStatus>('ჯანმრთელი');
  const [caseManager, setCaseManager] = useState('');

  // სამშვილებლო სტატუსი
  const [adoptionStatus, setAdoptionStatus] = useState<'' | 'გასაშვილებელი' | 'გაშვილებული'>('');
  const [af, setAf] = useState({
    first_name: '', last_name: '', personal_number: '', passport_number: '',
    spouse_name: '', spouse_personal_number: '', spouse_passport_number: '',
    address: '', phone: '', decision_number: '', adoption_date: '',
  });

  // Program Selection (Mandatory)
  const [selectedProgram, setSelectedProgram] = useState<PlacementType | ''>('');
  const [plannedEndDate, setPlannedEndDate] = useState('');

  // Program-specific dynamic fields (გაზიარებული)
  const [progData, setProgData] = useState<ProgramData>(emptyProgramData());

  // Status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getSmallHomes().then(setSmallHomes).catch(() => {});
    api.getFosterParents().then(setFosterParents).catch(() => {});
  }, []);

  // When selectedProgram or admissionDate changes, suggest a default planned_end_date (editable)
  useEffect(() => {
    if (!admissionDate) return;
    if (selectedProgram === 'გადაუდებელი მინდობითი აღზრდა') {
      setPlannedEndDate(addDaysISO(admissionDate, 90));
    } else if (selectedProgram) {
      setPlannedEndDate(addDaysISO(admissionDate, 365));
    }
  }, [selectedProgram, admissionDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName || !lastName) {
      setError('გთხოვთ, შეავსოთ პირის სახელი და გვარი.');
      return;
    }
    if (!personalNumber || personalNumber.length !== 11 || !/^\d+$/.test(personalNumber)) {
      setError('პირადი ნომერი უნდა შედგებოდეს ზუსტად 11 ციფრისგან.');
      return;
    }
    if (!birthDate) {
      setError('გთხოვთ, მიუთითოთ დაბადების თარიღი.');
      return;
    }
    if (!selectedProgram) {
      setError('სოციალური პროგრამის არჩევა სავალდებულოა! გთხოვთ, აირჩიოთ პროგრამა.');
      return;
    }
    if (!plannedEndDate) {
      setError('გთხოვთ, მიუთითოთ პროგრამის დაგეგმილი დასრულების თარიღი.');
      return;
    }

    const progError = validateProgram(selectedProgram, progData);
    if (progError) {
      setError(progError);
      return;
    }

    if (adoptionStatus === 'გაშვილებული' && (!af.first_name || !af.last_name)) {
      setError('გაშვილებულ ბავშვზე აუცილებელია მშვილებელი ოჯახის მონაცემები (სახელი და გვარი).');
      return;
    }

    const adoptiveFamily =
      adoptionStatus === 'გაშვილებული'
        ? {
            first_name: af.first_name, last_name: af.last_name,
            personal_number: af.personal_number, passport_number: af.passport_number,
            spouse_name: af.spouse_name || undefined,
            spouse_personal_number: af.spouse_personal_number || undefined,
            spouse_passport_number: af.spouse_passport_number || undefined,
            address: af.address || undefined, phone: af.phone || undefined,
            decision_number: af.decision_number || undefined,
            adoption_date: af.adoption_date || undefined,
          }
        : undefined;

    const initialPlacement: any = {
      placement_type: selectedProgram,
      start_date: admissionDate,
      planned_end_date: plannedEndDate,
      reason: admissionReason || 'პირველადი ჩარიცხვა',
      ...buildPlacementPatch(selectedProgram, progData, smallHomes),
    };
    const contactPerson = buildContactPerson(selectedProgram, progData, smallHomes);

    setLoading(true);
    setError(null);
    try {
      await api.createPerson({
        first_name: firstName,
        last_name: lastName,
        personal_number: personalNumber,
        birth_date: birthDate,
        admission_date: admissionDate,
        admission_reason: admissionReason,
        admission_source: admissionSource,
        person_status: personStatus,
        contact_person: contactPerson,
        case_manager: caseManager || undefined,
        adoption_status: adoptionStatus || undefined,
        adoptive_family: adoptiveFamily,
        initial_placement: initialPlacement,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'რეგისტრაციისას დაფიქსირდა შეცდომა');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Page Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-blue-600" />
            <span>ახალი პირის რეგისტრაცია</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            შეიყვანეთ ბენეფიციარის მონაცემები და აირჩიეთ სავალდებულო სოციალური პროგრამა.
          </p>
        </div>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl cursor-pointer"
        >
          გაუქმება
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: Person Personal Info */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
            <User className="w-4 h-4 text-blue-600" />
            <span>1. ბენეფიციარის პერსონალური მონაცემები</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">სახელი *</label>
              <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)}
                placeholder="მაგ: გიორგი" required className="w-full p-2.5 border border-slate-300 rounded-xl" />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">გვარი *</label>
              <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)}
                placeholder="მაგ: ბერიძე" required className="w-full p-2.5 border border-slate-300 rounded-xl" />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">პირადი ნომერი (11 ციფრი) *</label>
              <input type="text" maxLength={11} value={personalNumber}
                onChange={(e) => setPersonalNumber(e.target.value.replace(/\D/g, ''))}
                placeholder="01001012345" required
                className="w-full p-2.5 border border-slate-300 rounded-xl font-mono font-bold" />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">დაბადების თარიღი *</label>
              <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)}
                required className="w-full p-2.5 border border-slate-300 rounded-xl" />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">ჩარიცხვის თარიღი *</label>
              <input type="date" value={admissionDate} onChange={(e) => setAdmissionDate(e.target.value)}
                required className="w-full p-2.5 border border-slate-300 rounded-xl" />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">პიროვნების სტატუსი *</label>
              <select value={personStatus} onChange={(e) => setPersonStatus(e.target.value as PersonStatus)}
                className="w-full p-2.5 border border-slate-300 rounded-xl font-medium">
                <option value="ჯანმრთელი">ჯანმრთელი</option>
                <option value="შშმ">შშმ (შეზღუდული შესაძლებლობა)</option>
                <option value="სსმ">სსმ (სპეციალური საჭიროება)</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">ჩარიცხვის წყარო *</label>
              <input type="text" value={admissionSource} onChange={(e) => setAdmissionSource(e.target.value)}
                placeholder="მაგ: თელავის სოციალური მომსახურების სააგენტო" required
                className="w-full p-2.5 border border-slate-300 rounded-xl" />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">ჩარიცხვის საფუძველი / მიზეზი *</label>
              <input type="text" value={admissionReason} onChange={(e) => setAdmissionReason(e.target.value)}
                placeholder="მიუთითეთ ჩარიცხვის ოფიციალური საფუძველი" required
                className="w-full p-2.5 border border-slate-300 rounded-xl" />
            </div>
          </div>
        </div>

        {/* SECTION 1b: ქეის მენეჯერი და სამშვილებლო სტატუსი */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-600" />
            <span>ქეის მენეჯერი და სამშვილებლო სტატუსი</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">ქეის მენეჯერი (სოციალური მუშაკი)</label>
              <input type="text" value={caseManager} onChange={(e) => setCaseManager(e.target.value)}
                placeholder="მაგ: ნინო ბერიძე" className="w-full p-2.5 border border-slate-300 rounded-xl" />
              <p className="text-[10px] text-slate-500 mt-1">ვინ მართავს ამ საქმეს.</p>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">სამშვილებლო სტატუსი</label>
              <select value={adoptionStatus} onChange={(e) => setAdoptionStatus(e.target.value as any)}
                className="w-full p-2.5 border border-slate-300 rounded-xl font-medium">
                <option value="">— არ არის —</option>
                <option value="გასაშვილებელი">გასაშვილებელი</option>
                <option value="გაშვილებული">გაშვილებული</option>
              </select>
            </div>
          </div>

          {adoptionStatus === 'გასაშვილებელი' && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
              „გასაშვილებელი" ბავშვზე მიეთითება მხოლოდ ქეის მენეჯერი (იხ. ზემოთ). გაშვილების შემდეგ სტატუსი პროფილიდან შეიცვლება „გაშვილებულ"-ზე.
            </div>
          )}

          {adoptionStatus === 'გაშვილებული' && (
            <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-xl space-y-3">
              <p className="font-bold text-blue-900 text-xs">მშვილებელი ოჯახის საპასპორტე მონაცემები</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">მშვილებლის სახელი *</label>
                  <input type="text" value={af.first_name} onChange={(e) => setAf({ ...af, first_name: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-xl" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">მშვილებლის გვარი *</label>
                  <input type="text" value={af.last_name} onChange={(e) => setAf({ ...af, last_name: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-xl" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">პირადი ნომერი</label>
                  <input type="text" maxLength={11} value={af.personal_number} onChange={(e) => setAf({ ...af, personal_number: e.target.value.replace(/\D/g, '') })} className="w-full p-2.5 border border-slate-300 rounded-xl font-mono" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">პასპორტის ნომერი</label>
                  <input type="text" value={af.passport_number} onChange={(e) => setAf({ ...af, passport_number: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-xl font-mono" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">მეუღლის სახელი და გვარი</label>
                  <input type="text" value={af.spouse_name} onChange={(e) => setAf({ ...af, spouse_name: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-xl" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">მეუღლის პირადი №</label>
                  <input type="text" maxLength={11} value={af.spouse_personal_number} onChange={(e) => setAf({ ...af, spouse_personal_number: e.target.value.replace(/\D/g, '') })} className="w-full p-2.5 border border-slate-300 rounded-xl font-mono" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">მეუღლის პასპორტის №</label>
                  <input type="text" value={af.spouse_passport_number} onChange={(e) => setAf({ ...af, spouse_passport_number: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-xl font-mono" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ტელეფონი</label>
                  <input type="text" value={af.phone} onChange={(e) => setAf({ ...af, phone: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-xl" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">მისამართი</label>
                  <input type="text" value={af.address} onChange={(e) => setAf({ ...af, address: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-xl" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">გადაწყვეტილების/ბრძანების №</label>
                  <input type="text" value={af.decision_number} onChange={(e) => setAf({ ...af, decision_number: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-xl" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">გაშვილების თარიღი</label>
                  <input type="date" value={af.adoption_date} onChange={(e) => setAf({ ...af, adoption_date: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-xl" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 2: Mandatory Program Selection */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <span>2. სოციალური პროგრამის არჩევა (სავალდებულო) *</span>
            </span>
            <span className="text-xs text-rose-600 font-bold">* აუცილებელია არჩევა</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            {[
              { id: 'გადაუდებელი მინდობითი აღზრდა', title: 'გადაუდებელი მინდობითი აღზრდა', desc: 'სწრაფი განთავსება 90 დღემდე', icon: ShieldAlert },
              { id: 'რეგულარული მინდობითი აღზრდა', title: 'რეგულარული მინდობითი აღზრდა', desc: 'ხანგრძლივი მინდობითი ოჯახი', icon: HeartHandshake },
              { id: 'ნათესაური მინდობითი აღზრდა', title: 'ნათესაური მინდობითი აღზრდა', desc: 'განთავსება ნათესავთან (ბებია, დეიდა...)', icon: HeartHandshake },
              { id: 'მცირე საოჯახო ტიპის სახლი', title: 'მცირე საოჯახო ტიპის სახლი', desc: 'სპეციალიზებული საცხოვრებელი', icon: Home },
              { id: 'რეინტეგრაცია', title: 'რეინტეგრაცია', desc: 'დაბრუნება ბიოლოგიურ ოჯახში', icon: User },
            ].map((prog) => {
              const Icon = prog.icon;
              const isSelected = selectedProgram === prog.id;
              return (
                <button type="button" key={prog.id}
                  onClick={() => setSelectedProgram(prog.id as PlacementType)}
                  className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between space-y-2 ${
                    isSelected ? 'border-blue-600 bg-blue-50/80 ring-2 ring-blue-500/30' : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/80'
                  }`}>
                  <div className="flex items-center justify-between">
                    <div className="p-2 bg-white rounded-xl shadow-2xs text-blue-600"><Icon className="w-5 h-5" /></div>
                    {isSelected && <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-xs">{prog.title}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{prog.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {selectedProgram && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">დაგეგმილი დასრულების თარიღი (ხელით შეყვანა) *</label>
                  <input type="date" value={plannedEndDate} onChange={(e) => setPlannedEndDate(e.target.value)}
                    required className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-bold text-blue-900" />
                  <p className="text-[10px] text-slate-500 mt-1">
                    * პროგრამის დასრულების თარიღი შეგიძლიათ მიუთითოთ ან შეცვალოთ ხელით.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 3: Dynamic Program Specific Fields (გაზიარებული) */}
        {selectedProgram && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-600" />
              <span>3. პროგრამის სპეციფიკური ველები ({selectedProgram})</span>
            </h3>
            <ProgramSpecificFields
              program={selectedProgram}
              data={progData}
              onChange={(patch) => setProgData((prev) => ({ ...prev, ...patch }))}
              smallHomes={smallHomes}
              fosterParents={fosterParents}
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button type="button" onClick={onCancel}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition cursor-pointer">
            გაუქმება
          </button>
          <button type="submit" disabled={loading}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer disabled:opacity-50 flex items-center gap-2">
            {loading ? 'რეგისტრირდება...' : 'რეგისტრაცია და ქეისის შექმნა'}
          </button>
        </div>
      </form>
    </div>
  );
};
