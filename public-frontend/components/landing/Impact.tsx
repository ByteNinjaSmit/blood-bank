"use client"

import * as React from "react"
import { motion } from "framer-motion"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts"

const data = [
  { month: "Jan", donations: 320, requests: 210 },
  { month: "Feb", donations: 380, requests: 240 },
  { month: "Mar", donations: 420, requests: 260 },
  { month: "Apr", donations: 460, requests: 280 },
  { month: "May", donations: 520, requests: 310 },
  { month: "Jun", donations: 580, requests: 340 },
]

const config = {
  donations: {
    label: "Donations",
    color: "oklch(0.65 0.2 27)",
  },
  requests: {
    label: "Requisitions",
    color: "oklch(0.7 0.12 15)",
  },
}

export function Impact() {
  return (
    <section id="impact" className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Measurable impact</h2>
        <p className="mt-3 text-muted-foreground">Transparency across donations, inventory and hospital demand.</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.5 }}
        className="mt-10 rounded-xl border bg-card p-4 shadow-sm"
      >
        <ChartContainer config={config} className="h-80 w-full">
          <AreaChart data={data} margin={{ left: 12, right: 12 }}>
            <defs>
              <linearGradient id="fillDonations" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="oklch(0.65 0.2 27)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="oklch(0.65 0.2 27)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="fillRequests" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="oklch(0.7 0.12 15)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="oklch(0.7 0.12 15)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeOpacity={0.2} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area type="monotone" dataKey="donations" stroke="oklch(0.65 0.2 27)" fill="url(#fillDonations)" />
            <Area type="monotone" dataKey="requests" stroke="oklch(0.7 0.12 15)" fill="url(#fillRequests)" />
          </AreaChart>
        </ChartContainer>
      </motion.div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Stat label="Avg. time to match" value="< 2 min" />
        <Stat label="Units saved from expiry" value="+18%" />
        <Stat label="Hospitals satisfaction" value="4.9/5" />
      </div>
    </section>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card/60 p-4 text-center">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  )
}
