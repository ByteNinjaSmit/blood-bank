"use client"

import { Phone, Mail, MapPin, Clock, Smartphone, Globe, Facebook, Linkedin, Share2, ExternalLink } from 'lucide-react'

export default function ContactSection() {
  const contactInfo = [
    {
      icon: Phone,
      label: "Emergency Hotline",
      value: "+91 7979-XXX-XXX",
      detail: "24/7 Blood Availability",
      href: "tel:+917979000000"
    },
    {
      icon: Mail,
      label: "General Inquiry", // Changed label for clarity
      value: "info@sanjivanibloodbank.com",
      detail: "Response within 2 hours",
      href: "mailto:info@sanjivanibloodbank.com"
    },
    {
      icon: MapPin,
      label: "Our Location", // Changed label for clarity
      value: "Sanjivani Blood Bank, Kopargaon",
      detail: "Vivekanand Nagar, Kopargaon, Maharashtra 423601",
      href: "#"
    },
    {
      icon: Clock,
      label: "Standard Hours", // Changed label for clarity
      value: "9:00 AM - 6:00 PM",
      detail: "Monday - Saturday",
      href: "#"
    }
  ]

  const socialLinks = [
    { icon: Facebook, label: "Facebook", href: "#" },
    { icon: Linkedin, label: "LinkedIn", href: "#" },
    { icon: Globe, label: "Website", href: "#" },
    { icon: Share2, label: "Share Page", href: "#" } // Changed label for clarity
  ]

  return (
    <div id="contact" className="w-full bg-background pt-16 sm:pt-20 lg:pt-24">
      {/* Contact Section with Primary Background */}
      <div
        className="bg-primary relative overflow-hidden py-16 sm:py-24 lg:py-32 shadow-2xl"
      >
        {/* Background shapes for depth */}
        <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/20 rounded-full blur-[120px]"></div>
            <div className="absolute bottom-0 left-0 w-60 h-60 bg-white/20 rounded-full blur-[100px]"></div>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Header */}
          <div className="text-center mb-16 sm:mb-20">
            <div className="inline-block relative w-fit space-y-3">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
                Get in Touch 📞
              </h1>
              
              <p className="text-base sm:text-lg text-white/80 max-w-2xl mx-auto leading-relaxed">
                Reach out to us for urgent blood requirements, donation inquiries, or any medical assistance. Our dedicated team is here to help you <strong>24/7</strong>.
              </p>
               <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-20 h-1 bg-white/50 rounded-full"></div>
            </div>
          </div>


          {/* Contact Info Grid - Enhanced Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-16">
            {contactInfo.map((item, index) => {
              const IconComponent = item.icon
              return (
                <a
                  key={index}
                  href={item.href}
                  className="group relative block transition-all duration-300 transform hover:-translate-y-1"
                >
                  {/* Card styling: Brighter background, strong border highlight */}
                  <div className="bg-white/10 backdrop-blur-md border-t-4 border-white/20 rounded-2xl p-6 sm:p-8 transition-all duration-300 hover:bg-white/20 hover:border-white/50 shadow-xl hover:shadow-2xl h-full flex items-start">
                    <div className="flex items-start text-left space-x-4"> {/* Use text-left for better readability */}
                      {/* Icon Container: Focused white background */}
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-md transition-all duration-300 group-hover:scale-110">
                        <IconComponent className="w-6 h-6 text-primary" /> {/* Primary color icon */}
                      </div>
                      
                      <div className='flex flex-col'>
                        <p className="text-xs font-semibold text-white/70 uppercase tracking-widest mb-1">
                          {item.label}
                        </p>
                        <p className="text-base sm:text-lg font-bold text-white break-words"> {/* Increased font weight */}
                          {item.value}
                        </p>
                        <p className="text-xs text-white/60 mt-1">
                          {item.detail}
                        </p>
                      </div>
                    </div>
                  </div>
                </a>
              )
            })}
          </div>

          {/* CTA Section - Prominent and action-oriented */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
            <a
              href="tel:+917979000000"
              className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-white text-primary rounded-xl font-bold text-lg sm:text-xl hover:bg-white/90 transition-all duration-300 shadow-2xl hover:shadow-primary/50 hover:scale-[1.02] active:scale-95"
            >
              <Phone className="w-5 h-5" />
              Emergency Call Now
            </a>
            <button
              onClick={() => window.location.href = '#donation-form'}
              className="inline-flex items-center justify-center gap-2 px-10 py-4 border-2 border-white/50 text-white rounded-xl font-bold text-lg sm:text-xl hover:bg-white/10 transition-all duration-300 hover:border-white/80"
            >
              <Smartphone className="w-5 h-5" />
              Schedule Appointment
            </button>
          </div>

          {/* Social Links - Cleaned up and added subtle transition */}
          <div className="flex justify-center gap-4 sm:gap-6 flex-wrap pt-6 border-t border-white/30">
            {socialLinks.map((social, index) => {
              const IconComponent = social.icon
              return (
                <a
                  key={index}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative"
                  title={social.label}
                >
                  <div className="w-12 h-12 bg-white/10 border border-white/25 rounded-full flex items-center justify-center hover:bg-white/30 transition-all duration-300 hover:scale-125 active:scale-95">
                    <IconComponent className="w-5 h-5 text-white group-hover:text-white" />
                    {/* Added External link icon for non-Share links */}
                    {social.label !== 'Share Page' && (
                        <ExternalLink className='w-3 h-3 text-white absolute bottom-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity' />
                    )}
                  </div>
                </a>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}