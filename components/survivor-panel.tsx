"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  User,
  Sword,
  Shield,
  Hammer,
  Search,
  Heart,
  Package,
  ShoppingCart,
  AlertCircle,
  Ticket,
  BedDouble,
} from "lucide-react"
import type { Survivor } from "../types/game"
import type { Resources } from "../types/game"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

interface SurvivorPanelProps {
  survivors: Array<Survivor & { isStarter?: boolean }>
  gachaBoxCount: number
  zmbBalance: number
  resources: Resources
  maxActiveSurvivors: number
  onBuySurvivor: () => void
  onSellSurvivor: (survivorId: string) => void
  onKillSurvivor: (survivorId: string) => void
  onRestSurvivor: (survivorId: string, cost: { zmb: number; resources: Partial<Resources> }) => void
  onBuyFromSecondary: (survivor: Partial<Survivor>, price: number) => void
  hasBase?: boolean
  calculateRestCost?: (survivor: Survivor) => { zmb: number; resources: Partial<Resources> }
  onShowCharacterPreview: () => void
}

export function SurvivorPanel({
  survivors,
  gachaBoxCount,
  zmbBalance,
  resources,
  maxActiveSurvivors,
  onBuySurvivor,
  onSellSurvivor,
  onKillSurvivor,
  onRestSurvivor,
  onBuyFromSecondary,
  hasBase,
  calculateRestCost,
  onShowCharacterPreview,
}: SurvivorPanelProps) {
  const [showGachaAnimation, setShowGachaAnimation] = useState(false)
  const [showBuyConfirm, setShowBuyConfirm] = useState(false)
  const [showKillConfirm, setShowKillConfirm] = useState(false)
  const [showRestConfirm, setShowRestConfirm] = useState(false)
  const [selectedSurvivor, setSelectedSurvivor] = useState<Survivor | null>(null)
  const [showSellConfirm, setShowSellConfirm] = useState(false)
  const [soldSurvivors, setSoldSurvivors] = useState<
    Array<{
      id: string
      name: string
      level: number
      specialty: string
      price: number
    }>
  >([])
  const [customPrice, setCustomPrice] = useState<number>(0)
  const [showMaxCapacityWarning, setShowMaxCapacityWarning] = useState(false)
  const [lastGachaTime, setLastGachaTime] = useState<number>(() => {
    // Load last gacha time from localStorage
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("lastGachaTime")
      return saved ? Number.parseInt(saved) : 0
    }
    return 0
  })
  const [gachaCooldownRemaining, setGachaCooldownRemaining] = useState<string>("")
  const [gachaTokens, setGachaTokens] = useState<number>(0)

  // Update gacha cooldown timer
  useEffect(() => {
    const updateCooldown = () => {
      const now = Date.now()
      const timeSinceLastGacha = now - lastGachaTime
      const cooldownPeriod = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

      if (timeSinceLastGacha < cooldownPeriod) {
        const remaining = cooldownPeriod - timeSinceLastGacha
        const hours = Math.floor(remaining / (60 * 60 * 1000))
        const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000))
        setGachaCooldownRemaining(`${hours}h ${minutes}m`)
      } else {
        setGachaCooldownRemaining("")
      }
    }

    updateCooldown()
    const interval = setInterval(updateCooldown, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [lastGachaTime])

  // Calculate survivor cost as 5% of ZMB balance
  const survivorCost = Math.max(Math.round(zmbBalance * 0.05), 100) // Minimum 100 ZMB

  const getSpecialtyIcon = (specialty: string) => {
    switch (specialty) {
      case "fighter":
        return Sword
      case "builder":
        return Hammer
      case "scavenger":
        return Search
      case "medic":
        return Heart
      default:
        return User
    }
  }

  const getSpecialtyColor = (specialty: string) => {
    switch (specialty) {
      case "fighter":
        return "text-red-400"
      case "builder":
        return "text-blue-400"
      case "scavenger":
        return "text-green-400"
      case "medic":
        return "text-pink-400"
      default:
        return "text-slate-400"
    }
  }

  const getRestCost = (survivor: Survivor) => {
    const healthPercentage = survivor.health / survivor.maxHealth
    const healthMissing = 1 - healthPercentage

    // Base costs
    const zmbCost = Math.round(30 * healthMissing) // 0-30 ZMB depending on missing health

    // Resource costs
    const resourceCost: Partial<Resources> = {
      food: Math.max(1, Math.round(5 * healthMissing)), // 1-5 food
      medicine: Math.max(1, Math.round(3 * healthMissing)), // 1-3 medicine
    }

    return { zmb: zmbCost, resources: resourceCost }
  }

  const canAffordRest = (survivor: Survivor) => {
    const cost = getRestCost(survivor)

    if (zmbBalance < cost.zmb) return false

    // Check if player has enough resources
    for (const [resource, amount] of Object.entries(cost.resources)) {
      if (resources[resource as keyof Resources] < amount) return false
    }

    return true
  }

  const canUseGacha = () => {
    const now = Date.now()
    const timeSinceLastGacha = now - lastGachaTime
    const cooldownPeriod = 24 * 60 * 60 * 1000 // 24 hours in milliseconds
    return timeSinceLastGacha >= cooldownPeriod
  }

  const handleMint = () => {
    if (gachaTokens > 0) {
      // Use a gacha token
      setGachaTokens((prev) => prev - 1)
      setShowGachaAnimation(true)
      setTimeout(() => {
        setShowGachaAnimation(false)
        onBuySurvivor()
      }, 1500)
    } else if (zmbBalance >= survivorCost) {
      // Use ZMB
      setShowGachaAnimation(true)
      setTimeout(() => {
        setShowGachaAnimation(false)
        onBuySurvivor()
      }, 1500)
    }
  }

  const handleBuyNow = () => {
    setShowBuyConfirm(true)
  }

  const handleConfirmBuy = () => {
    if (soldSurvivors.length > 0) {
      const survivorToBuy = soldSurvivors[0]

      // Create a new survivor object based on the sold survivor
      const newSurvivor: Partial<Survivor> = {
        name: survivorToBuy.name,
        level: survivorToBuy.level,
        specialty: survivorToBuy.specialty as "builder" | "fighter" | "scavenger" | "medic",
        health: 80 + Math.floor(Math.random() * 20), // Random health between 80-100
        maxHealth: 100,
        attack: 10 + Math.floor(Math.random() * 15), // Random attack between 10-25
        defense: 5 + Math.floor(Math.random() * 15), // Random defense between 5-20
        isActive: true,
      }

      // Call the function to add the survivor to the player's collection
      onBuyFromSecondary(newSurvivor, survivorToBuy.price)

      // Remove the survivor from the sold list
      setSoldSurvivors((prev) => prev.slice(1))
    }
    setShowBuyConfirm(false)
  }

  const handleKillClick = (survivor: Survivor) => {
    setSelectedSurvivor(survivor)
    setShowKillConfirm(true)
  }

  const handleConfirmKill = () => {
    if (selectedSurvivor) {
      onKillSurvivor(selectedSurvivor.id)

      // Increment gacha tokens
      setGachaTokens((prev) => prev + 1)

      // Set last gacha time and save to localStorage
      const now = Date.now()
      setLastGachaTime(now)
      if (typeof window !== "undefined") {
        localStorage.setItem("lastGachaTime", now.toString())
      }
    }
    setShowKillConfirm(false)
    setSelectedSurvivor(null)
  }

  const handleSellClick = (survivor: Survivor) => {
    setSelectedSurvivor(survivor)
    // Initialize the custom price based on the survivor's level
    setCustomPrice(Math.round(zmbBalance * 0.03 * (1 + survivor.level * 0.2)))
    setShowSellConfirm(true)
  }

  const handleConfirmSell = (listPrice?: number) => {
    if (selectedSurvivor) {
      // Calculate the sell price based on level
      const basePrice = Math.round(zmbBalance * 0.03 * (1 + selectedSurvivor.level * 0.2))
      const sellPrice = listPrice || basePrice

      // Add to sold survivors list
      setSoldSurvivors((prev) => [
        ...prev,
        {
          id: `market-${Date.now()}`,
          name: selectedSurvivor.name,
          level: selectedSurvivor.level,
          specialty: selectedSurvivor.specialty,
          price: sellPrice,
        },
      ])

      // Remove from player's collection
      onSellSurvivor(selectedSurvivor.id)
    }
    setShowSellConfirm(false)
    setSelectedSurvivor(null)
  }

  const handleRestClick = (survivor: Survivor) => {
    // If trying to activate and already at max capacity, show warning
    if (!survivor.isActive) {
      const activeCount = survivors.filter((s) => s.isActive).length
      if (activeCount >= maxActiveSurvivors) {
        setShowMaxCapacityWarning(true)
        return
      }
    }

    setSelectedSurvivor(survivor)
    setShowRestConfirm(true)
  }

  const handleConfirmRest = () => {
    if (selectedSurvivor) {
      const cost = getRestCost(selectedSurvivor)
      onRestSurvivor(selectedSurvivor.id, cost)
    }
    setShowRestConfirm(false)
    setSelectedSurvivor(null)
  }

  const increasePrice = () => {
    setCustomPrice((prev) => Math.round(prev * 1.1)) // Increase by 10%
  }

  const decreasePrice = () => {
    setCustomPrice((prev) => Math.max(100, Math.round(prev * 0.9))) // Decrease by 10%, minimum 100
  }

  return (
    <div className="space-y-4">
      {/* Buy Confirmation Dialog */}
      <Dialog open={showBuyConfirm} onOpenChange={setShowBuyConfirm}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <ShoppingCart className="w-5 h-5" />
              Confirm Purchase
            </DialogTitle>
            <DialogDescription className="text-slate-300 pt-2">
              You are about to purchase a survivor from the secondary market.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center gap-4 py-4">
            {soldSurvivors.length > 0 && (
              <>
                <div className="bg-slate-700 p-3 rounded-lg w-full">
                  <div className="flex items-center gap-2 mb-2">
                    {(() => {
                      const SpecialtyIcon = getSpecialtyIcon(soldSurvivors[0].specialty)
                      return <SpecialtyIcon className={`w-4 h-4 ${getSpecialtyColor(soldSurvivors[0].specialty)}`} />
                    })()}
                    <span className="text-sm font-medium text-white">{soldSurvivors[0].name}</span>
                    <Badge variant="secondary" className="text-xs">
                      Lv.{soldSurvivors[0].level}
                    </Badge>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm text-slate-300">Price:</p>
                  <p className="text-2xl font-bold text-green-400">{soldSurvivors[0].price.toLocaleString()} ZMB</p>
                  <p className="text-xs text-slate-400">(${(soldSurvivors[0].price / 500).toFixed(2)} USD)</p>
                </div>
              </>
            )}
            <div className="text-xs text-slate-400 text-center">
              This survivor will be added to your collection immediately after purchase.
            </div>
          </div>
          <div className="flex justify-center">
            <Button className="mt-2 bg-green-600 hover:bg-green-700 text-white px-6" onClick={handleConfirmBuy}>
              Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Kill Confirmation Dialog */}
      <Dialog open={showKillConfirm} onOpenChange={setShowKillConfirm}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500">
              <AlertCircle className="w-5 h-5" />
              Confirm Gacha
            </DialogTitle>
            <DialogDescription className="text-slate-300 pt-2">
              Are you sure you want to quick sell your Survivor to the Gacha Box?
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center gap-4 py-4">
            {selectedSurvivor && (
              <div className="bg-slate-700 p-3 rounded-lg w-full">
                <div className="flex items-center gap-2 mb-2">
                  {(() => {
                    const SpecialtyIcon = getSpecialtyIcon(selectedSurvivor.specialty)
                    return <SpecialtyIcon className={`w-4 h-4 ${getSpecialtyColor(selectedSurvivor.specialty)}`} />
                  })()}
                  <span className="text-sm font-medium text-white">{selectedSurvivor.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    Lv.{selectedSurvivor.level}
                  </Badge>
                </div>
                <div className="text-xs text-slate-400">
                  This action cannot be undone. Your survivor will be recycled into the Gacha Box system.
                </div>
                <div className="mt-2 text-xs text-green-400 font-medium">
                  You will receive 1 Gacha Token for this survivor.
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-center gap-3">
            <Button variant="outline" onClick={() => setShowKillConfirm(false)} className="mt-2">
              Cancel
            </Button>
            <Button className="mt-2 bg-red-600 hover:bg-red-700 text-white px-6" onClick={handleConfirmKill}>
              Quick Sell
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sell Confirmation Dialog */}
      <Dialog open={showSellConfirm} onOpenChange={setShowSellConfirm}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-500">
              <ShoppingCart className="w-5 h-5" />
              Sell Survivor
            </DialogTitle>
            <DialogDescription className="text-slate-300 pt-2">
              Set your price or sell to the highest bidder
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center gap-4 py-4">
            {selectedSurvivor && (
              <div className="bg-slate-700 p-3 rounded-lg w-full">
                <div className="flex items-center gap-2 mb-2">
                  {(() => {
                    const SpecialtyIcon = getSpecialtyIcon(selectedSurvivor.specialty)
                    return <SpecialtyIcon className={`w-4 h-4 ${getSpecialtyColor(selectedSurvivor.specialty)}`} />
                  })()}
                  <span className="text-sm font-medium text-white">{selectedSurvivor.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    Lv.{selectedSurvivor.level}
                  </Badge>
                </div>

                {/* Floor Price Section */}
                <div className="mt-2 text-center">
                  <p className="text-sm text-slate-300">Current Floor Price:</p>
                  <p className="text-xl font-bold text-green-400">
                    {Math.round(zmbBalance * 0.03 * (1 + selectedSurvivor.level * 0.2)).toLocaleString()} ZMB
                  </p>
                </div>

                {/* Price Selection */}
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-300">Set Your Price:</span>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" className="h-6 w-6 p-0" onClick={decreasePrice}>
                        -
                      </Button>
                      <span className="text-sm font-medium text-white">{customPrice.toLocaleString()} ZMB</span>
                      <Button size="sm" variant="outline" className="h-6 w-6 p-0" onClick={increasePrice}>
                        +
                      </Button>
                    </div>
                  </div>

                  <div className="text-xs text-slate-400">
                    {customPrice < Math.round(zmbBalance * 0.03 * (1 + selectedSurvivor.level * 0.2)) ? (
                      <p className="text-yellow-400">
                        Warning: Setting a price below the floor price will establish a new floor price for all similar
                        survivors.
                      </p>
                    ) : customPrice > Math.round(zmbBalance * 0.03 * (1 + selectedSurvivor.level * 0.2)) * 1.5 ? (
                      <p>Higher prices may take longer to sell.</p>
                    ) : (
                      <p>This price is competitive with the current market.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-center gap-3">
            <Button variant="outline" onClick={() => setShowSellConfirm(false)} className="mt-2">
              Cancel
            </Button>
            <Button
              className="mt-2 bg-yellow-600 hover:bg-yellow-700 text-white px-6"
              onClick={() => handleConfirmSell()}
            >
              Quick Sell
            </Button>
            <Button
              className="mt-2 bg-green-600 hover:bg-green-700 text-white px-6"
              onClick={() => handleConfirmSell(customPrice)}
            >
              List for Sale
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rest Confirmation Dialog */}
      <Dialog open={showRestConfirm} onOpenChange={setShowRestConfirm}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-500">
              <BedDouble className="w-5 h-5" />
              {selectedSurvivor?.isActive ? "Confirm Rest" : "Confirm Activate"}
            </DialogTitle>
            <DialogDescription className="text-slate-300 pt-2">
              {selectedSurvivor?.isActive
                ? "Your survivor will rest to recover health."
                : "Your survivor will return to active duty."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center gap-4 py-4">
            {selectedSurvivor && (
              <div className="bg-slate-700 p-3 rounded-lg w-full">
                <div className="flex items-center gap-2 mb-2">
                  {(() => {
                    const SpecialtyIcon = getSpecialtyIcon(selectedSurvivor.specialty)
                    return <SpecialtyIcon className={`w-4 h-4 ${getSpecialtyColor(selectedSurvivor.specialty)}`} />
                  })()}
                  <span className="text-sm font-medium text-white">{selectedSurvivor.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    Lv.{selectedSurvivor.level}
                  </Badge>
                </div>

                {selectedSurvivor.isActive && (
                  <div className="bg-slate-600/50 p-2 rounded-lg mb-3 text-xs">
                    <p className={hasBase ? "text-blue-300" : "text-yellow-300"}>
                      {hasBase
                        ? "Note: Resources will be depleted from your base, not inventory."
                        : "Note: Without a base, resources will be depleted directly from your inventory."}
                    </p>
                  </div>
                )}

                <div className="space-y-1 mb-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Current Health</span>
                    <span className="text-white">
                      {selectedSurvivor.health}/{selectedSurvivor.maxHealth}
                    </span>
                  </div>
                  <Progress value={(selectedSurvivor.health / selectedSurvivor.maxHealth) * 100} className="h-1" />
                </div>

                {!selectedSurvivor.isActive && (
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-slate-400">Active Survivors</span>
                    <span
                      className={`${survivors.filter((s) => s.isActive).length >= maxActiveSurvivors ? "text-red-400" : "text-white"}`}
                    >
                      {survivors.filter((s) => s.isActive).length}/{maxActiveSurvivors}
                    </span>
                  </div>
                )}

                {selectedSurvivor.isActive && (
                  <div className="bg-slate-800 p-2 rounded-lg">
                    <p className="text-xs font-medium text-white mb-2">Cost:</p>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-yellow-400">ZMB</span>
                      <span className="text-xs font-medium text-white">{getRestCost(selectedSurvivor).zmb}</span>
                    </div>

                    {Object.entries(getRestCost(selectedSurvivor).resources).map(([resource, amount]) => (
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
                )}

                <div className="text-xs text-slate-400 mt-2">
                  {selectedSurvivor.isActive
                    ? "Your survivor will be unavailable while resting, but will gradually recover health."
                    : survivors.filter((s) => s.isActive).length >= maxActiveSurvivors
                      ? "You've reached the maximum number of active survivors for your current base level."
                      : "Your survivor will return to active duty and be available for missions."}
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-center gap-3">
            <Button variant="outline" onClick={() => setShowRestConfirm(false)} className="mt-2">
              Cancel
            </Button>
            <Button
              className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-6"
              onClick={handleConfirmRest}
              disabled={
                (selectedSurvivor?.isActive && !canAffordRest(selectedSurvivor)) ||
                (!selectedSurvivor?.isActive && survivors.filter((s) => s.isActive).length >= maxActiveSurvivors)
              }
            >
              {selectedSurvivor?.isActive ? "Rest" : "Activate"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Max Capacity Warning Dialog */}
      <Dialog open={showMaxCapacityWarning} onOpenChange={setShowMaxCapacityWarning}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-yellow-500">
              <AlertCircle className="w-5 h-5" />
              Base Capacity Reached
            </DialogTitle>
            <DialogDescription className="text-slate-300 pt-2">
              You've reached the maximum number of active survivors for your current base.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center gap-4 py-4">
            <div className="bg-slate-700 p-3 rounded-lg w-full">
              <div className="text-sm text-white mb-2">
                Your level {Math.ceil(maxActiveSurvivors / 2)} base can only support {maxActiveSurvivors} active
                survivors.
              </div>
              <div className="text-xs text-slate-400">
                Upgrade your base to increase your survivor capacity. Each base level increases the number of survivors
                you can have active at once.
              </div>
            </div>
          </div>
          <div className="flex justify-center">
            <Button
              className="mt-2 bg-yellow-600 hover:bg-yellow-700 text-white px-6"
              onClick={() => setShowMaxCapacityWarning(false)}
            >
              Understood
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Marketplace Section */}
      <div>
        <h3 className="text-sm font-medium text-white mb-3">Marketplace</h3>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4 grid grid-cols-2 gap-4">
            {/* Mystery Box */}
            <div className="flex flex-col items-center justify-center p-3 bg-slate-700/50 rounded-lg">
              <Package className={`w-8 h-8 mb-2 ${showGachaAnimation ? "animate-bounce" : ""} text-purple-400`} />
              <span className="text-sm font-medium text-white mb-1">Mystery Box</span>
              <div className="mb-2">
                <button
                  onClick={onShowCharacterPreview}
                  className="group transition-all duration-200 focus:outline-none"
                >
                  <Badge
                    variant="secondary"
                    className="cursor-pointer group-hover:bg-purple-600 group-hover:text-white transition-colors"
                  >
                    {gachaBoxCount} Characters
                  </Badge>
                </button>
              </div>
              <Button
                size="sm"
                className={`w-full flex items-center justify-center gap-1 ${
                  gachaTokens > 0 || (gachaBoxCount > 0 && zmbBalance >= survivorCost)
                    ? "bg-purple-600 hover:bg-purple-700"
                    : "bg-slate-600 opacity-50 cursor-not-allowed"
                } text-white`}
                onClick={handleMint}
                disabled={showGachaAnimation || gachaBoxCount === 0 || (gachaTokens === 0 && zmbBalance < survivorCost)}
              >
                <Ticket className="w-3 h-3" />
                {gachaTokens > 0 ? <span>Use Token ({gachaTokens})</span> : <span>{survivorCost} ZMB</span>}
              </Button>
            </div>

            {/* Secondary Market */}
            <div className="flex flex-col items-center justify-center p-3 bg-slate-700/50 rounded-lg">
              <ShoppingCart className="w-8 h-8 mb-2 text-blue-400" />
              <span className="text-sm font-medium text-white mb-1">Secondary</span>
              <div className="flex flex-col items-center mb-2">
                <Badge variant="secondary" className="mb-0">
                  {soldSurvivors.length > 0
                    ? `${soldSurvivors.length} · Floor: ${Math.min(...soldSurvivors.map((s) => s.price)).toLocaleString()} ZMB`
                    : soldSurvivors.length}
                </Badge>
              </div>
              <Button
                size="sm"
                className={`w-full ${soldSurvivors.length > 0 ? "bg-blue-600 hover:bg-blue-700" : "bg-slate-600 opacity-50 cursor-not-allowed"} text-white`}
                onClick={handleBuyNow}
                disabled={soldSurvivors.length === 0}
              >
                Buy Now
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Your Survivorz Section */}
      <div>
        <h3 className="text-sm font-medium text-white mb-1">Your Survivorz</h3>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-slate-400">Active Survivors</span>
          <span
            className={`text-xs ${survivors.filter((s) => s.isActive).length >= maxActiveSurvivors ? "text-red-400 font-medium" : "text-slate-300"}`}
          >
            {survivors.filter((s) => s.isActive).length}/{maxActiveSurvivors}
          </span>
        </div>

        {survivors.length === 0 ? (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4 text-center">
              <div className="text-green-400 text-sm font-medium">Get Your Free Starter Survivor!</div>
              <div className="text-xs text-slate-300 mt-1 mb-3">
                Start playing without needing to top up your wallet
              </div>

              <div className="bg-slate-700/50 p-3 rounded-lg mb-3">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Search className="w-5 h-5 text-green-400" />
                  <span className="text-sm font-medium text-white">Basic Scavenger</span>
                  <Badge variant="secondary" className="text-xs">
                    Lv.1
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Attack</span>
                    <span className="text-white font-medium">12</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Defense</span>
                    <span className="text-white font-medium">10</span>
                  </div>
                </div>
                <div className="text-xs text-slate-400">
                  A basic survivor with scavenging abilities to help you gather resources.
                </div>
              </div>

              <Button
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                onClick={() => {
                  // Create a basic scavenger survivor
                  const newSurvivor = {
                    name: "Scout",
                    level: 1,
                    health: 100,
                    maxHealth: 100,
                    attack: 12,
                    defense: 10,
                    specialty: "scavenger" as const,
                    isActive: true,
                    isStarter: true, // Mark as starter survivor
                  }

                  // Use onBuyFromSecondary with price 0 to add the free survivor
                  onBuyFromSecondary(newSurvivor, 0)
                }}
              >
                Claim Free Survivor
              </Button>
            </CardContent>
          </Card>
        ) : (
          survivors.map((survivor) => {
            const SpecialtyIcon = getSpecialtyIcon(survivor.specialty)
            const specialtyColor = getSpecialtyColor(survivor.specialty)
            const canRest = survivor.isActive && canAffordRest(survivor) && survivor.health < survivor.maxHealth

            return (
              <Card key={survivor.id} className="bg-slate-800 border-slate-700 mb-3">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm text-white flex items-center gap-2">
                      <SpecialtyIcon className={`w-4 h-4 ${specialtyColor}`} />
                      {survivor.name}
                      <Badge variant="secondary" className="text-xs">
                        Lv.{survivor.level}
                      </Badge>
                    </CardTitle>
                    <Badge variant={survivor.isActive ? "default" : "secondary"}>
                      {survivor.isActive ? "Active" : "Resting"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Health Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Health</span>
                      <span className="text-white">
                        {survivor.health}/{survivor.maxHealth}
                      </span>
                    </div>
                    <Progress value={(survivor.health / survivor.maxHealth) * 100} className="h-1" />
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Sword className="w-3 h-3" />
                        Attack
                      </span>
                      <span className="text-white font-medium">{survivor.attack}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        Defense
                      </span>
                      <span className="text-white font-medium">{survivor.defense}</span>
                    </div>
                  </div>

                  {/* Specialty */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Specialty</span>
                    <span className={`capitalize font-medium ${specialtyColor}`}>{survivor.specialty}</span>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className={`text-xs ${
                        survivor.isActive && canRest
                          ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-700"
                          : survivor.isActive && !canRest
                            ? "bg-slate-600 opacity-50 cursor-not-allowed text-white border-slate-700"
                            : "bg-green-600 hover:bg-green-700 text-white border-green-700"
                      }`}
                      onClick={() => handleRestClick(survivor)}
                      disabled={survivor.isActive && !canRest && survivor.health === survivor.maxHealth}
                    >
                      {survivor.isActive ? "Rest" : "Activate"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs bg-slate-600 opacity-50 cursor-not-allowed text-white border-slate-700"
                      disabled
                    >
                      Breed
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className={`text-xs ${
                        canUseGacha() && !survivor.isStarter
                          ? "bg-red-600 hover:bg-red-700 text-white border-red-700"
                          : "bg-slate-600 opacity-50 cursor-not-allowed text-white border-slate-700"
                      }`}
                      onClick={() => handleKillClick(survivor)}
                      disabled={!canUseGacha() || survivor.isStarter}
                      title={
                        survivor.isStarter
                          ? "Cannot sacrifice starter survivor"
                          : !canUseGacha()
                            ? `Cooldown: ${gachaCooldownRemaining}`
                            : "Convert to Gacha Token"
                      }
                    >
                      {survivor.isStarter ? "Locked" : canUseGacha() ? "Gacha" : gachaCooldownRemaining}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className={`text-xs ${
                        !survivor.isStarter
                          ? "bg-green-600 hover:bg-green-700 text-white border-green-700"
                          : "bg-slate-600 opacity-50 cursor-not-allowed text-white border-slate-700"
                      }`}
                      onClick={() => handleSellClick(survivor)}
                      disabled={survivor.isStarter}
                      title={survivor.isStarter ? "Cannot sell starter survivor" : "Sell survivor"}
                    >
                      {survivor.isStarter ? "Locked" : "Sell"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
