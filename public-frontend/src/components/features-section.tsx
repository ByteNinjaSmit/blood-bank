"use client"

import { useLanguage } from '@/context/language-context';
import { content } from '@/lib/content';
import { motion } from 'framer-motion';
import { Award, HeartHandshake, ShieldCheck, Microscope } from 'lucide-react';

export default function FeaturesSection() {
    const { language } = useLanguage();
    const t = content[language].features;

    const icons = [Award, HeartHandshake, ShieldCheck, Microscope];

    return (
        <section className="py-20 bg-muted/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl sm:text-4xl font-bold mb-4">{t.title}</h2>
                    <div className="w-20 h-1.5 bg-primary mx-auto rounded-full"></div>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {t.items.map((item, index) => {
                        const Icon = icons[index];
                        return (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-background rounded-2xl p-6 shadow-lg border border-border/50 hover:border-primary/50 transition-all duration-300 hover:-translate-y-1"
                            >
                                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 text-primary">
                                    <Icon className="w-7 h-7" />
                                </div>
                                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    {item.desc}
                                </p>
                            </motion.div>
                        )
                    })}
                </div>
            </div>
        </section>
    );
}
