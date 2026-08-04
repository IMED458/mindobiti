import React, { useState, useEffect } from 'react';
import { User, Person, DashboardStats, NavTab } from './types';
import { api, getStoredToken } from './api';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { LoginModal } from './components/LoginModal';
import { DashboardView } from './views/DashboardView';
import { PersonsListView } from './views/PersonsListView';
import { PersonDetailView } from './views/PersonDetailView';
import { RegisterPersonView } from './views/RegisterPersonView';
import { RenewalsView } from './views/RenewalsView';
import { ReviewsView } from './views/ReviewsView';
import { AdulthoodView } from './views/AdulthoodView';
import { SmallFamilyHomesView } from './views/SmallFamilyHomesView';
import { FosterParentsView } from './views/FosterParentsView';
import { ReportsView } from './views/ReportsView';
import { UserManagementView } from './views/UserManagementView';
import { SettingsView } from './views/SettingsView';
import { AuditLogView } from './views/AuditLogView';
import { UserGuideView } from './views/UserGuideView';
import { Key, AlertCircle, CheckCircle2 } from 'lucide-react';

export function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [initializing, setInitializing] = useState(true);

  // App Data
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [persons, setPersons] = useState<Person[]>([]);
  const [stats, setStats] = useState<DashboardStats | undefined>(undefined);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [loadingData, setLoadingData] = useState(false);

  // Mobile Navigation Drawer
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Password Change Modal State
  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [pwdMsg, setPwdMsg] = useState<string | null>(null);
  const [pwdError, setPwdError] = useState<string | null>(null);

  // Initial Auth Verification
  useEffect(() => {
    const token = getStoredToken();
    if (token) {
      api
        .getCurrentUser()
        .then((res) => {
          setCurrentUser(res.user);
          if (res.user.must_change_password) {
            setMustChangePassword(true);
            setShowPasswordChangeModal(true);
          }
        })
        .catch(() => {
          api.logout();
        })
        .finally(() => setInitializing(false));
    } else {
      setInitializing(false);
    }
  }, []);

  // Fetch Data when authenticated
  const refreshData = async () => {
    if (!currentUser) return;
    setLoadingData(true);
    try {
      const [personsData, statsData] = await Promise.all([
        api.getPersons({ include_archived: true }),
        api.getDashboardStats(),
      ]);
      setPersons(personsData);
      setStats(statsData);

      // If a person is currently selected, refresh their profile too
      if (selectedPerson) {
        const updated = personsData.find((p) => p.id === selectedPerson.id);
        if (updated) setSelectedPerson(updated);
      }
    } catch {
      // ignore
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      refreshData();
    }
  }, [currentUser]);

  // Login handler
  const handleLoginSuccess = (user: User, mustChange?: boolean) => {
    setCurrentUser(user);
    if (mustChange || user.must_change_password) {
      setMustChangePassword(true);
      setShowPasswordChangeModal(true);
    }
  };

  // Logout handler
  const handleLogout = async () => {
    await api.logout();
    setCurrentUser(null);
    setSelectedPerson(null);
  };

  // Change Password Handler
  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPasswordInput || newPasswordInput.length < 6) {
      setPwdError('ახალი პაროლი უნდა შეიცავდეს მინიმუმ 6 სიმბოლოს.');
      return;
    }

    try {
      await api.changePassword(newPasswordInput);
      setPwdMsg('პაროლი წარმატებით შეიცვალა!');
      setPwdError(null);
      setMustChangePassword(false);
      setTimeout(() => {
        setShowPasswordChangeModal(false);
        setNewPasswordInput('');
        setPwdMsg(null);
      }, 1500);
    } catch (err: any) {
      setPwdError(err.message || 'შეცდომა პაროლის შეცვლისას.');
    }
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 text-white">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-300">სისტემა იტვირთება...</p>
        </div>
      </div>
    );
  }

  // If not logged in, render Login Modal
  if (!currentUser) {
    return <LoginModal onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      {/* Mobile Top Header */}
      <Header
        user={currentUser}
        onLogout={handleLogout}
        onChangePasswordClick={() => setShowPasswordChangeModal(true)}
        onOpenMobileNav={() => setMobileNavOpen(true)}
      />

      {/* Fixed Left Navigation Sidebar (Desktop) + Mobile Drawer */}
      <Navigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        user={currentUser}
        stats={stats}
        isOpenMobile={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
        onLogout={handleLogout}
        onChangePasswordClick={() => setShowPasswordChangeModal(true)}
      />

      {/* Main Content Area Offset for Desktop Fixed Sidebar (md:pl-64) */}
      <div className="flex-1 md:pl-64 flex flex-col">
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {activeTab === 'dashboard' && (
            <DashboardView
              stats={stats}
              persons={persons}
              onNavigate={setActiveTab}
              onSelectPerson={setSelectedPerson}
            />
          )}

          {activeTab === 'persons' && (
            <PersonsListView
              persons={persons}
              onSelectPerson={setSelectedPerson}
              onNavigateRegister={() => setActiveTab('register')}
              onRefresh={refreshData}
              loading={loadingData}
            />
          )}

          {activeTab === 'register' && (
            <RegisterPersonView
              onSuccess={() => {
                refreshData();
                setActiveTab('persons');
              }}
              onCancel={() => setActiveTab('persons')}
            />
          )}

          {activeTab === 'renewals' && (
            <RenewalsView persons={persons} onSelectPerson={setSelectedPerson} />
          )}

          {activeTab === 'reviews' && (
            <ReviewsView
              persons={persons}
              onSelectPerson={setSelectedPerson}
              onRefresh={refreshData}
            />
          )}

          {activeTab === 'adulthood' && (
            <AdulthoodView persons={persons} onSelectPerson={setSelectedPerson} />
          )}

          {activeTab === 'age18' && (
            <AdulthoodView persons={persons} onSelectPerson={setSelectedPerson} filterAge={18} />
          )}

          {activeTab === 'age21' && (
            <AdulthoodView persons={persons} onSelectPerson={setSelectedPerson} filterAge={21} />
          )}

          {activeTab === 'small_homes' && (
            <SmallFamilyHomesView
              user={currentUser}
              persons={persons}
              onSelectPerson={setSelectedPerson}
            />
          )}

          {activeTab === 'foster_parents' && (
            <FosterParentsView
              user={currentUser}
              persons={persons}
              onSelectPerson={setSelectedPerson}
              onRefresh={refreshData}
            />
          )}

          {activeTab === 'reports' && <ReportsView persons={persons} />}

          {activeTab === 'users' && <UserManagementView />}

          {activeTab === 'settings' && <SettingsView />}

          {activeTab === 'audit' && <AuditLogView />}

          {activeTab === 'guide' && <UserGuideView />}
        </main>
      </div>

      {/* Person Detail View Modal */}
      {selectedPerson && (
        <PersonDetailView
          person={selectedPerson}
          currentUser={currentUser}
          onClose={() => setSelectedPerson(null)}
          onRefresh={refreshData}
        />
      )}

      {/* Password Change Modal */}
      {showPasswordChangeModal && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
                <Key className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">პაროლის შეცვლა</h3>
                {mustChangePassword && (
                  <p className="text-xs text-amber-700 font-semibold">
                    უსაფრთხოების მიზნით პირველი შესვლისას აუცილებელია პაროლის შეცვლა.
                  </p>
                )}
              </div>
            </div>

            {pwdMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{pwdMsg}</span>
              </div>
            )}

            {pwdError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{pwdError}</span>
              </div>
            )}

            <form onSubmit={handleChangePasswordSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">ახალი პაროლი (მინიმუმ 6 სიმბოლო)</label>
                <input
                  type="password"
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder="შეიყვანეთ ახალი პაროლი"
                  required
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex gap-2 pt-2">
                {!mustChangePassword && (
                  <button
                    type="button"
                    onClick={() => setShowPasswordChangeModal(false)}
                    className="flex-1 py-2 bg-slate-100 font-semibold rounded-xl text-slate-700 cursor-pointer"
                  >
                    გაუქმება
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition cursor-pointer"
                >
                  პაროლის განახლება
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
