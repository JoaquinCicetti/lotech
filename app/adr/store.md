# ADR: Layout and Store Refactor

## Status
Proposed

## Context
The current appStore is chaotic and mixes different concerns:
- Settings (persisted values like times, dosing, min/max proximity)
- Controller state (real-time readings from hardware)
- UI state (modes, views)

This causes:
- Render loops when reading controller state
- Unclear data flow
- Difficult testing
- Mixed responsibilities

## Decision

### 1. Store Architecture - Split into Domain Stores

#### settingsStore
**Purpose**: Persistent configuration values
```typescript
- dosingSettings:
  - dosingTime
  - dosingAmount
- proximitySettings:
  - minProximity
  - maxProximity
- timingSettings:
  - cycleTime
  - other timing parameters
- persist to localStorage
- only update on user action
```

#### controllerStateStore
**Purpose**: Real-time hardware state (READ-ONLY from controller)
```typescript
- sensorReadings:
  - loadCell values
  - proximity sensor states
  - motor positions
- machineState:
  - current state in state machine
  - isRunning
  - isPaused
  - errors
- IMPORTANT: Debounced/throttled updates to prevent render loops
- Subscribe to serial data events
```

#### uiStore
**Purpose**: UI-only state
```typescript
- currentMode: 'production' | 'test'
- activeView: string
- modalStates
- notification queue
```

### 2. Commands/Actions (NOT in a store - just functions)

Commands are functions that send serial commands to the controller:

```typescript
// commands.ts - Just functions, not store state!

// Production commands
const startProduction = () => sendSerial('START')
const stopProduction = () => sendSerial('STOP')
const pauseProduction = () => sendSerial('PAUSE')
const resumeProduction = () => sendSerial('RESUME')

// Test mode commands - for testing individual components
const testMotorForward = (motorId: string) => sendSerial(`MOTOR_FWD:${motorId}`)
const testMotorBackward = (motorId: string) => sendSerial(`MOTOR_BWD:${motorId}`)
const testMotorStop = (motorId: string) => sendSerial(`MOTOR_STOP:${motorId}`)

// Specific for dosing motor testing
const testDosingForward = () => sendSerial('DOSING_FWD')
const testDosingBackward = () => sendSerial('DOSING_BWD')
const testDosingStop = () => sendSerial('DOSING_STOP')

const testSolenoid = (solenoidId: string) => sendSerial(`SOLENOID:${solenoidId}`)
const testLoadCell = () => sendSerial('LOADCELL_TEST')
```

### 3. Layout Changes

#### Header
- Mode selector (Production/Test)
- Connection status indicator
- Settings button

#### Main Content Area

**Production Mode:**
```
+----------------------------------+
|     State Machine Visualization  |
|     (Shows current state)        |
+----------------------------------+
|  Sensor Readings  |   Statistics |
|  - Load cells     |   - Cycle    |
|  - Proximity      |   - Count     |
+----------------------------------+
```

**Test Mode:**
```
+----------------------------------+
|     State Machine Visualization  |
|     (Shows all sensor states)    |
+----------------------------------+
|  Component Testing Controls      |
|  +----------------------------+  |
|  | Motors:                    |  |
|  | [Dosing FWD] [BWD] [STOP]  |  |
|  | [Motor2 FWD] [BWD] [STOP]  |  |
|  +----------------------------+  |
|  | Solenoids:                 |  |
|  | [Sol1] [Sol2] [Sol3]       |  |
|  +----------------------------+  |
|  | Load Cells:                |  |
|  | [Test] Current: XXX kg     |  |
|  +----------------------------+  |
+----------------------------------+
```

#### Floating Action Bar (Bottom Center)
```
+----------------------------------+
|    [Start] [Stop] [Pause]        |
|    (Changes based on mode)       |
+----------------------------------+
```
- Position: fixed bottom, centered
- Elevation: high z-index with shadow
- Content changes based on mode:
  - Production: Start, Stop, Pause, Emergency Stop
  - Test: Emergency Stop only (individual component buttons are in main area)

### 4. Data Flow Rules

#### Preventing Render Loops
1. Controller state updates via event subscription, not polling
2. Use debouncing/throttling for high-frequency updates
3. Separate read streams from write commands
4. Use React.memo and useMemo for expensive computations

#### State Update Pattern
```typescript
// BAD - causes loops
useEffect(() => {
  const data = readFromSerial();
  setState(data);
}, [state]); // dependency on state!

// GOOD - event driven
useEffect(() => {
  const handler = (data) => {
    setState(data);
  };
  serialPort.on('data', handler);
  return () => serialPort.off('data', handler);
}, []); // no dependencies
```

### 5. Test Mode Motor Controls

In test mode, we need direct control buttons for each motor:

```typescript
// Test Mode UI Component Example
function MotorTestControls() {
  return (
    <div>
      <h3>Dosing Motor</h3>
      <button onClick={() => testDosingForward()}>Forward</button>
      <button onClick={() => testDosingBackward()}>Backward</button>
      <button onClick={() => testDosingStop()}>Stop</button>

      <h3>Other Motors</h3>
      {/* Similar controls for other motors */}
    </div>
  )
}
```

These are direct control buttons that send commands immediately when pressed.
NO settings needed - just immediate motor control for circuit testing.

### 6. Implementation Steps

1. **Phase 1: Store Refactor**
   - Create new store files (settings, controllerState, ui)
   - Create commands.ts for all serial commands
   - Migrate existing state to appropriate stores

2. **Phase 2: Component Refactor**
   - Update components to use new stores
   - Implement proper memoization
   - Add event-based updates

3. **Phase 3: Layout Implementation**
   - Create floating action bar component
   - Implement state machine visualization
   - Add test mode controls for motors/solenoids

4. **Phase 4: Testing & Optimization**
   - Verify no render loops
   - Test all motor controls in test mode
   - Performance profiling

## Consequences

### Positive
- Clear separation of concerns
- No render loops from controller state
- Direct motor control for testing
- Commands are simple functions, not store state
- Better performance
- Cleaner component code

### Negative
- Initial refactoring effort
- Need to update all components
- More files to manage

## Next Steps
1. Review and approve this ADR
2. Create store files
3. Create commands.ts with all serial commands
4. Add test mode motor control UI
5. Begin incremental migration