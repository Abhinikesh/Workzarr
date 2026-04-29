import React from 'react';
import PropTypes from 'prop-types';
import { Star, StarHalf } from 'lucide-react';

/**
 * Star rating display component (filled/half/empty)
 */
const RatingDisplay = ({ rating = 0, count, size = 16, showCount = true }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={`full-${i}`} size={size} className="fill-amber-400 text-amber-400" />
        ))}
        {hasHalfStar && <StarHalf size={size} className="fill-amber-400 text-amber-400" />}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={`empty-${i}`} size={size} className="text-slate-200 dark:text-slate-700" />
        ))}
      </div>
      {showCount && (
        <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400">
          {rating.toFixed(1)} {count !== undefined && <span className="font-medium text-slate-400">({count})</span>}
        </span>
      )}
    </div>
  );
};

RatingDisplay.propTypes = {
  rating: PropTypes.number,
  count: PropTypes.number,
  size: PropTypes.number,
  showCount: PropTypes.bool
};

export default RatingDisplay;
