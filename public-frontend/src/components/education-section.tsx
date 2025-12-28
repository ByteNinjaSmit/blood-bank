"use client"

import { useLanguage } from '@/context/language-context';
import { content } from '@/lib/content';
import { motion } from 'framer-motion';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { AlertCircle, IndianRupee } from 'lucide-react';

export default function EducationSection() {
    const { language } = useLanguage();
    const t = content[language].education;

    return (
        <section className="py-20 bg-background">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Shortage Awareness */}
                <div className="mb-16 bg-orange-50 dark:bg-orange-950/20 rounded-2xl p-8 border border-orange-200 dark:border-orange-800">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-full text-orange-600">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold mb-2 text-orange-800 dark:text-orange-200">{t.shortageTitle}</h3>
                            <p className="text-muted-foreground mb-4">
                                {language === 'en' ? 'Blood shortage is commonly observed during:' : 'या काळात रक्ताचा तुटवडा भासतो:'}
                            </p>
                            <div className="flex flex-wrap gap-3">
                                {t.shortageMonths.map((m, i) => (
                                    <span key={i} className="px-3 py-1 bg-white dark:bg-background border rounded-full text-sm font-medium shadow-sm">
                                        {m}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Transparency / Processing Fee */}
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-bold">{t.processingTitle}</h2>
                </div>

                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1" className="border rounded-xl px-4 bg-card shadow-sm">
                        <AccordionTrigger className="text-lg font-semibold hover:no-underline py-4">
                            <span className='flex items-center gap-3'>
                                <IndianRupee className="w-5 h-5 text-primary" />
                                {language === 'en' ? 'Understanding Processing Charges' : 'प्रक्रिया शुल्क समजून घ्या'}
                            </span>
                        </AccordionTrigger>
                        <AccordionContent className="text-base text-muted-foreground pb-6">
                            <p className="mb-4">{t.processingDesc}</p>
                            <ul className="list-disc pl-6 space-y-2 mb-4">
                                {t.processingItems.map((item, i) => (
                                    <li key={i}>{item}</li>
                                ))}
                            </ul>
                            <div className="p-4 bg-muted rounded-lg border border-border">
                                <p className="font-semibold text-foreground text-sm">
                                    {t.noProfit}
                                </p>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>

            </div>
        </section>
    );
}
