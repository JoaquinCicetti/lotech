import { updateDelays, updateDosing, updateProximity } from '@renderer/commands/serialCommands'
import { Button } from '@renderer/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@renderer/components/ui/card'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { useSettingsStore } from '@renderer/store/settingsStore'
import { Clock, Package, Ruler, Settings } from 'lucide-react'
import React from 'react'

export const SettingsPanel: React.FC = () => {
  const {
    delays,
    dosing,
    proximity,
    updateDelay,
    updateDosing: updateDosingStore,
    updateProximity: updateProximityStore,
  } = useSettingsStore()

  const handleDelayChange = (key: keyof typeof delays, value: string) => {
    const numValue = parseInt(value, 10)
    if (!isNaN(numValue) && numValue >= 0) {
      updateDelay(key, numValue)
    }
  }

  const handleDosingChange = (key: keyof typeof dosing, value: string) => {
    const numValue = parseInt(value, 10)
    if (!isNaN(numValue) && numValue >= 0) {
      updateDosingStore(key, numValue)
    }
  }

  const handleProximityChange = (key: keyof typeof proximity, value: string) => {
    const numValue = parseInt(value, 10)
    if (!isNaN(numValue) && numValue >= 0) {
      updateProximityStore(key, numValue)
    }
  }

  const applySettings = async () => {
    await updateDelays(delays as unknown as Record<string, number>)
    await updateDosing(dosing.wheelDivisions, dosing.lotSize)
    await updateProximity(proximity.minProximity, proximity.maxProximity)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Delay Settings
          </CardTitle>
          <CardDescription>Configure timing delays in milliseconds</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="settle">Settle Time</Label>
            <Input
              id="settle"
              type="number"
              value={delays.settle}
              onChange={(e) => handleDelayChange('settle', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="weight">Weight Time</Label>
            <Input
              id="weight"
              type="number"
              value={delays.weight}
              onChange={(e) => handleDelayChange('weight', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="transfer">Transfer Time</Label>
            <Input
              id="transfer"
              type="number"
              value={delays.transfer}
              onChange={(e) => handleDelayChange('transfer', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="grind">Grind Time</Label>
            <Input
              id="grind"
              type="number"
              value={delays.grind}
              onChange={(e) => handleDelayChange('grind', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cap">Cap Time</Label>
            <Input
              id="cap"
              type="number"
              value={delays.cap}
              onChange={(e) => handleDelayChange('cap', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="elevUp">Elevator Up Time</Label>
            <Input
              id="elevUp"
              type="number"
              value={delays.elevUp}
              onChange={(e) => handleDelayChange('elevUp', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="elevDown">Elevator Down Time</Label>
            <Input
              id="elevDown"
              type="number"
              value={delays.elevDown}
              onChange={(e) => handleDelayChange('elevDown', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Dosing Settings
          </CardTitle>
          <CardDescription>Configure dosing parameters</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="wheelDivisions">Wheel Divisions</Label>
            <Input
              id="wheelDivisions"
              type="number"
              value={dosing.wheelDivisions}
              onChange={(e) => handleDosingChange('wheelDivisions', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lotSize">Lot Size</Label>
            <Input
              id="lotSize"
              type="number"
              value={dosing.lotSize}
              onChange={(e) => handleDosingChange('lotSize', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ruler className="h-5 w-5" />
            Proximity Settings
          </CardTitle>
          <CardDescription>Configure proximity sensor thresholds</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="minProximity">Minimum Distance</Label>
            <Input
              id="minProximity"
              type="number"
              value={proximity.minProximity}
              onChange={(e) => handleProximityChange('minProximity', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxProximity">Maximum Distance</Label>
            <Input
              id="maxProximity"
              type="number"
              value={proximity.maxProximity}
              onChange={(e) => handleProximityChange('maxProximity', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Button onClick={applySettings} className="w-full">
        <Settings className="mr-2 h-4 w-4" />
        Apply Settings to Controller
      </Button>
    </div>
  )
}
