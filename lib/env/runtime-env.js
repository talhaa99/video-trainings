import fs from 'fs'
import path from 'path'

let loaded = false

function parseEnvFile(content) {
  const result = {}
  const lines = content.split(/\r?\n/)

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue

    const separatorIndex = line.indexOf('=')
    if (separatorIndex === -1) continue

    const key = line.slice(0, separatorIndex).trim()
    let value = line.slice(separatorIndex + 1).trim()

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }

    if (key) {
      result[key] = value
    }
  }

  return result
}

function loadFromFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return
  }

  const parsed = parseEnvFile(fs.readFileSync(filePath, 'utf8'))
  for (const [key, value] of Object.entries(parsed)) {
    if (process.env[key] === undefined) {
      process.env[key] = value
    }
  }
}

export function ensureRuntimeEnvLoaded() {
  if (loaded) {
    return
  }

  loaded = true
  const cwd = process.cwd()

  // Next.js auto-loads root env files, but this keeps backward compatibility
  // for existing setups that place secrets in data/.env.
  loadFromFile(path.join(cwd, '.env.local'))
  loadFromFile(path.join(cwd, '.env'))
  loadFromFile(path.join(cwd, 'data', '.env.local'))
  loadFromFile(path.join(cwd, 'data', '.env'))
}
