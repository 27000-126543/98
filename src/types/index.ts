export interface AtomInfo {
  symbol: string
  name: string
  count: number
  mass: number
  isHeavyMetal: boolean
}

export interface MoleculeParseResult {
  formula: string
  atoms: AtomInfo[]
  molecularWeight: number
  containsHeavyMetal: boolean
  precisionMode: 'standard' | 'high'
  error?: string
}

export interface CalculationProgress {
  energy: number
  dipole: number
  homoLumo: number
}

export interface CalculationResult {
  energy: number
  dipoleMoment: number
  homoEnergy: number
  lumoEnergy: number
  homoLumoGap: number
  toxicityScore: number
  classifications: string[]
}

export type TaskStatus = 'pending' | 'computing' | 'completed' | 'failed'
export type PrecisionMode = 'standard' | 'high'

export interface CalculationTask {
  id: string
  fileName: string
  formula: string
  atoms: AtomInfo[]
  molecularWeight: number
  precisionMode: PrecisionMode
  status: TaskStatus
  progress: CalculationProgress
  result?: CalculationResult
  submittedAt: string
  completedAt?: string
  duration?: number
  moleculeType: 'organic' | 'inorganic' | 'metalContaining'
  fileContent?: string
}

export interface Notification {
  id: string
  taskId: string
  message: string
  type: 'success' | 'error' | 'info'
  read: boolean
  createdAt: string
}
