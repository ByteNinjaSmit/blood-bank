"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ShieldCheck, Building2, ClipboardList, BarChart3, Search, Megaphone } from "lucide-react"

const features = [
  {
    title: "Real-time Matching",
    description: "Instantly match hospital requisitions with compatible units across sites.",
    icon: Search,
  },
  {
    title: "Inventory Insights",
    description: "Monitor stock, near-expiry units, reservations, and discards centrally.",
    icon: BarChart3,
  },
  {
    title: "Hospital Requisitions",
    description: "Structured requests, approvals, and issue workflows with audit logs.",
    icon: ClipboardList,
  },
  {
    title: "Compliance & Traceability",
    description: "End-to-end, component-level traceability and configurable validations.",
    icon: ShieldCheck,
  },
  {
    title: "Campaigns & Events",
    description: "Plan camps, onboard donors, track attendance, and streamline donations.",
    icon: Megaphone,
  },
  {
    title: "Multi-site Management",
    description: "Operate across centers with role-based access and data segregation.",
    icon: Building2,
  },
]

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.5 }}
        className="mx-auto max-w-2xl text-center"
      >
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Built for real-world blood operations</h2>
        <p className="mt-3 text-muted-foreground">Everything you need for donors, labs, inventory and hospital partners.</p>
      </motion.div>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
          >
            <Card className="h-full">
              <CardHeader>
                <div className="inline-flex size-10 items-center justify-center rounded-md bg-red-600/10">
                  <f.icon className="size-5 text-red-600" />
                </div>
                <CardTitle className="mt-2 text-lg">{f.title}</CardTitle>
                <CardDescription>{f.description}</CardDescription>
              </CardHeader>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
