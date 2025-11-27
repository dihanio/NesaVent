import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="bg-white border-t border-gray-200 pt-16 pb-8">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
                    {/* Brand Section */}
                    <div>
                        <Link href="/" className="text-2xl font-extrabold text-blue-600 mb-6 inline-block">
                            NESAVENT
                        </Link>
                        <p className="text-gray-500 leading-relaxed mb-6">
                            Platform tiket event terpercaya untuk mahasiswa dan umum. Temukan event seru, seminar inspiratif, dan konser musik favoritmu di sini.
                        </p>
                        <div className="flex gap-4">
                            {/* Social Media Icons */}
                            {['instagram', 'twitter', 'facebook', 'linkedin'].map((social) => (
                                <a
                                    key={social}
                                    href={`#${social}`}
                                    className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-blue-600 hover:text-white transition-all duration-300"
                                >
                                    <span className="sr-only">{social}</span>
                                    <div className="w-5 h-5 bg-current rounded-sm opacity-50"></div> {/* Placeholder for icon */}
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="font-bold text-gray-900 text-lg mb-6">Tautan Cepat</h3>
                        <ul className="space-y-4">
                            <li>
                                <Link href="/" className="text-gray-500 hover:text-blue-600 transition">
                                    Beranda
                                </Link>
                            </li>
                            <li>
                                <Link href="/events" className="text-gray-500 hover:text-blue-600 transition">
                                    Jelajahi Event
                                </Link>
                            </li>
                            <li>
                                <Link href="/about" className="text-gray-500 hover:text-blue-600 transition">
                                    Tentang Kami
                                </Link>
                            </li>
                            <li>
                                <Link href="/contact" className="text-gray-500 hover:text-blue-600 transition">
                                    Hubungi Kami
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Categories */}
                    <div>
                        <h3 className="font-bold text-gray-900 text-lg mb-6">Kategori Populer</h3>
                        <ul className="space-y-4">
                            <li>
                                <Link href="/events?kategori=Musik" className="text-gray-500 hover:text-blue-600 transition">
                                    Konser Musik
                                </Link>
                            </li>
                            <li>
                                <Link href="/events?kategori=Seminar" className="text-gray-500 hover:text-blue-600 transition">
                                    Seminar & Talkshow
                                </Link>
                            </li>
                            <li>
                                <Link href="/events?kategori=Workshop" className="text-gray-500 hover:text-blue-600 transition">
                                    Workshop & Pelatihan
                                </Link>
                            </li>
                            <li>
                                <Link href="/events?kategori=Olahraga" className="text-gray-500 hover:text-blue-600 transition">
                                    Olahraga
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h3 className="font-bold text-gray-900 text-lg mb-6">Hubungi Kami</h3>
                        <ul className="space-y-4 text-gray-500">
                            <li className="flex items-start gap-3">
                                <span className="mt-1">📍</span>
                                <span>Jl. Ketintang No. 12, Surabaya, Jawa Timur, Indonesia</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <span>📧</span>
                                <a href="mailto:support@nesavent.com" className="hover:text-blue-600 transition">
                                    support@nesavent.com
                                </a>
                            </li>
                            <li className="flex items-center gap-3">
                                <span>📞</span>
                                <a href="tel:+6281234567890" className="hover:text-blue-600 transition">
                                    +62 812 3456 7890
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-gray-400 text-sm text-center md:text-left">
                        © {new Date().getFullYear()} NESAVENT. All rights reserved.
                    </p>
                    <div className="flex gap-6 text-sm text-gray-400">
                        <Link href="/privacy" className="hover:text-blue-600 transition">
                            Privacy Policy
                        </Link>
                        <Link href="/terms" className="hover:text-blue-600 transition">
                            Terms of Service
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
