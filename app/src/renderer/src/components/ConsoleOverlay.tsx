import React, { useEffect, useRef } from 'react'
import { Badge } from './ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { ScrollArea } from './ui/scroll-area'

interface ConsoleOverlayProps {
  serialData: string[]
  isVisible: boolean
}

interface ConsoleLineProps {
  line: string
  index: number
}

const ConsoleLine: React.FC<ConsoleLineProps> = (props) => {
  const { line } = props

  return <div className="text-muted-foreground mb-1 font-mono text-xs">{line}</div>
}

export const ConsoleOverlay: React.FC<ConsoleOverlayProps> = (props) => {
  const { serialData, isVisible } = props
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [serialData])

  if (!isVisible) return null

  const displayData = serialData.slice(-50)

  return (
    <Card className="bg-background/95 border-border fixed right-15 bottom-4 z-50 h-80 w-96 shadow-2xl backdrop-blur-md">
      <CardHeader className="border-b pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">Serial Console</CardTitle>
          <Badge variant="outline" className="text-xs">
            {serialData.length} lines
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[232px] p-4" ref={scrollRef}>
          {displayData.map((line, index) => (
            <ConsoleLine key={index} line={line} index={index} />
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
