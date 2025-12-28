"use client"

import { useLanguage } from '@/context/language-context';
import { content } from '@/lib/content';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

export default function SafetySection() {
    const { language } = useLanguage();
    const t = content[language].safety;

    return (
        <section className="py-20 lg:py-24 bg-gradient-to-b from-background to-muted/20 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

                    {/* Visual with Steps */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="relative order-2 lg:order-1"
                    >
                        <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-white border-4 border-white">
                            <img
                                src="/blood-1.webp"
                                alt="Safety Protocols"
                                className="w-full h-auto object-cover grayscale opacity-20"
                            />
                            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm p-8 flex flex-col justify-center">
                                <div className="space-y-6">
                                    {t.items.map((item, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, x: -20 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: index * 0.1 }}
                                            className="flex items-start gap-4"
                                        >
                                            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shrink-0 mt-0.5">
                                                <Check className="w-4 h-4 text-white" />
                                            </div>
                                            <p className="font-semibold text-lg">{item}</p>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Content */}
                    <div className="order-1 lg:order-2">
                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                        >
                            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 text-primary">
                                {t.title}
                            </h2>
                            <p className="text-lg text-muted-foreground mb-8 text-balance">
                                {language === 'en'
                                    ? "We adhere to strict international medical protocols to ensure every drop of blood is safe for transfusion. From collection to storage, quality is our priority."
                                    : "आम्ही रक्तदात्याची आणि रुग्णाची काळजी घेण्यासाठी आंतरराष्ट्रीय वैद्यकीय नियमांचे पालन करतो. रक्त संकलन ते साठवणूक, गुणवत्ता हीच आमची प्राथमिकता आहे."
                                }
                            </p>

                            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400">
                                        <span className="text-xl font-bold">4°C</span>
                                    </div>
                                    <div>
                                        <p className="font-bold">Temperature Controlled</p>
                                        <p className="text-sm text-muted-foreground">Maintained continuously between +4°C to -15°C</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    );
}
