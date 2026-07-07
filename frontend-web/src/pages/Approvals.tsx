import { useState, useEffect, useRef } from 'react';
import { Title, Text, Card, Badge } from '@tremor/react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Clock } from 'lucide-react';

// Module-level cache for instant loads
let cachedApprovals: any[] | null = null;

export default function Approvals() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<any[]>(cachedApprovals || []);
  const [isLoading, setIsLoading] = useState(!cachedApprovals);

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/campaigns`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          // Filter campaigns that are specifically in awaiting_approval state
          cachedApprovals = data.campaigns.filter((c: any) => c.current_status === 'awaiting_approval');
          setCampaigns(cachedApprovals || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCampaigns();
  }, []);

  if (isLoading) {
    return (
      <div className="p-10 flex justify-center items-center h-full">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      <div className="mb-8">
        <Title className="text-3xl text-slate-900 font-bold">Pending Approvals</Title>
        <Text className="text-slate-500 mt-1">Review AI drafts and approve leads for outreach.</Text>
      </div>

      {campaigns.length === 0 ? (
        <div className="flex-1 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 p-20">
          <div className="text-center">
            <h3 className="text-lg font-medium text-slate-900 mb-2">You're all caught up!</h3>
            <p className="text-slate-500 max-w-sm mx-auto">
              There are no campaigns waiting for your approval right now.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign, i) => (
            <Card key={i} className="rounded-2xl border-none shadow-sm ring-1 ring-amber-200 bg-gradient-to-b from-white to-amber-50/30 p-6 flex flex-col cursor-pointer hover:shadow-md transition-all" onClick={() => navigate(`/dashboard/campaigns/${campaign.campaign_id}`)}>
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                  <Clock className="w-5 h-5" />
                </div>
                <Badge color="amber" className="rounded-lg">Awaiting Action</Badge>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 line-clamp-1 mb-1">
                {campaign.target_criteria}
              </h3>
              <p className="text-sm text-slate-500 mb-6 mt-auto">
                {campaign.validated_leads?.length || 0} leads require your approval to begin outreach.
              </p>
              <div className="flex items-center text-sm font-semibold text-amber-600 gap-1 group">
                Review & Approve
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
