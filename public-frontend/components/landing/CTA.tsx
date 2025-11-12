"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { HandHeart, Building2 } from "lucide-react"

export function CTA() {
  return (
    <section id="donate" className="relative mx-auto max-w-7xl overflow-hidden rounded-2xl border bg-linear-to-tr from-red-800/10 via-transparent to-red-700/10 px-4 py-16 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.5 }}
        className="mx-auto max-w-3xl text-center"
      >
        <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">Ready to make a difference?</h2>
        <p className="mt-3 text-pretty text-muted-foreground">Join thousands of donors and hospitals partnering with Sanjivani Blood Bank, Kopargaon.</p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="h-12 rounded-full bg-red-800 px-6 text-base hover:bg-red-900">
            <Link href="#">
              <span className="inline-flex items-center gap-2"><HandHeart className="size-5" /> Become a Donor</span>
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="h-12 rounded-full px-6 text-base">
            <Link href="#">
              <span className="inline-flex items-center gap-2"><Building2 className="size-5" /> For Hospitals</span>
            </Link>
          </Button>
        </div>
      </motion.div>
    </section>
  )
}
