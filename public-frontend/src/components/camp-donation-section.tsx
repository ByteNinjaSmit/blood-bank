"use client"

import Link from 'next/link'
import { Tent, Stethoscope, HeartPulse, Users, ClipboardCheck, ArrowRight } from 'lucide-react'
import { Badge } from "@/components/ui/badge"
import { useLanguage } from '@/context/language-context'
import { content } from '@/lib/content'
import { motion } from 'framer-motion'

const icons = [Stethoscope, HeartPulse, Users, ClipboardCheck]

export default function CampDonationSection() {
    const { language } = useLanguage()
    const t = content[language].campDonation

    return (
        <section id="camp-donation" className="w-full bg-background py-20 lg:py-24 relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/3 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

                    {/* Left: Content */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="lg:col-span-5 space-y-6"
                    >
                        <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5 gap-1.5">
                            <Tent className="w-3.5 h-3.5" />
                            {t.badge}
                        </Badge>
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground leading-tight">
                            {t.title} <span className="text-primary">{t.titleHighlight}</span>
                        </h2>
                        <p className="text-lg text-muted-foreground leading-relaxed">
                            {t.description}
                        </p>
                        <Link
                            href="/onsite-donor"
                            className="inline-flex items-center justify-center gap-2.5 bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded-full text-base font-bold transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95"
                        >
                            {t.cta}
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                    </motion.div>

                    {/* Right: Points grid */}
                    <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {t.points.map((point, index) => {
                            const Icon = icons[index % icons.length]
                            return (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                    className="bg-card border border-border rounded-2xl p-6 hover:border-primary/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                                        <Icon className="w-6 h-6 text-primary" />
                                    </div>
                                    <h3 className="font-bold text-foreground mb-1.5">{point.title}</h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">{point.desc}</p>
                                </motion.div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </section>
    )
}
