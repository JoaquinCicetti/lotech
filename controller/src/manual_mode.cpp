#include "manual_mode.h"
#include "hardware.h"
#include "state_machine.h"
#include "config.h"

// Static member definitions
bool ManualMode::active = false;
bool ManualMode::physicalRestrictions = true;  // Default: safety ON
OperatingMode ManualMode::currentMode = MODE_MANUAL;  // Default: manual mode

void ManualMode::init() {
  currentMode = MODE_MANUAL;
  physicalRestrictions = true;  // Safety on by default
  Serial.println(F("MANUAL_MODE:INIT"));
  Serial.println(F("MODE:MANUAL"));
  Serial.println(F("RESTRICTIONS:ENABLED"));
}

void ManualMode::setMode(OperatingMode mode) {
  currentMode = mode;

  // Update OLED display
  if (oledDisplay.isInitialized()) {
    if (mode == MODE_MANUAL) {
      oledDisplay.showManualMode();
    } else {
      // Show current state when switching to auto
      oledDisplay.showState(stateMachine.getStateName(),
                           stateMachine.getPillCount(),
                           stateMachine.getLotSize());
    }
  }

  if (mode == MODE_MANUAL) {
    // Stop any automatic processes
    // Stop all hardware when switching to manual
    elevator.stop();
    dosingWheel.stop();
    grinder.stop();
    transferSolenoid.deactivate();
    capSolenoid.deactivate();
    Serial.println(F("MODE:MANUAL"));
  } else {
    // Resume automatic operation
    Serial.println(F("MODE:AUTO"));
  }
}

void ManualMode::setPhysicalRestrictions(bool enabled) {
  physicalRestrictions = enabled;
  Serial.print(F("RESTRICTIONS:"));
  Serial.println(enabled ? F("ENABLED") : F("DISABLED"));

  if (!enabled) {
    Serial.println(F("WARNING:SAFETY_BYPASSED"));
  }
}

void ManualMode::processCommand(const char* command) {
  // Mode switching
  if (strcmp(command, "MODE:MANUAL") == 0) {
    setMode(MODE_MANUAL);
  }
  else if (strcmp(command, "MODE:AUTO") == 0) {
    setMode(MODE_AUTO);
  }

  // Physical restrictions control
  else if (strcmp(command, "RESTRICTIONS:ON") == 0 || strcmp(command, "RESTRICTIONS:ENABLE") == 0) {
    setPhysicalRestrictions(true);
  }
  else if (strcmp(command, "RESTRICTIONS:OFF") == 0 || strcmp(command, "RESTRICTIONS:DISABLE") == 0) {
    setPhysicalRestrictions(false);
  }

  // Manual mode motor controls
  else if (isManual()) {
    // Dosing motor controls
    if (strcmp(command, "DOSING_FWD") == 0) {
      controlDosingMotor("FWD");
    }
    else if (strcmp(command, "DOSING_BWD") == 0) {
      controlDosingMotor("BWD");
    }
    else if (strcmp(command, "DOSING_STOP") == 0) {
      controlDosingMotor("STOP");
    }

    // Elevator controls
    else if (strcmp(command, "ELEVATOR_UP") == 0) {
      controlElevatorMotor("UP");
    }
    else if (strcmp(command, "ELEVATOR_DOWN") == 0) {
      controlElevatorMotor("DOWN");
    }
    else if (strcmp(command, "ELEVATOR_STOP") == 0) {
      controlElevatorMotor("STOP");
    }

    // Grinder controls
    else if (strcmp(command, "GRINDER_ON") == 0) {
      controlGrinderMotor("ON");
    }
    else if (strcmp(command, "GRINDER_OFF") == 0) {
      controlGrinderMotor("OFF");
    }

    // Transfer solenoid controls
    else if (strcmp(command, "TRANSFER_OPEN") == 0) {
      controlTransferSolenoid("OPEN");
    }
    else if (strcmp(command, "TRANSFER_CLOSE") == 0) {
      controlTransferSolenoid("CLOSE");
    }

    // Cap solenoid controls
    else if (strcmp(command, "CAP_PUSH") == 0) {
      controlCapSolenoid("PUSH");
    }
    else if (strcmp(command, "CAP_RETRACT") == 0) {
      controlCapSolenoid("RETRACT");
    }

    // Load cell commands
    else if (strcmp(command, "LOADCELL_TEST") == 0) {
      float weight = loadCell.readWeight();
      Serial.print(F("WEIGHT:"));
      Serial.println(weight);
    }
    else if (strcmp(command, "LOADCELL_TARE") == 0) {
      loadCell.tare();
      Serial.println(F("LOADCELL:TARED"));
    }

    // Home position
    else if (strcmp(command, "HOME") == 0) {
      // Move elevator to home position (down)
      if (canMoveElevatorDown()) {
        elevator.moveDown();
        Serial.println(F("HOMING:STARTED"));
      } else if (!physicalRestrictions) {
        // Force move if restrictions disabled
        elevator.moveDown();
        Serial.println(F("HOMING:FORCED"));
      } else {
        Serial.println(F("HOMING:BLOCKED"));
      }
    }
  }
}

void ManualMode::controlDosingMotor(const char* direction) {
  if (strcmp(direction, "FWD") == 0) {
    dosingWheel.startContinuous(true);  // Forward
    Serial.println(F("DOSING:FWD"));
  }
  else if (strcmp(direction, "BWD") == 0) {
    dosingWheel.startContinuous(false);  // Backward
    Serial.println(F("DOSING:BWD"));
  }
  else if (strcmp(direction, "STOP") == 0) {
    dosingWheel.stop();
    Serial.println(F("DOSING:STOPPED"));
  }
}

void ManualMode::controlElevatorMotor(const char* direction) {
  if (strcmp(direction, "UP") == 0) {
    if (canMoveElevatorUp()) {
      elevator.moveUp();
      Serial.println(F("ELEVATOR:UP"));
    } else {
      Serial.println(F("ELEVATOR:BLOCKED_TOP"));
    }
  }
  else if (strcmp(direction, "DOWN") == 0) {
    if (canMoveElevatorDown()) {
      elevator.moveDown();
      Serial.println(F("ELEVATOR:DOWN"));
    } else {
      Serial.println(F("ELEVATOR:BLOCKED_BOTTOM"));
    }
  }
  else if (strcmp(direction, "STOP") == 0) {
    elevator.stop();
    Serial.println(F("ELEVATOR:STOPPED"));
  }
}

void ManualMode::controlGrinderMotor(const char* state) {
  if (strcmp(state, "ON") == 0) {
    grinder.start();
    Serial.println(F("GRINDER:ON"));
  }
  else if (strcmp(state, "OFF") == 0) {
    grinder.stop();
    Serial.println(F("GRINDER:OFF"));
  }
}

void ManualMode::controlTransferSolenoid(const char* state) {
  if (strcmp(state, "OPEN") == 0) {
    transferSolenoid.activate();
    Serial.println(F("TRANSFER:OPEN"));
  }
  else if (strcmp(state, "CLOSE") == 0) {
    transferSolenoid.deactivate();
    Serial.println(F("TRANSFER:CLOSED"));
  }
}

void ManualMode::controlCapSolenoid(const char* state) {
  if (strcmp(state, "PUSH") == 0) {
    capSolenoid.activate();
    Serial.println(F("CAP:PUSHED"));
  }
  else if (strcmp(state, "RETRACT") == 0) {
    capSolenoid.deactivate();
    Serial.println(F("CAP:RETRACTED"));
  }
}

bool ManualMode::canMoveElevatorUp() {
  // If restrictions disabled, always allow movement
  if (!physicalRestrictions) {
    return true;
  }

  // Check physical limits
  return !elevator.isAtTop();
}

bool ManualMode::canMoveElevatorDown() {
  // If restrictions disabled, always allow movement
  if (!physicalRestrictions) {
    return true;
  }

  // Check physical limits
  return !elevator.isAtBottom();
}