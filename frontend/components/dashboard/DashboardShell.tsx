'use client';

import { usePathname, useRouter } from 'next/navigation';
import { authService } from '@/lib/auth';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { formatTanggal } from '@/lib/formatters';
import Link from 'next/link';

interface User {
    _id: string;
    nama: string;
    email: string;
    role: 'admin' | 'mitra' | 'user';
    organisasi?: string;
}

interface Notification {
    _id: string;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
    relatedEvent?: { _id: string; nama: string };
    relatedOrder?: { _id: string; totalHarga: number };
    relatedWithdrawal?: { _id: string; jumlah: number };
}

export interface MenuItem {
    name: string;
    href: string;
    icon: React.ReactElement;
    hasSubmenu?: boolean;
    submenu?: { name: string; href: string }[];
}

interface DashboardShellProps {
    children: React.ReactNode;
    menuItems: MenuItem[];
    user: User | null;
}

export default function DashboardShell({ children, menuItems, user }: DashboardShellProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifDropdown, setShowNotifDropdown] = useState(false);

    const fetchNotifications = async () => {
        try {
            const response = await api.get('/notifications?page=1&limit=5');
            setNotifications(response.data.notifications);
            setUnreadCount(response.data.unreadCount);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    useEffect(() => {
        // Check if mobile
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
            if (window.innerWidth >= 768) {
                setSidebarOpen(true);
            } else {
                setSidebarOpen(false);
            }
        };

        checkMobile();

        // Remove initial load flag after first render
        setTimeout(() => setIsInitialLoad(false), 100);

        window.addEventListener('resize', checkMobile);

        return () => window.removeEventListener('resize', checkMobile);
    }, [pathname]);

    useEffect(() => {
        if (user) {
            fetchNotifications();
            // Poll notifications every 30 seconds
            const interval = setInterval(fetchNotifications, 30000);
            return () => clearInterval(interval);
        }
    }, [user]);

    const markAsRead = async (id: string) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(prev =>
                prev.map(notif =>
                    notif._id === id ? { ...notif, isRead: true } : notif
                )
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.isRead) {
            markAsRead(notification._id);
        }
        setShowNotifDropdown(false);

        // Navigate to related page
        if (notification.relatedEvent) {
            router.push('/dashboard/events');
        } else if (notification.relatedOrder) {
            router.push('/dashboard/orders');
        } else if (notification.relatedWithdrawal) {
            router.push('/dashboard/withdrawals');
        }
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'event_approved': return '🎉';
            case 'event_rejected': return '❌';
            case 'new_order': return '🎫';
            case 'withdrawal_processed': return '💰';
            case 'withdrawal_rejected': return '❌';
            case 'event_reminder': return '⏰';
            default: return '📢';
        }
    };

    const handleLogout = () => {
        authService.logout();
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Mobile Overlay */}
            {isMobile && sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar - Desktop */}
            <aside
                className={`fixed top-0 left-0 h-full bg-white border-r-2 border-blue-100 shadow-xl z-40 hidden md:block ${!isInitialLoad ? 'transition-all duration-300' : ''} ${sidebarOpen ? 'w-64' : 'w-20'
                    }`}
            >
                {/* Sidebar Header */}
                <div className="h-16 flex items-center justify-between px-4 border-b-2 border-blue-100 bg-blue-600">
                    {sidebarOpen && (
                        <h1 className="text-xl font-bold text-white">Dashboard</h1>
                    )}
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-2 rounded-lg hover:bg-white/20 transition text-white"
                    >
                        <svg
                            className={`w-5 h-5 transition-transform ${sidebarOpen ? '' : 'rotate-180'}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                        </svg>
                    </button>
                </div>

                {/* User Info */}
                {user && (
                    <div className={`p-4 border-b-2 border-blue-100 ${!sidebarOpen && 'flex justify-center'}`}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shrink-0">
                                {user.nama?.charAt(0).toUpperCase()}
                            </div>
                            {sidebarOpen && (
                                <div className="overflow-hidden">
                                    <p className="font-semibold text-gray-900 truncate">{user.nama}</p>
                                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                    {user.organisasi && (
                                        <p className="text-xs text-blue-600 font-medium truncate">{user.organisasi}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Menu Items */}
                <nav className="p-3 space-y-1 pb-20">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

                        if (item.hasSubmenu) {
                            return (
                                <div key={item.href}>
                                    <button
                                        onClick={() => router.push(item.href)}
                                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${isActive
                                                ? 'bg-blue-600 text-white shadow-md'
                                                : 'text-gray-700 hover:bg-blue-50'
                                            } ${!sidebarOpen && 'justify-center'}`}
                                    >
                                        {item.icon}
                                        {sidebarOpen && <span className="font-medium flex-1 text-left">{item.name}</span>}
                                    </button>

                                    {/* Submenu - Always visible when sidebar is open */}
                                    {sidebarOpen && item.submenu && (
                                        <div className="ml-8 mt-1 space-y-1">
                                            {item.submenu.map((subItem) => {
                                                const isSubActive = pathname === subItem.href;
                                                return (
                                                    <button
                                                        key={subItem.href}
                                                        onClick={() => router.push(subItem.href)}
                                                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${isSubActive
                                                                ? 'bg-blue-100 text-blue-700 font-medium'
                                                                : 'text-gray-600 hover:bg-blue-50'
                                                            }`}
                                                    >
                                                        {subItem.name}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        }

                        return (
                            <button
                                key={item.href}
                                onClick={() => router.push(item.href)}
                                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${isActive
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'text-gray-700 hover:bg-blue-50'
                                    } ${!sidebarOpen && 'justify-center'}`}
                            >
                                {item.icon}
                                {sidebarOpen && <span className="font-medium">{item.name}</span>}
                            </button>
                        );
                    })}
                </nav>

                {/* Logout Button */}
                <div className="absolute bottom-0 left-0 right-0 p-3 border-t-2 border-blue-100 bg-white">
                    <button
                        onClick={handleLogout}
                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all ${!sidebarOpen && 'justify-center'
                            }`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        {sidebarOpen && <span className="font-medium">Keluar</span>}
                    </button>
                </div>
            </aside>

            {/* Bottom Navigation - Mobile */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-blue-100 shadow-2xl z-50 md:hidden">
                <div className="flex items-center justify-around px-2 py-3">
                    {/* Filter to show only essential menu items for mobile */}
                    {menuItems
                        .filter((item) => {
                            // Show only these essential menus in bottom navigation
                            const essentialMenus = [
                                '/dashboard',
                                '/dashboard/my-tickets',
                                '/dashboard/my-orders',
                                '/dashboard/profile'
                            ];
                            return essentialMenus.includes(item.href);
                        })
                        .map((item) => {
                            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

                            return (
                                <button
                                    key={item.href}
                                    onClick={() => router.push(item.href)}
                                    className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl ${isActive
                                            ? 'text-blue-600'
                                            : 'text-gray-500'
                                        }`}
                                >
                                    <div className={`${isActive ? 'scale-110' : ''}`}>
                                        {item.icon}
                                    </div>
                                    <span className={`text-xs font-medium ${isActive ? 'text-blue-600' : 'text-gray-600'}`}>
                                        {item.name}
                                    </span>
                                </button>
                            );
                        })}
                </div>
            </nav>

            {/* Main Content */}
            <main
                className={`${isMobile ? '' : (!isInitialLoad ? 'transition-all duration-300' : '')} ${isMobile ? '' : (sidebarOpen ? 'ml-64' : 'ml-20')
                    }`}
            >
                {/* Top Bar */}
                <div className="h-16 bg-white border-b-2 border-blue-100 flex items-center justify-between px-4 md:px-6 shadow-sm sticky top-0 z-30">
                    <div className="flex items-center gap-3 md:gap-4">
                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="md:hidden p-2 rounded-lg hover:bg-blue-50 transition text-blue-600"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>

                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h2 className="text-lg md:text-xl font-bold text-blue-600">
                            NesaVent
                        </h2>
                    </div>
                    <div className="flex items-center gap-2 md:gap-4">
                        {/* Notification Bell */}
                        <div className="relative">
                            <button
                                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                                className="relative p-2 rounded-lg hover:bg-blue-50 transition text-gray-700"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </button>

                            {/* Notification Dropdown */}
                            {showNotifDropdown && (
                                <>
                                    {/* Backdrop */}
                                    <div
                                        className="fixed inset-0 z-30"
                                        onClick={() => setShowNotifDropdown(false)}
                                    />

                                    {/* Dropdown Content */}
                                    <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-xl shadow-2xl border-2 border-gray-100 z-40 max-h-128 overflow-hidden flex flex-col">
                                        {/* Header */}
                                        <div className="p-4 border-b border-gray-200 bg-linear-to-r from-blue-600 to-blue-500">
                                            <div className="flex items-center justify-between">
                                                <h3 className="font-bold text-white text-lg">Notifikasi</h3>
                                                {unreadCount > 0 && (
                                                    <span className="px-2 py-1 bg-white text-blue-600 rounded-full text-xs font-bold">
                                                        {unreadCount} Baru
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Notifications List */}
                                        <div className="overflow-y-auto flex-1">
                                            {notifications.length === 0 ? (
                                                <div className="p-8 text-center">
                                                    <div className="text-5xl mb-3">📭</div>
                                                    <p className="text-gray-500 text-sm">Tidak ada notifikasi</p>
                                                </div>
                                            ) : (
                                                notifications.map((notification) => (
                                                    <div
                                                        key={notification._id}
                                                        onClick={() => handleNotificationClick(notification)}
                                                        className={`p-4 border-b border-gray-100 cursor-pointer transition ${!notification.isRead ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-gray-50'
                                                            }`}
                                                    >
                                                        <div className="flex gap-3">
                                                            <div className="shrink-0 text-2xl">
                                                                {getNotificationIcon(notification.type)}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-start justify-between gap-2 mb-1">
                                                                    <h4 className={`font-semibold text-sm ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                                                                        {notification.title}
                                                                    </h4>
                                                                    {!notification.isRead && (
                                                                        <span className="shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-1"></span>
                                                                    )}
                                                                </div>
                                                                <p className="text-xs text-gray-600 line-clamp-2 mb-1">
                                                                    {notification.message}
                                                                </p>
                                                                <p className="text-xs text-gray-400">
                                                                    {formatTanggal(notification.createdAt)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>

                                        {/* Footer */}
                                        {notifications.length > 0 && (
                                            <div className="p-3 border-t border-gray-200 bg-gray-50">
                                                <button
                                                    onClick={() => {
                                                        setShowNotifDropdown(false);
                                                        router.push('/dashboard/notifications');
                                                    }}
                                                    className="w-full py-2 text-center text-blue-600 hover:text-blue-700 font-semibold text-sm hover:bg-blue-50 rounded-lg transition"
                                                >
                                                    Lihat Semua Notifikasi
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>

                        <span className="px-2 md:px-4 py-1 md:py-2 bg-yellow-100 text-blue-700 rounded-lg text-xs md:text-sm font-medium">
                            {user?.role === 'admin' ? '👑' : user?.role === 'mitra' ? '🤝' : '👤'}
                            <span className="hidden md:inline ml-1">
                                {user?.role === 'admin' ? 'Admin' : user?.role === 'mitra' ? 'Mitra' : 'User'}
                            </span>
                        </span>
                    </div>
                </div>

                {/* Page Content */}
                <div className="p-4 md:p-6 pb-20 md:pb-6">
                    {children}
                </div>
            </main>

            {/* Mobile Sidebar Drawer */}
            <aside
                className={`fixed top-0 left-0 h-full bg-white shadow-2xl z-40 md:hidden w-72 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                {/* Mobile Sidebar Header */}
                <div className="h-16 flex items-center justify-between px-4 border-b-2 border-blue-100 bg-linear-to-r from-blue-600 to-blue-500">
                    <h1 className="text-xl font-bold text-white">Dashboard</h1>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="p-2 rounded-lg hover:bg-white/20 transition text-white"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* User Info */}
                {user && (
                    <div className="p-4 border-b-2 border-blue-100 bg-linear-to-r from-blue-50 to-blue-100">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-lg">
                                {user.nama?.charAt(0).toUpperCase()}
                            </div>
                            <div className="overflow-hidden">
                                <p className="font-semibold text-gray-900 truncate">{user.nama}</p>
                                <p className="text-xs text-gray-600 truncate">{user.email}</p>
                                {user.organisasi && (
                                    <p className="text-xs text-blue-600 font-medium truncate mt-1">📍 {user.organisasi}</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Mobile Menu Items */}
                <nav className="p-3 space-y-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 220px)' }}>
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

                        if (item.hasSubmenu) {
                            return (
                                <div key={item.href}>
                                    <button
                                        onClick={() => {
                                            router.push(item.href);
                                            setSidebarOpen(false);
                                        }}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                                ? 'bg-blue-600 text-white shadow-md'
                                                : 'text-gray-700 hover:bg-blue-50'
                                            }`}
                                    >
                                        {item.icon}
                                        <span className="font-medium flex-1 text-left">{item.name}</span>
                                    </button>

                                    {/* Submenu */}
                                    {item.submenu && (
                                        <div className="ml-8 mt-1 space-y-1">
                                            {item.submenu.map((subItem) => {
                                                const isSubActive = pathname === subItem.href;
                                                return (
                                                    <button
                                                        key={subItem.href}
                                                        onClick={() => {
                                                            router.push(subItem.href);
                                                            setSidebarOpen(false);
                                                        }}
                                                        className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-all ${isSubActive
                                                                ? 'bg-blue-100 text-blue-700 font-medium'
                                                                : 'text-gray-600 hover:bg-blue-50'
                                                            }`}
                                                    >
                                                        {subItem.name}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        }

                        return (
                            <button
                                key={item.href}
                                onClick={() => {
                                    router.push(item.href);
                                    setSidebarOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'text-gray-700 hover:bg-blue-50'
                                    }`}
                            >
                                {item.icon}
                                <span className="font-medium">{item.name}</span>
                            </button>
                        );
                    })}
                </nav>

                {/* Mobile Logout Button */}
                <div className="absolute bottom-0 left-0 right-0 p-3 border-t-2 border-blue-100 bg-white">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span className="font-medium">Keluar</span>
                    </button>
                </div>
            </aside>
        </div>
    );
}
