import React from 'react';
import { STATUS_BADGE, STATUS_LABELS, type HostStatus } from '../utils/hostStatus';

interface StatusBadgeProps {
  status: HostStatus;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => (
  <span
    className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold border ${STATUS_BADGE[status]}`}
  >
    {STATUS_LABELS[status]}
  </span>
);

export default StatusBadge;
