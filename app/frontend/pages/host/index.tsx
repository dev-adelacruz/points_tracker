import React from 'react';
import DashboardLayout from '../../components/DashboardLayout';

const HostDashboard: React.FC = () => {
  return (
    <DashboardLayout title="Dashboard">
      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-6">
        <h2 className="text-base font-bold text-slate-800">Host Dashboard</h2>
        <p className="mt-1 text-sm text-slate-500">Personal earnings and ranking.</p>
      </div>
    </DashboardLayout>
  );
};

export default HostDashboard;
