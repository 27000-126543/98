const fs = require('fs');

const ATOM_MASSES = {
  H: 1.008, He: 4.003, Li: 6.941, Be: 9.012, B: 10.81, C: 12.011, N: 14.007, O: 15.999,
  F: 18.998, Ne: 20.18, Na: 22.99, Mg: 24.305, Al: 26.982, Si: 28.086, P: 30.974, S: 32.065,
  Cl: 35.453, Ar: 39.948, K: 39.098, Ca: 40.078, Fe: 55.845, Cu: 63.546, Zn: 65.38,
  Br: 79.904, Ag: 107.868, I: 126.904, Au: 196.967, Pt: 195.084, Pd: 106.42,
  Hg: 200.59, Pb: 207.2, Cd: 112.411, Cr: 51.996, Ni: 58.693, Co: 58.933, Mn: 54.938,
};
const HEAVY_METALS = ['Fe', 'Cu', 'Zn', 'Ag', 'Au', 'Pt', 'Pd', 'Hg', 'Pb', 'Cd', 'Cr', 'Ni', 'Co', 'Mn'];
const ATOM_NAMES = {
  H: '氢', He: '氦', Li: '锂', Be: '铍', B: '硼', C: '碳', N: '氮', O: '氧',
  F: '氟', Ne: '氖', Na: '钠', Mg: '镁', Al: '铝', Si: '硅', P: '磷', S: '硫',
  Cl: '氯', Ar: '氩', K: '钾', Ca: '钙', Fe: '铁', Cu: '铜', Zn: '锌',
  Br: '溴', Ag: '银', I: '碘', Au: '金', Pt: '铂', Pd: '钯',
  Hg: '汞', Pb: '铅', Cd: '镉', Cr: '铬', Ni: '镍', Co: '钴', Mn: '锰',
};

function parseMoleculeFile(content, fileName) {
  const atoms = [];
  const atomCounts = {};
  const ext = fileName.split('.').pop()?.toLowerCase();
  const trimmed = content.replace(/\r/g, '').trim();
  if (!trimmed) return { error: '文件为空或内容为空', atoms: [], formula: '', molecularWeight: 0, containsHeavyMetal: false, precisionMode: 'standard' };
  const lines = trimmed.split('\n').map(l => l.trimEnd());
  const validateAtomSymbol = (s) => {
    if (!s) return false;
    if (!/^[A-Za-z]+$/.test(s)) return false;
    const p = s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
    return p in ATOM_MASSES;
  };

  if (ext === 'xyz') {
    if (lines.length < 2) return { error: 'XYZ 行数不足', atoms: [], formula: '', molecularWeight: 0, containsHeavyMetal: false, precisionMode: 'standard' };
    const atomCount = parseInt(lines[0].trim(), 10);
    if (isNaN(atomCount) || atomCount <= 0) return { error: 'XYZ 首行原子数无效', atoms: [], formula: '', molecularWeight: 0, containsHeavyMetal: false, precisionMode: 'standard' };
    const nonEmptyAfterTitle = lines.slice(2).filter(l => l.trim().length > 0);
    if (nonEmptyAfterTitle.length !== atomCount) {
      return { error: `XYZ 声明 ${atomCount} 个原子但实际有 ${nonEmptyAfterTitle.length} 行原子数据，数量必须完全一致`, atoms: [], formula: '', molecularWeight: 0, containsHeavyMetal: false, precisionMode: 'standard' };
    }
    for (let i = 2; i < 2 + atomCount && i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const parts = line.split(/\s+/);
      if (parts.length < 4) return { error: `XYZ 第 ${i + 1} 行格式不正确`, atoms: [], formula: '', molecularWeight: 0, containsHeavyMetal: false, precisionMode: 'standard' };
      const symbol = parts[0];
      const x = parseFloat(parts[1]), y = parseFloat(parts[2]), z = parseFloat(parts[3]);
      if (isNaN(x) || isNaN(y) || isNaN(z)) return { error: `XYZ 第 ${i + 1} 行坐标无效`, atoms: [], formula: '', molecularWeight: 0, containsHeavyMetal: false, precisionMode: 'standard' };
      if (!validateAtomSymbol(symbol)) return { error: `XYZ 第 ${i + 1} 行原子符号无效: ${symbol}`, atoms: [], formula: '', molecularWeight: 0, containsHeavyMetal: false, precisionMode: 'standard' };
      const proper = symbol.charAt(0).toUpperCase() + symbol.slice(1).toLowerCase();
      atomCounts[proper] = (atomCounts[proper] || 0) + 1;
    }
  } else {
    return { error: '测试只测 xyz', atoms: [], formula: '', molecularWeight: 0, containsHeavyMetal: false, precisionMode: 'standard' };
  }

  if (Object.keys(atomCounts).length === 0) return { error: '未识别有效原子', atoms: [], formula: '', molecularWeight: 0, containsHeavyMetal: false, precisionMode: 'standard' };
  let molecularWeight = 0, containsHeavyMetal = false;
  for (const [symbol, count] of Object.entries(atomCounts)) {
    const mass = ATOM_MASSES[symbol] || 12;
    const isHeavy = HEAVY_METALS.includes(symbol);
    if (isHeavy) containsHeavyMetal = true;
    molecularWeight += mass * count;
    atoms.push({ symbol, name: ATOM_NAMES[symbol] || symbol, count, mass: Math.round(mass * count * 1000) / 1000, isHeavyMetal: isHeavy });
  }
  atoms.sort((a, b) => {
    const order = ['C', 'H', 'O', 'N', 'S', 'P'];
    const ia = order.indexOf(a.symbol), ib = order.indexOf(b.symbol);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return a.symbol.localeCompare(b.symbol);
  });
  const formulaParts = atoms.map(a => a.symbol + (a.count > 1 ? a.count : ''));
  return { formula: formulaParts.join(''), atoms, molecularWeight: Math.round(molecularWeight * 1000) / 1000, containsHeavyMetal, precisionMode: molecularWeight > 500 || containsHeavyMetal ? 'high' : 'standard' };
}

function test(name, content, fname, expectSuccess) {
  const r = parseMoleculeFile(content, fname);
  const ok = expectSuccess ? !r.error : !!r.error;
  console.log(`${ok ? '✅' : '❌'} ${name} -> ${r.error ? 'FAIL: ' + r.error : 'OK: ' + r.formula + ' / MW=' + r.molecularWeight}`);
  return ok;
}

console.log('========== 格式校验测试 ==========\n');
let pass = 0, total = 0;

total++; if (test(
  '[正常水xyz] 声明3个原子，实际3行',
  '3\nWater molecule\nO  0.0000  0.0000  0.0000\nH  0.7580  0.5870  0.0000\nH -0.7580  0.5870  0.0000\n',
  'water.xyz',
  true
)) pass++;

total++; if (test(
  '[原子数多写] 声明10个但实际只有3行',
  '10\nwrong\nO 0 0 0\nH 1 0 0\nH 0 1 0\n',
  'bad1.xyz',
  false
)) pass++;

total++; if (test(
  '[原子数少写] 声明1个但实际有2行',
  '1\nwrong\nO 0 0 0\nH 1 0 0\n',
  'bad2.xyz',
  false
)) pass++;

total++; if (test(
  '[乱写内容] 首行不是数字',
  '这是乱写的内容\n根本不是有效的xyz格式\n随便写几行\n看看能不能校验失败\n',
  'bad3.xyz',
  false
)) pass++;

total++; if (test(
  '[空文件]',
  '',
  'empty.xyz',
  false
)) pass++;

total++; if (test(
  '[正常苯分子xyz] 12原子',
  '12\nBenzene\nC  1.200  0.000  0.000\nC  0.600  1.039  0.000\nC -0.600  1.039  0.000\nC -1.200  0.000  0.000\nC -0.600 -1.039  0.000\nC  0.600 -1.039  0.000\nH  2.130  0.000  0.000\nH  1.065  1.845  0.000\nH -1.065  1.845  0.000\nH -2.130  0.000  0.000\nH -1.065 -1.845  0.000\nH  1.065 -1.845  0.000\n',
  'benzene.xyz',
  true
)) pass++;

total++; if (test(
  '[格式错误] 缺少坐标值',
  '2\nBad atom row\nO  0.0  0.0\nH  0.7\n',
  'bad4.xyz',
  false
)) pass++;

total++; if (test(
  '[无效原子符号]',
  '3\nBad symbol\nXx 0 0 0\nYy 1 0 0\nZz 0 1 0\n',
  'bad5.xyz',
  false
)) pass++;

console.log(`\n========== 结果: ${pass}/${total} 通过 ==========`);
process.exit(pass === total ? 0 : 1);
