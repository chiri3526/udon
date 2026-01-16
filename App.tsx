
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, LineChart, Line, Legend 
} from 'recharts';
import { CafeteriaOrder, Statistics } from './types';
import { parseEmailContent } from './services/geminiService';

// Mock raw email data for initial simulation
const MOCK_EMAILS = [
  {
    id: '1',
    subject: '【創価高等学校食堂】ご注文内容の確認',
    date: '2024-03-20 12:00',
    body: '創価高等学校食堂をご利用いただきありがとうございます。\n【注文内容】\n・きつねうどん\n・おにぎり'
  },
  {
    id: '2',
    subject: '【創価高等学校食堂】ご注文内容の確認',
    date: '2024-03-18 11:30',
    body: '【注文内容】\n・カレーライス\n・サラダ'
  },
  {
    id: '3',
    subject: '【創価高等学校食堂】ご注文内容の確認',
    date: '2024-03-15 12:15',
    body: '【注文内容】\n・たぬきうどん\n・唐揚げ'
  }
];

const App: React.FC = () => {
  const [orders, setOrders] = useState<CafeteriaOrder[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());

  // Function to process an email using Gemini
  const processEmail = useCallback(async (email: typeof MOCK_EMAILS[0]) => {
    const parsed = await parseEmailContent(email.body);
    const hasUdon = parsed.items.some(item => item.isUdon);
    
    return {
      id: email.id,
      date: parsed.date,
      sender: '創価高等学校食堂',
      subject: email.subject,
      items: parsed.items,
      fullText: email.body,
      hasUdon
    };
  }, []);

  // Initial Data Load
  useEffect(() => {
    const init = async () => {
      setIsSyncing(true);
      const results = await Promise.all(MOCK_EMAILS.map(processEmail));
      setOrders(results);
      setIsSyncing(false);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Simulation for "New Email Trigger"
  useEffect(() => {
    if (!autoSync) return;

    const interval = setInterval(async () => {
      // Simulate checking for new emails
      console.log('Checking for new emails...');
      setLastSyncTime(new Date());
      
      // Randomly "find" a new order
      if (Math.random() > 0.7) {
        const isUdon = Math.random() > 0.5;
        const newEmail = {
          id: Math.random().toString(36).substr(2, 9),
          subject: '【創価高等学校食堂】ご注文内容の確認',
          date: new Date().toISOString(),
          body: `【注文内容】\n・${isUdon ? '月見うどん' : '味噌ラーメン'}\n・コロッケ`
        };
        
        const processed = await processEmail(newEmail);
        setOrders(prev => [processed, ...prev]);
      }
    }, 15000); // Check every 15 seconds for simulation

    return () => clearInterval(interval);
  }, [autoSync, processEmail]);

  const stats = useMemo((): Statistics => {
    const udonOrders = orders.filter(o => o.hasUdon);
    return {
      totalOrders: orders.length,
      udonCount: udonOrders.length,
      udonPercentage: orders.length > 0 ? (udonOrders.length / orders.length) * 100 : 0,
      thisMonthCount: udonOrders.filter(o => o.date.startsWith('2024-03')).length
    };
  }, [orders]);

  const chartData = useMemo(() => {
    // Group by date
    const groups: { [key: string]: { date: string, count: number, udon: number } } = {};
    orders.forEach(o => {
      const d = o.date;
      if (!groups[d]) groups[d] = { date: d, count: 0, udon: 0 };
      groups[d].count += 1;
      if (o.hasUdon) groups[d].udon += 1;
    });
    return Object.values(groups).sort((a, b) => a.date.localeCompare(b.date));
  }, [orders]);

  const handleManualSync = async () => {
    setIsSyncing(true);
    // Simulate API delay
    await new Promise(r => setTimeout(r, 1500));
    setLastSyncTime(new Date());
    setIsSyncing(false);
  };

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-brand-500 text-white p-2 rounded-lg shadow-md">
              <span className="material-symbols-outlined block">soup_kitchen</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              うどん注文可視化 <span className="text-gray-400 font-normal">| 創価高校食堂</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
             <div className="hidden md:flex flex-col items-end mr-4">
                <span className="text-[10px] uppercase font-bold text-gray-400">最終更新</span>
                <span className="text-xs font-medium text-gray-600">{lastSyncTime.toLocaleTimeString()}</span>
             </div>
             <button 
              onClick={handleManualSync}
              disabled={isSyncing}
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm transition-all ${
                isSyncing ? 'bg-gray-100 text-gray-400' : 'bg-brand-500 text-white hover:bg-brand-600 shadow-lg shadow-brand-500/20'
              }`}
            >
              <span className={`material-symbols-outlined text-sm ${isSyncing ? 'animate-spin' : ''}`}>sync</span>
              {isSyncing ? '同期中...' : '手動同期'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Alerts & Notifications */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-blue-700">
            <span className="material-symbols-outlined">auto_mode</span>
            <p className="text-sm font-medium">Gmail自動同期が有効です。新しいメールを検知すると自動更新されます。</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={autoSync} onChange={(e) => setAutoSync(e.target.checked)} className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard 
            title="総注文数" 
            value={stats.totalOrders} 
            icon="receipt_long" 
            color="text-blue-600"
            bg="bg-blue-50"
          />
          <StatCard 
            title="うどん注文数" 
            value={stats.udonCount} 
            icon="ramen_dining" 
            color="text-brand-600"
            bg="bg-brand-50"
          />
          <StatCard 
            title="うどん率" 
            value={`${stats.udonPercentage.toFixed(1)}%`} 
            icon="analytics" 
            color="text-purple-600"
            bg="bg-purple-50"
          />
          <StatCard 
            title="今月のうどん" 
            value={stats.thisMonthCount} 
            icon="calendar_month" 
            color="text-green-600"
            bg="bg-green-50"
          />
        </div>

        {/* Main Content Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart Section */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-800">注文トレンド</h3>
              <div className="flex gap-2">
                <span className="flex items-center gap-1 text-xs font-medium text-gray-500">
                  <span className="w-3 h-3 rounded-full bg-brand-500"></span> うどん
                </span>
                <span className="flex items-center gap-1 text-xs font-medium text-gray-500">
                  <span className="w-3 h-3 rounded-full bg-gray-300"></span> その他
                </span>
              </div>
            </div>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                  />
                  <Bar dataKey="udon" stackId="a" fill="#f97316" radius={[4, 4, 0, 0]} barSize={40} />
                  <Bar dataKey="count" stackId="a" fill="#e2e8f0" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Activity Log */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[500px]">
            <h3 className="text-lg font-bold text-gray-800 mb-4">最新のメール履歴</h3>
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
              {orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <span className="material-symbols-outlined text-4xl mb-2">inbox</span>
                  <p>注文メールがありません</p>
                </div>
              ) : (
                orders.map((order) => (
                  <div key={order.id} className="p-3 rounded-xl border border-gray-50 bg-gray-50 hover:bg-white hover:border-brand-200 hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{order.date}</span>
                      {order.hasUdon && (
                        <span className="bg-brand-100 text-brand-700 text-[10px] px-2 py-0.5 rounded-full font-bold">UDON!</span>
                      )}
                    </div>
                    <div className="flex gap-3">
                       <div className={`mt-1 size-8 rounded-full flex items-center justify-center shrink-0 ${order.hasUdon ? 'bg-brand-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                          <span className="material-symbols-outlined text-sm">{order.hasUdon ? 'ramen_dining' : 'mail'}</span>
                       </div>
                       <div>
                          <p className="text-sm font-bold text-gray-800 line-clamp-1 group-hover:text-brand-600">{order.items.map(i => i.name).join(', ')}</p>
                          <p className="text-xs text-gray-500 line-clamp-2 mt-1 leading-relaxed">
                            {order.fullText.replace('創価高等学校食堂をご利用いただきありがとうございます。\n', '')}
                          </p>
                       </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
      
      {/* Footer Branding */}
      <footer className="max-w-7xl mx-auto px-4 text-center mt-12 text-gray-400 text-sm">
        <p>© 2024 Soka High School Cafeteria Intelligence</p>
        <p className="text-xs mt-1 italic">Powered by Gemini AI for Automated Data Extraction</p>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f8fafc;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
};

// Sub-component for individual stats
const StatCard: React.FC<{title: string, value: string | number, icon: string, color: string, bg: string}> = ({title, value, icon, color, bg}) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
    <div className="flex items-center gap-4">
      <div className={`${bg} ${color} p-3 rounded-xl`}>
        <span className="material-symbols-outlined block">{icon}</span>
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  </div>
);

export default App;
