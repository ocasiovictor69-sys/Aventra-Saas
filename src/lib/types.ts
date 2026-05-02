/**
 * Aventra Shared Type Definitions
 * Enforces the "Hard-Seal" architectural standard for Property Management.
 */

export interface AventraServices {
  memory: {
    captureContext: (payload: any) => Promise<{ ok: boolean; error?: string }>
    mapRelationships: (payload: any) => Promise<{ ok: boolean; error?: string }>
  }
  screening?: {
    runCreditCheck: (ssn: string) => Promise<{ score: number; pass: boolean }>
    runBackgroundCheck: (id: string) => Promise<{ flags: string[]; pass: boolean }>
  }
  legal?: {
    generateLease: (data: any) => Promise<{ pdfUrl: string }>
    dispatchESign: (url: string, email: string) => Promise<{ ok: boolean }>
  }
}

export interface ModuleResult {
  success: boolean
  transition: string
  error?: string
  [key: string]: any
}
