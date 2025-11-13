import Link from "next/link"
import { Github, Twitter, Globe, HeartHandshake } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2">
              <HeartHandshake className="size-5 text-red-800" />
              <span className="text-base font-semibold">SANJIVANI BLOOD BANK</span>
            </div>
            <p className="text-sm text-muted-foreground">Official public platform of Sanjivani Blood Bank, Kopargaon — donation, transparent inventory and hospital requisitions.</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="mb-2 text-sm font-medium">Product</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li><Link href="#features" className="hover:text-foreground">Features</Link></li>
                <li><Link href="#how-it-works" className="hover:text-foreground">How it works</Link></li>
                <li><Link href="#impact" className="hover:text-foreground">Impact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-medium">Company</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li><Link href="#faq" className="hover:text-foreground">FAQ</Link></li>
                <li><Link href="#" className="hover:text-foreground">Contact</Link></li>
              </ul>
            </div>
          </div>
          <div className="flex items-start justify-start gap-3 sm:justify-end">
            <Link href="#" aria-label="Website" className="text-muted-foreground transition-colors hover:text-foreground"><Globe className="size-5" /></Link>
            <Link href="#" aria-label="GitHub" className="text-muted-foreground transition-colors hover:text-foreground"><Github className="size-5" /></Link>
            <Link href="#" aria-label="Twitter" className="text-muted-foreground transition-colors hover:text-foreground"><Twitter className="size-5" /></Link>
          </div>
        </div>
        <div className="mt-8 text-xs text-muted-foreground">© {new Date().getFullYear()} SANJIVANI BLOOD BANK, Kopargaon. All rights reserved.</div>
      </div>
    </footer>
  )
}
