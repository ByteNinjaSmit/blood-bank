'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
    ArrowRight, ShieldCheck, Heart, Phone, Mail,
    AlertTriangle, ThermometerSun, Activity,
    Clock, CheckCircle2, ChevronDown,
    Stethoscope, Syringe,
    HeartPulse, ShieldAlert, BandageIcon
} from 'lucide-react'
import { useState } from 'react'
import { useLanguage } from '@/context/language-context'
import { content } from '@/lib/content'

const protocolIcons = [Syringe, Stethoscope, ShieldAlert, HeartPulse, Activity, ShieldCheck]
const sideEffectIcons = [ThermometerSun, BandageIcon, Clock, AlertTriangle, HeartPulse]

/* ═══════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════ */
export default function DonorWellness() {
    const [openFaq, setOpenFaq] = useState<number | null>(0)
    const { language } = useLanguage()
    const t = content[language].donorWellnessPage

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
                            <ShieldCheck className="w-4 h-4" />
                            {t.heroBadge}
                        </span>
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1]">
                            {t.heroTitleStart}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-rose-600">
                                {t.heroTitleHighlight}
                            </span>
                        </h1>
                        <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
                            {t.heroDescription}
                        </p>
                        <div className="space-y-2 text-muted-foreground text-sm">
                            <p>{t.onPageIntro}</p>
                            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                {t.onPageList.map((item, i) => (
                                    <li key={i}>{item}</li>
                                ))}
                            </ul>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ───────── FAQ SECTION ───────── */}
            <section className="py-16 lg:py-24 bg-muted/30">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mb-10"
                    >
                        <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3 leading-tight">
                            {t.faqSectionTitleStart}
                            <span className="text-primary">{t.faqSectionTitleHighlight}</span>
                        </h2>
                        <p className="text-muted-foreground">
                            {t.faqSectionSubtitle}
                        </p>
                    </motion.div>

                    <div className="space-y-2">
                        {t.faqs.map((faq, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.03 }}
                                className="bg-card rounded-xl border border-border/50 overflow-hidden"
                            >
                                <button
                                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                    className="w-full flex items-center justify-between gap-4 p-5 text-left hover:bg-muted/30 transition-colors"
                                >
                                    <span className="font-bold text-foreground text-[15px] leading-snug">{faq.q}</span>
                                    <ChevronDown
                                        className={`w-5 h-5 text-muted-foreground shrink-0 transition-transform duration-300 ${openFaq === i ? 'rotate-180' : ''}`}
                                    />
                                </button>
                                <div
                                    className={`overflow-hidden transition-all duration-300 ease-in-out ${openFaq === i ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
                                >
                                    <p className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-border/30 pt-4">
                                        {faq.a}
                                    </p>
                                </div>
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
                            <Heart className="w-7 h-7 text-white" />
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
                        href="/donation-process"
                        className="inline-flex items-center gap-2 bg-white text-primary px-7 py-3.5 rounded-full font-bold text-sm hover:bg-white/90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 shrink-0"
                    >
                        {t.viewProcessBtn}
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </section>

            {/* ───────── SAFETY PROTOCOLS ───────── */}
            <section className="py-16 lg:py-24">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mb-10"
                    >
                        <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
                            {t.protocolsTitle}
                        </h2>
                        <p className="text-muted-foreground leading-relaxed max-w-2xl">
                            {t.protocolsDescription}
                        </p>
                    </motion.div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {t.safetyProtocols.map((protocol, i) => {
                            const Icon = protocolIcons[i]
                            return (
                                <motion.div
                                    key={protocol.title}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.08 }}
                                    className="p-5 rounded-2xl bg-card border border-border/50 hover:border-primary/20 hover:shadow-md transition-all"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                                        <Icon className="w-5 h-5 text-primary" />
                                    </div>
                                    <h3 className="font-bold text-foreground text-sm mb-2">{protocol.title}</h3>
                                    <p className="text-xs text-muted-foreground leading-relaxed">{protocol.desc}</p>
                                </motion.div>
                            )
                        })}
                    </div>
                </div>
            </section>

            {/* ───────── COMMON SIDE EFFECTS ───────── */}
            <section className="py-16 lg:py-20 bg-muted/30">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mb-10"
                    >
                        <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
                            {t.sideEffectsTitle}
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            {t.sideEffectsDescription}
                        </p>
                    </motion.div>

                    {/* Side effects table / list */}
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[550px] border-collapse">
                            <thead>
                                <tr>
                                    <th className="p-4 text-left text-sm font-bold text-foreground bg-card border border-border rounded-tl-xl">{t.sideEffectsTableHeaders.effect}</th>
                                    <th className="p-4 text-left text-sm font-bold text-foreground bg-card border border-border">{t.sideEffectsTableHeaders.likelihood}</th>
                                    <th className="p-4 text-left text-sm font-bold text-foreground bg-card border border-border rounded-tr-xl">{t.sideEffectsTableHeaders.whatToDo}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {t.sideEffects.map((se, i) => {
                                    const Icon = sideEffectIcons[i]
                                    const isRare = i === t.sideEffects.length - 1
                                    const isOccasional = i === 0 || i === 1
                                    return (
                                        <tr key={i} className="hover:bg-muted/30 transition-colors">
                                            <td className={`p-4 border border-border ${i === t.sideEffects.length - 1 ? 'rounded-bl-xl' : ''}`}>
                                                <div className="flex items-center gap-2">
                                                    <Icon className="w-4 h-4 text-primary shrink-0" />
                                                    <span className="text-sm font-semibold text-foreground">{se.effect}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 border border-border">
                                                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${isRare
                                                    ? 'bg-green-100 text-green-700'
                                                    : isOccasional
                                                        ? 'bg-amber-100 text-amber-700'
                                                        : 'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {se.likelihood}
                                                </span>
                                            </td>
                                            <td className={`p-4 border border-border text-sm text-muted-foreground leading-relaxed ${i === t.sideEffects.length - 1 ? 'rounded-br-xl' : ''}`}>
                                                {se.what}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* ───────── IRON & NUTRITION ───────── */}
            <section className="py-16 lg:py-20">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mb-8"
                    >
                        <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
                            {t.ironTitle}
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            {t.ironDescription}
                        </p>
                    </motion.div>

                    <div className="space-y-3">
                        {t.ironTips.map((tip, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.05 }}
                                className="flex items-start gap-3 py-3 border-b border-border/50 last:border-b-0"
                            >
                                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                <p className="text-[15px] text-muted-foreground leading-relaxed">{tip}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ───────── WHEN TO SEEK HELP ───────── */}
            <section className="py-16 lg:py-20 bg-muted/30">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="space-y-5"
                    >
                        <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                            {t.whenToSeekTitle}
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            {t.whenToSeekText}
                        </p>
                        <div className="grid sm:grid-cols-2 gap-3 mt-4">
                            {t.whenToSeekItems.map((item, i) => (
                                <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-100">
                                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                                    <p className="text-sm text-red-800 leading-relaxed">{item}</p>
                                </div>
                            ))}
                        </div>
                        <p className="text-muted-foreground text-sm pt-2">
                            {t.helplineText.split('{phone}')[0]}
                            <a href="tel:+919422223117" className="text-primary font-semibold hover:underline">+91 94222 23117</a>
                            {t.helplineText.split('{phone}')[1]}
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* ───────── CTA ───────── */}
            <section className="bg-gradient-to-r from-primary to-rose-700">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center space-y-5"
                    >
                        <h2 className="text-2xl sm:text-3xl font-bold text-white">
                            {t.ctaTitle}
                        </h2>
                        <p className="text-white/85 max-w-xl mx-auto leading-relaxed">
                            {t.ctaText}
                        </p>
                        <div className="flex flex-wrap justify-center gap-4 pt-2">
                            <Link
                                href="/donate"
                                className="inline-flex items-center gap-2 bg-white text-primary px-7 py-3.5 rounded-full font-bold text-sm hover:bg-white/90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                            >
                                {t.bookBtn}
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

            {/* ───────── CONTACT SUPPORT ───────── */}
            <section className="py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center space-y-5">
                        <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                            {t.contactTitle}
                        </h2>
                        <div className="flex flex-wrap justify-center gap-4">
                            <a
                                href="tel:+919422223117"
                                className="inline-flex items-center gap-2 bg-card hover:bg-muted text-foreground px-6 py-3 rounded-full text-sm font-semibold transition-colors border border-border"
                            >
                                <Phone className="w-4 h-4 text-primary" />
                                +91 94222 23117
                            </a>
                            <a
                                href="mailto:contact@sanjivanibloodbank.org"
                                className="inline-flex items-center gap-2 bg-card hover:bg-muted text-foreground px-6 py-3 rounded-full text-sm font-semibold transition-colors border border-border"
                            >
                                <Mail className="w-4 h-4 text-primary" />
                                contact@sanjivanibloodbank.org
                            </a>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}
