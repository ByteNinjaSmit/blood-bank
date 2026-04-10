'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
    ArrowRight, Droplet, Heart, Clock, CheckCircle2,
    Phone, Mail, Utensils, Dumbbell, AlertTriangle,
    ClipboardList, Stethoscope, ShieldCheck, Sparkles,
    Coffee, Gift, Users, Accessibility, HandHeart,
    FileText, ThermometerSun, Syringe, Activity
} from 'lucide-react'

/* ─── Before you donate tips ─── */
const beforeTips = [
    {
        icon: Utensils,
        title: 'Eat well',
        desc: 'Have a healthy, iron-rich meal at least 2–3 hours before donating. Avoid fatty or fried foods as they can affect blood test results.'
    },
    {
        icon: Droplet,
        title: 'Stay hydrated',
        desc: 'Drink plenty of water and fluids in the 24 hours before your donation. Being well-hydrated makes the process faster and more comfortable.'
    },
    {
        icon: ThermometerSun,
        title: 'Get enough rest',
        desc: 'Make sure you have had a good night\'s sleep (at least 6–8 hours) before your appointment.'
    },
    {
        icon: AlertTriangle,
        title: 'Avoid alcohol',
        desc: 'Do not consume alcohol for at least 24 hours before donating. Alcohol can cause dehydration and affect your blood test results.'
    },
    {
        icon: FileText,
        title: 'Bring valid ID',
        desc: 'Carry a valid photo ID (Aadhaar, PAN card, driving licence, or passport) when you come to donate.'
    },
    {
        icon: ClipboardList,
        title: 'Know your medications',
        desc: 'Make a list of any medications you are currently taking. Some medications may require a temporary deferral.'
    }
]

/* ─── Donation process steps ─── */
const processSteps = [
    {
        step: 1,
        icon: ClipboardList,
        title: 'Registration',
        desc: 'When you arrive at the donor centre, you will be asked to fill out a registration form with your personal details and medical history. This is kept confidential and helps us ensure your donation is safe.',
        duration: '5–10 min'
    },
    {
        step: 2,
        icon: Stethoscope,
        title: 'Health screening',
        desc: 'A trained healthcare professional will check your blood pressure, pulse, temperature, and hemoglobin level. You will also be asked a series of confidential health questions (the donor questionnaire) to determine your eligibility.',
        duration: '10–15 min'
    },
    {
        step: 3,
        icon: Droplet,
        title: 'The donation',
        desc: 'You will be seated comfortably in a reclining chair. A sterile, single-use needle is gently inserted into a vein in your arm. The actual blood collection takes about 8–10 minutes, during which approximately 350–450 ml of blood is collected. The entire process is safe, hygienic, and virtually painless.',
        duration: '8–10 min'
    },
    {
        step: 4,
        icon: Coffee,
        title: 'Refreshments & rest',
        desc: 'After donating, you will rest for 10–15 minutes in our refreshment area. You will be offered snacks, juice, and water. This helps your body begin to replenish fluids. Our staff will monitor you to ensure you feel well before leaving.',
        duration: '10–15 min'
    }
]

/* ─── Donor questionnaire info ─── */
const questionnairePoints = [
    'The questionnaire is a standard part of every blood donation — for both new and returning donors.',
    'It includes questions about your general health, travel history, medications, and lifestyle.',
    'All responses are completely confidential and are used only to assess your eligibility.',
    'The questionnaire is reviewed by a trained healthcare professional before your donation.',
    'If you have any concerns about a question, our staff are happy to explain in a private setting.',
    'You can review the questionnaire in advance on our website to prepare for your visit.'
]

/* ─── After donation tips ─── */
const afterTips = [
    { icon: Coffee, text: 'Drink extra fluids (water, juice) for the next 24–48 hours.' },
    { icon: Utensils, text: 'Eat a full, nutritious meal within a few hours of donating.' },
    { icon: AlertTriangle, text: 'Avoid strenuous physical activity or heavy lifting for at least 12 hours.' },
    { icon: Droplet, text: 'Avoid alcohol for at least 24 hours after donating.' },
    { icon: ThermometerSun, text: 'If you feel dizzy or lightheaded, lie down and elevate your legs until the feeling passes.' },
    { icon: ShieldCheck, text: 'Keep the bandage on your arm for at least 4–6 hours after donation.' }
]

/* ─── FAQ ─── */
const faqs = [
    {
        q: 'Does donating blood hurt?',
        a: 'You may feel a brief pinch when the needle is inserted, similar to a blood test. After that, most donors feel no discomfort at all during the donation.'
    },
    {
        q: 'How long does the entire process take?',
        a: 'The total visit takes about 45 minutes to 1 hour, including registration, screening, the donation itself (8–10 minutes), and the refreshment/rest period.'
    },
    {
        q: 'How often can I donate blood?',
        a: 'In India, males can donate whole blood every 90 days (3 months), and females every 120 days (4 months). Platelet donors can give every 14 days.'
    },
    {
        q: 'What happens to my blood after donation?',
        a: 'Your blood is tested, processed, and separated into components (red cells, plasma, platelets). It is then stored and distributed to hospitals and patients in need.'
    },
    {
        q: 'Can I donate if I have a tattoo or piercing?',
        a: 'Yes, you are eligible to donate blood 12 months after getting a tattoo or a piercing. Ear piercings with a sterile single-use gun standard may be accepted earlier.'
    }
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
export default function DonationProcess() {
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
                            Step-by-Step Guide
                        </span>
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.1]">
                            Blood donation process
                        </h1>
                        <p className="text-lg text-white/85 leading-relaxed max-w-2xl">
                            Donating blood is a safe, simple, and rewarding experience. Whether it&apos;s your first time or you&apos;re a regular donor, here&apos;s everything you need to know about what happens before, during, and after your donation.
                        </p>
                        <div className="flex flex-wrap gap-3 pt-2">
                            <Link
                                href="/donate"
                                className="inline-flex items-center gap-2 bg-white text-primary px-7 py-3.5 rounded-full font-bold text-sm hover:bg-white/90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                            >
                                Book an appointment
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                            <Link
                                href="/eligibility-criteria"
                                className="inline-flex items-center gap-2 bg-white/15 text-white px-7 py-3.5 rounded-full font-semibold text-sm hover:bg-white/25 transition-colors backdrop-blur-sm border border-white/20"
                            >
                                Check eligibility
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
                            Before you donate
                        </h2>
                        <p className="text-muted-foreground leading-relaxed max-w-2xl">
                            A little preparation goes a long way in making your donation experience smooth and comfortable. Follow these tips before your visit.
                        </p>
                    </motion.div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {beforeTips.map((tip, i) => (
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
                                    <tip.icon className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-foreground text-sm mb-1">{tip.title}</h3>
                                    <p className="text-xs text-muted-foreground leading-relaxed">{tip.desc}</p>
                                </div>
                            </motion.div>
                        ))}
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
                            What happens{' '}
                            <span className="text-primary">during your visit</span>
                        </h2>
                        <p className="text-muted-foreground max-w-xl mx-auto">
                            The entire donation process takes about 45 minutes to 1 hour. Here&apos;s a step-by-step breakdown.
                        </p>
                    </motion.div>

                    <div className="space-y-0">
                        {processSteps.map((step, i) => (
                            <motion.div
                                key={step.step}
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
                                        {step.step}
                                    </div>
                                    {i < processSteps.length - 1 && (
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
                            Total time: approximately 45 minutes to 1 hour
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
                            Donor questionnaire
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Before every donation, you will be asked to complete a donor questionnaire. This is an essential part of ensuring the safety of both the donor and the recipient. Here&apos;s what you should know:
                        </p>
                    </motion.div>

                    <div className="space-y-3">
                        {questionnairePoints.map((point, i) => (
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
                                Every donation can save up to 3 lives.
                            </h2>
                            <p className="text-white/80 text-sm mt-1">
                                Your single donation is separated into red cells, plasma, and platelets.
                            </p>
                        </div>
                    </div>
                    <Link
                        href="/donate"
                        className="inline-flex items-center gap-2 bg-white text-primary px-7 py-3.5 rounded-full font-bold text-sm hover:bg-white/90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 shrink-0"
                    >
                        Donate Now
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
                            Post-donation care
                        </span>
                        <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
                            Relax and refresh
                        </h2>
                        <p className="text-muted-foreground leading-relaxed max-w-2xl">
                            After your donation, it&apos;s important to take care of yourself. Your body will replace the donated blood volume within 24–48 hours, and red blood cells are fully replenished within 4–6 weeks. Follow these guidelines at home:
                        </p>
                    </motion.div>

                    <div className="grid sm:grid-cols-2 gap-4">
                        {afterTips.map((tip, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 15 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.06 }}
                                className="flex items-start gap-3 py-4 border-b border-border/50"
                            >
                                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                    <tip.icon className="w-4 h-4 text-primary" />
                                </div>
                                <p className="text-sm text-muted-foreground leading-relaxed">{tip.text}</p>
                            </motion.div>
                        ))}
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
                            A donation in your honour
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Did you know you can dedicate your blood donation to someone special? Whether it&apos;s a friend, family member, or a loved one who has benefited from blood products — you can make your donation in their honour. Simply let our staff know at the donor centre, and we&apos;ll provide a dedication card that you can give to the person you&apos;re honouring.
                        </p>
                        <p className="text-muted-foreground leading-relaxed">
                            It&apos;s a meaningful way to turn your generosity into a personal gesture and inspire others to donate as well.
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
                            Accessibility &amp; interpreting services
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We are committed to making blood donation accessible to everyone. Our donor centres offer the following services and accommodations:
                        </p>
                    </motion.div>

                    <div className="grid sm:grid-cols-2 gap-5">
                        {[
                            {
                                icon: Accessibility,
                                title: 'Wheelchair accessible',
                                desc: 'All donor centres are fully wheelchair accessible, with adapted donation chairs and accessible restrooms.'
                            },
                            {
                                icon: Users,
                                title: 'Language support',
                                desc: 'Many of our centres offer multi-language support, including Hindi, Marathi, and English. Interpreting services are available on request.'
                            },
                            {
                                icon: HandHeart,
                                title: 'Support for anxious donors',
                                desc: 'If you feel nervous about donating, our staff are trained to help you feel comfortable. Let us know and we\'ll provide extra care.'
                            },
                            {
                                icon: ShieldCheck,
                                title: 'Privacy & confidentiality',
                                desc: 'All health information and questionnaire responses are kept strictly confidential and used only for donation safety.'
                            }
                        ].map((service, i) => (
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
                                    <service.icon className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-foreground text-sm mb-1">{service.title}</h3>
                                    <p className="text-xs text-muted-foreground leading-relaxed">{service.desc}</p>
                                </div>
                            </motion.div>
                        ))}
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
                            Frequently asked questions
                        </h2>
                    </motion.div>

                    <div>
                        {faqs.map((faq, i) => (
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
                            Have questions? We&apos;re here to help.
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
