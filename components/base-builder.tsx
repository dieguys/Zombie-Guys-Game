"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Home, Zap, Shield, Target, Package, ArrowUp, Users, Hammer, Skull } from "lucide-react"
import type { Resources } from "../types/game"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

// Define base levels with their properties
const baseLevels = [
  {
    level: 1,
    name: "Survival Shelter",
    description: "A basic shelter to survive the night",
    maxSurvivors: 1,
    resourcePerSurvivor: {
      wood: 50,
      metal: 20,
      food: 50,
      medicine: 10,
      ammunition: 5,
    },
    hpMultiplier: {
      wood: 0.5,
      metal: 1.0,
      food: 0.2,
      medicine: 0.3,
      ammunition: 0.1,
    },
    upgradeCost: {
      wood: 100,
      metal: 50,
      food: 75,
      medicine: 25,
      ammunition: 10,
      zmb: 200,
    },
    killsRequired: 5,
  },
  {
    level: 2,
    name: "Fortified Outpost",
    description: "A reinforced shelter with basic defenses",
    maxSurvivors: 2,
    resourcePerSurvivor: {
      wood: 75,
      metal: 30,
      food: 75,
      medicine: 15,
      ammunition: 10,
    },
    hpMultiplier: {
      wood: 0.6,
      metal: 1.2,
      food: 0.25,
      medicine: 0.35,
      ammunition: 0.15,
    },
    upgradeCost: {
      wood: 200,
      metal: 100,
      food: 150,
      medicine: 50,
      ammunition: 25,
      zmb: 500,
    },
    killsRequired: 15,
  },
  {
    level: 3,
    name: "Survivor Camp",
    description: "A small camp with room for more survivors",
    maxSurvivors: 3,
    resourcePerSurvivor: {
      wood: 100,
      metal: 50,
      food: 100,
      medicine: 25,
      ammunition: 20,
    },
    hpMultiplier: {
      wood: 0.7,
      metal: 1.4,
      food: 0.3,
      medicine: 0.4,
      ammunition: 0.2,
    },
    upgradeCost: {
      wood: 400,
      metal: 200,
      food: 300,
      medicine: 100,
      ammunition: 50,
      zmb: 1000,
    },
    killsRequired: 30,
  },
  {
    level: 4,
    name: "Defensive Compound",
    description: "A compound with improved defenses",
    maxSurvivors: 4,
    resourcePerSurvivor: {
      wood: 150,
      metal: 75,
      food: 150,
      medicine: 40,
      ammunition: 35,
    },
    hpMultiplier: {
      wood: 0.8,
      metal: 1.6,
      food: 0.35,
      medicine: 0.45,
      ammunition: 0.25,
    },
    upgradeCost: {
      wood: 700,
      metal: 400,
      food: 500,
      medicine: 200,
      ammunition: 100,
      zmb: 2000,
    },
    killsRequired: 50,
  },
  {
    level: 5,
    name: "Fortified Settlement",
    description: "A well-defended settlement with multiple structures",
    maxSurvivors: 6,
    resourcePerSurvivor: {
      wood: 200,
      metal: 100,
      food: 200,
      medicine: 60,
      ammunition: 50,
    },
    hpMultiplier: {
      wood: 0.9,
      metal: 1.8,
      food: 0.4,
      medicine: 0.5,
      ammunition: 0.3,
    },
    upgradeCost: {
      wood: 1200,
      metal: 700,
      food: 800,
      medicine: 350,
      ammunition: 200,
      zmb: 4000,
    },
    killsRequired: 100,
  },
  {
    level: 6,
    name: "Survivor Stronghold",
    description: "A stronghold capable of withstanding serious attacks",
    maxSurvivors: 8,
    resourcePerSurvivor: {
      wood: 250,
      metal: 150,
      food: 250,
      medicine: 80,
      ammunition: 75,
    },
    hpMultiplier: {
      wood: 1.0,
      metal: 2.0,
      food: 0.45,
      medicine: 0.55,
      ammunition: 0.35,
    },
    upgradeCost: {
      wood: 2000,
      metal: 1200,
      food: 1500,
      medicine: 600,
      ammunition: 400,
      zmb: 8000,
    },
    killsRequired: 200,
  },
  {
    level: 7,
    name: "Walled Community",
    description: "A community protected by high walls and watchtowers",
    maxSurvivors: 10,
    resourcePerSurvivor: {
      wood: 350,
      metal: 200,
      food: 350,
      medicine: 100,
      ammunition: 100,
    },
    hpMultiplier: {
      wood: 1.1,
      metal: 2.2,
      food: 0.5,
      medicine: 0.6,
      ammunition: 0.4,
    },
    upgradeCost: {
      wood: 3500,
      metal: 2000,
      food: 2500,
      medicine: 1000,
      ammunition: 750,
      zmb: 15000,
    },
    killsRequired: 350,
  },
  {
    level: 8,
    name: "Fortified Township",
    description: "A small township with advanced defenses and infrastructure",
    maxSurvivors: 12,
    resourcePerSurvivor: {
      wood: 450,
      metal: 300,
      food: 450,
      medicine: 150,
      ammunition: 150,
    },
    hpMultiplier: {
      wood: 1.2,
      metal: 2.4,
      food: 0.55,
      medicine: 0.65,
      ammunition: 0.45,
    },
    upgradeCost: {
      wood: 5000,
      metal: 3000,
      food: 4000,
      medicine: 1500,
      ammunition: 1200,
      zmb: 25000,
    },
    killsRequired: 500,
  },
  {
    level: 9,
    name: "Survivor Citadel",
    description: "A citadel with formidable defenses and self-sustainability",
    maxSurvivors: 15,
    resourcePerSurvivor: {
      wood: 600,
      metal: 400,
      food: 600,
      medicine: 200,
      ammunition: 200,
    },
    hpMultiplier: {
      wood: 1.3,
      metal: 2.6,
      food: 0.6,
      medicine: 0.7,
      ammunition: 0.5,
    },
    upgradeCost: {
      wood: 8000,
      metal: 5000,
      food: 6000,
      medicine: 2500,
      ammunition: 2000,
      zmb: 50000,
    },
    killsRequired: 750,
  },
  {
    level: 10,
    name: "Apocalypse Fortress",
    description: "The ultimate fortress, nearly impenetrable",
    maxSurvivors: 20,
    resourcePerSurvivor: {
      wood: 800,
      metal: 600,
      food: 800,
      medicine: 300,
      ammunition: 300,
    },
    hpMultiplier: {
      wood: 1.5,
      metal: 3.0,
      food: 0.7,
      medicine: 0.8,
      ammunition: 0.6,
    },
    upgradeCost: null, // Max level, no upgrade cost
    killsRequired: 0, // Max level, no kills required
  },
]

interface BaseBuilderProps {
  baseLevel: number
  baseHealth: number
  resources: Resources
  isDay: boolean
  zmbBalance: number
  survivorCount: number
  killsConfirmed: number
  onRepairBase: (cost: { zmb: number; resources: Partial<Resources> }) => void
  onUpgradeBase: (level: number, cost: { zmb: number; resources: Partial<Resources> }) => void
}

export function BaseBuilder({
  baseLevel = 1,
  baseHealth = 100,
  resources,
  isDay,
  zmbBalance,
  survivorCount,
  killsConfirmed = 0,
  onRepairBase,
  onUpgradeBase,
}: BaseBuilderProps) {
  const [showRepairConfirm, setShowRepairConfirm] = useState(false)
  const [showUpgradeConfirm, setShowUpgradeConfirm] = useState(false)

  // Get current base data
  const currentBase = baseLevels[baseLevel - 1]
  const nextBase = baseLevel < 10 ? baseLevels[baseLevel] : null

  // Calculate max base health based on inventory and multipliers
  const calculateMaxBaseHealth = () => {
    let maxHealth = 100 // Base health

    // Add health from resources based on multipliers
    Object.entries(currentBase.hpMultiplier).forEach(([resource, multiplier]) => {
      maxHealth += resources[resource as keyof Resources] * multiplier
    })

    return Math.round(maxHealth)
  }

  const maxBaseHealth = calculateMaxBaseHealth()

  // Calculate required resources for current survivor count
  const calculateRequiredResources = () => {
    const required: Partial<Resources> = {}

    Object.entries(currentBase.resourcePerSurvivor).forEach(([resource, amount]) => {
      required[resource as keyof Resources] = amount * survivorCount
    })

    return required
  }

  // Check if player has enough resources to support current survivors
  const hasEnoughResourcesForSurvivors = () => {
    const required = calculateRequiredResources()

    for (const [resource, amount] of Object.entries(required)) {
      if (resources[resource as keyof Resources] < amount) return false
    }

    return true
  }

  // Calculate repair cost based on missing health percentage
  const getRepairCost = () => {
    const healthPercentage = baseHealth / maxBaseHealth
    const healthMissing = 1 - healthPercentage

    // Base ZMB cost
    const zmbCost = Math.round(currentBase.level * 50 * healthMissing)

    // Resource costs - scale with level and missing health
    const resourceCost: Partial<Resources> = {
      wood: Math.round(currentBase.level * 10 * healthMissing),
      metal: Math.round(currentBase.level * 5 * healthMissing),
      food: Math.round(currentBase.level * 2 * healthMissing),
      medicine: Math.round(currentBase.level * healthMissing),
      ammunition: Math.round(currentBase.level * healthMissing),
    }

    return { zmb: zmbCost, resources: resourceCost }
  }

  // Check if player can afford repair
  const canAffordRepair = () => {
    const cost = getRepairCost()

    if (zmbBalance < cost.zmb) return false

    // Check if player has enough resources
    for (const [resource, amount] of Object.entries(cost.resources)) {
      if (resources[resource as keyof Resources] < amount) return false
    }

    return true
  }

  // Check if player can afford upgrade
  const canAffordUpgrade = () => {
    if (!nextBase || !nextBase.upgradeCost) return false

    // Check if player has enough kills
    if (killsConfirmed < nextBase.killsRequired) return false

    if (zmbBalance < nextBase.upgradeCost.zmb) return false

    // Check if player has enough resources
    for (const [resource, amount] of Object.entries(nextBase.upgradeCost)) {
      if (resource === "zmb") continue // Skip ZMB check as we did it above
      if (resources[resource as keyof Resources] < amount) return false
    }

    return true
  }

  const handleRepairClick = () => {
    setShowRepairConfirm(true)
  }

  const handleUpgradeClick = () => {
    setShowUpgradeConfirm(true)
  }

  const handleConfirmRepair = () => {
    const cost = getRepairCost()
    onRepairBase(cost)
    setShowRepairConfirm(false)
  }

  const handleConfirmUpgrade = () => {
    if (nextBase && nextBase.upgradeCost) {
      const cost = {
        zmb: nextBase.upgradeCost.zmb,
        resources: {
          wood: nextBase.upgradeCost.wood,
          metal: nextBase.upgradeCost.metal,
          food: nextBase.upgradeCost.food,
          medicine: nextBase.upgradeCost.medicine,
          ammunition: nextBase.upgradeCost.ammunition,
        },
      }
      onUpgradeBase(baseLevel + 1, cost)
    }
    setShowUpgradeConfirm(false)
  }

  // Get base icon based on level
  const getBaseIcon = (level: number) => {
    if (level <= 3) return Home
    if (level <= 6) return Shield
    if (level <= 9) return Target
    return Package
  }

  const BaseIcon = getBaseIcon(baseLevel)

  return (
    <div className="space-y-4">
      {/* Repair Confirmation Dialog */}
      <Dialog open={showRepairConfirm} onOpenChange={setShowRepairConfirm}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Hammer className="w-5 h-5" />
              Confirm Repair
            </DialogTitle>
            <DialogDescription className="text-slate-300 pt-2">
              Repair your {currentBase.name} to restore its health.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center gap-4 py-4">
            <div className="text-center">
              <p className="text-sm text-slate-300">Current Health:</p>
              <p className="text-lg font-bold text-white">
                {baseHealth}/{maxBaseHealth}
              </p>
              <Progress value={(baseHealth / maxBaseHealth) * 100} className="h-2 w-32 mt-1" />
            </div>

            <div className="bg-slate-700 p-3 rounded-lg w-full">
              <p className="text-sm font-medium text-white mb-2">Cost:</p>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-yellow-400">ZMB</span>
                <span className="text-xs font-medium text-white">{getRepairCost().zmb}</span>
              </div>

              {Object.entries(getRepairCost().resources).map(([resource, amount]) => (
                <div key={resource} className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-400 capitalize">{resource}</span>
                  <span
                    className={`text-xs font-medium ${
                      resources[resource as keyof Resources] >= amount ? "text-white" : "text-red-400"
                    }`}
                  >
                    {amount}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-center gap-3">
            <Button variant="outline" onClick={() => setShowRepairConfirm(false)} className="mt-2">
              Cancel
            </Button>
            <Button
              className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-6"
              onClick={handleConfirmRepair}
              disabled={!canAffordRepair()}
            >
              Repair
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upgrade Confirmation Dialog */}
      <Dialog open={showUpgradeConfirm} onOpenChange={setShowUpgradeConfirm}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <ArrowUp className="w-5 h-5" />
              Confirm Upgrade
            </DialogTitle>
            <DialogDescription className="text-slate-300 pt-2">Upgrade your base to {nextBase?.name}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center gap-4 py-4">
            {nextBase && (
              <>
                <div className="text-center">
                  <p className="text-sm text-slate-300">Base Level:</p>
                  <p className="text-lg font-bold text-white">
                    {baseLevel} → {baseLevel + 1}
                  </p>
                </div>

                <div className="bg-slate-700 p-3 rounded-lg w-full">
                  <p className="text-sm font-medium text-white mb-2">Upgrade Benefits:</p>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-400">Max Survivors</span>
                    <span className="text-xs font-medium text-white">
                      {currentBase.maxSurvivors} → {nextBase.maxSurvivors}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-400">HP Multipliers</span>
                    <span className="text-xs font-medium text-green-400">Increased</span>
                  </div>
                </div>

                <div className="bg-slate-700 p-3 rounded-lg w-full">
                  <p className="text-sm font-medium text-white mb-2">Requirements:</p>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Skull className="w-3 h-3" />
                      Kills Confirmed
                    </span>
                    <span
                      className={`text-xs font-medium ${killsConfirmed >= nextBase.killsRequired ? "text-green-400" : "text-red-400"}`}
                    >
                      {killsConfirmed}/{nextBase.killsRequired}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-700 p-3 rounded-lg w-full">
                  <p className="text-sm font-medium text-white mb-2">Cost:</p>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-yellow-400">ZMB</span>
                    <span className="text-xs font-medium text-white">{nextBase.upgradeCost?.zmb}</span>
                  </div>

                  {nextBase.upgradeCost &&
                    Object.entries(nextBase.upgradeCost).map(([resource, amount]) => {
                      if (resource === "zmb") return null // Skip ZMB as we already displayed it
                      return (
                        <div key={resource} className="flex items-center justify-between mb-1">
                          <span className="text-xs text-slate-400 capitalize">{resource}</span>
                          <span
                            className={`text-xs font-medium ${
                              resources[resource as keyof Resources] >= amount ? "text-white" : "text-red-400"
                            }`}
                          >
                            {amount}
                          </span>
                        </div>
                      )
                    })}
                </div>
              </>
            )}
          </div>
          <div className="flex justify-center gap-3">
            <Button variant="outline" onClick={() => setShowUpgradeConfirm(false)} className="mt-2">
              Cancel
            </Button>
            <Button
              className="mt-2 bg-green-600 hover:bg-green-700 text-white px-6"
              onClick={handleConfirmUpgrade}
              disabled={!canAffordUpgrade()}
            >
              Upgrade
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Current Base Status */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2 text-white">
            <BaseIcon className="w-4 h-4 text-blue-400" />
            {currentBase.name}
            <Badge variant="secondary" className="text-xs">
              Level {baseLevel}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 space-y-3">
          <div className="text-xs text-slate-400">{currentBase.description}</div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Base Health</span>
              <span className="text-white">
                {baseHealth}/{maxBaseHealth}
              </span>
            </div>
            <Progress value={(baseHealth / maxBaseHealth) * 100} className="h-1" />
            <div className="flex items-center justify-between text-xs mt-1">
              <div className="flex items-center gap-2">
                <span className="text-amber-400">W:{resources.wood}</span>
                <span className="text-slate-400">M:{resources.metal}</span>
                <span className="text-green-400">F:{resources.food}</span>
                <span className="text-red-400">MD:{resources.medicine}</span>
                <span className="text-yellow-400">A:{resources.ammunition}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1">
              <Users className="w-3 h-3" />
              Survivor Capacity
            </span>
            <span className={`${survivorCount > currentBase.maxSurvivors ? "text-red-400" : "text-white"}`}>
              {survivorCount}/{currentBase.maxSurvivors}
            </span>
          </div>

          {!hasEnoughResourcesForSurvivors() && (
            <div className="bg-red-900/30 border border-red-700 p-2 rounded-lg text-xs text-red-400">
              Warning: Not enough resources to support your survivors!
            </div>
          )}

          {isDay && (
            <div className="flex gap-2 mt-2">
              <Button
                size="sm"
                variant="outline"
                className={`flex-1 text-xs ${
                  baseHealth < maxBaseHealth && canAffordRepair()
                    ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-700"
                    : "opacity-50 cursor-not-allowed"
                }`}
                onClick={handleRepairClick}
                disabled={baseHealth >= maxBaseHealth || !canAffordRepair()}
              >
                <Hammer className="w-3 h-3 mr-1" />
                Repair
              </Button>
              <Button
                size="sm"
                variant="outline"
                className={`flex-1 text-xs ${
                  baseLevel < 10 && canAffordUpgrade()
                    ? "bg-green-600 hover:bg-green-700 text-white border-green-700"
                    : "opacity-50 cursor-not-allowed"
                }`}
                onClick={handleUpgradeClick}
                disabled={baseLevel >= 10 || !canAffordUpgrade()}
              >
                <ArrowUp className="w-3 h-3 mr-1" />
                Upgrade
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resource Requirements */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2 text-white">
            <Package className="w-4 h-4 text-purple-400" />
            Resource Requirements
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 space-y-3">
          <div className="text-xs text-slate-400">Resources needed to support {survivorCount} survivors:</div>

          <div className="grid grid-cols-2 gap-2">
            {Object.entries(calculateRequiredResources()).map(([resource, amount]) => (
              <div key={resource} className="bg-slate-700/50 p-2 rounded-lg">
                <div className="text-xs text-slate-400 capitalize">{resource}</div>
                <div
                  className={`text-sm font-medium ${resources[resource as keyof Resources] >= amount ? "text-white" : "text-red-400"}`}
                >
                  {amount}/{resources[resource as keyof Resources]}
                </div>
              </div>
            ))}
          </div>

          <div className="text-xs text-slate-400">
            HP Multipliers: Wood {currentBase.hpMultiplier.wood}x, Metal {currentBase.hpMultiplier.metal}x, etc.
          </div>
        </CardContent>
      </Card>

      {/* Next Level Preview */}
      {baseLevel < 10 && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-white">
              <ArrowUp className="w-4 h-4 text-green-400" />
              Next Level: {nextBase?.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 space-y-3">
            <div className="text-xs text-slate-400">{nextBase?.description}</div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-700/50 p-2 rounded-lg">
                <div className="text-xs text-slate-400">Max Survivors</div>
                <div className="text-sm font-medium text-white">{nextBase?.maxSurvivors}</div>
              </div>
              <div className="bg-slate-700/50 p-2 rounded-lg">
                <div className="text-xs text-slate-400">Kills Required</div>
                <div className="text-sm font-medium text-white">{nextBase?.killsRequired}</div>
              </div>
            </div>

            <div className="text-xs text-slate-400 mt-1">
              Upgrade cost: <span className="text-yellow-400">{nextBase?.upgradeCost?.zmb} ZMB</span> + resources
            </div>
          </CardContent>
        </Card>
      )}

      {/* Base Level Progression */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2 text-white">
            <Zap className="w-4 h-4 text-yellow-400" />
            Base Progression
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400">Level {baseLevel}/10</span>
            <span className="text-xs text-slate-400">{baseLevel === 10 ? "MAX LEVEL" : ""}</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full"
              style={{ width: `${(baseLevel / 10) * 100}%` }}
            ></div>
          </div>
          <div className="grid grid-cols-10 gap-0.5 mt-1">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className={`h-1 rounded-full ${i < baseLevel ? "bg-green-500" : "bg-slate-700"}`}></div>
            ))}
          </div>
        </CardContent>
      </Card>

      {!isDay && (
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4 text-center">
            <div className="text-slate-400 text-sm">🌙 Night Phase - Building Disabled</div>
            <div className="text-xs text-slate-500 mt-1">Your survivors are defending the base</div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
