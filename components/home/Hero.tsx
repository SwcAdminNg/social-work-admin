export default function Hero() {
  return (
    <section className="relative w-full overflow-hidden bg-[#f0f5f2] dark:bg-[#0a0a0a] flex items-center min-h-[420px] md:min-h-[460px]">
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <img
          src="/images/home/social-works-hero.webp"
          alt=""
          aria-hidden="true"
          className="w-full h-full object-cover object-top dark:brightness-[0.95]"
        />
      </div>

      {/* Gradient overlay — left to right on desktop, top to bottom on mobile */}
      <div
        className="absolute inset-0 z-10"
        style={{
          background:
            "linear-gradient(90deg, #f0f5f2 38%, rgba(240,245,242,0.88) 56%, rgba(240,245,242,0) 100%)",
        }}
        aria-hidden="true"
      />
      {/* Dark mode overlay via a separate element controlled by Tailwind */}
      <div
        className="absolute inset-0 z-10 hidden dark:block"
        style={{
          background:
            "linear-gradient(90deg, rgba(10,10,10,0.82) 0%, rgba(10,10,10,0.55) 50%, rgba(10,10,10,0) 100%)",
        }}
        aria-hidden="true"
      />
      {/* Mobile gradient (overrides on small screens) */}
      <div
        className="absolute inset-0 z-10 block md:hidden"
        style={{
          background:
            "linear-gradient(180deg, #f0f5f2 52%, rgba(240,245,242,0.7) 75%, rgba(240,245,242,0) 100%)",
        }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 z-10 hidden dark:block md:hidden"
        style={{
          background:
            "linear-gradient(180deg, rgba(10,10,10,0.82) 0%, rgba(10,10,10,0.5) 60%, rgba(10,10,10,0) 100%)",
        }}
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative z-20 w-full max-w-6xl mx-auto px-6 py-16 md:py-20">
        <div className="max-w-[520px]">
          {/* Eyebrow */}
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1 tracking-tight">
            Professional Training &amp; CPD
          </p>

          {/* Heading */}
          <h1 className="text-3xl md:text-[2.4rem] font-bold leading-tight text-gray-900 dark:text-gray-100 tracking-tight mb-0">
            For Social Work Practice{" "}
            <span className="underline decoration-[#2D6A4F] underline-offset-4 decoration-2">
              In Nigeria
            </span>
          </h1>

          {/* Subtext */}
          <p className="mt-4 mb-8 text-[0.95rem] text-gray-600 dark:text-gray-300 leading-relaxed max-w-[420px]">
            Build ethical, skilled, and evidence-based practice for social
            workers, students, and care professionals.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="#courses"
              className="inline-flex items-center justify-center px-6 py-[0.7rem] bg-[#2D6A4F] text-white text-[0.95rem] font-semibold rounded-full no-underline shadow-md shadow-green-900/20 hover:bg-[#1e4d38] hover:-translate-y-0.5 transition-all duration-150"
            >
              Explore Courses
            </a>
            <a
              href="#about"
              className="inline-flex items-center justify-center px-6 py-[0.7rem] bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-[0.95rem] font-semibold rounded-full no-underline border border-gray-300 dark:border-gray-600 shadow-sm hover:border-[#2D6A4F] hover:text-[#2D6A4F] hover:-translate-y-0.5 transition-all duration-150"
            >
              Learn More
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
