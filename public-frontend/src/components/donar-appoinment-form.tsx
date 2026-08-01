"use client"
import { useState } from "react"
import type { ChangeEvent, FormEvent } from "react"
import { bookAppointment } from "@/actions/appointment"
import { User, Phone, Calendar, MapPin, CheckCircle, AlertCircle, Loader2, Bell } from 'lucide-react'
import { useLanguage } from '@/context/language-context'
import { content } from '@/lib/content'

function calculateAge(dobStr: string): string {
  if (!dobStr) return ''
  const dob = new Date(dobStr)
  if (isNaN(dob.getTime())) return ''
  const today = new Date()
  let age = today.getFullYear() - dob.getFullYear()
  const monthDiff = today.getMonth() - dob.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age--
  return age >= 0 ? String(age) : ''
}

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
    age: "",
    address: "",
    appointmentDate: "",
    hasMedicalHistory: "no",
    recentIllness: "no",
    surgery: "no",
    medication: "no",
    lastDonation: "",
    donationFrequency: "1",
    wantReminder: false,
    reminderDays: 1
  })

  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
      return;
    }

    setFormData(prev => {
      const newData = { ...prev, [name]: value };

      if (name === 'gender' && value === 'Female') {
        if (newData.donationFrequency === '3' || newData.donationFrequency === '4') {
          newData.donationFrequency = '2';
        }
      }

      if (name === 'birthDate') {
        newData.age = calculateAge(value);
      }

      // "No, I'm healthy" is a shortcut for "no" on all three follow-up
      // questions — nothing left unanswered when they aren't shown.
      if (name === 'hasMedicalHistory' && value === 'no') {
        newData.recentIllness = 'no';
        newData.surgery = 'no';
        newData.medication = 'no';
      }

      return newData;
    });
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

    const { hasMedicalHistory: _hasMedicalHistory, ...rest } = formData
    const finalData = {
      ...rest,
      bloodGroup: formData.bloodGroup === "other" ? formData.otherBloodGroup : formData.bloodGroup,
      age: formData.age ? parseInt(formData.age) : undefined,
    }

    try {
      const result = await bookAppointment(finalData)
      if (result.success) {
        setSubmitted(true)
        setFormData({
          fullName: "", gender: "", mobileNo: "", email: "", bloodGroup: "", otherBloodGroup: "", birthDate: "", age: "", address: "", appointmentDate: "", hasMedicalHistory: "no", recentIllness: "no", surgery: "no", medication: "no", lastDonation: "", donationFrequency: "1", wantReminder: false, reminderDays: 1
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

  const bloodGroups = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-", "Not Known"]
  const genderOptions = ["Male", "Female", "Other"]

  const getPredictedReminderDate = () => {
    if (!formData.appointmentDate || !formData.reminderDays) return null;
    const aptDate = new Date(formData.appointmentDate);
    if (isNaN(aptDate.getTime())) return null;
    aptDate.setDate(aptDate.getDate() - parseInt(formData.reminderDays.toString()));
    return aptDate.toLocaleDateString();
  }

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
        <h2 className="text-2xl font-bold text-foreground">{t.formTitle}</h2>
        <div className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 bg-green-100 text-green-700 rounded-full">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          {t.walkInBadge}
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
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">{t.fullName}</label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground/50" />
                <input name="fullName" value={formData.fullName} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-muted/30 border-0 rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all outline-none font-medium placeholder:text-muted-foreground/60" placeholder={t.fullNamePlaceholder} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">{t.mobileNo}</label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-5 w-5 text-muted-foreground/50" />
                <input name="mobileNo" type="tel" required pattern="[0-9]{10}" value={formData.mobileNo} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-muted/30 border-0 rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all outline-none font-medium placeholder:text-muted-foreground/60" placeholder={t.mobilePlaceholder} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <label className="block text-sm font-semibold text-foreground mb-1.5">{t.birthDate}</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-5 w-5 text-muted-foreground/50 pointer-events-none" />
                  <input
                    name="birthDate"
                    type="date"
                    max={new Date().toISOString().split('T')[0]}
                    value={formData.birthDate}
                    onChange={handleChange}
                    className="w-full pl-10 pr-2 py-3 bg-muted/30 border-0 rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all outline-none font-medium placeholder:text-muted-foreground/60"
                  />
                </div>
              </div>
              <div className="w-24">
                <label className="block text-sm font-semibold text-foreground mb-1.5">{t.age}</label>
                <div className={`w-full px-4 py-3 bg-muted/30 rounded-xl font-medium text-center ${formData.age ? 'text-foreground' : 'text-muted-foreground/50'}`} title={t.age}>
                  {formData.age || '—'}
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">{t.gender}</label>
              <select name="gender" value={formData.gender} onChange={handleChange} className="w-full px-4 py-3 bg-muted/30 border-0 rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all outline-none font-medium text-muted-foreground">
                <option value="">{t.selectGender}</option>
                {genderOptions.map((o, i) => <option key={o} value={o}>{t.genderOptions?.[i] || o}</option>)}
              </select>
            </div>
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
            <p>{t.medicalWarning}</p>
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer bg-muted/30 px-4 py-2 rounded-lg hover:bg-muted/50 transition-colors">
              <input type="radio" name="hasMedicalHistory" value="no" checked={formData.hasMedicalHistory === 'no'} onChange={handleChange} className="accent-primary w-4 h-4" />
              <span className="font-medium text-sm">No, I'm healthy</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer bg-muted/30 px-4 py-2 rounded-lg hover:bg-muted/50 transition-colors">
              <input type="radio" name="hasMedicalHistory" value="yes" checked={formData.hasMedicalHistory === 'yes'} onChange={handleChange} className="accent-primary w-4 h-4" />
              <span className="font-medium text-sm">Yes</span>
            </label>
          </div>

          {formData.hasMedicalHistory === 'yes' && (
            <div className="space-y-3 p-4 bg-muted/20 rounded-xl border border-border/50 animate-in slide-in-from-top-2 duration-200">
              {([
                ['recentIllness', t.recentIllness],
                ['surgery', t.surgery],
                ['medication', t.medication],
              ] as const).map(([field, label]) => (
                <div key={field} className="flex items-center justify-between gap-4">
                  <span className="text-sm font-medium text-foreground">{label}</span>
                  <div className="flex gap-2">
                    {(['no', 'yes'] as const).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, [field]: opt }))}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase transition-all border ${formData[field] === opt
                            ? 'bg-primary text-white border-primary'
                            : 'bg-background text-muted-foreground border-border/60 hover:bg-muted'
                          }`}
                      >
                        {opt === 'yes' ? t.yes : t.no}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">{t.address}</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-5 w-5 text-muted-foreground/50" />
              <input name="address" value={formData.address} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-muted/30 border-0 rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all outline-none font-medium placeholder:text-muted-foreground/60" placeholder={t.addressPlaceholder} />
            </div>
          </div>
        </div>

        {/* Donation Preferences */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-2 mb-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">4</span>
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{t.donationDetails}</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">{t.preferredDate}</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-5 w-5 text-muted-foreground/50 pointer-events-none" />
                <input
                  name="appointmentDate"
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={formData.appointmentDate}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-muted/30 border-0 rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all outline-none font-medium placeholder:text-muted-foreground/60"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">{t.donationFrequency}</label>
              <select name="donationFrequency" value={formData.donationFrequency} onChange={handleChange} className="w-full px-4 py-3 bg-muted/30 border-0 rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all outline-none font-medium text-muted-foreground">
                {["1", "2", "3", "4"]
                  .filter(val => formData.gender === "Female" ? ["1", "2"].includes(val) : true)
                  .map((val) => {
                    const i = parseInt(val) - 1;
                    return <option key={val} value={val}>{t.donationFrequencyOptions?.[i] || val}</option>
                  })}
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer bg-muted/30 px-4 py-3 rounded-xl hover:bg-muted/50 transition-colors">
              <input type="checkbox" name="wantReminder" checked={formData.wantReminder} onChange={handleChange} className="accent-primary w-5 h-5 rounded" />
              <Bell className="w-4 h-4 text-primary" />
              <span className="font-medium text-sm text-foreground">{t.wantReminder}</span>
            </label>

            {formData.wantReminder && (
              <div className="flex flex-col gap-3 p-4 bg-primary/5 rounded-xl border border-primary/10 ml-8 animate-in slide-in-from-top-2 duration-200">
                <div className="flex items-center gap-4">
                  <label className="text-sm font-semibold text-foreground whitespace-nowrap">{t.reminderDaysLabel}:</label>
                  <select name="reminderDays" value={formData.reminderDays} onChange={handleChange} className="flex-1 px-4 py-2 text-sm bg-white dark:bg-card border-0 rounded-lg focus:ring-2 focus:ring-primary/20 transition-all outline-none font-medium text-foreground shadow-sm">
                    {[1, 3, 7].map((days, i) => (
                      <option key={days} value={days}>{t.reminderDaysOptions?.[i] || `${days} Days`}</option>
                    ))}
                  </select>
                </div>
                {getPredictedReminderDate() && (
                  <div className="text-xs font-semibold text-primary flex items-center gap-1.5 bg-primary/10 w-fit px-3 py-1.5 rounded-lg border border-primary/20">
                    <Calendar className="w-3.5 h-3.5" />
                    {t.predictedReminderDate} {getPredictedReminderDate()}
                  </div>
                )}
              </div>
            )}
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