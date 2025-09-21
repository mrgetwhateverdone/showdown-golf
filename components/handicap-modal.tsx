"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth"

interface HandicapModalProps {
  isOpen: boolean
  onClose: () => void
}

export function HandicapModal({ isOpen, onClose }: HandicapModalProps) {
  const { user, updateUser } = useAuth()
  const [handicap, setHandicap] = useState(user?.handicap || "")
  const [error, setError] = useState("")

  const handleSave = () => {
    setError("")

    if (!handicap.trim()) {
      updateUser({ handicap: "Not Set" })
      onClose()
      return
    }

    const handicapNum = Number.parseFloat(handicap)

    if (isNaN(handicapNum)) {
      setError("Please enter a valid number")
      return
    }

    if (handicapNum < -10 || handicapNum > 54) {
      setError("Handicap must be between -10 and 54")
      return
    }

    updateUser({ handicap: handicapNum.toString() })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Change Handicap</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Enter your current golf handicap. This helps create fair matches with other players.
          </p>

          <div className="space-y-2">
            <Label htmlFor="handicap">Handicap Index</Label>
            <Input
              id="handicap"
              type="number"
              step="0.1"
              min="-10"
              max="54"
              placeholder="e.g., 12.5"
              value={handicap}
              onChange={(e) => setHandicap(e.target.value)}
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <p className="text-xs text-gray-500">Valid range: -10 to 54. Leave empty for "Not Set"</p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent">
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex-1">
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
