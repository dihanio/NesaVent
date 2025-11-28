'use client';

import { usePathname, useRouter } from 'next/navigation';
import { authService } from '@/lib/auth';
import { useEffect, useState } from 'react';
import AdminDashboardLayout from './dashboard/AdminDashboardLayout';
import MitraDashboardLayout from './dashboard/MitraDashboardLayout';
import UserDashboardLayout from './dashboard/UserDashboardLayout';

interface User {
  _id: string;
  nama: string;
  email: string;
  role: 'admin' | 'mitra' | 'user';
  organisasi?: string;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = authService.getCurrentUser();
    setUser(userData);
    setLoading(false);
  }, [pathname]);

  useEffect(() => {
    if (user) {
      // Access Control Logic
      const checkAccess = () => {
        if (user.role === 'user') {
          const restrictedPaths = ['/dashboard/events', '/dashboard/orders', '/dashboard/withdrawals', '/dashboard/users', '/dashboard/admin-', '/dashboard/analytics'];
          if (restrictedPaths.some(path => pathname.startsWith(path))) {
            router.push('/dashboard');
          }
        } else if (user.role === 'mitra') {
          const restrictedPaths = ['/dashboard/users', '/dashboard/admin-'];
          if (restrictedPaths.some(path => pathname.startsWith(path))) {
            router.push('/dashboard');
          }
        }
      };

      checkAccess();
    }
  }, [user, pathname, router]);

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>;
  }

  if (!user) {
    return null; // Or redirect to login
  }

  if (user.role === 'admin') {
    return <AdminDashboardLayout user={user}>{children}</AdminDashboardLayout>;
  }

  if (user.role === 'mitra') {
    return <MitraDashboardLayout user={user}>{children}</MitraDashboardLayout>;
  }

  return <UserDashboardLayout user={user}>{children}</UserDashboardLayout>;
}
