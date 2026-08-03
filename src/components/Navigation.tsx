import React from 'react';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Clock,
  RefreshCw,
  CalendarDays,
  Sparkles,
  Home,
  FileSpreadsheet,
  UserCog,
  Sliders,
  History,
  BookOpen,
  Building2,
  Shield,
  Key,
  LogOut,
  X,
} from 'lucide-react';
import { User, DashboardStats, NavTab } from '../types';

interface NavigationProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  user: User;
  stats?: DashboardStats;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  onLogout?: () => void;
  onChangePasswordClick?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  user,
  stats,
  isOpenMobile = false,
  onCloseMobile,
  onLogout,
  onChangePasswordClick,
}) => {
  const isAdmin = user.role === 'ადმინისტრატორი';

  const groups = [
    {
      title: 'ძირითადი მენიუ',
      items: [
        { id: 'dashboard' as NavTab, label: 'დეშბორდი', icon: LayoutDashboard },
        { id: 'persons' as NavTab, label: 'ბენეფიციარები', icon: Users, badge: stats?.active_cases },
        { id: 'register' as NavTab, label: 'ახალი რეგისტრაცია', icon: UserPlus, highlight: true },
        {
          id: 'renewals' as NavTab,
          label: 'ვადის გაგრძელება',
          icon: Clock,
          badge: (stats?.overdue_count || 0) + (stats?.critical_count || 0) + (stats?.renewal_due_count || 0),
          badgeColor: (stats?.overdue_count || 0) > 0 ? 'bg-rose-600' : 'bg-amber-600',
        },
        {
          id: 'reviews' as NavTab,
          label: '6-თვიანი გადასინჯვა',
          icon: RefreshCw,
          badge: (stats?.reviews_due_count || 0) + (stats?.reviews_overdue_count || 0),
          badgeColor: (stats?.reviews_overdue_count || 0) > 0 ? 'bg-rose-600' : 'bg-blue-600',
        },
      ],
    },
    {
      title: 'ასაკობრივი მონიტორინგი',
      items: [
        { id: 'age18' as NavTab, label: '18 წლის პირები', icon: CalendarDays, badge: stats?.approaching_18_count },
        { id: 'age21' as NavTab, label: '21 წლის პირები', icon: Sparkles, badge: stats?.approaching_21_count },
      ],
    },
    {
      title: 'ცნობარები & ანგარიშები',
      items: [
        { id: 'small_homes' as NavTab, label: 'მცირე საოჯახო სახლები', icon: Home },
        { id: 'reports' as NavTab, label: 'რეპორტინგი & ექსპორტი', icon: FileSpreadsheet },
      ],
    },
  ];

  if (isAdmin) {
    groups.push({
      title: 'ადმინისტრირება',
      items: [
        { id: 'users' as NavTab, label: 'მომხმარებლები', icon: UserCog },
        { id: 'settings' as NavTab, label: 'პარამეტრები', icon: Sliders },
        { id: 'audit' as NavTab, label: 'აუდიტის ჟურნალი', icon: History },
      ],
    });
  }

  groups.push({
    title: 'დახმარება',
    items: [{ id: 'guide' as NavTab, label: 'სახელმძღვანელო', icon: BookOpen }],
  });

  const content = (
    <div className="flex flex-col h-full text-slate-300">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30 shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight leading-tight">
              მინდობითი აღზრდა
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">კახეთის ცენტრი</p>
          </div>
        </div>

        {/* Mobile close button */}
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav Groups Container */}
      <div className="flex-1 overflow-y-auto p-3 space-y-5 scrollbar-thin scrollbar-thumb-slate-700">
        {groups.map((group, idx) => (
          <div key={idx} className="space-y-1">
            <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {group.title}
            </div>
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id);
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                      : item.highlight
                      ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/40 hover:bg-emerald-900/50'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white ${
                        item.badgeColor || 'bg-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* User Profile Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/50 space-y-2">
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <div className="p-2 bg-slate-800 text-blue-400 rounded-lg shrink-0">
            <Shield className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">
              {user.first_name} {user.last_name}
            </p>
            <p className="text-[10px] text-slate-400 truncate">
              {user.role} • {user.position}
            </p>
          </div>
        </div>

        <div className="flex gap-1.5">
          {onChangePasswordClick && (
            <button
              onClick={onChangePasswordClick}
              title="პაროლის შეცვლა"
              className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition cursor-pointer"
            >
              <Key className="w-3.5 h-3.5" />
              <span>პაროლი</span>
            </button>
          )}

          {onLogout && (
            <button
              onClick={onLogout}
              title="სისტემიდან გამოსვლა"
              className="py-1.5 px-2.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>გამოსვლა</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Left Sidebar */}
      <aside className="hidden md:flex fixed top-0 left-0 bottom-0 w-64 bg-slate-900 border-r border-slate-800 z-40 flex-col">
        {content}
      </aside>

      {/* Mobile Drawer Backdrop & Sidebar */}
      {isOpenMobile && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 bg-slate-900 border-r border-slate-800 z-10 flex flex-col h-full shadow-2xl">
            {content}
          </div>
        </div>
      )}
    </>
  );
};

