'use client'

import { useEffect, useState } from "react"
import { FaArrowUp } from "react-icons/fa"
import { useLanguage } from '@/context/language-context'
import { content } from '@/lib/content'

export default function BackToTop() {
  const [show, setShow] = useState(false)
  const { language } = useLanguage()
  const t = content[language].misc

  useEffect(() => {
    const onScroll = () => {
      setShow(window.scrollY > 250)
    }

    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <button
      onClick={scrollToTop}
      className={`
        fixed bottom-6 right-0 z-[999] px-4 py-3 rounded-l-3xl cursor-pointer shadow-lg
        bg-primary text-white hover:bg-primary/90 transition-all
        duration-300 flex items-center gap-2 font-medium
        ${show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}
      `}
    >
      <FaArrowUp className="text-md" />
      <span>{t.backToTop}</span>
    </button>
  )
}
