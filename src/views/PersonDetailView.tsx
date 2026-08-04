import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  Unlock,
  Edit,
  Clock,
  ArrowRightLeft,
  Archive,
  UserCheck,
  AlertCircle,
  Building,
  ShieldAlert,
  HeartHandshake,
  Home,
  User as UserIcon,
  CheckCircle2,
} from 'lucide-react';
import { Person, User, PlacementType, PersonStatus, SmallFamilyHome, FosterParent } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { formatDateToGeorgian, addDaysISO } from '../utils';
import { api } from '../api';
import {
  ProgramData,
  ProgramSpecificFields,
  emptyProgramData,
  validateProgram,
  buildPlacementPatch,
  buildContactPerson,
} from '../components/ProgramSpecificFields';

const PROGRAM_OPTIONS: { id: PlacementType; title: string; desc: string; icon: any }[] = [
  { id: 'გადაუდებელი მინდობითი აღზრდა', title: 'გადაუდებელი მინდობითი აღზრდა', desc: 'სწრაფი განთავსება 90 დღემდე', icon: ShieldAlert },
  { id: 'რეგულარული მინდობითი აღზრდა', title: 'რეგულარული მინდობითი აღზრდა', desc: 'ხანგრძლივი მინდობითი ოჯახი', icon: HeartHandshake },
  { id: 'ნათესაური მინდობითი აღზრდა', title: 'ნათესაური მინდობითი აღზრდა', desc: 'განთავსება ნათესავთან', icon: HeartHandshake },
  { id: 'მცირე საოჯახო ტიპის სახლი', title: 'მცირე საოჯახო ტიპის სახლი', desc: 'საოჯახო ტიპის სახლი', icon: Home },
  { id: 'რეინტეგრაცია', title: 'რეინტეგრაცია', desc: 'ბიოლოგიურ ოჯახში დაბრუნება', icon: UserIcon },
];

function defaultEndDate(type: PlacementType, startDate: string): string {
  const base = startDate || new Date().toISOString().split('T')[0];
  return type === 'გადაუდებელი მინდობითი აღზრდა' ? addDaysISO(base, 90) : addDaysISO(base, 365);
}

interface PersonDetailViewProps {
  person: Person;
  currentUser: User;
  onClose: () => void;
  onRefresh: () => void;
}

export const PersonDetailView: React.FC<PersonDetailViewProps> = ({
  person,
  currentUser,
  onClose,
  onRefresh,
}) => {
  const isAdmin = currentUser.role === 'ადმინისტრატორი';
  const isLocked = person.is_locked;

  // Active Tab
  const [activeTab, setActiveTab] = useState<'basic' | 'placement' | 'history' | 'audit'>('placement');

  // Modals state
  const [showTransitionModal, setShowTransitionModal] = useState(false);
  const [showExtensionModal, setShowExtensionModal] = useState(false);
  const [showLockModal, setShowLockModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Form states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Small Family Homes + Foster Parents dictionaries (გადაყვანისთვის)
  const [smallHomes, setSmallHomes] = useState<SmallFamilyHome[]>([]);
  const [fosterParents, setFosterParents] = useState<FosterParent[]>([]);
  useEffect(() => {
    api.getSmallHomes().then(setSmallHomes).catch(() => {});
    api.getFosterParents().then(setFosterParents).catch(() => {});
  }, []);

  // ერთი დაწკაპებით გადასინჯვა
  const [reviewLoading, setReviewLoading] = useState(false);
  const handleReview = async () => {
    setReviewLoading(true);
    setError(null);
    try {
      await api.reviewPerson(person.id);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'გადასინჯვისას დაფიქსირდა შეცდომა');
    } finally {
      setReviewLoading(false);
    }
  };

  // Transition Form
  const [transType, setTransType] = useState<PlacementType>('რეგულარული მინდობითი აღზრდა');
  const [transStartDate, setTransStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [transEndDate, setTransEndDate] = useState('');
  const [transReason, setTransReason] = useState('');
  const [transProgData, setTransProgData] = useState<ProgramData>(emptyProgramData());

  // გადაყვანის მოდალის გახსნა კონკრეტული სამიზნე პროგრამით
  const openTransition = (type: PlacementType) => {
    const start = new Date().toISOString().split('T')[0];
    setTransType(type);
    setTransStartDate(start);
    setTransEndDate(defaultEndDate(type, start));
    setTransReason('');
    setTransProgData(emptyProgramData());
    setError(null);
    setShowTransitionModal(true);
  };

  // მოდალში პროგრამის შეცვლა
  const selectTransProgram = (type: PlacementType) => {
    setTransType(type);
    setTransEndDate(defaultEndDate(type, transStartDate));
    setTransProgData(emptyProgramData());
  };

  // Extension Form
  const [extNewEndDate, setExtNewEndDate] = useState('');
  const [extReason, setExtReason] = useState('');
  const [extDecisionDate, setExtDecisionDate] = useState(new Date().toISOString().split('T')[0]);

  // Lock / Unlock Form
  const [lockReasonInput, setLockReasonInput] = useState('');

  // Archive Form
  const [archiveReasonInput, setArchiveReasonInput] = useState('');

  // Edit Form
  const [editFirstName, setEditFirstName] = useState(person.first_name);
  const [editLastName, setEditLastName] = useState(person.last_name);
  const [editPersonalNumber, setEditPersonalNumber] = useState(person.personal_number);
  const [editBirthDate, setEditBirthDate] = useState(person.birth_date);
  const [editAdmissionDate, setEditAdmissionDate] = useState(person.admission_date);
  const [editAdmissionReason, setEditAdmissionReason] = useState(person.admission_reason);
  const [editAdmissionSource, setEditAdmissionSource] = useState(person.admission_source);
  const [editPersonStatus, setEditPersonStatus] = useState<PersonStatus>(person.person_status);

  // Transition Handler
  const handleTransitionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transEndDate || !transReason) {
      setError('გთხოვთ, შეავსოთ დასრულების თარიღი და გადაყვანის საფუძველი.');
      return;
    }
    const progError = validateProgram(transType, transProgData);
    if (progError) {
      setError(progError);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await api.transitionPlacement(person.id, {
        placement_type: transType,
        start_date: transStartDate,
        planned_end_date: transEndDate,
        reason: transReason,
        contact_person: buildContactPerson(transType, transProgData, smallHomes),
        ...buildPlacementPatch(transType, transProgData, smallHomes),
      });
      setShowTransitionModal(false);
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Extension Handler
  const handleExtensionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extNewEndDate || !extReason) {
      setError('გთხოვთ, შეავსოთ ახალი დასრულების თარიღი და გაგრძელების საფუძველი.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await api.extendPlacement(person.id, {
        new_end_date: extNewEndDate,
        extension_reason: extReason,
        decision_date: extDecisionDate,
      });
      setShowExtensionModal(false);
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Lock Toggle Handler
  const handleLockToggle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lockReasonInput) {
      setError('გთხოვთ, მიუთითოთ მიზეზი.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (isLocked) {
        await api.unlockCase(person.id, lockReasonInput);
      } else {
        await api.lockCase(person.id, lockReasonInput);
      }
      setShowLockModal(false);
      setLockReasonInput('');
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Archive Handler
  const handleArchiveToggle = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (person.case_status === 'არქივირებული') {
        await api.unarchivePerson(person.id);
      } else {
        await api.archivePerson(person.id, archiveReasonInput);
      }
      setShowArchiveModal(false);
      setArchiveReasonInput('');
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Hard Delete Modal
  const [showHardDeleteModal, setShowHardDeleteModal] = useState(false);
  const [hardDeleteConfirmText, setHardDeleteConfirmText] = useState('');

  // Hard Delete Handler
  const handleHardDeleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hardDeleteConfirmText !== person.personal_number) {
      setError('დადასტურებისთვის გთხოვთ ზუსტად შეიყვანოთ ბენეფიციარის 11-ნიშნა პირადი ნომერი.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await api.deletePerson(person.id);
      setShowHardDeleteModal(false);
      onClose();
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'ქეისის წაშლისას დაფიქსირდა შეცდომა');
    } finally {
      setLoading(false);
    }
  };

  // Edit Handler
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.updatePerson(person.id, {
        first_name: editFirstName,
        last_name: editLastName,
        personal_number: editPersonalNumber,
        birth_date: editBirthDate,
        admission_date: editAdmissionDate,
        admission_reason: editAdmissionReason,
        admission_source: editAdmissionSource,
        person_status: editPersonStatus,
      });
      setShowEditModal(false);
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 p-5 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-blue-500/30 text-blue-300 border border-blue-400/30">
                {person.case_number}
              </span>
              {isLocked ? (
                <StatusBadge type="lock" value="locked" />
              ) : (
                <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  ქეისი ღიაა
                </span>
              )}
            </div>
            <h2 className="text-xl font-black tracking-tight text-white mt-1.5">
              {person.first_name} {person.last_name}
            </h2>
            <p className="text-xs text-slate-300 font-mono mt-0.5">
              პირადი №: {person.personal_number} • ასაკი: {person.calculated_age} წელი (დაბ: {formatDateToGeorgian(person.birth_date)})
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Admin Case Lock Button */}
            {isAdmin && (
              <button
                onClick={() => setShowLockModal(true)}
                className={`px-3 py-1.5 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer ${
                  isLocked
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                }`}
              >
                {isLocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                <span>{isLocked ? 'განბლოკვა' : 'დაბლოკვა'}</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-100 border-b border-slate-200 px-4 flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('placement')}
            className={`py-2.5 px-3 text-xs font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'placement'
                ? 'border-blue-600 text-blue-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            მიმდინარე პროგრამა & მოქმედებები
          </button>

          <button
            onClick={() => setActiveTab('basic')}
            className={`py-2.5 px-3 text-xs font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'basic'
                ? 'border-blue-600 text-blue-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            ძირითადი ინფორმაცია
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`py-2.5 px-3 text-xs font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'history'
                ? 'border-blue-600 text-blue-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            პროგრამების ისტორია
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`py-2.5 px-3 text-xs font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'audit'
                ? 'border-blue-600 text-blue-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            ცვლილებების ისტორია
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          {/* TAB 1: Current Placement & Actions */}
          {activeTab === 'placement' && (
            <div className="space-y-6">
              {/* Active Placement Overview */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2 gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">მიმდინარე აქტიური პროგრამა</span>
                  <div className="flex items-center gap-2">
                    <StatusBadge type="review" value={person.review_done ? 'შესრულებული' : 'გადასასინჯი'} />
                    <StatusBadge type="reminder" value={person.reminder_status || 'ნორმალური'} count={person.days_overdue} />
                  </div>
                </div>
                {person.review_done && (
                  <div className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1.5">
                    გადასინჯვა შესრულებულია — {person.reviewed_by || 'უცნობი'}
                    {person.reviewed_at ? ` · ${new Date(person.reviewed_at).toLocaleString('ka-GE')}` : ''}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 block">პროგრამის ტიპი</span>
                    <span className="font-bold text-slate-900 text-sm">
                      {person.current_placement?.placement_type || 'არ არის'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block">დაწყების თარიღი</span>
                    <span className="font-bold text-slate-900">
                      {formatDateToGeorgian(person.current_placement?.start_date)}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block">დასრულების თარიღი</span>
                    <span className="font-bold text-blue-700">
                      {formatDateToGeorgian(person.current_placement?.planned_end_date)}
                    </span>
                  </div>
                </div>

                {person.current_placement?.placement_reason && (
                  <div className="text-xs bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="font-semibold text-slate-700 block">განთავსების საფუძველი / მიზეზი:</span>
                    <span className="text-slate-800">{person.current_placement.placement_reason}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">შესასრულებელი მოქმედებები</h3>

                {isLocked && !isAdmin && (
                  <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl flex items-center gap-2">
                    <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>ქეისი დაბლოკილია. მოქმედებების შესრულება შეუძლია მხოლოდ ადმინისტრატორს.</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {/* Review Button (ერთი დაწკაპებით) */}
                  <button
                    disabled={(isLocked && !isAdmin) || reviewLoading || person.review_done}
                    onClick={handleReview}
                    className="p-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-semibold text-xs rounded-xl border border-emerald-200 transition text-left flex items-center justify-between cursor-pointer disabled:opacity-40"
                  >
                    <div>
                      <span className="block font-bold">{person.review_done ? 'გადასინჯვა შესრულებულია' : 'გადასინჯვა'}</span>
                      <span className="text-[11px] font-normal text-emerald-700">
                        {person.review_done ? 'ხელახლა აღარ არის საჭირო' : 'შემოწმდა — ყველაფერი წესრიგშია'}
                      </span>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  </button>

                  {/* Extension Button */}
                  <button
                    disabled={isLocked && !isAdmin}
                    onClick={() => {
                      setExtNewEndDate('');
                      setExtReason('');
                      setShowExtensionModal(true);
                    }}
                    className="p-3 bg-blue-50 hover:bg-blue-100 text-blue-800 font-semibold text-xs rounded-xl border border-blue-200 transition text-left flex items-center justify-between cursor-pointer disabled:opacity-40"
                  >
                    <div>
                      <span className="block font-bold">ვადის გაგრძელება</span>
                      <span className="text-[11px] font-normal text-blue-600">არსებული ვადის გაგრძელება</span>
                    </div>
                    <Clock className="w-5 h-5 text-blue-600" />
                  </button>

                  {/* Transition: Regular Foster Care */}
                  <button
                    disabled={isLocked && !isAdmin}
                    onClick={() => openTransition('რეგულარული მინდობითი აღზრდა')}
                    className="p-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-semibold text-xs rounded-xl border border-indigo-200 transition text-left flex items-center justify-between cursor-pointer disabled:opacity-40"
                  >
                    <div>
                      <span className="block font-bold">რეგულარულში გადაყვანა</span>
                      <span className="text-[11px] font-normal text-indigo-600">რეგულარული მინდობითი აღზრდა</span>
                    </div>
                    <ArrowRightLeft className="w-5 h-5 text-indigo-600" />
                  </button>

                  {/* Transition: Small Family Home */}
                  <button
                    disabled={isLocked && !isAdmin}
                    onClick={() => openTransition('მცირე საოჯახო ტიპის სახლი')}
                    className="p-3 bg-teal-50 hover:bg-teal-100 text-teal-900 font-semibold text-xs rounded-xl border border-teal-200 transition text-left flex items-center justify-between cursor-pointer disabled:opacity-40"
                  >
                    <div>
                      <span className="block font-bold">მცირე საოჯახო სახლში</span>
                      <span className="text-[11px] font-normal text-teal-600">საოჯახო ტიპის სახლი</span>
                    </div>
                    <Building className="w-5 h-5 text-teal-600" />
                  </button>

                  {/* Transition: Reintegration */}
                  <button
                    disabled={isLocked && !isAdmin}
                    onClick={() => openTransition('რეინტეგრაცია')}
                    className="p-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-semibold text-xs rounded-xl border border-emerald-200 transition text-left flex items-center justify-between cursor-pointer disabled:opacity-40"
                  >
                    <div>
                      <span className="block font-bold">რეინტეგრაციაში გადაყვანა</span>
                      <span className="text-[11px] font-normal text-emerald-600">ბიოლოგიურ ოჯახში დაბრუნება</span>
                    </div>
                    <UserCheck className="w-5 h-5 text-emerald-600" />
                  </button>

                  {/* Edit Person Details */}
                  <button
                    disabled={isLocked && !isAdmin}
                    onClick={() => setShowEditModal(true)}
                    className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl border border-slate-300 transition text-left flex items-center justify-between cursor-pointer disabled:opacity-40"
                  >
                    <div>
                      <span className="block font-bold">მონაცემების რედაქტირება</span>
                      <span className="text-[11px] font-normal text-slate-600">პირადი ველების განახლება</span>
                    </div>
                    <Edit className="w-5 h-5 text-slate-600" />
                  </button>

                  {/* Archive / Soft Delete (Admin) */}
                  {isAdmin && (
                    <>
                      <button
                        onClick={() => setShowArchiveModal(true)}
                        className="p-3 bg-amber-50 hover:bg-amber-100 text-amber-900 font-semibold text-xs rounded-xl border border-amber-200 transition text-left flex items-center justify-between cursor-pointer"
                      >
                        <div>
                          <span className="block font-bold">
                            {person.case_status === 'არქივირებული' ? 'არქივიდან ამოღება' : 'არქივში გადატანა'}
                          </span>
                          <span className="text-[11px] font-normal text-amber-700">რბილი წაშლა / დეაქტივაცია</span>
                        </div>
                        <Archive className="w-5 h-5 text-amber-600" />
                      </button>

                      <button
                        onClick={() => {
                          setHardDeleteConfirmText('');
                          setError(null);
                          setShowHardDeleteModal(true);
                        }}
                        className="p-3 bg-rose-50 hover:bg-rose-100 text-rose-900 font-semibold text-xs rounded-xl border border-rose-200 transition text-left flex items-center justify-between cursor-pointer"
                      >
                        <div>
                          <span className="block font-bold text-rose-700">ქეისის სრული წაშლა</span>
                          <span className="text-[11px] font-normal text-rose-600">სისტემიდან ბაზისური წაშლა (ადმინი)</span>
                        </div>
                        <X className="w-5 h-5 text-rose-600" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Basic Person Information */}
          {activeTab === 'basic' && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 font-semibold block">სახელი, გვარი:</span>
                  <span className="text-sm font-bold text-slate-900">
                    {person.first_name} {person.last_name}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 font-semibold block">პირადი ნომერი:</span>
                  <span className="font-mono text-sm font-bold text-slate-900">{person.personal_number}</span>
                </div>

                <div>
                  <span className="text-slate-500 font-semibold block">დაბადების თარიღი:</span>
                  <span className="font-bold text-slate-900">
                    {formatDateToGeorgian(person.birth_date)} ({person.calculated_age} წლის)
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 font-semibold block">18 წლის შესრულების თარიღი:</span>
                  <span className="font-bold text-purple-700">
                    {formatDateToGeorgian(person.adulthood_date)} ({person.days_until_adulthood} დღეში)
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 font-semibold block">ჩარიცხვის თარიღი:</span>
                  <span className="font-bold text-slate-900">{formatDateToGeorgian(person.admission_date)}</span>
                </div>

                <div>
                  <span className="text-slate-500 font-semibold block">პიროვნების სტატუსი:</span>
                  <StatusBadge type="person_status" value={person.person_status} />
                </div>

                <div>
                  <span className="text-slate-500 font-semibold block">საიდან ჩაირიცხა:</span>
                  <span className="text-slate-800">{person.admission_source}</span>
                </div>

                <div>
                  <span className="text-slate-500 font-semibold block">ჩარიცხვის მიზეზი:</span>
                  <span className="text-slate-800">{person.admission_reason}</span>
                </div>
              </div>

              {/* Contact Person Details */}
              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-200">
                <h4 className="font-bold text-blue-900 mb-2">ვისთან ჩაირიცხა (მიმღები პირი/ოჯახი)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-500 block">სახელი, გვარი:</span>
                    <span className="font-bold text-slate-900">
                      {person.contact_person?.first_name} {person.contact_person?.last_name}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block">პირადი ნომერი:</span>
                    <span className="font-mono font-bold text-slate-900">{person.contact_person?.personal_number}</span>
                  </div>

                  <div>
                    <span className="text-slate-500 block">ტელეფონის ნომერი:</span>
                    <span className="font-bold text-slate-900">{person.contact_person?.phone}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Placement History */}
          {activeTab === 'history' && (
            <div className="space-y-4 text-xs">
              <h3 className="font-bold text-slate-800">პროგრამების ქრონოლოგიური ისტორია</h3>
              <div className="space-y-3">
                {person.placements_history?.map((plc, idx) => (
                  <div
                    key={plc.id}
                    className={`p-3.5 rounded-xl border ${
                      plc.placement_status === 'აქტიური'
                        ? 'bg-blue-50/80 border-blue-300'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{plc.placement_type}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            plc.placement_status === 'აქტიური'
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {plc.placement_status}
                        </span>
                      </div>
                      <span className="text-slate-500 text-[11px]">შექმნა: {plc.created_by}</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-slate-700">
                      <div>
                        <span className="text-slate-500 block">დაწყება:</span>
                        <span className="font-bold">{formatDateToGeorgian(plc.start_date)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">გეგმიური დასრულება:</span>
                        <span className="font-bold">{formatDateToGeorgian(plc.planned_end_date)}</span>
                      </div>
                      {plc.actual_end_date && (
                        <div>
                          <span className="text-slate-500 block">ფაქტობრივი დასრულება:</span>
                          <span className="font-bold text-slate-900">{formatDateToGeorgian(plc.actual_end_date)}</span>
                        </div>
                      )}
                    </div>

                    {plc.placement_reason && (
                      <p className="mt-2 text-slate-600 italic bg-white p-2 rounded border border-slate-200">
                        საფუძველი: {plc.placement_reason}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Extensions history log */}
              {person.extensions_history && person.extensions_history.length > 0 && (
                <div className="mt-6 pt-4 border-t border-slate-200">
                  <h4 className="font-bold text-slate-800 mb-2">ვადების გაგრძელების ჩანაწერები</h4>
                  <div className="space-y-2">
                    {person.extensions_history.map((ext) => (
                      <div key={ext.id} className="p-2.5 bg-amber-50 rounded-lg border border-amber-200">
                        <div className="flex justify-between font-semibold text-amber-900">
                          <span>
                            ძველი ვადა: {formatDateToGeorgian(ext.old_end_date)} → ახალი ვადა:{' '}
                            {formatDateToGeorgian(ext.new_end_date)}
                          </span>
                          <span>გადაწყვეტილება: {formatDateToGeorgian(ext.decision_date)}</span>
                        </div>
                        <p className="text-amber-800 mt-1">მიზეზი: {ext.extension_reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Audit Trail */}
          {activeTab === 'audit' && (
            <div className="space-y-3 text-xs">
              <h3 className="font-bold text-slate-800">ამ ქეისზე განხორციელებული ცვლილებები</h3>
              <p className="text-slate-500">ყველა მოქმედება უცვლელად ინახება აუდიტის სისტემურ ჟურნალში.</p>
              <div className="bg-slate-900 text-slate-200 p-3 rounded-xl max-h-80 overflow-y-auto space-y-2 font-mono text-[11px]">
                <p className="text-emerald-400"># სისტემური უსაფრთხოების ჟურნალი (Audit Log)</p>
                <p>• ქეისის შექმნის თარიღი: {person.created_at} (ავტორი: {person.created_by})</p>
                {person.updated_at && <p>• ბოლო განახლების თარიღი: {person.updated_at} (ავტორი: {person.updated_by || 'სისტემა'})</p>}
                {person.is_locked && (
                  <p className="text-amber-400">
                    • ქეისი დაბლოკა: {person.locked_by} ({person.locked_at}) — მიზეზი: {person.lock_reason}
                  </p>
                )}
                {person.archived_at && (
                  <p className="text-rose-400">
                    • არქივში გადაიტანა: {person.archived_by} ({person.archived_at}) — მიზეზი: {person.archive_reason}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- MODAL 1: PROGRAM TRANSITION --- */}
      {showTransitionModal && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 flex items-center justify-center p-3 md:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full p-6 space-y-4 max-h-[92vh] overflow-y-auto">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-blue-600" />
                <span>პროგრამის შეცვლა / გადაყვანა</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                მიმდინარე პროგრამა: <span className="font-semibold text-slate-700">{person.current_placement?.placement_type || 'არ არის'}</span>.
                აირჩიეთ ახალი პროგრამა და შეავსეთ სავალდებულო ველები.
              </p>
            </div>

            {error && (
              <div className="p-2.5 bg-rose-50 text-rose-700 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleTransitionSubmit} className="space-y-4 text-xs">
              {/* Program Selector */}
              <div>
                <label className="block font-bold text-slate-800 mb-2">ახალი პროგრამის არჩევა *</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {PROGRAM_OPTIONS.map((prog) => {
                    const Icon = prog.icon;
                    const isSelected = transType === prog.id;
                    return (
                      <button
                        type="button"
                        key={prog.id}
                        onClick={() => selectTransProgram(prog.id)}
                        className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-start justify-between gap-2 ${
                          isSelected ? 'border-blue-600 bg-blue-50/80 ring-2 ring-blue-500/30' : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/80'
                        }`}
                      >
                        <div>
                          <p className="font-bold text-slate-900 text-[11px] leading-tight">{prog.title}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{prog.desc}</p>
                        </div>
                        {isSelected ? <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" /> : <Icon className="w-4 h-4 text-slate-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dates & Reason */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">დაწყების თარიღი *</label>
                  <input type="date" value={transStartDate}
                    onChange={(e) => { setTransStartDate(e.target.value); setTransEndDate(defaultEndDate(transType, e.target.value)); }}
                    required className="w-full p-2.5 border border-slate-300 rounded-xl" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">გეგმიური დასრულების თარიღი *</label>
                  <input type="date" value={transEndDate} onChange={(e) => setTransEndDate(e.target.value)}
                    required className="w-full p-2.5 border border-slate-300 rounded-xl font-bold text-blue-700" />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">გადაყვანის საფუძველი / მიზეზი *</label>
                <textarea value={transReason} onChange={(e) => setTransReason(e.target.value)}
                  placeholder="მიუთითეთ გადაყვანის ოფიციალური საფუძველი" required rows={2}
                  className="w-full p-2.5 border border-slate-300 rounded-xl" />
              </div>

              {/* Program-specific fields (რეგისტრაციის იდენტური) */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <p className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                  პროგრამის სპეციფიკური ველები — {transType}
                </p>
                <ProgramSpecificFields
                  program={transType}
                  data={transProgData}
                  onChange={(patch) => setTransProgData((prev) => ({ ...prev, ...patch }))}
                  smallHomes={smallHomes}
                  fosterParents={fosterParents}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowTransitionModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 font-semibold text-slate-700 rounded-xl cursor-pointer">
                  გაუქმება
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl cursor-pointer disabled:opacity-50">
                  {loading ? 'ინახება...' : 'გადაყვანის დადასტურება'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: EXTENSION --- */}
      {showExtensionModal && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">არსებული ვადის გაგრძელება</h3>
            <p className="text-xs text-slate-600">
              არსებული დასრულების თარიღი: <span className="font-bold">{formatDateToGeorgian(person.current_placement?.planned_end_date)}</span>
            </p>
            {error && (
              <div className="p-2.5 bg-rose-50 text-rose-700 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <form onSubmit={handleExtensionSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">ახალი დასრულების თარიღი</label>
                <input
                  type="date"
                  value={extNewEndDate}
                  onChange={(e) => setExtNewEndDate(e.target.value)}
                  required
                  className="w-full p-2 border border-slate-300 rounded-lg font-bold text-blue-700"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">გადაწყვეტილების თარიღი</label>
                <input
                  type="date"
                  value={extDecisionDate}
                  onChange={(e) => setExtDecisionDate(e.target.value)}
                  required
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">გაგრძელების საფუძველი / კომენტარი</label>
                <textarea
                  value={extReason}
                  onChange={(e) => setExtReason(e.target.value)}
                  placeholder="მიუთითეთ ვადის გაგრძელების მიზეზი"
                  required
                  rows={2}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowExtensionModal(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 font-semibold text-slate-700 rounded-lg cursor-pointer"
                >
                  გაუქმება
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg cursor-pointer"
                >
                  {loading ? 'ინახება...' : 'ვადის გაგრძელება'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 3: CASE LOCK / UNLOCK (ADMIN) --- */}
      {showLockModal && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              {isLocked ? 'ქეისის განბლოკვა' : 'ქეისის დაბლოკვა'}
            </h3>
            {error && (
              <div className="p-2.5 bg-rose-50 text-rose-700 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <form onSubmit={handleLockToggle} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {isLocked ? 'განბლოკვის მიზეზი' : 'დაბლოკვის მიზეზი'}
                </label>
                <textarea
                  value={lockReasonInput}
                  onChange={(e) => setLockReasonInput(e.target.value)}
                  placeholder="მიუთითეთ მიზეზი"
                  required
                  rows={3}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLockModal(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 font-semibold text-slate-700 rounded-lg cursor-pointer"
                >
                  გაუქმება
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg cursor-pointer"
                >
                  {loading ? 'მუშავდება...' : isLocked ? 'განბლოკვა' : 'დაბლოკვა'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 4: ARCHIVE (ADMIN) --- */}
      {showArchiveModal && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              {person.case_status === 'არქივირებული' ? 'ქეისის არქივიდან ამოღება' : 'ქეისის არქივში გადატანა'}
            </h3>
            {error && (
              <div className="p-2.5 bg-rose-50 text-rose-700 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <form onSubmit={handleArchiveToggle} className="space-y-3 text-xs">
              {person.case_status !== 'არქივირებული' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">არქივში გადატანის მიზეზი</label>
                  <textarea
                    value={archiveReasonInput}
                    onChange={(e) => setArchiveReasonInput(e.target.value)}
                    placeholder="მიუთითეთ მიზეზი"
                    required
                    rows={3}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowArchiveModal(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 font-semibold text-slate-700 rounded-lg cursor-pointer"
                >
                  გაუქმება
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg cursor-pointer"
                >
                  {loading ? 'მუშავდება...' : person.case_status === 'არქივირებული' ? 'აღდგენა' : 'არქივში გადატანა'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 5: EDIT PERSON DETAILS --- */}
      {showEditModal && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900">პირადი მონაცემების რედაქტირება</h3>
            {error && (
              <div className="p-2.5 bg-rose-50 text-rose-700 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <form onSubmit={handleEditSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">სახელი</label>
                  <input
                    type="text"
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    required
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">გვარი</label>
                  <input
                    type="text"
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    required
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">პირადი ნომერი (11 ციფრი)</label>
                <input
                  type="text"
                  value={editPersonalNumber}
                  onChange={(e) => setEditPersonalNumber(e.target.value)}
                  required
                  className="w-full p-2 border border-slate-300 rounded-lg font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">დაბადების თარიღი</label>
                  <input
                    type="date"
                    value={editBirthDate}
                    onChange={(e) => setEditBirthDate(e.target.value)}
                    required
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ჩარიცხვის თარიღი</label>
                  <input
                    type="date"
                    value={editAdmissionDate}
                    onChange={(e) => setEditAdmissionDate(e.target.value)}
                    required
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">პიროვნების სტატუსი</label>
                <select
                  value={editPersonStatus}
                  onChange={(e) => setEditPersonStatus(e.target.value as PersonStatus)}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                >
                  <option value="ჯანმრთელი">ჯანმრთელი</option>
                  <option value="შშმ">შშმ</option>
                  <option value="სსმ">სსმ</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">საიდან ჩაირიცხა</label>
                <input
                  type="text"
                  value={editAdmissionSource}
                  onChange={(e) => setEditAdmissionSource(e.target.value)}
                  required
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ჩარიცხვის მიზეზი</label>
                <textarea
                  value={editAdmissionReason}
                  onChange={(e) => setEditAdmissionReason(e.target.value)}
                  required
                  rows={2}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 font-semibold text-slate-700 rounded-lg cursor-pointer"
                >
                  გაუქმება
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg cursor-pointer"
                >
                  {loading ? 'ინახება...' : 'შენახვა'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* --- MODAL 6: HARD DELETE (ADMIN ONLY) --- */}
      {showHardDeleteModal && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-rose-300 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-100 text-rose-700 rounded-xl">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-rose-900">ქეისის სამუდამოდ წაშლა</h3>
                <p className="text-xs text-rose-700 font-medium">გაფრთხილება: ეს მოქმედება შეუქცევადია!</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              ნამდვილად გსურთ <span className="font-bold text-slate-900">{person.first_name} {person.last_name}</span>-ის ქეისის სრული წაშლა ბაზიდან? წაიშლება ყველა დაკავშირებული ისტორია, განთავსება და აუდიტი.
            </p>

            {error && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                {error}
              </div>
            )}

            <form onSubmit={handleHardDeleteSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  დადასტურებისთვის შეიყვანეთ ბენეფიციარის 11-ნიშნა პირადი № (<span className="font-mono text-rose-700">{person.personal_number}</span>):
                </label>
                <input
                  type="text"
                  maxLength={11}
                  value={hardDeleteConfirmText}
                  onChange={(e) => setHardDeleteConfirmText(e.target.value)}
                  placeholder={person.personal_number}
                  required
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-mono font-bold text-rose-900"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowHardDeleteModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 font-semibold text-slate-700 rounded-xl cursor-pointer"
                >
                  გაუქმება
                </button>
                <button
                  type="submit"
                  disabled={loading || hardDeleteConfirmText !== person.personal_number}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs cursor-pointer transition disabled:opacity-40"
                >
                  {loading ? 'იშლება...' : 'სამუდამოდ წაშლა'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
