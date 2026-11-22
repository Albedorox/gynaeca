import { useEffect, useRef } from 'react'

/**
 * Zurück-Taste/-Geste des Handys schließt die oberste Ebene (Sheet, Menü, Unterseite),
 * statt die App zu verlassen. `depth` = Anzahl offener Ebenen, `closeTop` schließt die oberste.
 */
export function useBackButton(depth: number, closeTop: () => void) {
  const prev = useRef(0)
  const fromPop = useRef(false)
  const skip = useRef(0)
  const closeRef = useRef(closeTop)
  closeRef.current = closeTop

  useEffect(() => {
    const onPop = () => {
      if (skip.current > 0) {
        skip.current--
        return
      }
      fromPop.current = true
      closeRef.current()
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  useEffect(() => {
    const diff = depth - prev.current
    prev.current = depth
    if (diff > 0) {
      for (let i = 0; i < diff; i++) history.pushState({ layer: depth }, '')
    } else if (diff < 0) {
      if (fromPop.current) {
        // eine Ebene ging per Zurück-Taste zu; weitere gleichzeitig geschlossene Ebenen nachziehen
        fromPop.current = false
        if (diff < -1) {
          skip.current++
          history.go(diff + 1)
        }
      } else {
        skip.current++
        history.go(diff)
      }
    }
  }, [depth])
}
