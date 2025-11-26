"use client"

import { Phone, CheckCircle, Droplet, ArrowRight, ClockPlus } from 'lucide-react'
import { Badge } from "@/components/ui/badge"

export default function Hero() {
    return (
        <section id="home" className="relative min-h-screen overflow-hidden bg-gradient-to-br from-background to-muted md:pt-0">
            <div className="absolute inset-0 z-10">
                <div className="absolute top-0 left-0 w-full h-full opacity-5">
                    <img src="/bg.webp" alt="background" className="w-full h-full object-cover" />
                </div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-accent/5 rounded-full blur-3xl"></div>
            </div>

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16 pt-10  min-h-screen">
                    {/* Left side - Image collage */}
                    <div className="relative h-[420px] sm:h-[550px] lg:h-[650px] flex items-center justify-center order-1 lg:order-1">
                        <div className="relative w-full h-full">
                            {/* Front image */}
                            <div className="absolute top-1/4 left-4 sm:left-12 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl z-30 hover:shadow-3xl transition-shadow duration-300">
                                <img
                                    src="/blood-1.webp"
                                    alt="Blood bank service"
                                    className="max-w-[180px] sm:max-w-[220px] h-auto object-cover"
                                />
                            </div>

                            {/* Top overlap image */}
                            <div className="absolute top-6 left-40 sm:left-60 rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl z-20 hover:shadow-2xl transition-shadow duration-300">
                                <img
                                    src="/blood-3.webp"
                                    alt="Medical testing"
                                    className="max-w-[180px] sm:max-w-[220px] h-auto object-cover"
                                />
                            </div>

                            {/* Bottom overlap image */}
                            <div className="absolute bottom-6 left-48 sm:left-72 rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg z-10 hover:shadow-xl transition-shadow duration-300">
                                <img
                                    src="/blood-2.webp"
                                    alt="Healthcare professionals"
                                    className="max-w-[180px] sm:max-w-[220px] h-auto object-cover"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right side - Content */}
                    <div className="space-y-4 sm:space-y-6 z-40 flex flex-col order-2 lg:order-2">
                        <div className="inline-flex w-fit">
                            <Badge className="bg-primary hover:bg-accent text-primary-foreground text-xs sm:text-sm px-4 py-2 rounded-full shadow-md">
                                <Droplet className="w-3.5 h-3.5 mr-2" />
                                NHS Approved Service
                            </Badge>
                        </div>

                        {/* Feature badges - responsive and enhanced */}
                        <div className="flex flex-col sm:flex-row gap-2 w-full">
                            <div className="flex  items-start gap-4 flex-1">
                                <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shrink-0 shadow-md">
                                    <CheckCircle className="w-6 h-6 text-primary-foreground fill-current" />
                                </div>
                                <div>
                                    <p className="text-sm sm:text-base font-semibold text-foreground">NHS Approved Laboratory</p>
                                    <p className="text-xs sm:text-sm text-muted-foreground">Certified and trusted healthcare provider</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4 flex-1">
                                <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shrink-0 shadow-md">
                                    <CheckCircle className="w-6 h-6 text-primary-foreground fill-current" />
                                </div>
                                <div>
                                    <p className="text-sm sm:text-base font-semibold text-foreground">Results within 48 Hours</p>
                                    <p className="text-xs sm:text-sm text-muted-foreground">Fast and reliable test results</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3 pt-2">
                            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-balance leading-tight text-foreground">
                                Sai Seva <span className="text-primary">Health Care</span>
                            </h1>
                            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-balance text-muted-foreground">
                                Sanjivani Blood Bank, Kopargoan
                            </h2>
                        </div>

                        {/* Call to action - improved styling */}
                        <div className="space-y-4 pt-4 sm:pt-6 border-t border-primary/20">
                            <div className="flex items-center gap-2 text-primary font-semibold text-xs sm:text-sm tracking-wide uppercase">
                                <Phone className="w-4 h-4" />
                                <span>Need Blood or Tests?</span>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <button 
                                onClick={() => window.location.href = '#donation-form'}
                                className="inline-flex cursor-pointer items-center justify-center gap-2 px-8 py-4 border-2 border-primary text-primary rounded-xl font-semibold hover:bg-primary/10 transition-colors duration-300">
                                    Schedule Appointment
                                    <ClockPlus className="w-4 h-4" />
                                </button>
                                <a
                                    href="tel:+917979xxxxxxx89"
                                    className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-primary text-primary-foreground rounded-xl font-bold text-lg sm:text-xl hover:bg-accent transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                                >
                                    <Phone className="w-5 h-5" />
                                    Contact Us
                                </a>
                            </div>
                        </div>

                        <div className=" ">
                            <div className="text-xs sm:text-sm text-muted-foreground flex gap-2 flex-wrap">

                                <Badge className='px-2 py-1'>✓ Professional Team </Badge>
                                <Badge className='px-2 py-1'> ✓ 24/7 Support </Badge>
                                <Badge className='px-2 py-1'>✓ Certified Facility </Badge>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
