'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
    Heart, Clock, Droplet, ArrowRight, ChevronRight,
    Pill, Syringe, Baby, Globe, User,
    Phone, Mail, Accessibility,
    RefreshCw, ShieldCheck, Sparkles, AlertCircle, Wine, Plane
} from 'lucide-react'
import { useLanguage } from '@/context/language-context'
import { content } from '@/lib/content'

/* ─── Static mappings ─── */
const topicIcons = [User, Wine, Droplet, ShieldCheck, Pill, Syringe, Baby, Heart, Plane];
const learnMoreIcons = [Accessibility, AlertCircle, RefreshCw];
const learnMoreHrefs = ['/', '/', '/donation-criteria-changes'];

const frequencyImages = ['/donation-frquency-1.png', '/donation-frequency-2.png', '/donation-frquency-1.png'];
const frequencyFilters = ['', '', 'hue-rotate(270deg) contrast(1.1)'];

/* ─── Fade-in animation variants ─── */
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
export default function EligibilityCriteria() {
    const { language } = useLanguage()
    const t = content[language].eligibilityCriteriaPage

    return (
        <div className="bg-background">
            {/* ───────── HERO ───────── */}
            <section className="relative pt-32 pb-16 lg:pt-40 lg:pb-20 overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[140px] -translate-y-1/3 translate-x-1/3 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -40 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.7, ease: 'easeOut' }}
                            className="space-y-6"
                        >
                            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold">
                                <ShieldCheck className="w-4 h-4" />
                                {t.heroBadge}
                            </span>
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1]">
                                {t.heroTitleStart}{' '}
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-rose-600">
                                    {t.heroTitleHighlight}
                                </span>
                            </h1>
                            <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
                                {t.heroDescription1}
                            </p>
                            <p className="text-sm text-muted-foreground/80 max-w-lg">
                                {t.heroDescription2}
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.92, x: 40 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className="relative hidden lg:flex items-center justify-center"
                        >
                            <div className="relative w-full max-w-md aspect-[4/3]">
                                <div className="absolute inset-0 bg-gradient-to-tr from-primary/15 via-primary/5 to-transparent rounded-3xl blur-2xl" />
                                <img
                                    src="/blood-1.webp"
                                    alt="Blood donation"
                                    className="relative w-full h-full object-cover rounded-3xl shadow-2xl border-4 border-background"
                                />
                                <motion.div
                                    className="absolute -bottom-6 -left-4 bg-background/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-border/50"
                                    animate={{ y: [0, -6, 0] }}
                                    transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                            <Heart className="w-5 h-5 text-primary fill-primary" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-foreground">Safe &amp; Simple</p>
                                            <p className="text-xs text-muted-foreground">45-minute process</p>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ───────── RED BANNER ───────── */}
            <section className="bg-gradient-to-r from-primary to-rose-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                            <Clock className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <p className="text-white/90 text-sm font-medium uppercase tracking-wider">
                                {t.redBannerSubtitle}
                            </p>
                            <h2 className="text-2xl sm:text-3xl font-bold text-white italic">
                                {t.redBannerTitle}
                            </h2>
                        </div>
                    </div>
                </div>
            </section>

            {/* ───────── TOPIC EXPLORER (Grid) ───────── */}
            <section className="py-16 lg:py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="text-center mb-12"
                    >
                        <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                            {t.topicsTitleStart}{' '}
                            <span className="text-primary">{t.topicsTitleHighlight}</span>
                        </h2>
                        <p className="text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                            {t.topicsDescription}
                        </p>
                    </motion.div>

                    {/* Grid content */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {t.topics.map((topic, i) => {
                            const Icon = topicIcons[i] || User;
                            return (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.4, delay: i * 0.05 }}
                                    className="bg-card border border-border/50 rounded-2xl p-7 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group h-full flex flex-col"
                                >
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/10 transition-colors"></div>
                                    <h3 className="text-lg font-bold text-foreground mb-5 flex items-center gap-3 relative z-10">
                                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                            <Icon className="w-6 h-6 text-primary" />
                                        </div>
                                        {topic.title}
                                    </h3>
                                    <ul className="space-y-3 relative z-10 flex-grow">
                                        {topic.points.map((point, idx) => (
                                            <li
                                                key={idx}
                                                className="flex items-start gap-3 text-muted-foreground"
                                            >
                                                <ChevronRight className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                                <span className="text-sm leading-relaxed">{point}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </motion.div>
                            )
                        })}
                    </div>
                </div>
            </section>

            {/* ───────── LEARN MORE ───────── */}
            <section className="py-16 lg:py-24 bg-muted/30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-12"
                    >
                        <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
                            {t.learnMoreTitleStart}{' '}
                            <span className="text-primary">{t.learnMoreTitleHighlight}</span>
                        </h2>
                    </motion.div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                        {t.learnMoreCards.map((card, i) => {
                            const Icon = learnMoreIcons[i] || Accessibility;
                            const href = learnMoreHrefs[i] || '/';
                            return (
                                <motion.div
                                    key={i}
                                    custom={i}
                                    variants={fadeUp}
                                    initial="hidden"
                                    whileInView="visible"
                                    viewport={{ once: true }}
                                >
                                    <Link href={href} className="group block bg-card rounded-2xl p-8 border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-300 h-full relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/10 transition-colors"></div>
                                        <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors relative z-10">
                                            <Icon className="w-7 h-7 text-primary" />
                                        </div>
                                        <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors relative z-10">
                                            {card.title}
                                        </h3>
                                        <p className="text-base text-muted-foreground leading-relaxed relative z-10">
                                            {card.desc}
                                        </p>
                                        <span className="inline-flex items-center gap-1 mt-6 text-sm font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity relative z-10">
                                            {card.cta} <ArrowRight className="w-4 h-4" />
                                        </span>
                                    </Link>
                                </motion.div>
                            )
                        })}
                    </div>

                    {/* First-time donor CTA */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-muted/50 via-background to-primary/5 border border-border/50 shadow-sm hover:shadow-md transition-shadow"
                    >
                        <div className="grid lg:grid-cols-2 gap-8 items-center p-8 sm:p-12">
                            <div className="space-y-6">
                                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary font-bold text-sm">
                                    <Sparkles className="w-4 h-4" />
                                    {t.firstTimeBadge}
                                </span>
                                <h3 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight">
                                    {t.firstTimeTitle}{' '}
                                    <span className="text-primary block mt-1">{t.firstTimeTitleHighlight}</span>
                                </h3>
                                <p className="text-muted-foreground text-base sm:text-lg leading-relaxed max-w-md">
                                    {t.firstTimeDescription}
                                </p>
                                <Link
                                    href="/donate"
                                    className="inline-flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-xl font-bold text-base hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5"
                                >
                                    {t.firstTimeBtn}
                                    <ArrowRight className="w-5 h-5" />
                                </Link>
                            </div>
                            <div className="hidden lg:block relative h-full min-h-[350px]">
                                <img
                                    src="/first-time-donor.png"
                                    alt="Happy donor giving blood"
                                    className="absolute inset-0 w-full h-full object-cover rounded-2xl shadow-lg"
                                />
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ───────── DONATION FREQUENCY ───────── */}
            <section className="py-16 lg:py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                            {t.frequencyTitle} <span className="text-primary">{t.frequencyTitleHighlight}</span>
                        </h2>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-8 mb-10">
                        {t.frequencyCards.map((card, i) => {
                            const image = frequencyImages[i] || frequencyImages[0];
                            const filter = frequencyFilters[i] || frequencyFilters[0];

                            return (
                                <motion.div
                                    key={i}
                                    custom={i}
                                    variants={fadeUp}
                                    initial="hidden"
                                    whileInView="visible"
                                    viewport={{ once: true }}
                                    className="bg-card rounded-2xl border border-border/50 p-8 sm:p-10 text-center flex flex-col items-center group hover:shadow-lg transition-all"
                                >
                                    <div className="h-24 w-auto mb-8 relative">
                                        <img
                                            src={image}
                                            alt={`${card.highlight} bag icon`}
                                            className="h-full w-auto object-contain transition-transform group-hover:scale-110 duration-500"
                                            style={{ filter: filter }}
                                        />
                                    </div>
                                    <h3 className="text-lg text-foreground font-semibold leading-relaxed mb-4">
                                        {card.titleStart}
                                        <span style={{
                                            color: i === 0 ? '#e11d48' :
                                                i === 1 ? '#f59e0b' : '#9333ea'
                                        }} className="font-extrabold">{card.highlight}</span>
                                        {card.subtitle}
                                    </h3>
                                    <div className="text-3xl font-extrabold text-foreground mb-4">
                                        {card.value}
                                    </div>
                                    <p className="text-sm text-muted-foreground italic mt-auto">
                                        {card.footnote}
                                    </p>
                                </motion.div>
                            )
                        })}
                    </div>

                    <div className="text-center mt-10 max-w-3xl mx-auto space-y-2 pb-6 border-b border-border/50">
                        <p className="text-base text-foreground font-semibold">
                            {t.frequencyFooter1}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {t.frequencyFooter2}
                        </p>
                    </div>
                </div>
            </section>

            {/* ───────── SUPPORT CTA BANNER ───────── */}
            <section className="bg-gradient-to-r from-primary to-rose-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <div className="text-center space-y-8">
                        <h2 className="text-3xl sm:text-4xl font-bold text-white max-w-2xl mx-auto leading-tight">
                            {t.supportTitle}
                        </h2>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link
                                href="/donate"
                                className="inline-flex items-center gap-2 bg-white text-primary px-8 py-4 rounded-xl font-bold text-base hover:bg-white/90 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 w-full sm:w-auto justify-center"
                            >
                                {t.supportDonateBtn}
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                            <a
                                href="tel:+919422223117"
                                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-xl text-base font-semibold transition-all backdrop-blur-sm border border-white/20 hover:border-white/40 w-full sm:w-auto justify-center"
                            >
                                <Phone className="w-5 h-5" />
                                {t.supportCallBtn}
                            </a>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}
