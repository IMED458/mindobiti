import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import {
  User,
  Person,
  Placement,
  PlacementExtension,
  SystemSettings,
  AuditLog,
  CaseReview,
  SmallFamilyHome,
} from '../src/types.js';
import {
  getTodayTbilisiISO,
  addDaysISO,
  addMonthsISO,
  diffDaysISO,
  calculateAge,
  get18thBirthdayISO,
  get21stBirthdayISO,
} from './utils.js';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

interface DatabaseSchema {
  users: User[];
  persons: Person[];
  placements: Placement[];
  extensions: PlacementExtension[];
  reviews: CaseReview[];
  small_family_homes: SmallFamilyHome[];
  settings: SystemSettings;
  audit_logs: AuditLog[];
  case_counter: number;
}

const DEFAULT_SETTINGS: SystemSettings = {
  advance_reminder_value: 2,
  advance_reminder_unit: 'month',
  critical_reminder_value: 3,
  critical_reminder_unit: 'day',
};

class Store {
  private data: DatabaseSchema;

  constructor() {
    this.data = {
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
    this.init();
  }

  private init() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
      } catch (err) {
        console.error('Error reading db.json, creating fresh:', err);
        this.save();
      }
    } else {
      this.save();
    }

    if (!this.data.reviews) this.data.reviews = [];
    if (!this.data.small_family_homes) this.data.small_family_homes = [];

    // Ensure Initial Admin Exists
    this.ensureInitialAdmin();

    // Ensure Settings Exist
    if (!this.data.settings) {
      this.data.settings = { ...DEFAULT_SETTINGS };
    }

    // Ensure Default Small Family Homes exist
    if (this.data.small_family_homes.length === 0) {
      const now = new Date().toISOString();
      this.data.small_family_homes = [
        {
          id: 'sfh_001',
          name: 'თელავის მცირე საოჯახო ტიპის სახლი',
          address: 'ქ. თელავი, ერეკლე II-ის ქ. #12',
          responsible_person: 'გიორგი მაისურაძე',
          phone: '595112233',
          is_active: true,
          created_at: now,
        },
        {
          id: 'sfh_002',
          name: 'გურჯაანის მცირე საოჯახო ტიპის სახლი',
          address: 'ქ. გურჯაანი, ნონეშვილის ქ. #45',
          responsible_person: 'ნინო ბერიძე',
          phone: '599445566',
          is_active: true,
          created_at: now,
        },
        {
          id: 'sfh_003',
          name: 'სიღნაღის მცირე საოჯახო ტიპის სახლი',
          address: 'ქ. სიღნაღი, რუსთაველის ქ. #8',
          responsible_person: 'დავით ჯაფარიძე',
          phone: '591778899',
          is_active: true,
          created_at: now,
        },
        {
          id: 'sfh_004',
          name: 'ყვარლის მცირე საოჯახო ტიპის სახლი',
          address: 'ქ. ყვარელი, ჭავჭავაძის ქ. #23',
          responsible_person: 'მაია კაპანაძე',
          phone: '598334455',
          is_active: true,
          created_at: now,
        },
      ];
    }

    this.save();
  }

  public save() {
    try {
      const tempPath = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tempPath, DB_FILE);
    } catch (err) {
      console.error('Failed to save DB:', err);
    }
  }

  private ensureInitialAdmin() {
    const adminExists = this.data.users.some((u) => u.username === 'lela');
    if (!adminExists) {
      const passwordHash = bcrypt.hashSync('otogio123', 10);
      const now = new Date().toISOString();
      const adminUser: User = {
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
      };
      (adminUser as any).password_hash = passwordHash;
      this.data.users.push(adminUser);

      this.addAuditLogInternal({
        user_id: 'system',
        user_name: 'სისტემა',
        action: 'ადმინისტრატორის ინიციალიზაცია',
        entity_type: 'User',
        entity_id: adminUser.id,
        reason: 'სისტემის პირველადი გაშვება',
      });
    }
  }

  // --- Users ---
  public getUsers(): User[] {
    return this.data.users.map(({ ...u }) => {
      delete (u as any).password_hash;
      return u;
    });
  }

  public getUserByUsername(username: string): (User & { password_hash?: string }) | undefined {
    return this.data.users.find((u) => u.username.toLowerCase() === username.toLowerCase());
  }

  public getUserById(id: string): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  public createUser(userData: Omit<User, 'id' | 'created_at' | 'updated_at'> & { password?: string }, creatorName: string): User {
    const existing = this.getUserByUsername(userData.username);
    if (existing) {
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

    this.data.users.push(newUser as User);
    this.save();

    this.addAuditLogInternal({
      user_id: creatorName,
      user_name: creatorName,
      action: 'მომხმარებლის შექმნა',
      entity_type: 'User',
      entity_id: id,
      new_values: { username: newUser.username, role: newUser.role, position: newUser.position },
      reason: 'ახალი მომხმარებლის რეგისტრაცია',
    });

    const clean = { ...newUser };
    delete clean.password_hash;
    return clean;
  }

  public updateUser(id: string, updates: Partial<User> & { new_password?: string }, modifierName: string): User {
    const user = this.data.users.find((u) => u.id === id);
    if (!user) {
      throw new Error('მომხმარებელი ვერ მოიძებნა.');
    }

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
    this.save();

    const newVal = { ...user };
    delete (newVal as any).password_hash;

    this.addAuditLogInternal({
      user_id: modifierName,
      user_name: modifierName,
      action: 'მომხმარებლის განახლება',
      entity_type: 'User',
      entity_id: id,
      old_values: oldVal,
      new_values: newVal,
      reason: updates.new_password ? 'დროებითი პაროლის მინიჭება' : 'მონაცემების რედაქტირება',
    });

    return newVal;
  }

  public deleteUser(userId: string, modifierName: string): boolean {
    const user = this.data.users.find((u) => u.id === userId);
    if (!user) throw new Error('მომხმარებელი ვერ მოიძებნა.');
    if (user.username === 'lela') throw new Error('მთავარი ადმინისტრატორის წაშლა შეზღუდულია.');

    this.data.users = this.data.users.filter((u) => u.id !== userId);
    this.save();

    this.addAuditLogInternal({
      user_id: modifierName,
      user_name: modifierName,
      action: 'მომხმარებლის წაშლა',
      entity_type: 'User',
      entity_id: userId,
      reason: `წაიშალა მომხმარებელი: ${user.first_name} ${user.last_name} (${user.username})`,
    });

    return true;
  }

  public setUserPassword(username: string, newPasswordRaw: string, modifierName: string) {
    const user = this.getUserByUsername(username);
    if (!user) throw new Error('მომხმარებელი ვერ მოიძებნა.');
    (user as any).password_hash = bcrypt.hashSync(newPasswordRaw, 10);
    user.must_change_password = false;
    user.updated_at = new Date().toISOString();
    this.save();

    this.addAuditLogInternal({
      user_id: modifierName,
      user_name: modifierName,
      action: 'პაროლის შეცვლა',
      entity_type: 'User',
      entity_id: user.id,
      reason: 'მომხმარებელმა შეცვალა პაროლი',
    });
  }

  // --- Small Family Homes Dictionary ---
  public getSmallHomes(): SmallFamilyHome[] {
    return this.data.small_family_homes || [];
  }

  public createSmallHome(homeData: Omit<SmallFamilyHome, 'id' | 'created_at'>, modifierName: string): SmallFamilyHome {
    const now = new Date().toISOString();
    const home: SmallFamilyHome = {
      ...homeData,
      id: `sfh_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      is_active: homeData.is_active ?? true,
      created_at: now,
    };
    this.data.small_family_homes.push(home);
    this.save();

    this.addAuditLogInternal({
      user_id: modifierName,
      user_name: modifierName,
      action: 'მცირე საოჯახო ტიპის სახლის დამატება',
      entity_type: 'SmallFamilyHome',
      entity_id: home.id,
      new_values: home,
    });

    return home;
  }

  public updateSmallHome(id: string, updates: Partial<SmallFamilyHome>, modifierName: string): SmallFamilyHome {
    const home = this.data.small_family_homes.find((h) => h.id === id);
    if (!home) throw new Error('სახლი ვერ მოიძებნა.');

    Object.assign(home, updates);
    home.updated_at = new Date().toISOString();
    this.save();

    this.addAuditLogInternal({
      user_id: modifierName,
      user_name: modifierName,
      action: 'მცირე საოჯახო ტიპის სახლის განახლება',
      entity_type: 'SmallFamilyHome',
      entity_id: id,
      new_values: home,
    });

    return home;
  }

  public deleteSmallHome(id: string, modifierName: string): boolean {
    this.data.small_family_homes = this.data.small_family_homes.filter((h) => h.id !== id);
    this.save();

    this.addAuditLogInternal({
      user_id: modifierName,
      user_name: modifierName,
      action: 'მცირე საოჯახო ტიპის სახლის წაშლა',
      entity_type: 'SmallFamilyHome',
      entity_id: id,
    });

    return true;
  }

  // --- Settings ---
  public getSettings(): SystemSettings {
    return { ...this.data.settings };
  }

  public updateSettings(newSettings: Partial<SystemSettings>, modifierName: string): SystemSettings {
    const oldVal = { ...this.data.settings };
    this.data.settings = { ...this.data.settings, ...newSettings };
    this.data.settings.updated_by = modifierName;
    this.data.settings.updated_at = new Date().toISOString();
    this.save();

    this.addAuditLogInternal({
      user_id: modifierName,
      user_name: modifierName,
      action: 'შეხსენებების პარამეტრების შეცვლა',
      entity_type: 'Settings',
      old_values: oldVal,
      new_values: this.data.settings,
      reason: 'ადმინისტრატორმა განაახლა შეხსენების ვადები',
    });

    return this.data.settings;
  }

  // --- Persons & Placements ---
  public generateCaseNumber(): string {
    this.data.case_counter = (this.data.case_counter || 1000) + 1;
    const year = new Date().getFullYear();
    const seq = String(this.data.case_counter).padStart(6, '0');
    return `KAKH-${year}-${seq}`;
  }

  public createPerson(
    payload: {
      first_name: string;
      last_name: string;
      personal_number: string;
      birth_date: string;
      admission_date: string;
      admission_reason: string;
      admission_source: string;
      person_status: any;
      contact_person: any;
      initial_placement?: Partial<Placement>;
    },
    creatorName: string
  ): Person {
    const today = getTodayTbilisiISO();

    if (!payload.first_name || !payload.last_name || !payload.personal_number) {
      throw new Error('გთხოვთ, შეავსოთ სავალდებულო ველები.');
    }

    const duplicate = this.data.persons.find(
      (p) => p.personal_number === payload.personal_number && p.case_status !== 'არქივირებული'
    );
    if (duplicate) {
      throw new Error('ამ პირადი ნომრით პირი უკვე რეგისტრირებულია.');
    }

    if (payload.birth_date > today) {
      throw new Error('დაბადების თარიღი არ შეიძლება იყოს მომავალში.');
    }

    if (payload.admission_date < payload.birth_date) {
      throw new Error('ჩარიცხვის თარიღი არ შეიძლება იყოს დაბადების თარიღზე ადრე.');
    }

    const placementData = payload.initial_placement || {};
    const placementType = placementData.placement_type || 'გადაუდებელი მინდობითი აღზრდა';

    const id = `person_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const case_number = this.generateCaseNumber();
    const now = new Date().toISOString();

    const newPerson: Person = {
      id,
      case_number,
      first_name: payload.first_name,
      last_name: payload.last_name,
      personal_number: payload.personal_number,
      birth_date: payload.birth_date,
      admission_date: payload.admission_date,
      admission_reason: payload.admission_reason,
      admission_source: payload.admission_source,
      person_status: payload.person_status,
      contact_person: payload.contact_person,
      case_status: 'აქტიური',
      is_locked: false,
      created_by: creatorName,
      created_at: now,
      updated_at: now,
    };

    const placementId = `placement_${Date.now()}_1`;
    const startDate = placementData.start_date || payload.admission_date;

    // Determine planned end date if manual or default
    let plannedEndDate = placementData.planned_end_date;
    if (!plannedEndDate) {
      if (placementType === 'გადაუდებელი მინდობითი აღზრდა') {
        plannedEndDate = addDaysISO(startDate, 90);
      } else {
        plannedEndDate = addMonthsISO(startDate, 12); // Default 1 year for regular
      }
    }

    const initialPlacement: Placement = {
      id: placementId,
      person_id: id,
      placement_type: placementType,
      start_date: startDate,
      planned_end_date: plannedEndDate,
      placement_status: 'აქტიური',
      placement_reason: placementData.placement_reason || payload.admission_reason || 'პირველადი ჩარიცხვა',
      location_or_organization: placementData.location_or_organization || payload.admission_source,
      comment: placementData.comment,

      foster_parent_name: placementData.foster_parent_name,
      placed_with: placementData.placed_with,
      relationship_type: placementData.relationship_type,
      family_info: placementData.family_info,
      small_home_id: placementData.small_home_id,
      small_home_name: placementData.small_home_name,
      small_home_address: placementData.small_home_address,
      responsible_person: placementData.responsible_person,
      enrollment_date: placementData.enrollment_date || startDate,
      reintegration_target: placementData.reintegration_target,
      reintegration_member_name: placementData.reintegration_member_name,
      reintegration_status_or_relation: placementData.reintegration_status_or_relation,
      reintegration_address: placementData.reintegration_address,
      reintegration_date: placementData.reintegration_date,
      notes: placementData.notes,

      created_by: creatorName,
      created_at: now,
    };

    // First 6-month review schedule
    const reviewStartDate = initialPlacement.enrollment_date || startDate;
    const initialReviewDueDate = addMonthsISO(reviewStartDate, 6);
    const initialReview: CaseReview = {
      id: `review_${Date.now()}_1`,
      person_id: id,
      placement_id: placementId,
      review_number: 1,
      due_date: initialReviewDueDate,
      status: diffDaysISO(today, initialReviewDueDate) <= 30 ? 'გადასახედი' : 'დაგეგმილი',
      created_at: now,
      updated_at: now,
    };

    this.data.persons.push(newPerson);
    this.data.placements.push(initialPlacement);
    if (!this.data.reviews) this.data.reviews = [];
    this.data.reviews.push(initialReview);

    this.save();

    this.addAuditLogInternal({
      user_id: creatorName,
      user_name: creatorName,
      action: 'ახალი პირის რეგისტრაცია',
      entity_type: 'Person',
      entity_id: id,
      person_name: `${newPerson.first_name} ${newPerson.last_name}`,
      person_personal_number: newPerson.personal_number,
      new_values: { case_number, placement: initialPlacement, initialReview },
      reason: 'ახალი ქეისის გახსნა',
    });

    return this.enrichPerson(newPerson);
  }

  public updatePerson(id: string, updates: Partial<Person>, modifierName: string, isUserAdmin: boolean): Person {
    const person = this.data.persons.find((p) => p.id === id);
    if (!person) throw new Error('პირი ვერ მოიძებნა.');

    if (person.is_locked && !isUserAdmin) {
      throw new Error('ქეისი დაბლოკილია და მისი რედაქტირება მხოლოდ ადმინისტრატორს შეუძლია.');
    }

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
    this.save();

    this.addAuditLogInternal({
      user_id: modifierName,
      user_name: modifierName,
      action: 'პირის მონაცემების განახლება',
      entity_type: 'Person',
      entity_id: id,
      person_name: `${person.first_name} ${person.last_name}`,
      person_personal_number: person.personal_number,
      old_values: oldVal,
      new_values: person,
      reason: 'მონაცემთა ცვლილება',
    });

    return this.enrichPerson(person);
  }

  public deletePerson(personId: string, modifierName: string): boolean {
    const person = this.data.persons.find((p) => p.id === personId);
    if (!person) throw new Error('პირი ვერ მოიძებნა.');

    this.data.persons = this.data.persons.filter((p) => p.id !== personId);
    const placementIds = this.data.placements
      .filter((pl) => pl.person_id === personId)
      .map((pl) => pl.id);
    this.data.placements = this.data.placements.filter((pl) => pl.person_id !== personId);
    this.data.extensions = this.data.extensions.filter((ext) => !placementIds.includes(ext.placement_id));
    if (this.data.reviews) {
      this.data.reviews = this.data.reviews.filter((rev) => rev.person_id !== personId);
    }

    this.save();

    this.addAuditLogInternal({
      user_id: modifierName,
      user_name: modifierName,
      action: 'პირის და ქეისის სრული წაშლა',
      entity_type: 'Person',
      entity_id: personId,
      person_name: `${person.first_name} ${person.last_name}`,
      person_personal_number: person.personal_number,
      reason: 'ადმინისტრატორმა სრულად წაშალა ქეისი',
    });

    return true;
  }

  public transitionPlacement(
    personId: string,
    transitionData: Partial<Placement> & {
      placement_type: Placement['placement_type'];
      start_date: string;
      planned_end_date?: string;
      reason?: string;
    },
    modifierName: string,
    isUserAdmin: boolean
  ): Person {
    const person = this.data.persons.find((p) => p.id === personId);
    if (!person) throw new Error('პირი ვერ მოიძებნა.');

    if (person.is_locked && !isUserAdmin) {
      throw new Error('ქეისი დაბლოკილია და მისი რედაქტირება მხოლოდ ადმინისტრატორს შეუძლია.');
    }

    const today = getTodayTbilisiISO();
    const now = new Date().toISOString();

    // Close existing active placement
    const currentActive = this.data.placements.find(
      (p) => p.person_id === personId && p.placement_status === 'აქტიური'
    );

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
      id: newPlacementId,
      person_id: personId,
      placement_type: transitionData.placement_type,
      start_date: startDate,
      planned_end_date: plannedEndDate,
      placement_status: 'აქტიური',
      placement_reason: transitionData.placement_reason || transitionData.reason || 'პროგრამის შეცვლა',
      location_or_organization: transitionData.location_or_organization,
      comment: transitionData.comment,

      foster_parent_name: transitionData.foster_parent_name,
      placed_with: transitionData.placed_with,
      relationship_type: transitionData.relationship_type,
      family_info: transitionData.family_info,
      small_home_id: transitionData.small_home_id,
      small_home_name: transitionData.small_home_name,
      small_home_address: transitionData.small_home_address,
      responsible_person: transitionData.responsible_person,
      enrollment_date: transitionData.enrollment_date || startDate,
      reintegration_target: transitionData.reintegration_target,
      reintegration_member_name: transitionData.reintegration_member_name,
      reintegration_status_or_relation: transitionData.reintegration_status_or_relation,
      reintegration_address: transitionData.reintegration_address,
      reintegration_date: transitionData.reintegration_date,
      notes: transitionData.notes,

      created_by: modifierName,
      created_at: now,
    };

    // First review for new placement
    const reviewStartDate = newPlacement.enrollment_date || startDate;
    const initialReviewDueDate = addMonthsISO(reviewStartDate, 6);
    const initialReview: CaseReview = {
      id: `review_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      person_id: personId,
      placement_id: newPlacementId,
      review_number: 1,
      due_date: initialReviewDueDate,
      status: diffDaysISO(today, initialReviewDueDate) <= 30 ? 'გადასახედი' : 'დაგეგმილი',
      created_at: now,
      updated_at: now,
    };

    this.data.placements.push(newPlacement);
    if (!this.data.reviews) this.data.reviews = [];
    this.data.reviews.push(initialReview);

    person.updated_by = modifierName;
    person.updated_at = now;
    this.save();

    this.addAuditLogInternal({
      user_id: modifierName,
      user_name: modifierName,
      action: `პროგრამაში გადაყვანა: ${transitionData.placement_type}`,
      entity_type: 'Placement',
      entity_id: newPlacementId,
      person_name: `${person.first_name} ${person.last_name}`,
      person_personal_number: person.personal_number,
      old_values: currentActive,
      new_values: newPlacement,
      reason: transitionData.placement_reason || transitionData.reason,
    });

    return this.enrichPerson(person);
  }

  public extendPlacement(
    personId: string,
    extensionData: {
      new_end_date: string;
      extension_reason: string;
      decision_date: string;
    },
    modifierName: string,
    isUserAdmin: boolean
  ): Person {
    const person = this.data.persons.find((p) => p.id === personId);
    if (!person) throw new Error('პირი ვერ მოიძებნა.');

    if (person.is_locked && !isUserAdmin) {
      throw new Error('ქეისი დაბლოკილია და მისი რედაქტირება მხოლოდ ადმინისტრატორს შეუძლია.');
    }

    const currentPlacement = this.data.placements.find(
      (p) => p.person_id === personId && p.placement_status === 'აქტიური'
    );
    if (!currentPlacement) {
      throw new Error('აქტიური პროგრამა ვერ მოიძებნა.');
    }

    const oldEndDate = currentPlacement.planned_end_date || '';
    const now = new Date().toISOString();

    const extensionRecord: PlacementExtension = {
      id: `ext_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      placement_id: currentPlacement.id,
      old_end_date: oldEndDate,
      new_end_date: extensionData.new_end_date,
      extension_reason: extensionData.extension_reason,
      decision_date: extensionData.decision_date,
      created_by: modifierName,
      created_at: now,
    };

    currentPlacement.planned_end_date = extensionData.new_end_date;
    currentPlacement.updated_by = modifierName;
    currentPlacement.updated_at = now;

    this.data.extensions.push(extensionRecord);
    this.save();

    this.addAuditLogInternal({
      user_id: modifierName,
      user_name: modifierName,
      action: 'ვადის გაგრძელება',
      entity_type: 'PlacementExtension',
      entity_id: extensionRecord.id,
      person_name: `${person.first_name} ${person.last_name}`,
      person_personal_number: person.personal_number,
      old_values: { planned_end_date: oldEndDate },
      new_values: { planned_end_date: extensionData.new_end_date, extensionRecord },
      reason: extensionData.extension_reason,
    });

    return this.enrichPerson(person);
  }

  // --- Reviews (6-Month Interim Review Cycle) ---
  public getReviews(): CaseReview[] {
    return this.data.reviews || [];
  }

  public performReview(
    reviewId: string,
    data: {
      review_date: string;
      result?: string;
      program_decision?: 'გაგრძელება' | 'დასრულება';
      comment?: string;
      new_planned_end_date?: string;
      notes?: string;
      attachment_name?: string;
    },
    modifierName: string
  ): Person {
    if (!this.data.reviews) this.data.reviews = [];
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

    if (data.new_planned_end_date && placement && placement.placement_status === 'აქტიური') {
      placement.planned_end_date = data.new_planned_end_date;
      placement.updated_by = modifierName;
      placement.updated_at = now;
    }

    if (data.program_decision === 'დასრულება' && placement) {
      placement.placement_status = 'დასრულებული';
      placement.actual_end_date = actualReviewDate;
      placement.updated_by = modifierName;
      placement.updated_at = now;
    } else if (data.program_decision === 'გაგრძელება') {
      // Schedule next 6-month review
      const nextReviewNumber = review.review_number + 1;
      const nextDueDate = addMonthsISO(actualReviewDate, 6);
      const today = getTodayTbilisiISO();
      const nextReview: CaseReview = {
        id: `review_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        person_id: person.id,
        placement_id: review.placement_id,
        review_number: nextReviewNumber,
        due_date: nextDueDate,
        status: diffDaysISO(today, nextDueDate) <= 30 ? 'გადასახედი' : 'დაგეგმილი',
        created_at: now,
        updated_at: now,
      };
      this.data.reviews.push(nextReview);
    }

    this.save();

    this.addAuditLogInternal({
      user_id: modifierName,
      user_name: modifierName,
      action: '6-თვიანი გადასინჯვის ჩატარება',
      entity_type: 'CaseReview',
      entity_id: reviewId,
      person_name: `${person.first_name} ${person.last_name}`,
      person_personal_number: person.personal_number,
      new_values: { review, program_decision: data.program_decision },
      reason: '6-თვიანი გეგმიური გადასინჯვა',
    });

    return this.enrichPerson(person);
  }

  public setCaseLock(
    personId: string,
    isLocked: boolean,
    lockReason: string,
    modifierName: string
  ): Person {
    const person = this.data.persons.find((p) => p.id === personId);
    if (!person) throw new Error('პირი ვერ მოიძებნა.');

    const oldLockState = person.is_locked;
    person.is_locked = isLocked;
    person.lock_reason = lockReason;
    person.locked_by = isLocked ? modifierName : undefined;
    person.locked_at = isLocked ? new Date().toISOString() : undefined;
    person.updated_at = new Date().toISOString();
    this.save();

    this.addAuditLogInternal({
      user_id: modifierName,
      user_name: modifierName,
      action: isLocked ? 'ქეისის დაბლოკვა' : 'ქეისის განბლოკვა',
      entity_type: 'Person',
      entity_id: personId,
      person_name: `${person.first_name} ${person.last_name}`,
      person_personal_number: person.personal_number,
      old_values: { is_locked: oldLockState },
      new_values: { is_locked: isLocked, lock_reason: lockReason },
      reason: lockReason,
    });

    return this.enrichPerson(person);
  }

  public archivePerson(personId: string, reason: string, modifierName: string): Person {
    const person = this.data.persons.find((p) => p.id === personId);
    if (!person) throw new Error('პირი ვერ მოიძებნა.');

    person.case_status = 'არქივირებული';
    person.archived_at = new Date().toISOString();
    person.archived_by = modifierName;
    person.archive_reason = reason;
    this.save();

    this.addAuditLogInternal({
      user_id: modifierName,
      user_name: modifierName,
      action: 'ქეისის არქივში გადატანა',
      entity_type: 'Person',
      entity_id: personId,
      person_name: `${person.first_name} ${person.last_name}`,
      person_personal_number: person.personal_number,
      reason,
    });

    return this.enrichPerson(person);
  }

  public unarchivePerson(personId: string, modifierName: string): Person {
    const person = this.data.persons.find((p) => p.id === personId);
    if (!person) throw new Error('პირი ვერ მოიძებნა.');

    person.case_status = 'აქტიური';
    person.archived_at = undefined;
    person.archived_by = undefined;
    person.archive_reason = undefined;
    this.save();

    this.addAuditLogInternal({
      user_id: modifierName,
      user_name: modifierName,
      action: 'ქეისის არქივიდან ამოღება',
      entity_type: 'Person',
      entity_id: personId,
      person_name: `${person.first_name} ${person.last_name}`,
      person_personal_number: person.personal_number,
      reason: 'ადმინისტრატორმა აღადგინა არქივირებული ქეისი',
    });

    return this.enrichPerson(person);
  }

  // --- Enrichment Logic ---
  public enrichPerson(person: Person): Person {
    const today = getTodayTbilisiISO();

    // Age & Adulthood (18 and 21)
    const calculated_age = calculateAge(person.birth_date, today);
    const adulthood_date = get18thBirthdayISO(person.birth_date);
    const days_until_adulthood = diffDaysISO(today, adulthood_date);

    const age_21_date = get21stBirthdayISO(person.birth_date);
    const days_until_21 = diffDaysISO(today, age_21_date);

    // Placements
    const personPlacements = this.data.placements
      .filter((p) => p.person_id === person.id)
      .sort((a, b) => (b.start_date > a.start_date ? 1 : -1));

    const current_placement = personPlacements.find((p) => p.placement_status === 'აქტიური') || personPlacements[0];

    // Extensions
    const personExtensions = this.data.extensions.filter((e) =>
      personPlacements.some((p) => p.id === e.placement_id)
    );

    // Reviews
    const personReviews = (this.data.reviews || [])
      .filter((r) => r.person_id === person.id)
      .sort((a, b) => (a.due_date > b.due_date ? 1 : -1));

    const next_review = personReviews.find((r) => r.status !== 'შესრულებული' && r.status !== 'პროგრამა დასრულებულია') || personReviews[personReviews.length - 1];

    if (next_review && next_review.status !== 'შესრულებული' && next_review.status !== 'პროგრამა დასრულებულია') {
      const daysToReview = diffDaysISO(today, next_review.due_date);
      if (daysToReview < 0) {
        next_review.status = 'ვადაგადაცილებული';
      } else if (daysToReview <= 30) {
        next_review.status = 'გადასახედი';
      } else {
        next_review.status = 'დაგეგმილი';
      }
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

        if (remaining <= criticalThresholdDays) {
          reminder_status = 'კრიტიკული';
        } else if (today >= advanceDateISO) {
          reminder_status = 'გასაგრძელებელი';
        } else {
          reminder_status = 'ნორმალური';
        }
      }
    }

    return {
      ...person,
      current_placement,
      placements_history: personPlacements,
      extensions_history: personExtensions,
      next_review,
      reviews_history: personReviews,
      calculated_age,
      adulthood_date,
      days_until_adulthood,
      age_21_date,
      days_until_21,
      days_remaining_in_placement,
      days_overdue,
      reminder_status,
    };
  }

  public getPersons(filters?: {
    search?: string;
    placement_type?: string;
    person_status?: string;
    case_status?: string;
    reminder_status?: string;
    is_locked?: boolean;
    include_archived?: boolean;
  }): Person[] {
    let list = this.data.persons.map((p) => this.enrichPerson(p));

    if (filters) {
      if (!filters.include_archived && !filters.case_status) {
        list = list.filter((p) => p.case_status !== 'არქივირებული');
      }

      if (filters.case_status) {
        list = list.filter((p) => p.case_status === filters.case_status);
      }

      if (typeof filters.is_locked === 'boolean') {
        list = list.filter((p) => p.is_locked === filters.is_locked);
      }

      if (filters.person_status) {
        list = list.filter((p) => p.person_status === filters.person_status);
      }

      if (filters.placement_type) {
        list = list.filter((p) => p.current_placement?.placement_type === filters.placement_type);
      }

      if (filters.reminder_status) {
        list = list.filter((p) => p.reminder_status === filters.reminder_status);
      }

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
    const p = this.data.persons.find((p) => p.id === id);
    if (!p) return undefined;
    return this.enrichPerson(p);
  }

  // --- Audit Logs ---
  private addAuditLogInternal(entry: Omit<AuditLog, 'id' | 'created_at'>) {
    const log: AuditLog = {
      ...entry,
      id: `audit_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      created_at: new Date().toISOString(),
    };
    this.data.audit_logs.unshift(log);
    if (this.data.audit_logs.length > 5000) {
      this.data.audit_logs.length = 5000;
    }
  }

  public getAuditLogs(limit = 200): AuditLog[] {
    return this.data.audit_logs.slice(0, limit);
  }
}

export const store = new Store();
