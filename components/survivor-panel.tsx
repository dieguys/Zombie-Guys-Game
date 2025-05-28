"use client"

import { useState } from "react"
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
  survivors: Survivor[]
  gachaBoxCount: number
  zmbBalance: number
  resources: Resources
  onBuySurvivor: () => void
  onSellSurvivor: (survivorId: string) => void
  onKillSurvivor: (survivorId: string) => void
  onRestSurvivor: (survivorId: string, cost: { zmb: number; resources: Partial<Resources> }) => void
  onBuyFromSecondary: (survivor: Partial<Survivor>, price: number) => void
}

export function SurvivorPanel({
  survivors,
  gachaBoxCount,
  zmbBalance,
  resources,
  onBuySurvivor,
  onSellSurvivor,
  onKillSurvivor,
  onRestSurvivor,
  onBuyFromSecondary,
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

  const handleMint = () => {
    if (gachaBoxCount > 0 && zmbBalance >= survivorCost) {
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
              Confirm Quick Sell
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
              Confirm Rest
            </DialogTitle>
            <DialogDescription className="text-slate-300 pt-2">
              {selectedSurvivor?.isActive
                ? "Your survivor will rest to recover health."
                : "Your survivor will return to active duty."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center gap-4 py-4">
            {selectedSurvivor && selectedSurvivor.isActive && (
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

                <div className="space-y-1 mb-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Current Health</span>
                    <span className="text-white">
                      {selectedSurvivor.health}/{selectedSurvivor.maxHealth}
                    </span>
                  </div>
                  <Progress value={(selectedSurvivor.health / selectedSurvivor.maxHealth) * 100} className="h-1" />
                </div>

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

                <div className="text-xs text-slate-400 mt-2">
                  Your survivor will be unavailable while resting, but will gradually recover health.
                </div>
              </div>
            )}

            {selectedSurvivor && !selectedSurvivor.isActive && (
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

                <div className="space-y-1 mb-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Current Health</span>
                    <span className="text-white">
                      {selectedSurvivor.health}/{selectedSurvivor.maxHealth}
                    </span>
                  </div>
                  <Progress value={(selectedSurvivor.health / selectedSurvivor.maxHealth) * 100} className="h-1" />
                </div>

                <div className="text-xs text-slate-400 mt-2">
                  Your survivor will return to active duty and be available for missions.
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
              disabled={selectedSurvivor?.isActive && !canAffordRest(selectedSurvivor)}
            >
              {selectedSurvivor?.isActive ? "Rest" : "Activate"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Marketplace Section */}
      <div>
        <h3 className="text-sm font-medium text-white mb-3">Marketplace</h3>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4 grid grid-cols-2 gap-4">
            {/* Gacha Box */}
            <div className="flex flex-col items-center justify-center p-3 bg-slate-700/50 rounded-lg">
              <Package className={`w-8 h-8 mb-2 ${showGachaAnimation ? "animate-bounce" : ""} text-purple-400`} />
              <span className="text-sm font-medium text-white mb-1">Gacha Box</span>
              <Badge variant="secondary" className="mb-2">
                {gachaBoxCount} Available
              </Badge>
              <Button
                size="sm"
                className={`w-full flex items-center justify-center gap-1 ${
                  gachaBoxCount > 0 && zmbBalance >= survivorCost
                    ? "bg-purple-600 hover:bg-purple-700"
                    : "bg-slate-600 opacity-50 cursor-not-allowed"
                } text-white`}
                onClick={handleMint}
                disabled={showGachaAnimation || gachaBoxCount === 0 || zmbBalance < survivorCost}
              >
                <Ticket className="w-3 h-3" />
                <span>{survivorCost} ZMB</span>
              </Button>
            </div>

            {/* Secondary Market */}
            <div className="flex flex-col items-center justify-center p-3 bg-slate-700/50 rounded-lg">
              <ShoppingCart className="w-8 h-8 mb-2 text-blue-400" />
              <span className="text-sm font-medium text-white mb-1">Secondary</span>
              <div className="flex flex-col items-center gap-1 mb-2">
                <Badge variant="secondary" className="mb-0">
                  {soldSurvivors.length} Available
                </Badge>
                {soldSurvivors.length > 0 ? (
                  <span className="text-xs text-green-400 font-medium">
                    Floor: {Math.min(...soldSurvivors.map((s) => s.price)).toLocaleString()} ZMB
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">No floor price yet</span>
                )}
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
        <h3 className="text-sm font-medium text-white mb-3">Your Survivorz</h3>
        {survivors.length === 0 ? (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4 text-center">
              <div className="text-slate-400 text-sm">No Survivorz Yet</div>
              <div className="text-xs text-slate-500 mt-1">Buy from the Gacha Box to get started</div>
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
                      className="text-xs bg-red-600 hover:bg-red-700 text-white border-red-700"
                      onClick={() => handleKillClick(survivor)}
                    >
                      Kill
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs bg-green-600 hover:bg-green-700 text-white border-green-700"
                      onClick={() => handleSellClick(survivor)}
                    >
                      Sell
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
