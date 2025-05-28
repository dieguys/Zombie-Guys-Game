export interface Survivor {
  id: string
  name: string
  level: number
  health: number
  maxHealth: number
  attack: number
  defense: number
  specialty: "builder" | "fighter" | "scavenger" | "medic"
  isActive: boolean
}

export interface BaseStructure {
  id: string
  type: "wall" | "turret" | "generator" | "medical" | "storage"
  level: number
  health: number
  maxHealth: number
  position: { x: number; y: number }
  isActive: boolean
}

export interface Resources {
  wood: number
  metal: number
  food: number
  medicine: number
  ammunition: number
}

export interface WalletData {
  address: string // Solana public key
  balance: string // SOL balance
  tokenBalance: number // ZMB token balance
  isConnected: boolean
}

export interface GameState {
  isDay: boolean
  dayCount: number
  timeRemaining: number
  isIdle: boolean
  baseHealth: number
  maxBaseHealth: number
  survivors: Survivor[]
  structures: BaseStructure[]
  resources: Resources
  wallet: WalletData
  gems: number
  coins: number
}
