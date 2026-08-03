import React from 'react';
import { BookOpen, ShieldCheck, Database, Calendar, Users, Lock, RefreshCw, Home } from 'lucide-react';

export const UserGuideView: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 text-xs text-slate-700">
      {/* Title Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-blue-600" />
          <span>მომხმარებლის სახელმძღვანელო და სისტემური დოკუმენტაცია</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          „მინდობითი აღზრდის პორტალის“ ექსპლუატაციის, უსაფრთხოების, სარეზერვო ასლებისა და წესების დეტალური ინსტრუქცია.
        </p>
      </div>

      {/* Section 1: Authorization & Roles */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-600" />
          <span>1. ავტორიზაცია, როლები და უსაფრთხოება</span>
        </h3>
        <p className="leading-relaxed">
          სისტემაში წვდომა რეგულირდება როლური მოდელით (ადმინისტრატორი, სოციალური მუშაკი/თანამშრომელი).
          ადმინისტრატორს აქვს მომხმარებელთა მართვის, ქეისის დაბლოკვისა და სრული წაშლის უფლება.
        </p>
      </div>

      {/* Section 2: Social Programs & Registration */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-amber-600" />
          <span>2. სოციალური პროგრამების რეგისტრაცია და დინამიური ველები</span>
        </h3>
        <p className="leading-relaxed">
          ახალი პირის რეგისტრაციისას პროგრამის არჩევა სავალდებულოა. სისტემა მხარს უჭერს 5 ძირითად პროგრამას:
        </p>
        <ul className="list-disc pl-5 space-y-2 leading-relaxed">
          <li>
            <strong className="text-slate-900">გადაუდებელი მინდობითი აღზრდა:</strong> 90-დღიანი ვადით (შესაძლებელია ხელით კორექტირება).
          </li>
          <li>
            <strong className="text-slate-900">რეგულარული მინდობითი აღზრდა:</strong> მიმღები ოჯახის, ხელშეკრულების №-ისა და თარიღის მითითებით.
          </li>
          <li>
            <strong className="text-slate-900">ნათესაური მინდობითი აღზრდა:</strong> ნათესაური კავშირის (ბებია, დეიდა, ბიძა...) და ბრძანების №-ის ჩანაწერით.
          </li>
          <li>
            <strong className="text-slate-900">მცირე საოჯახო ტიპის სახლი:</strong> ცნობარიდან კონკრეტული სახლის არჩევითა და ტევადობის ავტომატური აღრიცხვით.
          </li>
          <li>
            <strong className="text-slate-900">რეინტეგრაცია:</strong> ბიოლოგიურ ოჯახში დაბრუნება და ყოველთვიური ფინანსური დახმარების ოდენობა.
          </li>
        </ul>
      </div>

      {/* Section 3: 6-Month Review Cycle */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-blue-600" />
          <span>3. 6-თვიანი შუალედური გადასინჯვები</span>
        </h3>
        <p className="leading-relaxed">
          პროგრამაში განთავსებულ ყოველ ბენეფიციარზე ავტომატურად იგეგმება 6-თვიანი პერიოდული გადასინჯვები.
          სოციალური მუშაკი აფიქსირებს გადასინჯვის შედეგებს, იღებს გადაწყვეტილებას პროგრამის გაგრძელების ან დასრულების შესახებ და უთითებს ახალ დაგეგმილ თარიღს.
        </p>
      </div>

      {/* Section 4: Small Family Homes Dictionary */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
          <Home className="w-4 h-4 text-emerald-600" />
          <span>4. მცირე საოჯახო ტიპის სახლების ცნობარი</span>
        </h3>
        <p className="leading-relaxed">
          ცნობარების განყოფილებაში შესაძლებელია კახეთის რეგიონის მცირე საოჯახო სახლების აღრიცხვა, დირექტორების, ტელეფონების, მისამართებისა და ტევადობის კონტროლი.
        </p>
      </div>

      {/* Section 5: Data Backup & Cron */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-600" />
          <span>5. მონაცემთა ბაზა და სარეზერვო ასლები (Backup)</span>
        </h3>
        <p className="leading-relaxed">
          მონაცემთა ბაზა ინახება ფაილურ სისტემაში (<code className="bg-slate-100 px-1.5 py-0.5 rounded border">data/db.json</code>).
        </p>
        <pre className="bg-slate-900 text-emerald-400 p-3 rounded-xl font-mono text-[11px] overflow-x-auto">
          # ყოველდღიურად ღამის 00:00 საათზე ბაზის სარეზერვო ასლის შექმნა{'\n'}
          0 0 * * * cp /app/data/db.json /app/data/backups/db_$(date +\%Y\%m\%d).json
        </pre>
      </div>
    </div>
  );
};
