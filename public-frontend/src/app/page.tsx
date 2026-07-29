import React from 'react'
import Hero from '@/components/page-hero-section'
import Footer from '@/components/layout/main-footer'
import ContactSection from '@/components/contact-section'
import StatisticsSection from '@/components/statistical-section'
import CampDonationSection from '@/components/camp-donation-section'
import FeaturesSection from '@/components/features-section' // Corrected import path
import SafetySection from '@/components/safety-section'
import EducationSection from '@/components/education-section'
import CampaignSection from '@/components/campaign-section'
import AboutSection from '@/components/about-blood-bank'
import HomeDonateSection from '@/components/home-donate-section'
import FeedbackSection from '@/components/feedback-section'

const page = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Hero />
      <FeaturesSection />
      <AboutSection />
      <CampDonationSection />
      <StatisticsSection />
      <EducationSection />
      <CampaignSection />
      <SafetySection />
      <HomeDonateSection />
      <FeedbackSection />
      <ContactSection />
      <Footer />
    </div>
  )
}

export default page
