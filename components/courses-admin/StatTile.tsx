export function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_-18px_rgba(16,24,40,0.18)] sm:p-5 dark:border-ink-line dark:bg-ink-surface dark:shadow-none">
      <div className="min-w-0">
        <p className="truncate text-[13px] font-medium text-slate-500 dark:text-slate-400">
          {label}
        </p>
        <p className="mt-2 truncate font-display text-2xl font-extrabold leading-none tracking-tight text-slate-950 dark:text-white">
          {value}
        </p>
      </div>
      <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200/70 dark:bg-brand-400/12 dark:text-brand-300 dark:ring-brand-400/20 [&_svg]:h-[18px] [&_svg]:w-[18px]">
        <Icon />
      </span>
    </div>
  );
}
