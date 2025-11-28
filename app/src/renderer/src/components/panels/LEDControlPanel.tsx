import { Label } from '@renderer/components/ui/label'
import { Slider } from '@renderer/components/ui/slider'
import {
  clearLEDs,
  saveLEDs,
  setAllLEDs,
  setLEDBrightness,
  setLEDColor,
  setLEDRange,
} from '@renderer/serial/serialCommands'
import { useSettingsStore } from '@renderer/store/settingsStore'
import { LEDColor } from '@renderer/types'
import { Check } from 'lucide-react'
import React, { useState } from 'react'
import { Button } from '../ui/button'

const QUICK_COLORS = [
  { name: 'Rojo', color: { r: 255, g: 0, b: 0 } },
  { name: 'Verde', color: { r: 0, g: 255, b: 0 } },
  { name: 'Azul', color: { r: 0, g: 0, b: 255 } },
  { name: 'Amarillo', color: { r: 255, g: 255, b: 0 } },
  { name: 'Cyan', color: { r: 0, g: 255, b: 255 } },
  { name: 'Magenta', color: { r: 255, g: 0, b: 255 } },
  { name: 'Blanco', color: { r: 255, g: 255, b: 255 } },
  { name: 'Apagar', color: { r: 0, g: 0, b: 0 } },
]

export const LEDControlPanel: React.FC = () => {
  const { led, updateLEDBrightness, updateLEDColor, setAllLEDColors } = useSettingsStore()
  const [selectedLEDs, setSelectedLEDs] = useState<Set<number>>(new Set())
  const [currentColor, setCurrentColor] = useState<LEDColor>({ r: 255, g: 255, b: 255 })

  const toggleLEDSelection = (index: number) => {
    const newSelection = new Set(selectedLEDs)
    if (newSelection.has(index)) {
      newSelection.delete(index)
    } else {
      newSelection.add(index)
    }
    setSelectedLEDs(newSelection)
  }

  const selectAll = () => {
    setSelectedLEDs(new Set(Array.from({ length: 10 }, (_, i) => i)))
  }

  const clearSelection = () => {
    setSelectedLEDs(new Set())
  }

  const applyColorToSelection = async (color: LEDColor) => {
    if (selectedLEDs.size === 0) {
      // If no selection, apply to all
      setAllLEDColors(color)
      await setAllLEDs(color.r, color.g, color.b)
    } else {
      // Convert selection to sorted array
      const indices = Array.from(selectedLEDs).sort((a, b) => a - b)

      // Find consecutive ranges for batch commands
      const ranges: Array<{ start: number; end: number }> = []
      let rangeStart = indices[0]
      let rangeEnd = indices[0]

      for (let i = 1; i < indices.length; i++) {
        if (indices[i] === rangeEnd + 1) {
          // Consecutive, extend range
          rangeEnd = indices[i]
        } else {
          // Gap found, save current range and start new one
          ranges.push({ start: rangeStart, end: rangeEnd })
          rangeStart = indices[i]
          rangeEnd = indices[i]
        }
      }
      // Don't forget the last range
      ranges.push({ start: rangeStart, end: rangeEnd })

      // Update local state
      selectedLEDs.forEach((index) => {
        updateLEDColor(index, color)
      })

      // Send batch commands (no EEPROM save per command)
      for (const range of ranges) {
        if (range.start === range.end) {
          // Single LED
          await setLEDColor(range.start, color.r, color.g, color.b)
        } else {
          // Range of LEDs
          await setLEDRange(range.start, range.end, color.r, color.g, color.b)
        }
      }

      // Save to EEPROM once at the end
      await saveLEDs()
    }
  }

  const applyCurrentColor = () => {
    applyColorToSelection(currentColor)
  }

  const colorToHex = (color: LEDColor) => {
    return `#${color.r.toString(16).padStart(2, '0')}${color.g.toString(16).padStart(2, '0')}${color.b.toString(16).padStart(2, '0')}`
  }

  const hexToColor = (hex: string): LEDColor => {
    return {
      r: parseInt(hex.slice(1, 3), 16),
      g: parseInt(hex.slice(3, 5), 16),
      b: parseInt(hex.slice(5, 7), 16),
    }
  }

  return (
    <div className="space-y-3">
      {/* Brightness slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Brillo</Label>
          <span className="text-muted-foreground text-xs">{led.brightness}</span>
        </div>
        <Slider
          value={[led.brightness]}
          onValueChange={([value]) => {
            updateLEDBrightness(value)
            setLEDBrightness(value)
          }}
          min={0}
          max={255}
          step={1}
          className="w-full"
        />
      </div>

      {/* Color Picker */}
      <div className="space-y-2">
        <Label className="text-xs">Color</Label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={colorToHex(currentColor)}
            onChange={(e) => setCurrentColor(hexToColor(e.target.value))}
            className="h-10 w-20 cursor-pointer rounded border"
          />
          <Button
            size="sm"
            variant="default"
            onClick={applyCurrentColor}
            className="flex-1 text-xs"
            disabled={selectedLEDs.size === 0}
          >
            {selectedLEDs.size === 0
              ? 'Aplicar a todos'
              : `Aplicar a ${selectedLEDs.size} LED${selectedLEDs.size > 1 ? 's' : ''}`}
          </Button>
        </div>
      </div>

      {/* Quick Color Palette */}
      <div className="space-y-2">
        <Label className="text-xs">Paleta Rápida</Label>
        <div className="grid grid-cols-4 gap-1">
          {QUICK_COLORS.map((preset) => (
            <Button
              key={preset.name}
              size="sm"
              variant="outline"
              onClick={() => applyColorToSelection(preset.color)}
              className="h-8 text-xs"
              style={{
                backgroundColor: `rgb(${preset.color.r}, ${preset.color.g}, ${preset.color.b})`,
                color:
                  preset.color.r + preset.color.g + preset.color.b > 384 ? '#000000' : '#ffffff',
                borderColor:
                  preset.color.r + preset.color.g + preset.color.b === 0
                    ? '#666666'
                    : 'transparent',
              }}
            >
              {preset.name}
            </Button>
          ))}
        </div>
      </div>

      {/* LED Grid with Selection */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs">
            LEDs ({selectedLEDs.size > 0 ? `${selectedLEDs.size} seleccionados` : '10'})
          </Label>
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" onClick={selectAll} className="h-6 px-2 text-xs">
              Todos
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={clearSelection}
              className="h-6 px-2 text-xs"
              disabled={selectedLEDs.size === 0}
            >
              Limpiar
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-1">
          {led.colors.map((color, index) => {
            const isSelected = selectedLEDs.has(index)
            return (
              <button
                key={index}
                onClick={() => toggleLEDSelection(index)}
                className={`relative h-10 w-full cursor-pointer rounded border-2 transition-all ${
                  isSelected ? 'border-primary ring-primary/50 scale-105 ring-2' : 'border-border'
                }`}
                style={{
                  backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})`,
                }}
                title={`LED ${index + 1}${isSelected ? ' (seleccionado)' : ''}`}
              >
                {isSelected && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Check
                      className="h-4 w-4 drop-shadow-lg"
                      style={{
                        color:
                          color.r + color.g + color.b > 384
                            ? 'rgba(0,0,0,0.8)'
                            : 'rgba(255,255,255,0.9)',
                      }}
                    />
                  </div>
                )}
                <span
                  className="absolute right-0 bottom-0 px-1 text-[8px] font-bold opacity-50"
                  style={{
                    color: color.r + color.g + color.b > 384 ? '#000000' : '#ffffff',
                  }}
                >
                  {index + 1}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Group Selection Shortcuts */}
      <div className="space-y-2">
        <Label className="text-xs">Selección Rápida</Label>
        <div className="grid grid-cols-2 gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedLEDs(new Set(Array.from({ length: 5 }, (_, i) => i)))
            }}
            className="h-7 text-xs"
          >
            1-5
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedLEDs(new Set(Array.from({ length: 5 }, (_, i) => i + 5)))
            }}
            className="h-7 text-xs"
          >
            6-10
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            const color = { r: 255, g: 255, b: 255 }
            setAllLEDColors(color)
            setAllLEDs(255, 255, 255)
            clearSelection()
          }}
          className="h-7 flex-1 text-xs"
        >
          Todo blanco
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setAllLEDColors({ r: 0, g: 0, b: 0 })
            clearLEDs()
            clearSelection()
          }}
          className="h-7 flex-1 text-xs"
        >
          Apagar todo
        </Button>
      </div>
    </div>
  )
}
