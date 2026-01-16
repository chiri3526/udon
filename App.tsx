
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { CafeteriaOrder, Statistics } from './types';
import { parseEmailContent } from './services/geminiService';

// Current month for stats (YYYY-MM)
const CURRENT_MONTH = new Date().toISOString().slice(0, 7);

// Mock raw email data for initial simulation
const MOCK_EMAILS = [
  {
    id: '1',
    subject: '【創価高等学校食堂】ご注文内容の確認',
    date: `${CURRENT_MONTH}-20 12:00`,
    body: '創価高等学校食堂をご利用いただきありがとうございます。\n【注文内容】\n・きつねうどん\n・おにぎり'
  },
  {
    id: '2',
    subject: '【創価高等学校食堂】ご注文内容の確認',
    date: `${CURRENT_MONTH}-18 11:30`,
    body: '【注文内容】\n・カレーライス\n・サラダ'
  },
  {
    id: '3',
    subject: '【創価高等学校食堂】ご注文内容の確認',
    date: `${CURRENT_MONTH}-15 12:15`,
    body: '【注文内容】\n・たぬきうどん\n・唐揚げ'
  }
];

const App: React.FC = () => {
  const [orders, setOrders] = useState<CafeteriaOrder[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());

  // Function to process an email using Gemini
  const processEmail = useCallback(async (email: { id: string, subject: string, body: string, date: string }) => {
    const parsed = await parseEmailContent(email.body);
    const hasUdon = parsed.items.some(item => item.isUdon);
    
    return {
      id: email.id,
      date: parsed.date || email.date.split(' ')[0], // Use parsed date or fallback to email date
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
      try {
        const results = await Promise.all(MOCK_EMAILS.map(processEmail));
        setOrders(results);
      } catch (error) {
        console.error("Failed to initialize orders:", error);
      } finally {
        setIsSyncing(false);
      }
    };
    init();
  }, [processEmail]);

  // Simulation for "New Email Trigger"
  useEffect(() => {
    if (!autoSync) return;

    const interval = setInterval(async () => {
      setLastSyncTime(new Date());
      
      // Randomly "find" a new order (30% chance every check)
      if (Math.random() > 0.7) {
        const isUdon = Math.random() > 0.5;
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const newEmail = {
          id: Math.random().toString(36).substr(2, 9),
          subject: '【創価高等学校食堂】ご注文内容の確認',
          date: now.toLocaleString(),
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
      thisMonthCount: udonOrders.filter(o => o.date.startsWith(CURRENT_MONTH)).length
    };
  }, [orders]);

  const chartData = useMemo(() => {
    // Group by date
    const groups: { [key: string]: { date: string, others: number, udon: number } } = {};
    orders.forEach(o => {
      const d = o.date;
      if (!groups[d]) groups[d] = { date: d, others: 0, udon: 0 };
      if (o.hasUdon) {
        groups[d].udon += 1;
      } else {
        groups[d].others += 1;
      }
    });
    // Return sorted by date, last 14 days or all
    return Object.values(groups).sort((a, b) => a.date.localeCompare(b.date)).slice(-14);
  }, [orders]);

  const handleManualSync = async () => {
    setIsSyncing(true);
    // Simulate API network delay
    await new Promise(r => setTimeout(r, 1200));
    setLastSyncTime(new Date());
    setIsSyncing(false);
  };

  return (
    <div className="min-h-screen pb-12 font-sans selection:bg-brand-100">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm backdrop-blur-md bg-white/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-brand-500 text-white p-2 rounded-xl shadow-md flex items-center justify-center">
              <span className="material-symbols-outlined block text-2xl">restaurant</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-none">
                うどん注文トラッカー
              </h1>
              <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mt-1">Soka High School Cafeteria Intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="hidden sm:flex flex-col items-end mr-2">
                <span className="text-[9px] uppercase font-bold text-gray-400 leading-none mb-1">Last Synced</span>
                <span className="text-xs font-mono font-semibold text-gray-600">{lastSyncTime.toLocaleTimeString()}</span>
             </div>
             <button 
              onClick={handleManualSync}
              disabled={isSyncing}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-all active:scale-95 ${
                isSyncing ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-brand-500 text-white hover:bg-brand-600 shadow-lg shadow-brand-500/25'
              }`}
            >
              <span className={`material-symbols-outlined text-sm ${isSyncing ? 'animate-spin' : ''}`}>refresh</span>
              {isSyncing ? '同期中' : '今すぐ同期'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Status Panel */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className={`size-10 rounded-full flex items-center justify-center ${autoSync ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-400'}`}>
              <span className="material-symbols-outlined">{autoSync ? 'notifications_active' : 'notifications_off'}</span>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800">Gmail 自動更新トリガー</p>
              <p className="text-xs text-gray-500">注文メール受信時に自動でグラフを更新します</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-xl border border-gray-100">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${autoSync ? 'text-green-600' : 'text-gray-400'}`}>
              {autoSync ? 'Monitoring' : 'Paused'}
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={autoSync} onChange={(e) => setAutoSync(e.target.checked)} className="sr-only peer" />
              <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
            </label>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="総注文" value={stats.totalOrders} icon="receipt_long" color="text-indigo-600" bg="bg-indigo-50" />
          <StatCard title="うどん" value={stats.udonCount} icon="ramen_dining" color="text-brand-600" bg="bg-brand-50" />
          <StatCard title="うどん選択率" value={`${stats.udonPercentage.toFixed(1)}%`} icon="analytics" color="text-pink-600" bg="bg-pink-50" />
          <StatCard title="今月のうどん" value={stats.thisMonthCount} icon="stars" color="text-amber-600" bg="bg-amber-50" />
        </div>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-lg font-extrabold text-gray-900">消費傾向</h3>
                <p className="text-xs text-gray-400 mt-1">日別の注文内訳（直近14日間）</p>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="size-2.5 rounded-full bg-brand-500"></div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Udon</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="size-2.5 rounded-full bg-gray-200"></div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Others</span>
                </div>
              </div>
            </div>
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 600}} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 600}} 
                  />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{
                      borderRadius: '16px', 
                      border: 'none', 
                      boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
                      padding: '12px'
                    }}
                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                    labelStyle={{ marginBottom: '4px', color: '#64748b', fontWeight: 'bold', fontSize: '10px' }}
                  />
                  <Bar dataKey="udon" stackId="a" fill="#f97316" radius={[0, 0, 0, 0]} barSize={32} />
                  <Bar dataKey="others" stackId="a" fill="#e2e8f0" radius={[6, 6, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Email Feed */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col h-[460px]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-extrabold text-gray-900">受信フィード</h3>
              <span className="bg-gray-100 text-gray-500 text-[10px] px-2 py-1 rounded-lg font-bold">LIVE</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
              {orders.length === 0 && !isSyncing ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-300">
                  <span className="material-symbols-outlined text-5xl mb-4 opacity-20">mark_email_unread</span>
                  <p className="text-sm font-medium">データ待機中...</p>
                </div>
              ) : (
                orders.map((order) => (
                  <div key={order.id} className="p-4 rounded-2xl border border-transparent bg-gray-50/50 hover:bg-white hover:border-brand-100 hover:shadow-xl hover:shadow-brand-500/5 transition-all duration-300 group">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                         <div className={`size-2 rounded-full ${order.hasUdon ? 'bg-brand-500 animate-pulse' : 'bg-gray-300'}`}></div>
                         <span className="text-[10px] font-bold text-gray-400 tracking-tight font-mono">{order.date}</span>
                      </div>
                      {order.hasUdon && (
                        <span className="bg-brand-500 text-white text-[9px] px-2 py-0.5 rounded-full font-black tracking-tighter uppercase">Udon Detected</span>
                      )}
                    </div>
                    <div className="flex gap-4">
                       <div className={`size-10 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:rotate-6 ${order.hasUdon ? 'bg-brand-100 text-brand-600' : 'bg-white text-gray-400 border border-gray-100 shadow-sm'}`}>
                          <span className="material-symbols-outlined text-xl">{order.hasUdon ? 'soup_kitchen' : 'receipt'}</span>
                       </div>
                       <div className="min-w-0">
                          <p className="text-sm font-extrabold text-gray-800 truncate group-hover:text-brand-600">
                            {order.items.map(i => i.name).join(' + ')}
                          </p>
                          <p className="text-[11px] text-gray-400 line-clamp-2 mt-1 font-medium leading-normal">
                            {order.fullText.split('【注文内容】')[1]?.trim() || order.fullText}
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

      <footer className="max-w-7xl mx-auto px-4 text-center mt-8 pb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 rounded-2xl shadow-sm">
           <span className="size-2 bg-green-500 rounded-full animate-ping"></span>
           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">System Operational • Gemini-3-Flash Engine</p>
        </div>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
};

const StatCard: React.FC<{title: string, value: string | number, icon: string, color: string, bg: string}> = ({title, value, icon, color, bg}) => (
  <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl hover:shadow-gray-200/40 transition-all duration-300 group">
    <div className="flex items-center gap-5">
      <div className={`${bg} ${color} size-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110`}>
        <span className="material-symbols-outlined text-2xl">{icon}</span>
      </div>
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-black text-gray-900 mt-0.5">{value}</p>
      </div>
    </div>
  </div>
);

export default App;
