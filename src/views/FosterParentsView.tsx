import React, { useState, useEffect } from 'react';
import {
  HeartHandshake,
  UserPlus,
  Search,
  Pencil,
  Eye,
  AlertCircle,
  X,
  Users,
  ShieldCheck,
  Trash2,
  Plus,
} from 'lucide-react';
import { User, Person, FosterParent, FosterCategory, MAX_FOSTER_CHILDREN } from '../types';
import { api } from '../api';
import { StatusBadge } from '../components/StatusBadge';

interface Props {
  user: User;
  persons: Person[];
  onSelectPerson: (p: Person) => void;
  onRefresh: () => void;
}

type FilterKey = 'all' | 'registered' | 'hired' | 'emergency' | 'regular';

const emptyForm = () => ({
  first_name: '',
  last_name: '',
  personal_number: '',
  phone: '',
  address: '',
  category: 'გადაუდებელი' as FosterCategory,
  children_limit_exception: false,
  exception_reason: '',
});

export const FosterParentsView: React.FC<Props> = ({ user, persons, onSelectPerson, onRefresh }) => {
  const isAdmin = user.role === 'ადმინისტრატორი';

  const [list, setList] = useState<FosterParent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');

  // modals
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [detailId, setDetailId] = useState<string | null>(null);
  const [showAttach, setShowAttach] = useState(false);
  const [attachSearch, setAttachSearch] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      setList(await api.getFosterParents());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persons]); // persons ცვლილებაზეც (ბავშვის მიმაგრება/მოხსნა) გადაითვალოს

  const detail = detailId ? list.find((f) => f.id === detailId) : null;

  const filtered = list.filter((fp) => {
    if (search) {
      const q = search.toLowerCase().trim();
      const name = `${fp.first_name} ${fp.last_name}`.toLowerCase();
      if (!name.includes(q) && !(fp.personal_number || '').includes(q)) return false;
    }
    if (filter === 'registered') return fp.status === 'რეგისტრირებული';
    if (filter === 'hired') return fp.status === 'დაქირავებული';
    if (filter === 'emergency') return fp.category === 'გადაუდებელი';
    if (filter === 'regular') return fp.category === 'რეგულარული';
    return true;
  });

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm());
    setError(null);
    setShowForm(true);
  };

  const openEdit = (fp: FosterParent) => {
    setEditId(fp.id);
    setForm({
      first_name: fp.first_name,
      last_name: fp.last_name,
      personal_number: fp.personal_number || '',
      phone: fp.phone || '',
      address: fp.address || '',
      category: fp.category,
      children_limit_exception: fp.children_limit_exception,
      exception_reason: fp.exception_reason || '',
    });
    setError(null);
    setShowForm(true);
  };

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (editId) {
        await api.updateFosterParent(editId, {
          first_name: form.first_name,
          last_name: form.last_name,
          personal_number: form.personal_number,
          phone: form.phone,
          address: form.address,
          category: form.category,
        });
        // exception ცალკე (admin-only)
        const current = list.find((f) => f.id === editId);
        if (isAdmin && current && current.children_limit_exception !== form.children_limit_exception) {
          await api.setChildrenException(editId, form.children_limit_exception, form.exception_reason || undefined);
        }
      } else {
        await api.createFosterParent({
          first_name: form.first_name,
          last_name: form.last_name,
          personal_number: form.personal_number,
          phone: form.phone,
          address: form.address,
          category: form.category,
          children_limit_exception: isAdmin ? form.children_limit_exception : false,
          exception_reason: form.exception_reason,
        });
      }
      setShowForm(false);
      await load();
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const toggleException = async (fp: FosterParent, enabled: boolean, reason?: string) => {
    setError(null);
    try {
      await api.setChildrenException(fp.id, enabled, reason);
      await load();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const attachChild = async (childId: string) => {
    if (!detail) return;
    setError(null);
    try {
      await api.attachChild(childId, detail.id);
      setShowAttach(false);
      setAttachSearch('');
      await load();
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const detachChild = async (childId: string) => {
    setError(null);
    try {
      await api.detachChild(childId);
      await load();
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const removeFosterParent = async (fp: FosterParent) => {
    if (!window.confirm(`ნამდვილად წავშალოთ მიმღები მშობელი "${fp.first_name} ${fp.last_name}"?`)) return;
    setError(null);
    try {
      await api.deleteFosterParent(fp.id);
      setDetailId(null);
      await load();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const childrenLabel = (fp: FosterParent) => {
    const c = fp.active_children_count ?? 0;
    if (fp.children_limit_exception) return `${c} — ლიმიტის გამონაკლისი ჩართულია`;
    return `${c} / ${MAX_FOSTER_CHILDREN}`;
  };

  const attachCandidates = persons.filter(
    (p) => p.case_status !== 'არქივირებული' && p.foster_parent_id !== detail?.id &&
      (attachSearch === '' || `${p.first_name} ${p.last_name} ${p.personal_number}`.toLowerCase().includes(attachSearch.toLowerCase()))
  );

  const filterBtn = (key: FilterKey, label: string, count?: number) => (
    <button
      onClick={() => setFilter(key)}
      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
        filter === key ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
      }`}
    >
      {label}{count !== undefined ? ` (${count})` : ''}
    </button>
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <HeartHandshake className="w-6 h-6 text-blue-600" />
            <span>მიმღები მშობლები</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            მიმღები მშობლების რეგისტრაცია, კატეგორიები, სტატუსი და მიმაგრებული ბავშვები.
          </p>
        </div>
        <button onClick={openCreate}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer">
          <UserPlus className="w-4 h-4" />
          <span>ახალი მიმღები მშობელი</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filters + Search */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200 flex flex-col md:flex-row gap-3 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="ძებნა სახელით / გვარით / პ.ნ-ით..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {filterBtn('all', 'ყველა', list.length)}
          {filterBtn('registered', 'რეგისტრირებული', list.filter((f) => f.status === 'რეგისტრირებული').length)}
          {filterBtn('hired', 'დაქირავებული', list.filter((f) => f.status === 'დაქირავებული').length)}
          {filterBtn('emergency', 'გადაუდებელი')}
          {filterBtn('regular', 'რეგულარული')}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-white font-semibold">
                <th className="py-3 px-4">სახელი, გვარი</th>
                <th className="py-3 px-4">პ. ნომერი</th>
                <th className="py-3 px-4">სტატუსი</th>
                <th className="py-3 px-4">კატეგორია</th>
                <th className="py-3 px-4">ბავშვები</th>
                <th className="py-3 px-4">გამონაკლისი</th>
                <th className="py-3 px-4 text-center">მოქმედება</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr><td colSpan={7} className="py-8 text-center text-slate-500">იტვირთება...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="py-8 text-center text-slate-500">ჩანაწერი ვერ მოიძებნა.</td></tr>
              ) : (
                filtered.map((fp) => (
                  <tr key={fp.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">{fp.first_name} {fp.last_name}</td>
                    <td className="py-3 px-4 font-mono text-slate-700">{fp.personal_number || '—'}</td>
                    <td className="py-3 px-4"><StatusBadge type="foster_status" value={fp.status || 'რეგისტრირებული'} /></td>
                    <td className="py-3 px-4"><StatusBadge type="foster_category" value={fp.category} /></td>
                    <td className="py-3 px-4 font-bold text-slate-800">{childrenLabel(fp)}</td>
                    <td className="py-3 px-4">
                      {fp.children_limit_exception ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-bold"><ShieldCheck className="w-3.5 h-3.5" /> კი</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center space-x-1.5 whitespace-nowrap">
                      <button onClick={() => setDetailId(fp.id)} title="დეტალური პროფილი"
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition cursor-pointer">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => openEdit(fp)} title="რედაქტირება"
                        className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition cursor-pointer">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 max-h-[92vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900">
              {editId ? 'მიმღები მშობლის რედაქტირება' : 'ახალი მიმღები მშობლის რეგისტრაცია'}
            </h3>
            {error && (
              <div className="p-2.5 bg-rose-50 text-rose-700 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /><span>{error}</span>
              </div>
            )}
            <form onSubmit={submitForm} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">სახელი *</label>
                  <input type="text" value={form.first_name} required onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">გვარი *</label>
                  <input type="text" value={form.last_name} required onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">პირადი ნომერი</label>
                  <input type="text" maxLength={11} value={form.personal_number}
                    onChange={(e) => setForm({ ...form, personal_number: e.target.value.replace(/\D/g, '') })}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ტელეფონი</label>
                  <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg" />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">მისამართი</label>
                <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg" />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">კატეგორია *</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as FosterCategory })}
                  className="w-full p-2 border border-slate-300 rounded-lg font-bold">
                  <option value="გადაუდებელი">გადაუდებელი</option>
                  <option value="რეგულარული">რეგულარული</option>
                </select>
              </div>

              {isAdmin && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                  <label className="flex items-center gap-2 font-semibold text-amber-900 cursor-pointer">
                    <input type="checkbox" checked={form.children_limit_exception}
                      onChange={(e) => setForm({ ...form, children_limit_exception: e.target.checked })} />
                    <span>დაშვებულია 4-ზე მეტი ბავშვის მიმაგრება (ლიმიტის გამონაკლისი)</span>
                  </label>
                  {form.children_limit_exception && (
                    <input type="text" value={form.exception_reason} placeholder="გამონაკლისის მიზეზი / კომენტარი"
                      onChange={(e) => setForm({ ...form, exception_reason: e.target.value })}
                      className="w-full p-2 border border-amber-300 rounded-lg" />
                  )}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2 bg-slate-100 font-semibold rounded-lg cursor-pointer">გაუქმება</button>
                <button type="submit"
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg cursor-pointer">
                  {editId ? 'შენახვა' : 'რეგისტრაცია'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {detail && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{detail.first_name} {detail.last_name}</h3>
                <p className="text-xs text-slate-500 font-mono">პ.ნ: {detail.personal_number || '—'} · ტელ: {detail.phone || '—'}</p>
                <div className="flex items-center gap-2 mt-2">
                  <StatusBadge type="foster_status" value={detail.status || 'რეგისტრირებული'} />
                  <StatusBadge type="foster_category" value={detail.category} />
                </div>
              </div>
              <button onClick={() => setDetailId(null)} className="p-2 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-xl cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-2.5 bg-rose-50 text-rose-700 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /><span>{error}</span>
              </div>
            )}

            {/* Exception panel (admin) */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center justify-between gap-3">
              <div>
                <span className="font-bold text-slate-800">ბავშვების ლიმიტი: </span>
                <span className="text-slate-700">{childrenLabel(detail)}</span>
                {detail.children_limit_exception && detail.exception_reason && (
                  <p className="text-[11px] text-slate-500 mt-0.5">მიზეზი: {detail.exception_reason}</p>
                )}
              </div>
              {isAdmin && (
                <button
                  onClick={() => {
                    if (detail.children_limit_exception) {
                      toggleException(detail, false);
                    } else {
                      const reason = window.prompt('გამონაკლისის მიზეზი (არასავალდებულო):') || undefined;
                      toggleException(detail, true, reason);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition ${
                    detail.children_limit_exception ? 'bg-rose-100 text-rose-800 hover:bg-rose-200' : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                  }`}
                >
                  {detail.children_limit_exception ? 'გამონაკლისის გამორთვა' : 'გამონაკლისის ჩართვა'}
                </button>
              )}
            </div>

            {/* Attached children */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-blue-600" />
                  მიმაგრებული ბავშვები: {detail.active_children_count ?? 0}
                </h4>
                <button onClick={() => { setShowAttach(true); setAttachSearch(''); setError(null); }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer">
                  <Plus className="w-3.5 h-3.5" /> ბავშვის მიმაგრება
                </button>
              </div>
              {(detail.active_children || []).length === 0 ? (
                <p className="text-xs text-slate-500 bg-slate-50 rounded-lg p-3">ამჟამად მიმაგრებული ბავშვი არ ჰყავს.</p>
              ) : (
                <div className="space-y-2">
                  {(detail.active_children || []).map((c, i) => (
                    <div key={c.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                      <button onClick={() => { setDetailId(null); onSelectPerson(c); }}
                        className="text-left font-bold text-slate-900 hover:text-blue-600 cursor-pointer">
                        {i + 1}. {c.first_name} {c.last_name}
                        <span className="font-mono font-normal text-slate-500 ml-2">{c.personal_number}</span>
                      </button>
                      <button onClick={() => detachChild(c.id)} title="მოხსნა"
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg cursor-pointer">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-between pt-2 border-t border-slate-200">
              <button onClick={() => removeFosterParent(detail)}
                className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-lg cursor-pointer">
                მიმღები მშობლის წაშლა
              </button>
              <button onClick={() => openEdit(detail)}
                className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1">
                <Pencil className="w-3.5 h-3.5" /> რედაქტირება
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ATTACH CHILD MODAL */}
      {showAttach && detail && (
        <div className="fixed inset-0 z-[70] bg-slate-950/80 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">ბავშვის მიმაგრება: {detail.first_name} {detail.last_name}</h3>
              <button onClick={() => setShowAttach(false)} className="p-1.5 text-slate-400 hover:text-slate-700 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            {error && (
              <div className="p-2.5 bg-rose-50 text-rose-700 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /><span>{error}</span>
              </div>
            )}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input type="text" value={attachSearch} onChange={(e) => setAttachSearch(e.target.value)}
                placeholder="ბავშვის ძებნა..." className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl" />
            </div>
            <div className="space-y-1.5 max-h-72 overflow-y-auto">
              {attachCandidates.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">ბენეფიციარი ვერ მოიძებნა.</p>
              ) : (
                attachCandidates.map((p) => (
                  <button key={p.id} onClick={() => attachChild(p.id)}
                    className="w-full text-left p-2.5 bg-slate-50 hover:bg-blue-50 rounded-lg border border-slate-200 text-xs flex items-center justify-between cursor-pointer">
                    <span className="font-bold text-slate-900">{p.first_name} {p.last_name}
                      <span className="font-mono font-normal text-slate-500 ml-2">{p.personal_number}</span>
                    </span>
                    {p.foster_parent_id && <span className="text-[10px] text-amber-700">სხვა მშობელზეა — გადაბმა</span>}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
