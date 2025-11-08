import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@renderer/components/ui/card'
import { ScrollArea } from '@renderer/components/ui/scroll-area'
import { cn } from '@renderer/lib/utils'
import { useConnectionStore } from '@renderer/store/connectionStore'
import { usePillTrackingStore } from '@renderer/store/pillTrackingStore'
import { BarChart3, Terminal } from 'lucide-react'
import React from 'react'

export const RightPanel: React.FC = () => {
  const { serialData } = useConnectionStore()
  const { currentCycle, isTracking } = usePillTrackingStore()

  return (
    <div className="flex h-full flex-col space-y-2 p-2">
      {/* Console - Takes most space */}
      <Card className="flex-1 overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Terminal className="h-4 w-4" />
            Consola
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[calc(100%-4rem)] p-0">
          <ScrollArea className="h-full px-4">
            <div className="space-y-0.5 py-2 font-mono text-xs">
              {serialData.slice(-500).map((line, index) => (
                <div
                  key={index}
                  className={cn(
                    'break-all whitespace-pre-wrap',
                    line.startsWith('>') && 'text-blue-600',
                    line.includes('ERROR') && 'font-semibold text-red-600',
                    line.includes('BLOCKED') && 'font-semibold text-orange-500',
                    line.includes('WARNING') && 'text-yellow-600',
                    line.includes('ALERT') && 'text-amber-600',
                    line.startsWith('DEBUG') && 'text-gray-500'
                  )}
                >
                  {line}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Cycle Statistics - Only if tracking */}
      {isTracking && currentCycle && currentCycle.totalPills > 0 && (
        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <BarChart3 className="h-4 w-4" />
              Estadísticas del Ciclo
            </CardTitle>
            <CardDescription className="text-xs">
              {currentCycle.totalPills} píldoras procesadas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Statistics Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-muted-foreground">Peso Promedio</p>
                <p className="font-mono font-semibold">
                  {currentCycle.averageWeight?.toFixed(2) || '—'} mg
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Desv. Estándar</p>
                <p className="font-mono font-semibold">
                  {currentCycle.standardDeviation?.toFixed(2) || '—'} mg
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Peso Mínimo</p>
                <p className="font-mono font-semibold">
                  {currentCycle.minWeight?.toFixed(2) || '—'} mg
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Peso Máximo</p>
                <p className="font-mono font-semibold">
                  {currentCycle.maxWeight?.toFixed(2) || '—'} mg
                </p>
              </div>
            </div>

            {/* Recent Pills List */}
            {currentCycle.pills.length > 0 && (
              <div className="border-t pt-3">
                <p className="text-muted-foreground mb-2 text-xs font-medium">
                  Píldoras Recientes
                </p>
                <ScrollArea className="h-32">
                  <div className="space-y-1 pr-4">
                    {currentCycle.pills
                      .slice()
                      .reverse()
                      .map((pill) => (
                        <div
                          key={pill.pillNumber}
                          className="flex items-center justify-between rounded-sm bg-muted/30 px-2 py-1 text-xs"
                        >
                          <span className="text-muted-foreground">Píldora #{pill.pillNumber}</span>
                          <span className="font-mono font-medium">
                            {pill.weight.toFixed(4)} mg
                          </span>
                        </div>
                      ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
