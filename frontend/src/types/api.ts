// Pocket Consultancy V2 - API Type Definitions matching FastAPI OpenAPI 3.1.0

export type UserRole = "student" | "counselor" | "documentation_officer" | "admin";
export type AccountStatus = "pending" | "active" | "rejected" | "suspended";
export type StudyLevel = "undergraduate" | "postgraduate" | "doctorate" | "diploma" | "certificate";
export type AppointmentStatus = "scheduled" | "confirmed" | "completed" | "cancelled";
export type DocumentCategory =
  | "passport"
  | "academic_transcript"
  | "english_test"
  | "recommendation_letter"
  | "statement_of_purpose"
  | "financial_proof"
  | "other";
export type DocumentStatus = "pending" | "approved" | "rejected";
export type ApplicationStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "conditional_offer"
  | "unconditional_offer"
  | "visa_processing"
  | "enrolled"
  | "rejected"
  | "withdrawn";
export type MatchStatus = "matches" | "needs_review" | "insufficient_data";
export type NotificationType = "system" | "appointment" | "document" | "application";

// User & Auth
export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  account_status: AccountStatus;
  is_active: boolean;
  phone_number?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in_minutes: number;
}

export interface UserListResponse {
  items: User[];
  total: number;
  page: number;
  size: number;
}

// Student Profile
export interface StudentProfile {
  id?: string;
  user_id: string;
  full_name?: string | null;
  email?: string | null;
  phone_number?: string | null;
  date_of_birth?: string | null;
  nationality?: string | null;
  address?: string | null;
  highest_qualification?: string | null;
  institution_name?: string | null;
  academic_score?: number | null;
  score_type?: string | null;
  intended_study_level?: StudyLevel | null;
  intended_course?: string | null;
  preferred_countries?: string[];
  budget_amount?: number | null;
  budget_currency?: string;
  assigned_counselor_id?: string | null;
  assigned_counselor_name?: string | null;
  created_at?: string;
  updated_at?: string;
}

// Countries
export interface Country {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CountryListResponse {
  items: Country[];
  total: number;
}

// Universities
export interface University {
  id: string;
  name: string;
  country_id: string;
  city: string;
  website?: string | null;
  description?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UniversityListResponse {
  items: University[];
  total: number;
  page: number;
  size: number;
}

// Courses
export interface Course {
  id: string;
  name: string;
  university_id: string;
  country_id: string;
  study_level: StudyLevel;
  duration_months: number;
  tuition_fee: number;
  currency: string;
  min_academic_score?: number | null;
  entry_requirements?: string | null;
  description?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  university_name?: string;
  country_name?: string;
}

export interface CourseListResponse {
  items: Course[];
  total: number;
  page: number;
  size: number;
}

// Matching
export interface CourseMatchResult {
  course_id: string;
  course_name: string;
  university_id: string;
  country_id: string;
  study_level: string;
  tuition_fee: number;
  currency: string;
  status: MatchStatus;
  reasons: string[];
}

export interface CourseMatchResponse {
  matches: CourseMatchResult[];
  needs_review: CourseMatchResult[];
  insufficient_data: CourseMatchResult[];
  summary: {
    total_evaluated: number;
    match_count: number;
    review_count: number;
    insufficient_count: number;
  };
}

// Shortlist
export interface ShortlistItem {
  id: string;
  student_id: string;
  course_id: string;
  created_at: string;
  course?: Course;
}

export type ShortlistResponse = ShortlistItem;

export interface ShortlistListResponse {
  items: ShortlistItem[];
  total: number;
}

// Appointments & Availability
export interface AvailabilitySlot {
  id: string;
  counselor_id: string;
  start_time: string;
  end_time: string;
  is_booked: boolean;
  created_at: string;
}

export interface Appointment {
  id: string;
  student_id: string;
  counselor_id: string;
  scheduled_time: string;
  duration_minutes: number;
  status: AppointmentStatus;
  student_notes?: string | null;
  counselor_notes?: string | null;
  created_at: string;
  updated_at: string;
  student_name?: string;
  counselor_name?: string;
}

export interface AppointmentListResponse {
  items: Appointment[];
  total: number;
}

// Documents
export interface DocumentItem {
  id: string;
  student_id: string;
  filename: string;
  original_filename: string;
  category: DocumentCategory;
  file_size_bytes: number;
  mime_type: string;
  status: DocumentStatus;
  reviewed_by_id?: string | null;
  reviewed_at?: string | null;
  review_comments?: string | null;
  created_at: string;
  updated_at: string;
  student_name?: string;
}

export interface DocumentListResponse {
  items: DocumentItem[];
  total: number;
}

// Applications & Audit History
export interface ApplicationHistoryItem {
  id: string;
  application_id: string;
  from_status: string;
  to_status: string;
  changed_by_id: string;
  remarks?: string | null;
  created_at: string;
  changed_by_name?: string;
}

export interface Application {
  id: string;
  reference_number: string;
  student_id: string;
  course_id: string;
  university_id: string;
  status: ApplicationStatus;
  intake_period: string;
  counselor_id?: string | null;
  created_at: string;
  updated_at: string;
  course_name?: string;
  university_name?: string;
  student_name?: string;
}

export interface ApplicationDetailResponse {
  application: Application;
  history: ApplicationHistoryItem[];
}

export interface ApplicationListResponse {
  items: Application[];
  total: number;
  page: number;
  size: number;
}

// Notifications
export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  reference_id?: string | null;
  created_at: string;
}

export interface NotificationListResponse {
  items: NotificationItem[];
  total: number;
  unread_count: number;
}

// Counselor Notes
export interface CounselorNote {
  id: string;
  counselor_id: string;
  student_id: string;
  note_content: string;
  created_at: string;
  updated_at: string;
}

export interface CounselorNoteListResponse {
  items: CounselorNote[];
  total: number;
}
