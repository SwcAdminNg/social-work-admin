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
    <div className="flex items-center gap-3 p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
      <div className="w-10 h-10 flex-shrink-0 rounded-xl bg-[#2D6A4F]/10 dark:bg-[#52b788]/15 text-[#2D6A4F] dark:text-[#52b788] flex items-center justify-center">
        <Icon />
      </div>
      <div className="min-w-0">
        <p className="text-lg font-extrabold text-gray-900 dark:text-white leading-none truncate">
          {value}
        </p>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1 truncate">
          {label}
        </p>
      </div>
    </div>
  );
}
