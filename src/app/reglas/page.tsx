'use client'

import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Shield, Trophy, Clock, Users, AlertTriangle, CheckCircle } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function RulesPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 py-12 px-4 bg-background">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-text-primary mb-2">Reglamento de la Porra</h1>
            <p className="text-text-secondary text-lg">Mundial 2026 - Todas las normas y puntuación</p>
          </div>

          {/* Content */}
          <div className="space-y-8">
            {/* Sistema de Puntuación */}
            <section className="bg-surface rounded-2xl shadow-lg p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-accent" />
                </div>
                <h2 className="text-2xl font-bold text-text-primary">Sistema de Puntuación</h2>
              </div>

              <p className="text-text-secondary mb-6">
                Cada acierto suma puntos según el tipo de predicción. El máximo por partido es de <strong className="text-primary">11 puntos</strong>.
              </p>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-text-primary">Tipo de Acierto</th>
                      <th className="text-center py-3 px-4 font-semibold text-text-primary">Puntos</th>
                      <th className="text-left py-3 px-4 font-semibold text-text-primary">Descripción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr className="hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-fifa-green" />
                          <span className="font-medium">Resultado Exacto (1X2)</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-block bg-fifa-green/20 text-fifa-green font-bold px-3 py-1 rounded-full text-sm">5 pts</span>
                      </td>
                      <td className="py-4 px-4 text-text-secondary">
                        Acertar si gana local, empate o visitante
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-primary" />
                          <span className="font-medium">Cercano al Resultado (1X2)</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-block bg-primary/20 text-primary font-bold px-3 py-1 rounded-full text-sm">2 pts</span>
                      </td>
                      <td className="py-4 px-4 text-text-secondary">
                        Estar a un salto del resultado (ej: pones X y gana local por 1)
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-accent" />
                          <span className="font-medium">Goles de un Equipo</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-block bg-accent/20 text-accent font-bold px-3 py-1 rounded-full text-sm">3 pts</span>
                      </td>
                      <td className="py-4 px-4 text-text-secondary">
                        Acertar el número exacto de goles de un equipo
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-text-secondary" />
                          <span className="font-medium">Cercano a Goles</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-block bg-gray-200 text-text-secondary font-bold px-3 py-1 rounded-full text-sm">1 pt</span>
                      </td>
                      <td className="py-4 px-4 text-text-secondary">
                        Estar a 1 gol de diferencia del resultado real
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Example */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="font-semibold text-text-primary mb-2">📌 Ejemplo: Alemania 2-1 Escocia</p>
                <ul className="text-sm text-text-secondary space-y-1">
                  <li>• <strong>Meison:</strong> Se acerca al número de goles de cada equipo → <span className="text-primary font-semibold">2 puntos</span></li>
                  <li>• <strong>Jimi:</strong> Se acerca al 1X2 + se acerca a goles Alemania + acierta goles Escocia → <span className="text-primary font-semibold">6 puntos</span></li>
                  <li>• <strong>Harry:</strong> Se acerca al número de goles de Escocia → <span className="text-primary font-semibold">1 punto</span></li>
                  <li>• <strong>Willy:</strong> No acierta ni se acerca a nada → <span className="text-primary font-semibold">0 puntos</span></li>
                </ul>
              </div>
            </section>

            {/* Multiplicadores por Fase */}
            <section className="bg-surface rounded-2xl shadow-lg p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-fifa-gold/20 rounded-lg flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-fifa-gold" />
                </div>
                <h2 className="text-2xl font-bold text-text-primary">Multiplicadores por Fase</h2>
              </div>

              <p className="text-text-secondary mb-6">
                Los puntos obtenidos se multiplican según la fase del torneo. La final vale por cinco partidos de la primera fase.
              </p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { phase: 'Fase de Grupos', multiplier: 1, icon: '🔵' },
                  { phase: 'Octavos de Final', multiplier: 2, icon: '🟠' },
                  { phase: 'Cuartos de Final', multiplier: 3, icon: '🟡' },
                  { phase: 'Semifinales', multiplier: 4, icon: '🟣' },
                  { phase: 'Final', multiplier: 5, icon: '⭐' },
                  { phase: '3er Lugar', multiplier: 4, icon: '🟢' },
                ].map((item) => (
                  <div key={item.phase} className="bg-gray-50 rounded-xl p-4 text-center border border-gray-200">
                    <div className="text-3xl mb-2">{item.icon}</div>
                    <p className="font-semibold text-text-primary mb-1">{item.phase}</p>
                    <p className="text-2xl font-bold text-primary">x{item.multiplier}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Reglas Especiales Eliminatorias */}
            <section className="bg-surface rounded-2xl shadow-lg p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-fifa-red/20 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-fifa-red" />
                </div>
                <h2 className="text-2xl font-bold text-text-primary">Reglas Especiales - Eliminatorias</h2>
              </div>

              <div className="bg-fifa-red/10 border border-fifa-red/30 rounded-lg p-4 mb-4">
                <p className="font-semibold text-text-primary mb-2">
                  ⚠️ En caso de prorrogas y penaltis
                </p>
                <p className="text-text-secondary">
                  El resultado que cuenta es el de <strong>PRÓRROGA INCLUÍDA</strong>. Los goles de la tanda de penaltis <strong>NO cuentan</strong>.
                </p>
              </div>
            </section>

            {/* Ventanas de Predicción */}
            <section className="bg-surface rounded-2xl shadow-lg p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-text-primary">Ventanas de Predicción</h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-fifa-green/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-4 h-4 text-fifa-green" />
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary">Apertura de ventana</p>
                    <p className="text-text-secondary text-sm">Las predicciones se abren el día después del último partido de la fase anterior.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-fifa-red/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 text-fifa-red" />
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary">Cierre de ventana</p>
                    <p className="text-text-secondary text-sm">Las predicciones se cierran <strong>24 horas antes</strong> del primer partido de cada fase.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-text-secondary">🔒</span>
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary">Bloqueo de predicciones</p>
                    <p className="text-text-secondary text-sm">Después del cierre, no se pueden editar las predicciones de esa fase. Se bloquean hasta que terminen todos los partidos.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-accent">0</span>
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary">Sin predicciones</p>
                    <p className="text-text-secondary text-sm">Si no hay predicciones para un partido, se otorgan <strong>0 puntos</strong> para esa fase.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Visibilidad */}
            <section className="bg-surface rounded-2xl shadow-lg p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-fifa-green/20 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-fifa-green" />
                </div>
                <h2 className="text-2xl font-bold text-text-primary">Visibilidad de Predicciones</h2>
              </div>

              <div className="bg-fifa-green/10 border border-fifa-green/30 rounded-lg p-4">
                <ul className="text-text-secondary space-y-2">
                  <li>• Las predicciones de diferentes personas pueden coincidir</li>
                  <li>• <strong>NO deben realizar pronósticos sabiendo los de otra persona</strong></li>
                  <li>• Las predicciones deben ser <strong>independientes</strong></li>
                  <li>• Las predicciones se desbloquean y son visibles para otros usuarios solo <strong>después de cerrar la ventana</strong> de esa fase</li>
                </ul>
              </div>
            </section>

            {/* Precio y Premios */}
            <section className="bg-surface rounded-2xl shadow-lg p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-accent" />
                </div>
                <h2 className="text-2xl font-bold text-text-primary">Precio y Reparto de Premios</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 text-center">
                  <p className="text-text-secondary mb-2">Precio de participación</p>
                  <p className="text-4xl font-bold text-primary">20€</p>
                </div>

                <div className="bg-accent/10 border border-accent/30 rounded-xl p-6">
                  <p className="font-semibold text-text-primary mb-4 text-center">Reparto del premio</p>
                  <ul className="space-y-3">
                    <li className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <span className="text-2xl">🥇</span> 1º Lugar
                      </span>
                      <span className="font-bold text-fifa-green">60%</span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <span className="text-2xl">🥈</span> 2º Lugar
                      </span>
                      <span className="font-bold text-primary">30%</span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <span className="text-2xl">🥉</span> 3º Lugar
                      </span>
                      <span className="font-bold text-accent">10%</span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Data Source */}
            <section className="bg-surface rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-text-primary mb-4">Fuente de Datos</h2>
              <p className="text-text-secondary">
                Los resultados se obtienen automáticamente del API de fútbol (<strong>football-data.org</strong>) o pueden ser introducidos manualmente por el administrador.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}