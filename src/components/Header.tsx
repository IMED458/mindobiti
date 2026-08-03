import React from 'react';
import { User } from '../types';
import { Shield, User as UserIcon, LogOut, Key, Building2, Menu } from 'lucide-react';

interface HeaderProps {
  user: User;
  onLogout: () => void;
  onChangePasswordClick: () => void;
  onOpenMobileNav?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onLogout,
  onChangePasswordClick,
  onOpenMobileNav,
}) => {
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 shadow-xs sticky top-0 z-30 md:hidden">
      <div className="px-4 py-3 flex items-center justify-between">
        {/* Mobile menu toggle & Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileNav}
            className="p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 cursor-pointer"
            aria-label="მენიუს გახსნა"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-600/20 text-blue-400 rounded-lg border border-blue-500/30">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-xs font-bold text-white leading-tight">მინდობითი აღზრდა</h1>
              <p className="text-[10px] text-slate-400">კახეთის ცენტრი</p>
            </div>
          </div>
        </div>

        {/* User quick badge */}
        <div className="flex items-center gap-2">
          <button
            onClick={onChangePasswordClick}
            title="პაროლის შე测ვლა"
            className="p-1.5 text-slate-300 hover:text-white bg-slate-800 rounded-lg border border-slate-700"
          >
            <Key className="w-4 h-4" />
          </button>
          <button
            onClick={onLogout}
            title="გამოსვლა"
            className="p-1.5 text-rose-300 bg-rose-950/40 rounded-lg border border-rose-800/50"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

