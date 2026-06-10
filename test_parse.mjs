const ATOM_MASSES = {
  H: 1.008, He: 4.003, Li: 6.941, Be: 9.012, B: 10.81, C: 12.011, N: 14.007, O: 15.999,
  F: 18.998, Ne: 20.18, Na: 22.99, Mg: 24.305, Al: 26.982, Si: 28.086, P: 30.974, S: 32.065,
  Cl: 35.453, Ar: 39.948, K: 39.098, Ca: 40.078, Fe: 55.845, Cu: 63.546, Zn: 65.38,
  Br: 79.904, Ag: 107.868, I: 126.904, Au: 196.967, Pt: 195.084, Pd: 106.42,
  Hg: 200.59, Pb: 207.2, Cd: 112.411, Cr: 51.996, Ni: 58.693, Co: 58.933, Mn: 54.938,
}

const HEAVY_METALS = ['Fe', 'Cu', 'Zn', 'Ag', 'Au', 'Pt', 'Pd', 'Hg', 'Pb', 'Cd', 'Cr', 'Ni', 'Ni', 'Co', 'Mn']

const ATOM_NAMES = {
  H: '氢', He: '氦', Li: '锂', Be: '铍', B: '硼', C: '碳', N: '氮', O: '氧',
  F: '氟', Ne: '氖', Na: '钠', Mg: '镁', Al: '铝', Si: '硅', P: '磷', S: '硫',
  Cl: '氯', Ar: '氩', K: '钾', Ca: '钙', Fe: '铁', Cu: '铜', Zn: '锌',
  Br: '溴', Ag: '银', I: '碘', Au: '金', Pt: '铂', Pd: '钯',
  Hg: '汞', Pb: '铅', Cd: '镉', Cr: '铬', Ni: '镍', Co: '钴', Mn: '锰',
}

function parseMoleculeFile(content, fileName) {
  const atoms = []
  const atomCounts = {}
  const ext = fileName.split('.').pop()?.toLowerCase()

  const trimmed = content.replace(/\r/g, '').trim()

  if (!trimmed) {
    return {
      formula: '',
      atoms: [],
      molecularWeight: 0,
      containsHeavyMetal: false,
      precisionMode: 'standard',
      error: '文件为空或内容为空',
    }
  }

  const lines = trimmed.split('\n').map(l => l.trimEnd())

  const validateAtomSymbol = (symbol) => {
    if (!symbol) return false
    if (!/^[A-Za-z]+$/.test(symbol)) return false
    const proper = symbol.charAt(0).toUpperCase() + symbol.slice(1).toLowerCase()
    return proper in ATOM_MASSES
  }

  if (ext === 'mol' || ext === 'sdf') {
    if (lines.length < 4) {
      return { formula: '', atoms: [], molecularWeight: 0, containsHeavyMetal: false, precisionMode: 'standard', error: 'MOL/SDF 文件格式错误：文件行数不足' }
    }

    const countsLine = lines[3].trim()
    if (!/^\d+\s+\d+.*$/.test(countsLine)) {
      return { formula: '', atoms: [], molecularWeight: 0, containsHeavyMetal: false, precisionMode: 'standard', error: 'MOL/SDF 文件格式错误：计数行格式不正确' }
    }

    const countMatch = countsLine.match(/^(\d+)\s+(\d+)/)
    if (!countMatch) {
      return { formula: '', atoms: [], molecularWeight: 0, containsHeavyMetal: false, precisionMode: 'standard', error: 'MOL/SDF 文件格式错误：无法解析计数行' }
    }

    const atomCount = parseInt(countMatch[1], 10)

    if (isNaN(atomCount) || atomCount <= 0) {
      return { formula: '', atoms: [], molecularWeight: 0, containsHeavyMetal: false, precisionMode: 'standard', error: 'MOL/SDF 文件格式错误：原子数无效' }
    }

    if (lines.length < 4 + atomCount) {
      return { formula: '', atoms: [], molecularWeight: 0, containsHeavyMetal: false, precisionMode: 'standard', error: `MOL/SDF 文件格式错误：声明 ${atomCount} 个原子但实际只有 ${Math.max(0, lines.length - 4)} 行原子数据` }
    }

    for (let i = 4; i < 4 + atomCount; i++) {
      const parts = lines[i].trim().split(/\s+/)
      if (parts.length < 4) {
        return { formula: '', atoms: [], molecularWeight: 0, containsHeavyMetal: false, precisionMode: 'standard', error: `MOL/SDF 文件格式错误：第 ${i + 1} 行原子数据格式不正确` }
      }
      const x = parseFloat(parts[0])
      const y = parseFloat(parts[1])
      const z = parseFloat(parts[2])
      const symbol = parts[3]
      if (isNaN(x) || isNaN(y) || isNaN(z)) {
        return { formula: '', atoms: [], molecularWeight: 0, containsHeavyMetal: false, precisionMode: 'standard', error: `MOL/SDF 文件格式错误：第 ${i + 1} 行坐标无效` }
      }
      if (!validateAtomSymbol(symbol)) {
        return { formula: '', atoms: [], molecularWeight: 0, containsHeavyMetal: false, precisionMode: 'standard', error: `MOL/SDF 文件格式错误：第 ${i + 1} 行原子符号 "${symbol}" 无效` }
      }
      const proper = symbol.charAt(0).toUpperCase() + symbol.slice(1).toLowerCase()
      atomCounts[proper] = (atomCounts[proper] || 0) + 1
    }

  } else if (ext === 'xyz') {
    if (lines.length < 2) {
      return { formula: '', atoms: [], molecularWeight: 0, containsHeavyMetal: false, precisionMode: 'standard', error: 'XYZ 文件格式错误：文件行数不足' }
    }

    const atomCount = parseInt(lines[0].trim(), 10)

    if (isNaN(atomCount) || atomCount <= 0) {
      return { formula: '', atoms: [], molecularWeight: 0, containsHeavyMetal: false, precisionMode: 'standard', error: 'XYZ 文件格式错误：首行原子数无效' }
    }

    const nonEmptyAfterTitle = lines.slice(2).filter(l => l.trim().length > 0)

    if (nonEmptyAfterTitle.length < atomCount) {
      return { formula: '', atoms: [], molecularWeight: 0, containsHeavyMetal: false, precisionMode: 'standard', error: `XYZ 文件格式错误：声明 ${atomCount} 个原子但实际只有 ${nonEmptyAfterTitle.length} 行原子数据` }
    }

    let validCount = 0
    for (let i = 2; i < 2 + atomCount && i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue
      const parts = line.split(/\s+/)
      if (parts.length < 4) {
        return { formula: '', atoms: [], molecularWeight: 0, containsHeavyMetal: false, precisionMode: 'standard', error: `XYZ 文件格式错误：第 ${i + 1} 行原子数据格式不正确` }
      }
      const symbol = parts[0]
      const x = parseFloat(parts[1])
      const y = parseFloat(parts[2])
      const z = parseFloat(parts[3])
      if (isNaN(x) || isNaN(y) || isNaN(z)) {
        return { formula: '', atoms: [], molecularWeight: 0, containsHeavyMetal: false, precisionMode: 'standard', error: `XYZ 文件格式错误：第 ${i + 1} 行坐标无效` }
      }
      if (!validateAtomSymbol(symbol)) {
        return { formula: '', atoms: [], molecularWeight: 0, containsHeavyMetal: false, precisionMode: 'standard', error: `XYZ 文件格式错误：第 ${i + 1} 行原子符号 "${symbol}" 无效` }
      }
      const proper = symbol.charAt(0).toUpperCase() + symbol.slice(1).toLowerCase()
      atomCounts[proper] = (atomCounts[proper] || 0) + 1
      validCount++
    }

    if (validCount === 0) {
      return { formula: '', atoms: [], molecularWeight: 0, containsHeavyMetal: false, precisionMode: 'standard', error: 'XYZ 文件格式错误：未找到有效原子' }
    }

  } else if (ext === 'pdb') {
    const atomLines = lines.filter(l => l.startsWith('ATOM') || l.startsWith('HETATM'))

    if (atomLines.length === 0) {
      return { formula: '', atoms: [], molecularWeight: 0, containsHeavyMetal: false, precisionMode: 'standard', error: 'PDB 文件格式错误：未找到有效 ATOM/HETATM 记录' }
    }

    for (const line of atomLines) {
      let symbol = ''
      if (line.length >= 78) {
        symbol = line.substring(76, 78).trim()
      }
      if (!symbol && line.length >= 16) {
        symbol = line.substring(12, 16).trim().replace(/[0-9]/g, '')
      }
      if (!validateAtomSymbol(symbol)) continue
      const proper = symbol.charAt(0).toUpperCase() + symbol.slice(1).toLowerCase()
      atomCounts[proper] = (atomCounts[proper] || 0) + 1
    }

    if (Object.keys(atomCounts).length === 0) {
      return { formula: '', atoms: [], molecularWeight: 0, containsHeavyMetal: false, precisionMode: 'standard', error: 'PDB 文件格式错误：未识别到有效原子符号' }
    }

  } else {
    return { formula: '', atoms: [], molecularWeight: 0, containsHeavyMetal: false, precisionMode: 'standard', error: '不支持的文件格式' }
  }

  if (Object.keys(atomCounts).length === 0) {
    return { formula: '', atoms: [], molecularWeight: 0, containsHeavyMetal: false, precisionMode: 'standard', error: '未识别到有效原子' }
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

  atoms.sort((a, b) => {
    const order = ['C', 'H', 'O', 'N', 'S', 'P']
    const ia = order.indexOf(a.symbol)
    const ib = order.indexOf(b.symbol)
    if (ia !== -1 && ib !== -1) return ia - ib
    if (ia !== -1) return -1
    if (ib !== -1) return 1
    return a.symbol.localeCompare(b.symbol)
  })

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

const badContent = `这是乱写的内容
根本不是有效的xyz格式
随便写几行
看看能不能校验失败`

const goodContent = `3
Water molecule
O  0.0000  0.0000  0.0000
H  0.7580  0.5870  0.0000
H -0.7580  0.5870  0.0000
`

console.log('=== 测试乱写的 xyz 文件:')
const badResult = parseMoleculeFile(badContent, 'test.xyz')
console.log(JSON.stringify(badResult, null, 2))

console.log('\n=== 测试正常的 xyz 文件:')
const goodResult = parseMoleculeFile(goodContent, 'water.xyz')
console.log(JSON.stringify(goodResult, null, 2))

console.log('\n=== 测试空文件:')
const emptyResult = parseMoleculeFile('', 'empty.xyz')
console.log(JSON.stringify(emptyResult, null, 2))

console.log('\n=== 测试原子数不匹配的 xyz:')
const badCount = `10
Only 3 atoms
O 0 0 0
H 1 0 0
H 0 1 0`
const badCountResult = parseMoleculeFile(badCount, 'badcount.xyz')
console.log(JSON.stringify(badCountResult, null, 2))
