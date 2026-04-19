'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
    ArrowRight, ShieldCheck, Heart, Phone, Mail,
    Droplet, AlertTriangle, ThermometerSun, Activity,
    Clock, CheckCircle2, HelpCircle, ChevronDown,
    Stethoscope, Syringe, Cookie, Dumbbell,
    HeartPulse, ShieldAlert, Sparkles, BandageIcon
} from 'lucide-react'
import { useState } from 'react'

/* ─── FAQ data ─── */
const faqs = [
    {
        q: 'What should I do if I don\'t feel well after donating?',
        a: 'It is normal to feel slightly lightheaded or dizzy after donating. If this happens, sit or lie down immediately and elevate your legs. Apply a cold compress to your forehead and drink fluids. Most symptoms resolve within a few minutes. If you continue to feel unwell after 15–20 minutes, contact our donor helpline or visit our nearest centre for assistance. Do not drive or operate heavy machinery until you feel completely normal.'
    },
    {
        q: 'Is donating blood safe?',
        a: 'Yes, donating blood is extremely safe. All equipment used — including needles, bags, and tubing — is sterile, single-use, and disposed of after each donation. There is absolutely no risk of contracting any infection from donating blood. Our staff are trained medical professionals who follow strict safety protocols at every step.'
    },
    {
        q: 'How much blood is taken during a donation?',
        a: 'During a standard whole blood donation, approximately 350–450 ml of blood is collected, which is less than 10% of the total blood volume in an average adult. Your body begins to replenish the lost volume within hours and fully restores it within 24–48 hours. Red blood cells are completely replaced within 4–6 weeks.'
    },
    {
        q: 'Will I feel tired or weak after donating?',
        a: 'Most donors feel perfectly normal after donating. Some may experience mild fatigue or tiredness for the rest of the day. This is normal and can be managed by staying hydrated, eating well, and avoiding strenuous activity for 12–24 hours. If you feel persistently tired beyond 24 hours, please contact our helpline.'
    },
    {
        q: 'Can I exercise after donating blood?',
        a: 'We recommend avoiding strenuous physical activity, heavy lifting, and intense exercise for at least 12 hours after your donation. Light activities like walking are fine. After 24 hours, most donors can resume their normal exercise routine. Listen to your body — if you feel any dizziness or weakness during exercise, stop and rest.'
    },
    {
        q: 'What should I eat and drink before and after donating?',
        a: 'Before donating, eat a healthy, iron-rich meal (such as spinach, lentils, or lean meat) and drink plenty of water. Avoid fatty or fried foods as they can affect blood testing. After donating, eat a nutritious snack and drink extra fluids — water, juice, or milk — for the next 24–48 hours. Avoid alcohol for at least 24 hours after donating.'
    },
    {
        q: 'What if I have a bruise at the needle site?',
        a: 'Occasional bruising at the needle insertion site is normal and harmless. It occurs when a small amount of blood leaks under the skin. Apply a cold pack to the area for the first 24 hours to reduce swelling, then switch to a warm compress. The bruise will typically fade within 1–2 weeks. If the bruise is unusually large, painful, or doesn\'t improve, please contact us.'
    },
    {
        q: 'Can I donate blood if I am on medication?',
        a: 'It depends on the medication. Many common medications — including vitamins, antihistamines (e.g., cetirizine), paracetamol, and most birth control pills — do not prevent you from donating. However, some medications like blood thinners (warfarin, heparin), certain antibiotics, and acne medications (e.g., isotretinoin) require a temporary deferral. Always inform our screening staff about all medications you are taking.'
    },
    {
        q: 'How often can I donate blood?',
        a: 'In India, males can donate whole blood every 90 days (3 months), and females every 120 days (4 months). Platelet donors can donate every 14 days, up to 24 times per year. These intervals allow your body sufficient time to fully replenish the donated components.'
    },
    {
        q: 'Is there an age limit for blood donation?',
        a: 'In India, healthy individuals aged 18 to 65 can donate blood. First-time donors must be between 18 and 60 years old. Repeat donors in good health may be eligible up to age 65 (extendable up to 68 with medical certification). Individuals under 18 years of age are not eligible to donate.'
    }
]

/* ─── Safety protocols ─── */
const safetyProtocols = [
    {
        icon: Syringe,
        title: 'Sterile, single-use equipment',
        desc: 'Every needle, bag, and tube used in the donation process is brand new, sterile, and used only once. After your donation, all equipment is safely disposed of. There is zero risk of infection from donating blood.'
    },
    {
        icon: Stethoscope,
        title: 'Thorough health screening',
        desc: 'Before every donation, a trained healthcare professional checks your blood pressure, pulse, temperature, hemoglobin level, and reviews your health history to ensure you are fit to donate safely.'
    },
    {
        icon: ShieldAlert,
        title: 'Strict testing of all donations',
        desc: 'Every unit of donated blood is tested for HIV, Hepatitis B, Hepatitis C, syphilis, and malaria. Any unit that does not pass these tests is safely discarded and the donor is confidentially notified.'
    },
    {
        icon: HeartPulse,
        title: 'Continuous donor monitoring',
        desc: 'During and after your donation, our staff continuously monitor your wellbeing. If you feel any discomfort at any point, our team will immediately assist you and provide appropriate care.'
    },
    {
        icon: Activity,
        title: 'Adverse reaction management',
        desc: 'Although rare, our centres are fully equipped to handle any adverse reactions. All staff are trained in first aid and emergency response. You will never be left unattended during or after your donation.'
    },
    {
        icon: ShieldCheck,
        title: 'Confidential health information',
        desc: 'All personal and medical information you provide during the screening process is kept strictly confidential and is used only for determining your eligibility and ensuring the safety of the blood supply.'
    }
]

/* ─── Common side effects ─── */
const sideEffects = [
    {
        effect: 'Lightheadedness or dizziness',
        likelihood: 'Occasional',
        what: 'Sit or lie down. Elevate your legs. Drink water or juice. Symptoms usually pass within a few minutes.',
        icon: ThermometerSun
    },
    {
        effect: 'Bruising at needle site',
        likelihood: 'Occasional',
        what: 'Apply cold compress for 24 hours, then warm compress. The bruise fades within 1–2 weeks.',
        icon: BandageIcon
    },
    {
        effect: 'Mild fatigue',
        likelihood: 'Common',
        what: 'Rest, stay hydrated, and eat well. Avoid heavy exercise for 12 hours. Usually resolves within a day.',
        icon: Clock
    },
    {
        effect: 'Soreness at needle site',
        likelihood: 'Common',
        what: 'This is normal and temporary. Avoid heavy lifting with the arm used for donation for a few hours.',
        icon: AlertTriangle
    },
    {
        effect: 'Fainting',
        likelihood: 'Rare',
        what: 'Lie down immediately. Our staff will assist you. Do not leave the centre until you feel fully recovered.',
        icon: HeartPulse
    }
]

/* ─── Iron & nutrition tips ─── */
const ironTips = [
    'Include iron-rich foods in your diet: spinach, lentils (dal), chickpeas (chana), kidney beans (rajma), jaggery (gur), dates, and lean meats.',
    'Pair iron-rich foods with vitamin C sources (citrus fruits, tomatoes, bell peppers) to enhance absorption.',
    'Avoid tea and coffee with meals, as tannins can reduce iron absorption.',
    'If you donate regularly (3+ times/year), consider an iron supplement — consult your doctor or ask our staff.',
    'Calcium and dairy products can inhibit iron absorption when consumed with iron-rich foods. Space them apart.',
    'Cooking in cast-iron vessels can increase the iron content of your food.'
]

/* ═══════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════ */
export default function DonorWellness() {
    const [openFaq, setOpenFaq] = useState<number | null>(0)

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
                            Your Safety Matters
                        </span>
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1]">
                            Donor wellness{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-rose-600">
                                and safety
                            </span>
                        </h1>
                        <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
                            Your health and safety are our top priority — before, during, and after every donation. We follow the highest medical standards and safety protocols to ensure that donating blood is a safe, comfortable, and positive experience for every donor.
                        </p>
                        <div className="space-y-2 text-muted-foreground text-sm">
                            <p>On this page, you&apos;ll find:</p>
                            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                <li>Answers to frequently asked questions about the donation process</li>
                                <li>Our safety protocols and what we do to protect you</li>
                                <li>Common side effects and how to manage them</li>
                                <li>Iron and nutrition guidance for regular donors</li>
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
                            Frequently asked questions about the{' '}
                            <span className="text-primary">blood donation process</span>
                        </h2>
                        <p className="text-muted-foreground">
                            Click any question below to see the full answer.
                        </p>
                    </motion.div>

                    <div className="space-y-2">
                        {faqs.map((faq, i) => (
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
                                Your safety is our highest priority.
                            </h2>
                            <p className="text-white/80 text-sm mt-1">
                                Every step of the donation process is designed to protect you.
                            </p>
                        </div>
                    </div>
                    <Link
                        href="/donation-process"
                        className="inline-flex items-center gap-2 bg-white text-primary px-7 py-3.5 rounded-full font-bold text-sm hover:bg-white/90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 shrink-0"
                    >
                        View Donation Process
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
                            Our safety protocols
                        </h2>
                        <p className="text-muted-foreground leading-relaxed max-w-2xl">
                            We adhere to the strictest national and international safety standards to ensure every donation is safe for both the donor and the recipient.
                        </p>
                    </motion.div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {safetyProtocols.map((protocol, i) => (
                            <motion.div
                                key={protocol.title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.08 }}
                                className="p-5 rounded-2xl bg-card border border-border/50 hover:border-primary/20 hover:shadow-md transition-all"
                            >
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                                    <protocol.icon className="w-5 h-5 text-primary" />
                                </div>
                                <h3 className="font-bold text-foreground text-sm mb-2">{protocol.title}</h3>
                                <p className="text-xs text-muted-foreground leading-relaxed">{protocol.desc}</p>
                            </motion.div>
                        ))}
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
                            Common side effects &amp; how to manage them
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Most donors feel perfectly fine after donating. In rare cases, some mild side effects may occur. Here&apos;s what to expect and how to handle them.
                        </p>
                    </motion.div>

                    {/* Side effects table / list */}
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[550px] border-collapse">
                            <thead>
                                <tr>
                                    <th className="p-4 text-left text-sm font-bold text-foreground bg-card border border-border rounded-tl-xl">Side Effect</th>
                                    <th className="p-4 text-left text-sm font-bold text-foreground bg-card border border-border">Likelihood</th>
                                    <th className="p-4 text-left text-sm font-bold text-foreground bg-card border border-border rounded-tr-xl">What to Do</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sideEffects.map((se, i) => (
                                    <tr key={i} className="hover:bg-muted/30 transition-colors">
                                        <td className={`p-4 border border-border ${i === sideEffects.length - 1 ? 'rounded-bl-xl' : ''}`}>
                                            <div className="flex items-center gap-2">
                                                <se.icon className="w-4 h-4 text-primary shrink-0" />
                                                <span className="text-sm font-semibold text-foreground">{se.effect}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 border border-border">
                                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${se.likelihood === 'Rare'
                                                ? 'bg-green-100 text-green-700'
                                                : se.likelihood === 'Occasional'
                                                    ? 'bg-amber-100 text-amber-700'
                                                    : 'bg-blue-100 text-blue-700'
                                                }`}>
                                                {se.likelihood}
                                            </span>
                                        </td>
                                        <td className={`p-4 border border-border text-sm text-muted-foreground leading-relaxed ${i === sideEffects.length - 1 ? 'rounded-br-xl' : ''}`}>
                                            {se.what}
                                        </td>
                                    </tr>
                                ))}
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
                            Iron &amp; nutrition guidance for donors
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Iron is essential for producing healthy red blood cells. Regular donors should pay special attention to maintaining healthy iron levels. Here are practical tips:
                        </p>
                    </motion.div>

                    <div className="space-y-3">
                        {ironTips.map((tip, i) => (
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
                            When to seek medical attention
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            While serious complications from blood donation are extremely rare, please contact us or seek medical attention if you experience any of the following after your donation:
                        </p>
                        <div className="grid sm:grid-cols-2 gap-3 mt-4">
                            {[
                                'Prolonged bleeding from the needle site that doesn\'t stop after applying pressure for 10+ minutes',
                                'Persistent dizziness or fainting more than 30 minutes after donation',
                                'Signs of infection at the needle site — redness, swelling, warmth, or pus',
                                'Tingling or numbness in the arm that persists beyond a few hours',
                                'Fever or chills developing within 24 hours of donation',
                                'Severe or worsening pain at the needle site'
                            ].map((item, i) => (
                                <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-100">
                                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                                    <p className="text-sm text-red-800 leading-relaxed">{item}</p>
                                </div>
                            ))}
                        </div>
                        <p className="text-muted-foreground text-sm pt-2">
                            If you experience any of the above, call our donor helpline at <a href="tel:+919422223117" className="text-primary font-semibold hover:underline">+91 94222 23117</a> or visit the nearest medical facility.
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
                            Ready to donate? Your safety is guaranteed.
                        </h2>
                        <p className="text-white/85 max-w-xl mx-auto leading-relaxed">
                            Book your appointment today and experience a safe, comfortable, and life-saving donation.
                        </p>
                        <div className="flex flex-wrap justify-center gap-4 pt-2">
                            <Link
                                href="/donate"
                                className="inline-flex items-center gap-2 bg-white text-primary px-7 py-3.5 rounded-full font-bold text-sm hover:bg-white/90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                            >
                                Book Appointment
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                            <Link
                                href="/eligibility-criteria"
                                className="inline-flex items-center gap-2 bg-white/15 text-white px-7 py-3.5 rounded-full font-semibold text-sm hover:bg-white/25 transition-colors backdrop-blur-sm border border-white/20"
                            >
                                Check Eligibility
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
                            Have concerns? Contact our donor support team.
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
