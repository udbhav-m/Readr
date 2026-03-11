interface Props {
  children: React.ReactNode;
  variant?: 'teal' | 'gray' | 'amber';
}

export function InfoBadge({ children, variant = 'teal' }: Props) {
  const variants = {
    teal: 'bg-teal-100 text-teal-700',
    gray: 'bg-gray-100 text-gray-600',
    amber: 'bg-amber-100 text-amber-700',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  );
}
