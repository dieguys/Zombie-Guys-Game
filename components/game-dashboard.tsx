"use client"

import { useState, useEffect, useRef } from "react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Sun,
  Moon,
  Users,
  Shield,
  Wallet,
  Coins,
  ChevronDown,
  ChevronUp,
  Sword,
  Hammer,
  Search,
  Heart,
} from "lucide-react"
import type { GameState } from "../types/game"
import type { Resources } from "../types/game"
import { WalletIntegration } from "./wallet-integration"
import { ResourcePanel } from "./resource-panel"
import { SurvivorPanel } from "./survivor-panel"
import { BaseBuilder } from "./base-builder"
import type { Survivor } from "../types/game"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

// Default initial game state
const initialGameState: GameState = {
  isDay: true,
  dayCount: 1,
  timeRemaining: 300,
  isIdle: false,
  baseHealth: 0, // Start with 0 base health (no base)
  maxBaseHealth: 0, // Start with 0 max base health (no base)
  hasBase: false, // Start without a base
  gems: 0, // Start with 0 SOL
  coins: 0, // Start with 0 ZMB
  survivors: [], // No active survivors initially
  structures: [], // No structures initially
  resources: {
    wood: 0,
    metal: 0,
    food: 0,
    medicine: 0,
    ammunition: 0,
  },
  wallet: {
    address: "5YNmS1R9nNSCDzb5a7mMJ1dwK9uHeAAF4CerVnwgX5r", // Solana-style address
    balance: "0", // Start with 0 SOL
    tokenBalance: 0, // Start with 0 ZMB
    isConnected: true,
  },
}

// Exchange rates
const gameRates = {
  usdPerSol: 200,
  zmbPerSol: 100000, // 100,000 ZMB per SOL
  // Resource rates against ZMB
  wood: 50, // 50 ZMB per WOOD (2,000 per SOL)
  metal: 150, // 150 ZMB per MET (666.67 per SOL)
  food: 80, // 80 ZMB per FOOD (1,250 per SOL)
  medicine: 250, // 250 ZMB per MED (400 per SOL)
  ammunition: 200, // 200 ZMB per AMM (500 per SOL)
}

// Gacha box settings
const gachaBoxSettings = {
  initialSurvivors: 10, // Start with 10 survivors in the gacha box
  survivorCostPercent: 0.05, // 5% of ZMB balance
}

// Health recovery settings
const healthRecoverySettings = {
  tickInterval: 5000, // 5 seconds per tick
  healthPerTick: 5, // 5 health points per tick
}

// Base level settings
const baseLevels = [
  {
    level: 1,
    name: "Survival Shelter",
    maxSurvivors: 1,
  },
  {
    level: 2,
    name: "Fortified Outpost",
    maxSurvivors: 2,
  },
  {
    level: 3,
    name: "Survivor Camp",
    maxSurvivors: 3,
  },
  {
    level: 4,
    name: "Defensive Compound",
    maxSurvivors: 4,
  },
  {
    level: 5,
    name: "Fortified Settlement",
    maxSurvivors: 6,
  },
  {
    level: 6,
    name: "Survivor Stronghold",
    maxSurvivors: 8,
  },
  {
    level: 7,
    name: "Walled Community",
    maxSurvivors: 10,
  },
  {
    level: 8,
    name: "Fortified Township",
    maxSurvivors: 12,
  },
  {
    level: 9,
    name: "Survivor Citadel",
    maxSurvivors: 15,
  },
  {
    level: 10,
    name: "Apocalypse Fortress",
    maxSurvivors: 20,
  },
]

// Night duration settings
const calculateNightDuration = (dayCount: number) => {
  // Start with 30 seconds for the first night
  // Increase by 30 seconds each night
  // Cap at 300 seconds (5 minutes)
  const duration = Math.min(30 * dayCount, 300)
  return duration
}

// Night time survival rules
const nightTimeRules = {
  // Resource depletion rules
  resourceDepletion: {
    withBase:
      "When a player has a base, zombies attack the base during the night and resources are depleted based on the base's resource requirements.",
    withoutBase: "Without a base, only ammunition is depleted from the inventory during the night.",
    ammunitionUse: "Ammunition is required to fight zombies effectively during the night.",
  },
  // Combat rules
  combat: {
    ranged:
      "Survivors use ammunition to fight zombies at range, which is more effective and results in less health loss.",
    melee:
      "If a player runs out of ammunition, survivors switch to melee combat, which is less effective and results in more health loss.",
    healthLoss: "Survivor health loss during the night is reduced by their defense stat.",
  },
  // Base damage rules
  baseDamage: {
    calculation:
      "Base damage during the night is affected by the number of active survivors (more survivors attract more zombies).",
    repair: "Damaged bases can be repaired during the day phase using resources.",
  },
}

export default function GameDashboard() {
  const [showRates, setShowRates] = useState(false)
  const ratesRef = useRef<HTMLDivElement>(null)
  const healthRecoveryTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Add state for night phase notification
  const [showNightSummary, setShowNightSummary] = useState(false)
  const [nightSummary, setNightSummary] = useState({
    healthLost: 0,
    resourcesLost: {
      ammunition: 0,
    },
    baseDamage: 0,
  })

  // Initialize game state from session storage or use default
  const [gameState, setGameState] = useState<GameState>(() => {
    // Only run in browser environment
    if (typeof window !== "undefined") {
      const savedState = sessionStorage.getItem("settleMintsGameState")
      if (savedState) {
        try {
          return JSON.parse(savedState)
        } catch (e) {
          console.error("Failed to parse saved game state:", e)
        }
      }
    }
    return initialGameState
  })

  // In the rates object, extract the resource rates
  const resourceRates = {
    wood: gameRates.wood,
    metal: gameRates.metal,
    food: gameRates.food,
    medicine: gameRates.medicine,
    ammunition: gameRates.ammunition,
  }

  const [activeTab, setActiveTab] = useState<"base" | "survivors" | "wallet">("wallet") // Start on wallet tab
  const [gachaBoxCount, setGachaBoxCount] = useState(gachaBoxSettings.initialSurvivors)
  const [baseLevel, setBaseLevel] = useState(1)
  const [killsConfirmed, setKillsConfirmed] = useState(0)

  // Add a new state for character preview
  const [showCharacterPreview, setShowCharacterPreview] = useState(false)

  // Add a function to generate all 10 characters for preview with fixed stats
  const generateCharacterPreview = () => {
    const names = ["Alex", "Maya", "Zoe", "Sam", "Riley", "Jordan", "Taylor", "Casey", "Morgan", "Quinn"]
    const specialties = ["fighter", "builder", "scavenger", "medic"] as const

    return names.map((name, index) => {
      // Assign specialties in a pattern to ensure diversity
      const specialty = specialties[index % specialties.length]

      // Base stats - fixed values instead of random
      let attack = 15
      let defense = 10
      const health = 90

      // Adjust stats based on specialty
      if (specialty === "fighter") {
        attack = 25 // Fighters get high attack
        defense = 12
      } else if (specialty === "builder") {
        attack = 12
        defense = 20 // Builders get high defense
      } else if (specialty === "scavenger") {
        attack = 18 // Scavengers get balanced stats
        defense = 15
      } else if (specialty === "medic") {
        attack = 10 // Medics get lower combat stats
        defense = 12
      }

      return {
        id: `preview-${index}`,
        name,
        level: 1,
        health,
        maxHealth: 100,
        attack,
        defense,
        specialty,
        isActive: true,
      }
    })
  }

  // Save game state to session storage whenever it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("settleMintsGameState", JSON.stringify(gameState))
    }
  }, [gameState])

  // Game timer
  useEffect(() => {
    const timer = setInterval(() => {
      setGameState((prev) => {
        // Calculate the appropriate duration based on whether it's day or night
        const timeLimit = prev.isDay ? 300 : calculateNightDuration(prev.dayCount)

        // Check if we're transitioning from night to day (when timer hits 0 and it's night)
        const isNightToDayTransition = prev.timeRemaining <= 0 && !prev.isDay

        // Handle night-to-day transition (resource depletion and health loss)
        if (isNightToDayTransition) {
          // Calculate resource depletion
          const newResources = { ...prev.resources }
          let newBaseHealth = prev.baseHealth
          let newSurvivors = [...prev.survivors]

          // Deplete resources based on whether player has a base or not
          if (prev.hasBase) {
            // With a base: zombies attack the base and deplete resources from base requirements
            // Calculate base resource requirements
            const currentBase = baseLevels[baseLevel - 1]
            const activeCount = prev.survivors.filter((s) => s.isActive).length

            // Deplete base health based on active survivors and base level
            // More survivors = more zombies attracted = more damage to base
            const baseDamage = 10 + activeCount * 5 + Math.floor(Math.random() * 10)
            newBaseHealth = Math.max(0, prev.baseHealth - baseDamage)
          } else {
            // Without a base: only ammunition is depleted from inventory
            // Each active survivor uses some ammunition
            const activeCount = prev.survivors.filter((s) => s.isActive).length
            const ammoUsed = 5 * activeCount + Math.floor(Math.random() * 5)
            newResources.ammunition = Math.max(0, prev.resources.ammunition - ammoUsed)
          }

          // Deplete health from all active survivors
          newSurvivors = prev.survivors.map((survivor) => {
            if (survivor.isActive) {
              // Calculate health loss based on survivor's defense and whether they have ammunition
              const hasAmmo = prev.resources.ammunition > 0
              const healthLoss = hasAmmo
                ? 5 + Math.floor(Math.random() * 10) - Math.floor(survivor.defense / 4)
                : 15 + Math.floor(Math.random() * 15) - Math.floor(survivor.defense / 3)

              // Ensure health loss is at least 1 and doesn't exceed current health
              const actualHealthLoss = Math.max(1, Math.min(survivor.health - 1, healthLoss))

              return {
                ...survivor,
                health: survivor.health - actualHealthLoss,
              }
            }
            return survivor
          })

          // Calculate summary for night phase
          const activeCount = prev.survivors.filter((s) => s.isActive).length
          let totalHealthLost = 0
          let ammoUsed = 0
          let baseDamage = 0

          if (prev.hasBase) {
            // Calculate base damage
            baseDamage = 10 + activeCount * 5 + Math.floor(Math.random() * 10)
          } else {
            // Calculate ammo used
            ammoUsed = 5 * activeCount + Math.floor(Math.random() * 5)
          }

          // Calculate total health lost
          prev.survivors.forEach((survivor, index) => {
            if (survivor.isActive) {
              const hasAmmo = prev.resources.ammunition > 0
              const healthLoss = hasAmmo
                ? 5 + Math.floor(Math.random() * 10) - Math.floor(survivor.defense / 4)
                : 15 + Math.floor(Math.random() * 15) - Math.floor(survivor.defense / 3)

              const actualHealthLoss = Math.max(1, Math.min(survivor.health - 1, healthLoss))
              totalHealthLost += actualHealthLoss
            }
          })

          // Set night summary
          setNightSummary({
            healthLost: totalHealthLost,
            resourcesLost: {
              ammunition: ammoUsed,
            },
            baseDamage: baseDamage,
          })

          // Show night summary dialog
          setTimeout(() => {
            setShowNightSummary(true)
          }, 500)

          return {
            ...prev,
            timeRemaining: 300, // Reset timer for day phase
            isDay: true, // Switch to day
            dayCount: prev.dayCount + 1, // Increment day count only after night phase is complete
            resources: newResources,
            baseHealth: newBaseHealth,
            survivors: newSurvivors,
          }
        } else if (prev.timeRemaining <= 0) {
          // Transition from day to night
          return {
            ...prev,
            timeRemaining: timeLimit, // Set timer based on calculated night duration
            isDay: false, // Switch to night
            // Don't increment day count here - day count only changes after night phase
          }
        } else {
          // Normal timer tick
          return {
            ...prev,
            timeRemaining: prev.timeRemaining - 1,
          }
        }
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [baseLevel])

  // Health recovery timer for resting survivors
  useEffect(() => {
    // Check if there are any resting survivors
    const hasRestingSurvivors = gameState.survivors.some((survivor) => !survivor.isActive)

    if (hasRestingSurvivors) {
      // Start the health recovery timer if it's not already running
      if (!healthRecoveryTimerRef.current) {
        healthRecoveryTimerRef.current = setInterval(() => {
          setGameState((prev) => {
            // Create a new survivors array with updated health for resting survivors
            const updatedSurvivors = prev.survivors.map((survivor) => {
              if (!survivor.isActive && survivor.health < survivor.maxHealth) {
                // Increase health by the recovery amount, but don't exceed max health
                const newHealth = Math.min(survivor.health + healthRecoverySettings.healthPerTick, survivor.maxHealth)
                return { ...survivor, health: newHealth }
              }
              return survivor
            })

            return {
              ...prev,
              survivors: updatedSurvivors,
            }
          })
        }, healthRecoverySettings.tickInterval)
      }
    } else {
      // Clear the timer if there are no resting survivors
      if (healthRecoveryTimerRef.current) {
        clearInterval(healthRecoveryTimerRef.current)
        healthRecoveryTimerRef.current = null
      }
    }

    // Clean up the timer when the component unmounts
    return () => {
      if (healthRecoveryTimerRef.current) {
        clearInterval(healthRecoveryTimerRef.current)
        healthRecoveryTimerRef.current = null
      }
    }
  }, [gameState.survivors])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ratesRef.current && !ratesRef.current.contains(event.target as Node)) {
        setShowRates(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Reset game function - can be called to start fresh
  const resetGame = () => {
    setGameState(initialGameState)
    setGachaBoxCount(gachaBoxSettings.initialSurvivors)
    sessionStorage.removeItem("settleMintsGameState")
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const calculateBaseHealth = () => {
    if (!gameState.hasBase) {
      return { totalHealth: 0, totalMaxHealth: 0 }
    }

    // Get current base data
    const currentBase = baseLevels[baseLevel - 1]

    // Calculate max base health based on base level
    const maxHealth = 100 + (baseLevel - 1) * 50

    const currentHealth = gameState.baseHealth

    return { totalHealth: currentHealth, totalMaxHealth: Math.round(maxHealth) }
  }

  const { totalHealth, totalMaxHealth } = calculateBaseHealth()

  const toggleRates = () => {
    setShowRates(!showRates)
  }

  // Handle SOL top up
  const handleTopUp = () => {
    setGameState((prev) => {
      const newSolBalance = prev.gems + 1
      return {
        ...prev,
        gems: newSolBalance,
        wallet: {
          ...prev.wallet,
          balance: newSolBalance.toString(),
        },
      }
    })
  }

  // Handle SOL to ZMB conversion
  const handleBuyZMB = (solAmount: number) => {
    if (solAmount <= 0 || solAmount > gameState.gems) return

    const zmbAmount = solAmount * gameRates.zmbPerSol

    setGameState((prev) => ({
      ...prev,
      gems: prev.gems - solAmount,
      coins: prev.coins + zmbAmount,
      wallet: {
        ...prev.wallet,
        balance: (prev.gems - solAmount).toString(),
        tokenBalance: prev.wallet.tokenBalance + zmbAmount,
      },
    }))
  }

  // Handle buying a resource
  const handleBuyResource = (resource: keyof Resources, amount: number, cost: number) => {
    setGameState((prev) => ({
      ...prev,
      coins: prev.coins - cost,
      resources: {
        ...prev.resources,
        [resource]: prev.resources[resource] + amount,
      },
    }))
  }

  // Handle repairing a structure
  const handleRepairStructure = (structureId: string, cost: { zmb: number; resources: Partial<Resources> }) => {
    setGameState((prev) => {
      // Find the structure to repair
      const structureIndex = prev.structures.findIndex((s) => s.id === structureId)
      if (structureIndex === -1) return prev

      const structure = prev.structures[structureIndex]

      // Create a new structures array with the repaired structure
      const newStructures = [...prev.structures]
      newStructures[structureIndex] = {
        ...structure,
        health: structure.maxHealth, // Fully repair
        isActive: true, // Activate if it was damaged
      }

      // Update resources
      const newResources = { ...prev.resources }
      Object.entries(cost.resources).forEach(([resource, amount]) => {
        newResources[resource as keyof Resources] -= amount
      })

      return {
        ...prev,
        coins: prev.coins - cost.zmb,
        resources: newResources,
        structures: newStructures,
      }
    })
  }

  // Handle building a base (new function)
  const handleBuildBase = (cost: { zmb: number; resources: Partial<Resources> }) => {
    setGameState((prev) => {
      // Deduct resources and ZMB
      const newResources = { ...prev.resources }
      Object.entries(cost.resources).forEach(([resource, amount]) => {
        newResources[resource as keyof Resources] -= amount
      })

      // Set base health to max for level 1
      const maxHealth = 100 // Level 1 base health

      return {
        ...prev,
        coins: prev.coins - cost.zmb,
        resources: newResources,
        hasBase: true,
        baseHealth: maxHealth,
        maxBaseHealth: maxHealth,
      }
    })

    // Set base level to 1
    setBaseLevel(1)
  }

  // Handle repairing the base
  const handleRepairBase = (cost: { zmb: number; resources: Partial<Resources> }) => {
    setGameState((prev) => {
      // Deduct resources and ZMB
      const newResources = { ...prev.resources }
      Object.entries(cost.resources).forEach(([resource, amount]) => {
        newResources[resource as keyof Resources] -= amount
      })

      // Calculate max health based on base level
      const maxHealth = 100 + (baseLevel - 1) * 50

      return {
        ...prev,
        coins: prev.coins - cost.zmb,
        resources: newResources,
        baseHealth: maxHealth, // Fully repair the base
      }
    })
  }

  // Handle upgrading the base
  const handleUpgradeBase = (level: number, cost: { zmb: number; resources: Partial<Resources> }) => {
    setGameState((prev) => {
      // Update resources
      const newResources = { ...prev.resources }
      Object.entries(cost.resources).forEach(([resource, amount]) => {
        newResources[resource as keyof Resources] -= amount
      })

      // Calculate new max health based on new level
      const maxHealth = 100 + (level - 1) * 50

      return {
        ...prev,
        coins: prev.coins - cost.zmb,
        resources: newResources,
        baseHealth: maxHealth, // Set to full health after upgrade
        maxBaseHealth: maxHealth,
      }
    })

    // Update base level
    setBaseLevel(level)
  }

  // Handle upgrading a structure
  const handleUpgradeStructure = (structureId: string, cost: { zmb: number; resources: Partial<Resources> }) => {
    setGameState((prev) => {
      // Find the structure to upgrade
      const structureIndex = prev.structures.findIndex((s) => s.id === structureId)
      if (structureIndex === -1) return prev

      const structure = prev.structures[structureIndex]

      // Calculate new max health (20% increase per level)
      const newMaxHealth = Math.round(structure.maxHealth * 1.2)

      // Create a new structures array with the upgraded structure
      const newStructures = [...prev.structures]
      newStructures[structureIndex] = {
        ...structure,
        level: structure.level + 1,
        maxHealth: newMaxHealth,
        health: structure.health, // Keep current health
      }

      // Update resources
      const newResources = { ...prev.resources }
      Object.entries(cost.resources).forEach(([resource, amount]) => {
        newResources[resource as keyof Resources] -= amount
      })

      return {
        ...prev,
        coins: prev.coins - cost.zmb,
        resources: newResources,
        structures: newStructures,
      }
    })
  }

  // Handle building a structure
  const handleBuildStructure = (type: string, cost: Partial<Resources>) => {
    setGameState((prev) => {
      // Create a new structure
      const newStructure = {
        id: `structure-${Date.now()}`, // Generate a unique ID
        type: type as "wall" | "turret" | "generator" | "medical" | "storage",
        level: 1,
        health: type === "wall" ? 200 : type === "turret" ? 150 : 100, // Different base health per type
        maxHealth: type === "wall" ? 200 : type === "turret" ? 150 : 100,
        position: { x: Math.floor(Math.random() * 5), y: Math.floor(Math.random() * 5) }, // Random position
        isActive: true,
      }

      // Update resources
      const newResources = { ...prev.resources }
      Object.entries(cost).forEach(([resource, amount]) => {
        newResources[resource as keyof Resources] -= amount
      })

      return {
        ...prev,
        resources: newResources,
        structures: [...prev.structures, newStructure],
      }
    })
  }

  // Handle buying a survivor from gacha box
  const handleBuySurvivor = () => {
    if (gachaBoxCount <= 0 || gameState.coins <= 0) return

    // Calculate cost as 5% of current ZMB balance
    const cost = Math.round(gameState.coins * gachaBoxSettings.survivorCostPercent)

    // Generate a random survivor
    const specialties = ["builder", "fighter", "scavenger", "medic"] as const
    const names = ["Alex", "Maya", "Zoe", "Sam", "Riley", "Jordan", "Taylor", "Casey", "Morgan", "Quinn"]

    // Check if this is the first survivor (should be active) or additional survivors (should be resting)
    const isFirstSurvivor = gameState.survivors.length === 0
    const activeSurvivors = gameState.survivors.filter((s) => s.isActive).length
    const maxActiveSurvivors = gameState.hasBase ? baseLevels[baseLevel - 1].maxSurvivors : 1 // If no base, only 1 active survivor
    const shouldBeActive = isFirstSurvivor || activeSurvivors < maxActiveSurvivors

    // Randomly select a specialty and name
    const specialty = specialties[Math.floor(Math.random() * specialties.length)]
    const name = names[Math.floor(Math.random() * names.length)]

    // Base stats
    let attack = 10 + Math.floor(Math.random() * 15)
    let defense = 5 + Math.floor(Math.random() * 15)

    // Adjust stats based on specialty
    if (specialty === "fighter") {
      attack = 20 + Math.floor(Math.random() * 10) // Fighters get 20-30 attack
    } else if (specialty === "builder") {
      defense = 15 + Math.floor(Math.random() * 10) // Builders get 15-25 defense
    } else if (specialty === "scavenger") {
      // Scavengers get balanced stats
      attack = 15 + Math.floor(Math.random() * 10)
      defense = 10 + Math.floor(Math.random() * 10)
    } else if (specialty === "medic") {
      // Medics get slightly lower combat stats
      attack = 8 + Math.floor(Math.random() * 12)
      defense = 10 + Math.floor(Math.random() * 10)
    }

    const newSurvivor = {
      id: `survivor-${Date.now()}`,
      name,
      level: 1,
      health: 80 + Math.floor(Math.random() * 20), // 80-100 health
      maxHealth: 100,
      attack,
      defense,
      specialty,
      isActive: shouldBeActive, // Only active if it's the first survivor or we're under the limit
    }

    setGameState((prev) => ({
      ...prev,
      coins: prev.coins - cost,
      survivors: [...prev.survivors, newSurvivor],
    }))

    setGachaBoxCount((prev) => prev - 1)
  }

  // Handle selling a survivor
  const handleSellSurvivor = (survivorId: string) => {
    setGameState((prev) => {
      // Find the survivor
      const survivorIndex = prev.survivors.findIndex((s) => s.id === survivorId)
      if (survivorIndex === -1) return prev

      const survivor = prev.survivors[survivorIndex]

      // Calculate sell value based on level and stats
      const baseValue = Math.round(prev.coins * 0.03) // 3% of current ZMB
      const levelBonus = survivor.level * 0.2 // 20% per level
      const sellValue = Math.round(baseValue * (1 + levelBonus))

      // Remove survivor from array
      const newSurvivors = [...prev.survivors]
      newSurvivors.splice(survivorIndex, 1)

      return {
        ...prev,
        coins: prev.coins + sellValue,
        survivors: newSurvivors,
      }
    })
  }

  // Handle killing a survivor for a gacha token
  const handleKillSurvivor = (survivorId: string) => {
    setGameState((prev) => {
      // Find the survivor
      const survivorIndex = prev.survivors.findIndex((s) => s.id === survivorId)
      if (survivorIndex === -1) return prev

      // Remove survivor from array
      const newSurvivors = [...prev.survivors]
      newSurvivors.splice(survivorIndex, 1)

      return {
        ...prev,
        survivors: newSurvivors,
      }
    })

    // Add a token to the gacha box
    setGachaBoxCount((prev) => prev + 1)

    // Increment kills confirmed
    setKillsConfirmed((prev) => prev + 1)
  }

  // Calculate resource cost for resting based on survivor specialty
  const calculateRestCost = (survivor: Survivor) => {
    const healthPercentage = survivor.health / survivor.maxHealth
    const healthMissing = 1 - healthPercentage

    // Base resource costs
    let resourceCost: Partial<Resources> = {}

    // Adjust costs based on specialty
    switch (survivor.specialty) {
      case "builder":
        resourceCost = {
          wood: Math.max(1, Math.round(10 * healthMissing)), // Builders use more wood
          metal: Math.max(1, Math.round(5 * healthMissing)),
          food: Math.max(1, Math.round(3 * healthMissing)),
          medicine: Math.max(1, Math.round(1 * healthMissing)),
          ammunition: 0, // Builders don't use ammunition
        }
        break
      case "fighter":
        resourceCost = {
          wood: Math.max(1, Math.round(2 * healthMissing)),
          metal: Math.max(1, Math.round(3 * healthMissing)),
          food: Math.max(1, Math.round(5 * healthMissing)), // Fighters eat more
          medicine: Math.max(1, Math.round(2 * healthMissing)),
          ammunition: Math.max(1, Math.round(5 * healthMissing)), // Fighters use more ammunition
        }
        break
      case "scavenger":
        resourceCost = {
          wood: Math.max(1, Math.round(3 * healthMissing)),
          metal: Math.max(1, Math.round(2 * healthMissing)),
          food: Math.max(1, Math.round(4 * healthMissing)),
          medicine: Math.max(1, Math.round(1 * healthMissing)),
          ammunition: Math.max(1, Math.round(3 * healthMissing)),
        }
        break
      case "medic":
        resourceCost = {
          wood: Math.max(1, Math.round(2 * healthMissing)),
          metal: Math.max(1, Math.round(2 * healthMissing)),
          food: Math.max(1, Math.round(3 * healthMissing)),
          medicine: Math.max(1, Math.round(6 * healthMissing)), // Medics use more medicine
          ammunition: Math.max(1, Math.round(1 * healthMissing)),
        }
        break
      default:
        resourceCost = {
          wood: Math.max(1, Math.round(3 * healthMissing)),
          metal: Math.max(1, Math.round(3 * healthMissing)),
          food: Math.max(1, Math.round(3 * healthMissing)),
          medicine: Math.max(1, Math.round(3 * healthMissing)),
          ammunition: Math.max(1, Math.round(3 * healthMissing)),
        }
    }

    // ZMB cost is the same regardless of specialty
    const zmbCost = Math.round(20 * healthMissing)

    return { zmb: zmbCost, resources: resourceCost }
  }

  // Handle resting a survivor
  const handleRestSurvivor = (survivorId: string, cost: { zmb: number; resources: Partial<Resources> }) => {
    setGameState((prev) => {
      // Find the survivor
      const survivorIndex = prev.survivors.findIndex((s) => s.id === survivorId)
      if (survivorIndex === -1) return prev

      const survivor = prev.survivors[survivorIndex]

      // Create a new survivors array with the updated survivor
      const newSurvivors = [...prev.survivors]

      if (survivor.isActive) {
        // If active, set to resting and deduct resources
        newSurvivors[survivorIndex] = {
          ...survivor,
          isActive: false,
        }

        // Update resources
        const newResources = { ...prev.resources }

        // If player has a base, deduct from base health instead of inventory
        if (prev.hasBase) {
          // Calculate total resource cost
          let totalResourceCost = 0
          Object.values(cost.resources).forEach((amount) => {
            totalResourceCost += amount
          })

          // Deduct from base health
          const newBaseHealth = Math.max(0, prev.baseHealth - totalResourceCost)

          return {
            ...prev,
            coins: prev.coins - cost.zmb,
            baseHealth: newBaseHealth,
            survivors: newSurvivors,
          }
        } else {
          // No base, deduct directly from inventory
          Object.entries(cost.resources).forEach(([resource, amount]) => {
            newResources[resource as keyof Resources] = Math.max(0, newResources[resource as keyof Resources] - amount)
          })

          return {
            ...prev,
            coins: prev.coins - cost.zmb,
            resources: newResources,
            survivors: newSurvivors,
          }
        }
      } else {
        // Check if activating would exceed the max active survivors limit
        const currentActiveCount = prev.survivors.filter((s) => s.isActive).length
        const maxActiveSurvivors = prev.hasBase ? baseLevels[baseLevel - 1].maxSurvivors : 1 // If no base, only 1 active survivor

        if (currentActiveCount >= maxActiveSurvivors) {
          // Cannot activate more survivors
          return prev
        }

        // If resting, set to active (no cost)
        newSurvivors[survivorIndex] = {
          ...survivor,
          isActive: true,
        }

        return {
          ...prev,
          survivors: newSurvivors,
        }
      }
    })
  }

  // Handle claiming daily bonus
  const handleClaimBonus = () => {
    setGameState((prev) => ({
      ...prev,
      coins: prev.coins + 50, // Add 50 ZMB bonus
      wallet: {
        ...prev.wallet,
        tokenBalance: prev.wallet.tokenBalance + 50,
      },
    }))
  }

  // Add the new function to handle buying from secondary market
  const handleBuyFromSecondary = (survivorData: Partial<Survivor>, price: number) => {
    // Check if player has enough ZMB
    if (gameState.coins < price) return

    // Check if this is the first survivor (should be active) or additional survivors (should be resting)
    const isFirstSurvivor = gameState.survivors.length === 0
    const activeSurvivors = gameState.survivors.filter((s) => s.isActive).length
    const maxActiveSurvivors = gameState.hasBase ? baseLevels[baseLevel - 1].maxSurvivors : 1 // If no base, only 1 active survivor
    const shouldBeActive = isFirstSurvivor || activeSurvivors < maxActiveSurvivors

    // Generate a new survivor based on the purchased data
    const newSurvivor = {
      id: `survivor-${Date.now()}`,
      name: survivorData.name || "Unknown",
      level: survivorData.level || 1,
      health: survivorData.health || 80,
      maxHealth: survivorData.maxHealth || 100,
      attack: survivorData.attack || 15,
      defense: survivorData.defense || 10,
      specialty: survivorData.specialty || "fighter",
      isActive: shouldBeActive,
      isStarter: survivorData.isStarter || false, // Preserve the isStarter property
    }

    // Update game state
    setGameState((prev) => ({
      ...prev,
      coins: prev.coins - price,
      survivors: [...prev.survivors, newSurvivor],
    }))
  }

  // New function to handle going to night
  const handleGoToNight = () => {
    // Only set timeRemaining to 5 if it's currently day
    if (gameState.isDay) {
      setGameState((prev) => ({
        ...prev,
        timeRemaining: 5,
      }))
    }
  }

  return (
    <div className="w-full max-w-md mx-auto bg-gradient-to-b from-slate-900 to-slate-800 text-white min-h-screen">
      {/* Header */}
      <div className="p-4 border-b border-slate-700 relative">
        <div className="flex items-center justify-between mb-3" onClick={toggleRates}>
          <div className="flex items-center cursor-pointer" onClick={toggleRates}>
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-ZnVCO1B9eqZ9q6v0PC8nGTtw58qFb0.png"
              alt="SettleMints"
              className="h-8"
            />
            {showRates ? (
              <ChevronUp className="ml-1 w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="ml-1 w-4 h-4 text-slate-400" />
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Coins className="w-5 h-5 text-yellow-400" />
              <span className="text-lg font-bold text-yellow-400">{gameState.coins.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-5 h-5 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                <span className="text-xs font-bold text-white">SOL</span>
              </div>
              <span className="text-lg font-bold text-purple-400">{gameState.gems.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Exchange Rates Dropdown */}
        {showRates && (
          <div
            ref={ratesRef}
            className="absolute top-full left-0 right-0 z-10 bg-slate-800 border border-slate-700 rounded-b-lg shadow-lg p-3 animate-in fade-in slide-in-from-top-5 duration-200"
          >
            <div className="text-xs font-medium text-slate-400 mb-2">EXCHANGE RATES</div>

            {/* Main Currency Rates */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-slate-700/50 p-2 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">USD / SOL</span>
                  <span className="text-xs font-medium text-white">${gameRates.usdPerSol}</span>
                </div>
              </div>
              <div className="bg-slate-700/50 p-2 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">ZMB / SOL</span>
                  <span className="text-xs font-medium text-white">{gameRates.zmbPerSol.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Resource Rates */}
            <div className="text-xs font-medium text-slate-400 mb-2">RESOURCE RATES</div>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-slate-700/50 p-2 rounded-lg">
                <div className="flex flex-col">
                  <span className="text-xs text-amber-400">WOOD</span>
                  <span className="text-xs font-medium text-white">1 = {gameRates.wood} ZMB</span>
                </div>
              </div>
              <div className="bg-slate-700/50 p-2 rounded-lg">
                <div className="flex flex-col">
                  <span className="text-xs text-slate-400">MET</span>
                  <span className="text-xs font-medium text-white">1 = {gameRates.metal} ZMB</span>
                </div>
              </div>
              <div className="bg-slate-700/50 p-2 rounded-lg">
                <div className="flex flex-col">
                  <span className="text-xs text-green-400">FOOD</span>
                  <span className="text-xs font-medium text-white">1 = {gameRates.food} ZMB</span>
                </div>
              </div>
              <div className="bg-slate-700/50 p-2 rounded-lg">
                <div className="flex flex-col">
                  <span className="text-xs text-red-400">MED</span>
                  <span className="text-xs font-medium text-white">1 = {gameRates.medicine} ZMB</span>
                </div>
              </div>
              <div className="bg-slate-700/50 p-2 rounded-lg">
                <div className="flex flex-col">
                  <span className="text-xs text-yellow-400">AMM</span>
                  <span className="text-xs font-medium text-white">1 = {gameRates.ammunition} ZMB</span>
                </div>
              </div>
            </div>

            <div className="text-[10px] text-slate-500 mt-3 text-center">
              Rates fluctuate based on market conditions
            </div>
          </div>
        )}

        {/* Day/Night Cycle */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {gameState.isDay ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-blue-400" />}
            <span className="text-sm font-medium">
              Day {gameState.dayCount} {gameState.isDay ? "- Building Phase" : "- Night Phase"}
            </span>
          </div>
          <Badge variant={gameState.isDay ? "default" : "destructive"}>
            {gameState.isDay ? "Time until night: " : "Time until day: "}
            {formatTime(gameState.timeRemaining)}
          </Badge>
        </div>

        {/* Base Health - Only show if player has a base */}
        {gameState.hasBase && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Base Health
              </span>
              <span>
                {totalHealth}/{totalMaxHealth}
              </span>
            </div>
            <Progress
              value={totalMaxHealth > 0 ? (totalHealth / totalMaxHealth) * 100 : 0}
              className={`h-2 ${
                totalHealth / totalMaxHealth > 0.7
                  ? "bg-green-500"
                  : totalHealth / totalMaxHealth > 0.3
                    ? "bg-yellow-500"
                    : "bg-red-500"
              }`}
            />
          </div>
        )}

        {/* No Base Message - Show if player doesn't have a base */}
        {!gameState.hasBase && (
          <div className="bg-slate-700/50 p-2 rounded-lg text-xs text-center">
            <span className="text-yellow-400">No Base Established</span>
            <p className="text-slate-400 mt-1">Build a base to increase survivor capacity and resource efficiency</p>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-700">
        {[
          { id: "base", label: "Base", icon: Shield },
          { id: "survivors", label: "Survivorz", icon: Users },
          { id: "wallet", label: "Wallet", icon: Wallet },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`flex-1 flex items-center justify-center gap-1 py-3 text-xs font-medium transition-colors ${
              activeTab === id ? "text-green-400 border-b-2 border-green-400" : "text-slate-400 hover:text-white"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "base" && (
          <div className="p-4 space-y-4">
            <ResourcePanel
              resources={gameState.resources}
              zmbBalance={gameState.coins}
              exchangeRates={resourceRates}
              onBuyResource={handleBuyResource}
            />
            <BaseBuilder
              baseLevel={baseLevel}
              baseHealth={gameState.baseHealth}
              resources={gameState.resources}
              isDay={gameState.isDay}
              zmbBalance={gameState.coins}
              survivorCount={gameState.survivors.length}
              killsConfirmed={killsConfirmed}
              onRepairBase={handleRepairBase}
              onUpgradeBase={handleUpgradeBase}
              onBuildBase={handleBuildBase}
              hasBase={gameState.hasBase}
            />
          </div>
        )}

        {activeTab === "survivors" && (
          <div className="p-4">
            {showCharacterPreview ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium text-white">Character Preview</h3>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowCharacterPreview(false)}
                    className="text-xs"
                  >
                    Back to Survivors
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {generateCharacterPreview().map((character) => (
                    <Card key={character.id} className="bg-slate-800 border-slate-700">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm text-white flex items-center gap-2">
                            {character.specialty === "fighter" ? (
                              <Sword className="w-4 h-4 text-red-400" />
                            ) : character.specialty === "builder" ? (
                              <Hammer className="w-4 h-4 text-blue-400" />
                            ) : character.specialty === "scavenger" ? (
                              <Search className="w-4 h-4 text-green-400" />
                            ) : (
                              <Heart className="w-4 h-4 text-pink-400" />
                            )}
                            {character.name}
                            <Badge variant="secondary" className="text-xs">
                              Lv.{character.level}
                            </Badge>
                          </CardTitle>
                          <Badge variant="default">
                            {character.specialty.charAt(0).toUpperCase() + character.specialty.slice(1)}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 flex items-center gap-1">
                              <Sword className="w-3 h-3" />
                              Attack
                            </span>
                            <span className="text-white font-medium">{character.attack}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 flex items-center gap-1">
                              <Shield className="w-3 h-3" />
                              Defense
                            </span>
                            <span className="text-white font-medium">{character.defense}</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400">Health</span>
                            <span className="text-white">
                              {character.health}/{character.maxHealth}
                            </span>
                          </div>
                          <Progress value={(character.health / character.maxHealth) * 100} className="h-1" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <SurvivorPanel
                  survivors={gameState.survivors}
                  gachaBoxCount={gachaBoxCount}
                  zmbBalance={gameState.coins}
                  resources={gameState.resources}
                  maxActiveSurvivors={gameState.hasBase ? baseLevels[baseLevel - 1].maxSurvivors : 1}
                  onBuySurvivor={handleBuySurvivor}
                  onSellSurvivor={handleSellSurvivor}
                  onKillSurvivor={handleKillSurvivor}
                  onRestSurvivor={handleRestSurvivor}
                  onBuyFromSecondary={handleBuyFromSecondary}
                  hasBase={gameState.hasBase}
                  calculateRestCost={calculateRestCost}
                  onShowCharacterPreview={() => setShowCharacterPreview(true)}
                />
              </>
            )}
          </div>
        )}

        {activeTab === "wallet" && (
          <div className="p-4">
            <WalletIntegration
              wallet={gameState.wallet}
              onTopUp={handleTopUp}
              onBuyZMB={handleBuyZMB}
              onClaimBonus={handleClaimBonus}
              onGoToNight={handleGoToNight}
            />
          </div>
        )}
      </div>
      {/* Night Summary Dialog */}
      <Dialog open={showNightSummary} onOpenChange={setShowNightSummary}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white p-4 max-w-[90vw] w-full sm:max-w-md">
          <DialogHeader className="pb-2">
            <DialogTitle className="flex items-center gap-2 text-blue-400 text-lg">
              <Moon className="w-5 h-5" />
              Night Survival Report
            </DialogTitle>
            <DialogDescription className="text-slate-300 text-sm">
              Your survivors made it through the night!
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-3">
            {gameState.hasBase ? (
              <div className="bg-slate-700 p-3 rounded-lg">
                <p className="text-sm text-white mb-2">Base Status:</p>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-300">Base Damage:</span>
                  <span className="text-xs font-medium text-red-400">-{nightSummary.baseDamage} HP</span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Current Health</span>
                    <span className="text-white">
                      {gameState.baseHealth}/{totalMaxHealth}
                    </span>
                  </div>
                  <Progress
                    value={(gameState.baseHealth / totalMaxHealth) * 100}
                    className={`h-1 ${
                      gameState.baseHealth / totalMaxHealth > 0.7
                        ? "bg-green-500"
                        : gameState.baseHealth / totalMaxHealth > 0.3
                          ? "bg-yellow-500"
                          : "bg-red-500"
                    }`}
                  />
                </div>
              </div>
            ) : (
              <div className="bg-slate-700 p-3 rounded-lg">
                <p className="text-sm text-white mb-2">Resources Used:</p>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-yellow-400">Ammunition:</span>
                  <span className="text-xs font-medium text-red-400">-{nightSummary.resourcesLost.ammunition}</span>
                </div>
                <div className="text-xs text-slate-400 mt-2">
                  Your survivors used ammunition to defend themselves through the night.
                </div>
              </div>
            )}

            <div className="bg-slate-700 p-3 rounded-lg">
              <p className="text-sm text-white mb-2">Survivor Status:</p>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-300">Total Health Lost:</span>
                <span className="text-xs font-medium text-red-400">-{nightSummary.healthLost} HP</span>
              </div>
              <div className="text-xs text-slate-400 mt-2">
                {gameState.resources.ammunition > 0
                  ? "Your survivors fought off zombies with their weapons."
                  : "Your survivors had to fight in melee, taking more damage!"}
              </div>
            </div>
          </div>
          <div className="flex justify-center">
            <Button
              className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm"
              onClick={() => setShowNightSummary(false)}
            >
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
