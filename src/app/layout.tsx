import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Mundial 2026 - Dashboard de la Porra',
  description: 'Participa en la porra del Mundial 2026. Predice resultados, gana puntos y llega a lo más alto del ranking.',
  keywords: ['Mundial 2026', 'Porra', 'Fútbol', 'Predicciones', 'Quiniela'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className="min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  )
}