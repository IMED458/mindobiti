import React, { useState, useEffect } from 'react';
import { Sliders, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { SystemSettings } from '../types';
import { api } from '../api';

export const SettingsView: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getSettings().then(setSettings).catch((err) => setError(err.message));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setLoading(true);
    setSaved(false);
    setError(null);

    try {
      const updated = await api.updateSettings(settings);
      setSettings(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!settings) return <div className="p-8 text-center text-xs text-slate-500">იტვირთება პარამეტრები...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Sliders className="w-6 h-6 text-blue-600" />
          <span>სისტემური პარამეტრები და შეხსენებების წესები</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          პროგრამების ვადების წინასწარი შეხსენების (Advance Reminder) და კრიტიკული პერიოდის (Critical Period) კონფიგურაცია.
        </p>
      </div>

      {saved && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>პარამეტრები წარმატებით შენახულია.</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-6 text-xs">
        <div>
          <label className="block font-bold text-slate-900 mb-1">
            წინასწარი შეხსენების პერიოდი (Advance Reminder Threshold)
          </label>
          <p className="text-slate-500 mb-2">
            რამდენი ხნით ადრე უნდა მიენიჭოს ქეისს სტატუსი <span className="font-bold text-amber-600">„გასაგრძელებელი“</span>.
          </p>
          <select
            value={settings.advance_reminder_value}
            onChange={(e) =>
              setSettings({
                ...settings,
                advance_reminder_value: Number(e.target.value),
              })
            }
            className="w-full sm:w-64 p-2.5 border border-slate-300 rounded-xl font-bold text-slate-800"
          >
            <option value={2}>2 თვე (ნაგულისხმევი)</option>
            <option value={1}>1 თვე</option>
            <option value={15}>15 დღე</option>
            <option value={10}>10 დღე</option>
            <option value={5}>5 დღე</option>
          </select>
        </div>

        <div>
          <label className="block font-bold text-slate-900 mb-1">
            კრიტიკული პერიოდის ზღვარი (Critical Days Threshold)
          </label>
          <p className="text-slate-500 mb-2">
            რამდენი დღის დარჩენისას უნდა მიენიჭოს ქეისს სტატუსი <span className="font-bold text-red-600">„კრიტიკული“</span>.
          </p>
          <input
            type="number"
            min={1}
            max={30}
            value={settings.critical_days_threshold}
            onChange={(e) =>
              setSettings({
                ...settings,
                critical_days_threshold: Number(e.target.value),
              })
            }
            className="w-full sm:w-64 p-2.5 border border-slate-300 rounded-xl font-bold text-slate-800"
          />
          <span className="text-[11px] text-slate-400 block mt-1">ნაგულისხმევი მნიშვნელობა: 3 დღე</span>
        </div>

        <div className="pt-4 border-t border-slate-200 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'ინახება...' : 'პარამეტრების შენახვა'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
