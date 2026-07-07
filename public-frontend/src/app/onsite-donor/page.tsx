'use client'

import React from 'react'
import { Calendar, MapPin, Phone, Mail, Clock, Droplets, ChevronLeft, ArrowRight, Activity, Users, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getActiveCamps, getPastCamps } from '@/actions/camp'
import { useLanguage } from '@/context/language-context'
import { content } from '@/lib/content'

export default function VoluntaryCampDonationPage() {
    const { language } = useLanguage()
    const t = content[language]
    const [camps, setCamps] = useState<any[]>([])
    const [pastCamps, setPastCamps] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadCamps() {
            const [activeRes, pastRes] = await Promise.all([
                getActiveCamps(),
                getPastCamps()
            ])
            if (activeRes.success) setCamps(activeRes.data)
            if (pastRes.success) setPastCamps(pastRes.data)
            setLoading(false)
        }
        loadCamps()
    }, [])

    const now = new Date()
    const ongoingCamps = camps.filter(c => new Date(c.dateFrom) <= now && new Date(c.dateTo) >= now)
    const upcomingCamps = camps.filter(c => new Date(c.dateFrom) > now)

    return (
        <main className="min-h-screen bg-gray-50 pb-20 font-inter pt-20 lg:pt-28">
            <div className="max-w-6xl mx-auto px-4 py-12">
                <div className="mb-12 text-center">
                    <h1 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">
                        {t.onsiteDonorPage.title}
                    </h1>
                    <p className="text-gray-500 font-medium max-w-2xl mx-auto">
                        {t.onsiteDonorPage.description}
                    </p>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-10 h-10 text-[#8B0000] animate-spin mb-4" />
                        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">{t.onsiteDonorPage.loadingCamps}</p>
                    </div>
                ) : (
                    <>
                        {/* Ongoing Camps */}
                        <div className="bg-white rounded-[40px] border border-gray-100 shadow-xl shadow-gray-200/20 overflow-hidden mb-12">
                            <div className="p-8 md:p-14 border-b border-gray-50">
                                <div className="flex items-center gap-3 mb-10">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                    <h2 className="text-2xl font-black text-gray-900 uppercase tracking-widest">
                                        {t.onsiteDonorPage.ongoingCamps}
                                    </h2>
                                </div>

                                {ongoingCamps.length === 0 ? (
                                    <p className="text-gray-400 font-medium">{t.onsiteDonorPage.noOngoing}</p>
                                ) : (
                                    <div className="space-y-12">
                                        {ongoingCamps.map((camp) => (
                                            <div key={camp._id} className="flex flex-col lg:flex-row lg:items-center gap-10 group">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <span className="text-[10px] font-black text-[#8B0000] bg-rose-50 px-3 py-1 rounded-full uppercase tracking-widest border border-rose-100">
                                                            {camp.campId}
                                                        </span>
                                                        <span className="text-[10px] font-black text-green-600 bg-green-50 px-3 py-1 rounded-full uppercase tracking-widest border border-green-100">
                                                            Live Now
                                                        </span>
                                                    </div>
                                                    <h3 className="text-3xl font-bold text-gray-900 mb-4 group-hover:text-[#8B0000] transition-colors">{camp.name}</h3>
                                                    <div className="flex flex-wrap gap-6 mb-4">
                                                        <div className="flex items-center gap-2 text-gray-500 font-medium">
                                                            <MapPin size={18} className="text-gray-300" />
                                                            {camp.address}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-gray-500 font-medium">
                                                            <Calendar size={18} className="text-gray-300" />
                                                            {new Date(camp.dateFrom).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-wrap gap-3">
                                                        <div className="flex items-center gap-2 bg-rose-50 text-[#8B0000] px-4 py-2 rounded-2xl text-sm font-bold">
                                                            <Users size={16} />
                                                            {camp.donorCount ?? 0} {t.onsiteDonorPage.totalDonors}
                                                        </div>
                                                        <div className="flex items-center gap-2 bg-rose-50 text-[#8B0000] px-4 py-2 rounded-2xl text-sm font-bold">
                                                            <Droplets size={16} />
                                                            {camp.donationCount ?? 0} {t.onsiteDonorPage.totalDonations}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="lg:border-l lg:border-rose-100 lg:pl-12">
                                                    <Link 
                                                        href={`/onsite-donor/ongoing-camp?campId=${camp._id}`} 
                                                        className="bg-[#8B0000] text-white px-10 py-5 rounded-[24px] font-black uppercase tracking-widest text-sm hover:bg-[#700000] transition-all shadow-xl shadow-rose-900/20 flex items-center justify-center gap-3 w-full lg:w-fit"
                                                    >
                                                        {t.onsiteDonorPage.registerHere} <ArrowRight size={20} />
                                                    </Link>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Upcoming Section */}
                            <div className="p-8 md:p-14 bg-gray-50/30">
                                <div className="flex items-center gap-3 mb-10">
                                    <div className="w-2 h-2 bg-amber-500 rounded-full" />
                                    <h2 className="text-2xl font-black text-gray-900 uppercase tracking-widest">
                                        {t.onsiteDonorPage.upcomingCamps}
                                    </h2>
                                </div>

                                {upcomingCamps.length === 0 ? (
                                    <p className="text-gray-400 font-medium">{t.onsiteDonorPage.noUpcoming}</p>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {upcomingCamps.map((camp) => (
                                            <div key={camp._id} className="bg-white p-8 rounded-[32px] border border-gray-100 hover:shadow-xl transition-all duration-500">
                                                <div className="flex justify-between items-start mb-6">
                                                    <div className="bg-rose-50 p-3 rounded-2xl">
                                                        <Calendar className="text-[#8B0000] w-6 h-6" />
                                                    </div>
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{camp.campId}</span>
                                                </div>
                                                <h4 className="text-xl font-bold text-gray-900 mb-2">{camp.name}</h4>
                                                <p className="text-gray-500 text-sm mb-6 flex items-center gap-2">
                                                    <MapPin size={14} /> {camp.address}
                                                </p>
                                                <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                                                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                                        {new Date(camp.dateFrom).toLocaleDateString()}
                                                    </div>
                                                    {/* <div className="flex items-center gap-4">
                                                        <Link href={`/donate?camp=${camp._id}`} className="px-6 py-3 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-gray-800 transition-all">
                                                            {t.onsiteDonorPage.registerToDonate}
                                                        </Link>
                                                    </div> */}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {/* History Section */}
                {!loading && pastCamps.length > 0 && (
                    <div className="mt-24">
                        <div className="flex items-center gap-3 mb-10">
                            <div className="w-2 h-2 bg-gray-400 rounded-full" />
                            <h2 className="text-2xl font-black text-gray-500 uppercase tracking-widest">
                                {t.onsiteDonorPage.campHistory}
                            </h2>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {pastCamps.map((camp) => (
                                <motion.div 
                                    key={camp._id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="bg-white rounded-3xl p-6 border border-gray-100 opacity-70 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="bg-gray-50 p-3 rounded-xl">
                                            <Calendar className="w-5 h-5 text-gray-400" />
                                        </div>
                                        <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-md uppercase">
                                            {t.onsiteDonorPage.completed}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">{camp.name}</h3>
                                    <div className="space-y-2 mb-4">
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <MapPin size={12} /> {camp.address}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <Clock size={12} /> {new Date(camp.dateFrom).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mb-6">
                                        <div className="flex items-center gap-1.5 bg-gray-50 text-gray-600 px-3 py-1.5 rounded-xl text-xs font-bold">
                                            <Users size={12} />
                                            {camp.donorCount ?? 0} {t.onsiteDonorPage.totalDonors}
                                        </div>
                                        <div className="flex items-center gap-1.5 bg-gray-50 text-gray-600 px-3 py-1.5 rounded-xl text-xs font-bold">
                                            <Droplets size={12} />
                                            {camp.donationCount ?? 0} {t.onsiteDonorPage.totalDonations}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </main>
    )
}
