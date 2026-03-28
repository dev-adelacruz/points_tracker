import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../state/store';
import DashboardLayout from '../../components/DashboardLayout';
import {
  TrendingUp, Users, ShoppingCart, DollarSign,
  ArrowUpRight, ArrowDownRight, ArrowRight,
  UserPlus, BarChart2, ShieldCheck, Key,
} from 'lucide-react';

const statCards = [
  {
    label: 'Total Revenue',
    value: '$48,295',
    change: '+12.5%',
    up: true,
    icon: DollarSign,
    gradient: 'from-teal-500 to-cyan-400',
    shadow: 'shadow-teal-500/20',
    iconBg: 'bg-teal-500/10',
    iconColor: 'text-teal-500',
  },
  {
    label: 'Active Users',
    value: '3,842',
    change: '+8.1%',
    up: true,
    icon: Users,
    gradient: 'from-violet-500 to-purple-600',
    shadow: 'shadow-violet-500/20',
    iconBg: 'bg-violet-500/10',
    iconColor: 'text-violet-500',
  },
  {
    label: 'New Orders',
    value: '1,209',
    change: '-3.2%',
    up: false,
    icon: ShoppingCart,
    gradient: 'from-amber-500 to-orange-500',
    shadow: 'shadow-amber-500/20',
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-500',
  },
  {
    label: 'Growth Rate',
    value: '24.6%',
    change: '+4.9%',
    up: true,
    icon: TrendingUp,
    gradient: 'from-sky-500 to-blue-500',
    shadow: 'shadow-sky-500/20',
    iconBg: 'bg-sky-500/10',
    iconColor: 'text-sky-500',
  },
];

const activities = [
  { title: 'New user registered', desc: 'sarah.chen@company.com joined the platform', time: '2m ago', icon: UserPlus, iconBg: 'bg-teal-50', iconColor: 'text-teal-600', dot: 'bg-teal-500' },
  { title: 'Order #1042 completed', desc: '$299 — Pro plan annual subscription', time: '47m ago', icon: ShoppingCart, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600', dot: 'bg-emerald-500' },
  { title: 'Monthly report ready', desc: 'March 2026 analytics report generated', time: '2h ago', icon: BarChart2, iconBg: 'bg-violet-50', iconColor: 'text-violet-600', dot: 'bg-violet-500' },
  { title: 'System backup succeeded', desc: 'All 12 databases backed up successfully', time: '3h ago', icon: ShieldCheck, iconBg: 'bg-amber-50', iconColor: 'text-amber-600', dot: 'bg-amber-500' },
  { title: 'New API key created', desc: 'Production environment — expires in 90 days', time: '5h ago', icon: Key, iconBg: 'bg-slate-100', iconColor: 'text-slate-600', dot: 'bg-slate-400' },
];

const performanceMetrics = [
  { label: 'Conversion Rate', pct: 68, gradient: 'from-teal-500 to-cyan-400' },
  { label: 'User Retention', pct: 84, gradient: 'from-violet-500 to-purple-600' },
  { label: 'Goal Completion', pct: 52, gradient: 'from-amber-500 to-orange-500' },
  { label: 'Revenue Target', pct: 79, gradient: 'from-sky-500 to-blue-500' },
];

const StatCard: React.FC<typeof statCards[0]> = ({ label, value, change, up, icon: Icon, gradient, shadow, iconBg, iconColor }) => (
  <div className={`bg-white rounded-2xl p-5 border border-slate-100 shadow-md ${shadow} hover:-translate-y-1 hover:shadow-lg transition-all duration-200 cursor-default`}>
    <div className="flex items-start justify-between">
      <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <span className={`inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-1 rounded-full ${up ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
        {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
        {change}
      </span>
    </div>
    <div className="mt-4">
      <p className="text-2xl font-bold text-slate-900 tracking-tight">{value}</p>
      <p className="text-xs font-medium text-slate-500 mt-1 uppercase tracking-wider">{label}</p>
    </div>
    <div className={`mt-4 h-1 w-full rounded-full bg-gradient-to-r ${gradient} opacity-80`} />
  </div>
);

const HomePage: React.FC = () => {
  const user = useSelector((state: RootState) => state.user.user);
  const firstName = user?.email?.split('@')[0] ?? 'there';
  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';

  return (
    <DashboardLayout title="Dashboard">
      {/* Welcome banner */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-slate-950 via-teal-950 to-slate-950">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-teal-500/25 blur-3xl" />
          <div className="absolute -bottom-16 left-1/4 w-48 h-48 rounded-full bg-cyan-500/20 blur-3xl" />
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        </div>
        <div className="relative z-10 px-6 py-6 lg:px-8 lg:py-7">
          <p className="text-teal-400 text-xs font-semibold uppercase tracking-widest mb-1">Overview</p>
          <h2 className="text-xl lg:text-2xl font-bold text-white tracking-tight">
            Good {timeOfDay}, <span className="text-teal-300">{firstName}</span> 👋
          </h2>
          <p className="text-slate-400 text-sm mt-1.5 max-w-md">Your platform is running smoothly. Here's a summary of today's activity.</p>
          <button className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold transition-all duration-150 shadow-lg shadow-teal-900/40 group">
            View full report
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-150" />
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((card) => <StatCard key={card.label} {...card} />)}
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Recent Activity</h3>
            <button className="flex items-center gap-1 text-xs font-semibold text-teal-600 hover:text-teal-700 transition-colors group">
              View all<ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
          <div className="divide-y divide-slate-50">
            {activities.map((a, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50/70 transition-colors">
                <div className={`w-9 h-9 rounded-xl ${a.iconBg} flex items-center justify-center shrink-0`}>
                  <a.icon className={`w-4 h-4 ${a.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{a.title}</p>
                  <p className="text-xs text-slate-400 truncate">{a.desc}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`w-1.5 h-1.5 rounded-full ${a.dot}`} />
                  <span className="text-xs text-slate-400">{a.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Performance</h3>
            <p className="text-xs text-slate-400 mt-0.5">vs. previous month</p>
          </div>
          <div className="p-6 space-y-5">
            {performanceMetrics.map((m) => (
              <div key={m.label}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-600">{m.label}</span>
                  <span className="text-xs font-bold text-slate-800">{m.pct}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full bg-gradient-to-r ${m.gradient}`} style={{ width: `${m.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default HomePage;
