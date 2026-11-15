import React from 'react';
import '../farmiq-loader.css';

interface FarmIQLoaderProps {
  size?: number;
  onDark?: boolean;
  className?: string;
}

export function FarmIQLoader({ size = 32, onDark = false, className = '' }: FarmIQLoaderProps) {
  return (
    <span
      className={`fl${onDark ? ' on-dark' : ''} ${className}`}
      style={{ fontSize: size }}
      role="status"
      aria-label="Loading"
    >
      <i className="gd" />
      <i className="st" />
      <i className="lf l1" />
      <i className="lf l2" />
    </span>
  );
}

export default FarmIQLoader;
