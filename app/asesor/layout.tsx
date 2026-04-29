import BottomNav from '@/components/BottomNav';

export default function AdvisorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 relative">
      <div className="pb-20">{children}</div>
      <BottomNav />
    </div>
  );
}
