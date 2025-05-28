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
      metal: 0,
      food: 30,
      medicine: 10,
      ammunition: 5,
    },
    buildCost: {
      wood: 50,
      metal: 0,
      food: 25,
      medicine: 15,
      ammunition: 10,
      zmb: 200,
    },
    upgradeCost: {
      wood: 200,
      metal: 100,
      food: 150,
      medicine: 50,
      ammunition: 25,
      zmb: 500,
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
    upgradeCost: {
      wood: 400,
      metal: 200,
      food: 300,
      medicine: 100,
      ammunition: 50,
      zmb: 1000,
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
    upgradeCost: {
      wood: 700,
      metal: 400,
      food: 500,
      medicine: 200,
      ammunition: 100,
      zmb: 2000,
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
    upgradeCost: {
      wood: 1200,
      metal: 700,
      food: 800,
      medicine: 350,
      ammunition: 200,
      zmb: 4000,
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
    upgradeCost: {
      wood: 2000,
      metal: 1200,
      food: 1500,
      medicine: 600,
      ammunition: 400,
      zmb: 8000,
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
    upgradeCost: {
      wood: 3500,
      metal: 2000,
      food: 2500,
      medicine: 1000,
      ammunition: 750,
      zmb: 15000,
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
    upgradeCost: {
      wood: 5000,
      metal: 3000,
      food: 4000,
      medicine: 1500,
      ammunition: 1200,
      zmb: 25000,
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
    upgradeCost: {
      wood: 8000,
      metal: 5000,
      food: 6000,
      medicine: 2500,
      ammunition: 2000,
      zmb: 50000,
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
  hasBase: boolean
  onBuildBase: (cost: { zmb: number; resources: Partial<Resources> }) => void
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
  hasBase = false,
  onBuildBase,
  onRepairBase,
  onUpgradeBase,
}: BaseBuilderProps) {
  const [showBuildConfirm, setShowBuildConfirm] = useState(false)
  const [showRepairConfirm, setShowRepairConfirm] = useState(false)
  const [showUpgradeConfirm, setShowUpgradeConfirm] = useState(false)

  // Get current base data
  const currentBase = baseLevels[baseLevel - 1]
  const nextBase = baseLevel < 10 ? baseLevels[baseLevel] : null

  // Calculate max base health based on base level only
  const calculateMaxBaseHealth = () => {
    // Base health starts at 100 and increases by 50 per level
    const maxHealth = 100 + (baseLevel - 1) * 50
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

  // Calculate repair cost based on missing health percentage with randomization and survivor traits
  const getRepairCost = () => {
    const healthPercentage = baseHealth / maxBaseHealth
    const healthMissing = 1 - healthPercentage

    // Base ZMB cost with some randomness
    const zmbCost = Math.round(currentBase.level * 50 * healthMissing * (0.8 + Math.random() * 0.4))

    // Resource costs - randomized based on level and missing health
    const resourceCost: Partial<Resources> = {}

    // Select 2-3 random resources to use for repair
    const resourceTypes = ["wood", "metal", "food", "medicine", "ammunition"]
    const shuffled = [...resourceTypes].sort(() => 0.5 - Math.random())
    const selectedResources = shuffled.slice(0, 2 + Math.floor(Math.random() * 2)) // 2-3 resources

    // Apply survivor trait modifiers
    // This assumes we have access to the active survivors with their specialties
    // For now, we'll simulate this with random modifiers
    const specialtyModifiers = {
      builder: 0.7, // Builders reduce resource costs by 30%
      fighter: 1.2, // Fighters increase costs by 20%
      scavenger: 0.8, // Scavengers reduce costs by 20%
      medic: 0.9, // Medics reduce costs by 10%
    }

    // Randomly select a specialty modifier to simulate having different active survivors
    const specialties = Object.keys(specialtyModifiers) as Array<keyof typeof specialtyModifiers>
    const randomSpecialty = specialties[Math.floor(Math.random() * specialties.length)]
    const specialtyModifier = specialtyModifiers[randomSpecialty]

    selectedResources.forEach((resource) => {
      const baseCost =
        currentBase.level * (resource === "wood" ? 10 : resource === "metal" ? 5 : resource === "food" ? 2 : 1)
      resourceCost[resource as keyof Resources] = Math.max(
        1,
        Math.round(baseCost * healthMissing * (0.8 + Math.random() * 0.4) * specialtyModifier),
      )
    })

    return { zmb: zmbCost, resources: resourceCost, appliedSpecialty: randomSpecialty }
  }

  // Check if player can afford to build a base
  const canAffordBuild = () => {
    const buildCost = baseLevels[0].buildCost // Level 1 base cost

    if (zmbBalance < buildCost.zmb) return false

    // Check if player has enough resources
    for (const [resource, amount] of Object.entries(buildCost)) {
      if (resource === "zmb") continue // Skip ZMB check as we did it above
      if (resources[resource as keyof Resources] < amount) return false
    }

    return true
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

  const handleBuildClick = () => {
    setShowBuildConfirm(true)
  }

  const handleRepairClick = () => {
    setShowRepairConfirm(true)
  }

  const handleUpgradeClick = () => {
    setShowUpgradeConfirm(true)
  }

  const handleConfirmBuild = () => {
    const buildCost = baseLevels[0].buildCost // Level 1 base cost
    const cost = {
      zmb: buildCost.zmb,
      resources: {
        wood: buildCost.wood,
        metal: buildCost.metal,
        food: buildCost.food,
        medicine: buildCost.medicine,
        ammunition: buildCost.ammunition,
      },
    }
    onBuildBase(cost)
    setShowBuildConfirm(false)
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

  // If player doesn't have a base, show the build base UI
  if (!hasBase) {
    return (
      <div className="space-y-4">
        {/* Build Base Dialog */}
        <Dialog open={showBuildConfirm} onOpenChange={setShowBuildConfirm}>
          <DialogContent className="bg-slate-800 border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-white">
                <Home className="w-5 h-5" />
                Build Your First Base
              </DialogTitle>
              <DialogDescription className="text-slate-300 pt-2">
                Establish a survival shelter to protect your survivors.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center gap-4 py-4">
              <div className="bg-slate-700 p-3 rounded-lg w-full">
                <p className="text-sm font-medium text-white mb-2">Benefits:</p>
                <ul className="text-xs text-slate-300 space-y-1 list-disc pl-5">
                  <li>Increase survivor capacity to {baseLevels[0].maxSurvivors}</li>
                  <li>Protect your resources and survivors</li>
                  <li>Enable base upgrades for more benefits</li>
                </ul>
              </div>

              <div className="bg-slate-700 p-3 rounded-lg w-full">
                <p className="text-sm font-medium text-white mb-2">Cost:</p>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-yellow-400">ZMB</span>
                  <span className="text-xs font-medium text-white">{baseLevels[0].buildCost.zmb}</span>
                </div>

                {Object.entries(baseLevels[0].buildCost).map(([resource, amount]) => {
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
            </div>
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={() => setShowBuildConfirm(false)} className="mt-2">
                Cancel
              </Button>
              <Button
                className="mt-2 bg-green-600 hover:bg-green-700 text-white px-6"
                onClick={handleConfirmBuild}
                disabled={!canAffordBuild()}
              >
                Build Base
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* No Base UI */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-white">
              <Home className="w-4 h-4 text-blue-400" />
              No Base Established
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 space-y-3">
            <div className="text-xs text-slate-400">
              Your survivors are exposed to the elements and dangers. Build a base to protect them and increase your
              survivor capacity.
            </div>

            <div className="bg-slate-700/50 p-3 rounded-lg">
              <div className="text-xs text-slate-300 mb-2">Without a base:</div>
              <ul className="text-xs text-slate-400 space-y-1 list-disc pl-5">
                <li>Limited to only 1 active survivor</li>
                <li>Resting survivors consume resources directly from inventory</li>
                <li>No protection from attacks</li>
              </ul>
            </div>

            <div className="text-xs text-center text-slate-400 mt-2">
              Check the upgrade options below to build your first base.
            </div>
          </CardContent>
        </Card>

        {/* First Base Preview */}
        <Card className="bg-slate-800 border-slate-700 border-2 border-green-600/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-white">
              <Shield className="w-4 h-4 text-green-400" />
              Available Base Upgrade: Survival Shelter
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 space-y-3">
            <div className="text-xs text-slate-400">{baseLevels[0].description}</div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-700/50 p-2 rounded-lg">
                <div className="text-xs text-slate-400">Max Survivors</div>
                <div className="text-sm font-medium text-white">{baseLevels[0].maxSurvivors}</div>
              </div>
              <div className="bg-slate-700/50 p-2 rounded-lg">
                <div className="text-xs text-slate-400">Base Health</div>
                <div className="text-sm font-medium text-white">100</div>
              </div>
            </div>

            {/* Resource Requirements Bars */}
            <div className="space-y-2 mt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Build Requirements</span>
                <span className={`${canAffordBuild() ? "text-green-400" : "text-red-400"} text-xs font-medium`}>
                  {canAffordBuild() ? "Can Build" : "Insufficient Resources"}
                </span>
              </div>

              {/* ZMB Requirement */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-yellow-400">ZMB</span>
                  <span className={`${zmbBalance >= baseLevels[0].buildCost.zmb ? "text-white" : "text-red-400"}`}>
                    {zmbBalance}/{baseLevels[0].buildCost.zmb}
                  </span>
                </div>
                <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      zmbBalance >= baseLevels[0].buildCost.zmb ? "bg-green-500" : "bg-red-500"
                    }`}
                    style={{ width: `${Math.min(100, (zmbBalance / baseLevels[0].buildCost.zmb) * 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Resource Requirements */}
              {Object.entries(baseLevels[0].buildCost).map(([resource, amount]) => {
                if (resource === "zmb") return null // Skip ZMB as we already displayed it
                const currentAmount = resources[resource as keyof Resources]
                const percentage = Math.min(100, (currentAmount / amount) * 100)

                return (
                  <div key={resource} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span
                        className={`capitalize ${
                          resource === "wood"
                            ? "text-amber-400"
                            : resource === "metal"
                              ? "text-slate-400"
                              : resource === "food"
                                ? "text-green-400"
                                : resource === "medicine"
                                  ? "text-red-400"
                                  : "text-yellow-400" // ammunition
                        }`}
                      >
                        {resource}
                      </span>
                      <span className={`${currentAmount >= amount ? "text-white" : "text-red-400"}`}>
                        {currentAmount}/{amount}
                      </span>
                    </div>
                    <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${currentAmount >= amount ? "bg-green-500" : "bg-red-500"}`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                )
              })}
            </div>

            {isDay ? (
              <Button
                size="sm"
                className={`w-full ${
                  canAffordBuild()
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-slate-600 opacity-50 cursor-not-allowed"
                }`}
                onClick={handleBuildClick}
                disabled={!canAffordBuild()}
              >
                <Home className="w-3 h-3 mr-1" />
                Build Survival Shelter
              </Button>
            ) : (
              <div className="bg-red-900/30 border border-red-700 p-2 rounded-lg text-xs text-red-400">
                Cannot build during night phase. Wait until day.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // If player has a base, show the normal base UI
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
              <Progress
                value={(baseHealth / maxBaseHealth) * 100}
                className={`h-2 w-32 mt-1 ${
                  baseHealth / maxBaseHealth > 0.7
                    ? "bg-green-500"
                    : baseHealth / maxBaseHealth > 0.3
                      ? "bg-yellow-500"
                      : "bg-red-500"
                }`}
              />
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

              <div className="mt-2 text-xs">
                <span className="text-slate-400">Specialty applied: </span>
                <span
                  className={`capitalize font-medium ${
                    getRepairCost().appliedSpecialty === "builder"
                      ? "text-blue-400"
                      : getRepairCost().appliedSpecialty === "fighter"
                        ? "text-red-400"
                        : getRepairCost().appliedSpecialty === "scavenger"
                          ? "text-green-400"
                          : "text-pink-400" // medic
                  }`}
                >
                  {getRepairCost().appliedSpecialty}
                </span>
              </div>
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
                    <span className="text-xs text-slate-400">Base Health</span>
                    <span className="text-xs font-medium text-white">
                      {maxBaseHealth} → {100 + baseLevel * 50}
                    </span>
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
            <Progress
              value={(baseHealth / maxBaseHealth) * 100}
              className={`h-1 ${
                baseHealth / maxBaseHealth > 0.7
                  ? "bg-green-500"
                  : baseHealth / maxBaseHealth > 0.3
                    ? "bg-yellow-500"
                    : "bg-red-500"
              }`}
            />
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

          {/* Resource Requirements Section */}
          <div className="space-y-2 mt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Resource Requirements</span>
              <span
                className={`${hasEnoughResourcesForSurvivors() ? "text-green-400" : "text-red-400"} text-xs font-medium`}
              >
                {hasEnoughResourcesForSurvivors() ? "Sufficient" : "Insufficient"}
              </span>
            </div>

            {/* Resource Requirement Bars */}
            {Object.entries(calculateRequiredResources()).map(([resource, requiredAmount]) => {
              const currentAmount = resources[resource as keyof Resources]
              const percentage = Math.min(100, (currentAmount / (requiredAmount || 1)) * 100)

              return (
                <div key={resource} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span
                      className={`capitalize ${
                        resource === "wood"
                          ? "text-amber-400"
                          : resource === "metal"
                            ? "text-slate-400"
                            : resource === "food"
                              ? "text-green-400"
                              : resource === "medicine"
                                ? "text-red-400"
                                : "text-yellow-400" // ammunition
                      }`}
                    >
                      {resource}
                    </span>
                    <span className={`${currentAmount >= requiredAmount ? "text-white" : "text-red-400"}`}>
                      {currentAmount}/{requiredAmount}
                    </span>
                  </div>
                  <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        currentAmount >= requiredAmount ? "bg-green-500" : "bg-red-500"
                      }`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="text-xs text-slate-400 mt-2">
            <p>
              Base health is used when survivors rest to recover health. Each survivor trait consumes different
              resources.
            </p>
          </div>

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

            {/* Resource Requirements Bars */}
            {nextBase?.upgradeCost && (
              <div className="space-y-2 mt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Upgrade Requirements</span>
                  <span className={`${canAffordUpgrade() ? "text-green-400" : "text-red-400"} text-xs font-medium`}>
                    {canAffordUpgrade() ? "Can Upgrade" : "Insufficient Resources"}
                  </span>
                </div>

                {/* ZMB Requirement */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-yellow-400">ZMB</span>
                    <span
                      className={`${zmbBalance >= (nextBase.upgradeCost?.zmb || 0) ? "text-white" : "text-red-400"}`}
                    >
                      {zmbBalance}/{nextBase.upgradeCost?.zmb}
                    </span>
                  </div>
                  <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        zmbBalance >= (nextBase.upgradeCost?.zmb || 0) ? "bg-green-500" : "bg-red-500"
                      }`}
                      style={{ width: `${Math.min(100, (zmbBalance / (nextBase.upgradeCost?.zmb || 1)) * 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Resource Requirements */}
                {Object.entries(nextBase.upgradeCost).map(([resource, amount]) => {
                  if (resource === "zmb") return null // Skip ZMB as we already displayed it
                  const currentAmount = resources[resource as keyof Resources]
                  const percentage = Math.min(100, (currentAmount / amount) * 100)

                  return (
                    <div key={resource} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span
                          className={`capitalize ${
                            resource === "wood"
                              ? "text-amber-400"
                              : resource === "metal"
                                ? "text-slate-400"
                                : resource === "food"
                                  ? "text-green-400"
                                  : resource === "medicine"
                                    ? "text-red-400"
                                    : "text-yellow-400" // ammunition
                          }`}
                        >
                          {resource}
                        </span>
                        <span className={`${currentAmount >= amount ? "text-white" : "text-red-400"}`}>
                          {currentAmount}/{amount}
                        </span>
                      </div>
                      <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${currentAmount >= amount ? "bg-green-500" : "bg-red-500"}`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {!isDay && (
              <div className="bg-red-900/30 border border-red-700 p-2 rounded-lg text-xs text-red-400 mt-2">
                Cannot upgrade during night phase. Wait until day.
              </div>
            )}
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
