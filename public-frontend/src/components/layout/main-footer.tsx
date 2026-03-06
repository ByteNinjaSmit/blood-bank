"use client"

import { useLanguage } from '@/context/language-context';
import { content } from '@/lib/content';
import Link from 'next/link'
import { Facebook, Youtube, Instagram, Linkedin, Phone, Mail, MapPin, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Footer() {
    const { language } = useLanguage();
    const t = content[language].footer;
    const nav = content[language].nav;

    const socialLinks = [
        { icon: Facebook, label: 'Facebook', href: '#' },
        { icon: Youtube, label: 'YouTube', href: '#' },
        { icon: Instagram, label: 'Instagram', href: '#' },
        { icon: Linkedin, label: 'Linkedin', href: '#' }
    ]

    const quickLinks = nav.mainLinks.slice(0, 4)

    return (
        <footer className="bg-background border-t border-border/40 pt-16 pb-8 font-sans">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 mb-12">

                    {/* Brand Identifier */}
                    <div className="lg:col-span-4 space-y-4">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                                <span className="font-bold text-lg">S</span>
                            </div>
                            <span className="text-xl font-bold tracking-tight text-foreground">Sanjivani Blood Bank</span>
                        </div>
                        <p className="text-muted-foreground leading-relaxed text-sm max-w-xs">
                            {t.about}
                        </p>
                        <div className="flex gap-3 pt-2">
                            {socialLinks.map((social) => (
                                <Link
                                    key={social.label}
                                    href={social.href}
                                    className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-white transition-all duration-300"
                                >
                                    <social.icon className="w-4 h-4" />
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="lg:col-span-2 space-y-4">
                        <h4 className="font-bold text-foreground text-sm uppercase tracking-wide">{t.quickLinks}</h4>
                        <ul className="space-y-2.5">
                            {quickLinks.map((link, index) => (
                                <li key={index}>
                                    <Link href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors inline-block">
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact - Simplified */}
                    <div className="lg:col-span-3 space-y-4">
                        <h4 className="font-bold text-foreground text-sm uppercase tracking-wide">{t.locationsTitle}</h4>
                        <ul className="space-y-3">
                            <li className="flex items-start gap-3 text-sm text-muted-foreground">
                                <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                <span>{t.address}</span>
                            </li>
                            <li className="flex items-center gap-3 text-sm text-muted-foreground">
                                <Phone className="w-4 h-4 text-primary shrink-0" />
                                <span>+91 94222 23117 / +91 94217 23117</span>
                            </li>
                            <li className="flex items-center gap-3 text-sm text-muted-foreground">
                                <Phone className="w-4 h-4 text-primary shrink-0" />
                                <span>02423 222237</span>
                            </li>
                            <li className="flex items-center gap-3 text-sm text-muted-foreground">
                                <Mail className="w-4 h-4 text-primary shrink-0" />
                                <span>contact@sanjivanibloodbank.org</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-border/40 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Sanjivani Blood Bank. Designed & Developed by ByteNinjaTeam</p>
                    <div className="flex gap-6 text-xs text-muted-foreground font-medium">
                        <Link href="#" className="hover:text-foreground transition-colors">Privacy</Link>
                        <Link href="#" className="hover:text-foreground transition-colors">Terms</Link>
                        <Link href="#" className="hover:text-foreground transition-colors">Cookies</Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}
