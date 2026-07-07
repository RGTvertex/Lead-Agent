// ── Enums ────────────────────────────────────────────────────────────────
export type UserRole = 'admin' | 'sales_manager' | 'sales_executive';
export type CompanyStatus = 'active' | 'inactive' | 'lead';
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal_sent' | 'negotiation' | 'won' | 'lost';
export type Priority = 'low' | 'medium' | 'high';
export type TaskType = 'call' | 'meeting' | 'email' | 'follow_up';
export type TaskStatus = 'pending' | 'in_progress' | 'completed';

// ── Models ───────────────────────────────────────────────────────────────
export interface User {
  id: string; email: string; full_name: string; role: UserRole;
  is_active: boolean; created_at: string;
}
export interface Company {
  id: string; name: string; website?: string; industry?: string;
  description?: string; address?: string; status: CompanyStatus;
  created_at: string; updated_at?: string; contacts_count: number; leads_count: number;
}
export interface Contact {
  id: string; company_id: string; name: string; designation?: string;
  email?: string; phone?: string; is_primary: boolean; created_at: string;
}
export interface Lead {
  id: string; company_id: string; contact_id?: string; assigned_to?: string;
  status: LeadStatus; priority: Priority; value?: number;
  created_at: string; updated_at?: string;
  company?: Company; contact_person?: Contact; assigned_user?: User;
}
export interface Task {
  id: string; title: string; description?: string;
  task_type: TaskType; priority: Priority; status: TaskStatus;
  due_date?: string; assigned_to?: string; company_id?: string; lead_id?: string;
  created_at: string; assigned_user?: User;
}
export interface Note {
  id: string; company_id: string; author_id: string;
  content: string; created_at: string; author?: User;
}
export interface Activity {
  id: string; user_id?: string; activity_type: string; description: string;
  entity_type?: string; entity_id?: string; created_at: string; user?: User;
}

// ── Dashboard ─────────────────────────────────────────────────────────────
export interface DashboardStats {
  total_companies: number; total_leads: number;
  new_leads: number; contacted_leads: number; won_leads: number; lost_leads: number;
  todays_tasks: number;
}
export interface ChartPoint { month?: string; industry?: string; status?: string; count: number; }
export interface DashboardResponse {
  stats: DashboardStats; lead_growth: ChartPoint[];
  industry_distribution: ChartPoint[]; lead_status: ChartPoint[];
}

// ── Form data ─────────────────────────────────────────────────────────────
export interface CompanyFormData {
  name: string; website?: string; industry?: string;
  description?: string; address?: string; status: CompanyStatus;
}
export interface ContactFormData {
  name: string; designation?: string; email?: string;
  phone?: string; is_primary: boolean; company_id: string;
}
export interface LeadFormData {
  company_id: string; contact_id?: string; assigned_to?: string;
  status: LeadStatus; priority: Priority; value?: number;
}
export interface TaskFormData {
  title: string; description?: string; task_type: TaskType;
  priority: Priority; status: TaskStatus; due_date?: string;
  assigned_to?: string; company_id?: string; lead_id?: string;
}
