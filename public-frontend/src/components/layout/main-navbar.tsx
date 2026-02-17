'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useLanguage } from '@/context/language-context';
import { content } from '@/lib/content';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiChevronDown, FiChevronRight, FiMenu, FiX } from 'react-icons/fi';

export default function Navbar() {
    const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [mobileExpanded, setMobileExpanded] = useState<number | null>(null);
    const { language, toggleLanguage } = useLanguage();
    const navRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const t = content[language].nav;

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (navRef.current && !navRef.current.contains(e.target as Node)) {
                setActiveDropdown(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMouseEnter = (index: number) => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setActiveDropdown(index);
    };

    const handleMouseLeave = () => {
        timeoutRef.current = setTimeout(() => {
            setActiveDropdown(null);
        }, 200);
    };

    return (
        <nav ref={navRef} className="fixed top-0 left-0 right-0 z-50">
            {/* ===== SINGLE WHITE NAVBAR ===== */}
            <div className="bg-white shadow-md border-b border-gray-100">
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Top row: utility links */}
                    <div className="flex items-center justify-end gap-1 h-9 border-b border-gray-100">
                        {t.topLinks.map((link, i) => (
                            <Link
                                key={i}
                                href={link.href}
                                className="px-2.5 py-1 text-gray-500 hover:text-[#c4122f] transition-colors text-xs font-medium"
                            >
                                {link.label}
                            </Link>
                        ))}

                        <button
                            onClick={toggleLanguage}
                            className="px-2.5 py-1 text-[#2a9fa8] hover:text-[#1d8088] font-semibold text-xs cursor-pointer"
                        >
                            {language === 'en' ? 'मराठी' : 'English'}
                        </button>

                        <Link
                            href="/donate"
                            className="bg-[#c4122f] hover:bg-[#a00f27] text-white px-4 py-1 rounded-full text-[11px] font-bold tracking-wider ml-1 transition-colors"
                        >
                            {t.bookNow}
                        </Link>

                        <button className="ml-2 w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors cursor-pointer">
                            <FiSearch className="text-gray-600 text-sm" />
                        </button>
                    </div>

                    {/* Main row: logo + nav items */}
                    <div className="flex items-center h-[70px]">
                        {/* Logo */}
                        <Link href="/" className="flex items-center shrink-0 mr-8 group">
                            <img
                                src="/Blood-Banl-Logo.png"
                                alt="Logo"
                                className="w-auto h-14 md:h-[60px] object-contain filter hue-rotate-[300deg] saturate-[2.6] brightness-[0.30] contrast-[1.25] transition-transform duration-300 group-hover:scale-105"
                            />
                        </Link>

                        {/* Desktop Nav Links - Centered */}
                        <div className="hidden lg:flex items-center justify-center h-full flex-1">
                            {t.mainLinks.map((item, index) => (
                                <div
                                    key={index}
                                    className="relative h-full flex items-center"
                                    onMouseEnter={() => handleMouseEnter(index)}
                                    onMouseLeave={handleMouseLeave}
                                >
                                    <button
                                        className={`flex items-center gap-1.5 px-4 h-full text-[15px] font-semibold transition-colors cursor-pointer border-b-[3px] ${activeDropdown === index
                                            ? 'text-[#c4122f] border-[#c4122f]'
                                            : 'text-gray-700 border-transparent hover:text-[#c4122f]'
                                            }`}
                                        onClick={() => setActiveDropdown(activeDropdown === index ? null : index)}
                                    >
                                        <FiChevronDown className="text-xs" />
                                        {item.label}
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Mobile Hamburger */}
                        <button
                            className="lg:hidden ml-auto p-2 text-gray-700 hover:text-[#c4122f] cursor-pointer"
                            onClick={() => setMobileOpen(!mobileOpen)}
                        >
                            {mobileOpen ? <FiX className="text-2xl" /> : <FiMenu className="text-2xl" />}
                        </button>
                    </div>
                </div>

                {/* ===== MEGA DROPDOWN PANELS ===== */}
                <AnimatePresence>
                    {activeDropdown !== null && t.mainLinks[activeDropdown]?.columns && (
                        <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            transition={{ duration: 0.18 }}
                            className="hidden lg:block absolute left-0 right-0 bg-white border-t-[3px] border-[#54c4cf] shadow-xl z-50"
                            onMouseEnter={() => {
                                if (timeoutRef.current) clearTimeout(timeoutRef.current);
                            }}
                            onMouseLeave={handleMouseLeave}
                        >
                            <div className="max-w-[1400px] mx-auto px-8 py-8">
                                <div className="flex gap-12">
                                    {t.mainLinks[activeDropdown].columns!.map((col, colIdx) => (
                                        <div key={colIdx} className="min-w-[200px]">
                                            <h3 className="text-sm font-bold text-gray-900 mb-2">
                                                {col.title}
                                            </h3>
                                            <div className="w-10 h-0.5 bg-[#c4122f] mb-4"></div>
                                            <ul className="space-y-2">
                                                {col.links.map((link, linkIdx) => (
                                                    <li key={linkIdx}>
                                                        <Link
                                                            href={link.href}
                                                            className="text-sm text-gray-500 hover:text-[#c4122f] hover:underline transition-colors"
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

                                {t.mainLinks[activeDropdown].viewAllLabel && (
                                    <div className="mt-6 flex justify-end">
                                        <Link
                                            href={t.mainLinks[activeDropdown].viewAllHref || '/'}
                                            className="inline-flex items-center gap-2 bg-[#c4122f] hover:bg-[#a00f27] text-white px-5 py-2 rounded text-sm font-bold transition-colors"
                                            onClick={() => setActiveDropdown(null)}
                                        >
                                            {t.mainLinks[activeDropdown].viewAllLabel}
                                            <FiChevronRight className="text-lg" />
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ===== MOBILE MENU ===== */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="lg:hidden overflow-hidden bg-white border-t border-gray-100 shadow-xl"
                    >
                        <div className="max-h-[70vh] overflow-y-auto">
                            <div className="flex flex-wrap gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
                                {t.topLinks.map((link, i) => (
                                    <Link
                                        key={i}
                                        href={link.href}
                                        className="text-xs text-gray-500 hover:text-[#c4122f] transition-colors"
                                        onClick={() => setMobileOpen(false)}
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                                <button
                                    onClick={toggleLanguage}
                                    className="text-xs text-[#2a9fa8] font-semibold cursor-pointer"
                                >
                                    {language === 'en' ? 'मराठी' : 'English'}
                                </button>
                            </div>

                            {t.mainLinks.map((item, index) => (
                                <div key={index} className="border-b border-gray-50">
                                    <button
                                        className="w-full flex items-center justify-between px-5 py-3.5 text-gray-800 font-semibold text-sm hover:bg-gray-50 transition-colors cursor-pointer"
                                        onClick={() => setMobileExpanded(mobileExpanded === index ? null : index)}
                                    >
                                        <span>{item.label}</span>
                                        {item.columns && (
                                            <motion.div
                                                animate={{ rotate: mobileExpanded === index ? 90 : 0 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <FiChevronRight className="text-gray-400" />
                                            </motion.div>
                                        )}
                                    </button>

                                    <AnimatePresence>
                                        {mobileExpanded === index && item.columns && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="overflow-hidden bg-gray-50"
                                            >
                                                {item.columns.map((col, colIdx) => (
                                                    <div key={colIdx} className="px-6 py-3">
                                                        <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
                                                            {col.title}
                                                        </h4>
                                                        <div className="w-8 h-0.5 bg-[#c4122f] mb-3"></div>
                                                        {col.links.map((link, linkIdx) => (
                                                            <Link
                                                                key={linkIdx}
                                                                href={link.href}
                                                                className="block py-1.5 text-sm text-gray-600 hover:text-[#c4122f] transition-colors"
                                                                onClick={() => { setMobileOpen(false); setMobileExpanded(null); }}
                                                            >
                                                                {link.label}
                                                            </Link>
                                                        ))}
                                                    </div>
                                                ))}

                                                {item.viewAllLabel && (
                                                    <div className="px-6 py-3">
                                                        <Link
                                                            href={item.viewAllHref || '/'}
                                                            className="inline-flex items-center gap-1 text-sm font-bold text-[#c4122f] hover:underline"
                                                            onClick={() => { setMobileOpen(false); setMobileExpanded(null); }}
                                                        >
                                                            {item.viewAllLabel}
                                                            <FiChevronRight />
                                                        </Link>
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}

                            <div className="px-5 py-4">
                                <Link
                                    href="/donate"
                                    className="block text-center bg-[#c4122f] hover:bg-[#a00f27] text-white py-3 rounded-lg text-sm font-bold tracking-wider transition-colors"
                                    onClick={() => setMobileOpen(false)}
                                >
                                    {t.bookNow}
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    )
}
