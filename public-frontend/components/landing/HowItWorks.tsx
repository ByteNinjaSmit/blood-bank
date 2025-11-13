"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { UserPlus, HandHeart, FlaskConical, Hospital, ArrowRight } from "lucide-react"

const steps = [
  {
    title: "Join as a donor",
    description: "Create a profile, choose your blood group and nearby center or camp.",
    icon: UserPlus,
  },
  {
    title: "Donate blood",
    description: "Donate at a center or scheduled camp with guided screening.",
    icon: HandHeart,
  },
  {
    title: "Process & track",
    description: "Components are processed, tested and added to inventory.",
    icon: FlaskConical,
  },
  {
    title: "Hospital match",
    description: "Hospitals raise requisitions; compatible units are matched and issued.",
    icon: Hospital,
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">How it works</h2>
        <p className="mt-3 text-muted-foreground">From donor to recipient — clearly tracked at every step.</p>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, i) => (
          <motion.div
            key={s.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
          >
            <Card className="relative h-full">
              <CardHeader>
                <div className="inline-flex size-10 items-center justify-center rounded-md bg-foreground/5">
                  <s.icon className="size-5" />
                </div>
                <CardTitle className="mt-2 text-lg">{s.title}</CardTitle>
                <CardDescription>{s.description}</CardDescription>
              </CardHeader>
              {i < steps.length - 1 ? (
                <ArrowRight className="text-muted-foreground/40 absolute -right-3 top-1/2 hidden size-6 -translate-y-1/2 lg:block" />
              ) : null}
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
