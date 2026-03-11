import { BottomNav } from './BottomNav';

export function MobileLayout({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="min-h-screen bg-[#f5f5f0] flex justify-center">
      <div className={`w-full max-w-sm relative pb-20 ${className}`}>
        {children}
        <BottomNav />
      </div>
    </div>
  );
}
