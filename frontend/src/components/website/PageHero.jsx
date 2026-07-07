import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import SmartImage from './SmartImage';

export default function PageHero({
  image,
  imageAlt = 'Healthcare in Peshawar',
  title,
  highlight,
  subtitle,
  badge,
  primaryCta,
  primaryTo,
  secondaryCta,
  secondaryTo,
  tall = false,
}) {
  return (
    <section className={`relative overflow-hidden ${tall ? 'min-h-[520px]' : 'min-h-[380px]'} flex items-center`}>
      <SmartImage
        src={image}
        alt={imageAlt}
        className="absolute inset-0 w-full h-full object-cover scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/85 via-brand-900/75 to-indigo-900/80" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.25),transparent_55%)]" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 md:pt-28 md:pb-28 w-full">
        {badge && (
          <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-semibold px-4 py-1.5 rounded-full mb-5">
            {badge}
          </span>
        )}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight max-w-3xl tracking-tight">
          {title}{' '}
          {highlight && <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-indigo-200">{highlight}</span>}
        </h1>
        {subtitle && (
          <p className="mt-5 text-lg md:text-xl text-blue-100/90 max-w-2xl leading-relaxed">{subtitle}</p>
        )}
        {(primaryCta || secondaryCta) && (
          <div className="mt-8 flex flex-wrap gap-4">
            {primaryCta && primaryTo && (
              <Link to={primaryTo} className="inline-flex items-center gap-2 bg-white text-brand-700 font-bold px-6 py-3 rounded-xl hover:bg-blue-50 transition shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                {primaryCta} <ArrowRight className="w-4 h-4" />
              </Link>
            )}
            {secondaryCta && secondaryTo && (
              <Link to={secondaryTo} className="inline-flex items-center gap-2 border-2 border-white/30 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/10 transition">
                {secondaryCta}
              </Link>
            )}
          </div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-20 leading-[0]">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block" preserveAspectRatio="none">
          <path
            d="M0 120L60 105C120 90 240 60 360 52.5C480 45 600 60 720 67.5C840 75 960 75 1080 67.5C1200 60 1320 45 1380 37.5L1440 30V120H0Z"
            className="fill-slate-50"
          />
          <path
            d="M0 120L80 110C160 100 320 80 480 75C640 70 800 80 960 85C1120 90 1280 90 1360 90L1440 90V120H0Z"
            className="fill-slate-50/60"
          />
        </svg>
      </div>
    </section>
  );
}
