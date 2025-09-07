# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Lotech is an automated pharmaceutical pill processing machine system with:
- **Arduino firmware** controlling hardware (motors, solenoids, load cells)
- **Electron + React desktop app** for monitoring and control
- **Hardware integration** via serial communication

## Development Commands

### Desktop Application (in `app/` directory)
```bash
# Install dependencies
pnpm install

# Development
pnpm dev              # Start development server
pnpm lint             # Run ESLint
pnpm typecheck        # Check TypeScript types (both node and web)
pnpm format           # Format code with Prettier

# Building
pnpm build            # Build for production (with typecheck)
pnpm build:mac        # Build for macOS
pnpm build:win        # Build for Windows  
pnpm build:linux      # Build for Linux
```

### PlatformIO Controller (in `controller/` directory)
```bash
# Build firmware
pio run

# Upload to Arduino Mega
pio run --target upload

# Monitor serial output
pio device monitor --baud 9600

# List available ports
pio device list
```
- Board: Arduino Mega 2560
- Baud rate: 9600
- Main file: `src/main.cpp`

## Architecture

### Desktop App Structure
- **Electron app** with main/renderer process separation
- **Main process** (`src/main/`): Handles serial port communication, window management
- **Renderer** (`src/renderer/`): React UI components
- **Preload** (`src/preload/`): Bridge between main and renderer
- **Serial communication**: Using `serialport` library for Arduino interface

### Key Integration Points
- Serial port handling in `app/src/main/index.ts`
- IPC channels: `serial:list`, `serial:open`, `serial:close`, `serial:write`
- Event: `serial:data` for incoming Arduino data

### Hardware Control Flow
1. Desktop app sends commands via serial to Arduino
2. Arduino processes commands and controls hardware (motors, solenoids)
3. Arduino sends sensor data (load cell readings) back to app
4. App displays real-time status and logs data

## Important Files
- `app/src/main/index.ts`: Main process with serial port management
- `arduino/lotech_controller/`: Arduino firmware (currently empty, needs implementation)
- `docs/machine-workflow.md`: Detailed machine operation process
- `docs/technical-hardware-guide.md`: Hardware specifications and control details