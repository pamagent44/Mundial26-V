// src/lib/utils/matchPhaseMapper.ts

// Rangos de fechas basados en el calendario FIFA 2026 ajustados a las 05:00 AM
const PHASE_DATE_RANGES = {
  DIECISEISAVOS: {
    start: new Date('2026-06-28T05:00:00Z'), // ← CAMBIADO: Ajustado a las 05:00 AM
    end: new Date('2026-07-04T05:00:00Z'),
    slug: 'Dieciseisavos'
  },
  OCTAVOS: {
    start: new Date('2026-07-04T05:00:00Z'), // ← CAMBIADO: Ajustado a las 05:00 AM
    end: new Date('2026-07-07T05:00:00Z'),
    slug: 'round16'
  },
  CUARTOS: {
    start: new Date('2026-07-09T05:00:00Z'), // ← CAMBIADO: Ajustado a las 05:00 AM
    end: new Date('2026-07-12T05:00:00Z'),
    slug: 'quarterfinals'
  },
  SEMIFINALES: {
    start: new Date('2026-07-14T05:00:00Z'), // ← CAMBIADO: Ajustado a las 05:00 AM
    end: new Date('2026-07-15T05:00:00Z'),
    slug: 'semifinals'
  },
  TERCER_PUESTO: {
    start: new Date('2026-07-18T05:00:00Z'), // ← CAMBIADO: Ajustado a las 05:00 AM
    end: new Date('2026-07-18T05:00:00Z'),
    slug: 'thirdplace'
  },
  FINAL: {
    start: new Date('2026-07-19T05:00:00Z'), // ← CAMBIADO: Ajustado a las 05:00 AM
    end: new Date('2026-07-20T05:00:00Z'),
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
  const month = matchDate.getUTCMonth() + 1
  const day = matchDate.getUTCDate()

  // Cierres de ventanas operativas fijados a las 23:30 de la noche anterior al inicio del bloque
  if (month === 6 && day >= 11 && day <= 17) return new Date('2026-06-10T23:30:00Z')
  if (month === 6 && day >= 18 && day <= 23) return new Date('2026-06-17T23:30:00Z')
  if (month === 6 && day >= 24 && day <= 27) return new Date('2026-06-23T23:30:00Z')
  if ((month === 6 && day >= 28) || (month === 7 && day <= 3)) return new Date('2026-06-27T23:30:00Z')
  if (month === 7 && day >= 4 && day <= 7) return new Date('2026-07-03T23:30:00Z')
  if (month === 7 && day >= 9 && day <= 11) return new Date('2026-07-08T23:30:00Z')
  if (month === 7 && day >= 14 && day <= 15) return new Date('2026-07-13T23:30:00Z')
  if (month === 7 && day >= 18 && day <= 19) return new Date('2026-07-17T23:30:00Z')

  return new Date(matchDate.getTime() - 24 * 60 * 60 * 1000)
}