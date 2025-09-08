import React from 'react'
import { ChevronRight, Clock, Gauge, Monitor, Sliders } from 'lucide-react'
import { Button } from './ui/button'
import { ScrollArea } from './ui/scroll-area'
import { Separator } from './ui/separator'
import { cn } from '../lib/utils'

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
      variant={isActive ? "secondary" : "ghost"}
      className="w-full justify-start h-auto py-3 px-3"
      onClick={onClick}
    >
      <div className="flex items-start gap-3 w-full">
        <div className="mt-0.5">{icon}</div>
        <div className="flex-1 text-left">
          <div className="font-medium text-sm">{label}</div>
          <div className="text-xs text-muted-foreground">{description}</div>
        </div>
        <ChevronRight className={cn(
          "h-4 w-4 mt-2 transition-transform",
          isActive && "rotate-90"
        )} />
      </div>
    </Button>
  )
}

export const SettingsSidebar: React.FC<SettingsSidebarProps> = (props) => {
  const { onSelectSection, currentSection } = props
  
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Sliders className="h-5 w-5" />
          Configuración
        </h2>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
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
      
      <div className="p-4 text-xs text-muted-foreground">
        <div>Sistema v1.0.0</div>
        <div>Arduino Mega 2560</div>
      </div>
    </div>
  )
}