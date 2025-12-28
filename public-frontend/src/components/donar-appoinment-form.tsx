"use client"
import { useState } from "react"
import type { ChangeEvent, FormEvent } from "react"
import { bookAppointment } from "@/actions/appointment"
import { User, Phone, Calendar, MapPin, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { useLanguage } from '@/context/language-context'
import { content } from '@/lib/content'

export default function BloodDonationForm() {
  const { language } = useLanguage();
  const t = content[language].form;

  const [formData, setFormData] = useState({
    fullName: "",
    gender: "",
    mobileNo: "",
    email: "",
    bloodGroup: "",
    otherBloodGroup: "",
    birthDate: "",
    address: "",
    appointmentDate: "",
    recentIllness: "no",
    surgery: "no",
    medication: "no",
    lastDonation: ""
  })

  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleBloodGroupChange = (group: string) => {
    setFormData((prev) => ({
      ...prev,
      bloodGroup: group,
      otherBloodGroup: group !== "other" ? "" : prev.otherBloodGroup
    }))
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const finalData = {
      ...formData,
      bloodGroup: formData.bloodGroup === "other" ? formData.otherBloodGroup : formData.bloodGroup,
    }

    try {
      const result = await bookAppointment(finalData)
      if (result.success) {
        setSubmitted(true)
        setFormData({
          fullName: "", gender: "", mobileNo: "", email: "", bloodGroup: "", otherBloodGroup: "", birthDate: "", address: "", appointmentDate: "", recentIllness: "no", surgery: "no", medication: "no", lastDonation: ""
        })
        setTimeout(() => setSubmitted(false), 5000)
      } else {
        throw new Error(result.message)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  const bloodGroups = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]
  const genderOptions = ["Male", "Female", "Other"]

  if (submitted) {
    return (
      <div className="bg-white dark:bg-card p-10 rounded-3xl shadow-xl flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-300 border border-success/20">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4 text-green-600">
          <CheckCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Registration Successful!</h2>
        <p className="text-muted-foreground">{language === 'en' ? 'We will contact you shortly.' : 'आम्ही लवकरच आपल्याशी संपर्क साधू.'}</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-card rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-border/50 p-6 sm:p-8">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Book Appointment</h2>
        <div className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 bg-green-100 text-green-700 rounded-full">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          Slots Open
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Personal Details */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">1</span>
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{t.personalDetails}</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative">
              <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground/50" />
              <input name="fullName" required value={formData.fullName} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-muted/30 border-0 rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all outline-none font-medium placeholder:text-muted-foreground/60" placeholder={t.fullNamePlaceholder} />
            </div>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-5 w-5 text-muted-foreground/50" />
              <input name="mobileNo" type="tel" required pattern="[0-9]{10}" value={formData.mobileNo} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-muted/30 border-0 rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all outline-none font-medium placeholder:text-muted-foreground/60" placeholder={t.mobilePlaceholder} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-5 w-5 text-muted-foreground/50" />
              <input name="birthDate" type="text" onFocus={(e) => e.target.type = 'date'} onBlur={(e) => e.target.type = 'text'} required value={formData.birthDate} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-muted/30 border-0 rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all outline-none font-medium placeholder:text-muted-foreground/60" placeholder={t.birthDate} />
            </div>
            <select name="gender" required value={formData.gender} onChange={handleChange} className="w-full px-4 py-3 bg-muted/30 border-0 rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all outline-none font-medium text-muted-foreground">
              <option value="">{t.selectGender}</option>
              {genderOptions.map((o, i) => <option key={o} value={o}>{t.genderOptions?.[i] || o}</option>)}
            </select>
          </div>
        </div>

        {/* Blood Group */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 mb-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">2</span>
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{t.bloodGroup}</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {bloodGroups.map((group) => (
              <button
                key={group}
                type="button"
                onClick={() => handleBloodGroupChange(group)}
                className={`
                            px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 border
                            ${formData.bloodGroup === group
                    ? 'bg-primary text-white border-primary shadow-lg shadow-primary/25 scale-105'
                    : 'bg-background hover:bg-muted text-foreground border-border/60'}
                        `}
              >
                {group}
              </button>
            ))}
          </div>
        </div>

        {/* Medical & Address */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-2 mb-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">3</span>
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{t.medicalHistory}</h3>
          </div>
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-xl flex gap-3 text-sm text-yellow-800 dark:text-yellow-200 border border-yellow-100 dark:border-yellow-900/20">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>Have you had any recent illness, surgery, or medication in the last 3 months?</p>
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer bg-muted/30 px-4 py-2 rounded-lg hover:bg-muted/50 transition-colors">
              <input type="radio" name="recentIllness" value="no" checked={formData.recentIllness === 'no'} onChange={handleChange} className="accent-primary w-4 h-4" />
              <span className="font-medium text-sm">No, I'm healthy</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer bg-muted/30 px-4 py-2 rounded-lg hover:bg-muted/50 transition-colors">
              <input type="radio" name="recentIllness" value="yes" checked={formData.recentIllness === 'yes'} onChange={handleChange} className="accent-primary w-4 h-4" />
              <span className="font-medium text-sm">Yes</span>
            </label>
          </div>

          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-5 w-5 text-muted-foreground/50" />
            <input name="address" required value={formData.address} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-muted/30 border-0 rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all outline-none font-medium placeholder:text-muted-foreground/60" placeholder={t.addressPlaceholder} />
          </div>

          <div className="relative">
            <Calendar className="absolute left-3 top-3 h-5 w-5 text-muted-foreground/50" />
            <input name="appointmentDate" type="text" onFocus={(e) => e.target.type = 'date'} onBlur={(e) => e.target.type = 'text'} required value={formData.appointmentDate} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-muted/30 border-0 rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all outline-none font-medium placeholder:text-muted-foreground/60" placeholder={t.preferredDate} />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-primary hover:bg-primary/90 text-white font-bold text-lg rounded-xl shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin" /> : t.submitBtn}
        </button>

        {error && <div className="p-3 rounded-lg bg-red-100 text-red-600 text-sm text-center font-medium">{error}</div>}

      </form>
    </div>
  )
}