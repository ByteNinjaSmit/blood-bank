import Image from "next/image"

const logos = [
  { src: "/vercel.svg", alt: "Vercel" },
  { src: "/next.svg", alt: "Next.js" },
  { src: "/globe.svg", alt: "Global" },
  { src: "/window.svg", alt: "Window" },
]

export function Partners() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="text-center text-sm text-muted-foreground">Trusted infrastructure partners</div>
      <div className="mt-6 grid grid-cols-2 place-items-center gap-6 opacity-70 sm:grid-cols-4">
        {logos.map((l) => (
          <Image key={l.alt} src={l.src} alt={l.alt} width={120} height={28} className="dark:invert" />
        ))}
      </div>
    </section>
  )
}
