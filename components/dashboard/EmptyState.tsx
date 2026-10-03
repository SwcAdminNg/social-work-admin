export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-14 text-center dark:border-ink-line dark:bg-white/[0.02]">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 text-brand-600 ring-1 ring-brand-200/60 dark:from-brand-400/15 dark:to-brand-400/5 dark:text-brand-300 dark:ring-brand-400/20 [&_svg]:h-6 [&_svg]:w-6">
        <Icon />
      </span>
      <h2 className="font-display text-[15px] font-bold text-slate-900 dark:text-white">
        {title}
      </h2>
      <p className="max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
        {description}
      </p>
      {action && <div className="mt-2 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}
