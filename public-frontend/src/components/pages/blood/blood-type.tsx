'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
    ArrowRight, Droplet, Phone, Mail,
    CheckCircle2, XCircle
} from 'lucide-react'
import { useLanguage } from '@/context/language-context'
import { content } from '@/lib/content'

/* ─── Compatibility chart (structure only — labels come from content) ─── */
const compatibilityHeaders = ['O−', 'O+', 'A−', 'A+', 'B−', 'B+', 'AB−', 'AB+']
const compatibilityRows = [
    { type: 'O−', canReceive: [true, false, false, false, false, false, false, false] },
    { type: 'O+', canReceive: [true, true, false, false, false, false, false, false] },
    { type: 'A−', canReceive: [true, false, true, false, false, false, false, false] },
    { type: 'A+', canReceive: [true, true, true, true, false, false, false, false] },
    { type: 'B−', canReceive: [true, false, false, false, true, false, false, false] },
    { type: 'B+', canReceive: [true, true, false, false, true, true, false, false] },
    { type: 'AB−', canReceive: [true, false, true, false, true, false, true, false] },
    { type: 'AB+', canReceive: [true, true, true, true, true, true, true, true] }
]

/* ─── Distribution colors & values (order matches content.bloodTypePage.bloodTypes) ─── */
const distributionColors = ['#ef4444', '#ec4899', '#f43f5e', '#a855f7', '#dc2626', '#be185d', '#e11d48', '#7e22ce']
const distributionValues = [32.5, 32.1, 22.5, 7.7, 2.0, 1.5, 1.4, 0.3]

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
export default function BloodType() {
    const { language } = useLanguage()
    const t = content[language].bloodTypePage
    const maxPercent = 37.4

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
                            <Droplet className="w-4 h-4" />
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
                    </motion.div>
                </div>
            </section>

            {/* ───────── HOW TO FIND OUT ───────── */}
            <section className="py-14 lg:py-20 bg-muted/30">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="space-y-5"
                    >
                        <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                            {t.howToFindTitle}
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            {t.howToFindText}
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* ───────── MOST COMMON BLOOD TYPE ───────── */}
            <section className="py-14 lg:py-20">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-[1fr,auto] gap-8 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="space-y-4"
                        >
                            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                                {t.mostCommonTitle}
                            </h2>
                            <p className="text-muted-foreground leading-relaxed">
                                {t.mostCommonText}
                            </p>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            className="flex items-center justify-center"
                        >
                            <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-gradient-to-br from-primary to-rose-600 flex items-center justify-center shadow-2xl shadow-primary/30">
                                <div className="text-center text-white">
                                    <p className="text-4xl sm:text-5xl font-extrabold">O+</p>
                                    <p className="text-sm font-medium mt-1 opacity-90">{t.mostCommonBadge}</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ───────── UNIVERSAL DONOR ───────── */}
            <section className="py-14 lg:py-20 bg-muted/30">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="space-y-5"
                    >
                        <h2 className="text-2xl sm:text-3xl font-bold text-primary">
                            {t.universalDonorTitle}
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            {t.universalDonorText1}
                        </p>
                        <p className="text-muted-foreground leading-relaxed">
                            {t.universalDonorText2}
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* ───────── 8 BLOOD TYPES ───────── */}
            <section className="py-16 lg:py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-12"
                    >
                        <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
                            {t.typesTitleStart}
                            <span className="text-primary">{t.typesTitleHighlight}</span>
                        </h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            {t.typesDescription}
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
                        {t.bloodTypes.map((bt, i) => {
                            const colors = [
                                'from-red-500 to-rose-600', 'from-pink-500 to-fuchsia-600',
                                'from-rose-500 to-pink-600', 'from-purple-500 to-violet-600',
                                'from-red-700 to-red-800', 'from-pink-700 to-fuchsia-800',
                                'from-rose-700 to-pink-800', 'from-purple-700 to-violet-800'
                            ]
                            return (
                                <motion.div
                                    key={bt.type}
                                    custom={i}
                                    variants={fadeUp}
                                    initial="hidden"
                                    whileInView="visible"
                                    viewport={{ once: true }}
                                    className="group bg-card rounded-2xl border border-border/50 p-5 sm:p-6 hover:border-primary/30 hover:shadow-lg transition-all duration-300 text-center"
                                >
                                    <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br ${colors[i]} flex items-center justify-center mx-auto mb-3 shadow-lg`}>
                                        <span className="text-white text-lg sm:text-xl font-extrabold">{bt.type}</span>
                                    </div>
                                    <p className="text-2xl font-extrabold text-foreground mb-1">{bt.percent}</p>
                                    <p className="text-xs text-muted-foreground mt-3 leading-relaxed hidden sm:block">{bt.description}</p>
                                </motion.div>
                            )
                        })}
                    </div>
                </div>
            </section>

            {/* ───────── BLOOD TYPE FACTS ───────── */}
            <section className="py-16 lg:py-20">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
                    {t.bloodFacts.map((fact, i) => {
                        const highlight = i === 0 || i === 2
                        return (
                            <motion.div
                                key={i}
                                custom={i}
                                variants={fadeUp}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true }}
                                className={`rounded-2xl p-6 sm:p-8 ${highlight
                                    ? 'bg-gradient-to-r from-primary to-rose-700 text-white'
                                    : 'bg-card border border-border/50'
                                    }`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 font-extrabold text-sm ${highlight
                                        ? 'bg-white/20 text-white'
                                        : 'bg-primary/10 text-primary'
                                        }`}>
                                        {fact.type}
                                    </div>
                                    <div>
                                        <h3 className={`font-bold text-lg mb-2 leading-snug ${highlight ? 'text-white' : 'text-foreground'}`}>
                                            {fact.heading}
                                        </h3>
                                        <p className={`text-sm leading-relaxed ${highlight ? 'text-white/85' : 'text-muted-foreground'}`}>
                                            {fact.body}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        )
                    })}
                </div>
            </section>

            {/* ───────── COMPATIBILITY CHART ───────── */}
            <section className="py-16 lg:py-24 bg-muted/30">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-10"
                    >
                        <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
                            {t.compatTitleStart}
                            <span className="text-primary">{t.compatTitleHighlight}</span>
                        </h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            {t.compatDescription} <CheckCircle2 className="w-4 h-4 text-green-600 inline-block" /> / <XCircle className="w-4 h-4 text-red-400 inline-block" />
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="overflow-x-auto"
                    >
                        <table className="w-full min-w-[600px] border-collapse">
                            <thead>
                                <tr>
                                    <th className="p-3 text-left text-sm font-bold text-foreground bg-card border border-border rounded-tl-xl">
                                        {t.compatRecipientHeader}
                                    </th>
                                    {compatibilityHeaders.map((h) => (
                                        <th key={h} className="p-3 text-center text-sm font-bold text-foreground bg-card border border-border last:rounded-tr-xl">
                                            <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary text-xs font-extrabold">
                                                {h}
                                            </span>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {compatibilityRows.map((row, ri) => (
                                    <tr key={row.type} className="hover:bg-muted/50 transition-colors">
                                        <td className={`p-3 text-sm font-bold text-foreground bg-card border border-border ${ri === compatibilityRows.length - 1 ? 'rounded-bl-xl' : ''}`}>
                                            <span className="inline-flex items-center gap-2">
                                                <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-primary/10 text-primary text-xs font-extrabold">
                                                    {row.type}
                                                </span>
                                                {row.type}
                                            </span>
                                        </td>
                                        {row.canReceive.map((ok, ci) => (
                                            <td key={ci} className={`p-3 text-center border border-border ${ri === compatibilityRows.length - 1 && ci === row.canReceive.length - 1 ? 'rounded-br-xl' : ''}`}>
                                                {ok ? (
                                                    <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto" />
                                                ) : (
                                                    <XCircle className="w-5 h-5 text-red-300 mx-auto" />
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </motion.div>
                </div>
            </section>

            {/* ───────── RARE BLOOD PROGRAM ───────── */}
            <section className="py-16 lg:py-20">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="space-y-5 mb-12"
                    >
                        <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                            {t.rareBloodTitle}
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            {t.rareBloodText1}
                        </p>
                        <p className="text-muted-foreground leading-relaxed">
                            {t.rareBloodText2}
                        </p>
                    </motion.div>

                    {/* Distribution stats (horizontal bars) */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="grid md:grid-cols-2 gap-8 items-start"
                    >
                        <div>
                            <h3 className="font-bold text-lg text-foreground mb-5">{t.distributionTitle}</h3>
                            <div className="space-y-3">
                                {t.bloodTypes.map((d, i) => (
                                    <div key={d.type} className="flex items-center gap-3">
                                        <span className="w-10 text-sm font-bold text-foreground">{d.type}</span>
                                        <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                whileInView={{ width: `${(distributionValues[i] / maxPercent) * 100}%` }}
                                                viewport={{ once: true }}
                                                transition={{ duration: 0.8, delay: i * 0.08, ease: 'easeOut' }}
                                                className="h-full rounded-full"
                                                style={{ backgroundColor: distributionColors[i] }}
                                            />
                                        </div>
                                        <span className="w-14 text-right text-sm font-semibold text-muted-foreground">{d.percent}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="font-bold text-lg text-foreground mb-5">{t.mostNeededTitle}</h3>
                            <div className="space-y-4">
                                {t.mostNeeded.map((item) => (
                                    <div key={item.type} className="flex items-start gap-3">
                                        <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-primary/10 text-primary text-xs font-extrabold shrink-0">
                                            {item.type}
                                        </span>
                                        <p className="text-sm text-muted-foreground leading-relaxed">{item.reason}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ───────── DON'T KNOW YOUR BLOOD TYPE? CTA ───────── */}
            <section className="bg-gradient-to-r from-primary to-rose-700">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center space-y-5"
                    >
                        <h2 className="text-2xl sm:text-3xl font-bold text-white">
                            {t.unknownTitle}
                        </h2>
                        <p className="text-white/85 max-w-xl mx-auto leading-relaxed">
                            {t.unknownText}
                        </p>
                        <div className="flex flex-wrap justify-center gap-4 pt-2">
                            <Link
                                href="/donate"
                                className="inline-flex items-center gap-2 bg-white text-primary px-7 py-3.5 rounded-full font-bold text-sm hover:bg-white/90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                            >
                                {t.bookAppointment}
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ───────── SUPPORT CTA ───────── */}
            <section className="py-12 bg-muted/30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center space-y-5">
                        <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                            {t.questionsTitle}
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
