import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  ctaLabel: string;
  onCta: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, description, ctaLabel, onCta }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center mb-4">
      <Icon className="w-6 h-6 text-teal-600" />
    </div>
    <p className="text-sm font-semibold text-slate-700 mb-1">{title}</p>
    {description && (
      <p className="text-xs text-slate-400 mb-4 max-w-xs">{description}</p>
    )}
    {!description && <div className="mb-4" />}
    <button
      onClick={onCta}
      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-teal-600 text-white hover:bg-teal-700 active:scale-95 transition-all duration-150"
    >
      {ctaLabel}
    </button>
  </div>
);

export default EmptyState;
