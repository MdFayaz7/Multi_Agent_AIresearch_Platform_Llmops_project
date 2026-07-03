import React, { useState } from "react";

export default function RatingStars({ value = 0, onChange, readOnly = false }) {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(n)}
          onMouseEnter={() => !readOnly && setHover(n)}
          onMouseLeave={() => !readOnly && setHover(0)}
          className={`text-lg leading-none transition ${
            readOnly ? "cursor-default" : "cursor-pointer"
          } ${(hover || value) >= n ? "text-signal-amber" : "text-slate-400 dark:text-slate-600"}`}
          aria-label={`${n} star`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
