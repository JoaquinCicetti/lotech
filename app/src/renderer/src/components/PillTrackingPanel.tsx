import { Download, FileText, Package2 } from 'lucide-react'
import React from 'react'
import { toast } from 'sonner'
import { usePillTrackingStore } from '../store/pillTrackingStore'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'

export const PillTrackingPanel: React.FC = () => {
  const { currentCycle, isTracking, endCycle, exportCycleData } = usePillTrackingStore()

  const handleExportCycle = async () => {
    if (!currentCycle) {
      toast.error('No hay datos de ciclo para exportar')
      return
    }

    const csvContent = exportCycleData(currentCycle)
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
    const filename = `lotech_${currentCycle.lotNumber}_${timestamp}.csv`

    try {
      const result = await window.file.saveDialog({
        content: csvContent,
        defaultFilename: filename,
      })

      if (result.success) {
        toast.success(`Datos del ciclo guardados en ${result.path}`)
      } else if (!result.canceled) {
        toast.error('Error al guardar el archivo')
      }
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Error al exportar datos del ciclo')
    }
  }

  const handleEndCycle = async () => {
    const completedCycle = endCycle()
    if (completedCycle) {
      // Automatically prompt to save
      const csvContent = exportCycleData(completedCycle)
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
      const filename = `lotech_${completedCycle.lotNumber}_${timestamp}.csv`

      try {
        const result = await window.file.saveDialog({
          content: csvContent,
          defaultFilename: filename,
        })

        if (result.success) {
          toast.success(`Ciclo finalizado y datos guardados en ${result.path}`)
        } else {
          toast.warning('Ciclo finalizado pero los datos no se guardaron')
        }
      } catch (error) {
        console.error('Export error:', error)
        toast.error('Ciclo finalizado pero fallo al guardar datos')
      }
    }
  }

  if (!isTracking || !currentCycle) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package2 className="h-5 w-5" />
            Seguimiento de Píldoras
          </CardTitle>
          <CardDescription>No hay ciclo de seguimiento activo</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Inicie un nuevo ciclo para comenzar a rastrear el peso de las píldoras
          </p>
        </CardContent>
      </Card>
    )
  }

  const formatDuration = (startTime: number) => {
    const duration = Date.now() - startTime
    const minutes = Math.floor(duration / 60000)
    const seconds = Math.floor((duration % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package2 className="h-5 w-5" />
          Seguimiento de Píldoras - Activo
        </CardTitle>
        <CardDescription>Lote: {currentCycle.lotNumber}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Statistics */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Píldoras Procesadas</p>
            <p className="text-2xl font-bold">{currentCycle.totalPills}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Duración</p>
            <p className="text-2xl font-bold">{formatDuration(currentCycle.startTime)}</p>
          </div>
        </div>

        {currentCycle.totalPills > 0 && (
          <div className="border-t pt-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Peso Promedio</p>
                <p className="font-semibold">
                  {currentCycle.averageWeight?.toFixed(2) || '—'} mg
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Desv. Estándar</p>
                <p className="font-semibold">
                  {currentCycle.standardDeviation?.toFixed(2) || '—'} mg
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Peso Mínimo</p>
                <p className="font-semibold">
                  {currentCycle.minWeight?.toFixed(2) || '—'} mg
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Peso Máximo</p>
                <p className="font-semibold">
                  {currentCycle.maxWeight?.toFixed(2) || '—'} mg
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Recent Pills */}
        {currentCycle.pills.length > 0 && (
          <div className="border-t pt-4">
            <p className="text-muted-foreground mb-2 text-sm">Píldoras Recientes</p>
            <div className="max-h-32 space-y-1 overflow-y-auto">
              {currentCycle.pills
                .slice(-5)
                .reverse()
                .map((pill) => (
                  <div
                    key={pill.pillNumber}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-muted-foreground">
                      Píldora #{pill.pillNumber}
                    </span>
                    <span className="font-mono">{pill.weight.toFixed(4)} mg</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 border-t pt-4">
          <Button
            onClick={handleExportCycle}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Exportar
          </Button>
          <Button
            onClick={handleEndCycle}
            variant="destructive"
            size="sm"
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Finalizar y Guardar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}