import { ChevronRight, Clock, Gauge, Monitor, Sliders } from 'lucide-react'
import React from 'react'
import { cn } from '../lib/utils'
import { Button } from './ui/button'
import { ScrollArea } from './ui/scroll-area'
import { Separator } from './ui/separator'

interface SettingsSidebarProps {
  onSelectSection: (section: 'delays' | 'dosing' | 'view') => void
  currentSection?: 'delays' | 'dosing' | 'view'
}

interface MenuItemProps {
  icon: React.ReactNode
  label: string
  description: string
  onClick: () => void
  isActive?: boolean
}

const MenuItem: React.FC<MenuItemProps> = (props) => {
  const { icon, label, description, onClick, isActive = false } = props

  return (
    <Button
      variant={isActive ? 'secondary' : 'ghost'}
      className="h-auto w-full justify-start px-3 py-3"
      onClick={onClick}
    >
      <div className="flex w-full items-start gap-3">
        <div className="mt-0.5">{icon}</div>
        <div className="flex-1 text-left">
          <div className="text-sm font-medium">{label}</div>
          <div className="text-muted-foreground text-xs">{description}</div>
        </div>
        <ChevronRight
          className={cn('mt-2 h-4 w-4 transition-transform', isActive && 'rotate-90')}
        />
      </div>
    </Button>
  )
}

export const SettingsSidebar: React.FC<SettingsSidebarProps> = (props) => {
  const { onSelectSection, currentSection } = props

  return (
    <div className="flex h-full flex-col">
      <div className="border-border border-b p-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Sliders className="h-5 w-5" />
          Configuración
        </h2>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-2 p-3">
          <MenuItem
            icon={<Clock className="h-4 w-4" />}
            label="Tiempos de Espera"
            description="Ajustar delays del sistema"
            onClick={() => onSelectSection('delays')}
            isActive={currentSection === 'delays'}
          />

          <MenuItem
            icon={<Gauge className="h-4 w-4" />}
            label="Dosificación"
            description="Configurar rueda y lote"
            onClick={() => onSelectSection('dosing')}
            isActive={currentSection === 'dosing'}
          />

          <MenuItem
            icon={<Monitor className="h-4 w-4" />}
            label="Vista"
            description="Opciones de visualización"
            onClick={() => onSelectSection('view')}
            isActive={currentSection === 'view'}
          />
        </div>
      </ScrollArea>

      <Separator />

      <div className="text-muted-foreground p-4 text-xs">
        <div>Sistema v1.0.0</div>
        <div>Arduino Mega 2560</div>
      </div>
    </div>
  )
}
