import {
  disableRestrictions,
  enableRestrictions,
  setAutoMode,
  setManualMode,
} from '@renderer/commands/serialCommands'
import { Button } from '@renderer/components/ui/button'
import { cn } from '@renderer/lib/utils'
import { useControllerStateStore } from '@renderer/store/controllerStateStore'
import { useUIStore } from '@renderer/store/uiStore'
import { Activity, Hand, Shield, ShieldOff, Zap } from 'lucide-react'
import React from 'react'

export const ModeSwitcher: React.FC = () => {
  const { currentMode, setMode } = useUIStore()
  const { isSimulating, setSimulating, physicalRestrictions, setPhysicalRestrictions } = useControllerStateStore()

  return (
    <div className="flex w-full items-center gap-2">
      <div className="bg-muted flex items-center gap-1 rounded-lg p-1">
        <Button
          size="sm"
          variant={currentMode === 'manual' ? 'default' : 'ghost'}
          onClick={() => {
            setMode('manual')
            setManualMode()
          }}
          className={cn('gap-2', currentMode === 'manual' && 'shadow-sm')}
        >
          <Hand className="h-4 w-4" />
          Manual
        </Button>
        <Button
          size="sm"
          variant={currentMode === 'auto' ? 'default' : 'ghost'}
          onClick={() => {
            setMode('auto')
            setAutoMode()
          }}
          className={cn('gap-2', currentMode === 'auto' && 'shadow-sm')}
        >
          <Zap className="h-4 w-4" />
          Auto
        </Button>
      </div>

      {currentMode === 'auto' && (
        <Button
          size="sm"
          variant={isSimulating ? 'destructive' : 'outline'}
          onClick={() => setSimulating(!isSimulating)}
          className="gap-2"
        >
          <Activity className="h-4 w-4" />
          {isSimulating ? 'Stop Sim' : 'Simulate'}
        </Button>
      )}

      {currentMode === 'manual' && (
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
          className="gap-2"
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
          {physicalRestrictions ? 'Safe' : 'Override'}
        </Button>
      )}
    </div>
  )
}
