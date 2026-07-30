export default function EvisionsLogo({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      {/* Icon — orange northeast arrow, matches evisions brand mark */}
      <svg
        width="22"
        height="22"
        viewBox="0 0 22 22"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Diagonal tail */}
        <line
          x1="4"
          y1="18"
          x2="14"
          y2="8"
          stroke="#F97316"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Arrowhead — two sides of an L pointing northeast */}
        <polyline
          points="8,6 15,6 15,13"
          stroke="#F97316"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
      <span className="text-sm font-semibold tracking-wide text-gray-800">
        evisions
      </span>
    </span>
  )
}
