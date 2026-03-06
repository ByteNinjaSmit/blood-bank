"use client"
import React from 'react'
import BloodDonationForm from '@/components/donar-appoinment-form'
import { Heart, Clock, ShieldCheck, CheckCircle2 } from 'lucide-react'
import { useLanguage } from '@/context/language-context'
import { content } from '@/lib/content'

export default function HomeDonateSection() {
    const { language } = useLanguage();
    const t = content[language].donatePage;

    return (
        <section className="py-24 px-4 sm:px-6 bg-muted/20">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-start">

                {/* Left Side: Awareness & Impact */}
                <div className="lg:col-span-5 space-y-8 lg:sticky lg:top-24">
                    <div className="space-y-4">
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm font-bold">
                            <Heart className="w-4 h-4 fill-red-700" />
                            {t.badge}
                        </span>
                        <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
                            {t.titleStart}<span className="text-primary underline decoration-primary/30 underline-offset-4">{t.titleHighlight}</span>{t.titleEnd}
                        </h2>
                        <p className="text-lg text-muted-foreground leading-relaxed">
                            {t.description}
                        </p>
                    </div>

                    {/* Quick Stats / Reassurance */}
                    <div className="grid gap-4">
                        {[
                            { icon: Clock, title: t.features[0].title, desc: t.features[0].desc },
                            { icon: ShieldCheck, title: t.features[1].title, desc: t.features[1].desc },
                            { icon: CheckCircle2, title: t.features[2].title, desc: t.features[2].desc }
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-background border border-border/50 shadow-sm hover:shadow-md transition-all">
                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                    <item.icon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-foreground">{item.title}</h3>
                                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Side: The Form */}
                <div className="lg:col-span-7">
                    <BloodDonationForm />
                </div>

            </div>
        </section>
    )
}
