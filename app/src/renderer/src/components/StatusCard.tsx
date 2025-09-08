import React from 'react'
import { cn } from '../lib/utils'
import { Card } from './ui/card'

interface StatusCardProps {
  state: string
  pillCount: number
  targetPills: number
  weight?: number
  isConnected: boolean
  loadCellCount?: number
  className?: string
  position?: 'floating' | 'static'
}

interface StatusRowProps {
  label: string
  value: string
  variant?: 'default' | 'primary' | 'secondary' | 'muted'
}

const StatusRow: React.FC<StatusRowProps> = (props) => {
  const { label, value, variant = 'default' } = props

  const valueClasses = {
    default: 'text-foreground',
    primary: 'text-primary',
    secondary: 'text-secondary-foreground',
    muted: 'text-muted-foreground',
  }

  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className={`font-mono text-sm font-medium ${valueClasses[variant]}`}>{value}</span>
    </div>
  )
}

export const StatusCard: React.FC<StatusCardProps> = (props) => {
  const {
    state,
    pillCount,
    targetPills,
    weight = 0,
    isConnected,
    loadCellCount = 0,
    className,
    position = 'static',
  } = props

  const progress = (pillCount / targetPills) * 100

  return (
    <Card
      className={cn(
        'shadow-xl',
        position === 'floating'
          ? 'bg-background/95 border-border backdrop-blur-md'
          : 'bg-card border-border',
        className
      )}
    >
      <div className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Estado de Máquina</h3>
          <div
            className={`h-3 w-3 rounded-full transition-colors ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            } ${isConnected ? 'shadow-sm shadow-green-500/50' : ''}`}
          />
        </div>

        <div className="space-y-3">
          <StatusRow label="Estado" value={state} variant="primary" />
          <StatusRow label="Progreso" value={`${pillCount}/${targetPills}`} />
          <StatusRow label="Peso" value={`${weight.toFixed(2)}g`} variant="secondary" />
          {loadCellCount !== undefined && (
            <StatusRow label="Celdas Activas" value={`${loadCellCount}/9`} />
          )}
        </div>

        {/* Progress Bar */}
        <div className="mt-5">
          <div className="bg-muted h-2 overflow-hidden rounded-full">
            <div
              className="from-primary to-primary/80 h-full rounded-full bg-gradient-to-r transition-all duration-500"
              style={{
                width: `${Math.min(progress, 100)}%`,
              }}
            />
          </div>
          <div className="mt-2 flex justify-between">
            <span className="text-muted-foreground text-xs">{Math.round(progress)}%</span>
            <span className="text-muted-foreground text-xs">{pillCount} pastillas</span>
          </div>
        </div>
      </div>
    </Card>
  )
}
