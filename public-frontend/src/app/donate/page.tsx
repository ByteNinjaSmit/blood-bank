import React from 'react'
import BloodDonationForm from '@/components/donar-appoinment-form'
import { Heart, Clock, ShieldCheck, CheckCircle2 } from 'lucide-react'

export default function DonatePage() {
    return (
        <div className="min-h-screen bg-background pt-32 lg:pt-40 pb-12 px-4 sm:px-6">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-start">

                {/* Left Side: Awareness & Impact (Sticky) */}
                <div className="lg:col-span-5 lg:sticky lg:top-32 space-y-8">
                    <div className="space-y-4">
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm font-bold">
                            <Heart className="w-4 h-4 fill-red-700" />
                            Donate Blood, Save Lives
                        </span>
                        <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
                            Your <span className="text-primary underline decoration-primary/30 underline-offset-4">15 Minutes</span> Can Save 3 Families.
                        </h1>
                        <p className="text-lg text-muted-foreground leading-relaxed">
                            Join a community of heroes. Safe, sterile, and simple process.
                        </p>
                    </div>

                    {/* Quick Stats / Reassurance */}
                    <div className="grid gap-4">
                        {[
                            { icon: Clock, title: "Super Fast", desc: "Whole process takes ~45 mins" },
                            { icon: ShieldCheck, title: "100% Safe", desc: "Sterile kits & expert care" },
                            { icon: CheckCircle2, title: "Free Health Check", desc: "BP, Hb, & basic screening" }
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-muted/50 border border-border/50 hover:bg-muted transition-colors">
                                <div className="w-12 h-12 rounded-xl bg-background shadow-sm flex items-center justify-center text-primary">
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
        </div>
    )
}
