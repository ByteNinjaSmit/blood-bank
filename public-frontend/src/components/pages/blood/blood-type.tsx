'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
    ArrowRight, Droplet, Heart, HelpCircle,
    Phone, Mail, Sparkles, ShieldCheck, CheckCircle2,
    XCircle, Users, AlertCircle, Search
} from 'lucide-react'

/* ─── 8 Blood types data ─── */
const bloodTypes = [
    { type: 'O+', percent: '32.5%', color: 'from-red-500 to-rose-600', description: 'One of the most common types in India. Can donate red blood cells to any Rh-positive type.' },
    { type: 'B+', percent: '32.1%', color: 'from-pink-500 to-fuchsia-600', description: 'Equally common as O+ in India. Can donate to B+ and AB+ recipients.' },
    { type: 'A+', percent: '22.5%', color: 'from-rose-500 to-pink-600', description: 'Common type in India. Can donate to A+ and AB+ recipients.' },
    { type: 'AB+', percent: '7.7%', color: 'from-purple-500 to-violet-600', description: 'Universal plasma donor. Found in about 8% of the Indian population.' },
    { type: 'O−', percent: '2.0%', color: 'from-red-700 to-red-800', description: 'Universal red cell donor. Rare in India, comprising only 2% of the population.' },
    { type: 'B−', percent: '1.5%', color: 'from-pink-700 to-fuchsia-800', description: 'Rare in India. Can donate red cells to B+, B−, AB+, and AB− recipients.' },
    { type: 'A−', percent: '1.4%', color: 'from-rose-700 to-pink-800', description: 'Rare in India. Can donate red cells to A+, A−, AB+, and AB− recipients.' },
    { type: 'AB−', percent: '0.3%', color: 'from-purple-700 to-violet-800', description: 'Rarest blood type in India. Universal plasma donor.' }
]

/* ─── Blood type facts ─── */
const bloodFacts = [
    {
        type: 'AB+',
        heading: 'AB-positive patients can receive red blood cells from all eight blood types — making them universal recipients.',
        body: 'While AB+ is fortunate in receiving, it is also the universal plasma donor, meaning their plasma can be given to patients of any blood type.',
        highlight: true
    },
    {
        type: 'AB−',
        heading: 'AB-negative is the rarest blood type, found in less than 1% of the Indian population.',
        body: 'Despite being rare, AB− donors are incredibly valuable as universal plasma donors, and their red cells can be given to all AB and AB-negative patients.',
        highlight: false
    },
    {
        type: 'O−',
        heading: 'O-negative is the universal donor for red blood cells — it can be given to anyone in an emergency.',
        body: 'Because O-negative blood can be transfused to any patient regardless of their blood type, it is always in high demand and often the first blood used in trauma situations.',
        highlight: true
    },
    {
        type: 'O+',
        heading: 'O-positive is the most needed blood type, used in 37% of all red blood cell transfusions.',
        body: 'As the most common blood type, O+ blood is constantly needed by hospitals. O+ donors are encouraged to donate regularly to help maintain stable supplies.',
        highlight: false
    }
]

/* ─── Compatibility chart ─── */
const compatibilityData = {
    headers: ['O−', 'O+', 'A−', 'A+', 'B−', 'B+', 'AB−', 'AB+'],
    rows: [
        { type: 'O−', canReceive: [true, false, false, false, false, false, false, false] },
        { type: 'O+', canReceive: [true, true, false, false, false, false, false, false] },
        { type: 'A−', canReceive: [true, false, true, false, false, false, false, false] },
        { type: 'A+', canReceive: [true, true, true, true, false, false, false, false] },
        { type: 'B−', canReceive: [true, false, false, false, true, false, false, false] },
        { type: 'B+', canReceive: [true, true, false, false, true, true, false, false] },
        { type: 'AB−', canReceive: [true, false, true, false, true, false, true, false] },
        { type: 'AB+', canReceive: [true, true, true, true, true, true, true, true] }
    ]
}

/* ─── Distribution data for visual chart ─── */
const distribution = [
    { type: 'O+', percent: 32.5, color: '#ef4444' },
    { type: 'B+', percent: 32.1, color: '#ec4899' },
    { type: 'A+', percent: 22.5, color: '#f43f5e' },
    { type: 'AB+', percent: 7.7, color: '#a855f7' },
    { type: 'O−', percent: 2.0, color: '#dc2626' },
    { type: 'B−', percent: 1.5, color: '#be185d' },
    { type: 'A−', percent: 1.4, color: '#e11d48' },
    { type: 'AB−', percent: 0.3, color: '#7e22ce' }
]

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
                            Blood Basics
                        </span>
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1]">
                            What is my{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-rose-600">
                                blood type?
                            </span>
                        </h1>
                        <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
                            Your blood type is determined by the presence or absence of certain antigens — substances that can trigger an immune response. Understanding your blood type is important for safe transfusions, donations, and medical emergencies.
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
                            How to find out your blood type
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            The easiest way to find out your blood type is to <strong>donate blood</strong>. When you donate with us, your blood will be tested and your blood type will be confirmed. You&apos;ll receive your blood type information on your donor card and in your donor profile. You can also ask your doctor for a blood typing test during a routine check-up, or purchase a home blood typing kit from a pharmacy.
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
                                What is the most common blood type?
                            </h2>
                            <p className="text-muted-foreground leading-relaxed">
                                <strong className="text-foreground">O-positive (O+)</strong> and <strong className="text-foreground">B-positive (B+)</strong> are the most common blood types in India, each found in approximately 32% of the population. Because they are so prevalent, these blood types are always in high demand at hospitals and blood banks. If you have O+ or B+ blood, your donations are especially valuable and needed on a regular basis.
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
                                    <p className="text-sm font-medium mt-1 opacity-90">Most Common</p>
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
                            What is the universal donor blood type?
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            <strong className="text-foreground">O-negative (O−)</strong> is known as the universal donor blood type because O− red blood cells can be transfused to patients of <em>any</em> blood type. This makes it the blood type most often used in emergencies when there&apos;s no time to determine a patient&apos;s blood type. O− blood is always in critical demand — only about 6.6% of the population has this type. If you are O−, your blood is literally a lifesaver for anyone in crisis.
                        </p>
                        <p className="text-muted-foreground leading-relaxed">
                            Similarly, <strong className="text-foreground">AB-positive (AB+)</strong> is the universal recipient — AB+ patients can receive red blood cells from donors of any blood type. And <strong className="text-foreground">AB plasma</strong> (both AB+ and AB−) is universal plasma and can be given to patients of any blood type.
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
                            How many different{' '}
                            <span className="text-primary">blood types</span> are there?
                        </h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            There are <strong className="text-foreground">8 main blood types</strong> determined by the ABO group system and the Rh factor (positive or negative). Each type has unique properties that determine who you can donate to and receive from.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
                        {bloodTypes.map((bt, i) => (
                            <motion.div
                                key={bt.type}
                                custom={i}
                                variants={fadeUp}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true }}
                                className="group bg-card rounded-2xl border border-border/50 p-5 sm:p-6 hover:border-primary/30 hover:shadow-lg transition-all duration-300 text-center"
                            >
                                <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br ${bt.color} flex items-center justify-center mx-auto mb-3 shadow-lg`}>
                                    <span className="text-white text-lg sm:text-xl font-extrabold">{bt.type}</span>
                                </div>
                                <p className="text-2xl font-extrabold text-foreground mb-1">{bt.percent}</p>
                                <p className="text-xs text-muted-foreground">of population</p>
                                <p className="text-xs text-muted-foreground mt-3 leading-relaxed hidden sm:block">{bt.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ───────── BLOOD TYPE FACTS ───────── */}
            <section className="py-16 lg:py-20">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
                    {bloodFacts.map((fact, i) => (
                        <motion.div
                            key={i}
                            custom={i}
                            variants={fadeUp}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            className={`rounded-2xl p-6 sm:p-8 ${fact.highlight
                                ? 'bg-gradient-to-r from-primary to-rose-700 text-white'
                                : 'bg-card border border-border/50'
                                }`}
                        >
                            <div className="flex items-start gap-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 font-extrabold text-sm ${fact.highlight
                                    ? 'bg-white/20 text-white'
                                    : 'bg-primary/10 text-primary'
                                    }`}>
                                    {fact.type}
                                </div>
                                <div>
                                    <h3 className={`font-bold text-lg mb-2 leading-snug ${fact.highlight ? 'text-white' : 'text-foreground'}`}>
                                        {fact.heading}
                                    </h3>
                                    <p className={`text-sm leading-relaxed ${fact.highlight ? 'text-white/85' : 'text-muted-foreground'}`}>
                                        {fact.body}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
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
                            Blood type{' '}
                            <span className="text-primary">compatibility</span>
                        </h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            Not all blood types are compatible. The chart below shows which blood types a recipient can safely receive red blood cells from. A <CheckCircle2 className="w-4 h-4 text-green-600 inline-block" /> means the transfusion is compatible, and a <XCircle className="w-4 h-4 text-red-400 inline-block" /> means it is not.
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
                                        Recipient ↓ / Donor →
                                    </th>
                                    {compatibilityData.headers.map((h) => (
                                        <th key={h} className="p-3 text-center text-sm font-bold text-foreground bg-card border border-border last:rounded-tr-xl">
                                            <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary text-xs font-extrabold">
                                                {h}
                                            </span>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {compatibilityData.rows.map((row, ri) => (
                                    <tr key={row.type} className="hover:bg-muted/50 transition-colors">
                                        <td className={`p-3 text-sm font-bold text-foreground bg-card border border-border ${ri === compatibilityData.rows.length - 1 ? 'rounded-bl-xl' : ''}`}>
                                            <span className="inline-flex items-center gap-2">
                                                <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-primary/10 text-primary text-xs font-extrabold">
                                                    {row.type}
                                                </span>
                                                {row.type}
                                            </span>
                                        </td>
                                        {row.canReceive.map((ok, ci) => (
                                            <td key={ci} className={`p-3 text-center border border-border ${ri === compatibilityData.rows.length - 1 && ci === row.canReceive.length - 1 ? 'rounded-br-xl' : ''}`}>
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
                            Rare blood program
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Some people have blood types that are extremely rare or have unusual antigen combinations that go beyond the standard ABO/Rh system. Our <strong className="text-foreground">Rare Blood Program</strong> maintains a registry of donors with rare blood types to ensure that patients with uncommon blood needs can receive safe, compatible transfusions.
                        </p>
                        <p className="text-muted-foreground leading-relaxed">
                            If you have been told you have a rare blood type, or if your blood has been difficult to cross-match in the past, please contact us. Your donations could be the only option for a patient in need.
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
                            <h3 className="font-bold text-lg text-foreground mb-5">Blood type distribution in India</h3>
                            <div className="space-y-3">
                                {distribution.map((d, i) => (
                                    <div key={d.type} className="flex items-center gap-3">
                                        <span className="w-10 text-sm font-bold text-foreground">{d.type}</span>
                                        <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                whileInView={{ width: `${(d.percent / 37.4) * 100}%` }}
                                                viewport={{ once: true }}
                                                transition={{ duration: 0.8, delay: i * 0.08, ease: 'easeOut' }}
                                                className="h-full rounded-full"
                                                style={{ backgroundColor: d.color }}
                                            />
                                        </div>
                                        <span className="w-14 text-right text-sm font-semibold text-muted-foreground">{d.percent}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="font-bold text-lg text-foreground mb-5">Most needed blood types</h3>
                            <div className="space-y-4">
                                {[
                                    { type: 'O+', reason: 'Used most often in transfusions; always in high demand due to large number of O+ patients.' },
                                    { type: 'O−', reason: 'Universal donor — critical for emergencies. Only 6.6% of the population has this type.' },
                                    { type: 'A+', reason: 'Second most common type; needed for A+ and AB+ patients in surgeries and treatments.' },
                                    { type: 'B+', reason: 'Essential for B+ and AB+ recipients; demand often exceeds supply during festivals and monsoons.' }
                                ].map((item) => (
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
                            Don&apos;t know your blood type?
                        </h2>
                        <p className="text-white/85 max-w-xl mx-auto leading-relaxed">
                            The simplest way to find out is to donate blood. We&apos;ll test your blood and let you know your type — and you&apos;ll save a life in the process.
                        </p>
                        <div className="flex flex-wrap justify-center gap-4 pt-2">
                            <Link
                                href="/donate"
                                className="inline-flex items-center gap-2 bg-white text-primary px-7 py-3.5 rounded-full font-bold text-sm hover:bg-white/90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                            >
                                Book an Appointment
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
                            Have questions? Reach out to us.
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
