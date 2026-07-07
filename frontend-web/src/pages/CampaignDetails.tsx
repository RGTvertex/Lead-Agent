import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Title, Card, Text, Badge } from '@tremor/react';
import { motion } from 'framer-motion';
import { ArrowLeft, RefreshCw, Edit3, Save, Phone, Mail, Building, Briefcase } from 'lucide-react';

// Module-level cache for instant loads
let campaignCache: Record<string, any> = {};

export default function CampaignDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<any>(campaignCache[id || ''] || null);
  const [isLoading, setIsLoading] = useState(!campaignCache[id || '']);
  const [error, setError] = useState('');
  const [approving, setApproving] = useState(false);
  
  // Array of { index: number, final_draft: string }
  const [approvedLeadsData, setApprovedLeadsData] = useState<any[]>([]);
  
  // UI State for Editing
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [tempDraft, setTempDraft] = useState('');

  const fetchCampaign = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/campaigns/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch campaign details');
      const data = await res.json();
      if (id) {
        campaignCache[id] = data;
      }
      setCampaign(data);
      
      // Initialize approvedLeadsData if awaiting approval
      if (data.current_status === 'awaiting_approval' && data.validated_leads && approvedLeadsData.length === 0) {
        const initialData = data.validated_leads.map((lead: any, idx: number) => ({
          index: idx,
          final_draft: lead.draft_options?.[0] || 'Subject: Hello\n\nNo draft found.'
        }));
        setApprovedLeadsData(initialData);
      }
    } catch (err: any) {
      setError(err.message || 'Error loading campaign');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaign();
    // Poll every 5 seconds if running or started
    const interval = setInterval(() => {
      if (campaign && ['started', 'running'].includes(campaign.current_status)) {
        fetchCampaign();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [id, campaign?.current_status]);

  const handleApprove = async () => {
    setApproving(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`http://localhost:8000/campaigns/${id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ approved_leads: approvedLeadsData })
      });
      if (!res.ok) throw new Error('Failed to approve leads');
      await fetchCampaign(); // Refresh state
    } catch (err: any) {
      alert(err.message);
    } finally {
      setApproving(false);
    }
  };

  const handleSaveDraft = () => {
    if (editingIndex === null) return;
    setApprovedLeadsData(prev => 
      prev.map(item => item.index === editingIndex ? { ...item, final_draft: tempDraft } : item)
    );
    setEditingIndex(null);
  };

  const toggleLeadApproval = (idx: number) => {
    const isApproved = approvedLeadsData.some(l => l.index === idx);
    if (isApproved) {
      setApprovedLeadsData(prev => prev.filter(l => l.index !== idx));
    } else {
      const lead = campaign.validated_leads[idx];
      setApprovedLeadsData(prev => [...prev, { index: idx, final_draft: lead.draft_options?.[0] || '' }]);
    }
  };

  if (isLoading) {
    return (
      <div className="p-10 flex justify-center items-center h-full">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="p-10">
        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm">{error || 'Not found'}</div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <button 
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors mb-6 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        <div className="flex justify-between items-start mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Title className="text-3xl text-slate-900 font-bold truncate max-w-2xl">
                {campaign.target_criteria}
              </Title>
              <Badge color={
                campaign.current_status === 'running' ? 'emerald' : 
                campaign.current_status === 'awaiting_approval' ? 'amber' : 'slate'
              } className="rounded-lg px-2.5 py-1 font-medium capitalize h-7">
                {campaign.current_status.replace('_', ' ')}
              </Badge>
            </div>
            <Text className="text-slate-500 flex gap-4">
              <span>Campaign ID: {campaign.campaign_id}</span>
              <span>Total Processed: {campaign.raw_leads?.length || 0}</span>
              <span>Valid Found: {campaign.validated_leads?.length || 0}</span>
            </Text>
          </div>
          
          <button 
            onClick={fetchCampaign}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        {/* Metrics Panel — Master Doc §5.6 Analytics */}
        {campaign.metrics && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Emails Sent</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{campaign.metrics.sent_emails ?? 0}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Replies</p>
              <p className="text-2xl font-bold text-indigo-600 mt-1">{campaign.metrics.replies ?? 0}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Positive Replies</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{campaign.metrics.positive_replies ?? 0}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Bounces</p>
              <p className="text-2xl font-bold text-red-500 mt-1">{campaign.metrics.bounces ?? 0}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Success Rate</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{campaign.metrics.success_rate ?? 0}%</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Pending Follow-ups</p>
              <p className="text-2xl font-bold text-slate-600 mt-1">{campaign.metrics.pending_followups ?? 0}</p>
            </div>
          </div>
        )}

        {/* Action Panel for Approvals */}
        {campaign.current_status === 'awaiting_approval' && (
          <Card className="rounded-2xl border border-amber-200 bg-amber-50 shadow-sm mb-8 p-6 sticky top-4 z-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-lg font-semibold text-amber-900">Review Drafts & Approve</h3>
                <p className="text-amber-700 text-sm mt-1">
                  We prepared {campaign.validated_leads?.length || 0} email drafts. Review and edit them below before approving.
                </p>
              </div>
              <button 
                onClick={handleApprove}
                disabled={approving || approvedLeadsData.length === 0}
                className="bg-amber-600 hover:bg-amber-700 disabled:bg-amber-600/50 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm whitespace-nowrap"
              >
                {approving ? 'Approving...' : `Approve & Send to ${approvedLeadsData.length} Leads`}
              </button>
            </div>
          </Card>
        )}

        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-slate-900">Extracted Leads</h3>
          {campaign.validated_leads && campaign.validated_leads.length > 0 ? (
            <div className="grid gap-6">
              {campaign.validated_leads.map((lead: any, idx: number) => {
                const isApproved = approvedLeadsData.some(l => l.index === idx);
                const currentDraft = approvedLeadsData.find(l => l.index === idx)?.final_draft || lead.draft_options?.[0] || '';
                const isEditing = editingIndex === idx;

                return (
                  <Card key={idx} className={`rounded-2xl border p-0 overflow-hidden transition-all ${isApproved ? 'border-emerald-200 ring-1 ring-emerald-500/20' : 'border-slate-200'}`}>
                    <div className="p-6 bg-white flex flex-col md:flex-row gap-6">
                      
                      {/* Left: Lead Details */}
                      <div className="flex-1 space-y-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="text-lg font-semibold text-slate-900">{lead.full_name || 'Unknown Name'}</h4>
                            <div className="flex items-center gap-2 text-slate-500 text-sm mt-1">
                              <Briefcase className="w-4 h-4" />
                              <span>{lead.job_title || 'Unknown Title'}</span>
                            </div>
                          </div>
                          {campaign.current_status === 'awaiting_approval' && (
                            <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100">
                              <input 
                                type="checkbox" 
                                checked={isApproved}
                                onChange={() => toggleLeadApproval(idx)}
                                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-600/20 w-4 h-4"
                              />
                              <span className="text-sm font-medium text-slate-700">Approve</span>
                            </label>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2 text-slate-600">
                            <Building className="w-4 h-4 text-slate-400" />
                            <span className="font-medium text-slate-900">{lead.company_name || 'Unknown Company'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-600">
                            <Mail className="w-4 h-4 text-slate-400" />
                            <span>{lead.email || 'No email found'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-600">
                            <Phone className="w-4 h-4 text-slate-400" />
                            <span>{lead.phone || 'No phone found'}</span>
                          </div>
                        </div>

                        {lead.company_description && (
                          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-sm text-slate-600">
                            <span className="font-semibold text-slate-700 mr-2">Company Info:</span>
                            {lead.company_description}
                          </div>
                        )}
                      </div>

                      {/* Right: Email Draft (only in awaiting_approval) */}
                      {campaign.current_status === 'awaiting_approval' && isApproved && (
                        <div className="flex-1 border-t md:border-t-0 md:border-l border-slate-200 pt-6 md:pt-0 md:pl-6 flex flex-col">
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="font-semibold text-slate-900 flex items-center gap-2">
                              <Mail className="w-4 h-4 text-emerald-600" />
                              Email Draft
                            </h5>
                            {!isEditing ? (
                              <button 
                                onClick={() => { setEditingIndex(idx); setTempDraft(currentDraft); }}
                                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 bg-indigo-50 px-2 py-1 rounded"
                              >
                                <Edit3 className="w-3 h-3" /> Edit
                              </button>
                            ) : (
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => setEditingIndex(null)}
                                  className="text-sm text-slate-500 hover:text-slate-700 font-medium"
                                >
                                  Cancel
                                </button>
                                <button 
                                  onClick={handleSaveDraft}
                                  className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded"
                                >
                                  <Save className="w-3 h-3" /> Save
                                </button>
                              </div>
                            )}
                          </div>
                          
                          {isEditing ? (
                            <div className="flex-1 flex flex-col gap-2">
                              {/* Show Template Options if available */}
                              {lead.draft_options && lead.draft_options.length > 1 && (
                                <div className="flex gap-2 mb-2">
                                  {lead.draft_options.map((opt: string, i: number) => (
                                    <button 
                                      key={i}
                                      onClick={() => setTempDraft(opt)}
                                      className="text-xs px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded border border-slate-200"
                                    >
                                      Load Option {i + 1}
                                    </button>
                                  ))}
                                </div>
                              )}
                              <textarea
                                value={tempDraft}
                                onChange={e => setTempDraft(e.target.value)}
                                className="w-full flex-1 min-h-[150px] p-3 text-sm text-slate-700 border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none resize-y"
                              />
                            </div>
                          ) : (
                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm text-slate-700 whitespace-pre-wrap flex-1 min-h-[150px]">
                              {currentDraft}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="bg-slate-50 rounded-2xl border border-slate-100 p-8 text-center">
              <p className="text-slate-500">No leads found yet. Check back soon.</p>
            </div>
          )}
        </div>

      </motion.div>
    </div>
  );
}
