"use client";

function IconFacebook() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function IconTwitterX() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function IconLinkedIn() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

function IconMapPin() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function IconPhone() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.29 6.29l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function IconMail() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

const quickLinks = [
  { label: "About Us", href: "https://socialworknigeria.org/about-us/" },
  {
    label: "Privacy Policy",
    href: "https://socialworknigeria.org/privacy-policy",
  },
];

const socialLinks = [
  { label: "Facebook", href: "#", icon: <IconFacebook /> },
  { label: "X (Twitter)", href: "#", icon: <IconTwitterX /> },
  { label: "LinkedIn", href: "#", icon: <IconLinkedIn /> },
];

const contactItems = [
  {
    icon: <IconMapPin />,
    label: "Address",
    value: "Flat C3, Okonkwo Estate, Jos, Plateau State.",
    href: undefined,
  },
  {
    icon: <IconPhone />,
    label: "Phone",
    value: "+2348034471063",
    href: "tel:+2348034471063",
  },
  {
    icon: <IconMail />,
    label: "Email",
    value: "support@socialworknigeria.org",
    href: "mailto:support@socialworknigeria.org",
  },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 mb-5">
      <span
        className="w-4 h-px bg-[#2D6A4F] dark:bg-[#52b788]"
        aria-hidden="true"
      />
      <span className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[#2D6A4F] dark:text-[#52b788]">
        {children}
      </span>
    </div>
  );
}

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      className="relative bg-[#f0f7f4] dark:bg-[#060f0a] overflow-hidden"
      aria-label="Site footer"
    >
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] rounded-full bg-[#2D6A4F]/8 dark:bg-[#2D6A4F]/10 blur-[100px] pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="h-px w-full"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, #2D6A4F 30%, #52b788 50%, #2D6A4F 70%, transparent 100%)",
        }}
        aria-hidden="true"
      />
      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-14 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-[1.6fr_1fr_1fr] gap-12 md:gap-8 lg:gap-16">
          <div className="flex flex-col gap-5">
            {/* Logo wordmark */}
            <a
              href="/"
              className="flex items-center gap-3 no-underline w-fit group"
              aria-label="Social Work Nigeria home"
            >
              {/* Icon mark */}
              <div className="w-9 h-9 rounded-xl bg-[#2D6A4F] flex items-center justify-center flex-shrink-0 shadow-lg shadow-green-900/20 group-hover:bg-[#1e4d38] dark:group-hover:bg-[#52b788] transition-colors duration-200">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div>
                <p className="text-gray-900 dark:text-white font-bold text-[0.95rem] leading-tight tracking-tight">
                  Social Work Nigeria
                </p>
                <p className="text-[#2D6A4F] dark:text-[#52b788] text-[0.65rem] font-semibold uppercase tracking-widest leading-tight">
                  Consultancy
                </p>
              </div>
            </a>

            {/* Mission blurb */}
            <p className="text-[0.85rem] text-gray-500 dark:text-white/45 leading-relaxed max-w-xs">
              Strengthening ethical, skilled, and accountable social work
              practice across Nigeria through structured, practice-led
              education.
            </p>

            {/* Social icons */}
            <div className="flex items-center gap-2 pt-1">
              {socialLinks.map(({ label, href, icon }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 dark:border-white/10 text-gray-400 dark:text-white/40 hover:text-[#2D6A4F] dark:hover:text-[#52b788] hover:border-[#2D6A4F]/40 dark:hover:border-[#52b788]/40 hover:bg-[#2D6A4F]/8 dark:hover:bg-[#2D6A4F]/15 transition-all duration-200 no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F] dark:focus-visible:ring-[#52b788]"
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* ── Column 2: Contact ── */}
          <div>
            <SectionLabel>Contact Us</SectionLabel>
            <ul className="flex flex-col gap-4" role="list">
              {contactItems.map(({ icon, label, value, href }) => (
                <li key={label} className="flex items-start gap-3">
                  <span className="mt-0.5 flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg bg-[#2D6A4F]/10 dark:bg-[#2D6A4F]/20 text-[#2D6A4F] dark:text-[#52b788]">
                    {icon}
                  </span>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[0.65rem] uppercase tracking-widest text-gray-400 dark:text-white/30 font-semibold">
                      {label}
                    </span>
                    {href ? (
                      <a
                        href={href}
                        className="text-[0.82rem] text-gray-600 dark:text-white/60 hover:text-[#2D6A4F] dark:hover:text-[#52b788] no-underline transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F] dark:focus-visible:ring-[#52b788] rounded"
                      >
                        {value}
                      </a>
                    ) : (
                      <span className="text-[0.82rem] text-gray-600 dark:text-white/60">
                        {value}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Column 3: Quick Links ── */}
          <div>
            <SectionLabel>Quick Links</SectionLabel>
            <ul className="flex flex-col gap-2.5" role="list">
              {quickLinks.map(({ label, href }) => (
                <li key={label}>
                  <a
                    href={href}
                    target={href.startsWith("http") ? "_blank" : undefined}
                    rel={
                      href.startsWith("http")
                        ? "noopener noreferrer"
                        : undefined
                    }
                    className="group inline-flex items-center gap-2 text-[0.85rem] text-gray-500 dark:text-white/50 hover:text-[#2D6A4F] dark:hover:text-[#52b788] no-underline transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F] dark:focus-visible:ring-[#52b788] rounded"
                  >
                    <span
                      className="w-1 h-1 rounded-full bg-[#2D6A4F]/40 dark:bg-[#2D6A4F] group-hover:bg-[#2D6A4F] dark:group-hover:bg-[#52b788] transition-colors duration-150 flex-shrink-0"
                      aria-hidden="true"
                    />
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div className="mt-12 pt-6 border-t border-gray-200 dark:border-white/8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[0.75rem] text-gray-400 dark:text-white/30 text-center sm:text-left">
            © {year} Social Work Consultancy. All Rights Reserved.
          </p>

          <div className="flex items-center gap-1 text-[0.75rem]">
            <a
              href="https://socialworknigeria.org/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 dark:text-white/35 hover:text-[#2D6A4F] dark:hover:text-[#52b788] no-underline transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F] dark:focus-visible:ring-[#52b788] rounded px-1"
            >
              Privacy
            </a>
            <span
              className="text-gray-300 dark:text-white/20"
              aria-hidden="true"
            >
              ·
            </span>
            <a
              href="https://socialworknigeria.org/terms-of-service/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 dark:text-white/35 hover:text-[#2D6A4F] dark:hover:text-[#52b788] no-underline transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F] dark:focus-visible:ring-[#52b788] rounded px-1"
            >
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
