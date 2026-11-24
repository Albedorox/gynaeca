import { describe, expect, it } from 'vitest'
import { csvCell } from './exporter'

describe('csvCell', () => {
  it('maskiert Werte, die eine Tabellenkalkulation als Formel ausführen würde', () => {
    expect(csvCell('=HYPERLINK("http://x")')).toBe(`"'=HYPERLINK(""http://x"")"`)
    expect(csvCell('+49 123')).toBe("'+49 123")
    expect(csvCell('-starke Krämpfe')).toBe("'-starke Krämpfe")
    expect(csvCell('@SUM(A1)')).toBe("'@SUM(A1)")
  })

  it('lässt normale Werte und Zahlen unverändert', () => {
    expect(csvCell('Ibuprofen 400 mg x1')).toBe('Ibuprofen 400 mg x1')
    expect(csvCell(3)).toBe('3')
    expect(csvCell(null)).toBe('')
    expect(csvCell('a;b')).toBe('"a;b"')
  })
})
