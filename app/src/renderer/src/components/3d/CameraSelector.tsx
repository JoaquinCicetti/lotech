import { Card } from '@renderer/components/ui/card'
import { CameraPreset, useCameraStore } from '@renderer/store/cameraStore'
import { Box, Camera, Maximize, MoveHorizontal, MoveVertical } from 'lucide-react'
import React, { useEffect } from 'react'

interface PresetConfig {
  id: CameraPreset
  label: string
  icon: React.ReactNode
  key: string
}

const PRESETS: PresetConfig[] = [
  {
    id: 'free',
    label: 'Libre',
    icon: <Camera className="h-4 w-4" />,
    key: '1',
  },
  {
    id: 'isometric',
    label: 'Isométrica',
    icon: <Box className="h-4 w-4" />,
    key: '2',
  },
  {
    id: 'front',
    label: 'Lateral',
    icon: <MoveHorizontal className="h-4 w-4" />,
    key: '3',
  },
  {
    id: 'side',
    label: 'Frontal',
    icon: <Maximize className="h-4 w-4" />,
    key: '4',
  },
  {
    id: 'top',
    label: 'Superior',
    icon: <MoveVertical className="h-4 w-4" />,
    key: '5',
  },
]

export const CameraSelector: React.FC = () => {
  const { currentPreset, setPreset } = useCameraStore()

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignore if typing in input, textarea, or select
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT'
      ) {
        return
      }

      // Ignore if a dialog/modal is open
      const hasOpenDialog = document.querySelector('[role="dialog"][data-state="open"]')
      if (hasOpenDialog) {
        return
      }

      const preset = PRESETS.find((p) => p.key === e.key)
      if (preset) {
        setPreset(preset.id)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [setPreset])

  return (
    <div className="z-10">
      <Card className="bg-background/80 shadow-lg backdrop-blur-sm">
        <div className="flex gap-1 p-2">
          {PRESETS.map((preset) => {
            const isActive = currentPreset === preset.id

            return (
              <button
                key={preset.id}
                onClick={() => setPreset(preset.id)}
                className={`group relative flex flex-col items-center gap-1 rounded-md px-3 py-2 transition-all ${
                  isActive
                    ? 'from-primary to-primary/80 text-primary-foreground bg-gradient-to-br'
                    : 'hover:bg-muted'
                }`}
                title={`${preset.label} (${preset.key})`}
              >
                {preset.icon}
                <span className="text-[10px] font-medium">{preset.label}</span>
                <span className="text-muted-foreground absolute -top-1 -right-1 rounded bg-gray-800 px-1 text-[8px] opacity-0 transition-opacity group-hover:opacity-100">
                  {preset.key}
                </span>
              </button>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
