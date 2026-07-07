import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

export function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDateTime(d: string): string {
  return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function timeAgo(d: string): string {
  const sec = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return formatDate(d);
}

export function initials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export function formatCurrency(v: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename;
  a.click(); window.URL.revokeObjectURL(url);
}

// ── Pipeline stage helpers ──
export const PIPELINE_STAGES = [
  { key: 'new', label: 'New', color: '#60A5FA' },
  { key: 'contacted', label: 'Contacted', color: '#A78BFA' },
  { key: 'qualified', label: 'Qualified', color: '#818CF8' },
  { key: 'proposal_sent', label: 'Proposal Sent', color: '#F59E0B' },
  { key: 'negotiation', label: 'Negotiation', color: '#EAB308' },
  { key: 'won', label: 'Won', color: '#10B981' },
  { key: 'lost', label: 'Lost', color: '#EF4444' },
];

export function stageLabel(key: string): string {
  return PIPELINE_STAGES.find(s => s.key === key)?.label || key;
}

export function stageColor(key: string): string {
  return PIPELINE_STAGES.find(s => s.key === key)?.color || '#9CA3AF';
}
