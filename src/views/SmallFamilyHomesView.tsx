import React, { useState, useEffect } from 'react';
import { SmallFamilyHome, User, Person } from '../types';
import { api } from '../api';
import {
  Home,
  Plus,
  Search,
  Edit2,
  Trash2,
  Users,
  MapPin,
  Phone,
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface SmallFamilyHomesViewProps {
  user: User;
  persons: Person[];
  onSelectPerson?: (person: Person) => void;
}

export const SmallFamilyHomesView: React.FC<SmallFamilyHomesViewProps> = ({
  user,
  persons,
  onSelectPerson,
}) => {
  const isAdmin = user.role === 'ადმინისტრატორი';
  const [homes, setHomes] = useState<SmallFamilyHome[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingHome, setEditingHome] = useState<SmallFamilyHome | null>(null);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [directorName, setDirectorName] = useState('');
  const [phone, setPhone] = useState('');
  const [capacity, setCapacity] = useState<number>(8);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchHomes = async () => {
    setLoading(true);
    try {
      const data = await api.getSmallHomes();
      setHomes(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomes();
  }, []);

  const handleOpenAddModal = () => {
    setEditingHome(null);
    setName('');
    setAddress('');
    setDirectorName('');
    setPhone('');
    setCapacity(8);
    setNotes('');
    setErrorMsg(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (home: SmallFamilyHome) => {
    setEditingHome(home);
    setName(home.name);
    setAddress(home.address);
    setDirectorName(home.director_name || '');
    setPhone(home.phone || '');
    setCapacity(home.capacity || 8);
    setNotes(home.notes || '');
    setErrorMsg(null);
    setShowModal(true);
  };

  const handleDelete = async (home: SmallFamilyHome) => {
    if (!window.confirm(`ნამდვილად გსურთ "${home.name}"-ის წაშლა?`)) return;
    try {
      await api.deleteSmallHome(home.id);
      fetchHomes();
    } catch (err: any) {
      alert(err.message || 'წაშლისას დაფიქსირდა შეცდომა');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    try {
      if (editingHome) {
        await api.updateSmallHome(editingHome.id, {
          name,
          address,
          director_name: directorName,
          phone,
          capacity: Number(capacity),
          notes,
        });
      } else {
        await api.createSmallHome({
          name,
          address,
          director_name: directorName,
          phone,
          capacity: Number(capacity),
          notes,
          is_active: true,
        });
      }

      setShowModal(false);
      fetchHomes();
    } catch (err: any) {
      setErrorMsg(err.message || 'შეცდომა შენახვისას');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredHomes = homes.filter(
    (h) =>
      h.name.toLowerCase().includes(search.toLowerCase()) ||
      h.address.toLowerCase().includes(search.toLowerCase()) ||
      (h.director_name && h.director_name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
            <Home className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              მცირე საოჯახო ტიპის სახლების ცნობარი
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              კახეთის რეგიონში მოქმედი მცირე საოჯახო სახლების აღრიცხვა და ტევადობის მონიტორინგი
            </p>
          </div>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenAddModal}
            className="py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>ახალი სახლის დამატება</span>
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 flex items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ძებნა დასახელების, მისამართის ან დირექტორის მიხედვით..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      {/* Homes Grid */}
      {loading ? (
        <div className="bg-white rounded-2xl p-12 text-center text-slate-500 text-xs">
          მონაცემები იტვირთება...
        </div>
      ) : filteredHomes.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-slate-500 text-xs font-semibold">
          მცირე საოჯახო სახლები ვერ მოიძებნა.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredHomes.map((home) => {
            // Compute active occupants in this home
            const occupants = persons.filter(
              (p) =>
                p.case_status === 'აქტიური' &&
                p.current_placement?.placement_type === 'მცირე საოჯახო ტიპის სახლი' &&
                (p.current_placement?.small_home_id === home.id ||
                  p.current_placement?.location_or_organization === home.name)
            );

            const occupancyRate = home.capacity ? Math.round((occupants.length / home.capacity) * 100) : 0;

            return (
              <div
                key={home.id}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-slate-300 transition flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Title & Actions */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-slate-100 text-slate-700 rounded-xl">
                        <Home className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">{home.name}</h3>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{home.address}</span>
                        </p>
                      </div>
                    </div>

                    {isAdmin && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditModal(home)}
                          title="რედაქტირება"
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(home)}
                          title="წაშლა"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Director & Contact */}
                  <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1">
                        <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                        დირექტორი / პასუხისმგებელი:
                      </span>
                      <span className="font-semibold text-slate-800">
                        {home.director_name || 'არ არის მითითებული'}
                      </span>
                    </div>
                    {home.phone && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          ტელეფონი:
                        </span>
                        <span className="font-semibold text-slate-800">{home.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Capacity & Occupancy Meter */}
                  <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-blue-600" />
                        დატვირთულობა:
                      </span>
                      <span className="font-bold text-blue-900">
                        {occupants.length} / {home.capacity || '—'} ბავშვი
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          occupancyRate >= 100
                            ? 'bg-rose-600'
                            : occupancyRate >= 80
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(occupancyRate, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Occupants List preview */}
                  {occupants.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-[11px] font-bold text-slate-500 uppercase">
                        განთავსებული ბენეფიციარები ({occupants.length}):
                      </p>
                      <div className="max-h-24 overflow-y-auto space-y-1 text-xs">
                        {occupants.map((occ) => (
                          <button
                            key={occ.id}
                            onClick={() => onSelectPerson && onSelectPerson(occ)}
                            className="w-full text-left p-1.5 bg-slate-50 hover:bg-blue-50 rounded-lg text-slate-800 hover:text-blue-700 transition flex items-center justify-between font-medium cursor-pointer"
                          >
                            <span>
                              {occ.first_name} {occ.last_name}
                            </span>
                            <span className="text-[10px] text-slate-400">{occ.personal_number}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
                <Home className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingHome ? 'მცირე საოჯახო სახლის რედაქტირება' : 'ახალი სახლის დამატება'}
                </h3>
                <p className="text-xs text-slate-500 font-medium">ცნობარის მონაცემების შეყვანა</p>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">დასახელება *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="მაგ: თელავის მცირე საოჯახო სახლი №1"
                  required
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">მისამართი *</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="მაგ: ქ. თელავი, ერეკლე II-ის ქ. №12"
                  required
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">დირექტორი / ხელმძღვანელი</label>
                <input
                  type="text"
                  value={directorName}
                  onChange={(e) => setDirectorName(e.target.value)}
                  placeholder="სახელი, გვარი"
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ტელეფონი</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="599XXXXXX"
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ტევადობა (ადგილი)</label>
                  <input
                    type="number"
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                    min={1}
                    max={20}
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">შენიშვნა</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="დამატებითი ინფორმაცია..."
                  rows={2}
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 font-semibold text-slate-700 rounded-xl cursor-pointer"
                >
                  გაუქმება
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs cursor-pointer transition disabled:opacity-50"
                >
                  {submitting ? 'ინახება...' : 'შენახვა'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
