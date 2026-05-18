'use client'

import React, { useEffect, useState } from 'react'
import { Calendar, MapPin, Phone, Mail, Clock, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { getActiveCamps } from '@/actions/camp'
import { useLanguage } from '@/context/language-context'
import { content } from '@/lib/content'

/**
 * SOLID: Single Responsibility Principle
 * CampCard component is responsible only for displaying camp information.
 */
const CampCard = ({ camp, t }: { camp: any, t: any }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[40px] border border-gray-100 shadow-xl shadow-gray-200/30 overflow-hidden hover:shadow-2xl transition-all duration-500 group"
    >
        <div className="p-10">
            <div className="flex justify-between items-start mb-8">
                <div className="flex items-center gap-4">
                    <div className="bg-rose-50 p-4 rounded-2xl">
                        <Calendar className="w-8 h-8 text-[#8B0000]" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-100">
                                {t.incomingCampsPage.confirmed}
                            </span>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-full">
                                {camp.siteId}
                            </span>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900">{camp.name}</h3>
                    </div>
                </div>
            </div>

            <p className="text-gray-500 leading-relaxed mb-8">
                {camp.description || "Upcoming blood donation camp."}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                <div className="space-y-5">
                    <div className="flex items-start gap-4">
                        <MapPin className="w-5 h-5 text-[#8B0000] shrink-0 mt-1" />
                        <div>
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">{t.incomingCampsPage.location}</p>
                            <p className="text-base font-bold text-gray-700">{camp.address}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <Clock className="w-5 h-5 text-[#8B0000] shrink-0 mt-1" />
                        <div>
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">{t.incomingCampsPage.schedule}</p>
                            <p className="text-base font-bold text-gray-700">
                                {new Date(camp.dateFrom).toLocaleDateString()} - {new Date(camp.dateTo).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="space-y-5">
                    <div className="flex items-start gap-4">
                        <Phone className="w-5 h-5 text-[#8B0000] shrink-0 mt-1" />
                        <div>
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">{t.incomingCampsPage.contact}</p>
                            <p className="text-base font-bold text-gray-700">{camp.contactInfo?.phone || "+91 94222 23117"}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <Mail className="w-5 h-5 text-[#8B0000] shrink-0 mt-1" />
                        <div>
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">{t.incomingCampsPage.email}</p>
                            <p className="text-base font-bold text-gray-700 truncate">{camp.contactInfo?.email || "camps@sanjivanibloodbank.org"}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="pt-10 border-t border-gray-50 flex flex-wrap gap-4">
                {/* <Link href={`/donate?camp=${camp._id}`} className="flex-1 min-w-fit px-8 py-4 rounded-2xl bg-[#8B0000] text-white font-bold hover:bg-[#700000] transition-all shadow-xl shadow-rose-900/20 text-center">
                    {t.incomingCampsPage.registerBtn}
                </Link> */}
                <button className="flex-1 min-w-fit px-8 py-4 rounded-2xl border-2 border-gray-100 text-gray-700 font-bold hover:border-[#8B0000] hover:text-[#8B0000] transition-all">
                    {t.incomingCampsPage.directionsBtn}
                </button>
            </div>
        </div>
    </motion.div>
);

export default function IncomingCampsPage() {
    const { language } = useLanguage()
    const t = content[language]
    const [camps, setCamps] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadCamps() {
            const res = await getActiveCamps()
            if (res.success) {
                setCamps(res.data)
            }
            setLoading(false)
        }
        loadCamps()
    }, [])

    return (
        <main className="min-h-screen bg-gray-50 pb-20 font-inter pt-20 lg:pt-28">
            <div className="max-w-7xl mx-auto px-4 md:px-12 py-12">
                <div className="mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">{t.incomingCampsPage.title}</h1>
                    <p className="text-gray-500 font-medium max-w-2xl">
                        {t.incomingCampsPage.description}
                    </p>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-10 h-10 text-[#8B0000] animate-spin mb-4" />
                        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">{t.onsiteDonorPage.loadingCamps}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        {camps.map((camp) => (
                            <CampCard key={camp._id} camp={camp} t={t} />
                        ))}
                    </div>
                )}
            </div>
        </main>
    )
}
