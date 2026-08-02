'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
    ArrowRight, CalendarDays, Bell, Phone, Mail,
    AlertCircle, Sparkles
} from 'lucide-react'
import { useLanguage } from '@/context/language-context'
import { content } from '@/lib/content'

/* ═══════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════ */
export default function DonationCriteriaChanges() {
    const { language } = useLanguage()
    const t = content[language].donationCriteriaChangesPage

    return (
        <div className="bg-background">
            {/* ───────── HERO ───────── */}
            <section className="relative pt-32 pb-16 lg:pt-40 lg:pb-20 overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[140px] -translate-y-1/3 translate-x-1/3 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, ease: 'easeOut' }}
                        className="space-y-5"
                    >
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold">
                            <Bell className="w-4 h-4" />
                            {t.heroBadge}
                        </span>
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1]">
                            {t.heroTitleStart}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-rose-600">
                                {t.heroTitleHighlight}
                            </span>
                        </h1>
                        <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
                            {t.heroDescription1}
                        </p>
                        <p className="text-sm text-muted-foreground/80 max-w-2xl">
                            {t.heroDescription2}
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* ───────── RED BANNER ───────── */}
            <section className="bg-gradient-to-r from-primary to-rose-700">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                            <AlertCircle className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl sm:text-2xl font-bold text-white">
                                {t.redBannerTitle}
                            </h2>
                            <p className="text-white/80 text-sm mt-1">
                                {t.redBannerText}
                            </p>
                        </div>
                    </div>
                    <Link
                        href="/eligibility-criteria"
                        className="inline-flex items-center gap-2 bg-white text-primary px-7 py-3.5 rounded-full font-bold text-sm hover:bg-white/90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 shrink-0"
                    >
                        {t.checkEligibilityBtn}
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </section>

            {/* ───────── UPDATES LIST ───────── */}
            <section className="py-16 lg:py-24">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="mb-10"
                    >
                        <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                            {t.updatesTitle}
                        </h2>
                        <p className="text-muted-foreground text-sm">
                            {t.updatesSubtitle}
                        </p>
                    </motion.div>

                    <div>
                        {t.updates.map((update, i) => (
                            <motion.article
                                key={i}
                                initial={{ opacity: 0, y: 15 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.03, duration: 0.4 }}
                                className="py-8 border-b border-border last:border-b-0"
                            >
                                <p className="flex items-center gap-2 text-sm font-semibold text-primary mb-3">
                                    <CalendarDays className="w-4 h-4" />
                                    {update.date}
                                </p>
                                <h3 className="text-lg font-bold text-foreground mb-2">
                                    {update.title}
                                </h3>
                                <p className="text-[15px] text-muted-foreground leading-relaxed">
                                    {update.body}
                                </p>
                            </motion.article>
                        ))}
                    </div>
                </div>
            </section>

            {/* ───────── READY TO DONATE CTA ───────── */}
            <section className="py-16 lg:py-20 bg-muted/30">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-center space-y-6"
                    >
                        <span className="inline-flex items-center gap-2 text-primary font-semibold text-sm mx-auto">
                            <Sparkles className="w-4 h-4" />
                            {t.ctaBadge}
                        </span>
                        <h3 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight">
                            {t.ctaTitleStart}
                            <span className="text-primary">{t.ctaTitleHighlight}</span>
                        </h3>
                        <p className="text-muted-foreground leading-relaxed max-w-xl mx-auto">
                            {t.ctaText}
                        </p>
                        <div className="flex flex-wrap justify-center gap-3 pt-2">
                            <Link
                                href="/donate"
                                className="inline-flex items-center gap-2 bg-primary text-white px-7 py-3.5 rounded-xl font-bold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5"
                            >
                                {t.bookBtn}
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                            <Link
                                href="/eligibility-criteria"
                                className="inline-flex items-center gap-2 bg-background border border-border text-foreground px-7 py-3.5 rounded-xl font-semibold text-sm hover:bg-muted transition-colors"
                            >
                                {t.fullCriteriaBtn}
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ───────── SUPPORT CTA BANNER ───────── */}
            <section className="bg-gradient-to-r from-primary to-rose-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="text-center space-y-5">
                        <h2 className="text-2xl sm:text-3xl font-bold text-white">
                            {t.supportTitle}
                        </h2>
                        <div className="flex flex-wrap justify-center gap-4">
                            <a
                                href="tel:+919422223117"
                                className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white px-6 py-3 rounded-full text-sm font-semibold transition-colors backdrop-blur-sm border border-white/20"
                            >
                                <Phone className="w-4 h-4" />
                                +91 94222 23117
                            </a>
                            <a
                                href="mailto:contact@sanjivanibloodbank.org"
                                className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white px-6 py-3 rounded-full text-sm font-semibold transition-colors backdrop-blur-sm border border-white/20"
                            >
                                <Mail className="w-4 h-4" />
                                contact@sanjivanibloodbank.org
                            </a>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}
