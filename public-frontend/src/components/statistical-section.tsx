"use client"

import { Droplets, Heart, Users, Activity } from 'lucide-react'
import CountUp from '@/components/utils/count-ups'

export default function StatisticsSection() {
  const stats = [
    {
      icon: Droplets,
      value: 859000,
      label: "Blood Donations",
      color: "from-red-500 to-red-600"
    },
    {
      icon: Activity,
      value: 2080000,
      label: "Components Issued",
      color: "from-orange-500 to-orange-600"
    },
    {
      icon: Users,
      value: 521000,
      label: "Blood Donors",
      color: "from-purple-500 to-purple-600"
    },
    {
      icon: Heart,
      value: 861000,
      label: "Lives Served",
      color: "from-pink-500 to-pink-600"
    },
    {
      icon: Droplets,
      value: 10,
      label: "Hosted Camps",
      color: "from-cyan-500 to-cyan-600"
    }
  ]

  return (
    <div className="w-full bg-background py-16 sm:py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
       <div className="text-center mb-10 sm:mb-14 flex justify-center items-center">
            <div className="pl-5 border-l-8 ml-2 md:ml-0 border-dotted border-primary w-fit space-y-2">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-primary">
               Our Impact by Numbers
              </h1>

              <p className="text-base sm:text-lg  text-primary max-w-lg leading-relaxed">
                Discover the remarkable difference we've made in saving lives and serving communities across the region
              </p>
            </div>
          </div>


        {/* Statistics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 lg:gap-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div
                key={index}
                className="group relative"
              >
                {/* Card */}
                <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 text-center hover:border-primary/50 transition-all duration-300 hover:shadow-lg h-full flex flex-col justify-between">
                  {/* Icon Container */}
                  <div className="flex justify-center mb-6">
                    <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-primary flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                    </div>
                  </div>

                  {/* Counter Value */}
                  <div className="mb-3">
                    <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground flex justify-center items-baseline gap-1">
                      <CountUp
                        to={stat.value}
                        duration={2.5}
                        separator=","
                        className="font-bold"
                      />
                      {stat.label === "Hosted Camps" && <span className="text-lg sm:text-2xl">+</span>}
                    </div>
                  </div>

                  {/* Label */}
                  <p className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-widest">
                    {stat.label}
                  </p>

                  {/* Accent Line */}
                  <div className="w-8 h-1 bg-gradient-to-r from-primary/50 to-primary rounded-full mx-auto mt-4 group-hover:w-12 transition-all duration-300"></div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
