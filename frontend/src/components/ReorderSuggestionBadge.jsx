import React from 'react';

/**
 * A reusable badge component explicitly designed to alert administrators of low stock thresholds
 * and immediately provide the mathematical calculated safe reorder suggestion metric.
 * 
 * Replaces hardcoded HTML badges with accessible elements. Only mounts the badge if suggestion > 0.
 */
export const ReorderSuggestionBadge = ({ suggestion, unit }) => {
  if (!suggestion || suggestion <= 0) return null;

  return (
    <div className="mt-1">
      <span 
        className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 uppercase tracking-wider"
        aria-label={`Suggestion to reorder ${suggestion} ${unit || 'items'}`}
      >
        <span aria-hidden="true">Order: {suggestion} {unit ? unit : ''}</span>
      </span>
    </div>
  );
};
