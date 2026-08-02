"use client"

import Image from 'next/image'
import { Phone, CheckCircle, Droplet, ArrowRight } from 'lucide-react'
import { Badge } from "@/components/ui/badge"
import { useLanguage } from '@/context/language-context'
import { content } from '@/lib/content'
import { motion } from 'framer-motion'

export default function Hero() {
    const { language } = useLanguage();
    const t = content[language].hero;

    return (
        <section id="home" className="relative min-h-screen overflow-hidden bg-gradient-to-br from-background via-muted/30 to-primary/5">
            <div className="absolute inset-0 z-10 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full opacity-[0.03]">
                    <img src="/bg.webp" alt="background" className="w-full h-full object-cover grayscale" />
                </div>
                <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-accent/5 rounded-full blur-[100px]"></div>
            </div>

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-40">
                <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16 min-h-screen lg:min-h-[90vh] py-20 lg:pt-32 lg:pb-20 lg:items-center">

                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="space-y-8 z-40 flex flex-col order-2 lg:order-1 justify-center"
                    >
                        <div className="space-y-6">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2, duration: 0.6 }}
                            >
                                <Badge variant="outline" className="px-4 py-1.5 text-primary border-primary/20 bg-primary/5 mb-4 backdrop-blur-sm">
                                    <Droplet className="w-3.5 h-3.5 mr-2 fill-primary" />
                                    {language === 'en' ? 'ISO Certified Blood Bank' : 'प्रमाणित रक्तपेढी'}
                                </Badge>
                                <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight text-foreground leading-[1.1]">
                                    {language === 'en' ? 'Sanjivani Blood Bank,' : 'संजीवनी ब्लड बँक,'} <br />
                                    <span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-primary to-rose-600">
                                        {language === 'en' ? 'Kopargaon' : 'कोपरगाव'}
                                    </span>
                                </h1>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4, duration: 0.6 }}
                            >
                                <h2 className="text-xl sm:text-2xl font-medium text-muted-foreground">
                                    {t.subtitle}
                                </h2>
                                <p className="mt-4 text-lg sm:text-x leading-relaxed text-muted-foreground/90 max-w-xl">
                                    {t.description}
                                </p>
                            </motion.div>
                        </div>

                        <motion.div
                            className="flex flex-col sm:flex-row gap-4 pt-4"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6, duration: 0.6 }}
                        >
                            <a
                                href="/donate"
                                className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-primary text-white rounded-xl font-bold text-lg hover:bg-primary/90 transition-all duration-300 shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/40 hover:-translate-y-1"
                            >
                                <Droplet className="w-5 h-5 fill-white" />
                                {t.ctaPrimary}
                            </a>

                            <a
                                href="/about"
                                className="inline-flex cursor-pointer items-center justify-center gap-2 px-8 py-4 bg-background border border-input text-foreground rounded-xl font-semibold hover:bg-accent/50 transition-colors duration-300 hover:border-accent"
                            >
                                {t.ctaSecondary}
                                <ArrowRight className="w-4 h-4 ml-1" />
                            </a>
                        </motion.div>

                        <motion.div
                            className="pt-8 border-t border-border/50"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8, duration: 0.6 }}
                        >
                            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                <CheckCircle className="w-5 h-5 text-green-500" />
                                <span>{t.trustedBy}</span>
                            </div>
                        </motion.div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, x: 50 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="relative h-[400px] sm:h-[500px] lg:h-[700px] w-full flex items-center justify-center order-1 lg:order-2"
                    >
                        <div className="relative w-full max-w-[550px] aspect-square">
                            {/* Decorative Background Blob */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-primary/10 via-primary/5 to-transparent rounded-full blur-3xl"></div>

                            {/* Image 1: Main (Top Left/Center) */}
                            <motion.div
                                className="absolute top-0 left-2 sm:top-4 sm:left-4 z-20 rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden shadow-2xl border-4 sm:border-[6px] border-background"
                                whileHover={{ scale: 1.02, zIndex: 40 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Image
                                    src="/blood-1.webp"
                                    alt="Blood donation"
                                    width={340}
                                    height={340}
                                    className="w-[200px] sm:w-[280px] md:w-[320px] lg:w-[340px] h-auto object-cover"
                                    priority
                                />
                            </motion.div>

                            {/* Image 2: Secondary (Bottom Right) */}
                            <motion.div
                                className="absolute bottom-8 right-2 sm:bottom-12 sm:right-4 z-30 rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden shadow-2xl border-4 sm:border-[6px] border-background"
                                whileHover={{ scale: 1.02, zIndex: 40 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Image
                                    src="/blood-2.webp"
                                    alt="Laboratory"
                                    width={260}
                                    height={260}
                                    className="w-[160px] sm:w-[210px] md:w-[240px] lg:w-[260px] h-auto object-cover"
                                />
                            </motion.div>

                            {/* Image 3: Tertiary (Top Right / Floating) */}
                            <motion.div
                                className="absolute -top-4 right-4 sm:-top-6 sm:right-8 z-10 rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden shadow-xl border-4 sm:border-[6px] border-background"
                                whileHover={{ scale: 1.02, zIndex: 40 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Image
                                    src="/blood-3.webp"
                                    alt="Medical Care"
                                    width={200}
                                    height={200}
                                    className="w-[130px] sm:w-[160px] md:w-[180px] lg:w-[200px] h-auto object-cover brightness-90 contrast-125"
                                />
                            </motion.div>


                            {/* Floating Badge (Center/Bottom Left) */}
                            <motion.div
                                className="absolute bottom-32 left-0 z-40 bg-background/95 backdrop-blur-md p-4 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-border/50 max-w-[220px]"
                                animate={{ y: [0, -8, 0] }}
                                transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                                        <Droplet className="w-5 h-5 text-red-600 fill-red-600" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm text-foreground">Save 3 Lives</p>
                                        <p className="text-xs text-muted-foreground">with 1 donation</p>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    )
}