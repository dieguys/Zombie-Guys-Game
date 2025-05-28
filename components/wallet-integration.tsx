"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Wallet,
  Coins,
  Copy,
  RefreshCw,
  Settings,
  AlertCircle,
  QrCode,
  ArrowRightLeft,
  BarChart,
  CheckCircle,
  Package,
  Skull,
} from "lucide-react"
import type { WalletData } from "../types/game"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

interface WalletIntegrationProps {
  wallet: WalletData
  onTopUp: () => void
  onBuyZMB: (solAmount: number) => void
  onClaimBonus: () => void
}

export function WalletIntegration({ wallet, onTopUp, onBuyZMB, onClaimBonus }: WalletIntegrationProps) {
  const [showWarning, setShowWarning] = useState(false)
  const [showQrCode, setShowQrCode] = useState(false)
  const [showBuyZMB, setShowBuyZMB] = useState(false)
  const [rewardTimer, setRewardTimer] = useState("0h 0m")
  const [rewardReady, setRewardReady] = useState(true)
  const [showBonusClaimed, setShowBonusClaimed] = useState(false)
  const [showRagequitConfirm, setShowRagequitConfirm] = useState(false)

  const copyAddress = () => {
    navigator.clipboard.writeText(wallet.address)
  }

  const handleExportClick = () => {
    setShowWarning(true)
  }

  const handleTopUpClick = () => {
    setShowQrCode(true)
  }

  const handleBuyZMBClick = () => {
    setShowBuyZMB(true)
  }

  const handleConfirmBuyZMB = () => {
    // Convert all SOL to ZMB
    onBuyZMB(Number(wallet.balance))
    setShowBuyZMB(false)
  }

  const handleTopUpConfirm = () => {
    onTopUp()
    setShowQrCode(false)
  }

  const handleClaimBonus = () => {
    // Add the bonus ZMB
    onClaimBonus()

    // Reset the timer to 24 hours
    setRewardTimer("24h 0m")
    setRewardReady(false)

    // Show the bonus claimed dialog
    setShowBonusClaimed(true)
  }

  const handleRagequitClick = () => {
    setShowRagequitConfirm(true)
  }

  const calculateTotalAccountValue = () => {
    // Convert ZMB to SOL (assuming 100,000 ZMB per SOL from gameRates)
    const zmbValueInSol = wallet.tokenBalance / 100000

    // Placeholder for inventory value - in a real implementation,
    // this would calculate the value of all resources based on their rates
    const inventoryValueInSol = 0.05 // Example placeholder value

    // Placeholder for survivors value - in a real implementation,
    // this would calculate the value of all survivors based on their level, stats, etc.
    const survivorsValueInSol = 0.1 // Example placeholder value

    // Total value
    const totalValueInSol = zmbValueInSol + inventoryValueInSol + survivorsValueInSol

    return {
      zmbValueInSol,
      inventoryValueInSol,
      survivorsValueInSol,
      totalValueInSol,
    }
  }

  const handleConfirmRagequit = () => {
    setShowRagequitConfirm(false)
    // Add logic to liquidate the account
    // This would typically involve resetting game state or calling a server endpoint
  }

  return (
    <div className="space-y-4">
      {/* Warning Dialog */}
      <Dialog open={showWarning} onOpenChange={setShowWarning}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500">
              <AlertCircle className="w-5 h-5" />
              Access Denied
            </DialogTitle>
            <DialogDescription className="text-slate-300 pt-2">
              You must RAGEQUIT first before accessing this feature.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setShowWarning(false)} className="mt-2">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Ragequit Confirmation Dialog */}
      <Dialog open={showRagequitConfirm} onOpenChange={setShowRagequitConfirm}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500">
              <Skull className="w-5 h-5" />
              CONFIRM RAGEQUIT
            </DialogTitle>
            <DialogDescription className="text-slate-300 pt-2">
              WARNING: You are about to liquidate your entire account!
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center gap-4 py-4">
            {/* Account Value Summary */}
            <div className="bg-slate-700 p-3 rounded-lg w-full mb-2">
              <p className="text-sm text-white mb-2 font-bold text-center">Account Value</p>
              <div className="space-y-2">
                {(() => {
                  const { zmbValueInSol, inventoryValueInSol, survivorsValueInSol, totalValueInSol } =
                    calculateTotalAccountValue()
                  return (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-300">ZMB Tokens:</span>
                        <span className="text-xs text-green-400">{zmbValueInSol.toFixed(4)} SOL</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-300">Inventory Value:</span>
                        <span className="text-xs text-blue-400">{inventoryValueInSol.toFixed(4)} SOL</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-300">Survivorz Value:</span>
                        <span className="text-xs text-purple-400">{survivorsValueInSol.toFixed(4)} SOL</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-slate-600">
                        <span className="text-xs font-medium text-white">TOTAL VALUE:</span>
                        <span className="text-xs font-bold text-yellow-400">{totalValueInSol.toFixed(4)} SOL</span>
                      </div>
                    </>
                  )
                })()}
              </div>
            </div>

            <div className="bg-red-900/30 border border-red-700 p-4 rounded-lg w-full">
              <p className="text-sm text-white mb-2 font-bold">This action will permanently delete:</p>
              <ul className="text-xs text-slate-300 space-y-1 list-disc pl-5">
                <li>All your inventory items and resources</li>
                <li>All your survivorz and their progress</li>
                <li>All your structures and base progress</li>
                <li>All your game statistics and achievements</li>
              </ul>
              <p className="text-xs text-red-400 mt-3 font-medium">This action CANNOT be undone!</p>
            </div>
          </div>
          <div className="flex justify-center gap-3">
            <Button variant="outline" onClick={() => setShowRagequitConfirm(false)} className="mt-2">
              Cancel
            </Button>
            <Button
              className="mt-2 bg-red-600 hover:bg-red-700 text-white px-6 font-bold"
              onClick={handleConfirmRagequit}
            >
              I UNDERSTAND, RAGEQUIT
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={showQrCode} onOpenChange={setShowQrCode}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <QrCode className="w-5 h-5" />
              Top Up Your Wallet
            </DialogTitle>
            <DialogDescription className="text-slate-300 pt-2">
              Scan this QR code or send SOL to the address below
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center gap-4 py-4">
            {/* QR Code Placeholder */}
            <div className="w-48 h-48 bg-white p-4 rounded-lg flex items-center justify-center">
              <div className="w-40 h-40 border-2 border-slate-800 grid grid-cols-5 grid-rows-5">
                {/* Simplified QR code pattern */}
                <div className="col-span-2 row-span-2 bg-slate-800 m-1 rounded-lg"></div>
                <div className="col-span-2 row-span-2 bg-slate-800 m-1 rounded-lg col-start-4"></div>
                <div className="col-span-2 row-span-2 bg-slate-800 m-1 rounded-lg row-start-4"></div>
                <div className="col-span-1 row-span-1 bg-slate-800 m-1 rounded-sm col-start-3 row-start-3"></div>
                <div className="col-span-1 row-span-1 bg-slate-800 m-1 rounded-sm col-start-2 row-start-3"></div>
                <div className="col-span-1 row-span-1 bg-slate-800 m-1 rounded-sm col-start-4 row-start-3"></div>
                <div className="col-span-1 row-span-1 bg-slate-800 m-1 rounded-sm col-start-3 row-start-2"></div>
                <div className="col-span-1 row-span-1 bg-slate-800 m-1 rounded-sm col-start-3 row-start-4"></div>
              </div>
            </div>

            {/* Wallet Address */}
            <div className="flex items-center gap-2 bg-slate-700 p-2 rounded-md w-full">
              <span className="text-xs font-mono text-white flex-1 text-center">{wallet.address}</span>
              <Button size="sm" variant="ghost" onClick={copyAddress} className="h-6 w-6 p-0">
                <Copy className="w-3 h-3" />
              </Button>
            </div>
          </div>
          <div className="flex justify-center">
            <Button className="mt-4 bg-green-600 hover:bg-green-700 text-white px-6" onClick={handleTopUpConfirm}>
              <CheckCircle className="w-4 h-4 mr-2" />I have topped up
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Buy ZMB Dialog */}
      <Dialog open={showBuyZMB} onOpenChange={setShowBuyZMB}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-500">
              <ArrowRightLeft className="w-5 h-5" />
              Convert SOL to ZMB
            </DialogTitle>
            <DialogDescription className="text-slate-300 pt-2">
              All of your SOL will be converted to ZMB
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center gap-4 py-6">
            <div className="flex flex-col items-center">
              <span className="text-lg font-bold text-white">{wallet.balance} SOL</span>
              <span className="text-xs text-slate-400">Current Balance</span>
            </div>
            <ArrowRightLeft className="w-6 h-6 text-green-500 mx-4" />
            <div className="flex flex-col items-center">
              <span className="text-lg font-bold text-green-400">
                {(Number(wallet.balance) * 100000).toLocaleString()} ZMB
              </span>
              <span className="text-xs text-slate-400">Estimated Tokens</span>
            </div>
          </div>
          <div className="flex justify-center">
            <Button
              className="mt-4 bg-green-600 hover:bg-green-700 text-white px-6"
              onClick={handleConfirmBuyZMB}
              disabled={Number(wallet.balance) <= 0}
            >
              Confirm Conversion
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bonus Claimed Dialog */}
      <Dialog open={showBonusClaimed} onOpenChange={setShowBonusClaimed}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-500">
              <CheckCircle className="w-5 h-5" />
              Daily Bonus Claimed!
            </DialogTitle>
            <DialogDescription className="text-slate-300 pt-2">
              You've received your daily bonus rewards!
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center gap-2 py-4">
            <div className="text-center">
              <p className="text-lg font-bold text-green-400">+50 ZMB</p>
              <p className="text-sm text-slate-400">Bonus Tokens</p>
            </div>
            <div className="text-center mt-2">
              <p className="text-sm text-slate-300">Next bonus available in:</p>
              <p className="text-lg font-bold text-white">24h 0m</p>
            </div>
          </div>
          <div className="flex justify-center">
            <Button
              className="mt-2 bg-green-600 hover:bg-green-700 text-white px-6"
              onClick={() => setShowBonusClaimed(false)}
            >
              Awesome!
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Wallet Status */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2 text-white">
            <Wallet className="w-4 h-4" />
            Wallet
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">SOL Balance</span>
            <span className="text-sm font-medium text-white">{wallet.balance} SOL</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">ZMB Tokens</span>
            <span className="text-sm font-medium text-green-400">{wallet.tokenBalance.toLocaleString()}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Package className="w-3 h-3" />
              Inventory Value
            </span>
            <span className="text-sm font-medium text-blue-400">$0</span>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2">
            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={handleTopUpClick}>
              Top Up SOL
            </Button>
            <Button
              size="sm"
              className={`bg-green-600 hover:bg-green-700 text-white ${Number(wallet.balance) <= 0 ? "opacity-50 cursor-not-allowed" : ""}`}
              onClick={handleBuyZMBClick}
              disabled={Number(wallet.balance) <= 0}
            >
              Buy ZMB
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics (formerly Game Rewards) */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2 text-white">
            <BarChart className="w-4 h-4" />
            Statistics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Lifetime Kills</span>
            <span className="text-sm font-medium text-red-400">0</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Kills Confirmed</span>
            <span className="text-sm font-medium text-orange-400">0</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Survival Streak</span>
            <span className="text-sm font-medium text-white">0 days</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Next Reward</span>
            <span className={`text-xs ${rewardReady ? "text-green-400 font-medium" : "text-slate-400"}`}>
              {rewardReady ? "Ready to claim!" : rewardTimer}
            </span>
          </div>

          <Button
            size="sm"
            className={`w-full mt-3 ${rewardReady ? "bg-green-600 hover:bg-green-700" : "bg-slate-600 opacity-50 cursor-not-allowed"}`}
            onClick={handleClaimBonus}
            disabled={!rewardReady}
          >
            <Coins className="w-3 h-3 mr-1" />
            Claim Daily Bonus
          </Button>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2 text-white">
            <RefreshCw className="w-4 h-4" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            size="sm"
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold"
            onClick={handleRagequitClick}
          >
            RAGEQUIT
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="w-full"
            onClick={() => window.open(`https://explorer.solana.com/address/${wallet.address}`, "_blank")}
          >
            View on Solana Explorer
          </Button>

          <Button size="sm" variant="outline" className="w-full">
            View Transactions
          </Button>

          <Button size="sm" variant="outline" className="w-full">
            <Settings className="w-3 h-3 mr-1" />
            Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
