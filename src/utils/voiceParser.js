import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, PLATFORMS } from '../lib/constants'

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

// ── Local regex parser ─────────────────────────────────────────────────────

function today() {
  return new Date().toISOString().split('T')[0]
}

function yesterday() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().split('T')[0]
}

function parseDate(str) {
  const lower = str.toLowerCase()
  if (/\bhoy\b|\bhoje\b|\btoday\b/.test(lower)) return today()
  if (/\bontem\b|\bayer\b|\byesterday\b/.test(lower)) return yesterday()

  const m = str.match(/(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})/)
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`

  const m2 = str.match(/(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2})\b/)
  if (m2) return `20${m2[3]}-${m2[2].padStart(2, '0')}-${m2[1].padStart(2, '0')}`

  const months = {
    enero: '01', febrero: '02', marzo: '03', abril: '04', mayo: '05', junio: '06',
    julio: '07', agosto: '08', septiembre: '09', octubre: '10', noviembre: '11', diciembre: '12',
    janeiro: '01', fevereiro: '02', marco: '03', maio: '05', junho: '06',
    julho: '07', agosto: '08', setembro: '09', outubro: '10', novembro: '11', dezembro: '12',
  }
  const m3 = str.match(/(\d{1,2})\s+de\s+(\w+)(?:\s+de\s+(\d{4}))?/i)
  if (m3) {
    const mon = months[m3[2].toLowerCase()]
    if (mon) {
      const yr = m3[3] || new Date().getFullYear()
      return `${yr}-${mon}-${m3[1].padStart(2, '0')}`
    }
  }

  return null
}

function detectType(text) {
  const lower = text.toLowerCase()
  if (/\bgaste\b|\bpague\b|\bgasto\b|\bfactura\b|\bcompre\b|\bpagamento\b|\bdespesa\b/.test(lower)) return 'expense'
  if (/\bgane\b|\bcobrar\b|\bingreso\b|\bviajes\b|\bganancia\b|\breceita\b|\bbonus\b|\bbonificac/.test(lower)) return 'income'
  return 'expense'
}

const CATEGORY_KEYWORDS = {
  expense: {
    'Combustible': /\bgas\b|\bgasolina\b|\bcombustivel\b|\bgalp\b|\bcepsa\b|\brepsol\b|\bpetrol\b|\bnafta\b|\bfuel\b/,
    'Lavado': /\blavado\b|\blavagem\b|\blimpeza\b/,
    'Seguro': /\bseguro\b|\bseguran[cç]a\b|\binsurance\b/,
    'Mantenimiento': /\bmantenimiento\b|\bmanuten[cç][ãa]o\b|\brepair\b|\breparo\b/,
    'Propinas': /\bpropina\b|\bgorjeta\b|\btips?\b/,
    'Comisión plataforma': /\bcomisi[oó]n\b|\bcomiss[aã]o\b|\bcommission\b/,
    'Otro': /\botro\b|\bother\b/,
  },
  income: {
    'Viajes': /\bviajes?\b|\bviagens?\b|\bboleia\b|\btrip\b|\brides?\b/,
    'Propinas': /\bpropina\b|\bgorjeta\b|\btips?\b/,
    'Bonificación': /\bbonus\b|\bbonificac/i,
    'Otro': /\botro\b|\bother\b/,
  },
}

function detectCategory(text, type) {
  const lower = text.toLowerCase()
  const map = CATEGORY_KEYWORDS[type] || CATEGORY_KEYWORDS.expense
  for (const [cat, regex] of Object.entries(map)) {
    if (regex.test(lower)) return cat
  }
  return 'Otro'
}

// ── Number words to digits ─────────────────────────────────────────────────

const NUM_MAP = {
  // Spanish
  uno: 1, un: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5,
  seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10,
  once: 11, doce: 12, trece: 13, catorce: 14, quince: 15,
  dieciséis: 16, dieciseis: 16, diecisiete: 17, dieciocho: 18, diecinueve: 19,
  veinte: 20, veintiuno: 21, veintidós: 22, veintidos: 22,
  veintitrés: 23, veintitres: 23, veinticuatro: 24, veinticinco: 25,
  veintiséis: 26, veintiseis: 26, veintisiete: 27, veintiocho: 28, veintinueve: 29,
  treinta: 30, cuarenta: 40, cincuenta: 50, sesenta: 60,
  setenta: 70, ochenta: 80, noventa: 90,
  cien: 100, ciento: 100,
  doscientos: 200, trescientos: 300, cuatrocientos: 400,
  quinientos: 500, seiscientos: 600, setecientos: 700,
  ochocientos: 800, novecientos: 900,
  mil: 1000,
  // Portuguese
  um: 1, uma: 1, dois: 2, três: 3, quatro: 4, cinco: 5,
  sete: 7, oito: 8, nove: 9, dez: 10,
  onze: 11, doze: 12, treze: 13, catorze: 14, quinze: 15,
  vinte: 20, trinta: 30, quarenta: 40, cinquenta: 50,
  sessenta: 60, oitenta: 80,
  cem: 100, duzentos: 200, trezentos: 300, quatrocentos: 400,
  quinhentos: 500, seiscentos: 600, setecentos: 700,
  oitocentos: 800, novecentos: 900,
}

function convertPhrase(s) {
  let r = s
  // Compound tens: "ochenta y uno" → "81"
  r = r.replace(
    /\b(treinta|cuarenta|cincuenta|sesenta|setenta|ochenta|noventa|trinta|quarenta|cinquenta|sessenta|oitenta)\s+y\s+(uno|un|una|dos|tres|quatro|cuatro|cinco|seis|sete|siete|oito|ocho|nove|nueve)\b/gi,
    (_, tens, units) => String(NUM_MAP[tens.toLowerCase()] + NUM_MAP[units.toLowerCase()])
  )
  // Hundreds + tens + units
  r = r.replace(
    /\b(cien|ciento|doscientos|trescientos|cuatrocientos|quinientos|seiscientos|setecientos|ochocientos|novecientos|cem|duzentos|trezentos|quatrocentos|quinhentos|seiscentos|setecentos|oitocentos|novecientos)\s+(treinta|cuarenta|cincuenta|sesenta|setenta|ochenta|noventa|trinta|quarenta|cinquenta|sessenta|oitenta)\s+y\s+(uno|un|una|dos|tres|quatro|cuatro|cinco|seis|sete|siete|oito|ocho|nove|nueve)\b/gi,
    (_, h, t, u) => String(NUM_MAP[h.toLowerCase()] + NUM_MAP[t.toLowerCase()] + NUM_MAP[u.toLowerCase()])
  )
  // Hundreds + tens
  r = r.replace(
    /\b(cien|ciento|doscientos|trescientos|cuatrocientos|quinientos|seiscientos|setecientos|ochocientos|novecientos|cem|duzentos|trezentos|quatrocentos|quinhentos|seiscentos|setecentos|oitocentos|novecientos)\s+(treinta|cuarenta|cincuenta|sesenta|setenta|ochenta|noventa|trinta|quarenta|cinquenta|sessenta|oitenta)\b/gi,
    (_, h, t) => String(NUM_MAP[h.toLowerCase()] + NUM_MAP[t.toLowerCase()])
  )
  // Hundreds + units
  r = r.replace(
    /\b(cien|ciento|doscientos|trescientos|cuatrocientos|quinientos|seiscientos|setecientos|ochocientos|novecientos|cem|duzentos|trezentos|quatrocentos|quinhentos|seiscentos|setecentos|oitocentos|novecientos)\s+(uno|un|una|dos|tres|quatro|cuatro|cinco|seis|sete|siete|oito|ocho|nove|nueve)\b/gi,
    (_, h, u) => String(NUM_MAP[h.toLowerCase()] + NUM_MAP[u.toLowerCase()])
  )
  // Single words
  for (const [word, num] of Object.entries(NUM_MAP)) {
    r = r.replace(new RegExp(`\\b${word}\\b`, 'gi'), String(num))
  }
  return r
}

function wordsToNumber(text) {
  // Handle "punto" / "coma" as decimal separator between words
  // "ochenta y uno punto sesenta" → "81.60"
  const decimalMatch = text.match(
    /^(.+?)\s+(?:punto|coma|virgula)\s+(.+)$/i
  )
  if (decimalMatch) {
    const intPart = convertPhrase(decimalMatch[1])
    const decPart = convertPhrase(decimalMatch[2])
    const intDigits = intPart.match(/\d+/)
    const decDigits = decPart.match(/\d+/)
    if (intDigits && decDigits) {
      return intDigits[0] + '.' + decDigits[0]
    }
  }
  return convertPhrase(text)
}

function extractAmount(text) {
  const normalized = wordsToNumber(text)
  const lower = normalized.toLowerCase()

  // Percentage: "70% de 40€"
  const pctMatch = lower.match(/(\d+)\s*%\s*(?:de|do|del)\s*(\d+[.,]?\d*)/)
  if (pctMatch) {
    const pct = parseFloat(pctMatch[1])
    const base = parseFloat(pctMatch[2].replace(',', '.'))
    return Math.round(pct * base / 100 * 100) / 100
  }

  // Priority 1: after explicit keywords ("monto es 80,44", "son 50 euros")
  const afterKeyword = lower.match(/(?:el\s+)?monto\s+(?:es\s+|de\s+)?(\d+[.,]?\d*)|(?:son|fueron|son)\s+(\d+[.,]?\d*)/i)
  if (afterKeyword) {
    const raw = afterKeyword[1] || afterKeyword[2]
    const val = parseFloat(raw.replace(',', '.'))
    if (val > 0 && val < 100000) return val
  }

  // Priority 2: number with € or euros
  const withSymbol = lower.match(/(\d+[.,]?\d*)\s*€|(\d+[.,]?\d*)\s*euros?\b/)
  if (withSymbol) {
    const raw = withSymbol[1] || withSymbol[2]
    const val = parseFloat(raw.replace(',', '.'))
    if (val > 0 && val < 100000) return val
  }

  // Priority 3: after "es de" / "de" (but not from dates like "25 de enero")
  const afterEs = lower.match(/(?:es|son|fueron)\s+(?:de\s+)?(\d+[.,]?\d*)/)
  if (afterEs) {
    const val = parseFloat(afterEs[1].replace(',', '.'))
    if (val > 0 && val < 100000) return val
  }

  // Priority 4: any standalone number (fallback, but skip if followed by "de" + month word)
  const fallback = lower.match(/(\d+[.,]?\d*)\s*(?:€|euros)?\b(?!\s+de\s+(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre|janeiro|fevereiro|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro))/)
  if (fallback) {
    const val = parseFloat(fallback[1].replace(',', '.'))
    if (val > 0 && val < 100000) return val
  }

  return null
}

function extractTrips(text) {
  const normalized = wordsToNumber(text)
  const lower = normalized.toLowerCase()
  // "11 viajes", "fueron 11 viajes", "11 viagens"
  const m = lower.match(/(\d+)\s*(?:viajes?|viagens?|trips?|rides?)/)
  if (m) return parseInt(m[1])
  return null
}

function detectPlatform(text) {
  const lower = text.toLowerCase()
  if (/\buber\b/.test(lower)) return 'uber'
  if (/\bbolt\b/.test(lower)) return 'bolt'
  return 'uber'
}

function parseLocally(transcript) {
  const type = detectType(transcript)
  const amount = extractAmount(transcript)
  const category = detectCategory(transcript, type)
  const date = parseDate(transcript) || today()
  const platform = detectPlatform(transcript)
  const tripsCount = extractTrips(transcript)
  const description = transcript.substring(0, 100)

  return { type, amount, category, date, platform, trips_count: tripsCount, description, confidence: 40 }
}

// ── Gemini API parser ──────────────────────────────────────────────────────

async function parseWithGemini(transcript, apiKey) {
  const prompt = `Eres un asistente que extrae datos de transacciones financieras de textos en español o portugués.

Analiza el siguiente texto y devuelve SOLO un objeto JSON (sin markdown, sin backticks) con estos campos:
{
  "type": "income" o "expense",
  "amount": número (el monto final, si dice "X% de Y" calcula X*Y/100, si dice "ochenta y uno punto sesenta" es 81.60),
  "category": una de las categorías válidas exactas,
  "date": "YYYY-MM-DD" (hoy es ${today()}),
  "platform": una de las plataformas válidas (default: "uber"),
  "trips_count": número de viajes si se menciona (solo para ingresos, null si no aplica),
  "description": descripción breve
}

Categorías válidas para gastos: ${EXPENSE_CATEGORIES.join(', ')}
Categorías válidas para ingresos: ${INCOME_CATEGORIES.join(', ')}
Plataformas: ${PLATFORMS.join(', ')}
Si el usuario dice "viajes" o "viaje", la categoría debe ser "Viajes" (ingreso).
Si el usuario dice "gasolina", "gas", "combustible", la categoría debe ser "Combustible".
Si no se menciona plataforma, usa "uber" por defecto.

Ejemplos:
- "Gaste 30€ en gas en la Galp" → {"type":"expense","amount":30,"category":"Combustible","date":"${today()}","platform":"uber","description":"Gas en la Galp"}
- "Mi factura de gas del 15/05/2026 es de 40€" → {"type":"expense","amount":40,"category":"Combustible","date":"2026-05-15","platform":"uber","description":"Factura de gas"}
- "Registrar el 70% de 40€ de gasolina hoy" → {"type":"expense","amount":28,"category":"Combustible","date":"${today()}","platform":"uber","description":"Gasolina"}
- "Gané 120€ en viajes de Uber" → {"type":"income","amount":120,"category":"Viajes","date":"${today()}","platform":"uber","trips_count":null,"description":"Viajes Uber"}
- "Ingreso de ochenta y uno punto sesenta por viajes" → {"type":"income","amount":81.60,"category":"Viajes","date":"${today()}","platform":"uber","trips_count":null,"description":"Ingreso por viajes"}
- "Ingreso por viajes el 25 de enero el monto es 80,44 fueron 11 viajes" → {"type":"income","amount":80.44,"category":"Viajes","date":"2026-01-25","platform":"uber","trips_count":11,"description":"Ingreso por viajes"}

Texto: "${transcript}"`

  const resp = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.1 },
    }),
  })

  if (!resp.ok) throw new Error(`Gemini API error: ${resp.status}`)

  const data = await resp.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  const parsed = JSON.parse(cleaned)

  const validExpense = EXPENSE_CATEGORIES.includes(parsed.category)
  const validIncome = INCOME_CATEGORIES.includes(parsed.category)
  if (parsed.type === 'expense' && !validExpense) parsed.category = 'Otro'
  if (parsed.type === 'income' && !validIncome) parsed.category = 'Otro'
  if (!PLATFORMS.includes(parsed.platform)) parsed.platform = 'uber'

  return { ...parsed, trips_count: parsed.trips_count || null, confidence: 90 }
}

// ── Orchestrator ───────────────────────────────────────────────────────────

export async function parseVoiceInput(transcript, apiKey) {
  if (apiKey) {
    try {
      return await parseWithGemini(transcript, apiKey)
    } catch (err) {
      console.warn('Gemini parsing failed, using local fallback:', err.message)
    }
  }
  return parseLocally(transcript)
}
