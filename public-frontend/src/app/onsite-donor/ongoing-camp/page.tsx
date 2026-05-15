'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { 
    User, 
    MapPin, 
    CheckCircle, 
    ArrowRight, 
    ArrowLeft, 
    Activity, 
    Stethoscope,
    History,
    Home,
    AlertCircle,
    HeartPulse
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { createVoluntaryCampDonation } from '@/actions/voluntary-camp-donation'
import { useSearchParams } from 'next/navigation'
import { useLanguage } from '@/context/language-context'
import { content } from '@/lib/content'
import { getActiveCamps } from '@/actions/camp'
import { FormInput, FormSelect, FormRadioGroup, FormVitalsInput } from './form-fields'
import { voluntaryCampDonationSchema } from '@/schemas/voluntary-camp-donation-schema'
import { z } from 'zod'

export default function OnGoingCampRegistration() {
    return (
        <Suspense fallback={null}>
            <OnGoingCampRegistrationForm />
        </Suspense>
    )
}

function OnGoingCampRegistrationForm() {
    const { language } = useLanguage()
    const t = content[language]
    const searchParams = useSearchParams()
    const campIdParam = searchParams.get('campId')
    
    const [currentStep, setCurrentStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
    const [camps, setCamps] = useState<any[]>([])
    const [loadingCamps, setLoadingCamps] = useState(true)
    
    const [formData, setFormData] = useState({
        // 1. Identity
        firstName: '',
        middleName: '',
        lastName: '',
        sex: '',
        dob: '',
        age: '',
        occupation: '',
        bloodGroup: '',
        
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

        siteId: campIdParam || ''
    })

    const STEPS = [
        { id: 1, title: t.onsiteRegistrationForm.steps.identity, icon: User, fields: ['firstName', 'middleName', 'lastName', 'sex', 'dob', 'age', 'bloodGroup', 'occupation', 'siteId'] },
        { id: 2, title: t.onsiteRegistrationForm.steps.contact, icon: MapPin, fields: ['address', 'mobile', 'pincode', 'email'] },
        { id: 3, title: t.onsiteRegistrationForm.steps.history, icon: History, fields: ['isFirstTime', 'isRepeated', 'lastDonationDate', 'totalDonations', 'emergencyConsent'] },
        { id: 4, title: t.onsiteRegistrationForm.steps.vitals, icon: Activity, fields: ['weight', 'hb', 'temp', 'pulse', 'bp', 'o2Level'] },
        { id: 5, title: t.onsiteRegistrationForm.steps.examination, icon: Stethoscope, fields: ['pedalOedema', 'lymphadenopathy', 'cyanosis', 'cvs', 'rs', 'pa', 'cns', 'gis', 'freeFromSkinDisease', 'freeFromScars'] }
    ]

    useEffect(() => {
        async function loadCamps() {
            const res = await getActiveCamps()
            if (res.success) {
                setCamps(res.data)
                if (!campIdParam && res.data.length > 0) {
                    const ongoing = res.data.find((c: any) => {
                        const now = new Date()
                        return new Date(c.dateFrom) <= now && new Date(c.dateTo) >= now
                    })
                    if (ongoing) setFormData(prev => ({ ...prev, siteId: ongoing._id }))
                }
            }
            setLoadingCamps(false)
        }
        loadCamps()
    }, [campIdParam])

    useEffect(() => {
        if (campIdParam) setFormData(prev => ({ ...prev, siteId: campIdParam }))
    }, [campIdParam])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        // Clear error for this field
        if (fieldErrors[name]) {
            setFieldErrors(prev => {
                const updated = { ...prev }
                delete updated[name]
                return updated
            })
        }
        setError(null)
    }

    const validateStep = (step: number) => {
        const stepFields = STEPS[step - 1].fields
        const stepData = Object.fromEntries(
            Object.entries(formData).filter(([key]) => stepFields.includes(key))
        )

        try {
            // Partial validation for the current step
            const stepSchema = voluntaryCampDonationSchema.pick(
                Object.fromEntries(stepFields.map(f => [f, true])) as any
            )
            stepSchema.parse(stepData)
            setFieldErrors({})
            return true
        } catch (err) {
            if (err instanceof z.ZodError) {
                const errors: Record<string, string> = {}
                err.issues.forEach(e => {
                    if (e.path[0]) errors[e.path[0].toString()] = e.message
                })
                setFieldErrors(errors)
            }
            return false
        }
    }

    const nextStep = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, STEPS.length))
            setError(null)
        } else {
            setError(t.onsiteRegistrationForm.messages.mandatoryError)
        }
    }
    const prevStep = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1))
        setFieldErrors({})
        setError(null)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validateStep(5)) return
        
        setLoading(true)
        try {
            const result = await createVoluntaryCampDonation(formData)
            if (result.success) setSubmitted(true)
            else setError(result.message)
        } catch (error) {
            setError("An unexpected error occurred.")
        } finally {
            setLoading(false)
        }
    }

    if (submitted) {
        return (
            <main className="min-h-screen bg-gray-50 flex flex-col font-inter pt-20">
                <div className="flex-1 flex items-center justify-center p-8">
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[40px] p-12 text-center shadow-xl border border-gray-100 max-w-xl w-full">
                        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8">
                            <CheckCircle className="w-10 h-10 text-green-500" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">{t.onsiteRegistrationForm.messages.successTitle}</h2>
                        <p className="text-gray-500 mb-10 leading-relaxed">{t.onsiteRegistrationForm.messages.successDesc}</p>
                        <div className="flex flex-col gap-3">
                            <Link href="/" className="bg-[#8B0000] text-white px-8 py-4 rounded-2xl font-bold hover:bg-[#700000] transition-all shadow-lg shadow-rose-900/20 flex items-center justify-center gap-2">
                                <Home size={18} /> {t.onsiteRegistrationForm.messages.homeBtn}
                            </Link>
                            <button onClick={() => window.location.reload()} className="text-gray-400 font-bold hover:text-gray-600 transition-colors py-2">
                                {t.onsiteRegistrationForm.messages.anotherBtn}
                            </button>
                        </div>
                    </motion.div>
                </div>
            </main>
        )
    }

    return (
        <main className="min-h-screen bg-gray-50 pb-20 font-inter pt-20 lg:pt-28">
            <div className="max-w-4xl mx-auto px-4 py-10">
                <div className="mb-10 text-center">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">{t.onsiteRegistrationForm.messages.completeBtn}</h1>
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
                                    <p className={`text-[9px] font-black uppercase tracking-widest leading-none mb-0.5 ${isActive ? 'text-[#8B0000]' : 'text-gray-400'}`}>Step {step.id}</p>
                                    <p className={`text-xs font-bold leading-none ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>{step.title}</p>
                                </div>
                                {step.id < STEPS.length && <div className="hidden md:block w-4 h-[1px] bg-gray-100 ml-2" />}
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
                                        <FormInput label={t.onsiteRegistrationForm.fields.firstName} name="firstName" value={formData.firstName} onChange={handleInputChange} placeholder={t.onsiteRegistrationForm.placeholders.firstName} error={fieldErrors.firstName} />
                                        <FormInput label={t.onsiteRegistrationForm.fields.middleName} name="middleName" value={formData.middleName} onChange={handleInputChange} placeholder={t.onsiteRegistrationForm.placeholders.middleName} error={fieldErrors.middleName} />
                                        <FormInput label={t.onsiteRegistrationForm.fields.lastName} name="lastName" value={formData.lastName} onChange={handleInputChange} placeholder={t.onsiteRegistrationForm.placeholders.lastName} error={fieldErrors.lastName} />
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <FormRadioGroup label={t.onsiteRegistrationForm.fields.sex} name="sex" value={formData.sex} onChange={handleInputChange} options={[{value: 'M', label: language === 'mr' ? 'पुरुष' : 'Male'}, {value: 'F', label: language === 'mr' ? 'स्त्री' : 'Female'}]} error={fieldErrors.sex} />
                                        <FormInput label={t.onsiteRegistrationForm.fields.dob} name="dob" type="date" value={formData.dob} onChange={handleInputChange} error={fieldErrors.dob} />
                                        <FormInput label={t.onsiteRegistrationForm.fields.age} name="age" type="number" value={formData.age} onChange={handleInputChange} placeholder={t.onsiteRegistrationForm.placeholders.age} error={fieldErrors.age} />
                                        <FormSelect label={t.onsiteRegistrationForm.fields.bloodGroup} name="bloodGroup" value={formData.bloodGroup} onChange={handleInputChange} placeholder={t.onsiteRegistrationForm.placeholders.select} options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => ({value: bg, label: bg}))} error={fieldErrors.bloodGroup} />
                                    </div>

                                    <FormSelect 
                                        label={t.onsiteRegistrationForm.fields.camp} 
                                        name="siteId" 
                                        value={formData.siteId} 
                                        onChange={handleInputChange} 
                                        placeholder={loadingCamps ? "Loading..." : t.onsiteRegistrationForm.placeholders.select} 
                                        options={camps.map(c => ({value: c._id, label: `${c.name} (${new Date(c.dateFrom).toLocaleDateString()})`}))} 
                                        error={fieldErrors.siteId}
                                    />

                                    <FormSelect 
                                        label={t.onsiteRegistrationForm.fields.occupation} 
                                        name="occupation" 
                                        value={formData.occupation} 
                                        onChange={handleInputChange} 
                                        placeholder={t.onsiteRegistrationForm.placeholders.select} 
                                        options={[
                                            {value: "Student", label: language === 'mr' ? 'विद्यार्थी' : 'Student'},
                                            {value: "Service", label: language === 'mr' ? 'नोकरी' : 'Service'},
                                            {value: "Business", label: language === 'mr' ? 'व्यवसाय' : 'Business'},
                                            {value: "Self Employed", label: language === 'mr' ? 'स्वयंरोजगार' : 'Self Employed'},
                                            {value: "Housewife", label: language === 'mr' ? 'गृहिणी' : 'Housewife'},
                                            {value: "Other", label: language === 'mr' ? 'इतर' : 'Other'}
                                        ]} 
                                        error={fieldErrors.occupation}
                                    />
                                </motion.div>
                            )}

                            {currentStep === 2 && (
                                <motion.div key="step2" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-6">
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between items-center">
                                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{t.onsiteRegistrationForm.fields.address} *</label>
                                            {fieldErrors.address && <span className="text-[10px] font-bold text-rose-500 animate-pulse">{fieldErrors.address}</span>}
                                        </div>
                                        <textarea required name="address" value={formData.address} onChange={handleInputChange} className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-[#8B0000]/10 outline-none font-bold text-sm text-gray-900 min-h-[100px] ${fieldErrors.address ? 'border-rose-200' : 'border-gray-100'}`} placeholder={t.onsiteRegistrationForm.placeholders.address} />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <FormInput className="md:col-span-2" label={t.onsiteRegistrationForm.fields.mobile} name="mobile" type="tel" value={formData.mobile} onChange={handleInputChange} placeholder={t.onsiteRegistrationForm.placeholders.mobile} error={fieldErrors.mobile} />
                                        <FormInput label={t.onsiteRegistrationForm.fields.pincode} name="pincode" value={formData.pincode} onChange={handleInputChange} placeholder={t.onsiteRegistrationForm.placeholders.pincode} error={fieldErrors.pincode} />
                                    </div>
                                    <FormInput label={t.onsiteRegistrationForm.fields.email} name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder={t.onsiteRegistrationForm.placeholders.email} required={false} error={fieldErrors.email} />
                                </motion.div>
                            )}

                            {currentStep === 3 && (
                                <motion.div key="step3" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormRadioGroup label={t.onsiteRegistrationForm.fields.isFirstTime} name="isFirstTime" value={formData.isFirstTime} onChange={handleInputChange} options={[{value: 'yes', label: language === 'mr' ? 'हो' : 'YES'}, {value: 'no', label: language === 'mr' ? 'नाही' : 'NO'}]} error={fieldErrors.isFirstTime} />
                                        <FormRadioGroup label={t.onsiteRegistrationForm.fields.isRepeated} name="isRepeated" value={formData.isRepeated} onChange={handleInputChange} options={[{value: 'yes', label: language === 'mr' ? 'हो' : 'YES'}, {value: 'no', label: language === 'mr' ? 'नाही' : 'NO'}]} error={fieldErrors.isRepeated} />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormInput label={t.onsiteRegistrationForm.fields.lastDonation} name="lastDonationDate" type="date" value={formData.lastDonationDate} onChange={handleInputChange} required={false} error={fieldErrors.lastDonationDate} />
                                        <FormInput label={t.onsiteRegistrationForm.fields.totalDonations} name="totalDonations" type="number" value={formData.totalDonations} onChange={handleInputChange} placeholder="Count" required={false} error={fieldErrors.totalDonations} />
                                    </div>
                                    <div className="p-5 bg-rose-50 border border-rose-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <p className="text-xs font-bold text-[#8B0000] leading-tight">{t.onsiteRegistrationForm.fields.emergencyConsent}</p>
                                        <div className="flex gap-2 sm:w-48">
                                            {['yes', 'no'].map(o => (
                                                <button key={o} type="button" onClick={() => setFormData(p => ({ ...p, emergencyConsent: o }))} className={`flex-1 py-2 rounded-xl font-bold text-[10px] uppercase transition-all border-2 ${formData.emergencyConsent === o ? 'bg-[#8B0000] border-[#8B0000] text-white' : 'bg-white border-rose-200 text-rose-300'}`}>
                                                    {o === 'yes' ? (language === 'mr' ? 'हो' : 'YES') : (language === 'mr' ? 'नाही' : 'NO')}
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
                                        <FormVitalsInput label={t.onsiteRegistrationForm.fields.weight} name="weight" value={formData.weight} onChange={handleInputChange} placeholder={t.onsiteRegistrationForm.placeholders.weight} unit="kg" error={fieldErrors.weight} />
                                        <FormVitalsInput label={t.onsiteRegistrationForm.fields.hb} name="hb" value={formData.hb} onChange={handleInputChange} placeholder={t.onsiteRegistrationForm.placeholders.hb} unit="gm%" step="0.1" error={fieldErrors.hb} />
                                        <FormVitalsInput label={t.onsiteRegistrationForm.fields.temp} name="temp" value={formData.temp} onChange={handleInputChange} placeholder={t.onsiteRegistrationForm.placeholders.temp} unit="°C" step="0.1" error={fieldErrors.temp} />
                                        <FormVitalsInput label={t.onsiteRegistrationForm.fields.pulse} name="pulse" value={formData.pulse} onChange={handleInputChange} placeholder={t.onsiteRegistrationForm.placeholders.pulse} unit="/min" error={fieldErrors.pulse} />
                                        <FormVitalsInput label={t.onsiteRegistrationForm.fields.bp} name="bp" value={formData.bp} onChange={handleInputChange} placeholder={t.onsiteRegistrationForm.placeholders.bp} unit="mmHg" error={fieldErrors.bp} />
                                        <FormVitalsInput label={t.onsiteRegistrationForm.fields.o2Level} name="o2Level" value={formData.o2Level} onChange={handleInputChange} placeholder={t.onsiteRegistrationForm.placeholders.o2Level} unit="%" error={fieldErrors.o2Level} />
                                    </div>
                                </motion.div>
                            )}

                            {currentStep === 5 && (
                                <motion.div key="step5" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <FormRadioGroup label={t.onsiteRegistrationForm.fields.pedalOedema} name="pedalOedema" value={formData.pedalOedema} onChange={handleInputChange} options={[{value: 'yes', label: 'YES'}, {value: 'no', label: 'NO'}]} error={fieldErrors.pedalOedema} />
                                        <FormRadioGroup label={t.onsiteRegistrationForm.fields.lymphadenopathy} name="lymphadenopathy" value={formData.lymphadenopathy} onChange={handleInputChange} options={[{value: 'yes', label: 'YES'}, {value: 'no', label: 'NO'}]} error={fieldErrors.lymphadenopathy} />
                                        <FormRadioGroup label={t.onsiteRegistrationForm.fields.cyanosis} name="cyanosis" value={formData.cyanosis} onChange={handleInputChange} options={[{value: 'yes', label: 'YES'}, {value: 'no', label: 'NO'}]} error={fieldErrors.cyanosis} />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Systematic Exam (Click to toggle)</label>
                                        <div className="grid grid-cols-5 gap-2">
                                            {['cvs', 'rs', 'pa', 'cns', 'gis'].map(sys => (
                                                <button key={sys} type="button" onClick={() => setFormData(p => ({ ...p, [sys]: p[sys as keyof typeof p] === 'normal' ? 'abnormal' : 'normal' }))} className={`py-3 rounded-xl border transition-all text-center ${formData[sys as keyof typeof formData] === 'normal' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
                                                    <p className="text-[9px] font-black uppercase mb-0.5">{sys}</p>
                                                    <p className="text-[8px] font-bold opacity-70">{formData[sys as keyof typeof formData] === 'normal' ? (language === 'mr' ? 'सामान्य' : 'Normal') : (language === 'mr' ? 'असामान्य' : 'Abnormal')}</p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                                        <FormRadioGroup label={t.onsiteRegistrationForm.fields.skinDisease} name="freeFromSkinDisease" value={formData.freeFromSkinDisease} onChange={handleInputChange} options={[{value: 'yes', label: 'YES'}, {value: 'no', label: 'NO'}]} error={fieldErrors.freeFromSkinDisease} />
                                        <FormRadioGroup label={t.onsiteRegistrationForm.fields.scars} name="freeFromScars" value={formData.freeFromScars} onChange={handleInputChange} options={[{value: 'yes', label: 'YES'}, {value: 'no', label: 'NO'}]} error={fieldErrors.freeFromScars} />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="p-6 bg-gray-50/30 border-t border-gray-100">
                        <AnimatePresence>
                            {(error || Object.keys(fieldErrors).length > 0) && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-4 p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2 text-rose-600 text-xs font-bold">
                                    <AlertCircle size={14} /> {error || "Please correct the errors in the form."}
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <div className="flex justify-between items-center">
                            <button type="button" onClick={prevStep} disabled={currentStep === 1} className={`flex items-center gap-2 font-bold text-xs transition-all ${currentStep === 1 ? 'text-gray-300 pointer-events-none' : 'text-gray-500 hover:text-gray-900'}`}>
                                <ArrowLeft size={16} /> {t.onsiteRegistrationForm.messages.backBtn}
                            </button>
                            {currentStep < STEPS.length ? (
                                <button type="button" onClick={nextStep} className="bg-[#8B0000] text-white px-8 py-3 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-[#700000] transition-all shadow-md shadow-rose-900/20">
                                    {t.onsiteRegistrationForm.messages.nextBtn} <ArrowRight size={16} />
                                </button>
                            ) : (
                                <button type="submit" disabled={loading} className="bg-[#8B0000] text-white px-10 py-3 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-[#700000] transition-all shadow-md shadow-rose-900/20 disabled:opacity-70">
                                    {loading ? t.onsiteRegistrationForm.messages.processing : t.onsiteRegistrationForm.messages.completeBtn}
                                </button>
                            )}
                        </div>
                    </div>
                </form>
            </div>
        </main>
    )
}
