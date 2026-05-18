// src/lib/utils/matchPhaseMapper.ts

// Rangos de fechas basados en el calendario FIFA 2026
// Extraídos del documento que me proporcionaste
const PHASE_DATE_RANGES = {
  DIEZ_Y_SEISAVOS: {
    start: new Date('2026-06-28T00:00:00Z'),
    end: new Date('2026-07-04T23:59:59Z'),
    slug: 'round32'
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

/**
 * Corrige la fase de un partido basándose en su fecha
 * cuando la API no la proporciona correctamente
 */
export function fixMatchPhase(match: {
  stage?: string
  phase?: string
  utcDate: string
}): string {
  const matchDate = new Date(match.utcDate)
  
  // Comprobamos cada rango por orden (de más específico a más general)
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
  if (matchDate >= PHASE_DATE_RANGES.DIEZ_Y_SEISAVOS.start && matchDate <= PHASE_DATE_RANGES.DIEZ_Y_SEISAVOS.end) {
    return PHASE_DATE_RANGES.DIEZ_Y_SEISAVOS.slug
  }
  
  // Si no está en ningún rango eliminatorio, es fase de grupos
  return 'groups'
}