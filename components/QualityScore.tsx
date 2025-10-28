import React from 'react';
import { getQualityScoreLabel, getQualityScoreColor } from '../services/leadScoringService';

interface QualityScoreProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const QualityScore: React.FC<QualityScoreProps> = ({
  score,
  size = 'md',
  showLabel = true
}) => {
  const label = getQualityScoreLabel(score);
  const colorClass = getQualityScoreColor(score);

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  return (
    <span className={`inline-flex items-center gap-1 font-semibold rounded-full ${colorClass} ${sizeClasses[size]}`}>
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
      <span>{score}%</span>
      {showLabel && <span className="hidden sm:inline">· {label}</span>}
    </span>
  );
};
