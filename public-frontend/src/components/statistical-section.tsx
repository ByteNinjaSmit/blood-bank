"use client"

import { Droplets, Heart, Users, Activity, Tent } from 'lucide-react'
import CountUp from '@/components/utils/count-ups'
import { useLanguage } from '@/context/language-context';
import { content } from '@/lib/content';

export default function StatisticsSection() {
  const { language } = useLanguage();
  const t = content[language].stats;

  const stats = [
    {
      icon: Droplets,
      value: 100000,
      label: t.donationsLabel,
      color: "from-red-500 to-red-600"
    },
    {
      icon: Activity,
      value: 160000,
      label: t.issuedLabel,
      color: "from-orange-500 to-orange-600"
    },
    {
      icon: Users,
      value: 90000,
      label: t.donorsLabel,
      color: "from-purple-500 to-purple-600"
    },
    {
      icon: Tent,
      value: 3000,
      label: t.campsLabel,
      color: "from-cyan-500 to-cyan-600"
    },
    {
      icon: Heart,
      value: 100000,
      label: t.livesLabel,
      color: "from-pink-500 to-pink-600"
    }
  ]

  return (
    <div id="statistics" className="w-full bg-background/50 py-16 sm:py-20 lg:py-24 border-y border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-block relative w-fit space-y-3">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
              {language === 'en' ? 'Our Impact' : 'आमचे कार्य'} <span className='text-primary'>{language === 'en' ? 'by Numbers' : 'आकडेवारीत'}</span>
            </h1>
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 lg:gap-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div
                key={index}
                className="group relative"
              >
                {/* Card */}
                <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 text-center hover:border-primary/50 transition-all duration-300 hover:shadow-lg h-full flex flex-col justify-between hover:-translate-y-1">
                  {/* Icon Container */}
                  <div className="flex justify-center mb-6">
                    <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-primary/10 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300 group-hover:bg-primary group-hover:text-primary-foreground`}>
                      <Icon className="w-7 h-7 sm:w-8 sm:h-8 text-primary group-hover:text-current transition-colors" />
                    </div>
                  </div>

                  {/* Counter Value */}
                  <div className="mb-3">
                    <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground flex justify-center items-center gap-0.5">
                      <CountUp
                        to={stat.value}
                        duration={2.5}
                        separator=","
                        className="font-bold"
                      />
                      <span className="text-primary text-2xl">+</span>
                    </div>
                  </div>

                  {/* Label */}
                  <p className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-widest">
                    {stat.label}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
