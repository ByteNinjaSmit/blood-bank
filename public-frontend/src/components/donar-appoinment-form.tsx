"use client"
import { useState } from "react"
import type { ChangeEvent, FormEvent } from "react"
import axios from "axios"
import { User, Phone, Mail, Droplets, Calendar, MapPin, Heart, CheckCircle, Clock, MapPinIcon, AlertCircle, Check, Clock1, Clock10Icon, ClockAlertIcon, ClockPlusIcon } from 'lucide-react'

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
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000"

      await axios.post(
        `${apiBaseUrl}/api/appointments/public-booking`,
        {
          fullName: finalData.fullName,
          gender: finalData.gender,
          mobileNo: finalData.mobileNo,
          email: finalData.email,
          bloodGroup: finalData.bloodGroup,
          birthDate: finalData.birthDate,
          address: finalData.address,
          appointmentDate: finalData.appointmentDate,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      )

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
        <div className="text-center max-w-md">
          <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-primary rounded-full flex items-center justify-center shadow-2xl animate-pulse">
              <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-primary-foreground" />
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
            Thank You for Your Donation!
          </h2>
          <p className="text-muted-foreground mb-2 leading-relaxed">
            Your appointment has been scheduled successfully. We look forward to seeing you on the scheduled date.
          </p>
          <p className="text-sm text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    )
  }

  return (
    <div id="donation-form" className="min-h-screen bg-background py-8 sm:py-12 pr-4 sm:pr-6 lg:pr-8">
      <div className=" mx-auto">
        {/* Header Section */}
        <div className="text-center mb-10 sm:mb-14 flex justify-center items-center">
          <div className="pl-5 border-l-8 ml-2 md:ml-0 border-dotted border-primary w-fit space-y-2">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Blood Donation
            </h1>

            <p className="text-muted-foreground max-w-lg leading-relaxed">
              Save lives by scheduling your blood donation appointment today.
              Your contribution makes a meaningful difference.
            </p>
          </div>
        </div>

        {/* Main Container with Sidebar and Form */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-10">
          <div className="lg:col-span-2 sticky top-20 self-start hidden lg:block">
            <div className="relative h-full min-h-96">
              {/* Skewed Container with inclined bottom */}
              <div className="bg-primary rounded-r-3xl pl-16 py-8 pr-8 relative overflow-hidden shadow-2xl">

                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full blur-3xl"></div>
                </div>

                {/* Content */}
                <div className="relative z-10 border-l-4 border-dotted border-white/50 pl-8">
                  <h2 className="text-2xl sm:text-3xl font-bold text-primary-foreground mb-8">
                    Appointment Details
                  </h2>

                  {/* Info Cards */}
                  <div className="space-y-5">
                    {/* When */}
                    <div className="bg-white/15 backdrop-blur-md rounded-xl p-4 border border-white/20">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center shrink-0 mt-1">
                          <Clock className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-white/70 uppercase tracking-wide">When</p>
                          <p className="text-sm sm:text-base font-semibold text-white mt-1">
                            {formData.appointmentDate ? new Date(formData.appointmentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Select a date'}
                          </p>
                          <p className="text-xs text-white/60 mt-1">9:00 AM - 5:00 PM</p>
                        </div>
                      </div>
                    </div>

                    {/* Where */}
                    <div className="bg-white/15 backdrop-blur-md rounded-xl p-4 border border-white/20">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center shrink-0 mt-1">
                          <MapPinIcon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-white/70 uppercase tracking-wide">Where</p>
                          <p className="text-sm sm:text-base font-semibold text-white mt-1">Central Blood Bank</p>
                          <p className="text-xs text-white/60 mt-1">123 Medical Center, City</p>
                        </div>
                      </div>
                    </div>

                    {/* Blood Type */}
                    <div className="bg-white/15 backdrop-blur-md rounded-xl p-4 border border-white/20">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center shrink-0 mt-1">
                          <Droplets className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-white/70 uppercase tracking-wide">Blood Type</p>
                          <p className="text-sm sm:text-base font-semibold text-white mt-1">
                            {formData.bloodGroup === "other" ? formData.otherBloodGroup || 'Not selected' : formData.bloodGroup || 'Not selected'}
                          </p>
                          <p className="text-xs text-white/60 mt-1">Verified & Screened</p>
                        </div>
                      </div>
                    </div>

                    {/* Important Notice */}
                    <div className="bg-yellow-50/20 border border-yellow-200/30 rounded-xl p-4 mt-6">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-yellow-200 shrink-0 mt-0.5" />
                        <p className="text-xs text-yellow-50">
                          Please arrive 10 minutes early. Bring a valid ID and hydrate well before your appointment.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Section */}
          <div className="lg:col-span-3">
            <div className="bg-transparent rounded-2xl p-6 sm:p-8 lg:p-10">
              <form onSubmit={handleSubmit} className="space-y-7 sm:space-y-8">
                {/* Row 1: Full Name & Gender */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2.5">
                    <label htmlFor="fullName" className="text-sm font-semibold text-foreground block">
                      Full Name <span className="text-primary">*</span>
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-muted-foreground" />
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

                  <div className="space-y-2.5">
                    <label htmlFor="gender" className="text-sm font-semibold text-foreground block">
                      Gender <span className="text-primary">*</span>
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-muted-foreground" />
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
                    </div>
                  </div>
                </div>

                {/* Row 2: Mobile & Email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2.5">
                    <label htmlFor="mobileNo" className="text-sm font-semibold text-foreground block">
                      Mobile Number <span className="text-primary">*</span>
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                        <Phone className="h-5 w-5 text-muted-foreground" />
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
                      />
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <label htmlFor="email" className="text-sm font-semibold text-foreground block">
                      Email <span className="text-xs text-muted-foreground">(Optional)</span>
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-muted-foreground" />
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
                  <div className="space-y-2.5">
                    <label htmlFor="birthDate" className="text-sm font-semibold text-foreground block">
                      Date of Birth <span className="text-primary">*</span>
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
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

                  <div className="space-y-2.5">
                    <label htmlFor="appointmentDate" className="text-sm font-semibold text-foreground block">
                      Appointment Date <span className="text-primary">*</span>
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
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
                <div className="space-y-4">
                  <label className="text-sm font-semibold text-foreground block">
                    Blood Group <span className="text-primary">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                        <div className={`p-3 border-2 rounded-lg text-center font-semibold text-sm sm:text-base transition-all ${formData.bloodGroup === group
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-background text-foreground hover:border-primary/50'
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
                      <div className={`p-3 border-2 rounded-lg text-center font-semibold text-sm sm:text-base transition-all ${formData.bloodGroup === "other"
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-background text-foreground hover:border-primary/50'
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
                        placeholder="Please specify your blood group"
                        className="block w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                        required
                      />
                    </div>
                  )}
                </div>

                {/* Address */}
                <div className="space-y-2.5">
                  <label htmlFor="address" className="text-sm font-semibold text-foreground block">
                    Address <span className="text-primary">*</span>
                  </label>
                  <div className="relative group">
                    <div className="absolute top-3 left-0 pl-3 sm:pl-4 flex items-start pointer-events-none">
                      <MapPin className="h-5 w-5 text-muted-foreground mt-1" />
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
                  className="w-full flex items-center justify-center px-6 py-4 rounded-lg text-base font-semibold text-primary-foreground bg-primary hover:bg-accent transition-all duration-200 mt-8 shadow-md hover:shadow-lg active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <ClockPlusIcon className="mr-2 h-5 w-5" />
                  {loading ? "Scheduling..." : "Schedule Donation"}
                </button>
                {error && (
                  <p className="mt-4 text-sm text-red-500 text-center">
                    {error}
                  </p>
                )}
              </form>

              {/* Important Information Badge */}
              <div className="mt-8 bg-secondary rounded-lg p-4 border border-border">
                <p className="text-xs sm:text-sm text-foreground">
                  <span className="font-semibold">Important:</span> Ensure you meet all eligibility criteria before scheduling. Our team will contact you for confirmation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
