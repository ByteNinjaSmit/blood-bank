"use client"

import { motion } from "framer-motion"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

const faqs = [
  {
    q: "Is LifeFlow compliant for medical audits?",
    a: "Yes. It includes audit trails, configurable validations and traceability across donation, processing and issue workflows.",
  },
  {
    q: "How do hospitals raise requests?",
    a: "Hospitals can submit requisitions with patient details, blood group and components. The system suggests compatible matches instantly.",
  },
  {
    q: "Can we run multi-site operations?",
    a: "Yes. Multi-center setup with role-based access ensures proper segregation and governance.",
  },
]

export function FAQ() {
  return (
    <section id="faq" className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <div className="text-center">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Frequently asked</h2>
        <p className="mt-3 text-muted-foreground">Answers for donors, administrators and hospital partners of Sanjivani Blood Bank.</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.4 }}
        className="mt-8"
      >
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((f, i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger>{f.q}</AccordionTrigger>
              <AccordionContent>{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </motion.div>
    </section>
  )
}
