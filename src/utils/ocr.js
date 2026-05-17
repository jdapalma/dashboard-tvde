import Tesseract from 'tesseract.js'

export async function processImage(imageFile) {
  const result = await Tesseract.recognize(imageFile, 'por', {
    logger: (m) => console.log(m),
  })

  const text = result.data.text
  return {
    text,
    confidence: result.data.confidence,
    extracted: extractFields(text),
  }
}

function extractFields(text) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)

  // Try to extract amount (look for numbers with commas or dots)
  let amount = null
  const amountPatterns = [
    /(?:total|valor|montante|amount)[\s:]*([0-9]+[.,][0-9]{2})/i,
    /([0-9]+[.,][0-9]{2})/,
  ]
  for (const pattern of amountPatterns) {
    const match = text.match(pattern)
    if (match) {
      amount = parseFloat(match[1].replace(',', '.'))
      break
    }
  }

  // Try to extract date
  let date = null
  const datePatterns = [
    /(\d{2})[\/.-](\d{2})[\/.-](\d{4})/,
    /(\d{4})[\/.-](\d{2})[\/.-](\d{2})/,
  ]
  for (const pattern of datePatterns) {
    const match = text.match(pattern)
    if (match) {
      if (match[3] && match[3].length === 4) {
        date = `${match[3]}-${match[2]}-${match[1]}`
      } else {
        date = `${match[1]}-${match[2]}-${match[3]}`
      }
      break
    }
  }

  // First meaningful line as description
  const description = lines[0] || null

  return { amount, date, description }
}
