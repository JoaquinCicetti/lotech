#include "commands.h"
#include "hardware.h"
#include "state_machine.h"
#include "config.h"
#include "manual_mode.h"

CommandProcessor commands;

void CommandProcessor::processSerialInput() {
  while (Serial.available() > 0) {
    char incomingChar = Serial.read();

    if (incomingChar == '\n' || incomingChar == '\r') {
      if (bufferIndex > 0) {
        inputBuffer[bufferIndex] = '\0';
        processCommand(inputBuffer);
        bufferIndex = 0;
      }
    } else if (bufferIndex < BUFFER_SIZE - 1) {
      inputBuffer[bufferIndex++] = incomingChar;
    }
  }
}

void CommandProcessor::processCommand(const char* command) {
  // Skip whitespace
  while (*command == ' ') command++;
  if (*command == '\0') return;

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
  // EMERGENCY STOP - ALWAYS WORKS
  // ========================================
  else if (strcmp(command, "EMERGENCY_STOP") == 0) {
    elevator.stop();
    dosingWheel.stop();
    grinder.stop();
    transferSolenoid.deactivate();
    capSolenoid.deactivate();
    stateMachine.changeState(ESTADO0_INICIO);
    Serial.println(F("EMERGENCY:STOPPED"));
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
    Serial.println(F("DOSING:STOPPED"));
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

  // Grinder
  else if (strcmp(command, "GRINDER_ON") == 0) {
    if (ManualMode::isAuto()) {
      Serial.println(F("WARNING:MANUAL_CMD_IN_AUTO"));
    }
    grinder.start();
    Serial.println(F("GRINDER:ON"));
    return;
  }
  else if (strcmp(command, "GRINDER_OFF") == 0) {
    grinder.stop();
    Serial.println(F("GRINDER:OFF"));
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

  // Unknown command
  Serial.print(F("ERROR:UNKNOWN_CMD:"));
  Serial.println(command);
}

// ========================================
// HELPER FUNCTIONS
// ========================================

void CommandProcessor::parseDelaySettings(const char* params) {
  // Parse format: "settle:1000,weight:2000,..."
  char buffer[128];
  strncpy(buffer, params, sizeof(buffer) - 1);
  buffer[sizeof(buffer) - 1] = '\0';

  char* token = strtok(buffer, ",");
  while (token != NULL) {
    char* separator = strchr(token, ':');
    if (separator != NULL) {
      *separator = '\0';
      const char* key = token;
      int value = atoi(separator + 1);

      if (strcmp(key, "settle") == 0) t_step_settle = value;
      else if (strcmp(key, "weight") == 0) t_weight_settle = value;
      else if (strcmp(key, "transfer") == 0) t_transfer = value;
      else if (strcmp(key, "grind") == 0) t_grind = value;
      else if (strcmp(key, "cap") == 0) t_cap_push = value;
      else if (strcmp(key, "elevUp") == 0) t_elev_up = value;
      else if (strcmp(key, "elevDown") == 0) t_elev_down = value;
    }
    token = strtok(NULL, ",");
  }
  Serial.println(F("DELAYS:UPDATED"));
}

void CommandProcessor::parseDosingSettings(const char* params) {
  // Parse format: "wheelDivisions,lotSize"
  int divisions = 0;
  int lot = 0;
  if (sscanf(params, "%d,%d", &divisions, &lot) == 2) {
    wheel_divisions = divisions;
    lot_size = lot;
    dosingWheel.updateStepsPerDivision();
    Serial.println(F("DOSING:UPDATED"));
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
  Serial.println(lot_size);
}