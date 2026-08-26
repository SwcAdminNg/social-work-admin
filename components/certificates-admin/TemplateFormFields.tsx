"use client";

import type { CertificateBorderStyle } from "@/lib/api/certificates.types";
import { TextField, TextAreaField, SelectField } from "@/components/courses-admin/FormControls";
import { ColorField } from "./ColorField";
import { BORDER_STYLE_OPTIONS, FONT_FAMILY_OPTIONS } from "./constants";

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6">
      <div>
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">{title}</h3>
        {description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{description}</p>}
      </div>
      {children}
    </div>
  );
}

export interface TemplateFormState {
  name: string;
  titleText: string;
  subtitleText: string;
  bodyText: string;
  organizationName: string;
  footerText: string;
  signatureName: string;
  signatureTitle: string;
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  borderStyle: CertificateBorderStyle;
}

export function TemplateFormFields({
  state,
  onChange,
  disabled,
}: {
  state: TemplateFormState;
  onChange: (next: Partial<TemplateFormState>) => void;
  disabled?: boolean;
}) {
  return (
    <>
      <FormSection title="Basics" description="Your own label and the headline shown on the certificate.">
        <TextField
          label="Template name"
          id="name"
          value={state.name}
          onChange={(v) => onChange({ name: v })}
          placeholder="e.g. Gold Seal — Advanced Courses"
          required
          hint="Used to pick this template later — not shown on the certificate itself."
          disabled={disabled}
        />
        <TextField
          label="Title text"
          id="titleText"
          value={state.titleText}
          onChange={(v) => onChange({ titleText: v })}
          placeholder="Certificate of Completion"
          disabled={disabled}
        />
        <TextField
          label="Subtitle text"
          id="subtitleText"
          value={state.subtitleText}
          onChange={(v) => onChange({ subtitleText: v })}
          placeholder="This certificate is proudly presented to"
          disabled={disabled}
        />
        <TextAreaField
          label="Body text"
          id="bodyText"
          value={state.bodyText}
          onChange={(v) => onChange({ bodyText: v })}
          rows={4}
          hint={`Placeholders: {student_name} {course_title} {completion_date} {instructor_name} {organization_name}`}
          disabled={disabled}
        />
      </FormSection>

      <FormSection title="Organization & signature">
        <TextField
          label="Organization name"
          id="organizationName"
          value={state.organizationName}
          onChange={(v) => onChange({ organizationName: v })}
          placeholder="Social Workers Academy"
          disabled={disabled}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField
            label="Signature name"
            id="signatureName"
            value={state.signatureName}
            onChange={(v) => onChange({ signatureName: v })}
            placeholder="Optional"
            disabled={disabled}
          />
          <TextField
            label="Signature title"
            id="signatureTitle"
            value={state.signatureTitle}
            onChange={(v) => onChange({ signatureTitle: v })}
            placeholder="e.g. Program Director"
            disabled={disabled}
          />
        </div>
        <TextField
          label="Footer text"
          id="footerText"
          value={state.footerText}
          onChange={(v) => onChange({ footerText: v })}
          placeholder="Optional small print"
          disabled={disabled}
        />
      </FormSection>

      <FormSection title="Design" description="Colors, font, and the certificate's border style.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ColorField
            label="Primary color"
            id="primaryColor"
            value={state.primaryColor}
            onChange={(v) => onChange({ primaryColor: v })}
            disabled={disabled}
          />
          <ColorField
            label="Accent color"
            id="accentColor"
            value={state.accentColor}
            onChange={(v) => onChange({ accentColor: v })}
            disabled={disabled}
          />
          <ColorField
            label="Background color"
            id="backgroundColor"
            value={state.backgroundColor}
            onChange={(v) => onChange({ backgroundColor: v })}
            disabled={disabled}
          />
          <ColorField
            label="Text color"
            id="textColor"
            value={state.textColor}
            onChange={(v) => onChange({ textColor: v })}
            disabled={disabled}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SelectField
            label="Font family"
            id="fontFamily"
            value={state.fontFamily}
            onChange={(v) => onChange({ fontFamily: v })}
            options={FONT_FAMILY_OPTIONS}
            disabled={disabled}
          />
          <SelectField
            label="Border style"
            id="borderStyle"
            value={state.borderStyle}
            onChange={(v) => onChange({ borderStyle: v as CertificateBorderStyle })}
            options={BORDER_STYLE_OPTIONS}
            disabled={disabled}
          />
        </div>
      </FormSection>
    </>
  );
}
