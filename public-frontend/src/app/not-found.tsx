'use client';

import Link from 'next/link';
import { useLanguage } from '@/context/language-context';
import { content } from '@/lib/content';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function NotFound() {
    const { language } = useLanguage();
    const t = content[language]?.pageNotFound || {
        title: "404 - Page Not Found",
        subtitle: "The page you are looking for might have been removed.",
        backHome: "Back to Home"
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center space-y-6">
            <div className="bg-red-100 p-6 rounded-full">
                <AlertTriangle className="w-12 h-12 text-red-600" />
            </div>
            <h1 className="text-4xl font-extrabold text-foreground tracking-tight sm:text-5xl">
                {t.title}
            </h1>
            <p className="text-lg text-muted-foreground max-w-md">
                {t.subtitle}
            </p>
            <Link href="/">
                <Button variant="default" size="lg" className="font-bold">
                    {t.backHome}
                </Button>
            </Link>
        </div>
    );
}
