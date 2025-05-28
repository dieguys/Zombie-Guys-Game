"use client"

import { useState, useEffect, useRef } from "react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Sun, Moon, Users, Shield, Wallet, Coins, ChevronDown, ChevronUp } from "lucide-react"
import type { GameState } from "../types/game"
import type { Resources } from "../types/game"
import { WalletIntegration } from "./wallet-integration"
import { ResourcePanel } from "./resource-panel"
import { SurvivorPanel } from "./survivor-panel"
import { BaseBuilder } from "./base-builder"
import type { Survivor } from "../types/game"

// Default initial game state
const initialGameState: GameState = {
  isDay: true,
  dayCount: 1,
  timeRemaining: 30, // Start with 30 seconds instead of 300
  isIdle: false,
  baseHealth: 100,
  maxBaseHealth: 100,
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

export default function GameDashboard() {
  const [showRates, setShowRates] = useState(false)
  const ratesRef = useRef<HTMLDivElement>(null)
  const healthRecoveryTimerRef = useRef<NodeJS.Timeout | null>(null)

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
  const [dayLength, setDayLength] = useState(30) // Start with 30 seconds

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
        // Check if time is up
        if (prev.timeRemaining <= 0) {
          // Day/night transition
          const newIsDay = !prev.isDay
          const newDayCount = prev.dayCount + (prev.isDay ? 1 : 0)

          // Calculate new day length when transitioning to a new day
          let newDayLength = dayLength
          if (newIsDay && newDayCount > prev.dayCount) {
            // Increase day length by 30 seconds each day, up to 5 minutes (300 seconds)
            newDayLength = Math.min(30 * newDayCount, 300)
            setDayLength(newDayLength)
          }

          return {
            ...prev,
            timeRemaining: newDayLength, // Use the new day length
            isDay: newIsDay,
            dayCount: newDayCount,
          }
        }

        // Just decrement time
        return {
          ...prev,
          timeRemaining: prev.timeRemaining - 1,
        }
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [dayLength])

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
    // Base health is now the sum of all resources
    const totalHealth =
      gameState.resources.wood +
      gameState.resources.metal +
      gameState.resources.food +
      gameState.resources.medicine +
      gameState.resources.ammunition

    // Max health scales with base level
    const baseMaxHealth = baseLevel * 500 // 500 HP per level

    return { totalHealth, totalMaxHealth: baseMaxHealth }
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

  // Handle repairing the base
  const handleRepairBase = (cost: { zmb: number; resources: Partial<Resources> }) => {
    setGameState((prev) => {
      // Calculate current total resources as health
      const currentHealth =
        prev.resources.wood +
        prev.resources.metal +
        prev.resources.food +
        prev.resources.medicine +
        prev.resources.ammunition

      return {
        ...prev,
        coins: prev.coins - cost.zmb,
        baseHealth: currentHealth, // Set base health to current resource total
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

      return {
        ...prev,
        coins: prev.coins - cost.zmb,
        resources: newResources,
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

    const newSurvivor = {
      id: `survivor-${Date.now()}`,
      name: names[Math.floor(Math.random() * names.length)],
      level: 1,
      health: 80 + Math.floor(Math.random() * 20), // 80-100 health
      maxHealth: 100,
      attack: 10 + Math.floor(Math.random() * 15), // 10-25 attack
      defense: 5 + Math.floor(Math.random() * 15), // 5-20 defense
      specialty: specialties[Math.floor(Math.random() * specialties.length)],
      isActive: true,
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
        Object.entries(cost.resources).forEach(([resource, amount]) => {
          newResources[resource as keyof Resources] -= amount
        })

        return {
          ...prev,
          coins: prev.coins - cost.zmb,
          resources: newResources,
          survivors: newSurvivors,
        }
      } else {
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
      isActive: true,
    }

    // Update game state
    setGameState((prev) => ({
      ...prev,
      coins: prev.coins - price,
      survivors: [...prev.survivors, newSurvivor],
    }))
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
              Day {gameState.dayCount} - {gameState.isDay ? "Building Phase" : "Survival Phase"}
            </span>
          </div>
          <Badge variant={gameState.isDay ? "default" : "destructive"}>
            {gameState.isDay ? "Time until night: " : "Time until day: "}
            {formatTime(gameState.timeRemaining)}
          </Badge>
        </div>

        {/* Base Health */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1">
              <Shield className="w-3 h-3" />
              Base Health
            </span>
            <span>
              {gameState.baseHealth}/{totalMaxHealth}
            </span>
          </div>
          <Progress value={totalMaxHealth > 0 ? (gameState.baseHealth / totalMaxHealth) * 100 : 0} className="h-2" />
        </div>
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
            />
          </div>
        )}

        {activeTab === "survivors" && (
          <div className="p-4">
            <SurvivorPanel
              survivors={gameState.survivors}
              gachaBoxCount={gachaBoxCount}
              zmbBalance={gameState.coins}
              resources={gameState.resources}
              onBuySurvivor={handleBuySurvivor}
              onSellSurvivor={handleSellSurvivor}
              onKillSurvivor={handleKillSurvivor}
              onRestSurvivor={handleRestSurvivor}
              onBuyFromSecondary={handleBuyFromSecondary}
            />
          </div>
        )}

        {activeTab === "wallet" && (
          <div className="p-4">
            <WalletIntegration
              wallet={gameState.wallet}
              onTopUp={handleTopUp}
              onBuyZMB={handleBuyZMB}
              onClaimBonus={handleClaimBonus}
            />
          </div>
        )}
      </div>
    </div>
  )
}
