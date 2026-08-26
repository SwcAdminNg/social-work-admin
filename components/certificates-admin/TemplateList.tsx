"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import { deleteCertificateTemplate, listCertificateTemplates } from "@/lib/api/certificates-client";
import type { CertificateTemplate } from "@/lib/api/certificates.types";
import type { PaginatedResult } from "@/lib/api/courses.types";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { IconCertificate, IconPlus } from "@/components/dashboard/icons";
import { Pagination } from "@/components/generic/ui/Pagination";
import { TemplateCard } from "./TemplateCard";
import { ConfirmDialog } from "@/components/courses-admin/ConfirmDialog";

interface TemplateListProps {
  initialData: PaginatedResult<CertificateTemplate>;
  currentUserId: string;
  isAdmin: boolean;
}

function canManageTemplate(template: CertificateTemplate, currentUserId: string, isAdmin: boolean) {
  return isAdmin || template.owner_id === currentUserId;
}

export function TemplateList({ initialData, currentUserId, isAdmin }: TemplateListProps) {
  const [result, setResult] = useState(initialData);
  const [page, setPage] = useState(1);
  const [pending, startTransition] = useTransition();
  const [deleteTarget, setDeleteTarget] = useState<CertificateTemplate | null>(null);
  const [deleting, setDeleting] = useState(false);

  function fetchPage(nextPage: number) {
    startTransition(async () => {
      try {
        const data = await listCertificateTemplates({ page: nextPage, page_size: 20 });
        setResult(data);
      } catch (error) {
        toast.error(error instanceof ApiError ? error.message : "Failed to load certificate templates.");
      }
    });
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteCertificateTemplate(deleteTarget.id);
      toast.success(`"${deleteTarget.name}" was deleted.`);
      setDeleteTarget(null);
      fetchPage(page);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to delete certificate template.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Certificate Templates
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Design certificate templates and assign them to courses.
          </p>
        </div>
        <Link
          href="/dashboard/certificates/new"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-[#2D6A4F] hover:bg-[#1e4d38] shadow-lg shadow-green-900/20 transition-all duration-200 no-underline self-start"
        >
          <IconPlus />
          New Template
        </Link>
      </div>

      {result.items.length === 0 ? (
        <EmptyState
          icon={IconCertificate}
          title="No certificate templates yet"
          description="Create a template to design what students see when they complete a course."
        />
      ) : (
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${pending ? "opacity-60" : ""}`}>
          {result.items.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              canManage={canManageTemplate(template, currentUserId, isAdmin)}
              onDelete={() => setDeleteTarget(template)}
            />
          ))}
        </div>
      )}

      {result.meta.total_pages > 1 && (
        <div className="mt-4">
          <Pagination
            currentPage={page}
            totalPages={result.meta.total_pages}
            onPageChange={(p) => {
              setPage(p);
              fetchPage(p);
            }}
          />
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this template?"
        description={`"${deleteTarget?.name}" will be removed. Courses using it will fall back to the global default.`}
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
