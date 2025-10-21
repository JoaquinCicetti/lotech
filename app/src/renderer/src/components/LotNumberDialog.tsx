import React, { useState } from 'react'
import { usePillTrackingStore } from '../store/pillTrackingStore'
import { Button } from './ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { Input } from './ui/input'
import { Label } from './ui/label'

interface LotNumberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (lotNumber: string) => void
}

export const LotNumberDialog: React.FC<LotNumberDialogProps> = (props) => {
  const { open, onOpenChange, onConfirm } = props

  const [lotNumber, setLotNumber] = useState('')
  const [error, setError] = useState('')
  const { currentCycle, isTracking } = usePillTrackingStore()

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()

    console.log('Lot dialog submit - lot number:', lotNumber)

    if (!lotNumber.trim()) {
      setError('El número de lote es requerido')
      return
    }

    onConfirm(lotNumber.trim())
    setLotNumber('')
    setError('')
    onOpenChange(false)
  }

  const handleCancel = () => {
    setLotNumber('')
    setError('')
    onOpenChange(false)
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset when closing
      setLotNumber('')
      setError('')
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ingresar Número de Lote</DialogTitle>
          <DialogDescription>
            {isTracking && currentCycle ? (
              <span className="text-amber-600">
                {`Advertencia: Hay un ciclo activo para el lote "${currentCycle.lotNumber}" con 
                ${currentCycle.totalPills} píldoras. Iniciar un nuevo ciclo lo reemplazará.`}
              </span>
            ) : (
              'Por favor ingrese el número de lote para este ciclo de producción. Este será usado para rastrear todas las píldoras procesadas en este lote.'
            )}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="lot-number" className="text-right">
                Número de Lote
              </Label>
              <div className="col-span-3">
                <Input
                  id="lot-number"
                  value={lotNumber}
                  onChange={(e) => {
                    setLotNumber(e.target.value)
                    setError('')
                  }}
                  placeholder="Ingrese número de lote..."
                  className={error ? 'border-red-500' : ''}
                  autoFocus
                />
                {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button type="submit">Iniciar Ciclo</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
