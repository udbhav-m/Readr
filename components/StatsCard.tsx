interface Stat {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
}

export function StatsCard({ stats }: { stats: Stat[] }) {
  return (
    <div className="flex gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex-1 bg-white rounded-2xl px-3 py-3 text-center shadow-sm border border-gray-100"
        >
          <div className="text-xl font-bold text-gray-900 flex items-center justify-center gap-1">
            {stat.icon && <span>{stat.icon}</span>}
            {stat.value}
          </div>
          <div className="text-xs text-gray-500 font-medium mt-0.5 uppercase tracking-wide">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}
