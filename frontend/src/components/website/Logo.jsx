/** HealthHub AI brand mark — header & footer variants */

function LogoMark({ size = 36, className = '' }) {
  const id = `hh-${size}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${id}-bg`} x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2563eb" />
          <stop offset="1" stopColor="#4f46e5" />
        </linearGradient>
        <linearGradient id={`${id}-pulse`} x1="28" y1="14" x2="40" y2="26" gradientUnits="userSpaceOnUse">
          <stop stopColor="#93c5fd" />
          <stop offset="1" stopColor="#c7d2fe" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="44" height="44" rx="12" fill={`url(#${id}-bg)`} />
      <path
        d="M24 34.5c-6.2-4.8-10-8.4-10-12.4a5.2 5.2 0 0 1 9.2-3.2 5.2 5.2 0 0 1 9.2 3.2c0 4-3.8 7.6-10 12.4Z"
        fill="white"
        fillOpacity="0.95"
      />
      <path
        d="M28 16h2.5v2.5H28V16Zm4 4h2.5v2.5H32V20Zm-4 4h2.5v2.5H28V24Z"
        fill={`url(#${id}-pulse)`}
        opacity="0.9"
      />
      <circle cx="36" cy="16" r="3" fill="#bfdbfe" />
      <path d="M33 16h6M36 13v6" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity="0.85" />
    </svg>
  );
}

export default function Logo({ variant = 'header', className = '', showText = true }) {
  const isFooter = variant === 'footer';
  const iconSize = isFooter ? 40 : 36;

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark size={iconSize} className="shrink-0 drop-shadow-sm" />
      {showText && (
        <span className="flex flex-col leading-none">
          <span className={`font-bold tracking-tight ${isFooter ? 'text-white text-xl' : 'text-slate-900 text-lg'}`}>
            HealthHub{' '}
            <span className={isFooter ? 'text-blue-300' : 'text-brand-600'}>AI</span>
          </span>
          {isFooter && (
            <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mt-1 font-medium">
              Peshawar · Pakistan
            </span>
          )}
        </span>
      )}
    </span>
  );
}

export { LogoMark };
