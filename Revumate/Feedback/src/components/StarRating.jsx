import { useState } from 'react';
import { FaStar } from 'react-icons/fa';

export default function StarRating({ value, onChange, size = 'md', readonly = false }) {
  const [hovered, setHovered] = useState(0);
  const sizeClass = size === 'lg' ? 'text-2xl' : 'text-xl';

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !readonly && onChange && onChange(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          disabled={readonly}
          className={`${sizeClass} transition-all duration-100 ${readonly ? 'cursor-default' : 'cursor-pointer active:scale-90'}`}
          aria-label={`${star} star`}
        >
          <FaStar
            className={star <= (hovered || value) ? 'text-primary' : 'text-muted'}
          />
        </button>
      ))}
    </div>
  );
}
