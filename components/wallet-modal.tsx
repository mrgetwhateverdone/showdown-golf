"use client"

import { X, Plus, Minus } from "lucide-react"
import { useAuth } from "@/lib/auth"

interface Transaction {
  id: string
  description: string
  amount: number
  date: string
}

interface WalletModalProps {
  open: boolean
  onClose: () => void
}

export function WalletModal({ open, onClose }: WalletModalProps) {
  const { user } = useAuth()

  if (!open) return null

  const transactions: Transaction[] = []

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20">
      <div className="bg-white rounded-3xl w-full max-w-md mx-4 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6">
          <h2 className="text-xl font-semibold">Wallet</h2>
          <button onClick={onClose}>
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Balance */}
        <div className="px-6 pb-6 text-center">
          <p className="text-gray-600 mb-2">Available Balance</p>
          <p className="text-4xl font-bold">${user?.balance?.toFixed(2) || "0.00"}</p>
        </div>

        {/* Action Buttons */}
        <div className="px-6 pb-6 space-y-3">
          <button className="w-full bg-teal-700 text-white py-3 rounded-2xl font-semibold flex items-center justify-center gap-2">
            <Plus className="w-5 h-5" />
            Add Money
          </button>
          <button className="w-full border-2 border-teal-700 text-teal-700 py-3 rounded-2xl font-semibold flex items-center justify-center gap-2">
            <Minus className="w-5 h-5" />
            Withdraw Money
          </button>
        </div>

        {/* Recent Transactions */}
        <div className="px-6 pb-6">
          <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
          <div className="space-y-3">
            {transactions.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Minus className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-gray-600">No transactions yet</p>
                <p className="text-sm text-gray-500 mt-1">Your transaction history will appear here</p>
              </div>
            ) : (
              transactions.map((transaction) => (
                <div key={transaction.id} className="bg-gray-50 rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-gray-500">{transaction.date}</p>
                    </div>
                    <p className={`font-semibold ${transaction.amount > 0 ? "text-green-600" : "text-red-600"}`}>
                      {transaction.amount > 0 ? "+" : ""}${Math.abs(transaction.amount).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
