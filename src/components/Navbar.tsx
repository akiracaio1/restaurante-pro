'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signOut, getUser } from '@/lib/auth'

const navLinks = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/ingredientes', label: 'Ingredientes' },
  { href: '/receitas', label: 'Receitas' },
  { href: '/compras', label: 'Compras' },
  { href: '/estoque', label: 'Estoque' },
]

export default function Navbar() {
  const [email, setEmail] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    getUser().then(user => setEmail(user?.email ?? null))
  }, [])

  async function handleSignOut() {
    await signOut()
    router.push('/login')
  }

  return (
    <nav style={{ backgroundColor: '#0F4C35' }} className="text-white px-6 py-3 flex items-center justify-between shadow-md">
      <div className="flex items-center gap-8">
        <Link href="/dashboard" className="text-xl font-bold tracking-tight whitespace-nowrap">
          🍽️ RestaurantePro
        </Link>
        <div className="flex gap-5">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-sm hover:text-green-200 transition-colors"
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-4">
        {email && (
          <span className="text-sm text-green-200 hidden sm:block">{email}</span>
        )}
        <button
          onClick={handleSignOut}
          className="text-sm bg-white text-green-900 px-3 py-1 rounded hover:bg-green-100 transition-colors font-medium"
        >
          Sair
        </button>
      </div>
    </nav>
  )
}
