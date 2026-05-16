'use client'

import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Trophy, Users, Calendar, Star, Shield, ChevronRight, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function Home() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative bg-gradient-to-br from-primary via-fifa-blue to-fifa-green min-h-[90vh] flex items-center justify-center overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-96 h-96 bg-fifa-gold rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
          </div>

          {/* Soccer Ball Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="grid grid-cols-12 gap-4 w-full h-full">
              {Array.from({ length: 72 }).map((_, i) => (
                <div key={i} className="border border-white/20 rounded-full aspect-square w-8 h-8"></div>
              ))}
            </div>
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-accent" />
              <span className="text-white text-sm font-medium">¡La mejor porra del Mundial!</span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white mb-6 leading-tight">
              Mundial 2026
              <span className="block text-accent">Dashboard de la Porra</span>
            </h1>

            <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto">
              Participa en la porra más esperada del año. Predice resultados, acumula puntos y
              compitete por ser el rey del fútbol.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/login"
                className="group bg-accent hover:bg-yellow-500 text-text-primary px-8 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg flex items-center gap-2"
              >
                Participa Ahora
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/reglas"
                className="text-white border-2 border-white/30 hover:border-white px-8 py-4 rounded-xl font-semibold text-lg transition-all hover:bg-white/10"
              >
                Ver Reglas
              </Link>
            </div>

            {/* Stats Preview */}
            <div className="grid grid-cols-3 gap-6 mt-16 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-accent">48</div>
                <div className="text-white/70 text-sm">Partidos</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-accent">6</div>
                <div className="text-white/70 text-sm">Fases</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-accent">11</div>
                <div className="text-white/70 text-sm">Pts máx/partido</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
                ¿Por qué participar?
              </h2>
              <p className="text-text-secondary text-lg max-w-2xl mx-auto">
                Un sistema de puntuación justo con multiplicadores por fase que hará que cada partido cuente.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="bg-surface p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
                <div className="w-14 h-14 bg-accent/10 rounded-xl flex items-center justify-center mb-6">
                  <Trophy className="w-7 h-7 text-accent" />
                </div>
                <h3 className="text-xl font-bold text-text-primary mb-3">Premios Increíbles</h3>
                <p className="text-text-secondary">
                  1º lugar: 60%, 2º: 30%, 3º: 10% del bote total. ¡Demuestra que eres el mejor predictor!
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-surface p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                  <Star className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-text-primary mb-3">Sistema de Puntos</h3>
                <p className="text-text-secondary">
                  Acertar resultado: 5pts, cercanía: 2pts, goles exactos: 3pts, cercanía goles: 1pt.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-surface p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
                <div className="w-14 h-14 bg-fifa-green/10 rounded-xl flex items-center justify-center mb-6">
                  <Calendar className="w-7 h-7 text-fifa-green" />
                </div>
                <h3 className="text-xl font-bold text-text-primary mb-3">Multiplicadores</h3>
                <p className="text-text-secondary">
                  Grupos x1, Octavos x2, Cuartos x3, Semifinal x4, Final x5. ¡La final vale mucho!
                </p>
              </div>

              {/* Feature 4 */}
              <div className="bg-surface p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
                <div className="w-14 h-14 bg-secondary/10 rounded-xl flex items-center justify-center mb-6">
                  <Users className="w-7 h-7 text-secondary" />
                </div>
                <h3 className="text-xl font-bold text-text-primary mb-3">Compite con Amigos</h3>
                <p className="text-text-secondary">
                  Crea tu usuario, comparte la porra y ve quién predice mejor en cada fase.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="bg-surface p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
                <div className="w-14 h-14 bg-fifa-gold/10 rounded-xl flex items-center justify-center mb-6">
                  <Shield className="w-7 h-7 text-fifa-gold" />
                </div>
                <h3 className="text-xl font-bold text-text-primary mb-3">Predicciones Ocultas</h3>
                <p className="text-text-secondary">
                  Las predicciones se desbloquean cuando cierra el plazo. ¡Sin trampas!
                </p>
              </div>

              {/* Feature 6 */}
              <div className="bg-surface p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                  <Calendar className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-text-primary mb-3">Fases Detalladas</h3>
                <p className="text-text-secondary">
                  Grupos, Octavos, Cuartos, Semifinal, Final y 3er lugar. Cada fase tiene su encanto.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-primary to-fifa-green">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              ¿Listo para predecir?
            </h2>
            <p className="text-white/90 text-lg mb-8">
              Contacta con el administrador para crear tu cuenta y unirte a la porra del Mundial 2026.
            </p>
            <Link
              href="/login"
              className="inline-block bg-white text-primary font-bold px-8 py-4 rounded-xl hover:bg-gray-100 transition-colors"
            >
              Iniciar Sesión
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}