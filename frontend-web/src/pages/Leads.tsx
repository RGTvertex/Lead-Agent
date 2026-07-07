import { useState, useEffect, useRef } from 'react';
import { Title, Text, Card, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell, Badge } from '@tremor/react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

// Module-level cache for instant loads
let cachedLeadsCampaigns: any[] | null = null;

export default function Leads() {
  const [campaigns, setCampaigns] = useState<any[]>(cachedLeadsCampaigns || []);
  const [isLoading, setIsLoading] = useState(!cachedLeadsCampaigns);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          navigate('/login');
          return;
        }

        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/campaigns`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (res.status === 401) {
          localStorage.removeItem('auth_token');
          navigate('/login');
          return;
        }

        if (!res.ok) throw new Error('Failed to fetch campaigns');
        const data = await res.json();
        cachedLeadsCampaigns = data.campaigns || [];
        setCampaigns(cachedLeadsCampaigns || []);
      } catch (err) {
        setError('Error loading leads data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCampaigns();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="p-10 flex justify-center items-center h-full">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto h-full flex flex-col">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="mb-8">
          <Title className="text-3xl text-slate-900 font-bold">Leads Overview</Title>
          <Text className="text-slate-500 mt-1">Review the number of leads extracted and approved across your campaigns.</Text>
        </div>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm">
            {error}
          </div>
        )}

        <Card className="rounded-2xl border-none shadow-sm ring-1 ring-slate-100 bg-white p-0 overflow-hidden">
          <Table>
            <TableHead className="bg-slate-50 border-b border-slate-100">
              <TableRow>
                <TableHeaderCell className="text-slate-500 font-medium py-4 px-6">Campaign Target</TableHeaderCell>
                <TableHeaderCell className="text-slate-500 font-medium py-4 px-6">Status</TableHeaderCell>
                <TableHeaderCell className="text-slate-500 font-medium py-4 px-6">Total Leads Found</TableHeaderCell>
                <TableHeaderCell className="text-slate-500 font-medium py-4 px-6">Approved Leads</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {campaigns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-10 text-slate-500">
                    No campaigns found. Start a new campaign to gather leads.
                  </TableCell>
                </TableRow>
              ) : (
                campaigns.map((campaign) => (
                  <TableRow key={campaign.campaign_id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="py-4 px-6">
                      <div className="font-medium text-slate-900">
                        {campaign.target_criteria || "Unnamed Campaign"}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        {new Date(campaign.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <Badge 
                        color={
                          campaign.current_status === 'approved' || campaign.current_status === 'campaign_finished' ? 'emerald' : 
                          campaign.current_status === 'awaiting_approval' ? 'amber' : 'slate'
                        }
                        className="rounded-lg font-medium"
                      >
                        {campaign.current_status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <span className="text-slate-900 font-medium">{campaign.stats?.raw_leads || 0}</span>
                      <span className="text-slate-500 text-sm ml-2">Extracted</span>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <span className="text-emerald-600 font-semibold">{campaign.stats?.sent_emails || 0}</span>
                      <span className="text-slate-500 text-sm ml-2">Approved</span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </motion.div>
    </div>
  );
}
