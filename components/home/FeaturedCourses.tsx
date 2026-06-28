"use client";

import { useRef, useState, useCallback } from "react";

type Level = "Beginner" | "Intermediate" | "Advanced";

interface Course {
  id: string;
  title: string;
  category: string;
  level: Level;
  rating: number;
  reviewCount: number;
  price: "Free" | string;
  image: string;
  href: string;
}

const courses: Course[] = [
  {
    id: "child-rights-act",
    title: "Understanding the Child Rights Act 2003",
    category: "Law, Policy & Advocacy",
    level: "Beginner",
    rating: 4,
    reviewCount: 128,
    price: "Free",
    image: "/images/courses/child-rights-act.webp",
    href: "#child-rights-act",
  },
  {
    id: "children-disabilities",
    title: "Working with Children with Disabilities and Special Needs",
    category: "Professional Skills & Practice",
    level: "Beginner",
    rating: 5,
    reviewCount: 94,
    price: "Free",
    image: "/images/courses/children-disabilities.webp",
    href: "#children-disabilities",
  },
  {
    id: "dei-workplace",
    title: "Diversity, Equity & Inclusion (DEI) in the Workplace",
    category: "Professional Skills & Practice",
    level: "Intermediate",
    rating: 4,
    reviewCount: 76,
    price: "Free",
    image: "/images/courses/dei-workplace.webp",
    href: "#dei-workplace",
  },
  {
    id: "trauma-informed",
    title: "Trauma-Informed Practice for Social Workers",
    category: "Mental Health & Wellbeing",
    level: "Intermediate",
    rating: 5,
    reviewCount: 112,
    price: "Free",
    image: "/images/courses/trauma-informed.webp",
    href: "#trauma-informed",
  },
  {
    id: "digital-casework",
    title: "Digital Tools for Effective Casework Management",
    category: "Digital & Innovative Practice",
    level: "Beginner",
    rating: 4,
    reviewCount: 58,
    price: "Free",
    image: "/images/courses/digital-casework.webp",
    href: "#digital-casework",
  },
  {
    id: "community-advocacy",
    title: "Community Advocacy & Rights-Based Approaches",
    category: "Law, Policy & Advocacy",
    level: "Advanced",
    rating: 5,
    reviewCount: 43,
    price: "Free",
    image: "/images/courses/community-advocacy.webp",
    href: "#community-advocacy",
  },
];

const levelColors: Record<Level, string> = {
  Beginner: "bg-[#2D6A4F] text-white",
  Intermediate: "bg-amber-600 text-white",
  Advanced: "bg-rose-700 text-white",
};

function StarRating({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div
      className="flex items-center gap-0.5"
      aria-label={`${rating} out of ${max} stars`}
    >
      {Array.from({ length: max }).map((_, i) => (
        <svg
          key={i}
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill={i < rating ? "#f59e0b" : "none"}
          stroke="#f59e0b"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M8 1.5l1.545 3.13 3.455.502-2.5 2.437.59 3.441L8 9.25l-3.09 1.76.59-3.44L3 5.132l3.455-.502z" />
        </svg>
      ))}
    </div>
  );
}

function CourseCard({ course }: { course: Course }) {
  return (
    <article
      className="group flex flex-col bg-white dark:bg-[#141414] rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 h-full"
      aria-labelledby={`course-${course.id}-title`}
    >
      {/* Image */}
      <div className="relative overflow-hidden aspect-[16/9] bg-[#2D6A4F]/10 flex-shrink-0">
        <img
          src={course.image}
          alt=""
          aria-hidden="true"
          className="w-full h-full object-cover object-center group-hover:scale-[1.03] transition-transform duration-300"
          onError={(e) => {
            const target = e.currentTarget as HTMLImageElement;
            target.style.display = "none";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#2D6A4F]/30 via-[#52b788]/20 to-[#2D6A4F]/10 -z-10" />

        {/* Level badge */}
        <span
          className={`absolute top-3 left-3 text-[0.65rem] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${levelColors[course.level]}`}
        >
          {course.level}
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-5 gap-3">
        {/* Stars */}
        <StarRating rating={course.rating} />

        {/* Title */}
        <h3
          id={`course-${course.id}-title`}
          className="text-[0.95rem] font-bold leading-snug text-gray-900 dark:text-gray-100 tracking-tight"
        >
          {course.title}
        </h3>

        {/* Category */}
        <p className="text-[0.78rem] text-gray-400 dark:text-gray-500">
          In{" "}
          <span className="text-[#2D6A4F] dark:text-[#52b788] font-semibold">
            {course.category}
          </span>
        </p>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
          <span className="text-[0.9rem] font-bold text-[#2D6A4F] dark:text-[#52b788]">
            {course.price}
          </span>
          <a
            href={course.href}
            className="inline-flex items-center gap-1.5 text-[0.8rem] font-semibold text-gray-700 dark:text-gray-300 hover:text-[#2D6A4F] dark:hover:text-[#52b788] no-underline transition-colors duration-150"
          >
            {/* Grid icon */}
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="1" y="1" width="6" height="6" rx="1" />
              <rect x="9" y="1" width="6" height="6" rx="1" />
              <rect x="1" y="9" width="6" height="6" rx="1" />
              <rect x="9" y="9" width="6" height="6" rx="1" />
            </svg>
            Get Enrolled
          </a>
        </div>
      </div>
    </article>
  );
}

function NavArrow({
  direction,
  onClick,
  disabled,
}: {
  direction: "prev" | "next";
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === "prev" ? "Previous courses" : "Next courses"}
      className={`w-10 h-10 flex items-center justify-center rounded-full border transition-all duration-150 flex-shrink-0
        ${
          disabled
            ? "border-gray-300 dark:border-gray-700 text-gray-300 dark:text-gray-700 cursor-not-allowed opacity-40"
            : "border-gray-400 dark:border-gray-500 text-gray-600 dark:text-gray-300 hover:border-[#2D6A4F] dark:hover:border-[#52b788] hover:text-[#2D6A4F] dark:hover:text-[#52b788] hover:bg-[#2D6A4F]/10 cursor-pointer"
        }`}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {direction === "prev" ? (
          <path d="M10 3L5 8l5 5" />
        ) : (
          <path d="M6 3l5 5-5 5" />
        )}
      </svg>
    </button>
  );
}

const VISIBLE_COUNT = 3;

export default function FeaturedCourses() {
  const [index, setIndex] = useState<number>(0);
  const trackRef = useRef<HTMLDivElement>(null);

  const maxIndex = courses.length - VISIBLE_COUNT;

  const prev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);
  const next = useCallback(
    () => setIndex((i) => Math.min(maxIndex, i + 1)),
    [maxIndex],
  );

  return (
    <section
      className="relative overflow-hidden bg-gray-50 dark:bg-[#0a0a0a] py-20 px-6"
      aria-labelledby="featured-courses-heading"
    >
      {/* Subtle radial glow behind heading */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[320px] rounded-full bg-[#2D6A4F]/10 blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* ── Header ── */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <p className="text-sm font-semibold uppercase tracking-widest text-[#2D6A4F] dark:text-[#52b788] mb-3">
            Featured Courses
          </p>
          <h2
            id="featured-courses-heading"
            className="text-[2rem] sm:text-[2.5rem] lg:text-[2.8rem] font-extrabold leading-[1.15] text-gray-900 dark:text-white tracking-tight mb-5"
          >
            Start Your Learning Journey Today
          </h2>
          <p className="text-[0.95rem] text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
            Social Work Nigeria offers structured, practice-led courses designed
            to strengthen ethical, skilled, and accountable social work practice
            across Nigeria.
          </p>
          <p className="text-[0.95rem] text-gray-400 dark:text-gray-500 leading-relaxed">
            Our courses support individuals and organisations working with
            children, families, and vulnerable adults — particularly in contexts
            where access to formal training, supervision, and CPD is limited.
          </p>
        </div>

        {/* ── Carousel wrapper ── */}
        <div className="relative">
          {/* Track */}
          <div className="overflow-hidden" ref={trackRef}>
            <div
              className="flex gap-5 transition-transform duration-400 ease-in-out"
              style={{
                transform: `translateX(calc(-${index} * (100% / ${VISIBLE_COUNT} + (${VISIBLE_COUNT - 1} * 1.25rem / ${VISIBLE_COUNT}))))`,
              }}
            >
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="flex-shrink-0 w-full sm:w-[calc(50%-0.625rem)] lg:w-[calc(33.333%-0.834rem)]"
                >
                  <CourseCard course={course} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Controls row ── */}
        <div className="mt-10 flex items-center justify-between gap-4">
          {/* Dot indicators */}
          <div
            className="flex items-center gap-2"
            role="tablist"
            aria-label="Course slides"
          >
            {Array.from({ length: maxIndex + 1 }).map((_, i) => (
              <button
                key={i}
                role="tab"
                aria-selected={i === index}
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`rounded-full transition-all duration-200 ${
                  i === index
                    ? "w-6 h-2 bg-[#2D6A4F] dark:bg-[#52b788]"
                    : "w-2 h-2 bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-500"
                }`}
              />
            ))}
          </div>

          {/* Arrows */}
          <div className="flex items-center gap-3">
            <NavArrow direction="prev" onClick={prev} disabled={index === 0} />
            <NavArrow
              direction="next"
              onClick={next}
              disabled={index >= maxIndex}
            />
          </div>
        </div>

        {/* ── View all CTA ── */}
        <div className="mt-10 text-center">
          <a
            href="#all-courses"
            className="inline-flex items-center gap-2 px-7 py-3 bg-[#2D6A4F] hover:bg-[#1e4d38] text-white text-[0.95rem] font-semibold rounded-full no-underline shadow-lg shadow-green-900/20 hover:-translate-y-0.5 transition-all duration-150"
          >
            View All Courses
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M3 8h10M9 4l4 4-4 4" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
