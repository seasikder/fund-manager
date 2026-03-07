/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  CreditCard, 
  History, 
  Settings, 
  LogOut, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Bell,
  Smartphone,
  ShieldCheck,
  Menu,
  X,
  Image as ImageIcon,
  Search,
  ArrowUpCircle,
  ArrowDownCircle,
  ArrowLeft,
  Camera,
  Trash2,
  Eye,
  EyeOff,
  TrendingUp,
  TrendingDown,
  Database,
  Download,
  UserPlus,
  UserMinus,
  LayoutDashboard,
  UserCog,
  Wallet,
  Info,
  UserCheck,
  UserX,
  User as UserIcon,
  Wifi,
  WifiOff,
  RefreshCw
} from 'lucide-react';

type User = {
  id: number;
  member_id: string;
  name: string;
  phone: string;
  role: 'admin' | 'member';
  profile_pic?: string;
  status?: 'active' | 'inactive' | 'pending';
  created_at?: string;
};

type Payment = {
  id: number;
  user_id: number;
  user_name?: string;
  user_phone?: string;
  amount: number;
  month: string;
  method: string;
  transaction_id: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
};

type Transaction = {
  id: number;
  type: 'income' | 'expense';
  description: string;
  amount: number;
  user_id?: number;
  user_name?: string;
  member_id?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
};

type SliderImage = {
  id: number;
  url: string;
};

type Settings = {
  bkash_number: string;
  nagad_number: string;
  admin_phone: string;
  admin_name?: string;
  admin_profile_pic?: string;
};

function ImageSlider({ images }: { images: SliderImage[] }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [images]);

  if (images.length === 0) return null;

  return (
    <div className="relative h-48 sm:h-64 rounded-3xl overflow-hidden mb-8 shadow-lg group">
      <AnimatePresence mode="wait">
        <motion.div
          key={images[current].id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0"
        >
          <img 
            src={images[current].url} 
            className="w-full h-full object-cover"
            alt={`Slide ${current}`}
            referrerPolicy="no-referrer"
          />
        </motion.div>
      </AnimatePresence>
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-8">
        <div>
          <h2 className="text-3xl font-bold text-white mb-1">বাগদেবী সংঘ, বহরপুর</h2>
          <p className="text-white/80">ফান্ড ম্যানেজমেন্ট সিস্টেম</p>
        </div>
      </div>
      {images.length > 1 && (
        <div className="absolute bottom-4 right-8 flex gap-2">
          {images.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrent(idx)}
              className={`w-2 h-2 rounded-full transition-all ${idx === current ? 'bg-white w-6' : 'bg-white/40'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'login' | 'register' | 'dashboard' | 'forgot-password'>('login');
  const [settings, setSettings] = useState<Settings | null>(null);
  const [sliderImages, setSliderImages] = useState<SliderImage[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setView('dashboard');
    }
    fetchSettings();
    fetchSliderImages();
  }, []);

  const fetchSettings = async () => {
    const res = await fetch(API_BASE + '/api/settings');
    const data = await res.json();
    setSettings(data);
  };

  const fetchSliderImages = async () => {
    const res = await fetch(API_BASE + '/api/slider-images');
    const data = await res.json();
    setSliderImages(data);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setView('login');
  };

  if (view === 'login' || view === 'register' || view === 'forgot-password') {
    return <AuthView setView={setView} setUser={setUser} view={view} />;
  }

  if (user?.role === 'admin') {
    return <AdminDashboard user={user} onLogout={handleLogout} settings={settings} onSettingsUpdate={fetchSettings} sliderImages={sliderImages} onSliderUpdate={fetchSliderImages} />;
  }

  return <MemberDashboard user={user!} onLogout={handleLogout} settings={settings} sliderImages={sliderImages} />;
}

const LOGO_URL = "https://i.ibb.co.com/3QpQ41P/Whats-App-Image-2026-03-03-at-10-33-14-PM.jpg"; // Replace this with your actual image link
const API_BASE = window.location.origin.includes('localhost') && !window.location.port 
  ? 'https://ais-dev-a5pcinx3dt7xeqccnwahce-252051446105.asia-east1.run.app' 
  : window.location.origin;

function AuthView({ setView, setUser, view }: { setView: any, setUser: any, view: string }) {
  const [formData, setFormData] = useState({ name: '', phone: '', password: '', newPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (view === 'forgot-password') {
      if (step === 1) {
        const res = await fetch(API_BASE + '/api/reset-password-request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: formData.phone })
        });
        const data = await res.json();
        if (data.success) {
          setStep(2);
          alert(data.message);
        } else {
          setError(data.message);
        }
      } else {
        const res = await fetch(API_BASE + '/api/reset-password-confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: formData.phone, newPassword: formData.newPassword })
        });
        const data = await res.json();
        if (data.success) {
          setView('login');
          alert('পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে।');
        } else {
          setError(data.message);
        }
      }
      return;
    }

    const endpoint = view === 'login' ? '/api/login' : '/api/register';
    
    try {
      const res = await fetch(API_BASE + endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      
      if (data.success) {
        if (view === 'login') {
          setUser(data.user);
          localStorage.setItem('user', JSON.stringify(data.user));
          setView('dashboard');
        } else {
          setView('login');
          alert('নিবন্ধন সফল হয়েছে! এখন লগইন করুন।');
        }
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('কিছু একটা ভুল হয়েছে');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-neutral-100"
      >
        <div className="p-8">
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg border border-neutral-100 overflow-hidden">
              <img src={LOGO_URL} alt="Logo" className="w-full h-full object-contain p-1" referrerPolicy="no-referrer" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-center text-neutral-900 mb-2">
            {view === 'login' ? 'স্বাগতম' : view === 'register' ? 'সদস্য নিবন্ধন' : 'পাসওয়ার্ড রিসেট'}
          </h2>
          <p className="text-center text-neutral-500 mb-8">
            {view === 'login' ? 'বাগদেবী সংঘ, বহরপুর ফান্ড ম্যানেজমেন্ট' : 
             view === 'register' ? 'ফান্ডে যুক্ত হতে আপনার তথ্য দিন' : 
             'আপনার ফোন নম্বর দিয়ে পাসওয়ার্ড রিসেট করুন'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {view === 'register' && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">নাম</label>
                <input 
                  type="text" 
                  required
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  placeholder="আপনার নাম"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                {view === 'login' ? 'ফোন নম্বর বা সদস্য আইডি' : 'ফোন নম্বর'}
              </label>
              <input 
                type="text" 
                required
                disabled={view === 'forgot-password' && step === 2}
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all disabled:bg-neutral-50"
                placeholder={view === 'login' ? "01XXXXXXXXX বা BS-001" : "01XXXXXXXXX"}
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
              />
            </div>

            {view === 'forgot-password' && step === 2 && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">নতুন পাসওয়ার্ড</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    placeholder="••••••••"
                    value={formData.newPassword}
                    onChange={e => setFormData({...formData, newPassword: e.target.value})}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-emerald-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            )}

            {view !== 'forgot-password' && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">পাসওয়ার্ড</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-emerald-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            )}

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button 
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition-colors shadow-lg shadow-emerald-200"
            >
              {view === 'login' ? 'লগইন করুন' : 
               view === 'register' ? 'নিবন্ধন করুন' : 
               step === 1 ? 'কোড পাঠান' : 'পাসওয়ার্ড পরিবর্তন করুন'}
            </button>
          </form>

          <div className="mt-6 space-y-3 text-center">
            {view === 'login' && (
              <button 
                onClick={() => setView('forgot-password')}
                className="block w-full text-sm text-neutral-500 hover:text-emerald-600 transition-colors"
              >
                পাসওয়ার্ড ভুলে গেছেন?
              </button>
            )}
            <button 
              onClick={() => {
                setView(view === 'login' ? 'register' : 'login');
                setStep(1);
              }}
              className="text-emerald-600 font-medium hover:underline"
            >
              {view === 'login' ? 'নতুন একাউন্ট খুলুন' : 'আগের একাউন্ট আছে? লগইন করুন'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function AdminDashboard({ user, onLogout, settings, onSettingsUpdate, sliderImages, onSliderUpdate }: { user: User, onLogout: () => void, settings: Settings | null, onSettingsUpdate: () => void, sliderImages: SliderImage[], onSliderUpdate: () => void }) {
  const [members, setMembers] = useState<any[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [memberManagement, setMemberManagement] = useState<{ pending: any[], deactivationRequests: any[], inactive: any[] }>({ pending: [], deactivationRequests: [], inactive: [] });
  const [showSettings, setShowSettings] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showMemberList, setShowMemberList] = useState(false);
  const [memberFilter, setMemberFilter] = useState('');
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [searchedMember, setSearchedMember] = useState<any>(null);
  const [searchId, setSearchId] = useState('');
  const [showPronamiRequestsModal, setShowPronamiRequestsModal] = useState(false);
  const [showTransactionRequestsModal, setShowTransactionRequestsModal] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [financeDetail, setFinanceDetail] = useState<{ show: boolean, type: 'total' | 'subscription' | 'other' | 'expense' | null, searchQuery: string }>({ show: false, type: null, searchQuery: '' });
  const [sliderUrl, setSliderUrl] = useState('');
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMemberData, setNewMemberData] = useState({ name: '', phone: '', password: '', memberId: '' });
  const [adminFormData, setAdminFormData] = useState({
    bkash_number: settings?.bkash_number || '',
    nagad_number: settings?.nagad_number || '',
    admin_phone: settings?.admin_phone || '',
    admin_name: settings?.admin_name || '',
    admin_profile_pic: settings?.admin_profile_pic || '',
    oldPassword: '',
    newPassword: ''
  });
  const [viewingMember, setViewingMember] = useState<User | null>(null);
  const [memberLoginData, setMemberLoginData] = useState({ id: '', password: '' });
  const [isOfflineReady, setIsOfflineReady] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(() => {
        setIsOfflineReady(true);
      });
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (settings) {
      setAdminFormData(prev => ({
        ...prev,
        bkash_number: settings.bkash_number,
        nagad_number: settings.nagad_number,
        admin_phone: settings.admin_phone,
        admin_name: settings.admin_name || '',
        admin_profile_pic: settings.admin_profile_pic || ''
      }));
    }
  }, [settings]);

  const fetchData = async () => {
    const [mRes, pRes, tRes, mgmtRes] = await Promise.all([
      fetch(API_BASE + '/api/admin/members'),
      fetch(API_BASE + '/api/admin/all-payments'),
      fetch(API_BASE + '/api/admin/transactions'),
      fetch(API_BASE + '/api/admin/member-management')
    ]);
    setMembers(await mRes.json());
    setPayments(await pRes.json());
    setTransactions(await tRes.json());
    setMemberManagement(await mgmtRes.json());
  };

  const handleApproveMember = async (userId: number) => {
    await fetch(API_BASE + '/api/admin/approve-member', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    fetchData();
    alert('সদস্য একাউন্টটি সফলভাবে একটিভ করা হয়েছে।');
  };

  const handleViewMemberDetails = async (memberId: string) => {
    setFinanceDetail({ show: false, type: null, searchQuery: '' });
    setShowMembersModal(false);
    const res = await fetch(API_BASE + `/api/admin/member-search/${memberId}`);
    if (res.ok) {
      setSearchedMember(await res.json());
    }
  };

  const handleDeactivateMember = async (userId: number) => {
    const res = await fetch(API_BASE + '/api/admin/deactivate-member', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    if (res.ok) {
      fetchData();
      alert('সদস্য একাউন্টটি সফলভাবে ডিঅ্যাক্টিভ করা হয়েছে।');
    } else {
      const data = await res.json();
      alert(data.message);
    }
  };

  const handleProfilePicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      const res = await fetch(API_BASE + '/api/user/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, profilePic: base64String })
      });
      if (res.ok) {
        const updatedUser = { ...user, profile_pic: base64String };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        alert('প্রোফাইল ছবি সফলভাবে আপলোড করা হয়েছে।');
        window.location.reload();
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApprove = async (paymentId: number, status: string) => {
    await fetch(API_BASE + '/api/admin/approve-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentId, status })
    });
    fetchData();
  };

  const handleApproveTransaction = async (id: number, status: string) => {
    await fetch(API_BASE + '/api/admin/approve-transaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status })
    });
    fetchData();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      const res = await fetch(API_BASE + '/api/admin/slider-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: base64String })
      });
      if (res.ok) {
        onSliderUpdate();
        alert('ছবি সফলভাবে আপলোড করা হয়েছে।');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(API_BASE + '/api/admin/add-member', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newMemberData)
    });
    const data = await res.json();
    if (data.success) {
      setShowAddMemberModal(false);
      setNewMemberData({ name: '', phone: '', password: '', memberId: '' });
      fetchData();
      alert('সদস্য সফলভাবে যোগ করা হয়েছে।');
    } else {
      alert(data.message);
    }
  };

  const handleAddSliderImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sliderUrl) return;
    const res = await fetch(API_BASE + '/api/admin/slider-images', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: sliderUrl })
    });
    if (res.ok) {
      setSliderUrl('');
      onSliderUpdate();
    }
  };

  const handleDeleteSliderImage = async (id: number) => {
    await fetch(API_BASE + `/api/admin/slider-images/${id}`, { method: 'DELETE' });
    onSliderUpdate();
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(API_BASE + `/api/admin/member-search/${searchId}`);
    if (res.ok) {
      setSearchedMember(await res.json());
    } else {
      alert('সদস্য পাওয়া যায়নি');
      setSearchedMember(null);
    }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(API_BASE + '/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bkash_number: adminFormData.bkash_number,
        nagad_number: adminFormData.nagad_number,
        admin_phone: adminFormData.admin_phone,
        admin_name: adminFormData.admin_name,
        admin_profile_pic: adminFormData.admin_profile_pic
      })
    });
    if (res.ok) {
      onSettingsUpdate();
      alert('সেটিংস সফলভাবে আপডেট করা হয়েছে।');
    }
  };

  const handleAdminChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(API_BASE + '/api/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        oldPassword: adminFormData.oldPassword,
        newPassword: adminFormData.newPassword
      })
    });
    const data = await res.json();
    if (data.success) {
      alert('পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে।');
      setAdminFormData(prev => ({ ...prev, oldPassword: '', newPassword: '' }));
    } else {
      alert(data.message);
    }
  };

  const handleBackup = async () => {
    const res = await fetch(API_BASE + '/api/admin/backup');
    const data = await res.json();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fund_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSyncCloud = async () => {
    const res = await fetch(API_BASE + '/api/admin/sync-to-cloud', { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      alert('অভিনন্দন! আপনার সব তথ্য এখন ক্লাউডে সুরক্ষিত।');
    } else {
      alert(`ত্রুটি: ${data.message}\n\nদয়া করে নিশ্চিত করুন যে আপনি Supabase Keys সেট করেছেন।`);
    }
  };

  const handleMemberLogin = async () => {
    if (!memberLoginData.id || !memberLoginData.password) {
      alert('সদস্য আইডি এবং পাসওয়ার্ড দিন।');
      return;
    }
    const res = await fetch(API_BASE + '/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        phone: memberLoginData.id, 
        password: memberLoginData.password 
      })
    });
    const data = await res.json();
    if (data.success) {
      setViewingMember(data.user);
      setMemberLoginData({ id: '', password: '' });
    } else {
      alert(data.message);
    }
  };

  const subscriptionIncome = payments.filter(p => p.status === 'approved').reduce((acc, p) => acc + p.amount, 0);
  const otherIncome = transactions.filter(t => t.type === 'income' && t.status === 'approved').reduce((acc, t) => acc + t.amount, 0);
  const totalIncome = subscriptionIncome + otherIncome;
  const totalExpense = transactions.filter(t => t.type === 'expense' && t.status === 'approved').reduce((acc, t) => acc + t.amount, 0);
  const fundBalance = totalIncome - totalExpense;

  const getFilteredDetails = () => {
    let data: any[] = [];
    if (financeDetail.type === 'subscription') {
      data = payments.filter(p => p.status === 'approved').map(p => ({
        id: p.user_id,
        member_id: p.member_id || 'N/A',
        name: p.user_name,
        purpose: `প্রণামী (${p.month})`,
        amount: p.amount,
        date: p.created_at
      }));
    } else if (financeDetail.type === 'other') {
      data = transactions.filter(t => t.type === 'income' && t.status === 'approved').map(t => ({
        id: t.user_id,
        member_id: t.member_id || 'বাহিরাগত',
        name: t.user_name || 'N/A',
        purpose: t.description,
        amount: t.amount,
        date: t.created_at
      }));
    } else if (financeDetail.type === 'expense') {
      data = transactions.filter(t => t.type === 'expense' && t.status === 'approved').map(t => ({
        id: t.user_id,
        member_id: t.member_id || 'বাহিরাগত',
        name: t.user_name || 'N/A',
        purpose: t.description,
        amount: t.amount,
        date: t.created_at
      }));
    } else if (financeDetail.type === 'total') {
      const subs = payments.filter(p => p.status === 'approved').map(p => ({
        id: p.user_id,
        member_id: p.member_id || 'N/A',
        name: p.user_name,
        purpose: `প্রণামী (${p.month})`,
        amount: p.amount,
        date: p.created_at
      }));
      const others = transactions.filter(t => t.type === 'income' && t.status === 'approved').map(t => ({
        id: t.user_id,
        member_id: t.member_id || 'বাহিরাগত',
        name: t.user_name || 'N/A',
        purpose: t.description,
        amount: t.amount,
        date: t.created_at
      }));
      data = [...subs, ...others];
    }

    if (financeDetail.searchQuery) {
      data = data.filter(item => 
        item.member_id.toLowerCase().includes(financeDetail.searchQuery.toLowerCase()) ||
        item.name.toLowerCase().includes(financeDetail.searchQuery.toLowerCase())
      );
    }

    return data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  if (viewingMember) {
    return (
      <MemberDashboard 
        user={viewingMember} 
        onLogout={onLogout} 
        settings={settings} 
        sliderImages={sliderImages} 
        onBackToAdmin={() => setViewingMember(null)} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center overflow-hidden border border-neutral-200">
              <img src={LOGO_URL} alt="Logo" className="w-full h-full object-contain p-0.5" referrerPolicy="no-referrer" />
            </div>
            <h1 className="font-bold text-xl text-neutral-900">এডমিন প্যানেল</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            {isOfflineReady && (
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold border border-emerald-100">
                <ShieldCheck className="w-3 h-3" />
                অফলাইন মোড প্রস্তুত
              </div>
            )}
            <button 
              onClick={() => setShowSettings(true)}
              className="p-2 text-neutral-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-all"
              title="সেটিংস"
            >
              <Settings className="w-6 h-6" />
            </button>
            <div className="h-8 w-px bg-neutral-200 mx-1"></div>
            <div className="flex items-center gap-3">
              <span className="hidden sm:block text-sm font-medium text-neutral-700">{user.name}</span>
              <button onClick={onLogout} className="p-2 text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-all">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
          {/* Total Members */}
          <div className="flex flex-col gap-2">
            <button 
              onClick={() => setShowMemberList(true)}
              className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-100 text-left hover:border-blue-500 transition-all group flex-1"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-neutral-500 font-medium">মোট সদস্য</p>
                  <p className="text-xl font-bold text-neutral-900">{members.length}</p>
                </div>
              </div>
            </button>
            <button 
              onClick={() => setShowAddMemberModal(true)}
              className="bg-blue-600 text-white p-3 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              পুরানো সদস্য যোগ করুন
            </button>
          </div>

          {/* Total Income */}
          <button 
            onClick={() => setFinanceDetail({ show: true, type: 'total', searchQuery: '' })}
            className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-100 text-left hover:border-emerald-500 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-neutral-500 font-medium">মোট আয়</p>
                <p className="text-xl font-bold text-emerald-600">৳{totalIncome}</p>
              </div>
            </div>
          </button>

          {/* Pronami Income */}
          <button 
            onClick={() => setFinanceDetail({ show: true, type: 'subscription', searchQuery: '' })}
            className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-100 text-left hover:border-indigo-500 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                <CreditCard className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs text-neutral-500 font-medium">প্রণামী থেকে আয়</p>
                <p className="text-xl font-bold text-indigo-600">৳{subscriptionIncome}</p>
              </div>
            </div>
          </button>

          {/* Other Income */}
          <button 
            onClick={() => setFinanceDetail({ show: true, type: 'other', searchQuery: '' })}
            className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-100 text-left hover:border-amber-500 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                <ArrowUpCircle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-neutral-500 font-medium">অন্যান্য আয়</p>
                <p className="text-xl font-bold text-amber-600">৳{otherIncome}</p>
              </div>
            </div>
          </button>

          {/* Total Expense */}
          <button 
            onClick={() => setFinanceDetail({ show: true, type: 'expense', searchQuery: '' })}
            className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-100 text-left hover:border-red-500 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center group-hover:bg-red-100 transition-colors">
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-neutral-500 font-medium">মোট ব্যয়</p>
                <p className="text-xl font-bold text-red-600">৳{totalExpense}</p>
              </div>
            </div>
          </button>

          {/* Fund Balance */}
          <div className={`p-5 rounded-2xl shadow-lg lg:col-span-2 xl:col-span-1 transition-all duration-500 ${fundBalance >= 0 ? 'bg-emerald-600 shadow-emerald-100' : 'bg-red-600 shadow-red-100'}`}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Database className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-xs text-white/80 font-medium uppercase tracking-wider">ফান্ডের বর্তমান তহবিল ({fundBalance >= 0 ? 'লাভ' : 'ঘাটতি'})</p>
                <p className="text-2xl font-black text-white">৳{fundBalance}</p>
              </div>
            </div>
          </div>

          {/* Member Management */}
          <button 
            onClick={() => setShowPendingModal(true)}
            className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-100 text-left hover:border-blue-500 transition-all group relative overflow-hidden"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                <UserCog className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-neutral-500 font-medium">সদস্য ব্যবস্থাপনা</p>
                <p className="text-xl font-bold text-neutral-900">{memberManagement.pending.length + memberManagement.deactivationRequests.length}</p>
              </div>
            </div>
            {(memberManagement.pending.length + memberManagement.deactivationRequests.length) > 0 && (
              <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg">রিকোয়েস্ট</div>
            )}
          </button>

          {/* Pronami Requests */}
          <button 
            onClick={() => setShowPronamiRequestsModal(true)}
            className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-100 text-left hover:border-indigo-500 transition-all group relative overflow-hidden"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                <Bell className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs text-neutral-500 font-medium">প্রণামী রিকোয়েস্ট</p>
                <p className="text-xl font-bold text-neutral-900">{payments.filter(p => p.status === 'pending').length}</p>
              </div>
            </div>
            {payments.filter(p => p.status === 'pending').length > 0 && (
              <div className="absolute top-0 right-0 bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg">পেন্ডিং</div>
            )}
          </button>

          {/* Transaction Requests */}
          <button 
            onClick={() => setShowTransactionRequestsModal(true)}
            className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-100 text-left hover:border-blue-500 transition-all group relative overflow-hidden"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                <ArrowDownCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-neutral-500 font-medium">আয়/ব্যয় রিকোয়েস্ট</p>
                <p className="text-xl font-bold text-neutral-900">{transactions.filter(t => t.status === 'pending').length}</p>
              </div>
            </div>
            {transactions.filter(t => t.status === 'pending').length > 0 && (
              <div className="absolute top-0 right-0 bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg">পেন্ডিং</div>
            )}
          </button>
        </div>

        {/* Quick Actions & Backup */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-neutral-100">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <LayoutDashboard className="w-5 h-5 text-emerald-600" />
              কুইক অ্যাকশন ও ব্যাকআপ
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button 
                onClick={handleBackup}
                className="flex items-center gap-4 p-4 rounded-2xl bg-neutral-50 hover:bg-neutral-100 transition-all border border-neutral-100 group"
              >
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <Download className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-neutral-900">ব্যাকআপ ডাউনলোড</p>
                  <p className="text-xs text-neutral-500">সব তথ্য অফলাইনে সেভ করুন</p>
                </div>
              </button>
              <button 
                onClick={handleSyncCloud}
                className="flex items-center gap-4 p-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100 transition-all border border-emerald-100 group"
              >
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-emerald-900">চিরস্থায়ী সমাধান</p>
                  <p className="text-xs text-emerald-600/70">ক্লাউডে তথ্য সুরক্ষিত করুন</p>
                </div>
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-neutral-100">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <UserCog className="w-5 h-5 text-indigo-600" />
              সদস্য হিসেবে প্রবেশ
            </h3>
            <p className="text-sm text-neutral-500 mb-4">আপনার সদস্য আইডি ও পাসওয়ার্ড দিয়ে লগইন করে আপনার ব্যক্তিগত ড্যাশবোর্ডে প্রবেশ করুন।</p>
            <div className="space-y-3">
              <input 
                type="text" 
                placeholder="সদস্য আইডি বা ফোন"
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                value={memberLoginData.id}
                onChange={e => setMemberLoginData({...memberLoginData, id: e.target.value})}
              />
              <input 
                type="password" 
                placeholder="পাসওয়ার্ড"
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                value={memberLoginData.password}
                onChange={e => setMemberLoginData({...memberLoginData, password: e.target.value})}
              />
              <button 
                onClick={handleMemberLogin}
                className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
              >
                প্রবেশ করুন
              </button>
            </div>
          </div>
        </div>

        {/* Slider Management */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-neutral-100 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-emerald-600" />
              স্লাইডার ইমেজ ম্যানেজমেন্ট
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-3">
              <label className="block text-sm font-medium text-neutral-700">গ্যালারি থেকে আপলোড</label>
              <div className="relative">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="slider-upload"
                />
                <label 
                  htmlFor="slider-upload"
                  className="flex flex-col items-center justify-center gap-2 px-4 py-8 border-2 border-dashed border-neutral-200 rounded-2xl cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 transition-all text-neutral-500 group"
                >
                  <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Plus className="w-6 h-6 text-emerald-600" />
                  </div>
                  <span className="font-medium">গ্যালারি থেকে ছবি বেছে নিন</span>
                </label>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-neutral-700">লিঙ্ক (URL) দিয়ে যোগ করুন</label>
              <form onSubmit={handleAddSliderImage} className="space-y-3">
                <input 
                  type="url" 
                  placeholder="https://..."
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={sliderUrl}
                  onChange={e => setSliderUrl(e.target.value)}
                />
                <button type="submit" className="w-full bg-neutral-900 text-white py-3 rounded-xl font-bold hover:bg-black transition-all flex items-center justify-center gap-2">
                  <Plus className="w-5 h-5" />
                  যোগ করুন
                </button>
              </form>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {sliderImages.map(img => (
              <div key={img.id} className="relative group rounded-xl overflow-hidden shadow-sm border border-neutral-100 aspect-video">
                <img src={img.url} className="w-full h-full object-cover" alt="Slider" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button 
                    onClick={() => handleDeleteSliderImage(img.id)}
                    className="bg-red-600 text-white p-2 rounded-full hover:scale-110 transition-transform"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Add Member Modal */}
      <AnimatePresence>
        {showAddMemberModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-neutral-100 flex items-center justify-between bg-neutral-50">
                <h3 className="text-xl font-bold text-neutral-900">পুরানো সদস্য যোগ করুন</h3>
                <button 
                  onClick={() => setShowAddMemberModal(false)}
                  className="p-2 hover:bg-neutral-200 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-neutral-500" />
                </button>
              </div>
              <form onSubmit={handleAddMember} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">সদস্যের নাম</label>
                  <input 
                    type="text" 
                    required
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={newMemberData.name}
                    onChange={e => setNewMemberData({...newMemberData, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">সদস্য আইডি (যেমন: BS-001)</label>
                  <input 
                    type="text" 
                    required
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={newMemberData.memberId}
                    onChange={e => setNewMemberData({...newMemberData, memberId: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">ফোন নম্বর</label>
                  <input 
                    type="tel" 
                    required
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={newMemberData.phone}
                    onChange={e => setNewMemberData({...newMemberData, phone: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">পাসওয়ার্ড</label>
                  <input 
                    type="password" 
                    required
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={newMemberData.password}
                    onChange={e => setNewMemberData({...newMemberData, password: e.target.value})}
                  />
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all">
                  সদস্য যোগ করুন
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Member List Modal */}
      <AnimatePresence>
        {showMemberList && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-neutral-100 flex items-center justify-between bg-neutral-50">
                <div>
                  <h3 className="text-xl font-bold text-neutral-900">সদস্য তালিকা</h3>
                  <p className="text-sm text-neutral-500">মোট সদস্য: {members.length}</p>
                </div>
                <button 
                  onClick={() => setShowMemberList(false)}
                  className="p-2 hover:bg-neutral-200 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-neutral-500" />
                </button>
              </div>

              <div className="p-4 bg-white border-b border-neutral-100">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input 
                    type="text" 
                    placeholder="আইডি বা নাম দিয়ে ফিল্টার করুন..."
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={memberFilter}
                    onChange={e => setMemberFilter(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {members.filter(m => 
                    m.member_id.toLowerCase().includes(memberFilter.toLowerCase()) ||
                    m.name.toLowerCase().includes(memberFilter.toLowerCase())
                  ).map(member => (
                    <div key={member.id} className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100 flex items-center gap-4 hover:bg-white hover:shadow-md transition-all group">
                      <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 font-bold">
                        {member.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-neutral-900">{member.name}</div>
                        <div className="text-xs text-emerald-600 font-mono">{member.member_id}</div>
                      </div>
                      <button 
                        onClick={() => handleViewMemberDetails(member.member_id)}
                        className="p-2 text-neutral-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {financeDetail.show && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-neutral-100 flex items-center justify-between bg-neutral-50">
                <div>
                  <h3 className="text-xl font-bold text-neutral-900">
                    {financeDetail.type === 'subscription' ? 'চাদা থেকে আয়ের বিস্তারিত' : 
                     financeDetail.type === 'other' ? 'অন্যান্য আয়ের বিস্তারিত' : 
                     financeDetail.type === 'expense' ? 'ব্যয়ের বিস্তারিত' : 
                     'মোট আয়ের বিস্তারিত'}
                  </h3>
                  <p className="text-sm text-neutral-500">ফান্ডের স্বচ্ছতার জন্য বিস্তারিত তালিকা</p>
                </div>
                <button 
                  onClick={() => setFinanceDetail({ ...financeDetail, show: false })}
                  className="p-2 hover:bg-neutral-200 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-neutral-500" />
                </button>
              </div>

              <div className="p-4 bg-white border-b border-neutral-100">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input 
                    type="text" 
                    placeholder="সদস্য আইডি বা নাম দিয়ে ফিল্টার করুন..."
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={financeDetail.searchQuery}
                    onChange={e => setFinanceDetail({ ...financeDetail, searchQuery: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-0">
                <table className="w-full text-left">
                  <thead className="bg-neutral-50 sticky top-0 border-b border-neutral-100">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase">সদস্য</th>
                      <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase">বিবরণ/উদ্দেশ্য</th>
                      <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase">পরিমাণ</th>
                      <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase">তারিখ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {getFilteredDetails().length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-neutral-500">কোনো তথ্য পাওয়া যায়নি</td>
                      </tr>
                    ) : (
                      getFilteredDetails().map((item, idx) => (
                        <tr key={idx} className="hover:bg-neutral-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-bold text-neutral-900">{item.name}</div>
                            <div className="text-xs font-mono text-emerald-600">{item.member_id}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-neutral-600">{item.purpose}</td>
                          <td className="px-6 py-4">
                            <span className={`font-bold ${financeDetail.type === 'expense' ? 'text-red-600' : 'text-emerald-600'}`}>
                              {financeDetail.type === 'expense' ? '-' : '+'} ৳{item.amount}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs text-neutral-500">
                            {new Date(item.date).toLocaleDateString('bn-BD')}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="p-6 bg-neutral-50 border-t border-neutral-100 flex justify-between items-center">
                <div className="text-sm text-neutral-500">মোট এন্ট্রি: {getFilteredDetails().length}টি</div>
                <div className="text-lg font-bold text-neutral-900">
                  মোট: ৳{getFilteredDetails().reduce((acc, curr) => acc + curr.amount, 0)}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Member Management Modal */}
      <AnimatePresence>
        {showPendingModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-neutral-100 flex items-center justify-between bg-neutral-50">
                <h3 className="text-xl font-bold text-neutral-900">সদস্য ব্যবস্থাপনা</h3>
                <button 
                  onClick={() => setShowPendingModal(false)}
                  className="p-2 hover:bg-neutral-200 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-neutral-500" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Member Approvals */}
                <section>
                  <h4 className="font-bold text-blue-600 mb-4 flex items-center gap-2">
                    <UserPlus className="w-5 h-5" />
                    সদস্য অ্যাপ্রুভাল ({memberManagement.pending.length})
                  </h4>
                  <div className="overflow-x-auto border border-neutral-100 rounded-2xl">
                    <table className="w-full">
                      <thead className="bg-neutral-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-bold text-neutral-500">নাম</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-neutral-500">ফোন</th>
                          <th className="px-4 py-3 text-right text-xs font-bold text-neutral-500">অ্যাকশন</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {memberManagement.pending.map(m => (
                          <tr key={m.id}>
                            <td className="px-4 py-3 font-bold text-sm">{m.name}</td>
                            <td className="px-4 py-3 text-xs">{m.phone}</td>
                            <td className="px-4 py-3 text-right">
                              <button onClick={() => handleApproveMember(m.id)} className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold">একটিভ করুন</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* Deactivation Requests */}
                <section>
                  <h4 className="font-bold text-red-600 mb-4 flex items-center gap-2">
                    <UserMinus className="w-5 h-5" />
                    ডিঅ্যাক্টিভেশন রিকোয়েস্ট ({memberManagement.deactivationRequests.length})
                  </h4>
                  <div className="overflow-x-auto border border-neutral-100 rounded-2xl">
                    <table className="w-full">
                      <thead className="bg-neutral-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-bold text-neutral-500">নাম</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-neutral-500">ফোন</th>
                          <th className="px-4 py-3 text-right text-xs font-bold text-neutral-500">অ্যাকশন</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {memberManagement.deactivationRequests.map(m => (
                          <tr key={m.id}>
                            <td className="px-4 py-3 font-bold text-sm">{m.name}</td>
                            <td className="px-4 py-3 text-xs">{m.phone}</td>
                            <td className="px-4 py-3 text-right">
                              <button onClick={() => handleDeactivateMember(m.id)} className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold">ডিঅ্যাক্টিভ করুন</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* Inactive Members */}
                <section>
                  <h4 className="font-bold text-neutral-500 mb-4 flex items-center gap-2">
                    <UserX className="w-5 h-5" />
                    ডিঅ্যাক্টিভ সদস্য ({memberManagement.inactive.length})
                  </h4>
                  <div className="overflow-x-auto border border-neutral-100 rounded-2xl">
                    <table className="w-full">
                      <thead className="bg-neutral-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-bold text-neutral-500">নাম</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-neutral-500">ফোন</th>
                          <th className="px-4 py-3 text-right text-xs font-bold text-neutral-500">অ্যাকশন</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {memberManagement.inactive.map(m => (
                          <tr key={m.id}>
                            <td className="px-4 py-3 font-bold text-sm">{m.name}</td>
                            <td className="px-4 py-3 text-xs">{m.phone}</td>
                            <td className="px-4 py-3 text-right">
                              <button onClick={() => handleApproveMember(m.id)} className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold">পুনরায় একটিভ করুন</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Pronami Requests Modal */}
      <AnimatePresence>
        {showPronamiRequestsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-neutral-100 flex items-center justify-between bg-neutral-50">
                <h3 className="text-xl font-bold text-neutral-900">পেন্ডিং প্রণামী রিকোয়েস্ট</h3>
                <button 
                  onClick={() => setShowPronamiRequestsModal(false)}
                  className="p-2 hover:bg-neutral-200 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-neutral-500" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <div className="overflow-x-auto border border-neutral-100 rounded-2xl">
                  <table className="w-full">
                    <thead className="bg-neutral-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-neutral-500">সদস্য</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-neutral-500">মাস/পরিমাণ</th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-neutral-500">অ্যাকশন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {payments.filter(p => p.status === 'pending').length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-4 py-8 text-center text-neutral-500">কোনো পেন্ডিং প্রণামী নেই</td>
                        </tr>
                      ) : (
                        payments.filter(p => p.status === 'pending').map(p => (
                          <tr key={p.id}>
                            <td className="px-4 py-3">
                              <div className="font-bold text-sm">{p.user_name}</div>
                              <div className="text-[10px] font-mono text-emerald-600">{p.member_id}</div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-xs">{p.month}</div>
                              <div className="font-bold text-emerald-600">৳{p.amount}</div>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex justify-end gap-2">
                                <button onClick={() => handleApprove(p.id, 'approved')} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"><CheckCircle2 className="w-5 h-5" /></button>
                                <button onClick={() => handleApprove(p.id, 'rejected')} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><XCircle className="w-5 h-5" /></button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Transaction Requests Modal */}
      <AnimatePresence>
        {showTransactionRequestsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-neutral-100 flex items-center justify-between bg-neutral-50">
                <h3 className="text-xl font-bold text-neutral-900">পেন্ডিং আয়/ব্যয় রিকোয়েস্ট</h3>
                <button 
                  onClick={() => setShowTransactionRequestsModal(false)}
                  className="p-2 hover:bg-neutral-200 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-neutral-500" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <div className="overflow-x-auto border border-neutral-100 rounded-2xl">
                  <table className="w-full">
                    <thead className="bg-neutral-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-neutral-500">বিবরণ</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-neutral-500">ধরণ/পরিমাণ</th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-neutral-500">অ্যাকশন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {transactions.filter(t => t.status === 'pending').length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-4 py-8 text-center text-neutral-500">কোনো পেন্ডিং রিকোয়েস্ট নেই</td>
                        </tr>
                      ) : (
                        transactions.filter(t => t.status === 'pending').map(t => (
                          <tr key={t.id}>
                            <td className="px-4 py-3">
                              <div className="font-bold text-sm">{t.description}</div>
                              <div className="text-[10px] text-neutral-500">সদস্য: {t.user_name}</div>
                            </td>
                            <td className="px-4 py-3">
                              <div className={`text-[10px] font-bold uppercase ${t.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                                {t.type === 'income' ? 'আয়' : 'ব্যয়'}
                              </div>
                              <div className="font-bold">৳{t.amount}</div>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex justify-end gap-2">
                                <button onClick={() => handleApproveTransaction(t.id, 'approved')} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"><CheckCircle2 className="w-5 h-5" /></button>
                                <button onClick={() => handleApproveTransaction(t.id, 'rejected')} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><XCircle className="w-5 h-5" /></button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-neutral-100 flex items-center justify-between bg-neutral-50">
                <h3 className="text-xl font-bold text-neutral-900">এডমিন সেটিংস</h3>
                <button 
                  onClick={() => setShowSettings(false)}
                  className="p-2 hover:bg-neutral-200 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-neutral-500" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-12">
                {/* Admin Profile */}
                <section>
                  <h4 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <UserIcon className="w-5 h-5 text-emerald-600" />
                    এডমিন প্রোফাইল
                  </h4>
                  <div className="flex items-center gap-6 mb-8">
                    <div className="relative group">
                      <div className="w-24 h-24 rounded-2xl overflow-hidden bg-neutral-100 border-2 border-emerald-200">
                        <img 
                          src={adminFormData.admin_profile_pic || `https://api.dicebear.com/7.x/avataaars/svg?seed=admin`} 
                          className="w-full h-full object-cover"
                          alt="Admin"
                        />
                      </div>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleProfilePicUpload}
                        className="hidden"
                        id="admin-pic-upload"
                      />
                      <label 
                        htmlFor="admin-pic-upload"
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer rounded-2xl"
                      >
                        <Camera className="w-6 h-6 text-white" />
                      </label>
                    </div>
                    <div className="flex-1 space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">এডমিন নাম</label>
                        <input 
                          type="text" 
                          className="w-full px-4 py-2 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                          value={adminFormData.admin_name}
                          onChange={e => setAdminFormData({...adminFormData, admin_name: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">এডমিন ফোন</label>
                        <input 
                          type="tel" 
                          className="w-full px-4 py-2 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                          value={adminFormData.admin_phone}
                          onChange={e => setAdminFormData({...adminFormData, admin_phone: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                </section>

                {/* Payment Methods */}
                <section>
                  <h4 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-emerald-600" />
                    পেমেন্ট মেথড
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">বিকাশ নম্বর</label>
                      <input 
                        type="tel" 
                        className="w-full px-4 py-2 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                        value={adminFormData.bkash_number}
                        onChange={e => setAdminFormData({...adminFormData, bkash_number: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">নগদ নম্বর</label>
                      <input 
                        type="tel" 
                        className="w-full px-4 py-2 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                        value={adminFormData.nagad_number}
                        onChange={e => setAdminFormData({...adminFormData, nagad_number: e.target.value})}
                      />
                    </div>
                  </div>
                </section>

                <button 
                  onClick={handleUpdateSettings}
                  className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
                >
                  সেটিংস সেভ করুন
                </button>

                {/* Password Change */}
                <section className="pt-8 border-t border-neutral-100">
                  <h4 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    পাসওয়ার্ড পরিবর্তন
                  </h4>
                  <form onSubmit={handleAdminChangePassword} className="space-y-4">
                    <input 
                      type="password" 
                      placeholder="পুরানো পাসওয়ার্ড"
                      className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                      value={adminFormData.oldPassword}
                      onChange={e => setAdminFormData({...adminFormData, oldPassword: e.target.value})}
                    />
                    <input 
                      type="password" 
                      placeholder="নতুন পাসওয়ার্ড"
                      className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                      value={adminFormData.newPassword}
                      onChange={e => setAdminFormData({...adminFormData, newPassword: e.target.value})}
                    />
                    <button type="submit" className="w-full bg-neutral-900 text-white font-bold py-3 rounded-xl hover:bg-black transition-all">পাসওয়ার্ড আপডেট করুন</button>
                  </form>
                </section>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Member Details Modal */}
      <AnimatePresence>
        {searchedMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-neutral-100 flex items-center justify-between bg-neutral-50">
                <h3 className="text-xl font-bold text-neutral-900">সদস্য বিস্তারিত</h3>
                <button 
                  onClick={() => setSearchedMember(null)}
                  className="p-2 hover:bg-neutral-200 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-neutral-500" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8">
                <div className="flex items-center gap-6 mb-12 bg-emerald-50 p-8 rounded-3xl border border-emerald-100">
                  <div className="w-32 h-32 rounded-2xl overflow-hidden bg-white border-2 border-emerald-200 shadow-sm">
                    <img 
                      src={searchedMember.user.profile_pic || `https://api.dicebear.com/7.x/avataaars/svg?seed=${searchedMember.user.phone}`} 
                      className="w-full h-full object-cover"
                      alt="Profile"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-3xl font-bold text-emerald-900 mb-1">{searchedMember.user.name}</h3>
                    <div className="flex items-center gap-4 text-emerald-600 font-mono mb-4">
                      <span>ID: {searchedMember.user.member_id}</span>
                      <span>•</span>
                      <span>{searchedMember.user.phone}</span>
                    </div>
                    <div className="flex gap-3">
                      <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase ${searchedMember.user.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {searchedMember.user.status === 'active' ? 'একটিভ' : 'ডিএকটিভ'}
                      </span>
                      {searchedMember.user.status === 'inactive' ? (
                        <button 
                          onClick={() => handleApproveMember(searchedMember.user.id)}
                          className="bg-emerald-600 text-white px-4 py-1.5 rounded-full text-xs font-bold hover:bg-emerald-700 transition-all"
                        >
                          পুনরায় একটিভ করুন
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleDeactivateMember(searchedMember.user.id)}
                          className="bg-red-600 text-white px-4 py-1.5 rounded-full text-xs font-bold hover:bg-red-700 transition-all"
                        >
                          ডিএকটিভ করুন
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Financial Summary for Member */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                    <p className="text-[10px] text-emerald-600 font-bold uppercase mb-1">মোট প্রণামী</p>
                    <p className="text-xl font-bold text-emerald-900">৳{searchedMember.payments.filter((p: any) => p.status === 'approved').reduce((acc: number, p: any) => acc + p.amount, 0)}</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                    <p className="text-[10px] text-blue-600 font-bold uppercase mb-1">মোট আয়</p>
                    <p className="text-xl font-bold text-blue-900">৳{searchedMember.contributions.filter((c: any) => c.type === 'income').reduce((acc: number, c: any) => acc + c.amount, 0)}</p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
                    <p className="text-[10px] text-red-600 font-bold uppercase mb-1">মোট ব্যয়</p>
                    <p className="text-xl font-bold text-red-900">৳{searchedMember.contributions.filter((c: any) => c.type === 'expense').reduce((acc: number, c: any) => acc + c.amount, 0)}</p>
                  </div>
                  <div className="bg-neutral-900 p-4 rounded-2xl border border-neutral-800">
                    <p className="text-[10px] text-neutral-400 font-bold uppercase mb-1">নীট অবদান</p>
                    <p className="text-xl font-bold text-white">৳{
                      searchedMember.payments.filter((p: any) => p.status === 'approved').reduce((acc: number, p: any) => acc + p.amount, 0) +
                      searchedMember.contributions.filter((c: any) => c.type === 'income').reduce((acc: number, c: any) => acc + c.amount, 0) -
                      searchedMember.contributions.filter((c: any) => c.type === 'expense').reduce((acc: number, c: any) => acc + c.amount, 0)
                    }</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm">
                    <h4 className="font-bold mb-6 flex items-center gap-2 text-emerald-600">
                      <CreditCard className="w-5 h-5" />
                      প্রণাম পেমেন্ট হিস্ট্রি
                    </h4>
                    <div className="space-y-3">
                      {searchedMember.payments.length === 0 ? (
                        <div className="text-center py-8 text-neutral-400 text-sm italic">কোনো পেমেন্ট পাওয়া যায়নি</div>
                      ) : (
                        searchedMember.payments.map((p: any) => (
                          <div key={p.id} className="flex justify-between items-center p-4 bg-neutral-50 rounded-2xl text-sm border border-neutral-100">
                            <div>
                              <div className="font-bold text-neutral-900">{p.month}</div>
                              <div className="text-[10px] text-neutral-500 uppercase">{p.method} • {p.transaction_id}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-emerald-600">৳{p.amount}</div>
                              <div className={`text-[10px] font-bold ${p.status === 'approved' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                {p.status === 'approved' ? 'অনুমোদিত' : 'পেন্ডিং'}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm">
                    <h4 className="font-bold mb-6 flex items-center gap-2 text-blue-600">
                      <TrendingUp className="w-5 h-5" />
                      অন্যান্য অবদান
                    </h4>
                    <div className="space-y-3">
                      {searchedMember.contributions.length === 0 ? (
                        <div className="text-center py-8 text-neutral-400 text-sm italic">কোনো অবদান পাওয়া যায়নি</div>
                      ) : (
                        searchedMember.contributions.map((c: any) => (
                          <div key={c.id} className="flex justify-between items-center p-4 bg-neutral-50 rounded-2xl text-sm border border-neutral-100">
                            <div className="flex-1 mr-4">
                              <div className="font-bold text-neutral-900 truncate">{c.description}</div>
                              <div className="text-[10px] text-neutral-500">{new Date(c.created_at).toLocaleDateString('bn-BD')}</div>
                            </div>
                            <div className="font-bold text-blue-600">৳{c.amount}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MemberDashboard({ user, onLogout, settings, sliderImages, onBackToAdmin }: { user: User, onLogout: () => void, settings: Settings | null, sliderImages: SliderImage[], onBackToAdmin?: () => void }) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [financeDetail, setFinanceDetail] = useState<{ show: boolean, type: 'pronami' | 'income' | 'expense' | 'net' | null }>({ show: false, type: null });
  const [passwordData, setPasswordData] = useState({ oldPassword: '', newPassword: '' });
  const [profilePic, setProfilePic] = useState(user.profile_pic || '');
  const [fundBalance, setFundBalance] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isOfflineReady, setIsOfflineReady] = useState(false);
  const [pendingSync, setPendingSync] = useState<{type: 'payment' | 'transaction', data: any}[]>(() => {
    const saved = localStorage.getItem(`pending_sync_${user.id}`);
    return saved ? JSON.parse(saved) : [];
  });
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(() => {
        setIsOfflineReady(true);
      });
    }
  }, []);

  const [formData, setFormData] = useState({
    amount: 100,
    month: new Date().toISOString().slice(0, 7),
    method: 'bkash',
    transactionId: ''
  });
  const [transactionFormData, setTransactionFormData] = useState({
    type: 'income',
    description: '',
    amount: 0
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    if (isOnline) {
      fetchData();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(`pending_sync_${user.id}`, JSON.stringify(pendingSync));
    if (isOnline && pendingSync.length > 0 && !isSyncing) {
      syncData();
    }
  }, [pendingSync, isOnline]);

  const fetchData = async () => {
    try {
      const [pRes, tRes, bRes] = await Promise.all([
        fetch(API_BASE + `/api/payments/${user.id}`),
        fetch(API_BASE + '/api/transactions'),
        fetch(API_BASE + '/api/fund-balance')
      ]);
      if (pRes.ok) setPayments(await pRes.json());
      if (tRes.ok) setTransactions(await tRes.json());
      if (bRes.ok) {
        const balanceData = await bRes.json();
        setFundBalance(balanceData.balance);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    }
  };

  const syncData = async () => {
    setIsSyncing(true);
    const remaining = [...pendingSync];
    const toSync = remaining.splice(0, remaining.length);
    
    for (const item of toSync) {
      try {
        const url = item.type === 'payment' ? '/api/payments' : '/api/transactions';
        const res = await fetch(API_BASE + url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...item.data, userId: user.id })
        });
        if (!res.ok) {
          remaining.push(item);
        }
      } catch (err) {
        remaining.push(item);
        break;
      }
    }
    
    setPendingSync(remaining);
    setIsSyncing(false);
    if (remaining.length === 0) {
      fetchData();
    }
  };

  const totalPronami = payments.filter(p => p.status === 'approved').reduce((acc, p) => acc + p.amount, 0);
  const userTransactions = transactions.filter(t => t.user_id === user.id && t.status === 'approved');
  const totalIncome = userTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = userTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const netContribution = totalIncome - totalExpense + totalPronami;

  const getOutstandingMonths = () => {
    if (!user.created_at) return [];
    const start = new Date(user.created_at);
    const end = new Date();
    const months = [];
    let current = new Date(start.getFullYear(), start.getMonth(), 1);
    
    while (current <= end) {
      const monthStr = current.toISOString().slice(0, 7);
      const isPaid = payments.some(p => p.month === monthStr && p.status === 'approved');
      if (!isPaid) {
        months.push(current.toLocaleDateString('bn-BD', { month: 'long', year: 'numeric' }));
      }
      current.setMonth(current.getMonth() + 1);
    }
    return months;
  };

  const outstandingMonths = getOutstandingMonths();

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOnline) {
      setPendingSync(prev => [...prev, { type: 'payment', data: formData }]);
      setShowPaymentModal(false);
      setFormData({ ...formData, transactionId: '' });
      alert('আপনি অফলাইনে আছেন। আপনার তথ্যটি ফোনে সেভ করা হয়েছে। ইন্টারনেট আসলে এটি অটোমেটিক সার্ভারে জমা হবে।');
      return;
    }
    const res = await fetch(API_BASE + '/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formData, userId: user.id })
    });
    if (res.ok) {
      setShowPaymentModal(false);
      setFormData({ ...formData, transactionId: '' });
      fetchData();
      alert('প্রণামী রিকোয়েস্ট পাঠানো হয়েছে। এডমিন অ্যাপ্রুভ করলে আপনি দেখতে পাবেন।');
    }
  };

  const handleTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOnline) {
      setPendingSync(prev => [...prev, { type: 'transaction', data: transactionFormData }]);
      setShowTransactionModal(false);
      setTransactionFormData({ type: 'income', description: '', amount: 0 });
      alert('আপনি অফলাইনে আছেন। আপনার তথ্যটি ফোনে সেভ করা হয়েছে। ইন্টারনেট আসলে এটি অটোমেটিক সার্ভারে জমা হবে।');
      return;
    }
    const res = await fetch(API_BASE + '/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...transactionFormData, userId: user.id })
    });
    if (res.ok) {
      setShowTransactionModal(false);
      setTransactionFormData({ type: 'income', description: '', amount: 0 });
      fetchData();
      alert('আয়/ব্যয় রিকোয়েস্ট পাঠানো হয়েছে। এডমিন অ্যাপ্রুভ করলে স্বচ্ছতা ট্যাবে দেখা যাবে।');
    }
  };

  const handleProfilePicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      const res = await fetch(API_BASE + '/api/user/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, profilePic: base64String })
      });
      if (res.ok) {
        setProfilePic(base64String);
        const updatedUser = { ...user, profile_pic: base64String };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        alert('প্রোফাইল ছবি সফলভাবে আপলোড করা হয়েছে।');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRequestDeactivation = async () => {
    if (!confirm('আপনি কি নিশ্চিত যে আপনি একাউন্ট ডিঅ্যাক্টিভ করার প্রস্তাব পাঠাতে চান? এরপর এডমিন চাইলে আপনার একাউন্টটি বন্ধ করে দিতে পারবেন।')) return;
    
    const res = await fetch(API_BASE + '/api/user/request-deactivation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id })
    });
    if (res.ok) {
      alert('ডিঅ্যাক্টিভেশন প্রস্তাব পাঠানো হয়েছে। এডমিন এটি পর্যালোচনা করবেন।');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(API_BASE + '/api/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword
      })
    });
    const data = await res.json();
    if (data.success) {
      alert('পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে।');
      setPasswordData({ oldPassword: '', newPassword: '' });
    } else {
      alert(data.message);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center overflow-hidden border border-neutral-200">
              <img src={LOGO_URL} alt="Logo" className="w-full h-full object-contain p-0.5" referrerPolicy="no-referrer" />
            </div>
            <h1 className="font-bold text-xl text-neutral-900">সদস্য ড্যাশবোর্ড</h1>
          </div>
          <div className="flex items-center gap-2">
            {isOfflineReady && isOnline && (
              <div className="hidden sm:flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-bold">
                <ShieldCheck className="w-3 h-3" />
                অফলাইন মোড প্রস্তুত
              </div>
            )}
            {!isOnline && (
              <div className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 rounded-lg text-[10px] font-bold">
                <WifiOff className="w-3 h-3" />
                অফলাইন
              </div>
            )}
            {pendingSync.length > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-bold animate-pulse">
                <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                {pendingSync.length} টি পেন্ডিং
              </div>
            )}
            {onBackToAdmin && (
              <button 
                onClick={onBackToAdmin}
                className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                এডমিন প্যানেল
              </button>
            )}
            <button 
              onClick={() => setShowSettings(true)}
              className="p-2 text-neutral-500 hover:bg-neutral-100 rounded-full transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button onClick={onLogout} className="p-2 text-neutral-500 hover:text-red-600 transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Slider */}
        <ImageSlider images={sliderImages} />

        {/* Outstanding Months Alert */}
        {outstandingMonths.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-4"
          >
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h4 className="font-bold text-amber-900">বকেয়া প্রণামী</h4>
              <p className="text-sm text-amber-700">আপনার নিচের মাসগুলোর প্রণামী বকেয়া রয়েছে: <span className="font-bold">{outstandingMonths.join(', ')}</span></p>
            </div>
          </motion.div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <button 
            onClick={() => setFinanceDetail({ show: true, type: 'pronami' })}
            className="bg-white p-6 rounded-3xl shadow-sm border border-neutral-100 text-left hover:border-emerald-500 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                <CreditCard className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-neutral-500 font-medium">মোট প্রণামী</p>
                <p className="text-2xl font-bold text-emerald-600">৳{totalPronami}</p>
              </div>
            </div>
          </button>

          <button 
            onClick={() => setFinanceDetail({ show: true, type: 'income' })}
            className="bg-white p-6 rounded-3xl shadow-sm border border-neutral-100 text-left hover:border-blue-500 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-neutral-500 font-medium">মোট আয় করে দিয়েছেন</p>
                <p className="text-2xl font-bold text-blue-600">৳{totalIncome}</p>
              </div>
            </div>
          </button>

          <button 
            onClick={() => setFinanceDetail({ show: true, type: 'expense' })}
            className="bg-white p-6 rounded-3xl shadow-sm border border-neutral-100 text-left hover:border-red-500 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center group-hover:bg-red-100 transition-colors">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-neutral-500 font-medium">মোট ব্যয় করেছেন</p>
                <p className="text-2xl font-bold text-red-600">৳{totalExpense}</p>
              </div>
            </div>
          </button>

          <div className={`p-6 rounded-3xl shadow-lg border text-left transition-all duration-500 ${fundBalance >= 0 ? 'bg-emerald-600 border-emerald-500 shadow-emerald-100' : 'bg-red-600 border-red-500 shadow-red-100'}`}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <Database className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-xs text-white/80 font-medium uppercase tracking-wider">ফান্ডের বর্তমান তহবিল ({fundBalance >= 0 ? 'লাভ' : 'ঘাটতি'})</p>
                <p className="text-2xl font-black text-white">৳{fundBalance}</p>
              </div>
            </div>
          </div>

          <div className={`p-6 rounded-3xl shadow-lg border text-left ${netContribution >= 0 ? 'bg-emerald-600 border-emerald-500 shadow-emerald-100' : 'bg-red-600 border-red-500 shadow-red-100'}`}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <UserIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-xs text-white/80 font-medium uppercase tracking-wider">আপনার নীট অবদান ({netContribution >= 0 ? 'লাভ' : 'লস'})</p>
                <p className="text-2xl font-black text-white">৳{Math.abs(netContribution)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Profile & Actions */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-neutral-100 flex flex-col items-center text-center">
              <div className="relative group mb-4">
                <div className="w-24 h-24 rounded-2xl overflow-hidden bg-neutral-100 border-2 border-emerald-100">
                  <img 
                    src={profilePic || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.phone}`} 
                    className="w-full h-full object-cover"
                    alt="Profile"
                  />
                </div>
              </div>
              <h3 className="text-xl font-bold text-neutral-900">{user.name}</h3>
              <p className="text-emerald-600 font-mono text-sm font-bold">{user.member_id}</p>
              <p className="text-neutral-500 text-sm">{user.phone}</p>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-neutral-100">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-600" />
                প্রণামী প্রদান
              </h3>
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 space-y-3">
                  <div>
                    <p className="text-[10px] text-emerald-600 font-bold uppercase">বিকাশ নম্বর</p>
                    <p className="text-lg font-bold text-emerald-900">{settings?.bkash_number || '017XXXXXXXX'}</p>
                  </div>
                  <div className="pt-2 border-t border-emerald-100">
                    <p className="text-[10px] text-emerald-600 font-bold uppercase">নগদ নম্বর</p>
                    <p className="text-lg font-bold text-emerald-900">{settings?.nagad_number || '018XXXXXXXX'}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowPaymentModal(true)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  নতুন প্রণামী যোগ করুন
                </button>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-neutral-100">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                আয়/ব্যয় যোগ করুন
              </h3>
              <p className="text-xs text-neutral-500 mb-4">ফান্ডের স্বচ্ছতার জন্য যেকোনো আয় বা ব্যয় এখানে যোগ করুন। এডমিন তা যাচাই করে অনুমোদন করবেন।</p>
              <button 
                onClick={() => setShowTransactionModal(true)}
                className="w-full bg-neutral-900 hover:bg-black text-white font-semibold py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                আয়/ব্যয় এন্ট্রি দিন
              </button>
            </div>

            {/* Admin Contact Info */}
            <div className="bg-emerald-900 text-white p-6 rounded-3xl shadow-xl border border-emerald-800">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <UserCog className="w-5 h-5 text-emerald-400" />
                এডমিন যোগাযোগ
              </h3>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white/10 border border-white/20">
                  <img 
                    src={settings?.admin_profile_pic || `https://api.dicebear.com/7.x/avataaars/svg?seed=admin`} 
                    className="w-full h-full object-cover"
                    alt="Admin"
                  />
                </div>
                <div>
                  <p className="font-bold text-lg leading-tight">{settings?.admin_name || 'এডমিন'}</p>
                  <p className="text-emerald-400 text-sm font-mono">{settings?.admin_phone || '01XXXXXXXXX'}</p>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-white/10">
                <p className="text-xs text-emerald-300 leading-relaxed">যেকোনো প্রয়োজনে বা তথ্যের জন্য সরাসরি এডমিনের সাথে যোগাযোগ করুন।</p>
              </div>
            </div>
          </div>

          {/* Right Column: History & Transparency */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl shadow-sm border border-neutral-100 overflow-hidden">
              <div className="p-6 border-b border-neutral-100 bg-neutral-50 flex items-center justify-between">
                <h3 className="font-bold text-neutral-900 flex items-center gap-2">
                  <History className="w-5 h-5 text-emerald-600" />
                  প্রণামী ইতিহাস
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase">মাস</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase">পরিমাণ</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase">TrxID</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-neutral-500 uppercase">স্ট্যাটাস</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {payments.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-neutral-500">
                          এখনো কোনো প্রণামী দেওয়া হয়নি
                        </td>
                      </tr>
                    ) : (
                      payments.map(payment => (
                        <tr key={payment.id} className="hover:bg-neutral-50 transition-colors">
                          <td className="px-6 py-4 text-sm font-medium text-neutral-900">{payment.month}</td>
                          <td className="px-6 py-4 text-sm font-semibold">৳{payment.amount}</td>
                          <td className="px-6 py-4 text-sm font-mono text-neutral-500">{payment.transaction_id}</td>
                          <td className="px-6 py-4 text-right">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              payment.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                              payment.status === 'rejected' ? 'bg-red-100 text-red-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                              {payment.status === 'approved' ? 'অনুমোদিত' : payment.status === 'rejected' ? 'বাতিল' : 'পেন্ডিং'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-neutral-100 overflow-hidden">
              <div className="p-6 border-b border-neutral-100 bg-neutral-50 flex items-center justify-between">
                <h3 className="font-bold text-neutral-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  আপনার অবদান (আয়/ব্যয়)
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase">বিবরণ</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase">ধরণ</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase">পরিমাণ</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-neutral-500 uppercase">তারিখ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {userTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-neutral-500">
                          এখনো কোনো আয়/ব্যয় রেকর্ড নেই
                        </td>
                      </tr>
                    ) : (
                      userTransactions.map(t => (
                        <tr key={t.id} className="hover:bg-neutral-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-neutral-900">{t.description}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${t.type === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                              {t.type === 'income' ? 'আয়' : 'ব্যয়'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-bold">৳{t.amount}</td>
                          <td className="px-6 py-4 text-right text-xs text-neutral-500">
                            {new Date(t.created_at).toLocaleDateString('bn-BD')}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Finance Detail Modal */}
      <AnimatePresence>
        {financeDetail.show && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-2xl max-h-[80vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-neutral-100 flex items-center justify-between bg-neutral-50">
                <h3 className="text-xl font-bold text-neutral-900">
                  {financeDetail.type === 'pronami' ? 'প্রণামী ইতিহাস' : 
                   financeDetail.type === 'income' ? 'আয় হিস্ট্রি' : 
                   financeDetail.type === 'expense' ? 'ব্যয় হিস্ট্রি' : 'অবদান হিস্ট্রি'}
                </h3>
                <button 
                  onClick={() => setFinanceDetail({ show: false, type: null })}
                  className="p-2 hover:bg-neutral-200 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-neutral-500" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                {financeDetail.type === 'pronami' ? (
                  <div className="space-y-4">
                    {payments.filter(p => p.status === 'approved').map(p => (
                      <div key={p.id} className="flex justify-between items-center p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
                        <div>
                          <div className="font-bold text-neutral-900">{p.month}</div>
                          <div className="text-xs text-neutral-500">{p.transaction_id}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-emerald-600">৳{p.amount}</div>
                          <div className="text-[10px] text-neutral-400">{new Date(p.created_at).toLocaleDateString('bn-BD')}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userTransactions.filter(t => financeDetail.type === 'income' ? t.type === 'income' : financeDetail.type === 'expense' ? t.type === 'expense' : true).map(t => (
                      <div key={t.id} className="flex justify-between items-center p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
                        <div className="flex-1 mr-4">
                          <div className="font-bold text-neutral-900">{t.description}</div>
                          <div className="text-[10px] text-neutral-400">{new Date(t.created_at).toLocaleDateString('bn-BD')}</div>
                        </div>
                        <div className={`font-bold ${t.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                          {t.type === 'income' ? '+' : '-'}৳{t.amount}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-neutral-100 flex items-center justify-between bg-neutral-50">
                <h3 className="text-xl font-bold text-neutral-900">সেটিংস</h3>
                <button 
                  onClick={() => setShowSettings(false)}
                  className="p-2 hover:bg-neutral-200 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-neutral-500" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-8 space-y-12">
                <section>
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <Camera className="w-5 h-5 text-emerald-600" />
                    প্রোফাইল ছবি
                  </h3>
                  <div className="flex flex-col items-center gap-6">
                    <div className="w-32 h-32 rounded-2xl overflow-hidden bg-neutral-100 border-2 border-emerald-100">
                      <img src={profilePic || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.phone}`} className="w-full h-full object-cover" alt="Profile" />
                    </div>
                    <input type="file" accept="image/*" onChange={handleProfilePicUpload} className="hidden" id="member-profile-upload" />
                    <label htmlFor="member-profile-upload" className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold cursor-pointer hover:bg-emerald-700 transition-all">ছবি পরিবর্তন করুন</label>
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    পাসওয়ার্ড পরিবর্তন
                  </h3>
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">পুরানো পাসওয়ার্ড</label>
                      <input 
                        type="password" 
                        required
                        className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                        value={passwordData.oldPassword}
                        onChange={e => setPasswordData({...passwordData, oldPassword: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">নতুন পাসওয়ার্ড</label>
                      <input 
                        type="password" 
                        required
                        className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                        value={passwordData.newPassword}
                        onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})}
                      />
                    </div>
                    <button type="submit" className="w-full bg-neutral-900 text-white font-semibold py-3 rounded-xl hover:bg-black transition-all shadow-lg">পাসওয়ার্ড পরিবর্তন করুন</button>
                  </form>
                </section>

                <section className="pt-8 border-t border-neutral-100">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-red-600">
                    <UserMinus className="w-5 h-5" />
                    অ্যাকাউন্ট ডিঅ্যাক্টিভেশন
                  </h3>
                  <p className="text-neutral-500 text-xs mb-6">আপনি যদি আপনার একাউন্টটি বন্ধ করতে চান, তবে এখান থেকে এডমিনের কাছে প্রস্তাব পাঠাতে পারেন।</p>
                  <button 
                    onClick={handleRequestDeactivation}
                    className="w-full bg-red-50 text-red-600 font-bold py-3 rounded-xl hover:bg-red-100 transition-all"
                  >
                    ডিঅ্যাক্টিভেশন প্রস্তাব পাঠান
                  </button>
                </section>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">প্রণামী তথ্য দিন</h3>
                <button onClick={() => setShowPaymentModal(false)} className="p-2 hover:bg-neutral-100 rounded-full">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handlePayment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">পরিমাণ (৳)</label>
                  <input 
                    type="number" 
                    required
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 outline-none focus:ring-2 focus:ring-emerald-500"
                    value={formData.amount}
                    onChange={e => setFormData({...formData, amount: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">কোন মাসের জন্য</label>
                  <input 
                    type="month" 
                    required
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 outline-none focus:ring-2 focus:ring-emerald-500"
                    value={formData.month}
                    onChange={e => setFormData({...formData, month: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">পেমেন্ট মেথড</label>
                  <select 
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 outline-none focus:ring-2 focus:ring-emerald-500"
                    value={formData.method}
                    onChange={e => setFormData({...formData, method: e.target.value})}
                  >
                    <option value="bkash">বিকাশ</option>
                    <option value="nagad">নগদ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">ট্রানজেকশন আইডি (TrxID)</label>
                  <input 
                    type="text" 
                    required
                    placeholder="উদা: 8N7X6W5V"
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                    value={formData.transactionId}
                    onChange={e => setFormData({...formData, transactionId: e.target.value})}
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
                >
                  সাবমিট করুন
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Transaction Modal */}
      <AnimatePresence>
        {showTransactionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">আয়/ব্যয় এন্ট্রি দিন</h3>
                <button onClick={() => setShowTransactionModal(false)} className="p-2 hover:bg-neutral-100 rounded-full">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleTransaction} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">ধরণ</label>
                  <div className="flex gap-4">
                    <button 
                      type="button"
                      onClick={() => setTransactionFormData({...transactionFormData, type: 'income'})}
                      className={`flex-1 py-3 rounded-xl font-bold border-2 transition-all ${transactionFormData.type === 'income' ? 'bg-emerald-50 border-emerald-600 text-emerald-600' : 'border-neutral-100 text-neutral-400'}`}
                    >
                      আয়
                    </button>
                    <button 
                      type="button"
                      onClick={() => setTransactionFormData({...transactionFormData, type: 'expense'})}
                      className={`flex-1 py-3 rounded-xl font-bold border-2 transition-all ${transactionFormData.type === 'expense' ? 'bg-red-50 border-red-600 text-red-600' : 'border-neutral-100 text-neutral-400'}`}
                    >
                      ব্যয়
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">বিবরণ</label>
                  <textarea 
                    required
                    rows={3}
                    placeholder="টাকা কিসের জন্য দেওয়া বা নেওয়া হলো?"
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 outline-none focus:ring-2 focus:ring-emerald-500"
                    value={transactionFormData.description}
                    onChange={e => setTransactionFormData({...transactionFormData, description: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">পরিমাণ (৳)</label>
                  <input 
                    type="number" 
                    required
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 outline-none focus:ring-2 focus:ring-emerald-500"
                    value={transactionFormData.amount}
                    onChange={e => setTransactionFormData({...transactionFormData, amount: parseInt(e.target.value)})}
                  />
                </div>
                <button 
                  type="submit"
                  className={`w-full text-white font-bold py-4 rounded-xl transition-all shadow-lg ${transactionFormData.type === 'income' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200' : 'bg-red-600 hover:bg-red-700 shadow-red-200'}`}
                >
                  রিকোয়েস্ট পাঠান
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
