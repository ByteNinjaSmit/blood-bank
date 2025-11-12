import { Hero } from "@/components/landing/Hero"
import { Partners } from "@/components/landing/Partners"
import { Features } from "@/components/landing/Features"
import { HowItWorks } from "@/components/landing/HowItWorks"
import { Impact } from "@/components/landing/Impact"
import { Testimonials } from "@/components/landing/Testimonials"
import { FAQ } from "@/components/landing/FAQ"
import { CTA } from "@/components/landing/CTA"

export default function Home() {
  return (
    <div className="font-sans">
      <Hero />
      {/* <Partners /> */}
      <Features />
      <HowItWorks />
      <Impact />
      <Testimonials />
      <FAQ />
      <CTA />
    </div>
  )
}
