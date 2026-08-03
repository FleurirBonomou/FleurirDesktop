import { spawn, type ChildProcess } from 'child_process'
import { existsSync } from 'fs'
import { join } from 'path'
import net from 'node:net'

const DEFAULT_SERVER_PATH = '/home/bonomou/Code/FleurirServer'
const DEFAULT_SERVER_PORT = 8082
const START_TIMEOUT_MS = 15_000

let child: ChildProcess | null = null
let startAttempted = false

function resolveServerPath(): string {
  return process.env['FLEURIR_SERVER_PATH'] ?? DEFAULT_SERVER_PATH
}

function resolveServerPort(): number {
  const raw = process.env['FLEURIR_SERVER_PORT']
  const port = raw === undefined ? NaN : Number(raw)
  return Number.isInteger(port) && port > 0 ? port : DEFAULT_SERVER_PORT
}

/** Vrai si quelque chose écoute déjà sur 127.0.0.1:port. */
function isPortListening(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket()
    const done = (result: boolean): void => {
      socket.destroy()
      resolve(result)
    }
    socket.setTimeout(1500)
    socket.once('error', () => done(false))
    socket.once('timeout', () => done(false))
    socket.connect(port, '127.0.0.1', () => done(true))
  })
}

/** Attend que le serveur réponde sur le port (ou que le délai expire). */
async function waitForPort(port: number, timeoutMs: number): Promise<boolean> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (await isPortListening(port)) return true
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  return false
}

/**
 * Lance le serveur Fleurir s'il ne tourne pas déjà, et attend qu'il réponde.
 * Préfère le serveur compilé (dist/index.js) ; à défaut démarre le code source
 * via tsx (utile en développement sans build). Chemin configurable via
 * FLEURIR_SERVER_PATH.
 */
export async function startServer(): Promise<void> {
  if (startAttempted) return
  startAttempted = true

  const port = resolveServerPort()
  if (await isPortListening(port)) {
    console.log(`[server] le port ${port} répond déjà : serveur non relancé.`)
    return
  }

  const serverPath = resolveServerPath()
  const distEntry = join(serverPath, 'dist', 'index.js')
  const srcEntry = join(serverPath, 'src', 'index.ts')

  let command: string
  let args: string[]
  if (existsSync(distEntry)) {
    command = 'node'
    args = [distEntry]
  } else if (existsSync(srcEntry)) {
    command = 'npx'
    args = ['tsx', 'src/index.ts']
  } else {
    console.error(`[server] introuvable dans ${serverPath} (ni dist/index.js ni src/index.ts).`)
    return
  }

  console.log(`[server] démarrage : ${command} ${args.join(' ')} (dans ${serverPath})`)
  child = spawn(command, args, {
    cwd: serverPath,
    env: { ...process.env, PORT: String(port) },
    stdio: 'inherit'
  })
  child.on('error', (error) => {
    console.error('[server] échec du lancement :', error)
    child = null
  })
  child.on('exit', (code, signal) => {
    console.log(`[server] arrêté (${code ?? signal}).`)
    child = null
  })

  if (await waitForPort(port, START_TIMEOUT_MS)) {
    console.log(`[server] prêt sur le port ${port}.`)
  } else {
    console.error(`[server] pas de réponse sur le port ${port} après ${START_TIMEOUT_MS} ms.`)
  }
}

/** Tue le serveur lancé par l'app (ne touche pas à un serveur déjà présent). */
export function stopServer(): void {
  if (child && !child.killed) {
    child.kill()
  }
  child = null
  startAttempted = false
}
