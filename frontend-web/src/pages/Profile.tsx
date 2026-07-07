import { useState, useEffect, useRef } from 'react';
import Card from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { User, Shield, Key } from 'lucide-react';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';

export default function Profile() {
  const { user, updateProfile } = useAuth();
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    timezone: 'America/New_York (EST)'
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    updateProfile({ name: formData.name });
    alert("Profile updated successfully");
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateProfile({ avatar: reader.result as string });
        alert("Avatar updated successfully");
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto h-full flex flex-col space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-extrabold text-ink tracking-tight">My Profile</h1>
        <p className="text-sm text-ink-muted mt-1">Manage your personal information and security settings.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="p-6 flex flex-col items-center text-center space-y-4 shadow-sm border border-slate-border">
            {user?.avatar ? (
              <img src={user.avatar} alt="Avatar" className="w-24 h-24 rounded-full object-cover border border-slate-border shadow-sm" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-brand-500 text-white flex items-center justify-center text-3xl font-bold shadow-sm">
                {user?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || '?'}
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-ink">{user?.name || 'User'}</h2>
              <p className="text-sm text-ink-muted capitalize">{user?.role?.replace('_', ' ') || 'Member'}</p>
            </div>
            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleAvatarChange} />
            <Button variant="outline" className="w-full mt-2" onClick={() => fileInputRef.current?.click()}>
              Change Avatar
            </Button>
          </Card>

        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 shadow-sm border border-slate-border">
            <h3 className="text-lg font-bold text-ink mb-6 border-b border-slate-border pb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-brand-500" /> Personal Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-ink">Full Name</label>
                <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-ink">Email Address <span className="text-xs text-ink-muted font-normal">(Cannot be changed)</span></label>
                <Input value={user?.email || ''} type="email" disabled className="bg-surface1 text-ink-muted cursor-not-allowed opacity-75" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-ink">Phone Number</label>
                <Input placeholder="+1 (555) 000-0000" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-ink">Timezone</label>
                <select value={formData.timezone} onChange={(e) => setFormData({...formData, timezone: e.target.value})} className="w-full h-10 px-3 py-2 text-sm border border-slate-border rounded-lg bg-surface1 text-ink focus:bg-canvas focus:border-brand-500 focus:outline-none">
                  <option>America/New_York (EST)</option>
                  <option>America/Los_Angeles (PST)</option>
                  <option>Europe/London (GMT)</option>
                  <option>Asia/Kolkata (IST)</option>
                </select>
              </div>
            </div>
            
            <div className="mt-8 flex justify-end">
              <Button onClick={handleSave}>Save Changes</Button>
            </div>
          </Card>

          <Card className="p-6 shadow-sm border border-slate-border">
            <h3 className="text-lg font-bold text-ink mb-6 border-b border-slate-border pb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-brand-500" /> Security
            </h3>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-ink flex items-center gap-2"><Key className="w-4 h-4"/> Password</h4>
                  <p className="text-sm text-ink-muted">Change your account password.</p>
                </div>
                <Button variant="outline">Update</Button>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t border-slate-border">
                <div>
                  <h4 className="font-semibold text-ink">Two-Factor Authentication</h4>
                  <p className="text-sm text-ink-muted">Add an extra layer of security to your account.</p>
                </div>
                <Button variant="outline">Enable 2FA</Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
