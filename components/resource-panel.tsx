"use client"

import { Card, CardContent } from "@/components/ui/card"
import { TreePine, Wrench, Apple, Heart, Zap } from "lucide-react"
import type { Resources } from "../types/game"
import { Button } from "@/components/ui/button"

interface ResourcePanelProps {
  resources: Resources
  zmbBalance: number
  exchangeRates: {
    wood: number
    metal: number
    food: number
    medicine: number
    ammunition: number
  }
  onBuyResource: (resource: keyof Resources, amount: number, cost: number) => void
}

export function ResourcePanel({ resources, zmbBalance, exchangeRates, onBuyResource }: ResourcePanelProps) {
  const resourceItems = [
    {
      key: "wood" as keyof Resources,
      icon: TreePine,
      color: "text-amber-400",
      value: resources.wood,
      rate: exchangeRates.wood,
    },
    {
      key: "metal" as keyof Resources,
      icon: Wrench,
      color: "text-slate-400",
      value: resources.metal,
      rate: exchangeRates.metal,
    },
    {
      key: "food" as keyof Resources,
      icon: Apple,
      color: "text-green-400",
      value: resources.food,
      rate: exchangeRates.food,
    },
    {
      key: "medicine" as keyof Resources,
      icon: Heart,
      color: "text-red-400",
      value: resources.medicine,
      rate: exchangeRates.medicine,
    },
    {
      key: "ammunition" as keyof Resources,
      icon: Zap,
      color: "text-yellow-400",
      value: resources.ammunition,
      rate: exchangeRates.ammunition,
    },
  ]

  const handleBuy = (resource: keyof Resources, rate: number) => {
    if (zmbBalance >= rate) {
      onBuyResource(resource, 1, rate)
    }
  }

  return (
    <div>
      <h3 className="text-sm font-medium text-white mb-3">Inventory</h3>
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-3">
          <div className="grid grid-cols-5 gap-2">
            {resourceItems.map(({ key, icon: Icon, color, value, rate }) => (
              <div key={key} className="text-center">
                <Icon className={`w-4 h-4 mx-auto mb-1 ${color}`} />
                <div className="text-xs font-medium text-white">{value}</div>
                <div className="text-xs text-slate-400 capitalize mb-2">{key}</div>
                <Button
                  size="sm"
                  variant="outline"
                  className={`text-xs px-2 py-1 h-6 ${
                    zmbBalance >= rate
                      ? "hover:bg-green-600 hover:text-white hover:border-green-600"
                      : "opacity-50 cursor-not-allowed"
                  }`}
                  onClick={() => handleBuy(key, rate)}
                  disabled={zmbBalance < rate}
                >
                  Buy ({rate})
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
