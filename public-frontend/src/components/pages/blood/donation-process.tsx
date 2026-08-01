'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
    ArrowRight, Heart, Clock, CheckCircle2,
    Phone, Mail, Utensils, AlertTriangle,
    ClipboardList, ShieldCheck, Sparkles,
    Coffee, Users, Accessibility, HandHeart,
    FileText, ThermometerSun, Activity, Droplet
} from 'lucide-react'
import { useLanguage } from '@/context/language-context'
import { content } from '@/lib/content'

const beforeIcons = [Utensils, Droplet, ThermometerSun, AlertTriangle, FileText, ClipboardList]
const afterIcons = [Coffee, Utensils, AlertTriangle, Droplet, ThermometerSun, ShieldCheck]
const accessibilityIcons = [Accessibility, Users, HandHeart, ShieldCheck]

/* ─── Animation ─── */
const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.08, duration: 0.5, ease: 'easeOut' as const }
    })
}

/* ═══════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════ */
export default function DonationProcess() {
    const { language } = useLanguage()
    const t = content[language].donationProcessPage

    return (
        <div className="bg-background">
            {/* ───────── HERO ───────── */}
            <section className="relative pt-32 pb-16 lg:pt-40 lg:pb-20 overflow-hidden bg-gradient-to-br from-primary via-primary to-rose-700">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.08),transparent_60%)] pointer-events-none" />
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, ease: 'easeOut' }}
                        className="space-y-5"
                    >
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 text-white text-sm font-semibold backdrop-blur-sm">
                            <Heart className="w-4 h-4" />
                            {t.heroBadge}
                        </span>
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.1]">
                            {t.heroTitle}
                        </h1>
                        <p className="text-lg text-white/85 leading-relaxed max-w-2xl">
                            {t.heroDescription}
                        </p>
                        <div className="flex flex-wrap gap-3 pt-2">
                            <Link
                                href="/donate"
                                className="inline-flex items-center gap-2 bg-white text-primary px-7 py-3.5 rounded-full font-bold text-sm hover:bg-white/90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                            >
                                {t.bookAppointmentBtn}
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                            <Link
                                href="/eligibility-criteria"
                                className="inline-flex items-center gap-2 bg-white/15 text-white px-7 py-3.5 rounded-full font-semibold text-sm hover:bg-white/25 transition-colors backdrop-blur-sm border border-white/20"
                            >
                                {t.checkEligibilityBtn}
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ───────── BEFORE YOU DONATE ───────── */}
            <section className="py-16 lg:py-24">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mb-10"
                    >
                        <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
                            {t.beforeTitle}
                        </h2>
                        <p className="text-muted-foreground leading-relaxed max-w-2xl">
                            {t.beforeDescription}
                        </p>
                    </motion.div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {t.beforeTips.map((tip, i) => {
                            const Icon = beforeIcons[i]
                            return (
                                <motion.div
                                    key={tip.title}
                                    custom={i}
                                    variants={fadeUp}
                                    initial="hidden"
                                    whileInView="visible"
                                    viewport={{ once: true }}
                                    className="flex items-start gap-4 p-5 rounded-2xl bg-card border border-border/50 hover:border-primary/20 hover:shadow-md transition-all"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                        <Icon className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-foreground text-sm mb-1">{tip.title}</h3>
                                        <p className="text-xs text-muted-foreground leading-relaxed">{tip.desc}</p>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>
                </div>
            </section>

            {/* ───────── THE 4-STEP PROCESS ───────── */}
            <section className="py-16 lg:py-24 bg-muted/30">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-14"
                    >
                        <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
                            {t.duringTitleStart}
                            <span className="text-primary">{t.duringTitleHighlight}</span>
                        </h2>
                        <p className="text-muted-foreground max-w-xl mx-auto">
                            {t.duringDescription}
                        </p>
                    </motion.div>

                    <div className="space-y-0">
                        {t.processSteps.map((step, i) => (
                            <motion.div
                                key={step.title}
                                custom={i}
                                variants={fadeUp}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true }}
                                className="relative flex gap-6"
                            >
                                {/* Vertical connector */}
                                <div className="flex flex-col items-center">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-rose-600 flex items-center justify-center text-white font-extrabold text-lg shadow-lg shadow-primary/25 shrink-0 z-10">
                                        {i + 1}
                                    </div>
                                    {i < t.processSteps.length - 1 && (
                                        <div className="w-0.5 flex-1 bg-primary/20 my-1" />
                                    )}
                                </div>

                                {/* Content */}
                                <div className="pb-10 flex-1">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-2">
                                        <h3 className="text-xl font-bold text-foreground">{step.title}</h3>
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold w-fit">
                                            <Clock className="w-3 h-3" />
                                            {step.duration}
                                        </span>
                                    </div>
                                    <p className="text-[15px] text-muted-foreground leading-relaxed">
                                        {step.desc}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Total time summary */}
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mt-6 flex items-center justify-center gap-3 bg-primary/10 rounded-full px-6 py-3 w-fit mx-auto"
                    >
                        <Clock className="w-5 h-5 text-primary" />
                        <span className="text-sm font-bold text-foreground">
                            {t.totalTimeText}
                        </span>
                    </motion.div>
                </div>
            </section>

            {/* ───────── DONOR QUESTIONNAIRE ───────── */}
            <section className="py-16 lg:py-20">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mb-8"
                    >
                        <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
                            {t.questionnaireTitle}
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            {t.questionnaireDescription}
                        </p>
                    </motion.div>

                    <div className="space-y-3">
                        {t.questionnairePoints.map((point, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.05 }}
                                className="flex items-start gap-3 py-3 border-b border-border/50 last:border-b-0"
                            >
                                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                <p className="text-[15px] text-muted-foreground leading-relaxed">{point}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ───────── RED BANNER ───────── */}
            <section className="bg-gradient-to-r from-primary to-rose-700">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                            <Activity className="w-7 h-7 text-white" />
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
                        href="/donate"
                        className="inline-flex items-center gap-2 bg-white text-primary px-7 py-3.5 rounded-full font-bold text-sm hover:bg-white/90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 shrink-0"
                    >
                        {t.donateNowBtn}
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </section>

            {/* ───────── AFTER YOUR DONATION (Relax & Refresh) ───────── */}
            <section className="py-16 lg:py-24">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mb-10"
                    >
                        <span className="inline-flex items-center gap-2 text-primary font-semibold text-sm mb-3">
                            <Sparkles className="w-4 h-4" />
                            {t.afterBadge}
                        </span>
                        <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
                            {t.afterTitle}
                        </h2>
                        <p className="text-muted-foreground leading-relaxed max-w-2xl">
                            {t.afterDescription}
                        </p>
                    </motion.div>

                    <div className="grid sm:grid-cols-2 gap-4">
                        {t.afterTips.map((tip, i) => {
                            const Icon = afterIcons[i]
                            return (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 15 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.06 }}
                                    className="flex items-start gap-3 py-4 border-b border-border/50"
                                >
                                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                        <Icon className="w-4 h-4 text-primary" />
                                    </div>
                                    <p className="text-sm text-muted-foreground leading-relaxed">{tip}</p>
                                </motion.div>
                            )
                        })}
                    </div>
                </div>
            </section>

            {/* ───────── DONATION IN YOUR HONOUR ───────── */}
            <section className="py-16 lg:py-20 bg-muted/30">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="space-y-5"
                    >
                        <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                            {t.honourTitle}
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            {t.honourText1}
                        </p>
                        <p className="text-muted-foreground leading-relaxed">
                            {t.honourText2}
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* ───────── ACCESSIBILITY & SERVICES ───────── */}
            <section className="py-16 lg:py-20">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="space-y-5 mb-10"
                    >
                        <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                            {t.accessibilityTitle}
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            {t.accessibilityDescription}
                        </p>
                    </motion.div>

                    <div className="grid sm:grid-cols-2 gap-5">
                        {t.accessibilityServices.map((service, i) => {
                            const Icon = accessibilityIcons[i]
                            return (
                                <motion.div
                                    key={service.title}
                                    custom={i}
                                    variants={fadeUp}
                                    initial="hidden"
                                    whileInView="visible"
                                    viewport={{ once: true }}
                                    className="flex items-start gap-4 p-5 rounded-2xl bg-card border border-border/50 hover:border-primary/20 hover:shadow-md transition-all"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                        <Icon className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-foreground text-sm mb-1">{service.title}</h3>
                                        <p className="text-xs text-muted-foreground leading-relaxed">{service.desc}</p>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>
                </div>
            </section>

            {/* ───────── FAQ ───────── */}
            <section className="py-16 lg:py-20 bg-muted/30">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mb-10"
                    >
                        <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
                            {t.faqTitle}
                        </h2>
                    </motion.div>

                    <div>
                        {t.faqs.map((faq, i) => (
                            <motion.article
                                key={i}
                                initial={{ opacity: 0, y: 15 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.05 }}
                                className="py-6 border-b border-border last:border-b-0"
                            >
                                <h3 className="font-bold text-foreground mb-2">{faq.q}</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                            </motion.article>
                        ))}
                    </div>
                </div>
            </section>

            {/* ───────── SUPPORT CTA ───────── */}
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
