'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Heart, Clock, Droplet, ArrowRight, ChevronRight,
    Pill, Syringe, Baby, Globe, User, Scale,
    Phone, Mail, HelpCircle, Accessibility, TrendingUp,
    RefreshCw, ShieldCheck, Sparkles, CalendarDays
} from 'lucide-react'

/* ─── Topic data (explorer tabs) ─── */
const eligibilityTopics = [
    {
        id: 'age',
        icon: User,
        label: 'Age, gender and weight',
        content: {
            title: 'Age, Gender & Weight Requirements',
            points: [
                'You must be between 18 and 65 years old to donate blood.',
                'Both males and females can donate blood.',
                'You should weigh at least 45 kg (100 lbs) to be eligible.',
                'For platelet donations, a minimum weight of 50 kg may be required.',
                'Donors above 60 may need additional medical clearance.'
            ]
        }
    },
    {
        id: 'community',
        icon: ShieldCheck,
        label: 'Tips for community',
        content: {
            title: 'Community Donation Tips',
            points: [
                'Encourage friends and family to donate together.',
                'Organize blood donation drives at your workplace or community centre.',
                'Share your donation experience on social media to inspire others.',
                'Regular voluntary donors help maintain a stable blood supply.',
                'Contact us to schedule a community blood drive.'
            ]
        }
    },
    {
        id: 'hemoglobin',
        icon: Droplet,
        label: 'Hemoglobin and iron',
        content: {
            title: 'Hemoglobin & Iron Levels',
            points: [
                'Your hemoglobin level must be at least 12.5 g/dL to donate.',
                'Eat iron-rich foods like spinach, lentils, and red meat before donating.',
                'Vitamin C helps your body absorb iron more effectively.',
                'Avoid tea or coffee immediately before your hemoglobin test.',
                'Low hemoglobin does not always mean low iron — consult a doctor if repeatedly low.'
            ]
        }
    }
]

/* ─── Topic cards (grid) ─── */
const topicCards = [
    {
        icon: Pill,
        title: 'Medical conditions and treatments',
        desc: 'Certain conditions like diabetes, hypertension, or heart disease may affect your eligibility. Controlled conditions are often acceptable.',
        href: '/'
    },
    {
        icon: Syringe,
        title: 'Medications and vaccines',
        desc: 'Most common medications are fine, but some like blood thinners or antibiotics may require a waiting period.',
        href: '/'
    },
    {
        icon: Sparkles,
        title: 'Piercings and tattoos',
        desc: 'If done at a licensed facility, a 6-month waiting period usually applies. Ear piercings with a sterile gun are accepted immediately.',
        href: '/'
    },
    {
        icon: Baby,
        title: 'Pregnancy',
        desc: 'You cannot donate during pregnancy. A waiting period of 6 months after delivery or miscarriage is required.',
        href: '/'
    },
    {
        icon: Heart,
        title: 'Sexual behaviour',
        desc: 'Recent changes have updated many older policies. Eligibility is assessed based on individual risk factors, not orientation.',
        href: '/'
    },
    {
        icon: Globe,
        title: 'Travel and living abroad',
        desc: 'Travel to malaria-endemic areas requires a 3-month deferral. Certain countries may extend the waiting period.',
        href: '/'
    }
]

/* ─── Learn more cards ─── */
const learnMoreCards = [
    {
        icon: Accessibility,
        title: 'Accessibility',
        desc: 'Our donor centres are wheelchair accessible with special accommodations to ensure every donor is comfortable.',
        href: '/'
    },
    {
        icon: TrendingUp,
        title: 'Pulse and iron levels',
        desc: "Your pulse should be between 60–100 bpm. We'll check your pulse and iron as part of the pre-donation screening.",
        href: '/'
    },
    {
        icon: RefreshCw,
        title: 'Recent criteria changes',
        desc: 'Donation criteria are reviewed regularly. See the latest updates to eligibility guidelines.',
        href: '/'
    }
]

/* ─── Donation frequency cards ─── */
const frequencyCards = [
    {
        icon: Droplet,
        title: 'To donate blood',
        subtitle: 'returning donors must wait:',
        value: '56 days',
        color: 'from-red-500 to-rose-600'
    },
    {
        icon: Syringe,
        title: 'To donate plasma',
        subtitle: 'returning donors must wait:',
        value: '28 days',
        color: 'from-amber-500 to-orange-500'
    },
    {
        icon: Heart,
        title: 'To donate platelets',
        subtitle: 'returning donors must wait:',
        value: '14 days',
        color: 'from-pink-500 to-rose-500'
    }
]

/* ─── Fade-in animation variants ─── */
const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.08, duration: 0.5, ease: 'easeOut' }
    })
}

/* ═══════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════ */
export default function EligibilityCriteria() {
    const [activeTab, setActiveTab] = useState(0)

    return (
        <div className="bg-background">
            {/* ───────── HERO ───────── */}
            <section className="relative pt-32 pb-16 lg:pt-40 lg:pb-20 overflow-hidden">
                {/* decorative blobs */}
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
                                Blood Donation
                            </span>
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1]">
                                Eligibility{' '}
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-rose-600">
                                    Criteria
                                </span>
                            </h1>
                            <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
                                Thank you for your interest in donating blood! Before you give, please review the eligibility criteria below to ensure a safe donation experience for you and the recipient.
                            </p>
                            <p className="text-sm text-muted-foreground/80 max-w-lg">
                                Not all conditions are listed here. If unsure about any medical condition or medication, please contact our team for a confidential assessment.
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
                                {/* floating badge */}
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
                                It only takes about
                            </p>
                            <h2 className="text-2xl sm:text-3xl font-bold text-white italic">
                                an hour of your time to change someone&apos;s life.
                            </h2>
                        </div>
                    </div>
                    <Link
                        href="/donate"
                        className="inline-flex items-center gap-2 bg-white text-primary px-7 py-3.5 rounded-full font-bold text-sm hover:bg-white/90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 shrink-0"
                    >
                        Make an appointment
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </section>

            {/* ───────── TOPIC EXPLORER (Tabs) ───────── */}
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
                            Explore the topics below to find out if you&apos;re{' '}
                            <span className="text-primary">eligible to donate</span>
                        </h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            Use the tabs below to learn about common eligibility factors. Select a topic to see detailed information.
                        </p>
                    </motion.div>

                    {/* Tab buttons */}
                    <div className="flex flex-wrap justify-center gap-3 mb-10">
                        {eligibilityTopics.map((topic, i) => (
                            <button
                                key={topic.id}
                                onClick={() => setActiveTab(i)}
                                className={`group inline-flex items-center gap-2 px-5 py-3 rounded-full text-sm font-semibold transition-all duration-300 cursor-pointer border
                                    ${activeTab === i
                                        ? 'bg-primary text-white border-primary shadow-lg shadow-primary/25'
                                        : 'bg-background text-muted-foreground border-border hover:border-primary/30 hover:text-primary'
                                    }`}
                            >
                                <topic.icon className={`w-4 h-4 transition-colors ${activeTab === i ? 'text-white' : 'text-muted-foreground group-hover:text-primary'}`} />
                                {topic.label}
                            </button>
                        ))}
                    </div>

                    {/* Tab content */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            className="bg-card border border-border/50 rounded-2xl p-8 sm:p-10 shadow-sm max-w-3xl mx-auto"
                        >
                            <h3 className="text-xl font-bold text-foreground mb-5 flex items-center gap-3">
                                {(() => {
                                    const Icon = eligibilityTopics[activeTab].icon
                                    return <Icon className="w-6 h-6 text-primary" />
                                })()}
                                {eligibilityTopics[activeTab].content.title}
                            </h3>
                            <ul className="space-y-3">
                                {eligibilityTopics[activeTab].content.points.map((point, i) => (
                                    <motion.li
                                        key={i}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.06 }}
                                        className="flex items-start gap-3 text-muted-foreground"
                                    >
                                        <ChevronRight className="w-4 h-4 text-primary shrink-0 mt-1" />
                                        <span className="text-sm leading-relaxed">{point}</span>
                                    </motion.li>
                                ))}
                            </ul>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </section>

            {/* ───────── TOPIC CARDS GRID ───────── */}
            <section className="py-16 lg:py-20 bg-muted/30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {topicCards.map((card, i) => (
                            <motion.div
                                key={card.title}
                                custom={i}
                                variants={fadeUp}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true }}
                            >
                                <Link href={card.href} className="group block bg-card rounded-2xl p-6 border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-300 h-full">
                                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                                        <card.icon className="w-6 h-6 text-primary" />
                                    </div>
                                    <h3 className="font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                                        {card.title}
                                    </h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {card.desc}
                                    </p>
                                    <span className="inline-flex items-center gap-1 mt-4 text-sm font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                        Learn more <ArrowRight className="w-3.5 h-3.5" />
                                    </span>
                                </Link>
                            </motion.div>
                        ))}
                    </div>

                    <div className="text-center mt-10">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 text-primary font-semibold text-sm hover:underline"
                        >
                            View all eligibility topics
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* ───────── LEARN MORE ───────── */}
            <section className="py-16 lg:py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-12"
                    >
                        <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
                            Learn more about donating{' '}
                            <span className="text-primary">blood and plasma</span>
                        </h2>
                    </motion.div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                        {learnMoreCards.map((card, i) => (
                            <motion.div
                                key={card.title}
                                custom={i}
                                variants={fadeUp}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true }}
                            >
                                <Link href={card.href} className="group block bg-card rounded-2xl p-6 border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-300 h-full">
                                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                                        <card.icon className="w-6 h-6 text-primary" />
                                    </div>
                                    <h3 className="font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                                        {card.title}
                                    </h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {card.desc}
                                    </p>
                                </Link>
                            </motion.div>
                        ))}
                    </div>

                    {/* First-time donor CTA */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-muted/50 via-background to-primary/5 border border-border/50"
                    >
                        <div className="grid lg:grid-cols-2 gap-8 items-center p-8 sm:p-12">
                            <div className="space-y-5">
                                <span className="inline-flex items-center gap-2 text-primary font-semibold text-sm">
                                    <Sparkles className="w-4 h-4" />
                                    New to blood donation?
                                </span>
                                <h3 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight">
                                    First time donor?{' '}
                                    <span className="text-primary">Get started here.</span>
                                </h3>
                                <p className="text-muted-foreground leading-relaxed max-w-md">
                                    Everything you need to know about your first donation — from what to eat before, to what happens during and after. We&apos;ll guide you every step of the way.
                                </p>
                                <Link
                                    href="/donate"
                                    className="inline-flex items-center gap-2 bg-primary text-white px-7 py-3.5 rounded-xl font-bold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5"
                                >
                                    Book Your First Appointment
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                            <div className="hidden lg:block relative">
                                <img
                                    src="/blood-2.webp"
                                    alt="First time donor"
                                    className="w-full h-[320px] object-cover rounded-2xl shadow-lg"
                                />
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ───────── DONATION FREQUENCY ───────── */}
            <section className="py-16 lg:py-20 bg-muted/30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-12"
                    >
                        <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
                            Donation <span className="text-primary">Frequency</span>
                        </h2>
                        <p className="text-muted-foreground max-w-xl mx-auto">
                            Different types of donations have different waiting periods between each donation.
                        </p>
                    </motion.div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                        {frequencyCards.map((card, i) => (
                            <motion.div
                                key={card.title}
                                custom={i}
                                variants={fadeUp}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true }}
                                className="relative bg-card rounded-2xl border border-border/50 overflow-hidden group hover:shadow-xl transition-all duration-300"
                            >
                                <div className={`h-1.5 bg-gradient-to-r ${card.color}`} />
                                <div className="p-7 text-center">
                                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                        <card.icon className="w-7 h-7 text-primary" />
                                    </div>
                                    <h3 className="font-bold text-foreground text-lg mb-1">{card.title}</h3>
                                    <p className="text-sm text-muted-foreground mb-4">{card.subtitle}</p>
                                    <div className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-rose-600">
                                        {card.value}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <p className="text-center text-sm text-muted-foreground max-w-2xl mx-auto">
                        All donation intervals are as per government of India guidelines. Individual cases may vary — consult our team for personalised advice.
                    </p>
                </div>
            </section>

            {/* ───────── SUPPORT CTA BANNER ───────── */}
            <section className="bg-gradient-to-r from-primary to-rose-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="text-center space-y-5">
                        <h2 className="text-2xl sm:text-3xl font-bold text-white">
                            If you have questions or need support, please reach out:
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
