'use client'

import { Trophy, Users, Shield, LogIn, Calendar, Star } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState<string | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    const userData = localStorage.getItem('user')
    if (token && userData) {
      setIsLoggedIn(true)
      setUser(JSON.parse(userData).username)
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user')
    setIsLoggedIn(false)
    setUser(null)
    window.location.href = '/'
  }

  return (
    <nav className="bg-primary shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Trophy className="w-8 h-8 text-accent" />
            <span className="text-white font-bold text-xl hidden sm:block">Mundial 2026</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-white hover:text-accent transition-colors flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Inicio
            </Link>
            <Link href="/ranking" className="text-white hover:text-accent transition-colors flex items-center gap-1">
              <Star className="w-4 h-4" />
              Ranking
            </Link>
            <Link href="/reglas" className="text-white hover:text-accent transition-colors flex items-center gap-1">
              <Shield className="w-4 h-4" />
              Reglas
            </Link>
            {isLoggedIn ? (
              <>
                <Link href="/dashboard" className="text-white hover:text-accent transition-colors flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="bg-fifa-red hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Cerrar Sesión
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="bg-accent hover:bg-yellow-600 text-text-primary px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-1"
              >
                <LogIn className="w-4 h-4" />
                Iniciar Sesión
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden pb-4">
            <div className="flex flex-col gap-3">
              <Link href="/" className="text-white hover:text-accent transition-colors py-2" onClick={() => setIsMenuOpen(false)}>
                Inicio
              </Link>
              <Link href="/ranking" className="text-white hover:text-accent transition-colors py-2" onClick={() => setIsMenuOpen(false)}>
                Ranking
              </Link>
              <Link href="/reglas" className="text-white hover:text-accent transition-colors py-2" onClick={() => setIsMenuOpen(false)}>
                Reglas
              </Link>
              {isLoggedIn ? (
                <>
                  <Link href="/dashboard" className="text-white hover:text-accent transition-colors py-2" onClick={() => setIsMenuOpen(false)}>
                    Dashboard
                  </Link>
                  <button
                    onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                    className="bg-fifa-red hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors text-left"
                  >
                    Cerrar Sesión
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="bg-accent hover:bg-yellow-600 text-text-primary px-4 py-2 rounded-lg font-semibold transition-colors text-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Iniciar Sesión
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}