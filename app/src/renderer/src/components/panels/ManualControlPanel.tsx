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
            Motor Controls
          </CardTitle>
          <CardDescription>Test individual motors</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="mb-2 text-sm font-medium">Dosing Motor</h4>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={testDosingForward} className="flex-1">
                <ArrowUp className="mr-1 h-4 w-4" />
                Forward
              </Button>
              <Button size="sm" variant="outline" onClick={testDosingBackward} className="flex-1">
                <ArrowDown className="mr-1 h-4 w-4" />
                Backward
              </Button>
              <Button size="sm" variant="destructive" onClick={testDosingStop}>
                <Square className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <h4 className="mb-2 text-sm font-medium">Elevator Motor</h4>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={testElevatorUp} className="flex-1">
                <ArrowUp className="mr-1 h-4 w-4" />
                Up
              </Button>
              <Button size="sm" variant="outline" onClick={testElevatorDown} className="flex-1">
                <ArrowDown className="mr-1 h-4 w-4" />
                Down
              </Button>
              <Button size="sm" variant="destructive" onClick={testElevatorStop}>
                <Square className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <h4 className="mb-2 text-sm font-medium">Grinder Motor</h4>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={testGrinderOn} className="flex-1">
                <RotateCw className="mr-1 h-4 w-4" />
                On
              </Button>
              <Button size="sm" variant="outline" onClick={testGrinderOff} className="flex-1">
                <Square className="mr-1 h-4 w-4" />
                Off
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Solenoid Controls
          </CardTitle>
          <CardDescription>Test solenoid actuators</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="mb-2 text-sm font-medium">Transfer Solenoid</h4>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={testTransferOpen} className="flex-1">
                Open
              </Button>
              <Button size="sm" variant="outline" onClick={testTransferClose} className="flex-1">
                Close
              </Button>
            </div>
          </div>

          <div>
            <h4 className="mb-2 text-sm font-medium">Cap Solenoid</h4>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={testCapPush} className="flex-1">
                Push
              </Button>
              <Button size="sm" variant="outline" onClick={testCapRetract} className="flex-1">
                Retract
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Load Cell
          </CardTitle>
          <CardDescription>Test weight sensor</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={testLoadCell} className="flex-1">
              Test Reading
            </Button>
            <Button size="sm" variant="outline" onClick={tareLoadCell} className="flex-1">
              Tare
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
