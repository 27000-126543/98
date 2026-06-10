import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CalculationTask, Notification, AtomInfo, MoleculeParseResult, CalculationResult } from '@/types'

const HEAVY_METALS = ['Fe', 'Cu', 'Zn', 'Ag', 'Au', 'Pt', 'Pd', 'Hg', 'Pb', 'Cd', 'Cr', 'Ni', 'Co', 'Mn']
const ATOM_MASSES: Record<string, number> = {
  H: 1.008, He: 4.003, Li: 6.941, Be: 9.012, B: 10.81, C: 12.011, N: 14.007, O: 15.999,
  F: 18.998, Ne: 20.18, Na: 22.99, Mg: 24.305, Al: 26.982, Si: 28.086, P: 30.974, S: 32.065,
  Cl: 35.453, Ar: 39.948, K: 39.098, Ca: 40.078, Fe: 55.845, Cu: 63.546, Zn: 65.38,
  Br: 79.904, Ag: 107.868, I: 126.904, Au: 196.967, Pt: 195.084, Pd: 106.42,
  Hg: 200.59, Pb: 207.2, Cd: 112.411, Cr: 51.996, Ni: 58.693, Co: 58.933, Mn: 54.938,
}
const ATOM_NAMES: Record<string, string> = {
  H: '氢', He: '氦', Li: '锂', Be: '铍', B: '硼', C: '碳', N: '氮', O: '氧',
  F: '氟', Ne: '氖', Na: '钠', Mg: '镁', Al: '铝', Si: '硅', P: '磷', S: '硫',
  Cl: '氯', Ar: '氩', K: '钾', Ca: '钙', Fe: '铁', Cu: '铜', Zn: '锌',
  Br: '溴', Ag: '银', I: '碘', Au: '金', Pt: '铂', Pd: '钯',
  Hg: '汞', Pb: '铅', Cd: '镉', Cr: '铬', Ni: '镍', Co: '钴', Mn: '锰',
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function parseMoleculeFile(content: string, fileName: string): MoleculeParseResult {
  const atoms: AtomInfo[] = []
  const atomCounts: Record<string, number> = {}
  const ext = fileName.split('.').pop()?.toLowerCase()

  if (ext === 'mol' || ext === 'sdf') {
    const lines = content.split('\n')
    const atomCountLine = lines[3]
    if (atomCountLine) {
      const atomCount = parseInt(atomCountLine.substring(0, 3))
      for (let i = 4; i < 4 + atomCount && i < lines.length; i++) {
        const parts = lines[i].trim().split(/\s+/)
        if (parts.length >= 4) {
          const symbol = parts[3]
          atomCounts[symbol] = (atomCounts[symbol] || 0) + 1
        }
      }
    }
  } else if (ext === 'xyz') {
    const lines = content.split('\n')
    const atomCount = parseInt(lines[0])
    for (let i = 2; i < 2 + atomCount && i < lines.length; i++) {
      const parts = lines[i].trim().split(/\s+/)
      if (parts.length >= 1) {
        const symbol = parts[0]
        atomCounts[symbol] = (atomCounts[symbol] || 0) + 1
      }
    }
  } else if (ext === 'pdb') {
    const lines = content.split('\n')
    for (const line of lines) {
      if (line.startsWith('ATOM') || line.startsWith('HETATM')) {
        const symbol = line.substring(76, 78).trim() || line.substring(12, 16).trim().replace(/[0-9]/g, '')
        if (symbol && /^[A-Z]/.test(symbol)) {
          const clean = symbol.charAt(0).toUpperCase() + symbol.slice(1).toLowerCase()
          atomCounts[clean] = (atomCounts[clean] || 0) + 1
        }
      }
    }
  }

  if (Object.keys(atomCounts).length === 0) {
    const demoAtoms: Record<string, number> = { C: 6, H: 12, O: 2 }
    Object.assign(atomCounts, demoAtoms)
  }

  let molecularWeight = 0
  let containsHeavyMetal = false

  for (const [symbol, count] of Object.entries(atomCounts)) {
    const mass = ATOM_MASSES[symbol] || 12
    const isHeavy = HEAVY_METALS.includes(symbol)
    if (isHeavy) containsHeavyMetal = true
    molecularWeight += mass * count
    atoms.push({
      symbol,
      name: ATOM_NAMES[symbol] || symbol,
      count,
      mass: Math.round(mass * count * 1000) / 1000,
      isHeavyMetal: isHeavy,
    })
  }

  const formulaParts = atoms.map(a => a.symbol + (a.count > 1 ? a.count : ''))
  const formula = formulaParts.join('')

  return {
    formula,
    atoms,
    molecularWeight: Math.round(molecularWeight * 1000) / 1000,
    containsHeavyMetal,
    precisionMode: molecularWeight > 500 || containsHeavyMetal ? 'high' : 'standard',
  }
}

function simulateCalculation(task: CalculationTask): CalculationResult {
  const seed = parseInt(task.id, 36) % 1000
  const energy = -(500 + seed * 0.5 + Math.random() * 200)
  const dipoleMoment = Math.round((0.5 + Math.random() * 8) * 100) / 100
  const homoEnergy = -(4 + Math.random() * 4)
  const lumoEnergy = -(0.5 + Math.random() * 3.5)
  const homoLumoGap = Math.round((lumoEnergy - homoEnergy) * 100) / 100
  const toxicityScore = Math.round(Math.random() * 100) / 100

  const classifications: string[] = []
  if (homoLumoGap < 2) classifications.push('半导体候选')
  if (toxicityScore > 0.7) classifications.push('高风险')

  return {
    energy: Math.round(energy * 100) / 100,
    dipoleMoment,
    homoEnergy: Math.round(homoEnergy * 100) / 100,
    lumoEnergy: Math.round(lumoEnergy * 100) / 100,
    homoLumoGap,
    toxicityScore,
    classifications,
  }
}

interface AppStore {
  tasks: CalculationTask[]
  notifications: Notification[]
  addTask: (content: string, fileName: string) => CalculationTask
  updateProgress: (taskId: string, progress: Partial<CalculationTask['progress']>) => void
  completeTask: (taskId: string) => void
  failTask: (taskId: string) => void
  deleteTask: (taskId: string) => void
  deleteTasks: (taskIds: string[]) => void
  addNotification: (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => void
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
  clearNotifications: () => void
}

export const useStore = create<AppStore>()(
  persist(
    (set, get) => ({
      tasks: [],
      notifications: [],

      addTask: (content: string, fileName: string) => {
        const parseResult = parseMoleculeFile(content, fileName)
        const hasMetal = parseResult.atoms.some(a => a.isHeavyMetal)
        const hasC = parseResult.atoms.some(a => a.symbol === 'C')
        const hasNonMetalOnly = !hasMetal
        let moleculeType: CalculationTask['moleculeType'] = 'inorganic'
        if (hasMetal) moleculeType = 'metalContaining'
        else if (hasC) moleculeType = 'organic'

        const task: CalculationTask = {
          id: generateId(),
          fileName,
          formula: parseResult.formula,
          atoms: parseResult.atoms,
          molecularWeight: parseResult.molecularWeight,
          precisionMode: parseResult.precisionMode,
          status: 'pending',
          progress: { energy: 0, dipole: 0, homoLumo: 0 },
          submittedAt: new Date().toISOString(),
          moleculeType,
          fileContent: content,
        }

        set(state => ({ tasks: [task, ...state.tasks] }))
        return task
      },

      updateProgress: (taskId, progress) => {
        set(state => ({
          tasks: state.tasks.map(t =>
            t.id === taskId
              ? { ...t, status: 'computing', progress: { ...t.progress, ...progress } }
              : t
          ),
        }))
      },

      completeTask: (taskId) => {
        const task = get().tasks.find(t => t.id === taskId)
        if (!task) return
        const result = simulateCalculation(task)
        const completedAt = new Date().toISOString()
        const submittedTime = new Date(task.submittedAt).getTime()
        const duration = Math.round((new Date(completedAt).getTime() - submittedTime) / 1000)

        set(state => ({
          tasks: state.tasks.map(t =>
            t.id === taskId
              ? { ...t, status: 'completed' as const, result, completedAt, duration, progress: { energy: 100, dipole: 100, homoLumo: 100 } }
              : t
          ),
        }))

        get().addNotification({
          taskId,
          message: `${task.fileName} 计算完成`,
          type: 'success',
        })
      },

      failTask: (taskId) => {
        const task = get().tasks.find(t => t.id === taskId)
        if (!task) return
        set(state => ({
          tasks: state.tasks.map(t =>
            t.id === taskId ? { ...t, status: 'failed' as const } : t
          ),
        }))
        get().addNotification({
          taskId,
          message: `${task.fileName} 计算失败`,
          type: 'error',
        })
      },

      deleteTask: (taskId) => {
        set(state => ({
          tasks: state.tasks.filter(t => t.id !== taskId),
          notifications: state.notifications.filter(n => n.taskId !== taskId),
        }))
      },

      deleteTasks: (taskIds) => {
        const idSet = new Set(taskIds)
        set(state => ({
          tasks: state.tasks.filter(t => !idSet.has(t.id)),
          notifications: state.notifications.filter(n => !idSet.has(n.taskId)),
        }))
      },

      addNotification: (notification) => {
        const newNotif: Notification = {
          ...notification,
          id: generateId(),
          read: false,
          createdAt: new Date().toISOString(),
        }
        set(state => ({ notifications: [newNotif, ...state.notifications] }))

        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(newNotif.message)
        }
      },

      markNotificationRead: (id) => {
        set(state => ({
          notifications: state.notifications.map(n =>
            n.id === id ? { ...n, read: true } : n
          ),
        }))
      },

      markAllNotificationsRead: () => {
        set(state => ({
          notifications: state.notifications.map(n => ({ ...n, read: true })),
        }))
      },

      clearNotifications: () => {
        set({ notifications: [] })
      },
    }),
    {
      name: 'molcalc-storage',
    }
  )
)

export { parseMoleculeFile }
