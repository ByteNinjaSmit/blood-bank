'use client'

import React from 'react'
import { Calendar, MapPin, Phone, Mail, Clock, Droplets, ChevronLeft, Search, Filter, Plus } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'

const demoCamps = [
    {
        siteId: "CAMP-2024-001",
        name: "Community Health Blood Drive",
        description: "A major blood donation event for the local community to support emergency reserves.",
        address: "Town Hall Plaza, Main Street, Kopargaon",
        phone: "+91 94222 23117",
        email: "camps@sanjivanibloodbank.org",
        dateFrom: "2024-06-15",
        dateTo: "2024-06-16",
        time: "09:00 AM - 05:00 PM",
        status: "Confirmed"
    }
]

export default function IncomingCampsPage() {
    return (
        <main className="min-h-screen bg-gray-50 pb-20 font-inter">
            {/* Minimal Header */}
            <header className="bg-white border-b border-gray-100 py-6 px-4 md:px-12 flex items-center justify-between sticky top-0 z-50">
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="bg-rose-50 p-2 rounded-xl group-hover:bg-rose-100 transition-colors">
                        <Droplets className="text-[#8B0000] w-6 h-6" />
                    </div>
                    <span className="text-xl font-bold text-gray-900 tracking-tight">
                        Sanjivani<span className="text-[#8B0000]">Camps</span>
                    </span>
                </Link>
                <Link href="/" className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-[#8B0000] transition-colors">
                    <ChevronLeft size={18} /> Back to Website
                </Link>
            </header>

            <div className="max-w-7xl mx-auto px-4 md:px-12 py-12">
                <div className="mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Incoming Blood Camps</h1>
                    <p className="text-gray-500 font-medium max-w-2xl">
                        Stay informed about upcoming blood donation camps in and around Kopargaon. 
                        Join us in our mission to ensure no life is lost due to blood shortage.
                    </p>
                </div>

                {/* Camp Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {demoCamps.map((camp, index) => (
                        <motion.div
                            key={camp.siteId}
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
                                                    {camp.status}
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
                                    {camp.description}
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                                    <div className="space-y-5">
                                        <div className="flex items-start gap-4">
                                            <MapPin className="w-5 h-5 text-[#8B0000] shrink-0 mt-1" />
                                            <div>
                                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Location</p>
                                                <p className="text-base font-bold text-gray-700">{camp.address}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-4">
                                            <Clock className="w-5 h-5 text-[#8B0000] shrink-0 mt-1" />
                                            <div>
                                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Schedule</p>
                                                <p className="text-base font-bold text-gray-700">{camp.time}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-5">
                                        <div className="flex items-start gap-4">
                                            <Phone className="w-5 h-5 text-[#8B0000] shrink-0 mt-1" />
                                            <div>
                                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Contact</p>
                                                <p className="text-base font-bold text-gray-700">{camp.phone}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-4">
                                            <Mail className="w-5 h-5 text-[#8B0000] shrink-0 mt-1" />
                                            <div>
                                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Email</p>
                                                <p className="text-base font-bold text-gray-700 truncate">{camp.email}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-10 border-t border-gray-50 flex flex-wrap gap-4">
                                    <button className="flex-1 min-w-fit px-8 py-4 rounded-2xl bg-[#8B0000] text-white font-bold hover:bg-[#700000] transition-all shadow-xl shadow-rose-900/20">
                                        Interested in Donating
                                    </button>
                                    <button className="flex-1 min-w-fit px-8 py-4 rounded-2xl border-2 border-gray-100 text-gray-700 font-bold hover:border-[#8B0000] hover:text-[#8B0000] transition-all">
                                        Get Directions
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </main>
    )
}
