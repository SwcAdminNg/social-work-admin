"use client";

import type { TemplateFormState } from "./TemplateFormFields";

const SAMPLE_VALUES = {
  student_name: "Jane Doe",
  course_title: "Introduction to Community Social Work",
  instructor_name: "Dr. John Smith",
};

const KNOWN_PLACEHOLDERS = new Set([
  "student_name",
  "course_title",
  "completion_date",
  "instructor_name",
  "organization_name",
]);

function sampleCompletionDate(): string {
  return new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function fontStack(fontFamily: string): string {
  switch (fontFamily) {
    case "Times-Roman":
      return '"Times New Roman", Times, serif';
    case "Courier":
      return '"Courier New", Courier, monospace';
    default:
      return "Helvetica, Arial, sans-serif";
  }
}

export function findUnknownPlaceholders(bodyText: string): string[] {
  const found = new Set<string>();
  const re = /\{(\w+)\}/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(bodyText))) {
    if (!KNOWN_PLACEHOLDERS.has(match[1])) found.add(match[1]);
  }
  return Array.from(found);
}

function renderBodyText(bodyText: string, organizationName: string): string {
  const values: Record<string, string> = {
    ...SAMPLE_VALUES,
    completion_date: sampleCompletionDate(),
    organization_name: organizationName || "Social Workers Academy",
  };
  return bodyText.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? values[key] : match));
}

export function CertificatePreview({
  state,
  logoUrl,
  signatureImageUrl,
}: {
  state: TemplateFormState;
  logoUrl?: string | null;
  signatureImageUrl?: string | null;
}) {
  const unknownPlaceholders = findUnknownPlaceholders(state.bodyText);
  const borderWidth = state.borderStyle === "CLASSIC" ? 6 : 3;
  const borderColor = state.borderStyle === "CLASSIC" ? state.primaryColor : state.accentColor;

  return (
    <div className="flex flex-col gap-2">
      <div
        className="relative w-full aspect-[3/2] overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800 shadow-inner"
        style={{ backgroundColor: state.backgroundColor || "#FFFFFF", fontFamily: fontStack(state.fontFamily) }}
      >
        {state.borderStyle !== "NONE" && (
          <div className="absolute inset-3 sm:inset-4" style={{ border: `${borderWidth}px solid ${borderColor}` }}>
            {state.borderStyle === "CLASSIC" && (
              <>
                <div className="absolute inset-2" style={{ border: `1.5px solid ${state.accentColor}` }} />
                {["-top-1.5 -left-1.5", "-top-1.5 -right-1.5", "-bottom-1.5 -left-1.5", "-bottom-1.5 -right-1.5"].map(
                  (pos) => (
                    <span
                      key={pos}
                      className={`absolute ${pos} w-3 h-3 rotate-45`}
                      style={{ backgroundColor: state.accentColor }}
                    />
                  )
                )}
              </>
            )}
          </div>
        )}

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8 sm:px-12 py-6 gap-1">
          {logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" className="h-8 sm:h-10 object-contain mb-1" />
          )}
          <p
            className="text-[0.55rem] sm:text-[0.65rem] font-bold uppercase tracking-[0.2em]"
            style={{ color: state.primaryColor }}
          >
            {state.organizationName || "Social Workers Academy"}
          </p>
          <h2 className="text-lg sm:text-2xl font-extrabold tracking-tight mt-1" style={{ color: state.accentColor }}>
            {state.titleText || "Certificate of Completion"}
          </h2>
          {state.subtitleText && (
            <p className="text-[0.65rem] sm:text-xs mt-1" style={{ color: state.textColor }}>
              {state.subtitleText}
            </p>
          )}
          <p className="text-base sm:text-xl font-bold italic mt-1.5" style={{ color: state.primaryColor }}>
            {SAMPLE_VALUES.student_name}
          </p>
          <p className="text-[0.6rem] sm:text-xs max-w-md mt-1.5 leading-snug" style={{ color: state.textColor }}>
            {renderBodyText(state.bodyText, state.organizationName)}
          </p>

          {(state.signatureName || signatureImageUrl) && (
            <div className="flex flex-col items-center mt-4 sm:mt-6">
              {signatureImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={signatureImageUrl} alt="" className="h-6 sm:h-8 object-contain mb-1" />
              ) : (
                <div className="w-20 sm:w-28 h-px mb-1" style={{ backgroundColor: state.textColor, opacity: 0.4 }} />
              )}
              <p className="text-[0.55rem] sm:text-[0.65rem] font-semibold" style={{ color: state.textColor }}>
                {state.signatureName || "Signature"}
              </p>
              {state.signatureTitle && (
                <p className="text-[0.5rem] sm:text-[0.6rem]" style={{ color: state.textColor, opacity: 0.7 }}>
                  {state.signatureTitle}
                </p>
              )}
            </div>
          )}

          {state.footerText && (
            <p
              className="absolute bottom-2 sm:bottom-3 left-0 right-0 text-[0.5rem] sm:text-[0.6rem] opacity-60 px-6"
              style={{ color: state.textColor }}
            >
              {state.footerText}
            </p>
          )}
        </div>
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-600">
        Preview only — uses sample data. Actual rendering happens server-side on first view.
      </p>

      {unknownPlaceholders.length > 0 && (
        <p className="text-xs text-amber-600 dark:text-amber-500">
          Unknown placeholder{unknownPlaceholders.length > 1 ? "s" : ""}:{" "}
          {unknownPlaceholders.map((p) => `{${p}}`).join(", ")} — rendering will fail for students until this is
          fixed.
        </p>
      )}
    </div>
  );
}
