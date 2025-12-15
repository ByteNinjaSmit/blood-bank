"use client"
import { useState } from "react"
import type { ChangeEvent, FormEvent } from "react"
import { bookAppointment } from "@/actions/appointment"
import { User, Phone, Mail, Droplets, Calendar, MapPin, Heart, CheckCircle, Clock, MapPinIcon, AlertCircle, ClockPlusIcon, HeartHandshake } from 'lucide-react'

export default function BloodDonationForm() {
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
  })

  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleBloodGroupChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setFormData((prev) => ({
      ...prev,
      bloodGroup: value,
      otherBloodGroup: value !== "other" ? "" : prev.otherBloodGroup
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
          fullName: "",
          gender: "",
          mobileNo: "",
          email: "",
          bloodGroup: "",
          otherBloodGroup: "",
          birthDate: "",
          address: "",
          appointmentDate: "",
        })

        setTimeout(() => {
          setSubmitted(false)
        }, 3000)
      } else {
        throw new Error(result.message)
      }
    } catch (err) {
      console.error("Appointment booking failed:", err)
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again."
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const bloodGroups = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]
  const genderOptions = ["Male", "Female", "Other"]

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-8">
        <div className="text-center max-w-md bg-card p-8 rounded-2xl shadow-2xl border border-primary/20">
          <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-primary rounded-full flex items-center justify-center shadow-2xl animate-in fade-in zoom-in duration-500">
              <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-primary-foreground fill-current" />
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground mb-3">
            Appointment Confirmed! 🎉
          </h2>
          <p className="text-muted-foreground mb-4 leading-relaxed">
            Thank you for your life-saving decision. We look forward to seeing you at the blood bank.
          </p>
          <div className='inline-flex items-center gap-2 text-primary font-semibold text-sm'>
            <Clock className='w-4 h-4' />
            <p>Redirecting in 3 seconds...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div id="donation-form" className="min-h-screen bg-background py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-block relative w-fit space-y-3">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
              Schedule Your <span className='text-primary'>Donation</span>
            </h1>

            <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed text-lg sm:text-xl">
              Your contribution makes a meaningful difference. Fill out the form below to book your appointment.
            </p>
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-primary/30 rounded-full"></div>
          </div>
        </div>

        {/* Main Container with Sidebar and Form */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-16">

          {/* Sidebar / Appointment Details - Visual Refinement */}
          <div className="lg:col-span-2 sticky top-20 self-start hidden lg:block">
            <div className="bg-primary/5 rounded-3xl p-10 relative overflow-hidden shadow-xl border border-primary/10">

              {/* Background Accent */}
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/10 rounded-full blur-[80px]"></div>

              <div className="relative z-10 space-y-8">
                <h2 className="text-3xl font-extrabold text-foreground flex items-center gap-2">
                  <HeartHandshake className='w-7 h-7 text-primary fill-transparent' />
                  Your Appointment
                </h2>

                {/* Info Cards */}
                <div className="space-y-4">

                  {/* When */}
                  <div className="bg-card rounded-xl p-4 border border-border/50 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                        <Clock className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">When</p>
                        <p className="text-sm sm:text-base font-bold text-foreground mt-1">
                          {formData.appointmentDate ? new Date(formData.appointmentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Select a date'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Available 9:00 AM - 5:00 PM</p>
                      </div>
                    </div>
                  </div>

                  {/* Where */}
                  <div className="bg-card rounded-xl p-4 border border-border/50 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                        <MapPinIcon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Where</p>
                        <p className="text-sm sm:text-base font-bold text-foreground mt-1">Sanjivani Central Blood Bank</p>
                        <p className="text-xs text-muted-foreground mt-1">123 Vivekanand Nagar, Kopargaon</p>
                      </div>
                    </div>
                  </div>

                  {/* Blood Type */}
                  <div className="bg-card rounded-xl p-4 border border-border/50 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                        <Droplets className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Your Blood Type</p>
                        <p className="text-sm sm:text-base font-bold text-foreground mt-1">
                          {formData.bloodGroup === "other" ? formData.otherBloodGroup || 'Not selected' : formData.bloodGroup || 'Not selected'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Needed for proper screening</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Important Notice - Stronger Visual */}
                <div className="bg-primary/10 border border-primary/30 rounded-xl p-5 mt-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-primary text-sm mb-1">Important Reminder</p>
                      <p className="text-xs text-foreground/80">
                        Please arrive **10 minutes early**. Bring a **valid ID** and hydrate well before your appointment.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Section - Clean, Card-like structure */}
          <div className="lg:col-span-3">
            <div className="bg-card rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl border border-border/50">
              <form onSubmit={handleSubmit} className="space-y-7 sm:space-y-8">

                {/* Row 1: Full Name & Gender */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="fullName" className="text-sm font-semibold text-foreground block">
                      Full Name <span className="text-primary">*</span>
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-muted-foreground group-focus-within:text-primary" />
                      </div>
                      <input
                        id="fullName"
                        name="fullName"
                        type="text"
                        required
                        value={formData.fullName}
                        onChange={handleChange}
                        className="block w-full pl-11 sm:pl-12 pr-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground text-sm sm:text-base focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                        placeholder="Enter your full name"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="gender" className="text-sm font-semibold text-foreground block">
                      Gender <span className="text-primary">*</span>
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-muted-foreground group-focus-within:text-primary" />
                      </div>
                      <select
                        id="gender"
                        name="gender"
                        required
                        value={formData.gender}
                        onChange={handleChange}
                        className="block w-full pl-11 sm:pl-12 pr-4 py-3 border border-border rounded-lg bg-background text-foreground text-sm sm:text-base appearance-none focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all cursor-pointer"
                      >
                        <option value="" disabled hidden>
                          Select gender
                        </option>
                        {genderOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <svg className="h-4 w-4 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Row 2: Mobile & Email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="mobileNo" className="text-sm font-semibold text-foreground block">
                      Mobile Number <span className="text-primary">*</span>
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                        <Phone className="h-5 w-5 text-muted-foreground group-focus-within:text-primary" />
                      </div>
                      <input
                        id="mobileNo"
                        name="mobileNo"
                        type="tel"
                        required
                        pattern="[0-9]{10}"
                        value={formData.mobileNo}
                        onChange={handleChange}
                        className="block w-full pl-11 sm:pl-12 pr-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground text-sm sm:text-base focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                        placeholder="10-digit mobile number"
                        title="10 digit mobile number"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-semibold text-foreground block">
                      Email <span className="text-xs text-muted-foreground">(Optional)</span>
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-muted-foreground group-focus-within:text-primary" />
                      </div>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="block w-full pl-11 sm:pl-12 pr-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground text-sm sm:text-base focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                        placeholder="your.email@example.com"
                      />
                    </div>
                  </div>
                </div>

                {/* Row 3: Date of Birth & Appointment Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="birthDate" className="text-sm font-semibold text-foreground block">
                      Date of Birth <span className="text-primary">*</span>
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                        <Calendar className="h-5 w-5 text-muted-foreground group-focus-within:text-primary" />
                      </div>
                      <input
                        id="birthDate"
                        name="birthDate"
                        type="date"
                        required
                        value={formData.birthDate}
                        onChange={handleChange}
                        className="block w-full pl-11 sm:pl-12 pr-4 py-3 border border-border rounded-lg bg-background text-foreground text-sm sm:text-base focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="appointmentDate" className="text-sm font-semibold text-foreground block">
                      Appointment Date <span className="text-primary">*</span>
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                        <Calendar className="h-5 w-5 text-muted-foreground group-focus-within:text-primary" />
                      </div>
                      <input
                        id="appointmentDate"
                        name="appointmentDate"
                        type="date"
                        required
                        value={formData.appointmentDate}
                        onChange={handleChange}
                        className="block w-full pl-11 sm:pl-12 pr-4 py-3 border border-border rounded-lg bg-background text-foreground text-sm sm:text-base focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Blood Group Selection */}
                <div className="space-y-4 pt-2">
                  <label className="text-sm font-semibold text-foreground block">
                    Blood Group <span className="text-primary">*</span>
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-3"> {/* Adjusted grid for better layout */}
                    {bloodGroups.map((group) => (
                      <label key={group} className="relative cursor-pointer">
                        <input
                          type="radio"
                          name="bloodGroup"
                          value={group}
                          checked={formData.bloodGroup === group}
                          onChange={handleBloodGroupChange}
                          className="sr-only"
                          required
                        />
                        <div className={`p-3 border-2 rounded-lg text-center font-bold text-sm sm:text-base transition-all ${formData.bloodGroup === group
                          ? 'border-primary bg-primary text-white shadow-md' // Stronger selected style
                          : 'border-border bg-card text-foreground hover:border-primary/50'
                          }`}>
                          {group}
                        </div>
                      </label>
                    ))}

                    <label className="relative cursor-pointer">
                      <input
                        type="radio"
                        name="bloodGroup"
                        value="other"
                        checked={formData.bloodGroup === "other"}
                        onChange={handleBloodGroupChange}
                        className="sr-only"
                      />
                      <div className={`p-3 border-2 rounded-lg text-center font-bold text-sm sm:text-base transition-all ${formData.bloodGroup === "other"
                        ? 'border-primary bg-primary text-white shadow-md'
                        : 'border-border bg-card text-foreground hover:border-primary/50'
                        }`}>
                        Other
                      </div>
                    </label>
                  </div>

                  {formData.bloodGroup === "other" && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                      <input
                        type="text"
                        name="otherBloodGroup"
                        value={formData.otherBloodGroup}
                        onChange={handleChange}
                        placeholder="Please specify your rare blood group (e.g., Bombay type)"
                        className="block w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                        required
                      />
                    </div>
                  )}
                </div>

                {/* Address */}
                <div className="space-y-2">
                  <label htmlFor="address" className="text-sm font-semibold text-foreground block">
                    Address <span className="text-primary">*</span>
                  </label>
                  <div className="relative group">
                    <div className="absolute top-3 left-0 pl-3 sm:pl-4 flex items-start pointer-events-none">
                      <MapPin className="h-5 w-5 text-muted-foreground group-focus-within:text-primary" />
                    </div>
                    <textarea
                      id="address"
                      name="address"
                      required
                      value={formData.address}
                      onChange={handleChange}
                      rows={3}
                      className="block w-full pl-11 sm:pl-12 pr-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground text-sm sm:text-base focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all resize-none"
                      placeholder="Enter your full address"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center px-6 py-4 rounded-xl text-lg font-bold text-primary-foreground bg-primary hover:bg-accent transition-all duration-300 mt-8 shadow-xl hover:shadow-2xl active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <ClockPlusIcon className="mr-3 h-5 w-5" />
                  {loading ? "Scheduling Appointment..." : "Confirm & Schedule Donation"}
                </button>

                {error && (
                  <p className="mt-4 text-sm text-red-500 text-center flex items-center justify-center gap-2">
                    <AlertCircle className='w-4 h-4' />
                    {error}
                  </p>
                )}
              </form>

              {/* Important Information Badge */}
              <div className="mt-10 bg-muted rounded-xl p-4 border border-border shadow-inner">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  <span className="font-bold text-foreground">Note:</span> Your eligibility will be confirmed on arrival. Please ensure you meet all criteria (age, weight, recent donation history) before scheduling.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}