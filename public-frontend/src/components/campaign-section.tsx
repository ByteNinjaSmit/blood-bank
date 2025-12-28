"use client"

import { useLanguage } from '@/context/language-context';
import { content } from '@/lib/content';
import { motion } from 'framer-motion';
import { Gift, Calendar, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CampaignSection() {
    const { language } = useLanguage();
    const t = content[language].campaign;

    return (
        <section className="py-20 bg-primary text-primary-foreground relative overflow-hidden">
            <div className="absolute inset-0">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full blur-[120px] translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-black/10 rounded-full blur-[120px] -translate-x-1/2 translate-y-1/2"></div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                >
                    <div className="inline-flex items-center justify-center p-3 bg-white/20 rounded-full mb-6 backdrop-blur-sm">
                        <Gift className="w-8 h-8 text-white" />
                    </div>

                    <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black mb-6 tracking-tight leading-tight">
                        {t.title}
                    </h2>

                    <p className="text-xl sm:text-2xl font-medium text-white/90 max-w-2xl mx-auto mb-12">
                        {t.subtitle}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
                        {t.occasions.map((item, index) => (
                            <div key={index} className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-colors">
                                <Calendar className="w-8 h-8 mb-4 mx-auto opacity-80" />
                                <p className="text-lg font-bold">{item}</p>
                            </div>
                        ))}
                    </div>

                    <a href="/donate">
                        <Button size="lg" variant="secondary" className="px-8 py-6 text-lg rounded-full font-bold shadow-2xl hover:scale-105 transition-transform">
                            {t.cta} <Heart className="w-5 h-5 ml-2 fill-primary text-primary" />
                        </Button>
                    </a>
                </motion.div>
            </div>
        </section>
    );
}
