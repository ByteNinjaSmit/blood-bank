'use client'

import React from 'react'
import { Calendar, MapPin, Phone, Mail, Clock, Droplets, ChevronLeft, ArrowRight, Activity, Users } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'

const ongoingCamps = [
    {
        siteId: "CAMP-ONGOING-001",
        name: "Sanjivani Mega Blood Camp",
        description: "Live donation camp at Kopargaon Town Hall. All healthy citizens are invited.",
        address: "Town Hall, Main Road, Kopargaon",
        phone: "+91 94222 23117",
        time: "09:00 AM - 06:00 PM",
        status: "Live Now"
    }
]

const upcomingCamps = [
    {
        siteId: "CAMP-2024-002",
        name: "College Campus Drive",
        description: "Blood donation drive for students and faculty.",
        address: "Sanjivani College of Engineering, Kopargaon",
        phone: "+91 94222 23117",
        date: "2024-06-20",
        time: "10:00 AM - 04:00 PM",
        status: "Upcoming"
    }
]

export default function VoluntaryCampDonationPage() {
    return (
        <main className="min-h-screen bg-gray-50 pb-20 font-inter">
            {/* Minimal Header */}
            <header className="bg-white border-b border-gray-100 py-6 px-4 md:px-12 flex items-center justify-between sticky top-0 z-50">
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="bg-rose-50 p-2 rounded-xl group-hover:bg-rose-100 transition-colors">
                        <Droplets className="text-[#8B0000] w-6 h-6" />
                    </div>
                    <span className="text-xl font-bold text-gray-900 tracking-tight">
                        Voluntary<span className="text-[#8B0000]">Donation</span>
                    </span>
                </Link>
                <Link href="/" className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-[#8B0000] transition-colors">
                    <ChevronLeft size={18} /> Back to Website
                </Link>
            </header>

            <div className="max-w-6xl mx-auto px-4 py-12">
                <div className="mb-12 text-center">
                    <h1 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">Voluntary Camp Donation</h1>
                    <p className="text-gray-500 font-medium max-w-2xl mx-auto">
                        Find active blood donation camps near you. Register online to save time and help us prepare for your visit.
                    </p>
                </div>

                {/* Big Rectangle Container */}
                <div className="bg-white rounded-[48px] shadow-2xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                    
                    {/* Ongoing Camps Section */}
                    <div className="p-8 md:p-14 border-b border-gray-50">
                        <div className="flex items-center gap-3 mb-10">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-widest">Ongoing Camps</h2>
                        </div>

                        <div className="space-y-8">
                            {ongoingCamps.map((camp) => (
                                <div key={camp.siteId} className="bg-rose-50/30 rounded-[32px] p-8 md:p-10 border border-rose-100/50 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                                    <div className="flex-1 space-y-6">
                                        <div>
                                            <span className="text-[10px] font-black text-rose-400 uppercase tracking-[0.2em] mb-2 block">
                                                Active • {camp.siteId}
                                            </span>
                                            <h3 className="text-3xl font-bold text-gray-900 mb-3">{camp.name}</h3>
                                            <p className="text-gray-600 font-medium leading-relaxed max-w-xl">{camp.description}</p>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            <div className="flex items-start gap-4">
                                                <MapPin className="text-[#8B0000] w-5 h-5 shrink-0 mt-1" />
                                                <div>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Location</p>
                                                    <p className="text-sm font-bold text-gray-700">{camp.address}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-4">
                                                <Clock className="text-[#8B0000] w-5 h-5 shrink-0 mt-1" />
                                                <div>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Timing</p>
                                                    <p className="text-sm font-bold text-gray-700">{camp.time}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="lg:border-l lg:border-rose-100 lg:pl-12">
                                        <Link 
                                            href="/onsite-donor/ongoing-camp" 
                                            className="bg-[#8B0000] text-white px-10 py-5 rounded-[24px] font-black uppercase tracking-widest text-sm hover:bg-[#700000] transition-all shadow-xl shadow-rose-900/20 flex items-center justify-center gap-3 w-full lg:w-fit"
                                        >
                                            Register Here <ArrowRight size={20} />
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Upcoming Camps Section */}
                    <div className="p-8 md:p-14 bg-gray-50/30">
                        <div className="flex items-center gap-3 mb-10">
                            <div className="w-2 h-2 bg-amber-500 rounded-full" />
                            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-widest">Upcoming Camps</h2>
                        </div>

                        <div className="space-y-6">
                            {upcomingCamps.map((camp) => (
                                <div key={camp.siteId} className="bg-white rounded-[32px] p-8 border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-lg transition-shadow">
                                    <div className="flex items-center gap-6">
                                        <div className="bg-gray-50 p-5 rounded-2xl">
                                            <Calendar className="text-gray-400 w-8 h-8" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="text-xl font-bold text-gray-900">{camp.name}</h3>
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-0.5 rounded-full">
                                                    {new Date(camp.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                                </span>
                                            </div>
                                            <p className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                                <MapPin size={14} /> {camp.address}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <button className="px-6 py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all">
                                            View Details
                                        </button>
                                        <button className="px-6 py-3 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-gray-800 transition-all">
                                            Remind Me
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                {/* Info Footer */}
                <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="bg-white p-8 rounded-[32px] border border-gray-100 flex items-center gap-6">
                        <div className="bg-rose-50 p-4 rounded-2xl">
                            <Activity className="text-[#8B0000]" />
                        </div>
                        <div>
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Live Units</p>
                            <p className="text-xl font-bold text-gray-900">1,240+</p>
                        </div>
                    </div>
                    <div className="bg-white p-8 rounded-[32px] border border-gray-100 flex items-center gap-6">
                        <div className="bg-rose-50 p-4 rounded-2xl">
                            <Users className="text-[#8B0000]" />
                        </div>
                        <div>
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Active Donors</p>
                            <p className="text-xl font-bold text-gray-900">45k+</p>
                        </div>
                    </div>
                    <div className="bg-white p-8 rounded-[32px] border border-gray-100 flex items-center gap-6">
                        <div className="bg-rose-50 p-4 rounded-2xl">
                            <Droplets className="text-[#8B0000]" />
                        </div>
                        <div>
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Lives Saved</p>
                            <p className="text-xl font-bold text-gray-900">100k+</p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}
