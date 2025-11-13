"use client"

import * as React from "react"
import Link from "next/link"
import { HeartPulse, Droplet, Menu, HandHeart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ModeToggle } from "@/components/site/mode-toggle"

const links = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#impact", label: "Impact" },
  { href: "#faq", label: "FAQ" },
]

export function Navbar() {
  const [open, setOpen] = React.useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="#" className="group inline-flex items-center gap-2">
          <div className="relative">
            <Droplet className="size-6 text-red-800 transition-transform group-hover:-translate-y-0.5" />
            <HeartPulse className="absolute -bottom-2 -right-2 size-3 text-red-700" />
          </div>
          <span className="text-lg font-semibold tracking-tight">SANJIVANI BLOOD BANK</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ModeToggle />
          <div className="hidden md:block">
            <Button asChild className="bg-red-800 hover:bg-red-900">
              <Link href="#donate" className="inline-flex items-center gap-2">
                <HandHeart className="size-4" /> Donate Blood
              </Link>
            </Button>
          </div>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="mt-6 flex flex-col gap-4">
                {links.map((l) => (
                  <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="text-foreground/90">
                    {l.label}
                  </Link>
                ))}
                <Button asChild className="bg-red-800 hover:bg-red-900">
                  <Link href="#donate" className="inline-flex items-center gap-2">
                    <HandHeart className="size-4" /> Donate Blood
                  </Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
