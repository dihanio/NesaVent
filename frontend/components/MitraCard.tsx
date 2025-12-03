import Link from 'next/link';

interface Mitra {
    _id: string;
    nama: string;
    organisasi: string;
    avatar: string;
    coverImage?: string;
    themeColor?: string;
    slug: string;
    bio?: string;
}

interface MitraCardProps {
    mitra: Mitra;
}

export default function MitraCard({ mitra }: MitraCardProps) {
    // Get initials for fallback avatar
    const getInitials = (nama: string) => {
        return nama
            .split(' ')
            .map((word) => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    // Get color classes based on theme
    const themeColor = mitra.themeColor || 'blue';
    const colorClasses = {
        blue: {
            gradient: 'from-blue-600 via-blue-600 to-indigo-600',
            badge: 'text-blue-700',
            avatar: 'from-blue-500 to-indigo-600',
            ring: 'ring-blue-100',
            button: 'from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
        },
        indigo: {
            gradient: 'from-indigo-600 via-indigo-600 to-purple-600',
            badge: 'text-indigo-700',
            avatar: 'from-indigo-500 to-purple-600',
            ring: 'ring-indigo-100',
            button: 'from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'
        },
        purple: {
            gradient: 'from-purple-600 via-purple-600 to-pink-600',
            badge: 'text-purple-700',
            avatar: 'from-purple-500 to-pink-600',
            ring: 'ring-purple-100',
            button: 'from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
        },
        pink: {
            gradient: 'from-pink-600 via-pink-600 to-rose-600',
            badge: 'text-pink-700',
            avatar: 'from-pink-500 to-rose-600',
            ring: 'ring-pink-100',
            button: 'from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700'
        },
        red: {
            gradient: 'from-red-600 via-red-600 to-orange-600',
            badge: 'text-red-700',
            avatar: 'from-red-500 to-orange-600',
            ring: 'ring-red-100',
            button: 'from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700'
        },
        orange: {
            gradient: 'from-orange-600 via-orange-600 to-amber-600',
            badge: 'text-orange-700',
            avatar: 'from-orange-500 to-amber-600',
            ring: 'ring-orange-100',
            button: 'from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700'
        },
        yellow: {
            gradient: 'from-yellow-500 via-yellow-500 to-amber-500',
            badge: 'text-yellow-700',
            avatar: 'from-yellow-400 to-amber-500',
            ring: 'ring-yellow-100',
            button: 'from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600'
        },
        green: {
            gradient: 'from-green-600 via-green-600 to-emerald-600',
            badge: 'text-green-700',
            avatar: 'from-green-500 to-emerald-600',
            ring: 'ring-green-100',
            button: 'from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
        },
        teal: {
            gradient: 'from-teal-600 via-teal-600 to-cyan-600',
            badge: 'text-teal-700',
            avatar: 'from-teal-500 to-cyan-600',
            ring: 'ring-teal-100',
            button: 'from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700'
        },
        cyan: {
            gradient: 'from-cyan-600 via-cyan-600 to-sky-600',
            badge: 'text-cyan-700',
            avatar: 'from-cyan-500 to-sky-600',
            ring: 'ring-cyan-100',
            button: 'from-cyan-600 to-sky-600 hover:from-cyan-700 hover:to-sky-700'
        }
    };

    const colors = colorClasses[themeColor as keyof typeof colorClasses] || colorClasses.blue;

    return (
        <Link href={`/mitra/${mitra.slug}`}>
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer h-full flex flex-col">
                {/* Cover Banner Section */}
                <div className={`relative h-32 bg-linear-to-r ${colors.gradient} overflow-hidden shrink-0`}>
                    {mitra.coverImage ? (
                        <img
                            src={mitra.coverImage}
                            alt={`${mitra.nama} cover`}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className={`absolute inset-0 bg-linear-to-r ${colors.gradient}`}>
                            <div className="absolute inset-0 opacity-20">
                                <div className="absolute top-2 left-4 w-16 h-16 bg-white rounded-full blur-2xl"></div>
                                <div className="absolute bottom-2 right-4 w-20 h-20 bg-white rounded-full blur-2xl"></div>
                            </div>
                        </div>
                    )}
                    
                    <span className={`absolute top-2 right-2 bg-white/90 backdrop-blur-sm ${colors.badge} px-3 py-1 rounded-full text-xs font-bold shadow-lg`}>
                        ✓ Mitra
                    </span>
                </div>

                {/* Avatar Section - Overlapping Cover */}
                <div className="relative flex justify-center -mt-16 mb-2 px-4">
                    {mitra.avatar ? (
                        <img
                            src={mitra.avatar}
                            alt={mitra.nama}
                            className={`w-28 h-28 rounded-full object-cover border-4 border-white shadow-xl ring-2 ${colors.ring}`}
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                if (fallback) fallback.style.display = 'flex';
                            }}
                        />
                    ) : null}
                    <div
                        className={`w-28 h-28 rounded-full bg-linear-to-br ${colors.avatar} border-4 border-white flex items-center justify-center text-white text-3xl font-bold shadow-xl ring-2 ${colors.ring} ${mitra.avatar ? 'hidden' : 'flex'}`}
                    >
                        {getInitials(mitra.organisasi || mitra.nama)}
                    </div>
                </div>

                {/* Content */}
                <div className="px-4 pb-4 pt-2 flex flex-col grow">
                    <h3 className="font-bold text-lg mb-1 text-gray-900 text-center line-clamp-2">
                        {mitra.organisasi || mitra.nama}
                    </h3>


                    <div className="mt-auto">
                        <button className={`w-full bg-linear-to-r ${colors.button} text-white py-2.5 rounded-xl transition-all font-semibold shadow-md hover:shadow-lg`}>
                            Lihat Profil
                        </button>
                    </div>
                </div>
            </div>
        </Link>
    );
}
