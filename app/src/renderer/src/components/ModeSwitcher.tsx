import { Button } from '@renderer/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@renderer/components/ui/card'
import { cn } from '@renderer/lib/utils'
import {
  disableRestrictions,
  enableRestrictions,
  setAutoMode,
  setManualMode,
} from '@renderer/serial/serialCommands'
import { useControllerStateStore } from '@renderer/store/controllerStateStore'
import { useUIStore } from '@renderer/store/uiStore'
import { AppMode } from '@renderer/types'
import { Activity, Hand, Shield, ShieldOff, Zap } from 'lucide-react'
import React from 'react'
export const ModeSwitcher: React.FC = () => {
  const { currentMode, setMode } = useUIStore()
  const { isSimulating, setSimulating, physicalRestrictions, setPhysicalRestrictions } =
    useControllerStateStore()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">Modo</CardTitle>
        <CardDescription>Selección de modo de funcionamiento</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full items-center space-y-1">
          <div className="flex items-center gap-1 rounded-lg p-1">
            <Button
              size="sm"
              variant={currentMode === AppMode.MANUAL ? 'destructive' : 'ghost'}
              onClick={() => {
                setMode(AppMode.MANUAL)
                setManualMode()
              }}
              className={cn('flex-1 gap-2', currentMode === AppMode.MANUAL && 'shadow-sm')}
            >
              <Hand className="h-4 w-4" />
              Manual
            </Button>
            <Button
              size="sm"
              variant={currentMode === AppMode.AUTO ? 'default' : 'ghost'}
              onClick={() => {
                setMode(AppMode.AUTO)
                setAutoMode()
              }}
              className={cn('flex-1 gap-2', currentMode === AppMode.AUTO && 'shadow-sm')}
            >
              <Zap className="h-4 w-4" />
              Auto
            </Button>
          </div>
          <div className="flex items-center gap-1 rounded-lg p-1">
            {currentMode === AppMode.AUTO && (
              <Button
                size="sm"
                variant={isSimulating ? 'destructive' : 'outline'}
                onClick={() => setSimulating(!isSimulating)}
                className="flex-1 gap-2"
              >
                <Activity className="h-4 w-4" />
                {isSimulating ? 'Stop Sim' : 'Simulate'}
              </Button>
            )}

            {currentMode === AppMode.MANUAL && (
              <Button
                size="sm"
                variant={physicalRestrictions ? 'default' : 'destructive'}
                onClick={() => {
                  const newState = !physicalRestrictions
                  setPhysicalRestrictions(newState) // Update local state immediately
                  if (newState) {
                    enableRestrictions()
                  } else {
                    disableRestrictions()
                  }
                }}
                className="flex-1 gap-2"
                title={
                  physicalRestrictions
                    ? 'Safety restrictions are ON - motors stop at sensor limits'
                    : 'Safety restrictions are OFF - motors can move freely (WARNING!)'
                }
              >
                {physicalRestrictions ? (
                  <Shield className="h-4 w-4" />
                ) : (
                  <ShieldOff className="h-4 w-4" />
                )}
                {physicalRestrictions ? 'Seguro' : 'Sin restricciones'}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
