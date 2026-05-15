'use client'

import { useState, useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Droplets, Menu, X, ChevronDown, ChevronRight, Globe, Search } from 'lucide-react'
import { useLanguage } from '@/context/language-context'
import { content } from '@/lib/content'

export default function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false)
    const [mobileOpen, setMobileOpen] = useState(false)
    const [activeDropdown, setActiveDropdown] = useState<number | null>(null)
    const [mobileExpanded, setMobileExpanded] = useState<number | null>(null)
    const { language, toggleLanguage } = useLanguage()
    const pathname = usePathname()

    const isOnsiteDonorPage = pathname?.startsWith('/onsite-donor')

    const timeoutRef = useRef<NodeJS.Timeout | null>(null)
    const navRef = useRef<HTMLDivElement>(null)

    const t = content[language].nav

    useEffect(() => {
        if (isOnsiteDonorPage) return
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20)
        }

        const handleClickOutside = (e: MouseEvent) => {
            if (navRef.current && !navRef.current.contains(e.target as Node)) {
                setActiveDropdown(null)
            }
        }

        window.addEventListener('scroll', handleScroll)
        document.addEventListener('mousedown', handleClickOutside)

        return () => {
            window.removeEventListener('scroll', handleScroll)
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])

    const handleMouseEnter = (index: number) => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        setActiveDropdown(index)
    }

    const handleMouseLeave = () => {
        timeoutRef.current = setTimeout(() => {
            setActiveDropdown(null)
        }, 300)
    }

    if (isOnsiteDonorPage) return null

    return (
        <nav
            ref={navRef}
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled ? 'bg-white/95 backdrop-blur-md shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)]' : 'bg-white'
                }`}
        >
            {/* Top Bar (Subtle) */}
            <div className="bg-gray-50/80 border-b border-gray-100/50 py-1.5 overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 md:px-8 flex justify-end">
                    <Link
                        href="/hospital-services"
                        className="text-[10px] md:text-[11px] font-semibold text-gray-400 hover:text-gray-900 transition-colors tracking-widest uppercase font-inter"
                    >
                        Hospital Services
                    </Link>
                </div>
            </div>

            {/* Main Navbar */}
            <div className={`max-w-7xl mx-auto px-4 md:px-8 transition-all duration-500 ${isScrolled ? 'py-3' : 'py-5'
                }`}>
                <div className="flex items-center justify-between">
                    {/* Logo Section */}
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="relative">
                            <div className="bg-rose-50 p-2 rounded-xl group-hover:bg-rose-100 transition-colors">
                                <Droplets className="text-[#8B0000] w-6 h-6 fill-[#8B0000]/10" />
                            </div>
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#8B0000] rounded-full border-2 border-white animate-pulse"></div>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xl md:text-2xl font-poppins font-bold text-gray-900 tracking-tight leading-none">
                                Blood<span className="text-[#8B0000]">Bank</span>
                            </span>
                            <span className="text-[10px] text-gray-400 font-medium tracking-[0.2em] uppercase leading-none mt-1">
                                Kopargaon
                            </span>
                        </div>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden lg:flex items-center gap-2">
                        {t.mainLinks.map((item, index) => (
                            <div
                                key={index}
                                className="relative h-full flex items-center"
                                onMouseEnter={() => handleMouseEnter(index)}
                                onMouseLeave={handleMouseLeave}
                            >
                                <Link
                                    href={item.href}
                                    className={`flex items-center gap-1 px-4 py-2 text-[15px] font-semibold transition-all duration-300 rounded-lg group ${activeDropdown === index
                                            ? 'bg-rose-50 text-[#8B0000]'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                        }`}
                                >
                                    {item.label}
                                    {item.columns && (
                                        <ChevronDown size={14} className={`transition-transform duration-300 ${activeDropdown === index ? 'rotate-180' : ''}`} />
                                    )}
                                </Link>
                            </div>
                        ))}
                    </div>

                    {/* Primary CTA & Tools */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={toggleLanguage}
                            className="flex items-center gap-2 text-[13px] font-bold text-[#2a9fa8] hover:text-[#1d8088] uppercase tracking-wider transition-colors px-3 py-2 rounded-lg hover:bg-gray-50"
                        >
                            <Globe size={18} />
                            <span>{language === 'en' ? 'मराठी' : 'English'}</span>
                        </button>
                        <Link
                            href="/donate"
                            className="hidden md:flex items-center gap-2.5 bg-[#8B0000] hover:bg-[#700000] text-white px-8 py-3 rounded-full text-sm font-bold transition-all shadow-[0_4px_14px_0_rgba(139,0,0,0.39)] hover:shadow-[0_6px_20px_rgba(139,0,0,0.23)] active:scale-95 font-poppins"
                        >
                            <Heart className="w-4 h-4 fill-white" />
                            {t.bookNow}
                        </Link>

                        <button
                            className="lg:hidden p-2.5 text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all active:scale-95 border border-transparent hover:border-gray-200"
                            onClick={() => setMobileOpen(!mobileOpen)}
                        >
                            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Desktop Mega Dropdown Panel */}
            <AnimatePresence>
                {activeDropdown !== null && t.mainLinks[activeDropdown]?.columns && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        onMouseEnter={() => { if (timeoutRef.current) clearTimeout(timeoutRef.current) }}
                        onMouseLeave={handleMouseLeave}
                        className="hidden lg:block absolute left-0 right-0 bg-white border-t border-gray-100 shadow-2xl z-50 overflow-hidden"
                    >
                        <div className="max-w-7xl mx-auto px-8 py-10">
                            <div className="grid grid-cols-12 gap-8">
                                <div className="col-span-12 grid grid-cols-3 gap-8">
                                    {t.mainLinks[activeDropdown].columns!.map((col, colIdx) => (
                                        <div key={colIdx} className="space-y-4">
                                            <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest border-l-2 border-[#8B0000] pl-3">
                                                {col.title}
                                            </h3>
                                            <ul className="space-y-2.5">
                                                {col.links.map((link, linkIdx) => (
                                                    <li key={linkIdx}>
                                                        <Link
                                                            href={link.href}
                                                            className="text-sm text-gray-500 hover:text-[#8B0000] hover:translate-x-1 inline-flex items-center gap-1 transition-all"
                                                            onClick={() => setActiveDropdown(null)}
                                                        >
                                                            {link.label}
                                                        </Link>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>


            {/* Mobile Menu */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="lg:hidden absolute top-full left-4 right-4 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-[60] mt-2"
                    >
                        <div className="p-6 flex flex-col gap-2">
                            {t.mainLinks.map((item, index) => (
                                <div key={index} className="flex flex-col">
                                    <button
                                        className="w-full text-lg font-bold text-gray-800 hover:text-[#8B0000] py-3 transition-colors font-inter flex items-center justify-between"
                                        onClick={() => setMobileExpanded(mobileExpanded === index ? null : index)}
                                    >
                                        {item.label}
                                        {item.columns && (
                                            <motion.div
                                                animate={{ rotate: mobileExpanded === index ? 180 : 0 }}
                                                className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center"
                                            >
                                                <ChevronDown size={18} className="text-gray-400" />
                                            </motion.div>
                                        )}
                                    </button>

                                    <AnimatePresence>
                                        {mobileExpanded === index && item.columns && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden bg-gray-50/50 rounded-2xl px-4"
                                            >
                                                {item.columns.map((col, colIdx) => (
                                                    <div key={colIdx} className="py-3">
                                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-2">
                                                            {col.title}
                                                        </h4>
                                                        <div className="grid grid-cols-1 gap-1">
                                                            {col.links.map((link, linkIdx) => (
                                                                <Link
                                                                    key={linkIdx}
                                                                    href={link.href}
                                                                    className="block py-2 px-2 text-sm font-semibold text-gray-600 hover:text-[#8B0000] transition-colors"
                                                                    onClick={() => setMobileOpen(false)}
                                                                >
                                                                    {link.label}
                                                                </Link>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}

                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}

                            <div className="pt-4 mt-2 border-t border-gray-100 flex flex-col gap-4">
                                <Link
                                    href="/hospital-services"
                                    className="text-xs font-bold text-gray-400 hover:text-gray-900 font-inter tracking-widest uppercase py-1"
                                    onClick={() => setMobileOpen(false)}
                                >
                                    Hospital Services
                                </Link>
                                <Link
                                    href="/donate"
                                    className="flex items-center justify-center gap-3 bg-[#8B0000] text-white px-6 py-4 rounded-2xl text-[15px] font-bold shadow-lg font-poppins active:scale-95 transition-transform"
                                    onClick={() => setMobileOpen(false)}
                                >
                                    <Heart className="w-5 h-5 fill-white" />
                                    {t.bookNow}
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Backdrop */}
            {mobileOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-gray-900/10 backdrop-blur-sm -z-10 lg:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}
        </nav>
    )
}
