import React from 'react'
import Hero from '@/components/page-hero-section'
import Footer from '@/components/layout/main-footer'
import BloodDonationForm from '@/components/donar-appoinment-form'
import AboutSection from '@/components/about-blood-bank'
import ContactSection from '@/components/contact-section'
import StatisticsSection from '@/components/statistical-section'

const page = () => {
  return (
    <div>
      <Hero/>
      <AboutSection/>
      <StatisticsSection/>
      <BloodDonationForm/>
      {/* <ContactSection/> */}
      <Footer/>
    </div>
  )
}

export default page
