import Link from "next/link";
import type { CertificateTemplate } from "@/lib/api/certificates.types";
import { IconCertificate, IconTrash } from "@/components/dashboard/icons";
import { borderStyleLabel } from "./constants";

export function TemplateCard({
  template,
  canManage,
  onDelete,
}: {
  template: CertificateTemplate;
  canManage: boolean;
  onDelete: () => void;
}) {
  return (
    <div className="flex flex-col rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden hover:border-[#2D6A4F]/40 dark:hover:border-[#52b788]/40 hover:shadow-md transition-all duration-200">
      <div
        className="h-24 flex items-center justify-center"
        style={{ backgroundColor: template.background_color, color: template.primary_color }}
      >
        {template.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={template.logo_url} alt="" className="max-h-14 max-w-[70%] object-contain" />
        ) : (
          <IconCertificate />
        )}
      </div>
      <div className="flex flex-col gap-2.5 p-4 flex-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-[0.65rem] font-bold uppercase tracking-wider ${
                template.is_active
                  ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300"
                  : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
              }`}
            >
              {template.is_active ? "Active" : "Inactive"}
            </span>
            {template.is_global && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[0.65rem] font-bold uppercase tracking-wider bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300">
                Global
              </span>
            )}
          </div>
        </div>
        <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-snug line-clamp-2">
          {template.name}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {borderStyleLabel(template.border_style)} &middot; {template.font_family}
        </p>
        <div className="flex items-center gap-2 mt-auto pt-2">
          <Link
            href={`/dashboard/certificates/${template.id}`}
            className="flex-1 text-center px-3 py-2 rounded-xl text-sm font-semibold text-[#2D6A4F] dark:text-[#52b788] bg-[#2D6A4F]/10 dark:bg-[#52b788]/15 hover:bg-[#2D6A4F]/20 dark:hover:bg-[#52b788]/25 no-underline transition-colors duration-150"
          >
            {canManage ? "Manage" : "View"}
          </Link>
          {canManage && (
            <button
              type="button"
              onClick={onDelete}
              aria-label={`Delete ${template.name}`}
              className="p-2 rounded-xl text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors duration-150 cursor-pointer"
            >
              <IconTrash />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
