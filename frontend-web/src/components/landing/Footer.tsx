import { Globe, MessageCircle, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-zinc-200 py-16 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-12">
        
        {/* Brand & Socials */}
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-white rounded-md ring-1 ring-slate-100 shadow-sm">
              <img src="/logo.png" alt="RGTVetrex" className="w-6 h-6 object-contain" />
            </div>
            <span className="text-xl font-bold tracking-tight text-zinc-900">RGTVetrex</span>
          </div>
          <p className="text-zinc-500 text-sm mb-6 max-w-xs leading-relaxed">
            Automating outbound sales with Autonomous AI Agents and Smart Graph Databases.
          </p>
          <div className="flex items-center gap-4 text-zinc-400">
            <a href="#" className="hover:text-rose-500 transition-colors"><MessageCircle className="w-5 h-5" /></a>
            <a href="#" className="hover:text-rose-500 transition-colors"><Globe className="w-5 h-5" /></a>
            <a href="#" className="hover:text-rose-500 transition-colors"><Mail className="w-5 h-5" /></a>
          </div>
        </div>

        {/* Links */}
        <div>
          <h4 className="font-semibold text-zinc-900 mb-4">Product</h4>
          <ul className="flex flex-col gap-3 text-sm text-zinc-500">
            <li><a href="#" className="hover:text-rose-500 transition-colors">Features</a></li>
            <li><a href="#" className="hover:text-rose-500 transition-colors">Integrations</a></li>
            <li><a href="#" className="hover:text-rose-500 transition-colors">Pricing</a></li>
            <li><a href="#" className="hover:text-rose-500 transition-colors">Changelog</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-zinc-900 mb-4">Resources</h4>
          <ul className="flex flex-col gap-3 text-sm text-zinc-500">
            <li><a href="#" className="hover:text-rose-500 transition-colors">Documentation</a></li>
            <li><a href="#" className="hover:text-rose-500 transition-colors">Blog</a></li>
            <li><a href="#" className="hover:text-rose-500 transition-colors">Community</a></li>
            <li><a href="#" className="hover:text-rose-500 transition-colors">Support</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-zinc-900 mb-4">Company</h4>
          <ul className="flex flex-col gap-3 text-sm text-zinc-500">
            <li><a href="#" className="hover:text-rose-500 transition-colors">About Us</a></li>
            <li><a href="#" className="hover:text-rose-500 transition-colors">Careers</a></li>
            <li><a href="#" className="hover:text-rose-500 transition-colors">Privacy Policy</a></li>
            <li><a href="#" className="hover:text-rose-500 transition-colors">Terms of Service</a></li>
          </ul>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-zinc-200 text-center text-sm text-zinc-400">
        &copy; {new Date().getFullYear()} RGTVetrex. All rights reserved.
      </div>
    </footer>
  );
}
