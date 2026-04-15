import { useState, useEffect } from "react"
import HeaderDesktop from "./HeaderDesktop"
import HeaderMobile from "./HeaderMobile"

export default function Header() {
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)")
    setIsDesktop(mediaQuery.matches)

    const listener = (e) => setIsDesktop(e.matches)
    mediaQuery.addEventListener("change", listener)
    return () => mediaQuery.removeEventListener("change", listener)
  }, [])

  return isDesktop ? <HeaderDesktop /> : <HeaderMobile />
}
