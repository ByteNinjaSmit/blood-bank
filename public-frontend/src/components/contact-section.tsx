"use client"

import { useLanguage } from '@/context/language-context';
import { content } from '@/lib/content';
import { Phone, Mail, MapPin, Clock, Smartphone, Globe, Facebook, Linkedin, Share2, ExternalLink } from 'lucide-react'

export default function ContactSection() {
  const { language } = useLanguage();
  const t = content[language].contact;

  const icons = [Phone, Smartphone, Phone, Mail, MapPin, Clock];

  const contactInfo = t.items.map((item, index) => ({
    ...item,
    icon: icons[index],
    href: index === 0 ? "tel:+919422223117" :
      index === 1 ? "tel:+919421723117" :
        index === 2 ? "tel:02423222237" :
          index === 3 ? "mailto:contact@sanjivanibloodbank.org" : "#"
  }));

  const socialLinks = [
    { icon: Facebook, label: "Facebook", href: "#" },
    { icon: Linkedin, label: "LinkedIn", href: "#" },
    { icon: Globe, label: "Website", href: "#" },
    { icon: Share2, label: "Share Page", href: "#" }
  ]

  return (
    <div id="contact" className="w-full bg-background pt-16 sm:pt-20 lg:pt-24">
      <div
        className="bg-primary relative overflow-hidden py-16 sm:py-24 lg:py-32 shadow-2xl"
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/20 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-0 left-0 w-60 h-60 bg-white/20 rounded-full blur-[100px]"></div>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Header */}
          <div className="text-center mb-16 sm:mb-20">
            <div className="inline-block relative w-fit space-y-3">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
                {t.title}
              </h1>

              <p className="text-base sm:text-lg text-white/80 max-w-2xl mx-auto leading-relaxed">
                {t.subtitle}
              </p>
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-20 h-1 bg-white/50 rounded-full"></div>
            </div>
          </div>


          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 h-full">
              {contactInfo.map((item, index) => {
                const IconComponent = item.icon
                return (
                  <a
                    key={index}
                    href={item.href}
                    className="group relative block transition-all duration-300 transform hover:-translate-y-1 h-full"
                  >
                    <div className="bg-white/10 backdrop-blur-md border-t-4 border-white/20 rounded-2xl p-6 transition-all duration-300 hover:bg-white/20 hover:border-white/50 shadow-xl hover:shadow-2xl h-full flex flex-col items-start justify-between">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shrink-0 shadow-md transition-all duration-300 group-hover:scale-110">
                          <IconComponent className="w-5 h-5 text-primary" />
                        </div>
                        <p className="text-xs font-semibold text-white/70 uppercase tracking-widest">
                          {item.label}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm font-bold text-white break-all mb-1">
                          {item.value}
                        </p>
                        <p className="text-xs text-white/60">
                          {item.detail}
                        </p>
                      </div>
                    </div>
                  </a>
                )
              })}
            </div>

            {/* Google Map Integration */}
            <div className="bg-white/10 backdrop-blur-md border-4 border-white/20 rounded-3xl overflow-hidden shadow-2xl h-full min-h-[300px] lg:min-h-full relative group">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4484.860840891674!2d74.46832307592962!3d19.880509481496922!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bdc445f2f8849fd%3A0x8d207602e827dc43!2sSanjivani%20Blood%20Bank%2C%20Kopargaon!5e1!3m2!1sen!2sin!4v1766920849910!5m2!1sen!2sin"
                width="100%"
                height="100%"
                style={{ border: 0, minHeight: '300px' }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-full grayscale hover:grayscale-0 transition-all duration-500"
              ></iframe>

              {/* Overlay Text only visible when map is grayscale (optional, or just keep pure map) */}
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur text-primary text-xs font-bold px-3 py-1.5 rounded-full pointer-events-none opacity-100 group-hover:opacity-0 transition-opacity duration-300 shadow-lg">
                Click to Interact
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
            <a
              href="tel:+919422223117"
              className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-white text-primary rounded-xl font-bold text-lg sm:text-xl hover:bg-white/90 transition-all duration-300 shadow-2xl hover:shadow-primary/50 hover:scale-[1.02] active:scale-95"
            >
              <Phone className="w-5 h-5" />
              {t.ctaEmergency}
            </a>
            <button
              onClick={() => window.location.href = '/donate'}
              className="inline-flex items-center justify-center gap-2 px-10 py-4 border-2 border-white/50 text-white rounded-xl font-bold text-lg sm:text-xl hover:bg-white/10 transition-all duration-300 hover:border-white/80"
            >
              <Smartphone className="w-5 h-5" />
              {t.ctaAppointment}
            </button>
          </div>
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