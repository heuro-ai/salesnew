import React from 'react';
import type { Contact } from '../types';

interface ValidationBadgeProps {
  status: Contact['validation_status'];
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const getStatusConfig = (status: Contact['validation_status']) => {
  switch (status) {
    case 'valid':
      return {
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: '✓',
        label: 'Valid',
        tooltip: 'Email has been verified and is deliverable'
      };
    case 'soft-fail':
      return {
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: '⚠',
        label: 'Risky',
        tooltip: 'Email may be deliverable but has risk factors'
      };
    case 'invalid':
      return {
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: '✗',
        label: 'Invalid',
        tooltip: 'Email is not deliverable or does not exist'
      };
    case 'unknown':
    default:
      return {
        color: 'bg-slate-100 text-slate-600 border-slate-200',
        icon: '?',
        label: 'Unknown',
        tooltip: 'Email validation status is not yet determined'
      };
  }
};

const getSizeClasses = (size: 'sm' | 'md' | 'lg') => {
  switch (size) {
    case 'sm':
      return 'text-xs px-2 py-0.5';
    case 'lg':
      return 'text-sm px-3 py-1.5';
    case 'md':
    default:
      return 'text-xs px-2.5 py-1';
  }
};

export const ValidationBadge: React.FC<ValidationBadgeProps> = ({
  status,
  showLabel = true,
  size = 'md'
}) => {
  const config = getStatusConfig(status);
  const sizeClasses = getSizeClasses(size);

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full border ${config.color} ${sizeClasses}`}
      title={config.tooltip}
    >
      <span className="mr-1">{config.icon}</span>
      {showLabel && config.label}
    </span>
  );
};
