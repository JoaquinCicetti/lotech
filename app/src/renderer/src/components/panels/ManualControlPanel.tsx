import {
  dispenseOnePill,
  tareLoadCell,
  testCapPush,
  testCapRetract,
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
import {
  ArrowDown,
  ArrowUp,
  Eye,
  Play,
  Power,
  PowerOff,
  RedoDot,
  Scale,
  Square,
} from 'lucide-react'
import React from 'react'

export const ManualControlPanel: React.FC = () => {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">Controles de Motor</CardTitle>
          <CardDescription>Probar motores individualmente</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="mb-2 text-sm font-medium">Motor de Dosificación</h4>
            <div className="flex gap-2">
              <Button variant="outline" onClick={testDosingForward} className="flex-1">
                <Play className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={dispenseOnePill} className="flex-1">
                <RedoDot className="h-4 w-4" />
              </Button>
              <Button variant="destructive" onClick={testDosingStop} className="flex-1">
                <Square className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <h4 className="mb-2 text-sm font-medium">Motor del Elevador</h4>
            <div className="flex gap-2">
              <Button variant="outline" onClick={testElevatorUp} className="flex-1">
                <ArrowUp className="mr-1 h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={testElevatorDown} className="flex-1">
                <ArrowDown className="mr-1 h-4 w-4" />
              </Button>
              <Button variant="destructive" onClick={testElevatorStop} className="flex-1">
                <Square className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <h4 className="mb-2 text-sm font-medium">Motor del Molinillo</h4>
            <div className="flex gap-2">
              <Button variant="outline" onClick={testGrinderOn} className="flex-1">
                <Play className="h-4 w-4" />
              </Button>
              <Button variant="destructive" onClick={testGrinderOff} className="flex-1">
                <Square className="mr-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">Controles de Solenoide</CardTitle>
          <CardDescription>Probar actuadores solenoide</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="mb-2 text-sm font-medium">Solenoide de Transferencia</h4>
            <div className="flex gap-2">
              <Button variant="outline" onClick={testTransferOpen} className="flex-1">
                <Power className="h-4 w-4" />
              </Button>
              <Button variant="destructive" onClick={testTransferClose} className="flex-1">
                <PowerOff className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <h4 className="mb-2 text-sm font-medium">Solenoide de Tapado</h4>
            <div className="flex gap-2">
              <Button variant="outline" onClick={testCapPush} className="flex-1">
                <Power className="h-4 w-4" />
              </Button>
              <Button variant="destructive" onClick={testCapRetract} className="flex-1">
                <PowerOff className="h-4 w-4" />
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
            <Button variant="outline" onClick={testLoadCell} className="flex-1">
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={tareLoadCell} className="flex-1">
              <Scale className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
