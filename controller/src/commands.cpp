#include "commands.h"
#include "hardware.h"
#include "state_machine.h"
#include "state_persistence.h"
#include "config.h"
#include "manual_mode.h"

CommandProcessor commands;

void CommandProcessor::processSerialInput() {
  // Process entire command line or buffer limit
  while (Serial.available() > 0) {
    char incomingChar = Serial.read();

    if (incomingChar == '\n' || incomingChar == '\r') {
      if (bufferIndex > 0) {
        inputBuffer[bufferIndex] = '\0';
        processCommand(inputBuffer);
        bufferIndex = 0;
      }
    } else if (bufferIndex < BUFFER_SIZE - 1) {
      // Only accept printable ASCII characters and common control chars
      if (incomingChar >= 32 && incomingChar <= 126) {
        inputBuffer[bufferIndex++] = incomingChar;
      } else if (incomingChar == '\t') {
        // Allow tabs
        inputBuffer[bufferIndex++] = ' ';  // Convert to space
      }
      // Silently ignore other non-printable characters
    }

    // Small delay to allow serial buffer to fill before reading next byte
    // This prevents losing data when commands arrive in rapid succession
    if (Serial.available() == 0) {
      delayMicroseconds(100);
    }
  }
}

void CommandProcessor::processCommand(const char* command) {
  // Skip whitespace and non-printable characters at start
  while (*command != '\0' && (*command == ' ' || *command < 32 || *command > 126)) {
    command++;
  }
  if (*command == '\0') return;

  // Clean the command by copying only valid characters
  char cleanCommand[BUFFER_SIZE];
  int cleanIndex = 0;
  const char* src = command;

  while (*src != '\0' && cleanIndex < BUFFER_SIZE - 1) {
    if (*src >= 32 && *src <= 126) {
      cleanCommand[cleanIndex++] = *src;
    }
    src++;
  }
  cleanCommand[cleanIndex] = '\0';

  // Use the cleaned command
  command = cleanCommand;

  // Debug: Show cleaned command if it differs from original
  #ifdef DEBUG_COMMANDS
  if (cleanIndex > 0 && strcmp(command, inputBuffer) != 0) {
    Serial.print(F("DEBUG:CLEANED:"));
    Serial.println(command);
  }
  #endif

  // ========================================
  // SETTINGS - ALWAYS WORK REGARDLESS OF MODE
  // ========================================
  if (strncmp(command, "SET_DELAYS:", 11) == 0) {
    parseDelaySettings(command + 11);
    return;
  }
  else if (strncmp(command, "SET_DOSING:", 11) == 0) {
    parseDosingSettings(command + 11);
    return;
  }
  else if (strncmp(command, "SET_PROXIMITY:", 14) == 0) {
    parseProximitySettings(command + 14);
    return;
  }
  else if (strncmp(command, "SET_ELEVATOR:", 13) == 0) {
    parseElevatorSettings(command + 13);
    return;
  }
  else if (strncmp(command, "SET_TIMEOUTS:", 13) == 0) {
    parseTimeoutSettings(command + 13);
    return;
  }

  // ========================================
  // STATUS QUERIES - ALWAYS WORK
  // ========================================
  else if (strcmp(command, "STATUS") == 0) {
    sendStatus();
    return;
  }
  else if (strcmp(command, "GET:DELAYS") == 0) {
    sendDelays();
    return;
  }
  else if (strcmp(command, "GET:DOSING") == 0) {
    sendDosing();
    return;
  }
  else if (strcmp(command, "GET:ELEVATOR") == 0) {
    sendElevator();
    return;
  }
  else if (strcmp(command, "GET:TIMEOUTS") == 0) {
    sendTimeouts();
    return;
  }
  else if (strcmp(command, "RESET:SETTINGS") == 0) {
    StatePersistence::resetSettings();
    return;
  }

  // ========================================
  // MODE SWITCHING - ALWAYS WORKS
  // ========================================
  else if (strcmp(command, "MODE:MANUAL") == 0) {
    ManualMode::setMode(MODE_MANUAL);
    return;
  }
  else if (strcmp(command, "MODE:AUTO") == 0) {
    ManualMode::setMode(MODE_AUTO);
    return;
  }

  // ========================================
  // PHYSICAL RESTRICTIONS - ALWAYS WORKS
  // ========================================
  else if (strcmp(command, "RESTRICTIONS:ON") == 0 || strcmp(command, "RESTRICTIONS:ENABLE") == 0) {
    ManualMode::setPhysicalRestrictions(true);
    return;
  }
  else if (strcmp(command, "RESTRICTIONS:OFF") == 0 || strcmp(command, "RESTRICTIONS:DISABLE") == 0) {
    ManualMode::setPhysicalRestrictions(false);
    return;
  }

  // ========================================
  // STATE RECOVERY COMMANDS - ALWAYS WORK
  // ========================================
  else if (strcmp(command, "CLEAR_STATE") == 0) {
    StatePersistence::clearState();
    stateMachine.resetPillCount();
    stateMachine.changeState(ESTADO0_INICIO);
    Serial.println(F("STATE:CLEARED"));
    return;
  }
  else if (strcmp(command, "RECOVER_STATE") == 0) {
    if (stateMachine.recoverStateFromEEPROM()) {
      Serial.println(F("STATE:RECOVERED"));
    } else {
      Serial.println(F("STATE:NO_SAVED_STATE"));
    }
    return;
  }

  // ========================================
  // EMERGENCY STOP - ALWAYS WORKS
  // ========================================
  else if (strcmp(command, "EMERGENCY_STOP") == 0) {
    // Stop all hardware
    elevator.stop();
    dosingWheel.stop();
    grinder.stop();
    transferSolenoid.deactivate();
    capSolenoid.deactivate();

    // Clear all button states to prevent immediate restart
    inputs.clearButtons();
    inputs.simulateStart(false);
    inputs.simulateReset(false);

    // Reset pill counter on emergency
    stateMachine.resetPillCount();

    // Reset to initial state
    stateMachine.changeState(ESTADO0_INICIO);
    Serial.println(F("EMERGENCY:STOPPED"));
    Serial.println(F("PILLS:0/0"));
    return;
  }

  // ========================================
  // MOTOR CONTROL - WORKS IN ANY MODE
  // Direct control commands for motors/solenoids
  // ========================================

  // Dosing motor
  else if (strcmp(command, "DOSING_FWD") == 0) {
    if (ManualMode::isAuto()) {
      Serial.println(F("WARNING:MANUAL_CMD_IN_AUTO"));
    }
    dosingWheel.startContinuous(true);
    Serial.println(F("DOSING:FWD"));
    return;
  }
  else if (strcmp(command, "DOSING_BWD") == 0) {
    if (ManualMode::isAuto()) {
      Serial.println(F("WARNING:MANUAL_CMD_IN_AUTO"));
    }
    dosingWheel.startContinuous(false);
    Serial.println(F("DOSING:BWD"));
    return;
  }
  else if (strcmp(command, "DOSING_STOP") == 0) {
    dosingWheel.stopContinuous();
    dosingWheel.stop();  // Also stop regular dosing
    Serial.println(F("DOSING:STOPPED"));
    return;
  }
  // Dispense one pill based on wheel divisions setting
  else if (strcmp(command, "DISPENSE_ONE") == 0) {
    if (ManualMode::isManual()) {
      dosingWheel.dispenseOne();
      Serial.println(F("DOSING:ONE_PILL"));

      // Debug info
      Serial.print(F("DEBUG:STEPS_PER_REV="));
      Serial.print(STEPS_PER_REVOLUTION);
      Serial.print(F(" DIVISIONS="));
      Serial.print(wheel_divisions);
      Serial.print(F(" STEPS_PER_DIV="));
      Serial.println(STEPS_PER_REVOLUTION / wheel_divisions);
    } else {
      Serial.println(F("ERROR:DISPENSE_REQUIRES_MANUAL"));
    }
    return;
  }

  // Test specific number of steps
  else if (strncmp(command, "DOSING_STEPS:", 13) == 0) {
    if (ManualMode::isManual()) {
      int steps = atoi(command + 13);
      dosingWheel.motor.move(steps);
      Serial.print(F("DOSING:MANUAL_STEPS:"));
      Serial.println(steps);
    } else {
      Serial.println(F("ERROR:MANUAL_MODE_REQUIRED"));
    }
    return;
  }

  // Elevator
  else if (strcmp(command, "ELEVATOR_UP") == 0) {
    if (ManualMode::isAuto()) {
      Serial.println(F("WARNING:MANUAL_CMD_IN_AUTO"));
    }
    if (ManualMode::canMoveElevatorUp()) {
      elevator.moveUp();
    } else {
      Serial.println(F("ELEVATOR:BLOCKED_TOP"));
    }
    return;
  }
  else if (strcmp(command, "ELEVATOR_DOWN") == 0) {
    if (ManualMode::isAuto()) {
      Serial.println(F("WARNING:MANUAL_CMD_IN_AUTO"));
    }
    if (ManualMode::canMoveElevatorDown()) {
      elevator.moveDown();
    } else {
      Serial.println(F("ELEVATOR:BLOCKED_BOTTOM"));
    }
    return;
  }
  else if (strcmp(command, "ELEVATOR_STOP") == 0) {
    elevator.stop();
    return;
  }

  // Grinder (relay control)
  else if (strcmp(command, "GRINDER_ON") == 0) {
    if (ManualMode::isAuto()) {
      Serial.println(F("WARNING:MANUAL_CMD_IN_AUTO"));
    }
    grinder.start();
    Serial.println(F("GRINDER:ON"));
    Serial.print(F("RELAY_PIN:"));
    Serial.print(MOTOR3_RELAY_PIN);
    Serial.print(F(" STATE:"));
    Serial.println(digitalRead(MOTOR3_RELAY_PIN));
    return;
  }
  else if (strcmp(command, "GRINDER_OFF") == 0) {
    grinder.stop();
    Serial.println(F("GRINDER:OFF"));
    Serial.print(F("RELAY_PIN:"));
    Serial.print(MOTOR3_RELAY_PIN);
    Serial.print(F(" STATE:"));
    Serial.println(digitalRead(MOTOR3_RELAY_PIN));
    return;
  }

  // Test relay polarity
  else if (strcmp(command, "RELAY_TEST") == 0) {
    pinMode(MOTOR3_RELAY_PIN, OUTPUT);
    Serial.println(F("RELAY:TESTING_POLARITY"));

    // Test HIGH
    digitalWrite(MOTOR3_RELAY_PIN, HIGH);
    delay(100);
    Serial.print(F("HIGH_STATE:"));
    Serial.println(digitalRead(MOTOR3_RELAY_PIN));
    delay(500);

    // Test LOW
    digitalWrite(MOTOR3_RELAY_PIN, LOW);
    delay(100);
    Serial.print(F("LOW_STATE:"));
    Serial.println(digitalRead(MOTOR3_RELAY_PIN));

    Serial.println(F("RELAY:TEST_COMPLETE"));
    Serial.println(F("If motor runs on LOW, relay is active-low"));
    return;
  }

  // Transfer solenoid
  else if (strcmp(command, "TRANSFER_OPEN") == 0) {
    if (ManualMode::isAuto()) {
      Serial.println(F("WARNING:MANUAL_CMD_IN_AUTO"));
    }
    transferSolenoid.activate();
    Serial.println(F("TRANSFER:OPEN"));
    return;
  }
  else if (strcmp(command, "TRANSFER_CLOSE") == 0) {
    transferSolenoid.deactivate();
    Serial.println(F("TRANSFER:CLOSED"));
    return;
  }

  // Cap solenoid
  else if (strcmp(command, "CAP_PUSH") == 0) {
    if (ManualMode::isAuto()) {
      Serial.println(F("WARNING:MANUAL_CMD_IN_AUTO"));
    }
    capSolenoid.activate();
    Serial.println(F("CAP:PUSHED"));
    return;
  }
  else if (strcmp(command, "CAP_RETRACT") == 0) {
    capSolenoid.deactivate();
    Serial.println(F("CAP:RETRACTED"));
    return;
  }

  // Load cell
  else if (strcmp(command, "LOADCELL_TEST") == 0) {
    float weight = loadCell.readWeight();
    Serial.print(F("WEIGHT:"));
    Serial.println(weight);
    return;
  }
  else if (strcmp(command, "LOADCELL_TARE") == 0) {
    loadCell.tare();
    Serial.println(F("LOADCELL:TARED"));
    return;
  }

  // Home command
  else if (strcmp(command, "HOME") == 0) {
    if (ManualMode::canMoveElevatorDown()) {
      elevator.moveDown();
      Serial.println(F("HOMING:STARTED"));
    } else if (!ManualMode::hasPhysicalRestrictions()) {
      elevator.moveDown();
      Serial.println(F("HOMING:FORCED"));
    } else {
      Serial.println(F("HOMING:BLOCKED"));
    }
    return;
  }

  // ========================================
  // AUTO MODE PRODUCTION CONTROL
  // ========================================
  else if (strcmp(command, "START") == 0) {
    if (ManualMode::isAuto()) {
      inputs.simulateStart(true);
      Serial.println(F("AUTO:STARTED"));
    } else {
      Serial.println(F("ERROR:START_REQUIRES_AUTO"));
    }
    return;
  }
  else if (strcmp(command, "STOP") == 0) {
    if (ManualMode::isAuto()) {
      stateMachine.changeState(ESTADO0_INICIO);
      elevator.stop();
      dosingWheel.stop();
      grinder.stop();
      transferSolenoid.deactivate();
      capSolenoid.deactivate();
      inputs.clearButtons();
      Serial.println(F("AUTO:STOPPED"));
    } else {
      Serial.println(F("ERROR:STOP_REQUIRES_AUTO"));
    }
    return;
  }

  // RESET command - clears errors and resets state
  else if (strcmp(command, "RESET") == 0) {
    // Stop all motors and actuators
    elevator.stop();
    dosingWheel.stop();
    grinder.stop();
    transferSolenoid.deactivate();
    capSolenoid.deactivate();

    // Clear button states
    inputs.clearButtons();
    inputs.simulateStart(false);
    inputs.simulateReset(false);

    // Reset pill counter
    stateMachine.resetPillCount();

    // Reset elevator position to bottom (safe assumption)
    elevator.atTop = false;
    elevator.atBottom = true;

    // Clear error message
    stateMachine.setErrorMessage(nullptr);

    // Clear EEPROM state
    StatePersistence::clearState();

    // Go back to initial state
    stateMachine.changeState(ESTADO0_INICIO);

    Serial.println(F("SYSTEM:RESET_COMPLETE"));
    Serial.println(F("PILLS:0/0"));
    Serial.println(F("ELEVATOR:RESET_TO_BOTTOM"));
    return;
  }

  // CLEAR_STATE command - clears EEPROM saved state
  else if (strcmp(command, "CLEAR_STATE") == 0) {
    StatePersistence::clearState();
    stateMachine.resetPillCount();

    // Force clean start
    stateMachine.changeState(ESTADO0_INICIO);

    // Reset elevator position
    elevator.atTop = false;
    elevator.atBottom = true;

    Serial.println(F("STATE:CLEARED"));
    Serial.println(F("PILLS:0/0"));
    return;
  }

  // Unknown command
  Serial.print(F("ERROR:UNKNOWN_CMD:"));
  Serial.println(command);
}

// ========================================
// HELPER FUNCTIONS
// ========================================

void CommandProcessor::parseDelaySettings(const char* params) {
  // Parse format: "settle:1000,weight:2000,..."
  Serial.print(F("DEBUG:parseDelaySettings received: "));
  Serial.println(params);

  char buffer[256];  // Increased from 128 to handle all delay parameters
  strncpy(buffer, params, sizeof(buffer) - 1);
  buffer[sizeof(buffer) - 1] = '\0';

  char* token = strtok(buffer, ",");
  while (token != NULL) {
    Serial.print(F("DEBUG:Processing token: "));
    Serial.println(token);

    char* separator = strchr(token, ':');
    if (separator != NULL) {
      *separator = '\0';
      const char* key = token;
      unsigned long value = strtoul(separator + 1, NULL, 10);  // Use strtoul for unsigned long

      Serial.print(F("DEBUG:Key='"));
      Serial.print(key);
      Serial.print(F("' Value="));
      Serial.println(value);

      if (strcmp(key, "settle") == 0) t_step_settle = value;
      else if (strcmp(key, "weight") == 0) t_weight_settle = value;
      else if (strcmp(key, "transfer") == 0) t_transfer = value;
      else if (strcmp(key, "grind") == 0) t_grind = value;
      else if (strcmp(key, "cap") == 0) t_cap_push = value;
      else if (strcmp(key, "elevUp") == 0) {
        Serial.print(F("DEBUG:MATCH elevUp! Setting t_elev_up from "));
        Serial.print(t_elev_up);
        Serial.print(F(" to "));
        Serial.println(value);
        t_elev_up = value;
        Serial.print(F("DEBUG:t_elev_up is now: "));
        Serial.println(t_elev_up);
      }
      else if (strcmp(key, "elevDown") == 0) {
        Serial.print(F("DEBUG:MATCH elevDown! Setting t_elev_down from "));
        Serial.print(t_elev_down);
        Serial.print(F(" to "));
        Serial.println(value);
        t_elev_down = value;
        Serial.print(F("DEBUG:t_elev_down is now: "));
        Serial.println(t_elev_down);
      }
      else {
        Serial.print(F("DEBUG:NO MATCH for key: "));
        Serial.println(key);
      }
    }
    token = strtok(NULL, ",");
  }
  Serial.println(F("DELAYS:UPDATED"));

  // Save to EEPROM
  StatePersistence::saveSettings();

  // Debug: print actual values
  Serial.print(F("DEBUG:t_elev_up="));
  Serial.print(t_elev_up);
  Serial.print(F(",t_elev_down="));
  Serial.println(t_elev_down);
}

void CommandProcessor::parseDosingSettings(const char* params) {
  // Parse format: "wheelDivisions,lotSize,motorSpeed" (motorSpeed is optional)
  int divisions = 0;
  int lot = 0;
  int speed = 0;

  int parsed = sscanf(params, "%d,%d,%d", &divisions, &lot, &speed);

  if (parsed >= 2) {
    wheel_divisions = divisions;
    lot_size = lot;

    // Update motor speed if provided
    if (parsed == 3 && speed > 0) {
      dosing_speed = speed;
      // Update motor with new speed
      dosingWheel.motor.setSpeed(dosing_speed);
    }

    dosingWheel.updateStepsPerDivision();
    Serial.println(F("DOSING:UPDATED"));

    // Save to EEPROM
    StatePersistence::saveSettings();

    // Update OLED display with new lot size
    if (oledDisplay.isInitialized()) {
      oledDisplay.showState(stateMachine.getStateName(), stateMachine.getPillCount(), lot_size);
    }
  }
}

void CommandProcessor::parseProximitySettings(const char* params) {
  // Parse format: "min,max"
  int min = 0;
  int max = 0;
  if (sscanf(params, "%d,%d", &min, &max) == 2) {
    prox_threshold_down = min;
    prox_threshold_up = max;
    Serial.println(F("PROXIMITY:UPDATED"));

    // Save to EEPROM
    StatePersistence::saveSettings();
  }
}

void CommandProcessor::sendStatus() {
  Serial.print(F("STATUS:"));
  Serial.print(F("MODE:"));
  Serial.print(ManualMode::isManual() ? F("MANUAL") : F("AUTO"));
  Serial.print(F(",STATE:"));
  Serial.print(stateMachine.getStateName());
  Serial.print(F(",PILLS:"));
  Serial.println(stateMachine.getPillCount());
}

void CommandProcessor::sendDelays() {
  Serial.print(F("DELAYS:"));
  Serial.print(F("settle:"));
  Serial.print(t_step_settle);
  Serial.print(F(",weight:"));
  Serial.print(t_weight_settle);
  Serial.print(F(",transfer:"));
  Serial.print(t_transfer);
  Serial.print(F(",grind:"));
  Serial.print(t_grind);
  Serial.print(F(",cap:"));
  Serial.print(t_cap_push);
  Serial.print(F(",elevUp:"));
  Serial.print(t_elev_up);
  Serial.print(F(",elevDown:"));
  Serial.println(t_elev_down);
}

void CommandProcessor::sendDosing() {
  Serial.print(F("DOSING:"));
  Serial.print(F("divisions:"));
  Serial.print(wheel_divisions);
  Serial.print(F(",lot_size:"));
  Serial.print(lot_size);
  Serial.print(F(",motor_speed:"));
  Serial.println(dosing_speed);
}

void CommandProcessor::parseElevatorSettings(const char* params) {
  // Parse format: "speed:800"
  char buffer[64];
  strncpy(buffer, params, sizeof(buffer) - 1);
  buffer[sizeof(buffer) - 1] = '\0';

  char* token = strtok(buffer, ",");
  while (token != NULL) {
    char* separator = strchr(token, ':');
    if (separator != NULL) {
      *separator = '\0';
      const char* key = token;
      int value = atoi(separator + 1);

      if (strcmp(key, "speed") == 0) {
        // Validate elevator speed range
        if (value >= ELEVATOR_MIN_SPEED && value <= ELEVATOR_MAX_SPEED) {
          elevator_speed = value;
          Serial.print(F("DEBUG:Setting elevator_speed to "));
          Serial.println(value);
        } else {
          Serial.print(F("ERROR:ELEVATOR_SPEED_OUT_OF_RANGE:"));
          Serial.print(ELEVATOR_MIN_SPEED);
          Serial.print(F("-"));
          Serial.println(ELEVATOR_MAX_SPEED);
          return;
        }
      }
    }
    token = strtok(NULL, ",");
  }
  Serial.println(F("ELEVATOR:UPDATED"));

  // Save to EEPROM
  StatePersistence::saveSettings();
}

void CommandProcessor::sendElevator() {
  Serial.print(F("ELEVATOR:"));
  Serial.print(F("speed:"));
  Serial.print(elevator_speed);
  Serial.print(F(",min_speed:"));
  Serial.print(ELEVATOR_MIN_SPEED);
  Serial.print(F(",max_speed:"));
  Serial.println(ELEVATOR_MAX_SPEED);
}

void CommandProcessor::sendTimeouts() {
  Serial.print(F("TIMEOUTS:"));
  Serial.print(F("transfer_max:"));
  Serial.print(t_transfer_max);
  Serial.print(F(",cap_max:"));
  Serial.print(t_cap_max);
  Serial.print(F(",grinder_max:"));
  Serial.println(t_grinder_max);
}

void CommandProcessor::parseTimeoutSettings(const char* params) {
  // Parse format: "transfer_max:5000,cap_max:5000,grinder_max:30000"
  char buffer[128];
  strncpy(buffer, params, sizeof(buffer) - 1);
  buffer[sizeof(buffer) - 1] = '\0';

  char* token = strtok(buffer, ",");
  while (token != NULL) {
    char* separator = strchr(token, ':');
    if (separator != NULL) {
      *separator = '\0';
      const char* key = token;
      unsigned long value = strtoul(separator + 1, NULL, 10);

      if (strcmp(key, "transfer_max") == 0) {
        t_transfer_max = value;
      } else if (strcmp(key, "cap_max") == 0) {
        t_cap_max = value;
      } else if (strcmp(key, "grinder_max") == 0) {
        t_grinder_max = value;
      }
    }
    token = strtok(NULL, ",");
  }

  Serial.println(F("TIMEOUTS:UPDATED"));

  // Save to EEPROM
  StatePersistence::saveSettings();
}