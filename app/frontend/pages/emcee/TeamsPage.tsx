import React from 'react';
import { Users } from 'lucide-react';

const EmceeTeamsPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center mb-4">
        <Users className="w-6 h-6 text-teal-500" />
      </div>
      <h2 className="text-sm font-bold text-slate-800 mb-1">My Teams</h2>
      <p className="text-xs text-slate-400">This page is coming soon.</p>
    </div>
  );
};

export default EmceeTeamsPage;
