'use client'

import { Trophy, Heart, Github } from 'lucide-react'
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-text-primary text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Logo & Description */}
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Trophy className="w-6 h-6 text-accent" />
              <span className="font-bold text-lg">Mundial 2026</span>
            </Link>
            <p className="text-gray-400 text-sm">
              La porra del Mundial. Predice resultados, gana puntos y compite con tus amigos.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4 text-accent">Enlaces Rápidos</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/" className="hover:text-accent transition-colors">Inicio</Link></li>
              <li><Link href="/ranking" className="hover:text-accent transition-colors">Ranking</Link></li>
              <li><Link href="/reglas" className="hover:text-accent transition-colors">Reglas</Link></li>
              <li><Link href="/login" className="hover:text-accent transition-colors">Iniciar Sesión</Link></li>
            </ul>
          </div>

          {/* Credits */}
          <div>
            <h3 className="font-semibold mb-4 text-accent">Créditos</h3>
            <p className="text-gray-400 text-sm flex items-center gap-2">
              Hecho con <Heart className="w-4 h-4 text-fifa-red" /> para los amantes del fútbol
            </p>
            <p className="text-gray-400 text-sm mt-2 flex items-center gap-2">
              <Github className="w-4 h-4" />
              <a href="https://github.com" className="hover:text-accent transition-colors" target="_blank" rel="noopener noreferrer">
                Ver en GitHub
              </a>
            </p>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} Mundial 2026 - Dashboard de la Porra. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  )
}