import React from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '../../components/auth/LoginForm';
import { Zap, BarChart2, Coins, Users, Calendar } from 'lucide-react';

const features = [
  { icon: Coins, label: 'Track coin earnings per session' },
  { icon: BarChart2, label: 'Leaderboards & performance reports' },
  { icon: Calendar, label: 'Manage sessions and coin entries' },
  { icon: Users, label: 'Role-based access for admins, emcees & hosts' },
];

const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  const handleLoginSuccess = () => {
    navigate('/');
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-[58%] relative flex-col justify-between p-12 overflow-hidden bg-gradient-to-br from-slate-950 via-teal-950 to-slate-950">
        {/* Animated orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -left-32 w-[420px] h-[420px] rounded-full bg-teal-500/20 blur-3xl animate-float" />
          <div className="absolute -bottom-32 -right-32 w-[380px] h-[380px] rounded-full bg-cyan-500/15 blur-3xl animate-float-delayed" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] rounded-full bg-teal-400/10 blur-3xl" />
        </div>

        {/* Dot grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.07]"
          style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '28px 28px' }}
        />

        {/* Top: logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center shadow-lg shadow-teal-900/60">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-white text-lg font-bold tracking-tight">Points Tracker</span>
        </div>

        {/* Middle: hero copy */}
        <div className="relative z-10 space-y-8">
          <div className="space-y-4">
            <h1 className="text-[2.6rem] font-extrabold text-white leading-[1.15] tracking-tight">
              Track coins.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-cyan-300 to-emerald-400">
                Reward performance.
              </span>
            </h1>
            <p className="text-slate-400 text-base leading-relaxed max-w-sm">
              Points Tracker helps emcees log session coin entries and gives hosts real-time visibility into their leaderboard standing.
            </p>
          </div>

          <div className="space-y-3">
            {features.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-800/60 border border-slate-700/50 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-teal-400" />
                </div>
                <span className="text-slate-300 text-sm">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: tagline */}
        <div className="relative z-10">
          <p className="text-slate-500 text-xs">Internal tool — access is by invitation only.</p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col items-center justify-center bg-white px-8 py-12 overflow-y-auto">
        {/* Mobile-only logo */}
        <div className="lg:hidden flex items-center gap-2.5 mb-10">
          <div className="w-8 h-8 rounded-xl bg-teal-600 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-slate-900 text-base font-bold tracking-tight">Points Tracker</span>
        </div>

        <div className="w-full max-w-sm">
          <LoginForm onSuccess={handleLoginSuccess} />

          <p className="mt-8 text-center text-sm text-slate-400">
            Don't have an account? Contact your administrator.
          </p>
        </div>

        <p className="mt-12 text-xs text-slate-300">
          © {new Date().getFullYear()} Points Tracker. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
