export type UserRole = 'ადმინისტრატორი' | 'თანამშრომელი';

export type NavTab =
  | 'dashboard'
  | 'persons'
  | 'register'
  | 'renewals'
  | 'reviews'
  | 'age18'
  | 'age21'
  | 'small_homes'
  | 'foster_parents'
  | 'reports'
  | 'users'
  | 'settings'
  | 'audit'
  | 'guide';

// მიმღები მშობელი
export type FosterParentStatus = 'რეგისტრირებული' | 'დაქირავებული';
export type FosterCategory = 'გადაუდებელი' | 'რეგულარული';

export const MAX_FOSTER_CHILDREN = 4;

export interface FosterParent {
  id: string;
  first_name: string;
  last_name: string;
  personal_number: string;
  phone?: string;
  address?: string;
  category: FosterCategory;
  is_adopter?: boolean; // მშვილებელი (მშვილებელი ოჯახი)
  children_limit_exception: boolean;
  exception_reason?: string;
  exception_granted_by?: string;
  exception_granted_at?: string;
  created_by: string;
  created_at: string;
  updated_by?: string;
  updated_at?: string;

  // დინამიკურად გამოთვლილი (client-side)
  active_children?: Person[];
  active_children_count?: number;
  status?: FosterParentStatus;
}

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  position: string;
  phone: string;
  username: string;
  is_active: boolean;
  must_change_password?: boolean;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
}

export type PersonStatus = 'ჯანმრთელი' | 'შშმ' | 'სსმ';

export interface ContactPerson {
  first_name: string;
  last_name: string;
  personal_number: string;
  phone: string;
}

// სამშვილებლო სტატუსი
export type AdoptionStatus = 'გასაშვილებელი' | 'გაშვილებული';

// მშვილებელი ოჯახის საპასპორტე მონაცემები (გაშვილებულ ბავშვზე)
export interface AdoptiveFamily {
  first_name: string;
  last_name: string;
  personal_number: string;
  passport_number: string;
  spouse_name?: string;
  spouse_personal_number?: string;
  spouse_passport_number?: string;
  address?: string;
  phone?: string;
  decision_number?: string;
  adoption_date?: string;
}

export type PlacementType = 
  | 'გადაუდებელი მინდობითი აღზრდა'
  | 'რეგულარული მინდობითი აღზრდა'
  | 'ნათესაური მინდობითი აღზრდა'
  | 'მცირე საოჯახო ტიპის სახლი'
  | 'რეინტეგრაცია';

export type PlacementStatus = 'აქტიური' | 'დასრულებული' | 'ვადაგადაცილებული';

export interface SmallFamilyHome {
  id: string;
  name: string;
  address: string;
  director_name?: string;
  responsible_person?: string;
  phone?: string;
  capacity?: number;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Placement {
  id: string;
  person_id: string;
  placement_type: PlacementType;
  start_date: string; // ISO format YYYY-MM-DD
  planned_end_date?: string; // ISO format YYYY-MM-DD
  actual_end_date?: string; // ISO format YYYY-MM-DD
  placement_status: PlacementStatus;
  placement_reason?: string;
  location_or_organization?: string;
  comment?: string;

  // Dynamic program-specific fields
  foster_parent_id?: string; // მიმღები მშობლის reference (foster_parents კოლექცია)
  foster_parent_name?: string; // მინდობით აღმზრდელის / ნათესავის სახელი და გვარი
  foster_parent_personal_number?: string; // მიმღები მშობლის პირადი ნომერი
  foster_parent_phone?: string; // მიმღები მშობლის ტელეფონი
  foster_parent_address?: string; // მიმღები მშობლის ფაქტობრივი მისამართი
  contract_number?: string; // ხელშეკრულების ნომერი
  contract_date?: string; // ხელშეკრულების თარიღი
  placed_with?: string; // ვისთან განთავსდა
  relationship_type?: string; // ნათესაური კავშირი (ნათესაური მინდობითი აღზრდა)
  kinship_relation?: string; // ნათესაური კავშირი ბავშვთან
  kinship_decision_number?: string; // გადაწყვეტილების/ბრძანების ნომერი (ნათესაური)
  family_info?: string; // ოჯახის მონაცემები

  small_home_id?: string; // მცირე საოჯახო ტიპის სახლის ID
  small_home_name?: string; // მცირე საოჯახო ტიპის სახლის დასახელება
  small_home_address?: string; // მისამართი
  small_home_order_number?: string; // ჩარიცხვის ბრძანების ნომერი
  responsible_person?: string; // პასუხისმგებელი პირი
  enrollment_date?: string; // განთავსების / ჩარიცხვის / რეინტეგრაციის თარიღი

  bio_family_member_name?: string; // ბიოლოგიური ოჯახის წევრის სახელი და გვარი (რეინტეგრაცია)
  bio_family_relation?: string; // ნათესაური კავშირი (რეინტეგრაცია)
  reintegration_allowance?: number; // ფინანსური დახმარების ოდენობა (ლარი/თვე)
  reintegration_target?: string; // ვისთან განხორციელდა რეინტეგრაცია
  reintegration_member_name?: string; // პირის/ოჯახის წევრის სახელი და გვარი
  reintegration_status_or_relation?: string; // სტატუსი ან ნათესაური კავშირი
  reintegration_address?: string; // მისამართი
  reintegration_date?: string; // რეინტეგრაციის თარიღი

  notes?: string;

  created_by: string; // User full name / username
  created_at: string;
  updated_by?: string;
  updated_at?: string;
}

export interface PlacementExtension {
  id: string;
  placement_id: string;
  old_end_date: string;
  new_end_date: string;
  extension_reason: string;
  decision_date: string;
  created_by: string;
  created_at: string;
}

export type CaseReviewStatus =
  | 'დაგეგმილი'
  | 'გადასახედი'
  | 'ვადაგადაცილებული'
  | 'პროცესში'
  | 'შესრულებული'
  | 'გაგრძელებული'
  | 'პროგრამა დასრულებულია';

export interface CaseReview {
  id: string;
  person_id: string;
  placement_id: string;
  review_number: number; // 1, 2, 3...
  placement_type?: string; // ინფორმაციული — რომელ პროგრამას შეესაბამება
  due_date: string; // ISO YYYY-MM-DD
  review_date?: string; // Actual date performed
  status: CaseReviewStatus;
  result?: string;
  program_decision?: 'გაგრძელება' | 'დასრულება';
  comment?: string;
  new_planned_end_date?: string;
  notes?: string;
  attachment_name?: string;
  performed_by?: string;
  performed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Person {
  id: string;
  case_number: string;
  first_name: string;
  last_name: string;
  personal_number: string;
  birth_date: string; // YYYY-MM-DD
  admission_date: string; // YYYY-MM-DD
  admission_reason: string;
  admission_source: string;
  person_status: PersonStatus;
  contact_person: ContactPerson;
  case_manager?: string; // ქეის მენეჯერი / სოციალური მუშაკი
  adoption_status?: AdoptionStatus; // გასაშვილებელი / გაშვილებული
  adoptive_family?: AdoptiveFamily; // მშვილებელი ოჯახის მონაცემები (თუ გაშვილებულია)
  case_status: 'აქტიური' | 'დახურული' | 'არქივირებული';
  is_locked: boolean;
  locked_by?: string;
  locked_at?: string;
  lock_reason?: string;
  created_by: string;
  created_at: string;
  updated_by?: string;
  updated_at?: string;
  archived_at?: string;
  archived_by?: string;
  archive_reason?: string;

  // მიმღები მშობლის რეალური კავშირი (reference მშობლის id-ზე)
  foster_parent_id?: string;

  // Dynamic computed fields returned by server
  current_placement?: Placement;
  placements_history?: Placement[];
  extensions_history?: PlacementExtension[];
  next_review?: CaseReview;
  reviews_history?: CaseReview[];
  calculated_age?: number;
  adulthood_date?: string; // Date turning 18
  days_until_adulthood?: number;
  age_21_date?: string; // Date turning 21
  days_until_21?: number;
  days_remaining_in_placement?: number;
  days_overdue?: number;
  reminder_status?: 'ნორმალური' | 'გასაგრძელებელი' | 'კრიტიკული' | 'ვადაგადაცილებული';

  // გადასინჯვის დინამიკური მდგომარეობა
  review_done?: boolean;
  reviewed_at?: string;
  reviewed_by?: string;
}

export interface SystemSettings {
  advance_reminder_value: number;
  advance_reminder_unit: 'day' | 'week' | 'month';
  critical_reminder_value: number;
  critical_reminder_unit: 'day';
  updated_by?: string;
  updated_at?: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  user_name: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  person_name?: string;
  person_personal_number?: string;
  old_values?: any;
  new_values?: any;
  reason?: string;
  ip_address?: string;
  created_at: string;
}

export interface DashboardStats {
  total_persons: number;
  active_cases: number;
  locked_cases: number;
  emergency_count: number;
  regular_count: number;
  kinship_count: number;
  group_home_count: number;
  reintegration_count: number;
  renewal_due_count: number;
  critical_count: number;
  overdue_count: number;
  approaching_18_count: number;
  approaching_21_count: number;
  reviews_due_count: number;
  reviews_overdue_count: number;
}
