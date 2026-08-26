import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { CreateTemplateForm } from "@/components/certificates-admin/CreateTemplateForm";

export default async function NewCertificateTemplatePage() {
  const session = await auth();

  if (!session?.accessToken || (session.user.userType !== "ADMIN" && session.user.userType !== "INSTRUCTOR")) {
    redirect("/dashboard/not-authorized");
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/dashboard/certificates"
          className="text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-[#2D6A4F] dark:hover:text-[#52b788] no-underline transition-colors duration-150"
        >
          ← Back to Certificates
        </Link>
        <h1 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight mt-2">
          Create a certificate template
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Design the copy and colors — you can upload a logo and signature image next.
        </p>
      </div>
      <CreateTemplateForm />
    </div>
  );
}
