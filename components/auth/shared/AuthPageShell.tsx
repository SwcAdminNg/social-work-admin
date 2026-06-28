import { BrandPanel, MobileBrandLogo } from "./BrandPanel";

export function AuthPageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-[#f0f7f4] dark:bg-[#0a0a0a]">
      <BrandPanel />

      <div className="flex-1 flex items-center justify-center px-5 py-12 sm:px-10 lg:px-14 xl:px-20">
        <div className="w-full max-w-[420px]">
          <MobileBrandLogo />
          {children}
        </div>
      </div>
    </div>
  );
}
