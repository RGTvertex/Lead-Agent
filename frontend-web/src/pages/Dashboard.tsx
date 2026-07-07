import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Building2, Target, PhoneCall, Trophy, XCircle, CheckSquare, TrendingUp, Users,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts';
import { dashboardAPI, tasksAPI, notesAPI } from '@/lib/api';
import Card from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

const PIE_COLORS = ['#f43f5e', '#0d9488', '#8b5cf6', '#eab308', '#3b82f6', '#14b8a6'];

const statDefs = [
  { key: 'sent_emails',       label: 'Sent Emails',  icon: Target,     bg: 'bg-blue-50 text-blue-500' },
  { key: 'replies',           label: 'Replies',      icon: PhoneCall,  bg: 'bg-indigo-50 text-indigo-500' },
  { key: 'positive_replies',  label: 'Positive',     icon: Trophy,     bg: 'bg-emerald-50 text-emerald-500' },
  { key: 'bounces',           label: 'Bounces',      icon: XCircle,    bg: 'bg-red-50 text-red-500' },
  { key: 'pending_followups', label: 'Followups',    icon: Users,      bg: 'bg-amber-50 text-amber-500' },
  { key: 'success_rate',      label: 'Success Rate', icon: TrendingUp, bg: 'bg-violet-50 text-violet-500' },
  { key: 'total_tasks',      label: 'My Tasks',     icon: CheckSquare,bg: 'bg-teal-50 text-teal-500' },
];

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardAPI.get().then(r => r.data),
    refetchInterval: 1000,
  });

  const [notes, setNotes] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);

  const loadNotesAndTasks = async () => {
    try {
      const [notesRes, tasksRes] = await Promise.all([
        notesAPI.list(),
        tasksAPI.list()
      ]);

      if (notesRes.status === 200) {
        setNotes(notesRes.data.notes || []);
      }
      
      if (tasksRes.status === 200) {
        setTasks(tasksRes.data.tasks || []);
      }
    } catch (e) {
      console.error("Failed to load notes or tasks:", e);
    }
  };

  useEffect(() => {
    loadNotesAndTasks();
    window.addEventListener('noteAdded', loadNotesAndTasks);
    window.addEventListener('taskAdded', loadNotesAndTasks);
    return () => {
      window.removeEventListener('noteAdded', loadNotesAndTasks);
      window.removeEventListener('taskAdded', loadNotesAndTasks);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="h-[120px] bg-surface-1 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const { stats, lead_growth, industry_distribution, lead_status } = data || {};
  const totalValue = lead_status?.reduce((s: number, x: any) => s + (x.count || 0), 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-ink tracking-tight">Dashboard</h1>
          <p className="text-sm text-ink-muted mt-0.5">Your sales overview at a glance</p>
        </div>
        <div className="flex items-center gap-3 text-sm text-ink-muted font-medium">
          <TrendingUp size={16} className="text-success" />
          <span>Pipeline value: <strong className="text-ink">${totalValue.toLocaleString()}</strong></span>
        </div>
      </div>

      {/* KPI Cards — large numbers, readable from across the room */}
      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        initial="hidden"
        animate="show"
        variants={{
          hidden: { opacity: 0 },
          show: { opacity: 1, transition: { staggerChildren: 0.1 } }
        }}
      >
        {statDefs.map(s => {
          const val = (stats as any)?.[s.key] ?? 0;
          return (
            <motion.div key={s.key} variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } } }}>
              <Card hover padding className="relative overflow-hidden h-full">
                <div className="absolute top-0 right-0 w-20 h-20 -mr-4 -mt-4 opacity-5">
                  <s.icon size={80} />
                </div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-ink-muted mb-2">{s.label}</p>
                <p className="kpi-number text-ink">{val}</p>
                <div className={cn('inline-flex p-1.5 rounded-lg mt-3', s.bg)}>
                  <s.icon size={14} />
                </div>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Growth */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-ink uppercase tracking-wider">Deal Growth</h3>
              <p className="text-xs text-ink-muted mt-0.5">12-month trend</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center">
              <TrendingUp size={16} className="text-brand-500" />
            </div>
          </div>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={lead_growth}>
                <defs>
                  <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#DFE3EB" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fontWeight: 500 }} stroke="#9CA3AF" axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fontWeight: 500 }} stroke="#9CA3AF" axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #DFE3EB', boxShadow: '0 4px 12px rgba(45,55,72,0.08)' }} />
                <Area type="monotone" dataKey="count" stroke="#f43f5e" strokeWidth={2.5} fill="url(#growthGrad)" dot={{ r: 3, fill: '#f43f5e' }} activeDot={{ r: 5, fill: '#f43f5e' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Industry Donut */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-ink uppercase tracking-wider">Industry Mix</h3>
              <p className="text-xs text-ink-muted mt-0.5">Company distribution</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center">
              <Building2 size={16} className="text-teal" />
            </div>
          </div>
          <div className="h-[260px] flex items-center">
            <ResponsiveContainer width="60%" height="100%">
              <PieChart>
                <Pie data={industry_distribution} cx="50%" cy="50%" innerRadius={50} outerRadius={90}
                  paddingAngle={3} dataKey="count" nameKey="industry">
                  {industry_distribution?.map((_: any, i: number) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="w-[40%] space-y-2">
              {industry_distribution?.slice(0, 6).map((d: any, i: number) => (
                <div key={d.industry} className="flex items-center gap-2 text-xs">
                  <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i] }} />
                  <span className="text-ink-muted truncate flex-1">{d.industry}</span>
                  <span className="font-bold text-ink tabular-nums">{d.count}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Lead Status Bar Chart — full width */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-ink uppercase tracking-wider">Pipeline Funnel</h3>
            <p className="text-xs text-ink-muted mt-0.5">Deals by stage</p>
          </div>
        </div>
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={lead_status} barSize={48} barGap={12}>
              <CartesianGrid strokeDasharray="3 3" stroke="#DFE3EB" vertical={false} />
              <XAxis dataKey="status" tick={{ fontSize: 11, fontWeight: 600 }} stroke="#9CA3AF" axisLine={false} tickLine={false}
                tickFormatter={(v: string) => v.replace(/_/g, ' ')} />
              <YAxis tick={{ fontSize: 11, fontWeight: 500 }} stroke="#9CA3AF" axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #DFE3EB', boxShadow: '0 4px 12px rgba(45,55,72,0.08)' }}
                labelFormatter={(label: any) => `Date: ${label}`} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {lead_status?.map((_: any, i: number) => {
                  return <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Recent Notes & Tasks Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notes */}
        <div>
          <h3 className="text-lg font-bold text-ink mb-4 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-brand-500" /> Recent Notes
          </h3>
          {notes.length === 0 ? (
            <Card className="p-8 text-center border border-dashed border-slate-border h-[200px] flex items-center justify-center">
              <p className="text-sm text-ink-muted">No notes found.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 max-h-[500px] overflow-y-auto pr-2">
              {notes.map((note) => (
                <Card key={note.id} className="p-4 bg-surface1 border-slate-border relative group shadow-sm">
                  <p className="text-sm text-ink whitespace-pre-wrap leading-relaxed">{note.content}</p>
                  <div className="mt-4 pt-3 border-t border-slate-border flex justify-between items-center text-xs text-ink-muted">
                    <span>{new Date(note.created_at).toLocaleDateString()} at {new Date(note.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    <button 
                      onClick={async () => {
                        try {
                          await notesAPI.delete(note.id);
                          setNotes(notes.filter(n => n.id !== note.id));
                        } catch (e) {
                          console.error("Delete note error:", e);
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 text-red-500 hover:underline transition-opacity">
                      Delete
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Tasks */}
        <div>
          <h3 className="text-lg font-bold text-ink mb-4 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-teal-500" /> My Tasks
          </h3>
          {tasks.length === 0 ? (
            <Card className="p-8 text-center border border-dashed border-slate-border h-[200px] flex items-center justify-center">
              <p className="text-sm text-ink-muted">No tasks found.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 max-h-[500px] overflow-y-auto pr-2">
              {tasks.map((task) => (
                <Card key={task.id} className="p-4 bg-surface1 border-slate-border relative group shadow-sm flex flex-col justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-ink">{task.title}</h4>
                    <p className="text-xs text-ink-muted mt-1">
                      Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-border flex justify-between items-center text-xs text-ink-muted">
                    <span className="bg-brand-50 text-brand-500 px-2 py-1 rounded-full font-medium capitalize">
                      {task.status}
                    </span>
                    <button 
                      onClick={async () => {
                        try {
                          await tasksAPI.delete(task.id);
                          setTasks(tasks.filter(t => t.id !== task.id));
                        } catch (e) {
                          console.error("Delete task error:", e);
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 text-red-500 hover:underline transition-opacity">
                      Delete
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
