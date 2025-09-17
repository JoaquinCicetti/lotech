import {
  tareLoadCell,
  testCapPush,
  testCapRetract,
  testDosingBackward,
  testDosingForward,
  testDosingStop,
  testElevatorDown,
  testElevatorStop,
  testElevatorUp,
  testGrinderOff,
  testGrinderOn,
  testLoadCell,
  testTransferClose,
  testTransferOpen,
} from '@renderer/commands/serialCommands'
import { Button } from '@renderer/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@renderer/components/ui/card'
import { ArrowDown, ArrowUp, RotateCw, Scale, Square, Zap } from 'lucide-react'
import React from 'react'

export const ManualControlPanel: React.FC = () => {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RotateCw className="h-5 w-5" />
            Controles de Motor
          </CardTitle>
          <CardDescription>Probar motores individualmente</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="mb-2 text-sm font-medium">Motor de Dosificación</h4>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={testDosingForward} className="flex-1">
                <ArrowUp className="mr-1 h-4 w-4" />
                Adelante
              </Button>
              <Button size="sm" variant="outline" onClick={testDosingBackward} className="flex-1">
                <ArrowDown className="mr-1 h-4 w-4" />
                Atrás
              </Button>
              <Button size="sm" variant="destructive" onClick={testDosingStop}>
                <Square className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <h4 className="mb-2 text-sm font-medium">Motor del Elevador</h4>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={testElevatorUp} className="flex-1">
                <ArrowUp className="mr-1 h-4 w-4" />
                Subir
              </Button>
              <Button size="sm" variant="outline" onClick={testElevatorDown} className="flex-1">
                <ArrowDown className="mr-1 h-4 w-4" />
                Bajar
              </Button>
              <Button size="sm" variant="destructive" onClick={testElevatorStop}>
                <Square className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <h4 className="mb-2 text-sm font-medium">Motor del Molino</h4>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={testGrinderOn} className="flex-1">
                <RotateCw className="mr-1 h-4 w-4" />
                Encender
              </Button>
              <Button size="sm" variant="outline" onClick={testGrinderOff} className="flex-1">
                <Square className="mr-1 h-4 w-4" />
                Apagar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Controles de Solenoide
          </CardTitle>
          <CardDescription>Probar actuadores solenoide</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="mb-2 text-sm font-medium">Solenoide de Transferencia</h4>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={testTransferOpen} className="flex-1">
                Abrir
              </Button>
              <Button size="sm" variant="outline" onClick={testTransferClose} className="flex-1">
                Cerrar
              </Button>
            </div>
          </div>

          <div>
            <h4 className="mb-2 text-sm font-medium">Solenoide de Tapado</h4>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={testCapPush} className="flex-1">
                Empujar
              </Button>
              <Button size="sm" variant="outline" onClick={testCapRetract} className="flex-1">
                Retraer
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Celda de Carga
          </CardTitle>
          <CardDescription>Probar sensor de peso</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={testLoadCell} className="flex-1">
              Probar Lectura
            </Button>
            <Button size="sm" variant="outline" onClick={tareLoadCell} className="flex-1">
              Tarar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
