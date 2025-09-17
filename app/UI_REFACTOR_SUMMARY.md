# UI Refactor Summary: Manual/Auto Modes

## Overview

The UI has been refactored from the confusing test/production/simulation states to a cleaner **Manual** and **Auto** mode architecture.

## Key Changes

### 1. Mode Structure

- **Manual Mode**: Direct hardware control for testing and maintenance
- **Auto Mode**: Automated production with optional simulation

### 2. Store Updates

#### UIStore

- Changed from `production | test` to `manual | auto` modes
- Default mode is now `manual`

#### ControllerStateStore

- Added `isSimulating` flag for simulation state
- Simulation only available in Auto mode

### 3. Component Changes

#### ModeSwitcher

- Manual/Auto toggle buttons
- Separate "Simulate" button (only visible in Auto mode)
- Clear visual separation between mode and simulation

#### LeftSidebar (Refactored)

- **Top Section**: Serial connection management (always visible)
- **Manual Mode**: Shows direct hardware controls
- **Auto Mode**: Shows two tabs:
  - Settings tab: Machine configuration
  - Simulation tab: Simulation parameters

#### FloatingActionBar

- **Manual Mode**: Home button + Emergency Stop
- **Auto Mode**: Start/Pause/Stop/Resume + Emergency Stop
- Position: Fixed bottom center

#### ManualControlPanel (formerly TestControlPanel)

- Motor controls with Forward/Backward/Stop buttons
- Solenoid controls for actuators
- Load cell testing functions
- Direct hardware control without automation

### 4. UI Flow

```
┌─────────────────────────────────────────┐
│              Header Bar                  │
│  [Settings] [Manual|Auto] [Simulate]     │
└─────────────────────────────────────────┘

┌──────────┬───────────────────┬──────────┐
│          │                   │          │
│  Left    │   Main Content    │  Right   │
│ Sidebar  │                   │ Sidebar  │
│          │  - State Machine  │          │
│ Manual:  │  - Process View   │ Console/ │
│ Controls │  - 3D View        │  State   │
│          │                   │          │
│ Auto:    │                   │          │
│ Settings │                   │          │
│          │                   │          │
└──────────┴───────────────────┴──────────┘

        [Floating Action Bar]
        Manual: [Home] [E-Stop]
        Auto: [Start] [Pause] [Stop] [E-Stop]
```

### 5. Behavior

#### Manual Mode

- Direct control over all hardware components
- No automated sequences
- Ideal for:
  - Testing individual motors
  - Circuit verification
  - Maintenance operations
  - Troubleshooting

#### Auto Mode

- Automated production sequences
- Optional simulation for testing without hardware
- When simulating:
  - Configurable cycle speed
  - Failure rate simulation
  - Sensor variation simulation
  - Auto-advance through states

### 6. Connection Management

- Connection panel integrated into left sidebar
- Always accessible regardless of mode
- Shows port selection and connection status
- Refresh button to scan for new ports

### 7. Benefits

1. **Clarity**: Clear distinction between manual control and automation
2. **Safety**: Manual mode for safe testing
3. **Flexibility**: Simulation only when needed in Auto mode
4. **Simplicity**: Removed confusing test/production distinction
5. **Accessibility**: Settings and connection in one place

## Migration Steps

1. Replace old App.tsx with App.refactored.tsx
2. Replace old Layout.tsx with Layout.refactored.tsx
3. Replace old LeftSidebar.tsx with LeftSidebar.refactored.tsx
4. Update imports to use new ManualControlPanel
5. Test both Manual and Auto modes
6. Verify simulation toggle works in Auto mode

## Testing Checklist

- [ ] Manual mode: All motor controls work
- [ ] Manual mode: Home button resets position
- [ ] Auto mode: Start/Stop/Pause work correctly
- [ ] Auto mode: Simulation can be toggled
- [ ] Connection panel works in both modes
- [ ] Settings persist across mode changes
- [ ] Emergency stop works in all modes
- [ ] State panel updates correctly
- [ ] No console errors
