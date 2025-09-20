import { Card, CardContent, CardHeader, CardTitle } from '@renderer/components/ui/card'
import { ScrollArea } from '@renderer/components/ui/scroll-area'
import { cn } from '@renderer/lib/utils'
import { useConnectionStore } from '@renderer/store/connectionStore'
import { Terminal } from 'lucide-react'
import React from 'react'

export const RightPanel: React.FC = () => {
  const { serialData } = useConnectionStore()
  return (
    <div className="flex h-full flex-col space-y-4 p-2">
      {/* Sensor Readings */}

      {/* Console - Takes remaining space */}
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
              {serialData.slice(-100).map((line, index) => (
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
    </div>
  )
}
