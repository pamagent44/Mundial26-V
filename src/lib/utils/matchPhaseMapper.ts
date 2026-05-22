// src/lib/utils/matchPhaseMapper.ts

// Rangos de fechas basados en el calendario FIFA 2026
const PHASE_DATE_RANGES = {
  DIECISEISAVOS: {
    start: new Date('2026-06-28T00:00:00Z'),
    end: new Date('2026-07-04T23:59:59Z'),
    slug: 'Dieciseisavos'
  },
  OCTAVOS: {
    start: new Date('2026-07-04T00:00:00Z'),
    end: new Date('2026-07-07T23:59:59Z'),
    slug: 'round16'
  },
  CUARTOS: {
    start: new Date('2026-07-09T00:00:00Z'),
    end: new Date('2026-07-12T23:59:59Z'),
    slug: 'quarterfinals'
  },
  SEMIFINALES: {
    start: new Date('2026-07-14T00:00:00Z'),
                end: new Date('2026-07-15T23:59:59Z'),
    slug: 'semifinals'
  },
  TERCER_PUESTO: {
    start: new Date('2026-07-18T00:00:00Z'),
    end: new Date('2026-07-18T23:59:59Z'),
    slug: 'thirdplace'
  },
  FINAL: {
    start: new Date('2026-07-19T00:00:00Z'),
    end: new Date('2026-07-19T23:59:59Z'),
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
 * UTILERÍA COMPARTIDA: Calcula la fecha y hora límite estricta de un partido según sus rangos de calendario.
 */
export function getMatchDeadline(matchDateStr: string): Date {
  const matchDate = new Date(matchDateStr)
  const month = matchDate.getUTCMonth() + 1 // 1-indexed
  const day = matchDate.getUTCDate()

  // 1. Partidos entre 11/06/2026 y 17/06/2026 -> Cierre 10/06/2026 a las 23:30
  if (month === 6 && day >= 11 && day <= 17) {
    return new Date('2026-06-10T23:30:00Z')
  }
  // 2. Partidos entre 18/06/2026 y 23/06/2026 -> Cierre 17/06/2026 a las 23:30
  if (month === 6 && day >= 18 && day <= 23) {
    return new Date('2026-06-17T23:30:00Z')
  }
  // 3. Partidos entre 24/06/2026 y 27/06/2026 -> Cierre 23/06/2026 a las 23:30
  if (month === 6 && day >= 24 && day <= 27) {
    return new Date('2026-06-23T23:30:00Z')
  }
  // 4. Partidos entre 28/06/2026 y 03/07/2026 -> Cierre 27/06/2026 a las 23:30
  if ((month === 6 && day >= 28) || (month === 7 && day <= 3)) {
    return new Date('2026-06-27T23:30:00Z')
  }
  // 5. Partidos entre 04/07/2026 y 07/07/2026 -> Cierre 03/07/2026 a las 23:30
  if (month === 7 && day >= 4 && day <= 7) {
    return new Date('2026-07-03T23:30:00Z')
  }
  // 6. Partidos entre 09/07/2026 y 11/07/2026 -> Cierre 08/07/2026 a las 23:30
  if (month === 7 && day >= 9 && day <= 11) {
    return new Date('2026-07-08T23:30:00Z')
  }
  // 7. Partidos entre 14/07/2026 y 15/07/2026 -> Cierre 13/07/2026 a las 23:30
  if (month === 7 && day >= 14 && day <= 15) {
    return new Date('2026-07-13T23:30:00Z')
  }
  // 8. Partidos entre 18/07/2026 y 19/07/2026 -> Cierre 17/07/2026 a las 23:30
  if (month === 7 && day >= 18 && day <= 19) {
    return new Date('2026-07-17T23:30:00Z')
  }

  // Fallback de seguridad (24 horas antes)
  return new Date(matchDate.getTime() - 24 * 60 * 60 * 1000)
}