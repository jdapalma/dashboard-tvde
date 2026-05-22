import Tesseract from 'tesseract.js'

const OCR_SPACE_URL = 'https://api.ocr.space/parse/image'
const OCR_API_KEY = import.meta.env.VITE_OCR_API_KEY

// ── OCR.space API (primary) ────────────────────────────────────────────────

async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function ocrSpaceRecognize(file, onProgress) {
  const report = (msg, pct) => onProgress?.(msg, pct)

  report('Subiendo imagen...', 10)
  const base64 = await fileToBase64(file)

  report('Enviando a OCR.space...', 30)
  const body = new URLSearchParams()
  body.append('base64Image', `data:image/jpeg;base64,${base64}`)
  body.append('language', 'por')
  body.append('isOverlayRequired', 'false')
  body.append('OCREngine', '2') // Engine 2 is better for receipts

  report('Procesando factura...', 50)
  const resp = await fetch(OCR_SPACE_URL, {
    method: 'POST',
    headers: {
      apikey: OCR_API_KEY,
    },
    body,
  })

  if (!resp.ok) {
    throw new Error(`OCR.space error: ${resp.status}`)
  }

  const data = await resp.json()

  if (data.IsErroredOnProcessing) {
    throw new Error(data.ErrorMessage?.[0] || 'OCR.space processing error')
  }

  report('Extrayendo datos...', 90)
  const parsed = data.ParsedResults?.[0]
  const text = parsed?.ParsedText || ''
  const confidence = parsed?.FileParseExitCode === 1 ? 85 : 50

  report('Listo', 100)
  return { text, confidence, extracted: extractFields(text) }
}

// ── Tesseract fallback ─────────────────────────────────────────────────────

async function tesseractRecognize(file, onProgress) {
  const report = (msg, pct) => onProgress?.(msg, pct)

  report('Preprocesando imagen...', 10)
  const processed = await preprocessImage(file)

  report('Analizando texto (Tesseract)...', 30)
  const result = await Tesseract.recognize(processed, 'por', {
    logger: (m) => {
      if (m.status === 'recognizing text' && m.progress) {
        const pct = 30 + Math.round(m.progress * 60)
        report('Reconociendo caracteres...', pct)
      }
    },
  })

  report('Extrayendo datos...', 95)
  const text = result.data.text

  report('Listo', 100)
  return {
    text,
    confidence: result.data.confidence,
    extracted: extractFields(text),
  }
}

// ── Main entry ─────────────────────────────────────────────────────────────

export async function processImage(file, onProgress) {
  // Try OCR.space first if key is configured
  if (OCR_API_KEY) {
    try {
      return await ocrSpaceRecognize(file, onProgress)
    } catch (err) {
      console.warn('OCR.space failed, falling back to Tesseract:', err.message)
    }
  }

  // Fallback to local Tesseract
  return tesseractRecognize(file, onProgress)
}

// ── Tesseract preprocessing (used only in fallback) ─────────────────────────

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    if (src instanceof Blob) {
      img.src = URL.createObjectURL(src)
    } else {
      img.src = src
    }
  })
}

function toGrayscale(imageData) {
  const d = imageData.data
  for (let i = 0; i < d.length; i += 4) {
    const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]
    d[i] = d[i + 1] = d[i + 2] = gray
  }
  return imageData
}

function enhanceContrast(imageData, factor = 1.8) {
  const d = imageData.data
  const intercept = 128 * (1 - factor)
  for (let i = 0; i < d.length; i += 4) {
    d[i] = Math.min(255, Math.max(0, d[i] * factor + intercept))
    d[i + 1] = Math.min(255, Math.max(0, d[i + 1] * factor + intercept))
    d[i + 2] = Math.min(255, Math.max(0, d[i + 2] * factor + intercept))
  }
  return imageData
}

function threshold(imageData, cutoff = 140) {
  const d = imageData.data
  for (let i = 0; i < d.length; i += 4) {
    const val = d[i] >= cutoff ? 255 : 0
    d[i] = d[i + 1] = d[i + 2] = val
  }
  return imageData
}

function sharpen(imageData, w, h) {
  const src = new Uint8ClampedArray(imageData.data)
  const dst = imageData.data
  const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0]

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      for (let c = 0; c < 3; c++) {
        let sum = 0
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * w + (x + kx)) * 4 + c
            sum += src[idx] * kernel[(ky + 1) * 3 + (kx + 1)]
          }
        }
        dst[(y * w + x) * 4 + c] = Math.min(255, Math.max(0, sum))
      }
    }
  }
  return imageData
}

async function preprocessImage(file) {
  const img = await loadImage(file)

  const maxDim = 2000
  let w = img.naturalWidth
  let h = img.naturalHeight
  if (w > maxDim || h > maxDim) {
    const scale = maxDim / Math.max(w, h)
    w = Math.round(w * scale)
    h = Math.round(h * scale)
  }

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0, w, h)

  let imageData = ctx.getImageData(0, 0, w, h)
  imageData = toGrayscale(imageData)
  imageData = enhanceContrast(imageData, 1.8)
  imageData = sharpen(imageData, w, h)
  imageData = threshold(imageData, 140)

  ctx.putImageData(imageData, 0, 0)
  return canvas
}

// ── Field extraction ────────────────────────────────────────────────────────

function extractFields(text) {
  const full = text.replace(/\n/g, ' ')
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)

  // Amount
  let amount = null
  const amountPatterns = [
    /(?:total\s*(?:a\s*pagar|geral|liq|liquido)?)\s*[:\s]*(\d+[.,]\d{2})\b/i,
    /(?:montante|valor|amount|pre[cç]o)\s*[:\s]*(\d+[.,]\d{2})\b/i,
    /(\d+[.,]\d{2})\s*(?:€|EUR)?\s*$/i,
    /(\d+[.,]\d{2})/,
  ]
  for (const pattern of amountPatterns) {
    const match = full.match(pattern)
    if (match) {
      const raw = match[1].replace(',', '.')
      const val = parseFloat(raw)
      if (val > 0 && val < 10000) {
        amount = val
        break
      }
    }
  }

  // Date
  let date = null
  const datePatterns = [
    /(\d{2})[\/.-](\d{2})[\/.-](\d{4})/,
    /(\d{4})[\/.-](\d{2})[\/.-](\d{2})/,
    /(\d{2})[\/.-](\d{2})[\/.-](\d{2})\b/,
  ]
  for (const pattern of datePatterns) {
    const match = full.match(pattern)
    if (match) {
      if (match[3] && match[3].length === 4) {
        date = `${match[3]}-${match[2]}-${match[1]}`
      } else if (match[3] && match[3].length === 2) {
        date = `20${match[3]}-${match[2]}-${match[1]}`
      } else {
        date = `${match[1]}-${match[2]}-${match[3]}`
      }
      break
    }
  }

  // Description
  let description = null
  for (const line of lines) {
    if (line.length > 3 && !/^\d+[.,]?\d*$/.test(line)) {
      description = line.substring(0, 80)
      break
    }
  }

  return { amount, date, description }
}
