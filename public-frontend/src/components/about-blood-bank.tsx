"use client"

import { Shield, CheckCircle, Target, MapPin } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { useLanguage } from '@/context/language-context';
import { content } from '@/lib/content';
import { motion } from 'framer-motion';

export default function AboutSection() {
    const { language } = useLanguage();
    const t = content[language].about;

    return (
        <section id="about" className="w-full bg-background py-20 lg:py-24 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-96 h-96 bg-accent/5 rounded-full blur-3xl"></div>

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

                    {/* Left Side - Content */}
                    <div className="space-y-8 order-2 lg:order-1">
                        <div className="space-y-4">
                            <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5">
                                {t.title}
                            </Badge>
                            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground leading-tight">
                                {t.titleLine1Start}<span className="text-primary">{t.titleLine1Highlight}</span>{t.titleLine1End}
                            </h2>
                            <p className="text-lg text-muted-foreground leading-relaxed">
                                {t.description}
                            </p>
                        </div>

                        <div className="bg-muted/30 border border-border/50 rounded-2xl p-6 sm:p-8">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-primary/10 rounded-xl shrink-0">
                                    <Target className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold mb-2">{t.mission}</h3>
                                    <p className="text-muted-foreground italic font-medium">
                                        "{t.missionText}"
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-primary" />
                                {t.servingTitle}:
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {t.talukas.map((taluka, index) => (
                                    <Badge key={index} variant="secondary" className="px-3 py-1 text-sm font-normal">
                                        {taluka}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Visual Stats Grid instead of Image */}
                    <div className="relative order-1 lg:order-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {/* Card 1: Years of Service */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.1 }}
                                className="bg-white dark:bg-card p-6 rounded-2xl shadow-lg border border-border/50 hover:border-primary/50 transition-colors duration-300"
                            >
                                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center mb-4">
                                    <Shield className="w-6 h-6 text-red-600 dark:text-red-400" />
                                </div>
                                <h3 className="text-4xl font-extrabold text-foreground mb-1">32+</h3>
                                <p className="text-muted-foreground font-medium">{t.statLabels.years}</p>
                            </motion.div>

                            {/* Card 2: Lives Saved (Estimate) */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.2 }}
                                className="bg-white dark:bg-card p-6 rounded-2xl shadow-lg border border-border/50 hover:border-primary/50 transition-colors duration-300 sm:translate-y-12"
                            >
                                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-4">
                                    <CheckCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <h3 className="text-4xl font-extrabold text-foreground mb-1">1L+</h3>
                                <p className="text-muted-foreground font-medium">{t.statLabels.lives}</p>
                            </motion.div>

                            {/* Card 3: 24/7 Availability */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.3 }}
                                className="bg-white dark:bg-card p-6 rounded-2xl shadow-lg border border-border/50 hover:border-primary/50 transition-colors duration-300"
                            >
                                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mb-4">
                                    <Target className="w-6 h-6 text-green-600 dark:text-green-400" />
                                </div>
                                <h3 className="text-3xl font-bold text-foreground mb-1">24/7</h3>
                                <p className="text-muted-foreground font-medium">{t.statLabels.emergency}</p>
                            </motion.div>

                            {/* Card 4: Rural Reach */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.4 }}
                                className="bg-primary p-6 rounded-2xl shadow-lg shadow-primary/25 sm:translate-y-12"
                            >
                                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4 backdrop-blur-sm">
                                    <MapPin className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-3xl font-bold text-white mb-1">100%</h3>
                                <p className="text-white/90 font-medium">{t.statLabels.rural}</p>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}