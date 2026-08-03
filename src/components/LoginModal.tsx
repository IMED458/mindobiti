import React, { useState } from 'react';
import { Building2, Key, User, Eye, EyeOff, Lock, AlertCircle, ShieldCheck } from 'lucide-react';
import { api } from '../api';
import { User as UserType } from '../types';

interface LoginModalProps {
  onLoginSuccess: (user: UserType, mustChangePassword?: boolean) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Password reset dialog state
  const [showResetModal, setShowResetModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('გთხოვთ, შეავსოთ მომხმარებლის სახელი და პაროლი.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.login(username, password);
      onLoginSuccess(res.user, res.mustChangePassword);
    } catch (err: any) {
      setError(err.message || 'ავტორიზაცია ვერ განხორციელდა. შეამოწმეთ მონაცემები.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
        {/* Header Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 p-6 text-white text-center">
          <div className="w-14 h-14 bg-blue-600/30 text-blue-400 border border-blue-400/30 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Building2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">მინდობითი აღზრდის პორტალი</h2>
          <p className="text-xs text-slate-300 mt-1">
            სახელმწიფო ზრუნვისა და ტრეფიკინგის მსხვერპლთა დახმარების სააგენტო
          </p>
          <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-500/20 text-blue-300 border border-blue-400/30">
            კახეთის რეგიონული ცენტრი
          </span>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 block">მომხმარებლის სახელი</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="მაგ: lela"
                required
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 block">პაროლი</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="პაროლი"
                required
                className="w-full pl-9 pr-10 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-sm transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : (
              <ShieldCheck className="w-4 h-4" />
            )}
            <span>სისტემაში შესვლა</span>
          </button>

          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => setShowResetModal(true)}
              className="text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium cursor-pointer"
            >
              დაგავიწყდათ პაროლი? (პაროლის აღდგენა)
            </button>
          </div>
        </form>
      </div>

      {/* Reset Password Info Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 text-center space-y-3">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
              <Key className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">პაროლის აღდგენა</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              უსაფრთხოების წესების თანახმად, პაროლის აღდგენა ხორციელდება სისტემის ადმინისტრატორის მიერ
              ერთჯერადი დროებითი პაროლის მინიჭებით.
            </p>
            <p className="text-xs font-semibold text-slate-800">
              მიმართეთ ადმინისტრატორს (ლელა მამუკელაშვილი) ახალი დროებითი პაროლის მისაღებად.
            </p>
            <button
              onClick={() => setShowResetModal(false)}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-lg cursor-pointer"
            >
              დახურვა
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
