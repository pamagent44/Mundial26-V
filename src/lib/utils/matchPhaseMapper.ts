// src/lib/utils/matchPhaseMapper.ts

// Rangos de fechas basados en el calendario FIFA 2026 ajustados a las 05:00 AM
const PHASE_DATE_RANGES = {
  DIECISEISAVOS: {
    start: new Date('2026-06-28T05:00:00Z'),
    end: new Date('2026-07-04T05:00:00Z'),
    slug: 'Dieciseisavos'
  },
  OCTAVOS: {
    start: new Date('2026-07-04T05:00:00Z'),
    end: new Date('2026-07-08T05:00:00Z'),
    slug: 'round16'
  },
  CUARTOS: {
    start: new Date('2026-07-08T05:00:00Z'),
    end: new Date('2026-07-12T05:00:00Z'),
    slug: 'quarterfinals'
  },
  SEMIFINALES: {
    start: new Date('2026-07-12T05:00:00Z'),
    end: new Date('2026-07-16T05:00:00Z'),
    slug: 'semifinals'
  },
  TERCER_PUESTO: {
    start: new Date('2026-07-16T05:00:00Z'),
    end: new Date('2026-07-18T23:59:59Z'),
    slug: 'thirdplace'
  },
  FINAL: {
    start: new Date('2026-07-18T05:00:00Z'),
    end: new Date('2026-07-21T05:00:00Z'),
    slug: 'final'
  }
} as const

export function fixMatchPhase(match: {
  stage?: string
  phase?: string
  utcDate: string
}): string {
  const matchDate = new Date(match.utcDate)
  
  if (matchDate >= PHASE_DATE_RANGES.FINAL.start && matchDate <= PHASE_DATE_RANGES.FINAL.end) {
    return PHASE_DATE_RANGES.FINAL.slug
  }
  if (matchDate >= PHASE_DATE_RANGES.TERCER_PUESTO.start && matchDate <= PHASE_DATE_RANGES.TERCER_PUESTO.end) {
    return PHASE_DATE_RANGES.TERCER_PUESTO.slug
  }
  if (matchDate >= PHASE_DATE_RANGES.SEMIFINALES.start && matchDate <= PHASE_DATE_RANGES.SEMIFINALES.end) {
    return PHASE_DATE_RANGES.SEMIFINALES.slug
  }
  if (matchDate >= PHASE_DATE_RANGES.CUARTOS.start && matchDate <= PHASE_DATE_RANGES.CUARTOS.end) {
    return PHASE_DATE_RANGES.CUARTOS.slug
  }
  if (matchDate >= PHASE_DATE_RANGES.OCTAVOS.start && matchDate <= PHASE_DATE_RANGES.OCTAVOS.end) {
    return PHASE_DATE_RANGES.OCTAVOS.slug
  }
  if (matchDate >= PHASE_DATE_RANGES.DIECISEISAVOS.start && matchDate <= PHASE_DATE_RANGES.DIECISEISAVOS.end) {
    return PHASE_DATE_RANGES.DIECISEISAVOS.slug
  }
  
  return 'groups'
}

/**
 * UTILERÍA COMPARTIDA REESTRUCTURADA: Evalúa las fechas límites mediante objetos Date completos.
 * Soluciona el problema de partidos jugados de madrugada (ej: 04:00 AM) agrupándolos de forma correcta.
 */
export function getMatchDeadline(matchDateStr: string): Date {
  const matchDate = new Date(matchDateStr)

  // 1. Bloque 1 (Grupos): Partidos jugados hasta el 18/06/2026 a las 05:00 AM -> Cierre 10/06 a las 23:30
  if (matchDate <= new Date('2026-06-18T05:00:00Z')) {
    return new Date('2026-06-10T23:30:00Z')
  }
  // 2. Bloque 2 (Grupos): Partidos jugados hasta el 24/06/2026 a las 05:00 AM -> Cierre 17/06 a las 23:30
  if (matchDate <= new Date('2026-06-24T05:00:00Z')) {
    return new Date('2026-06-17T23:30:00Z')
  }
  // 3. Bloque 3 (Grupos): Partidos jugados hasta el 28/06/2026 a las 05:00 AM -> Cierre 23/06 a las 23:30
  if (matchDate <= new Date('2026-06-28T05:00:00Z')) {
    return new Date('2026-06-23T23:30:00Z')
  }
  // 4. Bloque 4 (Dieciseisavos): Partidos jugados hasta el 04/07/2026 a las 05:00 AM -> Cierre 27/06 a las 23:30
  if (matchDate <= new Date('2026-07-04T05:00:00Z')) {
    return new Date('2026-06-27T23:30:00Z')
  }
  // 5. Bloque 5 (Octavos): Partidos jugados hasta el 08/07/2026 a las 05:00 AM -> Cierre 03/07 a las 23:30
  if (matchDate <= new Date('2026-07-08T05:00:00Z')) {
    return new Date('2026-07-03T23:30:00Z')
  }
  // 6. Bloque 6 (Cuartos): Partidos jugados hasta el 12/07/2026 a las 05:00 AM -> Cierre 08/07 a las 23:30
  if (matchDate <= new Date('2026-07-12T05:00:00Z')) {
    return new Date('2026-07-08T23:30:00Z')
  }
  // 7. Bloque 7 (Semifinales): Partidos jugados hasta el 16/07/2026 a las 05:00 AM -> Cierre 13/07 a las 23:30
  if (matchDate <= new Date('2026-07-16T05:00:00Z')) {
    return new Date('2026-07-13T23:30:00Z')
  }
  // 8. Bloque 8 (Final y 3er Puesto): Resto de partidos del torneo -> Cierre 17/07 a las 23:30
  return new Date('2026-07-17T23:30:00Z')
}