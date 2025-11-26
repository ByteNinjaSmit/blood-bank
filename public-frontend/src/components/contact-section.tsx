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
      label: "Email Support",
      value: "info@sanjivanibloodbank.com",
      detail: "Response within 2 hours",
      href: "mailto:info@sanjivanibloodbank.com"
    },
    {
      icon: MapPin,
      label: "Location",
      value: "Sanjivani Blood Bank, Kopargaon",
      detail: "Vivekanand Nagar, Kopargaon, Maharashtra 423601",
      href: "#"
    },
    {
      icon: Clock,
      label: "Operating Hours",
      value: "9:00 AM - 6:00 PM",
      detail: "Monday - Saturday",
      href: "#"
    }
  ]

  const socialLinks = [
    { icon: Facebook, label: "Facebook", href: "#" },
    { icon: Linkedin, label: "LinkedIn", href: "#" },
    { icon: Globe, label: "Website", href: "#" },
    { icon: Share2, label: "Share", href: "#" }
  ]

  return (
    <div id="contact" className="w-full bg-background">
      {/* Contact Section with Inclined Bottom */}
      <div
        className="bg-primary relative overflow-hidden p-6"
      >
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          {/* Header */}
          <div className="text-center mb-10 sm:mb-14 flex justify-center items-center">
            <div className="pl-5 border-l-8 ml-2 md:ml-0 border-dotted border-white w-fit space-y-2">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white">
                Get in Touch
              </h1>

              <p className="text-base sm:text-lg  text-white max-w-lg leading-relaxed">
                Reach out to us for urgent blood requirements, donation inquiries, or any medical assistance. Our dedicated team is here to help you 24/7.

              </p>
            </div>
          </div>


          {/* Contact Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {contactInfo.map((item, index) => {
              const IconComponent = item.icon
              return (
                <a
                  key={index}
                  href={item.href}
                  className="group relative"
                >
                  <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 transition-all duration-300 hover:bg-white/15 hover:border-white/40 hover:shadow-lg hover:scale-105">
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-all duration-300">
                        <IconComponent className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-2">
                          {item.label}
                        </p>
                        <p className="text-sm sm:text-base font-bold text-white break-words">
                          {item.value}
                        </p>
                        <p className="text-xs text-white/60 mt-2">
                          {item.detail}
                        </p>
                      </div>
                    </div>
                  </div>
                </a>
              )
            })}
          </div>

          {/* CTA Section */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <a
              href="tel:+917979000000"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-primary rounded-xl font-bold text-lg hover:bg-white/90 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
            >
              <Phone className="w-5 h-5" />
              Call Now
            </a>
            <button
              onClick={() => window.location.href = '#donation-form'}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-white text-white rounded-xl font-bold text-lg hover:bg-white/10 transition-all duration-300"
            >
              <Smartphone className="w-5 h-5" />
              Schedule Appointment
            </button>
          </div>

          {/* Social Links */}
          <div className="flex justify-center gap-4 flex-wrap">
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
                  <div className="w-12 h-12 bg-white/15 border border-white/25 rounded-full flex items-center justify-center hover:bg-white/25 hover:border-white/40 transition-all duration-300 hover:scale-110 active:scale-95">
                    <IconComponent className="w-5 h-5 text-white group-hover:text-white" />
                  </div>
                </a>
              )
            })}
          </div>
        </div>
      </div>

      {/* Additional Info Cards Section */}
     
    </div>
  )
}
