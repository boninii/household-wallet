'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react'

type Ctx = {

  hidden: boolean

  toggle: () => void

  mask_brl: string

  mask_usd: string

}

const PrivacyContext = createContext<Ctx | null>(null)

const STORAGE_KEY = 'hw:privacy_hidden'

export function PrivacyProvider({ children }: { children: React.ReactNode }) {

  const [hidden, setHidden] = useState(false)

  useEffect(() => {

    const saved = localStorage.getItem(STORAGE_KEY)

    if (saved === '1') {

      setHidden(true)

    }
  }, [])

  const toggle = useCallback(() => {

    setHidden((h) => {

      const next = !h

      localStorage.setItem(STORAGE_KEY, next ? '1' : '0')

      return next

    })
  }, [])

  const value = useMemo<Ctx>(() => ({
    hidden,
    toggle,
    mask_brl: 'R$ ••••',
    mask_usd: '$ ••••'
  }), [hidden, toggle])

  return (
    <PrivacyContext.Provider value={value}>{children}</PrivacyContext.Provider>

  )

}

export function usePrivacy() {

  const ctx = useContext(PrivacyContext)

  if (!ctx) {

    throw new Error('usePrivacy precisa estar dentro de PrivacyProvider')

  }

  return ctx

}
