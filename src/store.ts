// Firestore-backed store — server/store.ts-ის სრული client-side პორტი.
// ყველა მონაცემი ინახება მხოლოდ Firebase Firestore-ზე (ლოკალურად არაფერი).
import bcrypt from 'bcryptjs';
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  query,
  orderBy,
  limit as fsLimit,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  User,
  Person,
  Placement,
  PlacementExtension,
  SystemSettings,
  AuditLog,
  CaseReview,
  SmallFamilyHome,
  DashboardStats,
} from './types';
import {
  getTodayTbilisiISO,
  addDaysISO,
  addMonthsISO,
  diffDaysISO,
  calculateAge,
  get18thBirthdayISO,
  get21stBirthdayISO,
} from './utils';

const DEFAULT_SETTINGS: SystemSettings = {
  advance_reminder_value: 2,
  advance_reminder_unit: 'month',
  critical_reminder_value: 3,
  critical_reminder_unit: 'day',
};

interface DatabaseSchema {
  users: (User & { password_hash?: string })[];
  persons: Person[];
  placements: Placement[];
  extensions: PlacementExtension[];
  reviews: CaseReview[];
  small_family_homes: SmallFamilyHome[];
  settings: SystemSettings;
  audit_logs: AuditLog[];
  case_counter: number;
}

/** Firestore-ს არ შეუძლია `undefined`-ის შენახვა — ღრმად ვასუფთავებთ. */
function clean<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj.map((v) => clean(v)) as unknown as T;
  }
  if (obj && typeof obj === 'object') {
    const out: any = {};
    for (const [k, v] of Object.entries(obj as any)) {
      if (v === undefined) continue;
      out[k] = clean(v);
    }
    return out;
  }
  return obj;
}

class FirestoreStore {
  private data: DatabaseSchema = {
    users: [],
    persons: [],
    placements: [],
    extensions: [],
    reviews: [],
    small_family_homes: [],
    settings: { ...DEFAULT_SETTINGS },
    audit_logs: [],
    case_counter: 1000,
  };

  private loadedPromise: Promise<void> | null = null;

  // --- Collection references ---
  private col(name: string) {
    return collection(db, name);
  }

  /** ერთხელ ჩატვირთვა + seed + live subscriptions. */
  public ensureLoaded(): Promise<void> {
    if (!this.loadedPromise) {
      this.loadedPromise = this.loadAll();
    }
    return this.loadedPromise;
  }

  private async loadAll() {
    // 1. საწყისი ჩატვირთვა
    const [
      usersSnap,
      personsSnap,
      placementsSnap,
      extensionsSnap,
      reviewsSnap,
      homesSnap,
      auditSnap,
      metaSnap,
    ] = await Promise.all([
      getDocs(this.col('users')),
      getDocs(this.col('persons')),
      getDocs(this.col('placements')),
      getDocs(this.col('extensions')),
      getDocs(this.col('reviews')),
      getDocs(this.col('small_family_homes')),
      getDocs(query(this.col('audit_logs'), orderBy('created_at', 'desc'), fsLimit(500))),
      getDocs(this.col('meta')),
    ]);

    this.data.users = usersSnap.docs.map((d) => d.data() as any);
    this.data.persons = personsSnap.docs.map((d) => d.data() as Person);
    this.data.placements = placementsSnap.docs.map((d) => d.data() as Placement);
    this.data.extensions = extensionsSnap.docs.map((d) => d.data() as PlacementExtension);
    this.data.reviews = reviewsSnap.docs.map((d) => d.data() as CaseReview);
    this.data.small_family_homes = homesSnap.docs.map((d) => d.data() as SmallFamilyHome);
    this.data.audit_logs = auditSnap.docs.map((d) => d.data() as AuditLog);

    const settingsDoc = metaSnap.docs.find((d) => d.id === 'settings');
    const countersDoc = metaSnap.docs.find((d) => d.id === 'counters');
    this.data.settings = settingsDoc ? (settingsDoc.data() as SystemSettings) : { ...DEFAULT_SETTINGS };
    this.data.case_counter = countersDoc ? (countersDoc.data() as any).case_counter ?? 1000 : 1000;

    // 2. Seed (მხოლოდ თუ ცარიელია)
    await this.seedIfNeeded(!settingsDoc, !countersDoc);

    // 3. Live subscriptions — სხვა კლიენტების ცვლილებების ასახვა
    this.subscribeAll();
  }

  private async seedIfNeeded(missingSettings: boolean, missingCounters: boolean) {
    const batch = writeBatch(db);
    let dirty = false;

    // საწყისი ადმინი
    if (!this.data.users.some((u) => u.username === 'lela')) {
      const now = new Date().toISOString();
      const passwordHash = bcrypt.hashSync('otogio123', 10);
      const adminUser: User & { password_hash?: string } = {
        id: 'user_admin_001',
        first_name: 'ლელა',
        last_name: 'მამუკელაშვილი',
        position: 'მოქალაქეთა მისაღები და დოკუმენტბრუნვის განყოფილების უფროსი',
        role: 'ადმინისტრატორი',
        phone: '599000000',
        username: 'lela',
        is_active: true,
        must_change_password: true,
        created_at: now,
        updated_at: now,
        password_hash: passwordHash,
      };
      this.data.users.push(adminUser);
      batch.set(doc(db, 'users', adminUser.id), clean(adminUser));
      dirty = true;
    }

    // ნაგულისხმევი მცირე საოჯახო სახლები
    if (this.data.small_family_homes.length === 0) {
      const now = new Date().toISOString();
      const homes: SmallFamilyHome[] = [
        { id: 'sfh_001', name: 'თელავის მცირე საოჯახო ტიპის სახლი', address: 'ქ. თელავი, ერეკლე II-ის ქ. #12', responsible_person: 'გიორგი მაისურაძე', phone: '595112233', is_active: true, created_at: now },
        { id: 'sfh_002', name: 'გურჯაანის მცირე საოჯახო ტიპის სახლი', address: 'ქ. გურჯაანი, ნონეშვილის ქ. #45', responsible_person: 'ნინო ბერიძე', phone: '599445566', is_active: true, created_at: now },
        { id: 'sfh_003', name: 'სიღნაღის მცირე საოჯახო ტიპის სახლი', address: 'ქ. სიღნაღი, რუსთაველის ქ. #8', responsible_person: 'დავით ჯაფარიძე', phone: '591778899', is_active: true, created_at: now },
        { id: 'sfh_004', name: 'ყვარლის მცირე საოჯახო ტიპის სახლი', address: 'ქ. ყვარელი, ჭავჭავაძის ქ. #23', responsible_person: 'მაია კაპანაძე', phone: '598334455', is_active: true, created_at: now },
      ];
      this.data.small_family_homes = homes;
      homes.forEach((h) => batch.set(doc(db, 'small_family_homes', h.id), clean(h)));
      dirty = true;
    }

    if (missingSettings) {
      batch.set(doc(db, 'meta', 'settings'), clean(this.data.settings));
      dirty = true;
    }
    if (missingCounters) {
      batch.set(doc(db, 'meta', 'counters'), { case_counter: this.data.case_counter });
      dirty = true;
    }

    if (dirty) {
      await batch.commit();
    }
  }

  private subscribeAll() {
    const simple: [string, keyof DatabaseSchema][] = [
      ['users', 'users'],
      ['persons', 'persons'],
      ['placements', 'placements'],
      ['extensions', 'extensions'],
      ['reviews', 'reviews'],
      ['small_family_homes', 'small_family_homes'],
    ];
    simple.forEach(([colName, key]) => {
      onSnapshot(this.col(colName), (snap) => {
        (this.data as any)[key] = snap.docs.map((d) => d.data());
      });
    });

    onSnapshot(query(this.col('audit_logs'), orderBy('created_at', 'desc'), fsLimit(500)), (snap) => {
      this.data.audit_logs = snap.docs.map((d) => d.data() as AuditLog);
    });

    onSnapshot(this.col('meta'), (snap) => {
      const s = snap.docs.find((d) => d.id === 'settings');
      const c = snap.docs.find((d) => d.id === 'counters');
      if (s) this.data.settings = s.data() as SystemSettings;
      if (c) this.data.case_counter = (c.data() as any).case_counter ?? this.data.case_counter;
    });
  }

  // --- Firestore write helpers ---
  private persist(colName: string, entity: { id: string }) {
    return setDoc(doc(db, colName, entity.id), clean(entity));
  }
  private persistDelete(colName: string, id: string) {
    return deleteDoc(doc(db, colName, id));
  }

  private async addAuditLog(entry: Omit<AuditLog, 'id' | 'created_at'>) {
    const log: AuditLog = {
      ...entry,
      id: `audit_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      created_at: new Date().toISOString(),
    };
    this.data.audit_logs.unshift(log);
    if (this.data.audit_logs.length > 5000) this.data.audit_logs.length = 5000;
    await setDoc(doc(db, 'audit_logs', log.id), clean(log));
  }

  // ============================ AUTH ============================
  public getUserByUsername(username: string) {
    return this.data.users.find((u) => u.username.toLowerCase() === username.toLowerCase());
  }

  public getUserById(id: string): User | undefined {
    const u = this.data.users.find((x) => x.id === id);
    if (!u) return undefined;
    const clean = { ...u };
    delete (clean as any).password_hash;
    return clean;
  }

  public verifyLogin(username: string, password: string): { user: User; mustChangePassword: boolean } {
    const user = this.getUserByUsername(username);
    if (!user) throw new Error('არასწორი მომხმარებელი ან პაროლი');
    if (!user.is_active) throw new Error('თქვენი ანგარიში შეჩერებულია. მიმართეთ ადმინისტრატორს.');
    const hash = (user as any).password_hash;
    const match = hash ? bcrypt.compareSync(password, hash) : false;
    if (!match) throw new Error('არასწორი მომხმარებელი ან პაროლი');
    const clean = { ...user };
    delete (clean as any).password_hash;
    return { user: clean, mustChangePassword: !!user.must_change_password };
  }

  public async setUserPassword(username: string, newPasswordRaw: string, modifierName: string) {
    const user = this.getUserByUsername(username);
    if (!user) throw new Error('მომხმარებელი ვერ მოიძებნა.');
    (user as any).password_hash = bcrypt.hashSync(newPasswordRaw, 10);
    user.must_change_password = false;
    user.updated_at = new Date().toISOString();
    await this.persist('users', user);
    await this.addAuditLog({
      user_id: modifierName, user_name: modifierName,
      action: 'პაროლის შეცვლა', entity_type: 'User', entity_id: user.id,
      reason: 'მომხმარებელმა შეცვალა პაროლი',
    });
  }

  // ============================ USERS ============================
  public getUsers(): User[] {
    return this.data.users.map((u) => {
      const c = { ...u };
      delete (c as any).password_hash;
      return c;
    });
  }

  public async createUser(userData: any, creatorName: string): Promise<User> {
    if (this.getUserByUsername(userData.username)) {
      throw new Error('ამ მომხმარებლის სახელით ანგარიში უკვე არსებობს.');
    }
    const now = new Date().toISOString();
    const id = `user_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const passwordHash = bcrypt.hashSync(userData.password || 'otogio123', 10);
    const newUser: User & { password_hash?: string } = {
      ...userData,
      id,
      password_hash: passwordHash,
      created_at: now,
      updated_at: now,
    };
    delete (newUser as any).password;
    this.data.users.push(newUser);
    await this.persist('users', newUser);
    await this.addAuditLog({
      user_id: creatorName, user_name: creatorName,
      action: 'მომხმარებლის შექმნა', entity_type: 'User', entity_id: id,
      new_values: { username: newUser.username, role: newUser.role, position: newUser.position },
      reason: 'ახალი მომხმარებლის რეგისტრაცია',
    });
    const clean = { ...newUser };
    delete clean.password_hash;
    return clean;
  }

  public async updateUser(id: string, updates: any, modifierName: string): Promise<User> {
    const user = this.data.users.find((u) => u.id === id);
    if (!user) throw new Error('მომხმარებელი ვერ მოიძებნა.');
    const oldVal = { ...user };
    delete (oldVal as any).password_hash;

    if (updates.first_name) user.first_name = updates.first_name;
    if (updates.last_name) user.last_name = updates.last_name;
    if (updates.position) user.position = updates.position;
    if (updates.phone) user.phone = updates.phone;
    if (updates.role) user.role = updates.role;
    if (typeof updates.is_active === 'boolean') user.is_active = updates.is_active;
    if (typeof updates.must_change_password === 'boolean') user.must_change_password = updates.must_change_password;
    if (updates.new_password) {
      (user as any).password_hash = bcrypt.hashSync(updates.new_password, 10);
      user.must_change_password = true;
    }
    user.updated_at = new Date().toISOString();
    await this.persist('users', user);

    const newVal = { ...user };
    delete (newVal as any).password_hash;
    await this.addAuditLog({
      user_id: modifierName, user_name: modifierName,
      action: 'მომხმარებლის განახლება', entity_type: 'User', entity_id: id,
      old_values: oldVal, new_values: newVal,
      reason: updates.new_password ? 'დროებითი პაროლის მინიჭება' : 'მონაცემების რედაქტირება',
    });
    return newVal;
  }

  public async deleteUser(userId: string, modifierName: string): Promise<boolean> {
    const user = this.data.users.find((u) => u.id === userId);
    if (!user) throw new Error('მომხმარებელი ვერ მოიძებნა.');
    if (user.username === 'lela') throw new Error('მთავარი ადმინისტრატორის წაშლა შეზღუდულია.');
    this.data.users = this.data.users.filter((u) => u.id !== userId);
    await this.persistDelete('users', userId);
    await this.addAuditLog({
      user_id: modifierName, user_name: modifierName,
      action: 'მომხმარებლის წაშლა', entity_type: 'User', entity_id: userId,
      reason: `წაიშალა მომხმარებელი: ${user.first_name} ${user.last_name} (${user.username})`,
    });
    return true;
  }

  // ==================== SMALL FAMILY HOMES ====================
  public getSmallHomes(): SmallFamilyHome[] {
    return this.data.small_family_homes || [];
  }

  public async createSmallHome(homeData: any, modifierName: string): Promise<SmallFamilyHome> {
    const now = new Date().toISOString();
    const home: SmallFamilyHome = {
      ...homeData,
      id: `sfh_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      is_active: homeData.is_active ?? true,
      created_at: now,
    };
    this.data.small_family_homes.push(home);
    await this.persist('small_family_homes', home);
    await this.addAuditLog({
      user_id: modifierName, user_name: modifierName,
      action: 'მცირე საოჯახო ტიპის სახლის დამატება', entity_type: 'SmallFamilyHome', entity_id: home.id,
      new_values: home,
    });
    return home;
  }

  public async updateSmallHome(id: string, updates: any, modifierName: string): Promise<SmallFamilyHome> {
    const home = this.data.small_family_homes.find((h) => h.id === id);
    if (!home) throw new Error('სახლი ვერ მოიძებნა.');
    Object.assign(home, updates);
    home.updated_at = new Date().toISOString();
    await this.persist('small_family_homes', home);
    await this.addAuditLog({
      user_id: modifierName, user_name: modifierName,
      action: 'მცირე საოჯახო ტიპის სახლის განახლება', entity_type: 'SmallFamilyHome', entity_id: id,
      new_values: home,
    });
    return home;
  }

  public async deleteSmallHome(id: string, modifierName: string): Promise<boolean> {
    this.data.small_family_homes = this.data.small_family_homes.filter((h) => h.id !== id);
    await this.persistDelete('small_family_homes', id);
    await this.addAuditLog({
      user_id: modifierName, user_name: modifierName,
      action: 'მცირე საოჯახო ტიპის სახლის წაშლა', entity_type: 'SmallFamilyHome', entity_id: id,
    });
    return true;
  }

  // ============================ SETTINGS ============================
  public getSettings(): SystemSettings {
    return { ...this.data.settings };
  }

  public async updateSettings(newSettings: Partial<SystemSettings>, modifierName: string): Promise<SystemSettings> {
    const oldVal = { ...this.data.settings };
    this.data.settings = { ...this.data.settings, ...newSettings, updated_by: modifierName, updated_at: new Date().toISOString() };
    await setDoc(doc(db, 'meta', 'settings'), clean(this.data.settings));
    await this.addAuditLog({
      user_id: modifierName, user_name: modifierName,
      action: 'შეხსენებების პარამეტრების შეცვლა', entity_type: 'Settings',
      old_values: oldVal, new_values: this.data.settings,
      reason: 'ადმინისტრატორმა განაახლა შეხსენების ვადები',
    });
    return this.data.settings;
  }

  // ==================== PERSONS & PLACEMENTS ====================
  private async nextCaseNumber(): Promise<string> {
    this.data.case_counter = (this.data.case_counter || 1000) + 1;
    await setDoc(doc(db, 'meta', 'counters'), { case_counter: this.data.case_counter });
    const year = new Date().getFullYear();
    const seq = String(this.data.case_counter).padStart(6, '0');
    return `KAKH-${year}-${seq}`;
  }

  /** პროგრამის დამატებით ველების ასლი (ორივე — შექმნა და გადაყვანა). */
  private buildPlacementFields(src: any): Partial<Placement> {
    return {
      location_or_organization: src.location_or_organization,
      comment: src.comment,
      foster_parent_name: src.foster_parent_name,
      foster_parent_personal_number: src.foster_parent_personal_number,
      foster_parent_phone: src.foster_parent_phone,
      foster_parent_address: src.foster_parent_address,
      contract_number: src.contract_number,
      contract_date: src.contract_date,
      placed_with: src.placed_with,
      relationship_type: src.relationship_type,
      kinship_relation: src.kinship_relation,
      kinship_decision_number: src.kinship_decision_number,
      family_info: src.family_info,
      small_home_id: src.small_home_id,
      small_home_name: src.small_home_name,
      small_home_address: src.small_home_address,
      small_home_order_number: src.small_home_order_number,
      responsible_person: src.responsible_person,
      enrollment_date: src.enrollment_date,
      bio_family_member_name: src.bio_family_member_name,
      bio_family_relation: src.bio_family_relation,
      reintegration_allowance: src.reintegration_allowance,
      reintegration_target: src.reintegration_target,
      reintegration_member_name: src.reintegration_member_name,
      reintegration_status_or_relation: src.reintegration_status_or_relation,
      reintegration_address: src.reintegration_address,
      reintegration_date: src.reintegration_date,
      notes: src.notes,
    };
  }

  public async createPerson(payload: any, creatorName: string): Promise<Person> {
    const today = getTodayTbilisiISO();
    if (!payload.first_name || !payload.last_name || !payload.personal_number) {
      throw new Error('გთხოვთ, შეავსოთ სავალდებულო ველები.');
    }
    const duplicate = this.data.persons.find(
      (p) => p.personal_number === payload.personal_number && p.case_status !== 'არქივირებული'
    );
    if (duplicate) throw new Error('ამ პირადი ნომრით პირი უკვე რეგისტრირებულია.');
    if (payload.birth_date > today) throw new Error('დაბადების თარიღი არ შეიძლება იყოს მომავალში.');
    if (payload.admission_date < payload.birth_date) throw new Error('ჩარიცხვის თარიღი არ შეიძლება იყოს დაბადების თარიღზე ადრე.');

    const placementData = payload.initial_placement || {};
    const placementType = placementData.placement_type || 'გადაუდებელი მინდობითი აღზრდა';
    const id = `person_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const case_number = await this.nextCaseNumber();
    const now = new Date().toISOString();

    const newPerson: Person = {
      id, case_number,
      first_name: payload.first_name, last_name: payload.last_name,
      personal_number: payload.personal_number, birth_date: payload.birth_date,
      admission_date: payload.admission_date, admission_reason: payload.admission_reason,
      admission_source: payload.admission_source, person_status: payload.person_status,
      contact_person: payload.contact_person, case_status: 'აქტიური',
      is_locked: false, created_by: creatorName, created_at: now, updated_at: now,
    };

    const placementId = `placement_${Date.now()}_1`;
    const startDate = placementData.start_date || payload.admission_date;
    let plannedEndDate = placementData.planned_end_date;
    if (!plannedEndDate) {
      plannedEndDate = placementType === 'გადაუდებელი მინდობითი აღზრდა'
        ? addDaysISO(startDate, 90)
        : addMonthsISO(startDate, 12);
    }

    const initialPlacement: Placement = {
      id: placementId, person_id: id, placement_type: placementType,
      start_date: startDate, planned_end_date: plannedEndDate,
      placement_status: 'აქტიური',
      placement_reason: placementData.placement_reason || placementData.reason || payload.admission_reason || 'პირველადი ჩარიცხვა',
      created_by: creatorName, created_at: now,
      ...this.buildPlacementFields({ ...placementData, enrollment_date: placementData.enrollment_date || startDate }),
    };

    const reviewStartDate = initialPlacement.enrollment_date || startDate;
    const initialReviewDueDate = addMonthsISO(reviewStartDate, 6);
    const initialReview: CaseReview = {
      id: `review_${Date.now()}_1`, person_id: id, placement_id: placementId,
      review_number: 1, due_date: initialReviewDueDate,
      status: diffDaysISO(today, initialReviewDueDate) <= 30 ? 'გადასახედი' : 'დაგეგმილი',
      created_at: now, updated_at: now,
    };

    this.data.persons.push(newPerson);
    this.data.placements.push(initialPlacement);
    this.data.reviews.push(initialReview);

    const batch = writeBatch(db);
    batch.set(doc(db, 'persons', newPerson.id), clean(newPerson));
    batch.set(doc(db, 'placements', initialPlacement.id), clean(initialPlacement));
    batch.set(doc(db, 'reviews', initialReview.id), clean(initialReview));
    await batch.commit();

    await this.addAuditLog({
      user_id: creatorName, user_name: creatorName,
      action: 'ახალი პირის რეგისტრაცია', entity_type: 'Person', entity_id: id,
      person_name: `${newPerson.first_name} ${newPerson.last_name}`,
      person_personal_number: newPerson.personal_number,
      new_values: { case_number, placement: initialPlacement, initialReview },
      reason: 'ახალი ქეისის გახსნა',
    });
    return this.enrichPerson(newPerson);
  }

  public async updatePerson(id: string, updates: Partial<Person>, modifierName: string, isUserAdmin: boolean): Promise<Person> {
    const person = this.data.persons.find((p) => p.id === id);
    if (!person) throw new Error('პირი ვერ მოიძებნა.');
    if (person.is_locked && !isUserAdmin) throw new Error('ქეისი დაბლოკილია და მისი რედაქტირება მხოლოდ ადმინისტრატორს შეუძლია.');

    const oldVal = { ...person };
    if (updates.personal_number && updates.personal_number !== person.personal_number) {
      const dup = this.data.persons.find(
        (p) => p.id !== id && p.personal_number === updates.personal_number && p.case_status !== 'არქივირებული'
      );
      if (dup) throw new Error('ამ პირადი ნომრით პირი უკვე რეგისტრირებულია.');
      person.personal_number = updates.personal_number;
    }
    if (updates.first_name) person.first_name = updates.first_name;
    if (updates.last_name) person.last_name = updates.last_name;
    if (updates.birth_date) person.birth_date = updates.birth_date;
    if (updates.admission_date) person.admission_date = updates.admission_date;
    if (updates.admission_reason) person.admission_reason = updates.admission_reason;
    if (updates.admission_source) person.admission_source = updates.admission_source;
    if (updates.person_status) person.person_status = updates.person_status;
    if (updates.contact_person) person.contact_person = updates.contact_person;
    person.updated_by = modifierName;
    person.updated_at = new Date().toISOString();
    await this.persist('persons', person);

    await this.addAuditLog({
      user_id: modifierName, user_name: modifierName,
      action: 'პირის მონაცემების განახლება', entity_type: 'Person', entity_id: id,
      person_name: `${person.first_name} ${person.last_name}`,
      person_personal_number: person.personal_number,
      old_values: oldVal, new_values: person, reason: 'მონაცემთა ცვლილება',
    });
    return this.enrichPerson(person);
  }

  public async deletePerson(personId: string, modifierName: string): Promise<boolean> {
    const person = this.data.persons.find((p) => p.id === personId);
    if (!person) throw new Error('პირი ვერ მოიძებნა.');

    const placementIds = this.data.placements.filter((pl) => pl.person_id === personId).map((pl) => pl.id);
    const extIds = this.data.extensions.filter((e) => placementIds.includes(e.placement_id)).map((e) => e.id);
    const reviewIds = this.data.reviews.filter((r) => r.person_id === personId).map((r) => r.id);

    this.data.persons = this.data.persons.filter((p) => p.id !== personId);
    this.data.placements = this.data.placements.filter((pl) => pl.person_id !== personId);
    this.data.extensions = this.data.extensions.filter((ext) => !placementIds.includes(ext.placement_id));
    this.data.reviews = this.data.reviews.filter((rev) => rev.person_id !== personId);

    const batch = writeBatch(db);
    batch.delete(doc(db, 'persons', personId));
    placementIds.forEach((pid) => batch.delete(doc(db, 'placements', pid)));
    extIds.forEach((eid) => batch.delete(doc(db, 'extensions', eid)));
    reviewIds.forEach((rid) => batch.delete(doc(db, 'reviews', rid)));
    await batch.commit();

    await this.addAuditLog({
      user_id: modifierName, user_name: modifierName,
      action: 'პირის და ქეისის სრული წაშლა', entity_type: 'Person', entity_id: personId,
      person_name: `${person.first_name} ${person.last_name}`,
      person_personal_number: person.personal_number,
      reason: 'ადმინისტრატორმა სრულად წაშალა ქეისი',
    });
    return true;
  }

  public async transitionPlacement(personId: string, transitionData: any, modifierName: string, isUserAdmin: boolean): Promise<Person> {
    const person = this.data.persons.find((p) => p.id === personId);
    if (!person) throw new Error('პირი ვერ მოიძებნა.');
    if (person.is_locked && !isUserAdmin) throw new Error('ქეისი დაბლოკილია და მისი რედაქტირება მხოლოდ ადმინისტრატორს შეუძლია.');

    const today = getTodayTbilisiISO();
    const now = new Date().toISOString();

    const currentActive = this.data.placements.find((p) => p.person_id === personId && p.placement_status === 'აქტიური');
    if (currentActive) {
      currentActive.placement_status = 'დასრულებული';
      currentActive.actual_end_date = transitionData.start_date;
      currentActive.updated_by = modifierName;
      currentActive.updated_at = now;
    }

    const newPlacementId = `placement_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const startDate = transitionData.start_date || today;
    const plannedEndDate = transitionData.planned_end_date || addMonthsISO(startDate, 12);

    const newPlacement: Placement = {
      id: newPlacementId, person_id: personId, placement_type: transitionData.placement_type,
      start_date: startDate, planned_end_date: plannedEndDate, placement_status: 'აქტიური',
      placement_reason: transitionData.placement_reason || transitionData.reason || 'პროგრამის შეცვლა',
      created_by: modifierName, created_at: now,
      ...this.buildPlacementFields({ ...transitionData, enrollment_date: transitionData.enrollment_date || startDate }),
    };

    // თუ პროგრამა შეიცვალა — contact_person-ის განახლება ახალი პროგრამის მიხედვით
    if (transitionData.contact_person) {
      person.contact_person = transitionData.contact_person;
    }

    const reviewStartDate = newPlacement.enrollment_date || startDate;
    const initialReviewDueDate = addMonthsISO(reviewStartDate, 6);
    const initialReview: CaseReview = {
      id: `review_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      person_id: personId, placement_id: newPlacementId, review_number: 1,
      due_date: initialReviewDueDate,
      status: diffDaysISO(today, initialReviewDueDate) <= 30 ? 'გადასახედი' : 'დაგეგმილი',
      created_at: now, updated_at: now,
    };

    this.data.placements.push(newPlacement);
    this.data.reviews.push(initialReview);
    person.updated_by = modifierName;
    person.updated_at = now;

    const batch = writeBatch(db);
    if (currentActive) batch.set(doc(db, 'placements', currentActive.id), clean(currentActive));
    batch.set(doc(db, 'placements', newPlacement.id), clean(newPlacement));
    batch.set(doc(db, 'reviews', initialReview.id), clean(initialReview));
    batch.set(doc(db, 'persons', person.id), clean(person));
    await batch.commit();

    await this.addAuditLog({
      user_id: modifierName, user_name: modifierName,
      action: `პროგრამაში გადაყვანა: ${transitionData.placement_type}`,
      entity_type: 'Placement', entity_id: newPlacementId,
      person_name: `${person.first_name} ${person.last_name}`,
      person_personal_number: person.personal_number,
      old_values: currentActive, new_values: newPlacement,
      reason: transitionData.placement_reason || transitionData.reason,
    });
    return this.enrichPerson(person);
  }

  public async extendPlacement(personId: string, extensionData: any, modifierName: string, isUserAdmin: boolean): Promise<Person> {
    const person = this.data.persons.find((p) => p.id === personId);
    if (!person) throw new Error('პირი ვერ მოიძებნა.');
    if (person.is_locked && !isUserAdmin) throw new Error('ქეისი დაბლოკილია და მისი რედაქტირება მხოლოდ ადმინისტრატორს შეუძლია.');

    const currentPlacement = this.data.placements.find((p) => p.person_id === personId && p.placement_status === 'აქტიური');
    if (!currentPlacement) throw new Error('აქტიური პროგრამა ვერ მოიძებნა.');

    const oldEndDate = currentPlacement.planned_end_date || '';
    const now = new Date().toISOString();
    const extensionRecord: PlacementExtension = {
      id: `ext_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      placement_id: currentPlacement.id, old_end_date: oldEndDate,
      new_end_date: extensionData.new_end_date, extension_reason: extensionData.extension_reason,
      decision_date: extensionData.decision_date, created_by: modifierName, created_at: now,
    };
    currentPlacement.planned_end_date = extensionData.new_end_date;
    currentPlacement.updated_by = modifierName;
    currentPlacement.updated_at = now;

    this.data.extensions.push(extensionRecord);
    const batch = writeBatch(db);
    batch.set(doc(db, 'placements', currentPlacement.id), clean(currentPlacement));
    batch.set(doc(db, 'extensions', extensionRecord.id), clean(extensionRecord));
    await batch.commit();

    await this.addAuditLog({
      user_id: modifierName, user_name: modifierName,
      action: 'ვადის გაგრძელება', entity_type: 'PlacementExtension', entity_id: extensionRecord.id,
      person_name: `${person.first_name} ${person.last_name}`,
      person_personal_number: person.personal_number,
      old_values: { planned_end_date: oldEndDate },
      new_values: { planned_end_date: extensionData.new_end_date, extensionRecord },
      reason: extensionData.extension_reason,
    });
    return this.enrichPerson(person);
  }

  // ==================== REVIEWS ====================
  public getReviews(): CaseReview[] {
    return this.data.reviews || [];
  }

  public async performReview(reviewId: string, data: any, modifierName: string): Promise<Person> {
    const review = this.data.reviews.find((r) => r.id === reviewId);
    if (!review) throw new Error('გადასინჯვის ჩანაწერი ვერ მოიძებნა.');
    const person = this.data.persons.find((p) => p.id === review.person_id);
    if (!person) throw new Error('პირი ვერ მოიძებნა.');
    const placement = this.data.placements.find((pl) => pl.id === review.placement_id);

    const now = new Date().toISOString();
    const actualReviewDate = data.review_date || getTodayTbilisiISO();

    review.review_date = actualReviewDate;
    review.result = data.result;
    review.program_decision = data.program_decision || 'გაგრძელება';
    review.comment = data.comment;
    review.new_planned_end_date = data.new_planned_end_date;
    review.notes = data.notes;
    review.attachment_name = data.attachment_name;
    review.performed_by = modifierName;
    review.performed_at = now;
    review.status = 'შესრულებული';
    review.updated_at = now;

    const batch = writeBatch(db);

    if (data.new_planned_end_date && placement && placement.placement_status === 'აქტიური') {
      placement.planned_end_date = data.new_planned_end_date;
      placement.updated_by = modifierName;
      placement.updated_at = now;
      batch.set(doc(db, 'placements', placement.id), clean(placement));
    }

    if (data.program_decision === 'დასრულება' && placement) {
      placement.placement_status = 'დასრულებული';
      placement.actual_end_date = actualReviewDate;
      placement.updated_by = modifierName;
      placement.updated_at = now;
      batch.set(doc(db, 'placements', placement.id), clean(placement));
    } else if (review.program_decision === 'გაგრძელება') {
      const nextReview: CaseReview = {
        id: `review_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        person_id: person.id, placement_id: review.placement_id,
        review_number: review.review_number + 1,
        due_date: addMonthsISO(actualReviewDate, 6),
        status: diffDaysISO(getTodayTbilisiISO(), addMonthsISO(actualReviewDate, 6)) <= 30 ? 'გადასახედი' : 'დაგეგმილი',
        created_at: now, updated_at: now,
      };
      this.data.reviews.push(nextReview);
      batch.set(doc(db, 'reviews', nextReview.id), clean(nextReview));
    }

    batch.set(doc(db, 'reviews', review.id), clean(review));
    await batch.commit();

    await this.addAuditLog({
      user_id: modifierName, user_name: modifierName,
      action: '6-თვიანი გადასინჯვის ჩატარება', entity_type: 'CaseReview', entity_id: reviewId,
      person_name: `${person.first_name} ${person.last_name}`,
      person_personal_number: person.personal_number,
      new_values: { review, program_decision: data.program_decision },
      reason: '6-თვიანი გეგმიური გადასინჯვა',
    });
    return this.enrichPerson(person);
  }

  // ==================== LOCK / ARCHIVE ====================
  public async setCaseLock(personId: string, isLocked: boolean, lockReason: string, modifierName: string): Promise<Person> {
    const person = this.data.persons.find((p) => p.id === personId);
    if (!person) throw new Error('პირი ვერ მოიძებნა.');
    const oldLockState = person.is_locked;
    person.is_locked = isLocked;
    person.lock_reason = lockReason;
    person.locked_by = isLocked ? modifierName : undefined;
    person.locked_at = isLocked ? new Date().toISOString() : undefined;
    person.updated_at = new Date().toISOString();
    await this.persist('persons', person);
    await this.addAuditLog({
      user_id: modifierName, user_name: modifierName,
      action: isLocked ? 'ქეისის დაბლოკვა' : 'ქეისის განბლოკვა', entity_type: 'Person', entity_id: personId,
      person_name: `${person.first_name} ${person.last_name}`,
      person_personal_number: person.personal_number,
      old_values: { is_locked: oldLockState },
      new_values: { is_locked: isLocked, lock_reason: lockReason },
      reason: lockReason,
    });
    return this.enrichPerson(person);
  }

  public async archivePerson(personId: string, reason: string, modifierName: string): Promise<Person> {
    const person = this.data.persons.find((p) => p.id === personId);
    if (!person) throw new Error('პირი ვერ მოიძებნა.');
    person.case_status = 'არქივირებული';
    person.archived_at = new Date().toISOString();
    person.archived_by = modifierName;
    person.archive_reason = reason;
    await this.persist('persons', person);
    await this.addAuditLog({
      user_id: modifierName, user_name: modifierName,
      action: 'ქეისის არქივში გადატანა', entity_type: 'Person', entity_id: personId,
      person_name: `${person.first_name} ${person.last_name}`,
      person_personal_number: person.personal_number, reason,
    });
    return this.enrichPerson(person);
  }

  public async unarchivePerson(personId: string, modifierName: string): Promise<Person> {
    const person = this.data.persons.find((p) => p.id === personId);
    if (!person) throw new Error('პირი ვერ მოიძებნა.');
    person.case_status = 'აქტიური';
    person.archived_at = undefined;
    person.archived_by = undefined;
    person.archive_reason = undefined;
    await this.persist('persons', person);
    await this.addAuditLog({
      user_id: modifierName, user_name: modifierName,
      action: 'ქეისის არქივიდან ამოღება', entity_type: 'Person', entity_id: personId,
      person_name: `${person.first_name} ${person.last_name}`,
      person_personal_number: person.personal_number,
      reason: 'ადმინისტრატორმა აღადგინა არქივირებული ქეისი',
    });
    return this.enrichPerson(person);
  }

  // ==================== ENRICHMENT ====================
  public enrichPerson(person: Person): Person {
    const today = getTodayTbilisiISO();
    const calculated_age = calculateAge(person.birth_date, today);
    const adulthood_date = get18thBirthdayISO(person.birth_date);
    const days_until_adulthood = diffDaysISO(today, adulthood_date);
    const age_21_date = get21stBirthdayISO(person.birth_date);
    const days_until_21 = diffDaysISO(today, age_21_date);

    const personPlacements = this.data.placements
      .filter((p) => p.person_id === person.id)
      .sort((a, b) => (b.start_date > a.start_date ? 1 : -1));
    const current_placement = personPlacements.find((p) => p.placement_status === 'აქტიური') || personPlacements[0];
    const personExtensions = this.data.extensions.filter((e) => personPlacements.some((p) => p.id === e.placement_id));
    const personReviews = (this.data.reviews || [])
      .filter((r) => r.person_id === person.id)
      .sort((a, b) => (a.due_date > b.due_date ? 1 : -1));

    const next_review = personReviews.find((r) => r.status !== 'შესრულებული' && r.status !== 'პროგრამა დასრულებულია') || personReviews[personReviews.length - 1];
    if (next_review && next_review.status !== 'შესრულებული' && next_review.status !== 'პროგრამა დასრულებულია') {
      const daysToReview = diffDaysISO(today, next_review.due_date);
      if (daysToReview < 0) next_review.status = 'ვადაგადაცილებული';
      else if (daysToReview <= 30) next_review.status = 'გადასახედი';
      else next_review.status = 'დაგეგმილი';
    }

    let days_remaining_in_placement: number | undefined;
    let days_overdue: number | undefined;
    let reminder_status: 'ნორმალური' | 'გასაგრძელებელი' | 'კრიტიკული' | 'ვადაგადაცილებული' = 'ნორმალური';

    if (current_placement && current_placement.placement_status === 'აქტიური' && current_placement.planned_end_date) {
      const remaining = diffDaysISO(today, current_placement.planned_end_date);
      days_remaining_in_placement = remaining;
      if (remaining < 0) {
        reminder_status = 'ვადაგადაცილებული';
        days_overdue = Math.abs(remaining);
      } else {
        const settings = this.data.settings;
        let advanceDateISO = current_placement.planned_end_date;
        if (settings.advance_reminder_unit === 'month') {
          advanceDateISO = addMonthsISO(current_placement.planned_end_date, -settings.advance_reminder_value);
        } else if (settings.advance_reminder_unit === 'week') {
          advanceDateISO = addDaysISO(current_placement.planned_end_date, -(settings.advance_reminder_value * 7));
        } else {
          advanceDateISO = addDaysISO(current_placement.planned_end_date, -settings.advance_reminder_value);
        }
        const criticalThresholdDays = settings.critical_reminder_value || 3;
        if (remaining <= criticalThresholdDays) reminder_status = 'კრიტიკული';
        else if (today >= advanceDateISO) reminder_status = 'გასაგრძელებელი';
        else reminder_status = 'ნორმალური';
      }
    }

    return {
      ...person,
      current_placement, placements_history: personPlacements,
      extensions_history: personExtensions, next_review, reviews_history: personReviews,
      calculated_age, adulthood_date, days_until_adulthood, age_21_date, days_until_21,
      days_remaining_in_placement, days_overdue, reminder_status,
    };
  }

  public getPersons(filters?: any): Person[] {
    let list = this.data.persons.map((p) => this.enrichPerson(p));
    if (filters) {
      if (!filters.include_archived && !filters.case_status) {
        list = list.filter((p) => p.case_status !== 'არქივირებული');
      }
      if (filters.case_status) list = list.filter((p) => p.case_status === filters.case_status);
      if (typeof filters.is_locked === 'boolean') list = list.filter((p) => p.is_locked === filters.is_locked);
      if (filters.person_status) list = list.filter((p) => p.person_status === filters.person_status);
      if (filters.placement_type) list = list.filter((p) => p.current_placement?.placement_type === filters.placement_type);
      if (filters.reminder_status) list = list.filter((p) => p.reminder_status === filters.reminder_status);
      if (filters.search) {
        const q = filters.search.toLowerCase().trim();
        list = list.filter(
          (p) =>
            p.first_name.toLowerCase().includes(q) ||
            p.last_name.toLowerCase().includes(q) ||
            `${p.first_name} ${p.last_name}`.toLowerCase().includes(q) ||
            p.personal_number.includes(q) ||
            p.case_number.toLowerCase().includes(q) ||
            (p.current_placement?.placement_type || '').toLowerCase().includes(q) ||
            (p.current_placement?.foster_parent_name || '').toLowerCase().includes(q) ||
            (p.current_placement?.small_home_name || '').toLowerCase().includes(q)
        );
      }
    }
    return list;
  }

  public getPersonById(id: string): Person | undefined {
    const p = this.data.persons.find((x) => x.id === id);
    return p ? this.enrichPerson(p) : undefined;
  }

  public getDashboardStats(): DashboardStats {
    const all = this.getPersons();
    const active = all.filter((p) => p.case_status === 'აქტიური');
    return {
      total_persons: all.length,
      active_cases: active.length,
      locked_cases: active.filter((p) => p.is_locked).length,
      emergency_count: active.filter((p) => p.current_placement?.placement_type === 'გადაუდებელი მინდობითი აღზრდა').length,
      regular_count: active.filter((p) => p.current_placement?.placement_type === 'რეგულარული მინდობითი აღზრდა').length,
      kinship_count: active.filter((p) => p.current_placement?.placement_type === 'ნათესაური მინდობითი აღზრდა').length,
      group_home_count: active.filter((p) => p.current_placement?.placement_type === 'მცირე საოჯახო ტიპის სახლი').length,
      reintegration_count: active.filter((p) => p.current_placement?.placement_type === 'რეინტეგრაცია').length,
      renewal_due_count: active.filter((p) => p.reminder_status === 'გასაგრძელებელი').length,
      critical_count: active.filter((p) => p.reminder_status === 'კრიტიკული').length,
      overdue_count: active.filter((p) => p.reminder_status === 'ვადაგადაცილებული').length,
      approaching_18_count: active.filter((p) => p.days_until_adulthood !== undefined && p.days_until_adulthood >= 0 && p.days_until_adulthood <= 60).length,
      approaching_21_count: active.filter((p) => p.days_until_21 !== undefined && p.days_until_21 >= 0 && p.days_until_21 <= 60).length,
      reviews_due_count: active.filter((p) => p.next_review?.status === 'გადასახედი').length,
      reviews_overdue_count: active.filter((p) => p.next_review?.status === 'ვადაგადაცილებული').length,
    };
  }

  public getAuditLogs(limit = 200): AuditLog[] {
    return this.data.audit_logs.slice(0, limit);
  }
}

export const store = new FirestoreStore();
