#include "commands.h"
#include "hardware.h"
#include "state_machine.h"
#include "config.h"
#include "test_mode.h"

CommandProcessor commands;

void CommandProcessor::processSerialInput() {
  while (Serial.available() > 0) {
    char incomingChar = Serial.read();
    
    if (incomingChar == '\n' || incomingChar == '\r') {
      if (bufferIndex > 0) {
        inputBuffer[bufferIndex] = '\0';
        // Debug: echo command
        Serial.print(F("CMD:"));
        Serial.println(inputBuffer);
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
  
  // Mode commands
  if (strcmp(command, "MODE:REAL") == 0) {
    TestMode::setActive(false);
    setGlobalMode(MODE_REAL);
  } 
  else if (strcmp(command, "MODE:SIM") == 0) {
    TestMode::setActive(false);
    setGlobalMode(MODE_SIMULATION);
  } 
  else if (strcmp(command, "MODE:TEST") == 0) {
    TestMode::setActive(true);
  } 
  else if (TestMode::isActive()) {
    TestMode::processCommand(command);
    return;
  }
  
  // Button commands
  else if (strcmp(command, "BTN:START") == 0) {
    inputs.simulateStart(true);
    Serial.println(F("BTN:START:PRESSED"));
  } 
  else if (strcmp(command, "BTN:RESET") == 0) {
    inputs.simulateReset(true);
    Serial.println(F("BTN:RESET:PRESSED"));
  } 
  else if (strcmp(command, "RESET:ALL") == 0) {
    stateMachine.resetPillCount();
    stateMachine.changeState(ESTADO0_INICIO);
    elevator.stop();
    elevator.simulatePosition(false, true);
    grinder.stop();
    transferSolenoid.deactivate();
    capSolenoid.deactivate();
    dosingWheel.stop();
    loadCell.simulateWeight(false);
    inputs.simulateFrasco(true);
    inputs.simulatePastillas(true);
    inputs.clearButtons();
    Serial.println(F("SISTEMA:REINICIADO"));
  }
  
  // Simulation commands
  else if (strcmp(command, "SIM:POS_ALTA:1") == 0) {
    elevator.simulatePosition(true, false);
    Serial.println(F("SIM:POS_ALTA:ON"));
  } 
  else if (strcmp(command, "SIM:POS_ALTA:0") == 0) {
    elevator.simulatePosition(false, elevator.isAtBottom());
    Serial.println(F("SIM:POS_ALTA:OFF"));
  } 
  else if (strcmp(command, "SIM:POS_BAJA:1") == 0) {
    elevator.simulatePosition(false, true);
    Serial.println(F("SIM:POS_BAJA:ON"));
  } 
  else if (strcmp(command, "SIM:POS_BAJA:0") == 0) {
    elevator.simulatePosition(elevator.isAtTop(), false);
    Serial.println(F("SIM:POS_BAJA:OFF"));
  }
  else if (strcmp(command, "SIM:WEIGHT_STABLE:1") == 0) {
    loadCell.simulateWeight(true);
    Serial.println(F("SIM:WEIGHT_STABLE:ON"));
  } 
  else if (strcmp(command, "SIM:WEIGHT_STABLE:0") == 0) {
    loadCell.simulateWeight(false);
    Serial.println(F("SIM:WEIGHT_STABLE:OFF"));
  }
  else if (strcmp(command, "SIM:FRASCO_VACIO:1") == 0) {
    inputs.simulateFrasco(true);
    Serial.println(F("SIM:FRASCO_VACIO:ON"));
  } 
  else if (strcmp(command, "SIM:FRASCO_VACIO:0") == 0) {
    inputs.simulateFrasco(false);
    Serial.println(F("SIM:FRASCO_VACIO:OFF"));
  } 
  else if (strcmp(command, "SIM:PASTILLAS_CARGADAS:1") == 0) {
    inputs.simulatePastillas(true);
    Serial.println(F("SIM:PASTILLAS_CARGADAS:ON"));
  } 
  else if (strcmp(command, "SIM:PASTILLAS_CARGADAS:0") == 0) {
    inputs.simulatePastillas(false);
    Serial.println(F("SIM:PASTILLAS_CARGADAS:OFF"));
  }
  
  // Parameter commands - simplified parsing
  else if (strncmp(command, "SET:LOT_SIZE:", 13) == 0) {
    int size = atoi(command + 13);
    if (size > 0 && size <= wheel_divisions) {
      lot_size = size;
      Serial.print(F("SET:LOT_SIZE:"));
      Serial.println(lot_size);
    }
  }
  else if (strncmp(command, "SET:DIVISIONS:", 14) == 0) {
    int divisions = atoi(command + 14);
    if (divisions > 0 && divisions <= 50) {
      wheel_divisions = divisions;
      Serial.print(F("SET:DIVISIONS:"));
      Serial.println(wheel_divisions);
    }
  }
  
  // Delay commands
  else if (strncmp(command, "SET:DELAY:SETTLE:", 17) == 0) {
    t_step_settle = atoi(command + 17);
    Serial.print(F("SET:DELAY:SETTLE:"));
    Serial.println(t_step_settle);
  }
  else if (strncmp(command, "SET:DELAY:WEIGHT:", 17) == 0) {
    t_weight_settle = atoi(command + 17);
    Serial.print(F("SET:DELAY:WEIGHT:"));
    Serial.println(t_weight_settle);
  }
  else if (strncmp(command, "SET:DELAY:TRANSFER:", 19) == 0) {
    t_transfer = atoi(command + 19);
    Serial.print(F("SET:DELAY:TRANSFER:"));
    Serial.println(t_transfer);
  }
  else if (strncmp(command, "SET:DELAY:GRIND:", 16) == 0) {
    t_grind = atoi(command + 16);
    Serial.print(F("SET:DELAY:GRIND:"));
    Serial.println(t_grind);
  }
  else if (strncmp(command, "SET:DELAY:CAP:", 14) == 0) {
    t_cap_push = atoi(command + 14);
    Serial.print(F("SET:DELAY:CAP:"));
    Serial.println(t_cap_push);
  }
  else if (strncmp(command, "SET:DELAY:UP:", 13) == 0) {
    t_elev_up = atoi(command + 13);
    Serial.print(F("SET:DELAY:UP:"));
    Serial.println(t_elev_up);
  }
  else if (strncmp(command, "SET:DELAY:DOWN:", 15) == 0) {
    t_elev_down = atoi(command + 15);
    Serial.print(F("SET:DELAY:DOWN:"));
    Serial.println(t_elev_down);
  }
  
  // Query commands
  else if (strcmp(command, "GET:DOSING") == 0) {
    Serial.print(F("DOSING:DIVISIONS:"));
    Serial.print(wheel_divisions);
    Serial.print(F(",LOT_SIZE:"));
    Serial.println(lot_size);
  }
  else if (strcmp(command, "GET:DELAYS") == 0) {
    Serial.print(F("DELAYS:SETTLE:"));
    Serial.print(t_step_settle);
    Serial.print(F(",WEIGHT:"));
    Serial.print(t_weight_settle);
    Serial.print(F(",TRANSFER:"));
    Serial.print(t_transfer);
    Serial.print(F(",GRIND:"));
    Serial.print(t_grind);
    Serial.print(F(",CAP:"));
    Serial.print(t_cap_push);
    Serial.print(F(",UP:"));
    Serial.print(t_elev_up);
    Serial.print(F(",DOWN:"));
    Serial.println(t_elev_down);
  }
  else if (strcmp(command, "STATUS") == 0) {
    printStatus();
  } 
  else if (strcmp(command, "HELP") == 0) {
    printHelp();
  }
  else {
    Serial.print(F("UNKNOWN:"));
    Serial.println(command);
  }
}

void CommandProcessor::printStatus() {
  Serial.print(F("STATUS:"));
  Serial.print(F("ESTADO:"));
  Serial.print(stateMachine.getStateName());
  Serial.print(F(",PASTILLAS:"));
  Serial.print(stateMachine.getPillCount());
  Serial.print(F("/"));
  Serial.print(lot_size);
  Serial.print(F(",MODO:"));
  Serial.print(globalMode == MODE_REAL ? F("REAL") : F("SIM"));
  Serial.print(F(",PESO:"));
  Serial.print(loadCell.readWeight());
  Serial.print(F(",FRASCO_VACIO:"));
  Serial.print(inputs.isFrascoVacio() ? '1' : '0');
  Serial.print(F(",PASTILLAS_CARGADAS:"));
  Serial.print(inputs.isPastillasCargadas() ? '1' : '0');
  Serial.println();
}

void CommandProcessor::printHelp() {
  Serial.println(F("Commands: MODE:REAL/SIM, BTN:START/RESET"));
  Serial.println(F("SIM:POS_ALTA/BAJA:1/0"));
  Serial.println(F("SIM:WEIGHT_STABLE:1/0"));
  Serial.println(F("SIM:FRASCO_VACIO:1/0"));
  Serial.println(F("SIM:PASTILLAS_CARGADAS:1/0"));
  Serial.println(F("SET:LOT_SIZE:n, SET:DIVISIONS:n"));
  Serial.println(F("SET:DELAY:type:value"));
  Serial.println(F("GET:DELAYS, GET:DOSING, STATUS"));
}