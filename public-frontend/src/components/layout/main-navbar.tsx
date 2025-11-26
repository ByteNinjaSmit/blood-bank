'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FaYoutube, FaFacebook, FaLinkedin, FaHome, FaInfo, FaImage, FaUser } from "react-icons/fa";
import { IoInformationCircle } from "react-icons/io5";
import { GrInstagram } from "react-icons/gr";
import Image from 'next/image';

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false)

    const navLinks = [
        { label: 'Home', href: '#home', icon: FaHome },
        { label: 'About', href: '#about', icon: IoInformationCircle },
        { label: 'Donate', href: '#donation-form', icon: FaImage },
        { label: 'Contact', href: '#contact', icon: FaUser }
    ]

    const socialLinks = [
        { icon: FaFacebook, label: 'Facebook' },
        { icon: FaYoutube, label: 'YouTube' },
        { icon: GrInstagram, label: 'Instagram' },
        { icon: FaLinkedin, label: 'Linkedin' }
    ]

    return (
        <nav className="relative w-full bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16 md:h-20">

                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 shrink-0">
                        <img
                            src="/Blood-Banl-Logo.png"
                            alt="Logo"
                            className="w-30 h-25 object-contain filter hue-rotate-[300deg] saturate-[2.6] brightness-[0.30] contrast-[1.25]"
                        />
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.label}
                                href={link.href}
                                className="text-foreground hover:text-primary font-medium text-md transition-colors duration-300 relative group"
                            >
                                {link.label}
                                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300"></span>
                            </Link>
                        ))}
                    </div>

                    {/* Desktop Right Section */}
                    <div className="hidden lg:flex flex-col items-center gap-1">
                        <Link
                            href="#"
                            className="text-xs text-muted-foreground hover:text-primary transition-colors font-medium hidden xl:block"
                        >
                            www.sanjivanibloodbank.org
                        </Link>

                        <div className="flex items-center gap-3">
                            {socialLinks.map((social) => (
                                <Link
                                    key={social.label}
                                    href="#"
                                    aria-label={social.label}
                                    className="w-7 h-7 rounded-full  text-primary hover:text-primary flex items-center justify-center text-xs transition-all hover:scale-110 duration-300"
                                >
                                    <social.icon className='text-2xl' />
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-foreground hover:text-primary transition-colors"
                    >
                        {isOpen ? (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        ) : (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        )}
                    </button>
                </div>

                {/* Mobile Menu */}
                <div
                    className={`md:hidden overflow-hidden bg-card rounded-b-lg mt-5 border border-border transition-all duration-500 ease-in-out ${
                        isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                    }`}
                >
                    <div className="pb-4 space-y-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.label}
                                href={link.href}
                                className="block px-4 py-2 text-foreground hover:text-primary bg-muted rounded transition-colors duration-300"
                                onClick={() => setIsOpen(false)}
                            >
                                <link.icon className="inline-block mr-2 text-lg text-primary" />
                                {link.label}
                            </Link>
                        ))}

                        <div className="px-4 py-3 border-t border-border">
                            <p className="text-xs text-muted-foreground mb-3">www.sanjivanibloodbank.org</p>
                            <div className="flex gap-3">
                                {socialLinks.map((social) => (
                                    <Link
                                        key={social.label}
                                        href="#"
                                        aria-label={social.label}
                                        className="w-7 h-7 rounded-full text-primary hover:text-primary hover:bg-primary-foreground flex items-center justify-center transition-all duration-300"
                                    >
                                        <social.icon className="text-2xl" />
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    )
}
