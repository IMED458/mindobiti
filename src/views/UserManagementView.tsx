import React, { useState, useEffect } from 'react';
import { UserCog, UserPlus, Shield, Lock, CheckCircle2, XCircle, Key, AlertCircle } from 'lucide-react';
import { User, UserRole } from '../types';
import { api } from '../api';

export const UserManagementView: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [position, setPosition] = useState('');
  const [role, setRole] = useState<UserRole>('თანამშრომელი');

  // Reset Password input
  const [newPassword, setNewPassword] = useState('');

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api.createUser({
        first_name: firstName,
        last_name: lastName,
        username,
        password,
        position,
        role,
      });

      setShowCreateModal(false);
      setFirstName('');
      setLastName('');
      setUsername('');
      setPassword('');
      setPosition('');
      loadUsers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (u: User) => {
    try {
      await api.updateUser(u.id, { is_active: !u.is_active });
      loadUsers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !newPassword) return;

    try {
      await api.updateUser(selectedUser.id, { password: newPassword });
      setShowResetModal(false);
      setNewPassword('');
      setSelectedUser(null);
      loadUsers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <UserCog className="w-6 h-6 text-slate-800" />
            <span>მომხმარებელთა და წვდომების მართვა</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            თანამშრომელთა ანგარიშების შექმნა, როლების მინიჭება და პაროლების აღდგენა.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>ახალი მომხმარებლის დამატება</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-900 text-white font-semibold">
              <th className="py-3 px-4">მომხმარებელი</th>
              <th className="py-3 px-4">სახელი, გვარი</th>
              <th className="py-3 px-4">თანამდებობა</th>
              <th className="py-3 px-4">როლი</th>
              <th className="py-3 px-4">სტატუსი</th>
              <th className="py-3 px-4 text-center">მოქმედება</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="py-3 px-4 font-mono font-bold text-blue-700">{u.username}</td>
                <td className="py-3 px-4 font-bold text-slate-900">
                  {u.first_name} {u.last_name}
                </td>
                <td className="py-3 px-4 text-slate-700">{u.position}</td>
                <td className="py-3 px-4">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      u.role === 'ადმინისტრატორი'
                        ? 'bg-purple-100 text-purple-900 border border-purple-300'
                        : 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="py-3 px-4">
                  {u.is_active ? (
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>აქტიური</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-rose-700 font-bold">
                      <XCircle className="w-3.5 h-3.5 text-rose-600" />
                      <span>შეჩერებული</span>
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-center space-x-2">
                  <button
                    onClick={() => {
                      setSelectedUser(u);
                      setShowResetModal(true);
                    }}
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                    title="პაროლის შეცვლა"
                  >
                    <Key className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleToggleActive(u)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      u.is_active ? 'bg-amber-100 text-amber-900 hover:bg-amber-200' : 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200'
                    }`}
                  >
                    {u.is_active ? 'შეჩერება' : 'გააქტიურება'}
                  </button>

                  <button
                    onClick={async () => {
                      if (window.confirm(`ნამდვილად გსურთ მომხმარებლის "${u.first_name} ${u.last_name}" (${u.username}) სრული წაშლა?`)) {
                        try {
                          await api.deleteUser(u.id);
                          loadUsers();
                        } catch (err: any) {
                          setError(err.message || 'წაშლისას დაფიქსირდა შეცდომა');
                        }
                      }
                    }}
                    className="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg text-xs font-bold transition cursor-pointer"
                    title="მომხმარებლის წაშლა"
                  >
                    წაშლა
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* CREATE USER MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">ახალი მომხმარებლის შექმნა</h3>
            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">სახელი</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">გვარი</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">მომხმარებელი (Username)</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full p-2 border border-slate-300 rounded-lg font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">საწყისი პაროლი</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">თანამდებობა</label>
                <input
                  type="text"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="მაგ: უფროსი სოციალური მუშაკი"
                  required
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">სისტემური როლი</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full p-2 border border-slate-300 rounded-lg font-bold"
                >
                  <option value="თანამშრომელი">თანამშრომელი</option>
                  <option value="ადმინისტრატორი">ადმინისტრატორი</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2 bg-slate-100 font-semibold rounded-lg cursor-pointer"
                >
                  გაუქმება
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg cursor-pointer"
                >
                  შექმნა
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {showResetModal && selectedUser && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              პაროლის შეცვლა: {selectedUser.first_name} {selectedUser.last_name}
            </h3>
            <form onSubmit={handleResetPassword} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">ახალი პაროლი</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="flex-1 py-2 bg-slate-100 font-semibold rounded-lg cursor-pointer"
                >
                  გაუქმება
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 text-white font-bold rounded-lg cursor-pointer"
                >
                  შეცვლა
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
