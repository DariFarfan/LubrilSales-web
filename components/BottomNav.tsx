'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Package, Bell } from 'lucide-react';
import { useStore } from '@/lib/store';

const tabs = [
  { href: '/asesor', icon: Home, label: 'Inicio', exact: true },
  { href: '/asesor/clientes', icon: Users, label: 'Clientes', exact: false },
  { href: '/asesor/pedidos', icon: Package, label: 'Pedidos', exact: false },
  { href: '/asesor/notificaciones', icon: Bell, label: 'Avisos', exact: false },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { state } = useStore();
  const unread = state.notifications.filter((n) => !n.read).length;

  function isActive(tab: typeof tabs[0]) {
    if (tab.exact) return pathname === tab.href;
    return pathname.startsWith(tab.href);
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-bottom">
      <div className="max-w-md mx-auto flex">
        {tabs.map((tab) => {
          const active = isActive(tab);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors ${
                active ? 'text-red-600' : 'text-gray-500'
              }`}
            >
              <span className="relative">
                <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
                {tab.href.includes('notificaciones') && unread > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[14px] h-[14px] flex items-center justify-center px-0.5">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </span>
              <span className={`text-[10px] font-medium ${active ? 'text-red-600' : 'text-gray-500'}`}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
