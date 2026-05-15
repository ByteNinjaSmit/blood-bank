'use client'

import React, { useState } from 'react'
import { 
    User, 
    Phone, 
    Calendar, 
    MapPin, 
    Droplets, 
    CheckCircle, 
    ArrowRight, 
    ArrowLeft, 
    Activity, 
    ChevronLeft,
    Stethoscope,
    History,
    HeartPulse,
    Home,
    AlertCircle
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { registerOnSiteDonor } from '@/actions/onsite-donor'

const STEPS = [
    { id: 1, title: 'Identity', icon: User },
    { id: 2, title: 'Contact', icon: MapPin },
    { id: 3, title: 'History', icon: History },
    { id: 4, title: 'Vitals', icon: Activity },
    { id: 5, title: 'Examination', icon: Stethoscope }
]

export default function OnGoingCampRegistration() {
    const [currentStep, setCurrentStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState<string | null>(null)
    
    const [formData, setFormData] = useState({
        // 1. Identity
        firstName: '',
        middleName: '',
        lastName: '',
        sex: '',
        dob: '',
        age: '',
        occupation: '',
        
        // 2. Contact
        address: '',
        mobile: '',
        pincode: '',
        email: '',
        
        // 3. Questionnaire
        isFirstTime: 'no',
        isRepeated: 'no',
        lastDonationDate: '',
        totalDonations: '0',
        emergencyConsent: 'yes',

        // 4. Medical Vitals
        weight: '',
        hb: '',
        temp: '',
        pulse: '',
        bp: '',
        o2Level: '',

        // 5. Clinical Examination
        bloodGroup: '',
        pedalOedema: 'no',
        lymphadenopathy: 'no',
        cyanosis: 'no',
        cvs: 'normal',
        rs: 'normal',
        pa: 'normal',
        cns: 'normal',
        gis: 'normal',
        freeFromSkinDisease: 'yes',
        freeFromScars: 'yes',

        siteId: 'CAMP-ONGOING-001'
    })

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        setError(null)
    }

    const validateStep = (step: number) => {
        switch (step) {
            case 1:
                if (!formData.firstName || !formData.middleName || !formData.lastName || !formData.sex || !formData.dob || !formData.age || !formData.occupation || !formData.bloodGroup) return false
                break
            case 2:
                if (!formData.address || !formData.mobile || !formData.pincode) return false
                break
            case 3:
                return true
            case 4:
                // Ensure all vitals are present. Number 0 is falsy, so we check for empty string.
                if (formData.weight === '' || formData.hb === '' || formData.temp === '' || 
                    formData.pulse === '' || formData.bp === '' || formData.o2Level === '') return false
                break
            case 5:
                return true
        }
        return true
    }

    const nextStep = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, STEPS.length))
            setError(null)
        } else {
            setError("Please fill in all mandatory fields before proceeding.")
        }
    }
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1))

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validateStep(5)) return
        
        setLoading(true)
        try {
            const result = await registerOnSiteDonor(formData as any)
            if (result.success) {
                setSubmitted(true)
            } else {
                setError(result.message)
            }
        } catch (error) {
            setError("An unexpected error occurred.")
        } finally {
            setLoading(false)
        }
    }

    if (submitted) {
        return (
            <main className="min-h-screen bg-gray-50 flex flex-col font-inter">
                <header className="bg-white border-b border-gray-100 py-6 px-12 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="bg-rose-50 p-2 rounded-xl group-hover:bg-rose-100 transition-colors">
                            <Droplets className="text-[#8B0000] w-6 h-6" />
                        </div>
                        <span className="text-xl font-bold text-gray-900 tracking-tight">
                            Sanjivani<span className="text-[#8B0000]">BloodBank</span>
                        </span>
                    </Link>
                </header>
                <div className="flex-1 flex items-center justify-center p-8">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-[40px] p-12 text-center shadow-xl border border-gray-100 max-w-xl w-full"
                    >
                        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8">
                            <CheckCircle className="w-10 h-10 text-green-500" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">Thank you for registering!</h2>
                        <p className="text-gray-500 mb-10 leading-relaxed">
                            Your donation details have been successfully recorded in our system. We appreciate your contribution to saving lives.
                        </p>
                        <div className="flex flex-col gap-3">
                            <Link 
                                href="/"
                                className="bg-[#8B0000] text-white px-8 py-4 rounded-2xl font-bold hover:bg-[#700000] transition-all shadow-lg shadow-rose-900/20 flex items-center justify-center gap-2"
                            >
                                <Home size={18} /> Go to Home Page
                            </Link>
                            <button 
                                onClick={() => window.location.reload()}
                                className="text-gray-400 font-bold hover:text-gray-600 transition-colors py-2"
                            >
                                Register Another Donor
                            </button>
                        </div>
                    </motion.div>
                </div>
            </main>
        )
    }

    return (
        <main className="min-h-screen bg-gray-50 pb-20 font-inter">
            {/* Minimal Header */}
            <header className="bg-white border-b border-gray-100 py-4 px-6 md:px-12 flex items-center justify-between sticky top-0 z-50">
                <Link href="/onsite-donor" className="flex items-center gap-2.5 group">
                    <div className="bg-rose-50 p-1.5 rounded-lg group-hover:bg-rose-100 transition-colors">
                        <Droplets className="text-[#8B0000] w-5 h-5" />
                    </div>
                    <span className="text-lg font-bold text-gray-900 tracking-tight">
                        Voluntary<span className="text-[#8B0000]">Entry</span>
                    </span>
                </Link>
                <Link href="/onsite-donor" className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-[#8B0000] transition-colors">
                    <ChevronLeft size={16} /> Back to Camps
                </Link>
            </header>

            <div className="max-w-4xl mx-auto px-4 py-10">
                <div className="mb-10 text-center">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">Donor Registration Form</h1>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Sanjivani Blood Centre • Camp Operation</p>
                </div>

                {/* Stepper */}
                <div className="bg-white rounded-3xl p-3 mb-8 shadow-sm border border-gray-100 flex justify-between items-center overflow-x-auto gap-2">
                    {STEPS.map((step) => {
                        const Icon = step.icon
                        const isActive = currentStep === step.id
                        const isCompleted = currentStep > step.id
                        
                        return (
                            <div key={step.id} className="flex items-center gap-2 min-w-fit px-4">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
                                    isActive ? 'bg-[#8B0000] text-white shadow-md shadow-rose-900/20' : 
                                    isCompleted ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-400'
                                }`}>
                                    {isCompleted ? <CheckCircle size={16} /> : <Icon size={16} />}
                                </div>
                                <div>
                                    <p className={`text-[9px] font-black uppercase tracking-widest leading-none mb-0.5 ${isActive ? 'text-[#8B0000]' : 'text-gray-400'}`}>
                                        Step {step.id}
                                    </p>
                                    <p className={`text-xs font-bold leading-none ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                                        {step.title}
                                    </p>
                                </div>
                                {step.id < STEPS.length && (
                                    <div className="hidden md:block w-4 h-[1px] bg-gray-100 ml-2" />
                                )}
                            </div>
                        )
                    })}
                </div>

                <form onSubmit={handleSubmit} className="bg-white rounded-[32px] shadow-xl shadow-gray-200/30 border border-gray-100 overflow-hidden">
                    <div className="p-8 md:p-10">
                        <AnimatePresence mode="wait">
                            {currentStep === 1 && (
                                <motion.div key="step1" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">First Name *</label>
                                            <input required name="firstName" value={formData.firstName} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-[#8B0000]/10 focus:bg-white transition-all outline-none font-bold text-sm text-gray-900" placeholder="NAME" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Father / Husband Name *</label>
                                            <input required name="middleName" value={formData.middleName} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-[#8B0000]/10 focus:bg-white transition-all outline-none font-bold text-sm text-gray-900" placeholder="FATHER/HUSBAND" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Surname *</label>
                                            <input required name="lastName" value={formData.lastName} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-[#8B0000]/10 focus:bg-white transition-all outline-none font-bold text-sm text-gray-900" placeholder="LAST NAME" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Sex *</label>
                                            <div className="flex gap-2">
                                                {['M', 'F'].map(s => (
                                                    <button key={s} type="button" onClick={() => setFormData(p => ({ ...p, sex: s }))} className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all border-2 ${formData.sex === s ? 'bg-rose-50 border-[#8B0000] text-[#8B0000]' : 'bg-white border-gray-50 text-gray-400 hover:border-gray-100'}`}>
                                                        {s === 'M' ? 'Male' : 'Female'}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Date of Birth *</label>
                                            <input required name="dob" type="date" value={formData.dob} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-[#8B0000]/10 outline-none font-bold text-sm text-gray-900" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Age *</label>
                                            <input required name="age" type="number" value={formData.age} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-[#8B0000]/10 outline-none font-bold text-sm text-gray-900" placeholder="Yrs" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Blood Group *</label>
                                            <select required name="bloodGroup" value={formData.bloodGroup} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-[#8B0000]/10 focus:bg-white transition-all outline-none font-bold text-sm text-gray-900 appearance-none">
                                                <option value="">Select</option>
                                                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                                                    <option key={bg} value={bg}>{bg}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Occupation *</label>
                                        <select required name="occupation" value={formData.occupation} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-[#8B0000]/10 focus:bg-white transition-all outline-none font-bold text-sm text-gray-900 appearance-none">
                                            <option value="">Select Occupation</option>
                                            <option value="Student">Student</option>
                                            <option value="Service">Service</option>
                                            <option value="Business">Business</option>
                                            <option value="Self Employed">Self Employed</option>
                                            <option value="Housewife">Housewife</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </motion.div>
                            )}

                            {currentStep === 2 && (
                                <motion.div key="step2" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-6">
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Full Address *</label>
                                        <textarea required name="address" value={formData.address} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-[#8B0000]/10 outline-none font-bold text-sm text-gray-900 min-h-[100px]" placeholder="Residential address" />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="md:col-span-2 space-y-1.5">
                                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Mobile Number *</label>
                                            <input required name="mobile" type="tel" maxLength={10} value={formData.mobile} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-[#8B0000]/10 outline-none font-bold text-sm text-gray-900" placeholder="10-DIGIT MOBILE" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">City Pincode *</label>
                                            <input required name="pincode" type="text" maxLength={6} value={formData.pincode} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-[#8B0000]/10 outline-none font-bold text-sm text-gray-900" placeholder="423601" />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Email Address</label>
                                        <input name="email" type="email" value={formData.email} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-[#8B0000]/10 outline-none font-bold text-sm text-gray-900" placeholder="email@example.com" />
                                    </div>
                                </motion.div>
                            )}

                            {currentStep === 3 && (
                                <motion.div key="step3" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 space-y-3">
                                            <p className="text-xs font-bold text-gray-600">First Time Donor?</p>
                                            <div className="flex gap-2">
                                                {['yes', 'no'].map(o => (
                                                    <button key={o} type="button" onClick={() => setFormData(p => ({ ...p, isFirstTime: o }))} className={`flex-1 py-2 rounded-lg font-bold text-[10px] uppercase border transition-all ${formData.isFirstTime === o ? 'bg-[#8B0000] text-white border-[#8B0000]' : 'bg-white text-gray-300 border-gray-100'}`}>
                                                        {o}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 space-y-3">
                                            <p className="text-xs font-bold text-gray-600">Repeated Donor?</p>
                                            <div className="flex gap-2">
                                                {['yes', 'no'].map(o => (
                                                    <button key={o} type="button" onClick={() => setFormData(p => ({ ...p, isRepeated: o }))} className={`flex-1 py-2 rounded-lg font-bold text-[10px] uppercase border transition-all ${formData.isRepeated === o ? 'bg-[#8B0000] text-white border-[#8B0000]' : 'bg-white text-gray-300 border-gray-100'}`}>
                                                        {o}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Last Donation Date</label>
                                            <input name="lastDonationDate" type="date" value={formData.lastDonationDate} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-[#8B0000]/10 outline-none font-bold text-sm text-gray-900" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Donations to date</label>
                                            <input name="totalDonations" type="number" value={formData.totalDonations} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-[#8B0000]/10 outline-none font-bold text-sm text-gray-900" placeholder="Count" />
                                        </div>
                                    </div>

                                    <div className="p-5 bg-rose-50 border border-rose-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <p className="text-xs font-bold text-[#8B0000] leading-tight">
                                            Available for emergency donation calls?
                                        </p>
                                        <div className="flex gap-2 sm:w-48">
                                            {['yes', 'no'].map(o => (
                                                <button key={o} type="button" onClick={() => setFormData(p => ({ ...p, emergencyConsent: o }))} className={`flex-1 py-2 rounded-xl font-bold text-[10px] uppercase transition-all border-2 ${formData.emergencyConsent === o ? 'bg-[#8B0000] border-[#8B0000] text-white' : 'bg-white border-rose-200 text-rose-300'}`}>
                                                    {o === 'yes' ? 'YES' : 'NO'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {currentStep === 4 && (
                                <motion.div key="step4" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-6">
                                    <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100 flex items-center gap-4">
                                        <HeartPulse size={18} className="text-[#8B0000]" />
                                        <p className="text-[11px] font-bold text-amber-800/70">STAFF: Enter clinical measurements accurately.</p>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Weight (kg) *</label>
                                            <input required name="weight" type="number" value={formData.weight} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-[#8B0000]/10 outline-none font-bold text-lg text-gray-900" placeholder="kg" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">HB (gm%) *</label>
                                            <input required name="hb" type="number" step="0.1" value={formData.hb} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-[#8B0000]/10 outline-none font-bold text-lg text-gray-900" placeholder="eg: 12.5" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Temp (°C) *</label>
                                            <div className="relative">
                                                <input required name="temp" type="number" step="0.1" value={formData.temp} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-[#8B0000]/10 outline-none font-bold text-lg text-gray-900" placeholder="eg: 37.0" />
                                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 font-bold text-xs">°C</span>
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Pulse (/min) *</label>
                                            <input required name="pulse" type="number" value={formData.pulse} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-[#8B0000]/10 outline-none font-bold text-lg text-gray-900" placeholder="eg: 72" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">BP (mmHg) *</label>
                                            <input required name="bp" value={formData.bp} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-[#8B0000]/10 outline-none font-bold text-lg text-gray-900" placeholder="eg: 120/80" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">O2 Level (%) *</label>
                                            <input required name="o2Level" type="number" value={formData.o2Level} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-[#8B0000]/10 outline-none font-bold text-lg text-gray-900" placeholder="eg: 98" />
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {currentStep === 5 && (
                                <motion.div key="step5" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {[
                                            { id: 'pedalOedema', label: 'Pedal Oedema' },
                                            { id: 'lymphadenopathy', label: 'Lymphadenopathy' },
                                            { id: 'cyanosis', label: 'Cyanosis' }
                                        ].map(item => (
                                            <div key={item.id} className="space-y-2">
                                                <label className="text-[10px] font-bold text-gray-500 uppercase">{item.label}?</label>
                                                <div className="flex gap-2">
                                                    {['yes', 'no'].map(o => (
                                                        <button key={o} type="button" onClick={() => setFormData(p => ({ ...p, [item.id]: o }))} className={`flex-1 py-2 rounded-lg font-bold text-[9px] uppercase border transition-all ${formData[item.id as keyof typeof formData] === o ? 'bg-[#8B0000] text-white border-[#8B0000]' : 'bg-white text-gray-300 border-gray-50'}`}>
                                                            {o}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Systematic Exam (Click to toggle)</label>
                                        <div className="grid grid-cols-5 gap-2">
                                            {['cvs', 'rs', 'pa', 'cns', 'gis'].map(sys => (
                                                <button key={sys} type="button" onClick={() => setFormData(p => ({ ...p, [sys]: p[sys as keyof typeof p] === 'normal' ? 'abnormal' : 'normal' }))} className={`py-3 rounded-xl border transition-all text-center ${formData[sys as keyof typeof formData] === 'normal' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
                                                    <p className="text-[9px] font-black uppercase mb-0.5">{sys}</p>
                                                    <p className="text-[8px] font-bold opacity-70">{formData[sys as keyof typeof formData] === 'normal' ? 'Normal' : 'Abnormal'}</p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-bold text-gray-500 leading-tight">Free from skin disease at phlebactomy site?</p>
                                            <div className="flex gap-2">
                                                {['yes', 'no'].map(o => (
                                                    <button key={o} type="button" onClick={() => setFormData(p => ({ ...p, freeFromSkinDisease: o }))} className={`flex-1 py-2 rounded-lg font-bold text-[9px] uppercase border transition-all ${formData.freeFromSkinDisease === o ? 'bg-green-500 text-white border-green-500 shadow-sm shadow-green-900/10' : 'bg-white text-gray-300 border-gray-50'}`}>
                                                        {o}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-bold text-gray-500 leading-tight">Arms and forearm free from puncture/scars?</p>
                                            <div className="flex gap-2">
                                                {['yes', 'no'].map(o => (
                                                    <button key={o} type="button" onClick={() => setFormData(p => ({ ...p, freeFromScars: o }))} className={`flex-1 py-2 rounded-lg font-bold text-[9px] uppercase border transition-all ${formData.freeFromScars === o ? 'bg-green-500 text-white border-green-500 shadow-sm shadow-green-900/10' : 'bg-white text-gray-300 border-gray-50'}`}>
                                                        {o}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="p-6 bg-gray-50/30 border-t border-gray-100">
                        <AnimatePresence>
                            {error && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-4 p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2 text-rose-600 text-xs font-bold">
                                    <AlertCircle size={14} /> {error}
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <div className="flex justify-between items-center">
                            <button type="button" onClick={prevStep} disabled={currentStep === 1} className={`flex items-center gap-2 font-bold text-xs transition-all ${currentStep === 1 ? 'text-gray-300 pointer-events-none' : 'text-gray-500 hover:text-gray-900'}`}>
                                <ArrowLeft size={16} /> Back
                            </button>

                            {currentStep < STEPS.length ? (
                                <button type="button" onClick={nextStep} className="bg-[#8B0000] text-white px-8 py-3 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-[#700000] transition-all shadow-md shadow-rose-900/20">
                                    Next Step <ArrowRight size={16} />
                                </button>
                            ) : (
                                <button type="submit" disabled={loading} className="bg-[#8B0000] text-white px-10 py-3 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-[#700000] transition-all shadow-md shadow-rose-900/20 disabled:opacity-70">
                                    {loading ? 'Processing...' : 'Complete & Consent'}
                                </button>
                            )}
                        </div>
                    </div>
                </form>
            </div>
        </main>
    )
}
