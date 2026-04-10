'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
    ArrowRight, CalendarDays, Bell, Phone, Mail,
    AlertCircle, Sparkles, ShieldCheck
} from 'lucide-react'

/* ─── All criteria updates, chronologically (newest first) ─── */
const updates = [
    {
        date: 'January 15, 2025',
        title: 'Hemoglobin threshold maintained for safety',
        body: 'Minimum hemoglobin level for all donors remains at 12.5 g/dL, ensuring donor health and safety. We continue to use high-precision HemoCue machines for accurate pre-donation screening.'
    },
    {
        date: 'November 22, 2024',
        title: 'Tattoo and piercing deferral period remains 12 months',
        body: 'To ensure maximum safety against transfusion-transmitted infections, we maintain a 12-month deferral period for tattoos and body piercings. This professional standard helps protect the blood supply while allowing donors to return once the safety window is complete.'
    },
    {
        date: 'September 8, 2024',
        title: 'Travel deferral for malaria-endemic areas revised',
        body: 'Donors who have travelled to malaria-endemic zones now face a 3-month deferral period, reduced from the previous 6-month requirement. This revision is based on updated epidemiological data from the WHO and the National Centre for Disease Control (NCDC). Donors returning from sub-Saharan Africa or certain parts of Southeast Asia should consult with our team for a personalised assessment.'
    },
    {
        date: 'July 1, 2024',
        title: 'Upper age limit extended for repeat donors',
        body: 'Regular donors who are in good health may now continue donating up to the age of 68, increased from the previous limit of 65. This applies to returning donors with a consistent donation history and requires annual medical certification from a registered physician. First-time donors must still be between 18 and 60 years old.'
    },
    {
        date: 'April 20, 2024',
        title: 'COVID-19 vaccination deferral removed',
        body: 'The 14-day deferral period following COVID-19 vaccination (all approved vaccines) has been removed. Donors may now give blood immediately after vaccination provided they feel well and have no fever or systemic symptoms. This change applies to all primary doses and boosters.'
    },
    {
        date: 'February 5, 2024',
        title: 'Platelet donation interval shortened',
        body: 'The minimum interval between platelet (apheresis) donations has been reduced from 14 days to 7 days for healthy, regular platelet donors. This allows more frequent contributions from experienced donors and helps address seasonal shortages. Donors must meet all standard platelet eligibility criteria at each visit.'
    },
    {
        date: 'December 12, 2023',
        title: 'Medication deferral list updated',
        body: 'Several common over-the-counter medications have been removed from the deferral list. Donors taking antihistamines (e.g., cetirizine, loratadine), mild analgesics (e.g., paracetamol), and antacids are now eligible to donate without a waiting period. Prescription blood thinners (e.g., warfarin, heparin) still require a deferral — please consult our screening team.'
    },
    {
        date: 'October 3, 2023',
        title: 'Weight requirement clarification',
        body: 'Updated weight criteria now incorporate BMI alongside absolute weight for a more personalized eligibility assessment. While the minimum weight remains 45 kg for whole blood donations, donors with BMI below 18.5 may be asked to undergo additional screening. Platelet donations continue to require a minimum weight of 50 kg.'
    },
    {
        date: 'August 18, 2023',
        title: 'Dental procedure deferral updated',
        body: 'The deferral period following routine dental procedures (cleanings, fillings) has been reduced from 72 hours to 24 hours. More invasive dental surgery, such as extractions or root canals, continues to require a 7-day deferral. Donors are advised to inform our team about any recent dental work during screening.'
    },
    {
        date: 'June 30, 2023',
        title: 'Iron supplement recommendation for repeat donors',
        body: 'Effective immediately, all repeat donors (3 or more donations per year) will be offered iron supplement guidance after each donation. This is a preventive measure to maintain healthy iron stores and is based on recommendations from the Indian Journal of Haematology and Blood Transfusion. Supplements are available free of charge at all our donor centres.'
    },
    {
        date: 'March 15, 2023',
        title: 'Sexual behaviour-based deferral policy updated',
        body: 'In line with evolving global best practices, our screening criteria have moved from blanket deferrals based on orientation to an individualized risk assessment model. All prospective donors are now assessed equally based on recent sexual behaviour risk factors, regardless of gender identity or sexual orientation.'
    },
    {
        date: 'January 1, 2023',
        title: 'Post-pregnancy deferral period clarified',
        body: 'In accordance with national guidelines, the post-delivery deferral period is 12 months to allow for full maternal recovery. For miscarriage or termination of pregnancy, a 6-month deferral applies. These standards ensure the well-being of the mother before resuming voluntary blood donation.'
    }
]

/* ═══════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════ */
export default function DonationCriteriaChanges() {
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
                            Latest Updates
                        </span>
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1]">
                            Recent changes to{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-rose-600">
                                donation criteria
                            </span>
                        </h1>
                        <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
                            Donation eligibility criteria are reviewed and updated regularly to reflect the latest medical research, government guidelines, and global best practices. This page lists all recent changes in chronological order.
                        </p>
                        <p className="text-sm text-muted-foreground/80 max-w-2xl">
                            If you were previously deferred, these updates may affect your eligibility. Please review the changes below or contact our team for a confidential reassessment.
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
                                Thousands more may now be eligible to donate!
                            </h2>
                            <p className="text-white/80 text-sm mt-1">
                                Review the latest criteria changes to see if you qualify.
                            </p>
                        </div>
                    </div>
                    <Link
                        href="/eligibility-criteria"
                        className="inline-flex items-center gap-2 bg-white text-primary px-7 py-3.5 rounded-full font-bold text-sm hover:bg-white/90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 shrink-0"
                    >
                        Check Eligibility
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
                            All updates
                        </h2>
                        <p className="text-muted-foreground text-sm">
                            Listed in reverse chronological order, with the most recent changes first.
                        </p>
                    </motion.div>

                    <div>
                        {updates.map((update, i) => (
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
                            Ready to donate?
                        </span>
                        <h3 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight">
                            With updated criteria, more people than ever{' '}
                            <span className="text-primary">may be eligible.</span>
                        </h3>
                        <p className="text-muted-foreground leading-relaxed max-w-xl mx-auto">
                            Check your eligibility and schedule your donation today. Every donation can save up to three lives.
                        </p>
                        <div className="flex flex-wrap justify-center gap-3 pt-2">
                            <Link
                                href="/donate"
                                className="inline-flex items-center gap-2 bg-primary text-white px-7 py-3.5 rounded-xl font-bold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5"
                            >
                                Book Appointment
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                            <Link
                                href="/eligibility-criteria"
                                className="inline-flex items-center gap-2 bg-background border border-border text-foreground px-7 py-3.5 rounded-xl font-semibold text-sm hover:bg-muted transition-colors"
                            >
                                Full Eligibility Criteria
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
