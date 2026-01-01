import React from 'react'
import AboutSection from '@/components/about-blood-bank'
import StatisticsSection from '@/components/statistical-section'
import EducationSection from '@/components/education-section'

import TeamSection from '@/components/team-section'

export default function AboutPage() {
    return (
        <div className="pt-20">
            <AboutSection />
            <StatisticsSection />
            <EducationSection />
            <TeamSection />
        </div>
    )
}
