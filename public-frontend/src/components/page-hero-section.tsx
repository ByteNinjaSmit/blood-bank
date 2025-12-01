"use client"

import { Phone, CheckCircle, Droplet, ArrowRight, ClockPlus } from 'lucide-react'
import { Badge } from "@/components/ui/badge"

export default function Hero() {
    return (
        <section id="home" className="relative min-h-screen overflow-hidden bg-gradient-to-br from-background to-muted">
            <div className="absolute inset-0 z-10">
                <div className="absolute top-0 left-0 w-full h-full opacity-10">
                    <img src="/bg.webp" alt="background" className="w-full h-full object-cover" />
                </div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-accent/10 rounded-full blur-[100px]"></div>
            </div>

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-40">
                <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16 min-h-screen lg:min-h-[85vh] py-12 lg:py-0 lg:items-center">
                    
                    <div className="relative h-[420px] sm:h-[550px] lg:h-[650px] flex items-center justify-center order-1 lg:order-1">
                        <div className="relative w-full h-full">
                            <div className="absolute top-1/4 left-4 sm:left-12 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl z-30 ring-4 ring-background/50 hover:shadow-3xl transition-all duration-500 hover:scale-[1.01] cursor-pointer">
                                <img
                                    src="/blood-1.webp"
                                    alt="Blood bank service"
                                    className="max-w-[200px] sm:max-w-[250px] h-auto object-cover" // Increased size slightly
                                />
                            </div>

                            <div className="absolute top-6 left-48 sm:left-72 rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl z-20 transition-shadow duration-300">
                                <img
                                    src="/blood-3.webp"
                                    alt="Medical testing"
                                    className="max-w-[160px] sm:max-w-[200px] h-auto object-cover" // Slightly smaller size
                                />
                            </div>

                            <div className="absolute bottom-6 left-56 sm:left-80 rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg z-10 transition-shadow duration-300">
                                <img
                                    src="/blood-2.webp"
                                    alt="Healthcare professionals"
                                    className="max-w-[160px] sm:max-w-[200px] h-auto object-cover" // Slightly smaller size
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6 sm:space-y-8 z-40 flex flex-col order-2 lg:order-2 justify-center"> 
                        <div className="space-y-4">
                            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-balance leading-tight text-foreground">
                                Sanjivani Blood Bank <span className="text-primary/80">Kopargaon</span>
                            </h1>
                            <h2 className="text-xl sm:text-3xl lg:text-3xl font-bold text-balance text-muted-foreground/80">
                                Sai Seva Health Care
                            </h2>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 text-xs sm:text-sm">
                            <Badge variant="secondary" className='px-3 py-1.5 font-medium'>
                                <Droplet className="w-3.5 h-3.5 mr-2 text-primary" />
                                Certified Facility
                            </Badge>
                            <Badge variant="secondary" className='px-3 py-1.5'>✓ Professional Team</Badge>
                            <Badge variant="secondary" className='px-3 py-1.5'>✓ 24/7 Support</Badge>
                        </div>



                        <div className="space-y-4 pt-6"> 
                            <div className="flex items-center gap-2 text-primary font-bold text-sm tracking-widest uppercase">
                                <Phone className="w-4 h-4" />
                                <span>Emergency & Appointments</span>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <a
                                    href="tel:+917979xxxxxxx89"
                                    className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-primary text-primary-foreground rounded-xl font-extrabold text-lg sm:text-xl hover:bg-primary/90 transition-all duration-300 shadow-2xl hover:shadow-primary/50 hover:scale-[1.02] active:scale-[0.98] border-b-4 border-primary/80"
                                >
                                    <Phone className="w-5 h-5" />
                                    Contact Us
                                </a>

                                <button 
                                    onClick={() => window.location.href = '#donation-form'}
                                    className="inline-flex cursor-pointer items-center justify-center gap-2 px-8 py-4 border-2 border-primary/50 text-foreground rounded-xl font-semibold hover:bg-primary/5 transition-colors duration-300 hover:border-primary/80"
                                >
                                    Schedule Appointment
                                    <ArrowRight className="w-4 h-4 ml-1" />
                                </button>
                            </div>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-primary/10"> 
                            <div className="flex items-start gap-3 p-4 bg-card rounded-xl shadow-md border border-border/50"> {/* Added card styling */}
                                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0"> {/* Used primary/10 background */}
                                    <CheckCircle className="w-5 h-5 text-primary fill-transparent" /> {/* Used transparent fill and primary color */}
                                </div>
                                <div>
                                    <p className="text-sm sm:text-base font-bold text-foreground">NHS Approved Laboratory</p> {/* Increased title boldness */}
                                    <p className="text-xs sm:text-sm text-muted-foreground">Certified and trusted healthcare provider</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-4 bg-card rounded-xl shadow-md border border-border/50"> {/* Added card styling */}
                                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0"> {/* Used primary/10 background */}
                                    <CheckCircle className="w-5 h-5 text-primary fill-transparent" /> {/* Used transparent fill and primary color */}
                                </div>
                                <div>
                                    <p className="text-sm sm:text-base font-bold text-foreground">Results within 48 Hours</p> {/* Increased title boldness */}
                                    <p className="text-xs sm:text-sm text-muted-foreground">Fast and reliable test results</p>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </section>
    )
}