import React, { useState } from 'react';
import { getInitials, getAvatarColor } from '../../utils/imageUtils';

/**
 * Reusable Accessible User Avatar Component
 * 
 * Renders custom user uploaded photo, remote avatar, or clean initials fallback
 * with deterministic high-contrast background coloring.
 */
export default function UserAvatar({
  user,
  name: propName,
  image: propImage,
  role: propRole,
  size = 'md',
  shape = 'full', // 'full' | 'rounded-2xl' | 'rounded-3xl'
  className = '',
  showStatus = false,
  statusColor = 'bg-emerald-500'
}) {
  const [imageFailed, setImageFailed] = useState(false);

  const name = user?.name || propName || 'User';
  const rawImage = user?.profileImage || user?.avatar || propImage;
  const role = user?.role || propRole || '';

  // Determine if rawImage is available and not flagged as failed
  const hasImage = Boolean(rawImage && typeof rawImage === 'string' && rawImage.trim().length > 0 && !imageFailed);

  // Size mapping
  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-9 h-9 text-xs font-bold',
    md: 'w-11 h-11 text-sm font-extrabold',
    lg: 'w-14 h-14 text-base font-black',
    xl: 'w-20 h-20 text-2xl font-black',
    '2xl': 'w-28 h-28 text-4xl font-black'
  };

  const statusSizeClasses = {
    xs: 'w-2 h-2',
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-3.5 h-3.5',
    xl: 'w-4 h-4',
    '2xl': 'w-5 h-5'
  };

  const selectedSizeClass = sizeClasses[size] || sizeClasses.md;
  const selectedStatusSize = statusSizeClasses[size] || statusSizeClasses.md;

  const shapeClass = shape === 'full' ? 'rounded-full' : shape;
  const palette = getAvatarColor(name || user?.email);
  const initials = getInitials(name);

  return (
    <div className={`relative inline-flex items-center justify-center flex-shrink-0 select-none ${className}`}>
      {hasImage ? (
        <img
          src={rawImage}
          alt={name}
          onError={() => setImageFailed(true)}
          className={`${selectedSizeClass} ${shapeClass} object-cover border-2 border-teal-500/80 dark:border-teal-400/80 shadow-xs`}
        />
      ) : (
        <div
          aria-label={name}
          title={name}
          className={`${selectedSizeClass} ${shapeClass} ${palette.bg} ${palette.text} flex items-center justify-center border-2 border-white dark:border-[#243352] shadow-xs tracking-wider`}
        >
          <span>{initials}</span>
        </div>
      )}

      {/* Online / Active Status Dot */}
      {showStatus && (
        <span
          className={`absolute bottom-0 right-0 ${selectedStatusSize} ${statusColor} rounded-full ring-2 ring-white dark:ring-[#131D33]`}
        />
      )}
    </div>
  );
}
