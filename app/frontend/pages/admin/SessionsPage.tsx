import React, { useState } from 'react';
import Pagination from '../../components/Pagination';

const SessionsPage: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 0;

  return (
    <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100">
        <h2 className="text-sm font-bold text-slate-800">Sessions</h2>
        <p className="text-xs text-slate-400 mt-0.5">Manage and review sessions.</p>
      </div>
      <div className="p-6">
        <p className="text-sm text-slate-400">Session management coming soon.</p>
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>
    </div>
  );
};

export default SessionsPage;
