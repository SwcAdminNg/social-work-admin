import Link from "next/link";
import { IconLogoMark } from "./icons";

export function BrandPanel() {
  return (
    <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden flex-shrink-0">
      {/* Photo */}
      <img
        src="/images/auth/social-work.jpg"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover object-center"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.opacity = "0";
        }}
      />

      {/* Fallback gradient (shows if image 404s) */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(145deg, #0d2b1e 0%, #1a4d35 35%, #2D6A4F 65%, #52b788 100%)",
        }}
        aria-hidden="true"
      >
        {/* Geometric ring decoration */}
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.07]"
          viewBox="0 0 600 800"
          fill="none"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <circle cx="480" cy="160" r="220" stroke="white" strokeWidth="1" />
          <circle cx="480" cy="160" r="150" stroke="white" strokeWidth="1" />
          <circle cx="480" cy="160" r="80" stroke="white" strokeWidth="1" />
          <circle cx="80" cy="680" r="180" stroke="white" strokeWidth="1" />
          <circle cx="80" cy="680" r="110" stroke="white" strokeWidth="1" />
        </svg>
      </div>

      {/* Dark scrim */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-[#071410]/90 via-[#071410]/40 to-[#071410]/20"
        aria-hidden="true"
      />

      {/* Content overlaid on image */}
      <div className="relative z-10 flex flex-col justify-between h-full p-10 xl:p-14">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-3 no-underline w-fit group"
          aria-label="Social Work Nigeria home"
        >
          <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center flex-shrink-0 group-hover:bg-white/25 transition-colors duration-200">
            <IconLogoMark />
          </div>
          <div>
            <p className="text-white font-bold text-[0.95rem] leading-tight">
              Social Work Nigeria
            </p>
            <p className="text-white/50 text-[0.62rem] uppercase tracking-widest font-medium leading-tight">
              Admin Panel
            </p>
          </div>
        </Link>

        {/* Testimonial / mission quote */}
        <div className="max-w-sm">
          {/* Decorative quote mark */}
          <svg
            width="36"
            height="28"
            viewBox="0 0 36 28"
            fill="none"
            aria-hidden="true"
            className="mb-4 opacity-60"
          >
            <path
              d="M0 28V17.6C0 13.013 1.173 9.12 3.52 5.92 5.92 2.72 9.44.853 14.08 0L15.84 3.04C12.8 3.893 10.507 5.387 8.96 7.52 7.413 9.6 6.64 12 6.64 14.72h7.04V28H0zm20.16 0V17.6c0-4.587 1.173-8.48 3.52-11.68C26.08 2.72 29.6.853 34.24 0L36 3.04c-3.04.853-5.333 2.347-6.88 4.48C27.573 9.6 26.8 12 26.8 14.72h7.04V28H20.16z"
              fill="white"
            />
          </svg>

          <blockquote className="text-white text-[1.15rem] leading-relaxed font-medium mb-5">
            "Empowering social workers with knowledge and skills to build
            stronger communities across Nigeria."
          </blockquote>

          {/* Trust badges */}
          <div className="flex flex-wrap gap-2">
            {["4,200+ Trained", "18 Courses", "12 States"].map((badge) => (
              <span
                key={badge}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 text-white text-[0.72rem] font-semibold"
              >
                <span
                  className="w-1.5 h-1.5 rounded-full bg-[#52b788]"
                  aria-hidden="true"
                />
                {badge}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function MobileBrandLogo() {
  return (
    <div className="flex lg:hidden items-center gap-3 mb-10">
      <div className="w-9 h-9 rounded-xl bg-[#2D6A4F] flex items-center justify-center flex-shrink-0">
        <IconLogoMark />
      </div>
      <div>
        <p className="text-gray-900 dark:text-white font-bold text-[0.95rem] leading-tight">
          Social Work Nigeria
        </p>
        <p className="text-[#2D6A4F] dark:text-[#52b788] text-[0.62rem] uppercase tracking-widest font-semibold leading-tight">
          Admin Panel
        </p>
      </div>
    </div>
  );
}
