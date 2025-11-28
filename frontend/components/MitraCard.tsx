import Link from 'next/link';

interface Mitra {
    _id: string;
    nama: string;
    organisasi: string;
    avatar: string;
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

    return (
        <Link href={`/mitra/${mitra.slug}`}>
            <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer h-full flex flex-col">
                {/* Avatar/Image Section */}
                <div className="relative h-48 bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0">
                    {mitra.avatar ? (
                        <img
                            src={mitra.avatar}
                            alt={mitra.nama}
                            className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                if (fallback) fallback.style.display = 'flex';
                            }}
                        />
                    ) : null}
                    <div
                        className={`w-32 h-32 rounded-full bg-white/20 backdrop-blur-sm border-4 border-white flex items-center justify-center text-white text-4xl font-bold shadow-lg ${mitra.avatar ? 'hidden' : 'flex'}`}
                    >
                        {getInitials(mitra.nama)}
                    </div>

                    <span className="absolute top-2 right-2 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                        Mitra
                    </span>
                </div>

                {/* Content */}
                <div className="p-4 flex flex-col grow">
                    <h3 className="font-bold text-xl mb-2 text-gray-800 text-center line-clamp-2 h-14">
                        {mitra.nama}
                    </h3>

                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                        <div className="flex items-start justify-center">
                            <svg
                                className="w-5 h-5 mr-2 shrink-0 text-blue-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                />
                            </svg>
                            <span className="line-clamp-2 text-center">{mitra.organisasi || 'Organisasi Event'}</span>
                        </div>

                        {mitra.bio && (
                            <div className="flex items-start justify-center pt-2">
                                <svg
                                    className="w-5 h-5 mr-2 shrink-0 text-blue-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                                <span className="line-clamp-2 text-center">{mitra.bio}</span>
                            </div>
                        )}
                    </div>

                    <div className="mt-auto">
                        <button className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition font-medium shadow-sm hover:shadow-md">
                            Lihat Profil
                        </button>
                    </div>
                </div>
            </div>
        </Link>
    );
}
