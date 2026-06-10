import { useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { Download, FileSpreadsheet, Image, Cpu, Zap, ArrowLeftRight, Layers, Shield, AlertTriangle, ArrowLeft } from 'lucide-react'
import * as XLSX from 'xlsx'
import html2canvas from 'html2canvas'
import { useStore } from '@/store'

const ELEMENT_COLORS: Record<string, string> = {
  C: '#6B7280', H: '#FFFFFF', O: '#FF6B6B', N: '#4D7CFF', S: '#FFD93D', Fe: '#E06633', Cu: '#C88033',
}
const ELEMENT_RADII: Record<string, number> = { C: 0.4, H: 0.2, O: 0.35, N: 0.35 }
const DEFAULT_COLOR = '#00F0FF'
const DEFAULT_RADIUS = 0.3

function AtomSphere({ position, color, radius }: { position: [number, number, number]; color: string; radius: number }) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[radius, 24, 24]} />
      <meshStandardMaterial color={color} roughness={0.3} metalness={0.4} />
    </mesh>
  )
}

function BondCylinder({ start, end }: { start: THREE.Vector3; end: THREE.Vector3 }) {
  const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5)
  const direction = new THREE.Vector3().subVectors(end, start)
  const length = direction.length()
  const orientation = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize())
  return (
    <mesh position={mid} quaternion={orientation}>
      <cylinderGeometry args={[0.06, 0.06, length, 8]} />
      <meshStandardMaterial color="#6B7280" roughness={0.5} metalness={0.3} />
    </mesh>
  )
}

function MoleculeModel({ atoms }: { atoms: { symbol: string; count: number }[] }) {
  const positions: { pos: [number, number, number]; color: string; radius: number }[] = []
  let idx = 0
  const goldenAngle = Math.PI * (3 - Math.sqrt(5))
  for (const atom of atoms) {
    for (let i = 0; i < atom.count; i++) {
      const y = 1 - (2 * idx) / Math.max(1, atoms.reduce((s, a) => s + a.count, 0) - 1)
      const radiusAtY = Math.sqrt(1 - y * y)
      const theta = goldenAngle * idx
      const r = 2.5
      positions.push({
        pos: [radiusAtY * Math.cos(theta) * r, y * r, radiusAtY * Math.sin(theta) * r],
        color: ELEMENT_COLORS[atom.symbol] || DEFAULT_COLOR,
        radius: ELEMENT_RADII[atom.symbol] || DEFAULT_RADIUS,
      })
      idx++
    }
  }

  const bondThreshold = 2.0
  const bonds: { start: THREE.Vector3; end: THREE.Vector3 }[] = []
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const a = new THREE.Vector3(...positions[i].pos)
      const b = new THREE.Vector3(...positions[j].pos)
      if (a.distanceTo(b) < bondThreshold) bonds.push({ start: a, end: b })
    }
  }

  return (
    <group>
      {positions.map((p, i) => <AtomSphere key={i} position={p.pos} color={p.color} radius={p.radius} />)}
      {bonds.map((b, i) => <BondCylinder key={i} start={b.start} end={b.end} />)}
    </group>
  )
}

const PROPERTY_CARDS = [
  { key: 'energy' as const, label: '能量', unit: 'Hartree', icon: Zap, color: '#00F0FF', gradient: 'from-[#00F0FF] to-[#0090FF]' },
  { key: 'dipoleMoment' as const, label: '偶极矩', unit: 'Debye', icon: ArrowLeftRight, color: '#8B5CF6', gradient: 'from-[#8B5CF6] to-[#EC4899]' },
  { key: 'homoEnergy' as const, label: 'HOMO能级', unit: 'eV', icon: Layers, color: '#10B981', gradient: 'from-[#10B981] to-[#00F0FF]' },
  { key: 'lumoEnergy' as const, label: 'LUMO能级', unit: 'eV', icon: Cpu, color: '#F59E0B', gradient: 'from-[#F59E0B] to-[#EF4444]' },
  { key: 'homoLumoGap' as const, label: 'HOMO-LUMO Gap', unit: 'eV', icon: ArrowLeftRight, color: '#06B6D4', gradient: 'from-[#06B6D4] to-[#8B5CF6]' },
  { key: 'toxicityScore' as const, label: '毒性预测', unit: '', icon: Shield, color: '#EF4444', gradient: 'from-[#EF4444] to-[#F59E0B]' },
]

function formatValue(key: string, value: number): string {
  if (key === 'toxicityScore') return (value * 100).toFixed(1) + '%'
  return value.toFixed(4)
}

export default function ResultPage() {
  const { id } = useParams<{ id: string }>()
  const task = useStore(s => s.tasks.find(t => t.id === id))
  const result = task?.result
  const resultRef = useRef<HTMLDivElement>(null)

  if (!task || !result) {
    return (
      <div className="min-h-screen bg-[#0A1628] flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <p className="text-red-400 text-xl font-semibold mb-2">结果未找到</p>
          <p className="text-gray-500 text-sm mb-6">该计算任务不存在或尚未完成</p>
          <Link to="/" className="inline-flex items-center gap-2 text-[#00F0FF] hover:underline text-sm">
            <ArrowLeft className="w-4 h-4" /> 返回首页
          </Link>
        </div>
      </div>
    )
  }

  const handleExportExcel = () => {
    const wsData = [
      ['属性', '值', '单位'],
      ['文件名', task.fileName, ''],
      ['分子式', task.formula, ''],
      ['分子量', String(task.molecularWeight), 'g/mol'],
      ['精度模式', task.precisionMode === 'high' ? '高精度' : '标准', ''],
      ['能量', String(result.energy), 'Hartree'],
      ['偶极矩', String(result.dipoleMoment), 'Debye'],
      ['HOMO能级', String(result.homoEnergy), 'eV'],
      ['LUMO能级', String(result.lumoEnergy), 'eV'],
      ['HOMO-LUMO Gap', String(result.homoLumoGap), 'eV'],
      ['毒性预测', String(result.toxicityScore), ''],
      ['分类标签', result.classifications.join(', '), ''],
    ]
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet(wsData)
    XLSX.utils.book_append_sheet(wb, ws, '计算结果')
    XLSX.writeFile(wb, `${task.fileName}_result.xlsx`)
  }

  const handleExportImage = async () => {
    if (!resultRef.current) return
    const canvas = await html2canvas(resultRef.current, { backgroundColor: '#0A1628', scale: 2 })
    const link = document.createElement('a')
    link.download = `${task.fileName}_result.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  return (
    <div className="min-h-screen bg-[#0A1628] p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/history" className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">{task.fileName}</h1>
            <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
              <span>{task.formula}</span>
              <span className="text-gray-600">|</span>
              <span>MW: {task.molecularWeight} g/mol</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${task.precisionMode === 'high' ? 'bg-amber-500/20 text-amber-400' : 'bg-cyan-500/20 text-cyan-400'}`}>
                {task.precisionMode === 'high' ? '高精度' : '标准'}
              </span>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleExportExcel} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-sm font-medium hover:opacity-90 transition-opacity">
              <FileSpreadsheet className="w-4 h-4" /> 导出Excel
            </button>
            <button onClick={handleExportImage} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] text-white text-sm font-medium hover:opacity-90 transition-opacity">
              <Image className="w-4 h-4" /> 导出图片
            </button>
          </div>
        </div>

        <div ref={resultRef} className="space-y-8">
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <h2 className="text-white font-semibold flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#00F0FF]" /> 分子三维结构
              </h2>
            </div>
            <div className="h-[400px] bg-[#050d1a]">
              <Canvas camera={{ position: [0, 0, 6], fov: 50 }}>
                <ambientLight intensity={0.4} />
                <pointLight position={[10, 10, 10]} intensity={1} />
                <pointLight position={[-10, -10, -5]} intensity={0.3} color="#8B5CF6" />
                <MoleculeModel atoms={task.atoms.map(a => ({ symbol: a.symbol, count: a.count }))} />
                <OrbitControls autoRotate autoRotateSpeed={1.5} enableDamping dampingFactor={0.05} />
              </Canvas>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {PROPERTY_CARDS.map(card => {
              const Icon = card.icon
              const value = result[card.key]
              return (
                <div
                  key={card.key}
                  className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 overflow-hidden"
                >
                  <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${card.gradient}`} />
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${card.color}15` }}>
                      <Icon className="w-4 h-4" style={{ color: card.color }} />
                    </div>
                    <span className="text-gray-400 text-xs">{card.label}</span>
                  </div>
                  <p className="text-2xl font-mono font-bold tabular-nums" style={{ color: card.color }}>
                    {formatValue(card.key, value)}
                  </p>
                  {card.unit && <p className="text-gray-500 text-xs mt-1">{card.unit}</p>}
                </div>
              )
            })}
          </div>

          {result.classifications.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-gray-400 text-sm">分类标签:</span>
              {result.classifications.map(cls => {
                const isRisk = cls === '高风险'
                const color = isRisk ? '#EF4444' : '#F59E0B'
                const Icon = isRisk ? AlertTriangle : Shield
                return (
                  <span
                    key={cls}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium"
                    style={{ backgroundColor: `${color}20`, color, border: `1px solid ${color}40` }}
                  >
                    <Icon className="w-3.5 h-3.5" /> {cls}
                  </span>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
