# Store Refactor Migration Guide

## Overview
The store has been refactored from a single monolithic `appStore` into multiple domain-specific stores for better separation of concerns and to prevent render loops.

## New Store Structure

### 1. **settingsStore** (`store/settingsStore.ts`)
- Persistent configuration values
- Includes: delays, dosing, proximity settings
- Auto-persists to localStorage

### 2. **controllerStateStore** (`store/controllerStateStore.ts`)
- Real-time hardware state (READ-ONLY from controller)
- Includes: sensor readings, machine state, hardware status
- Updates via event subscription (no polling)

### 3. **connectionStore** (`store/connectionStore.ts`)
- Serial connection management
- Includes: ports, connection status, serial data log

### 4. **uiStore** (`store/uiStore.ts`)
- UI-only state
- Includes: current mode (production/test), view mode, modals, notifications

## Commands
Actions are now simple functions in `commands/serialCommands.ts`, not store state:
- Production commands: `startProduction()`, `stopProduction()`, etc.
- Test commands: `testDosingForward()`, `testDosingBackward()`, etc.

## New Components

### Panels
- `SettingsPanel` - Configure machine settings
- `StatePanel` - Display real-time machine state
- `TestControlPanel` - Motor and solenoid test controls

### UI Components
- `FloatingActionBar` - Bottom-centered action buttons
- `ModeSwitcher` - Toggle between Production and Test modes

## Migration Steps

### Step 1: Install new dependencies (if needed)
```bash
pnpm install
```

### Step 2: Update imports in existing components

Replace:
```typescript
import { useAppStore } from '@renderer/store/appStore'
```

With appropriate stores:
```typescript
import { useSettingsStore } from '@renderer/store/settingsStore'
import { useControllerStateStore } from '@renderer/store/controllerStateStore'
import { useConnectionStore } from '@renderer/store/connectionStore'
import { useUIStore } from '@renderer/store/uiStore'
```

### Step 3: Update component usage

Before:
```typescript
const {
  systemStatus,
  currentDelays,
  setCurrentDelays
} = useAppStore()
```

After:
```typescript
// Use specific stores
const { delays, setDelays } = useSettingsStore()
const { machineState, sensorReadings } = useControllerStateStore()
```

### Step 4: Replace command queue with direct commands

Before:
```typescript
queueCommand('START')
```

After:
```typescript
import { startProduction } from '@renderer/commands/serialCommands'
startProduction()
```

### Step 5: Switch to refactored components

1. Rename current files as backup:
   - `App.tsx` → `App.old.tsx`
   - `components/Layout.tsx` → `components/Layout.old.tsx`

2. Rename refactored files:
   - `App.refactored.tsx` → `App.tsx`
   - `components/Layout.refactored.tsx` → `components/Layout.tsx`

### Step 6: Test the application

1. Run the development server:
   ```bash
   pnpm dev
   ```

2. Test all modes:
   - Production mode controls
   - Test mode motor controls
   - Settings panel
   - State monitoring

### Step 7: Clean up

Once verified working:
1. Delete old backup files (`*.old.tsx`)
2. Remove old `appStore.ts`
3. Update any remaining components to use new stores

## Key Benefits

1. **No render loops** - Event-driven updates instead of polling
2. **Clear separation** - Settings, state, and UI are separate
3. **Better performance** - Components only re-render when their specific data changes
4. **Easier testing** - Test individual stores and commands
5. **Type safety** - Each store has specific, well-typed interface

## Troubleshooting

### Issue: Serial commands not working
- Check that `connectionStore.isConnected` is true
- Verify `selectedPort` is set correctly

### Issue: Settings not persisting
- `settingsStore` uses localStorage with key `lotech-settings`
- Check browser DevTools > Application > Local Storage

### Issue: State not updating
- Ensure serial parser is correctly parsing messages
- Check console for parsing errors
- Verify controller is sending expected format

## Testing Checklist

- [ ] Connection to serial port works
- [ ] Production mode: Start/Stop/Pause buttons work
- [ ] Test mode: Motor control buttons work
- [ ] Settings panel: Values persist after reload
- [ ] State panel: Shows real-time sensor data
- [ ] Mode switcher: Toggles between Production/Test
- [ ] Floating action bar: Appears at bottom center
- [ ] No console errors or warnings
- [ ] No render loops (check React DevTools)