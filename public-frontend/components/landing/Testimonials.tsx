"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

const testimonials = [
  {
    quote:
      "LifeFlow has transformed our requisition process. Matches are faster and documentation is airtight.",
    author: "Chief Transfusion Officer",
    org: "CityCare Hospital",
  },
  {
    quote:
      "Our camp operations are smoother than ever. Donor follow-ups and inventory sync just work.",
    author: "Coordinator",
    org: "Hope Foundation",
  },
  {
    quote:
      "The end-to-end traceability gives us the confidence we need for audits and clinical safety.",
    author: "Lab Director",
    org: "Mercy Labs",
  },
]

export function Testimonials() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Trusted by healthcare</h2>
        <p className="mt-3 text-muted-foreground">Hospitals, labs and NGOs rely on Sanjivani Blood Bank every day.</p>
      </div>

      <div className="relative mt-10">
        <Carousel className="mx-auto max-w-3xl">
          <CarouselContent>
            {testimonials.map((t, i) => (
              <CarouselItem key={i}>
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.4 }}
                >
                  <Card className="bg-card/70 p-6 text-center backdrop-blur">
                    <CardContent className="px-0">
                      <p className="text-balance text-lg leading-relaxed">“{t.quote}”</p>
                      <div className="mt-4 text-sm text-muted-foreground">
                        {t.author} ・ {t.org}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="-left-10" />
          <CarouselNext className="-right-10" />
        </Carousel>
      </div>
    </section>
  )
}
