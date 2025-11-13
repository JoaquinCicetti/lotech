import { cn } from '@renderer/lib/utils'
import { ChevronDown } from 'lucide-react'
import React, { useState } from 'react'

interface CollapsibleProps {
  title: string
  icon?: React.ReactNode
  defaultOpen?: boolean
  children: React.ReactNode
  className?: string
}

export const Collapsible: React.FC<CollapsibleProps> = ({
  title,
  icon,
  defaultOpen = false,
  children,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className={cn('border-border/50 border-b', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="hover:bg-accent/50 flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors"
      >
        <div className="flex items-center gap-3">
          {icon && <span className="text-muted-foreground flex-shrink-0">{icon}</span>}
          <span className="font-medium">{title}</span>
        </div>
        <ChevronDown
          className={cn(
            'text-muted-foreground h-5 w-5 flex-shrink-0 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>
      <div
        className={cn(
          'grid transition-all duration-200 ease-in-out',
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        )}
      >
        <div className="overflow-hidden">
          <div className="space-y-3 px-3 pb-4">{children}</div>
        </div>
      </div>
    </div>
  )
}
