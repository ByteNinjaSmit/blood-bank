"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Activity, HandHeart, Hospital, ShieldCheck, Droplet } from "lucide-react"

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-40 -top-40 size-144 rounded-full bg-red-500/10 blur-3xl" />
        <div className="absolute -right-40 -bottom-40 size-144 rounded-full bg-rose-500/10 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 size-[80vmax] -translate-x-1/2 -translate-y-1/2 rounded-[40%] bg-linear-to-tr from-red-500/10 via-transparent to-rose-500/10 mask-[radial-gradient(closest-side,black,transparent)]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-16 sm:py-24 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl text-center"
        >
          <Badge className="mb-4 bg-red-800/90 hover:bg-red-800">Modern Blood Bank Platform</Badge>
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
            Sanjivani Blood Bank connects donors and hospitals — in real time
          </h1>
          <p className="mt-4 text-pretty text-base text-muted-foreground sm:text-lg">
            Donate blood, manage inventory, and fulfill hospital requisitions with one seamless, secure, and compliant system.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 rounded-full bg-red-800 px-6 text-base hover:bg-red-900">
              <Link href="#donate" className="inline-flex items-center gap-2">
                <HandHeart className="size-5" /> Donate Now
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 rounded-full px-6 text-base">
              <Link href="#features">Explore Features</Link>
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mx-auto mt-12 grid max-w-5xl grid-cols-2 gap-4 sm:mt-16 sm:grid-cols-4"
        >
          <Stat icon={<Droplet className="size-4 text-red-800" />} value="50k+" label="Active donors" />
          <Stat icon={<Hospital className="size-4 text-red-700" />} value="1.2k+" label="Hospitals connected" />
          <Stat icon={<Activity className="size-4 text-red-800" />} value="98%" label="Match success" />
          <Stat icon={<ShieldCheck className="size-4 text-emerald-600" />} value="100%" label="Traceability" />
        </motion.div>
      </div>
    </section>
  )
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="rounded-xl border bg-card/60 p-4 backdrop-blur">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  )
}
