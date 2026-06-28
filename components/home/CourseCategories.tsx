const categories = [
  {
    id: "professional-skills",
    icon: (
      <svg
        width="32"
        height="32"
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect
          x="4"
          y="14"
          width="28"
          height="18"
          rx="2"
          fill="#2D6A4F"
          fillOpacity="0.15"
          stroke="#2D6A4F"
          strokeWidth="1.8"
        />
        <path
          d="M4 20h28"
          stroke="#2D6A4F"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M12 14v-3a6 6 0 0 1 12 0v3"
          stroke="#2D6A4F"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <circle cx="18" cy="27" r="2" fill="#2D6A4F" />
      </svg>
    ),
    title: "Professional Skills & Practice",
    description:
      "Courses designed to strengthen your day-to-day practice in social work and social services.",
    count: "12 courses",
    href: "#professional-skills",
  },
  {
    id: "digital-innovative",
    icon: (
      <svg
        width="32"
        height="32"
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle
          cx="18"
          cy="14"
          r="7"
          fill="#2D6A4F"
          fillOpacity="0.15"
          stroke="#2D6A4F"
          strokeWidth="1.8"
        />
        <path
          d="M18 21v4M15 25h6"
          stroke="#2D6A4F"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M15 14c0-1.657 1.343-3 3-3"
          stroke="#2D6A4F"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
    title: "Digital & Innovative Practice",
    description:
      "Equipping social workers with modern tools to improve efficiency and client engagement.",
    count: "8 courses",
    href: "#digital-innovative",
  },
  {
    id: "law-policy",
    icon: (
      <svg
        width="32"
        height="32"
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M18 4v28M18 4l-8 5M18 4l8 5"
          stroke="#2D6A4F"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M6 9l-4 8h8L6 9zM30 9l-4 8h8l-4-8z"
          fill="#2D6A4F"
          fillOpacity="0.15"
          stroke="#2D6A4F"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="M4 32h28"
          stroke="#2D6A4F"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
    title: "Law, Policy & Advocacy",
    description:
      "Building capacity to influence policy change and protect rights in your community and the world.",
    count: "10 courses",
    href: "#law-policy",
  },
  {
    id: "mental-health",
    icon: (
      <svg
        width="32"
        height="32"
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M18 30s-12-8.5-12-16a12 12 0 0 1 24 0c0 7.5-12 16-12 16z"
          fill="#2D6A4F"
          fillOpacity="0.15"
          stroke="#2D6A4F"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M13 16h3l2-4 2 8 2-4h3"
          stroke="#2D6A4F"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    title: "Mental Health & Wellbeing",
    description:
      "Understand psychological frameworks and trauma-informed approaches for holistic support.",
    count: "9 courses",
    href: "#mental-health",
  },
  {
    id: "safeguarding",
    icon: (
      <svg
        width="32"
        height="32"
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M18 4L6 9v9c0 7.18 5.1 13.9 12 15.5C24.9 31.9 30 25.18 30 18V9L18 4z"
          fill="#2D6A4F"
          fillOpacity="0.15"
          stroke="#2D6A4F"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M13 18l3.5 3.5L23 14"
          stroke="#2D6A4F"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    title: "Safeguarding & Child Protection",
    description:
      "Essential training for identifying risk, reporting obligations, and protecting vulnerable individuals.",
    count: "11 courses",
    href: "#safeguarding",
  },
  {
    id: "leadership",
    icon: (
      <svg
        width="32"
        height="32"
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <polygon
          points="18,4 22,14 33,14 24,21 27,32 18,25 9,32 12,21 3,14 14,14"
          fill="#2D6A4F"
          fillOpacity="0.15"
          stroke="#2D6A4F"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    ),
    title: "Leadership & Management",
    description:
      "Develop supervisory and strategic skills to lead teams and drive excellence in social services.",
    count: "7 courses",
    href: "#leadership",
  },
];

export default function CourseCategories() {
  return (
    <section
      className="relative overflow-hidden bg-[#f0f5f2] dark:bg-[#0d1210] py-20 px-6"
      aria-labelledby="categories-heading"
      id="courses"
    >
      {/* Decorative circle — top right (mirrors WhyChooseUs bottom-left circle) */}
      <div
        className="absolute -top-16 -right-16 w-72 h-72 rounded-full border border-[#2D6A4F]/20 dark:border-[#2D6A4F]/15 pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute -top-6 -right-6 w-48 h-48 rounded-full border border-[#2D6A4F]/10 dark:border-[#2D6A4F]/10 pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center max-w-xl mx-auto mb-12">
          <p className="text-sm font-semibold uppercase tracking-widest text-[#2D6A4F] mb-3">
            What We Offer
          </p>
          <h2
            id="categories-heading"
            className="text-[2rem] sm:text-[2.4rem] font-extrabold leading-[1.2] text-gray-900 dark:text-gray-50 tracking-tight mb-4"
          >
            Explore Our Course Categories
          </h2>
          <p className="text-[0.95rem] text-gray-500 dark:text-gray-400 leading-relaxed">
            From safeguarding to digital tools, mental health to policy advocacy
            — find courses that match your professional development needs.
          </p>
        </div>

        {/* Category grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {categories.map((cat) => (
            <a
              key={cat.id}
              href={cat.href}
              className="group relative flex flex-col gap-4 bg-white dark:bg-[#111a14] border border-gray-200/80 dark:border-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-md hover:-translate-y-1 hover:border-[#2D6A4F]/40 dark:hover:border-[#2D6A4F]/50 transition-all duration-200 no-underline"
              aria-labelledby={`${cat.id}-title`}
            >
              {/* Icon */}
              <div className="w-14 h-14 flex items-center justify-center bg-[#2D6A4F]/10 dark:bg-[#2D6A4F]/20 rounded-xl flex-shrink-0 group-hover:bg-[#2D6A4F]/15 dark:group-hover:bg-[#2D6A4F]/30 transition-colors duration-200">
                {cat.icon}
              </div>

              {/* Text */}
              <div className="flex flex-col gap-2 flex-1">
                <h3
                  id={`${cat.id}-title`}
                  className="text-[1rem] font-bold text-gray-900 dark:text-gray-100 tracking-tight leading-snug group-hover:text-[#2D6A4F] dark:group-hover:text-[#52b788] transition-colors duration-150"
                >
                  {cat.title}
                </h3>
                <p className="text-[0.875rem] text-gray-500 dark:text-gray-400 leading-relaxed">
                  {cat.description}
                </p>
              </div>

              {/* Footer row */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
                <span className="text-xs font-semibold text-[#2D6A4F] dark:text-[#52b788] bg-[#2D6A4F]/10 dark:bg-[#2D6A4F]/20 px-2.5 py-1 rounded-full">
                  {cat.count}
                </span>
                {/* Arrow */}
                <span
                  className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 group-hover:bg-[#2D6A4F] transition-colors duration-200"
                  aria-hidden="true"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M3 8h10M9 4l4 4-4 4"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-gray-500 group-hover:text-white transition-colors duration-200"
                    />
                  </svg>
                </span>
              </div>
            </a>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-10 text-center">
          <a
            href="#all-courses"
            className="inline-flex items-center gap-2 px-6 py-[0.7rem] bg-[#2D6A4F] text-white text-[0.95rem] font-semibold rounded-full no-underline shadow-md shadow-green-900/20 hover:bg-[#1e4d38] hover:-translate-y-0.5 transition-all duration-150"
          >
            Browse All Courses
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M3 8h10M9 4l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
