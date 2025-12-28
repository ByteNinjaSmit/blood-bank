'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FaYoutube, FaFacebook, FaLinkedin, FaHome, FaInfo, FaImage, FaUser } from "react-icons/fa";
import { IoInformationCircle } from "react-icons/io5";
import { GrInstagram } from "react-icons/gr";
import { useLanguage } from '@/context/language-context';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { content } from '@/lib/content';

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false)
    const [isScrolled, setIsScrolled] = useState(false)
    const { language, toggleLanguage } = useLanguage();
    const { scrollY } = useScroll();

    useMotionValueEvent(scrollY, "change", (latest) => {
        setIsScrolled(latest > 20);
    });

    const t = content[language].nav;

    const navLinks = [
        { label: t.home, href: '/', icon: FaHome },
        { label: t.about, href: '/about', icon: IoInformationCircle },
        { label: t.donate, href: '/donate', icon: FaImage },
        { label: t.contact, href: '/', icon: FaUser } // Keeping contact on Home for now
    ]

    const socialLinks = [
        { icon: FaFacebook, label: 'Facebook' },
        { icon: FaYoutube, label: 'YouTube' },
        { icon: GrInstagram, label: 'Instagram' },
        { icon: FaLinkedin, label: 'Linkedin' }
    ]

    return (
        <motion.nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-background/80 backdrop-blur-md shadow-md border-b border-border/50 py-2' : 'bg-transparent py-4'}`}
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between">

                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 shrink-0 group">
                        <img
                            src="/Blood-Banl-Logo.png"
                            alt="Logo"
                            className="w-auto h-16 md:h-20 object-contain filter hue-rotate-[300deg] saturate-[2.6] brightness-[0.30] contrast-[1.25] transition-transform duration-300 group-hover:scale-105"
                        />
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-8 bg-background/50 backdrop-blur-sm px-8 py-3 rounded-full border border-white/10 shadow-sm">
                        {navLinks.map((link) => (
                            <Link
                                key={link.label}
                                href={link.href}
                                className="text-foreground/80 hover:text-primary font-medium text-lg transition-colors duration-300 relative group flex items-center gap-2"
                            >
                                {link.label}
                                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300"></span>
                            </Link>
                        ))}
                    </div>

                    {/* Desktop Right Section */}
                    <div className="hidden lg:flex items-center gap-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={toggleLanguage}
                            className="border-primary/50 text-primary hover:bg-primary hover:text-white transition-all duration-300 rounded-full px-4"
                        >
                            {language === 'en' ? 'मराठी' : 'English'}
                        </Button>

                        <div className="flex items-center gap-2">
                            {socialLinks.map((social) => (
                                <Link
                                    key={social.label}
                                    href="#"
                                    aria-label={social.label}
                                    className="w-9 h-9 rounded-full bg-primary/5 hover:bg-primary text-primary hover:text-white flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-sm"
                                >
                                    <social.icon className='text-lg' />
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="flex items-center gap-4 md:hidden">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={toggleLanguage}
                            className="text-primary font-bold"
                        >
                            {language === 'en' ? 'मराठी' : 'En'}
                        </Button>
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-lg text-foreground bg-primary/5 hover:bg-primary/10 transition-colors"
                        >
                            <motion.div
                                animate={isOpen ? "open" : "closed"}
                                className="w-6 h-6 flex flex-col justify-center gap-1.5"
                            >
                                <motion.span
                                    variants={{ closed: { rotate: 0, y: 0 }, open: { rotate: 45, y: 8 } }}
                                    className="w-full h-0.5 bg-foreground block origin-center transition-all"
                                ></motion.span>
                                <motion.span
                                    variants={{ closed: { opacity: 1 }, open: { opacity: 0 } }}
                                    className="w-full h-0.5 bg-foreground block transition-all"
                                ></motion.span>
                                <motion.span
                                    variants={{ closed: { rotate: 0, y: 0 }, open: { rotate: -45, y: -8 } }}
                                    className="w-full h-0.5 bg-foreground block origin-center transition-all"
                                ></motion.span>
                            </motion.div>
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="md:hidden overflow-hidden bg-background/95 backdrop-blur-xl border-t border-border/50 shadow-2xl rounded-b-2xl"
                        >
                            <div className="px-4 py-6 space-y-2">
                                {navLinks.map((link, i) => (
                                    <motion.div
                                        key={link.label}
                                        initial={{ x: -20, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: i * 0.1 }}
                                    >
                                        <Link
                                            href={link.href}
                                            className="flex items-center px-4 py-3 text-foreground hover:text-primary hover:bg-primary/5 rounded-xl transition-colors duration-300"
                                            onClick={() => setIsOpen(false)}
                                        >
                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-4 text-primary">
                                                <link.icon className="text-xl" />
                                            </div>
                                            <span className="font-semibold text-lg">{link.label}</span>
                                        </Link>
                                    </motion.div>
                                ))}

                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.4 }}
                                    className="px-4 py-4 mt-4 border-t border-border/50"
                                >
                                    <div className="flex gap-4 justify-center">
                                        {socialLinks.map((social) => (
                                            <Link
                                                key={social.label}
                                                href="#"
                                                className="w-10 h-10 rounded-full bg-muted hover:bg-primary text-foreground hover:text-white flex items-center justify-center transition-all duration-300"
                                            >
                                                <social.icon className="text-xl" />
                                            </Link>
                                        ))}
                                    </div>
                                </motion.div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.nav>
    )
}

