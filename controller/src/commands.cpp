#include "commands.h"
#include "hardware.h"
#include "state_machine.h"
#include "config.h"

CommandProcessor commands;

void CommandProcessor::processSerialInput() {
  if (Serial.available() > 0) {
    char incomingChar = Serial.read();
    
    if (incomingChar == '\n' || incomingChar == '\r') {
      if (inputBuffer.length() > 0) {
        processCommand(inputBuffer);
        inputBuffer = "";
      }
    } else {
      inputBuffer += incomingChar;
    }
  }
}

void CommandProcessor::processCommand(String command) {
  command.trim();
  
  // Mode commands
  if (command == "MODE:REAL") {
    setGlobalMode(MODE_REAL);
  } else if (command == "MODE:SIM") {
    setGlobalMode(MODE_SIMULATION);
  }
  
  // Button simulation commands
  else if (command == "BTN:START") {
    inputs.simulateStart(true);
    Serial.println("BTN:START:PRESSED");
  } else if (command == "BTN:RESET") {
    inputs.simulateReset(true);
    Serial.println("BTN:RESET:PRESSED");
  } else if (command == "RESET:ALL") {
    // Force complete reset
    stateMachine.resetPillCount();
    stateMachine.changeState(ESTADO0_INICIO);
    
    // Reset all hardware to default positions
    elevator.stop();
    elevator.simulatePosition(false, true);  // Bottom position
    grinder.stop();
    transferSolenoid.deactivate();
    capSolenoid.deactivate();
    dosingWheel.stop();
    
    // Reset sensors to defaults
    loadCell.simulateWeight(false);
    inputs.simulateFrasco(true);
    inputs.simulatePastillas(true);
    inputs.clearButtons();
    
    Serial.println("SISTEMA:REINICIADO");
    Serial.println("ESTADO:0_INICIO");
    Serial.print("PASTILLAS:0/");
    Serial.println(lot_size);
    Serial.println("SIM:WEIGHT_STABLE:OFF");
    Serial.println("SIM:FRASCO_VACIO:ON");
    Serial.println("SIM:PASTILLAS_CARGADAS:ON");
    Serial.println("ELEVADOR:ABAJO");
  }
  
  // Elevator position simulation
  else if (command == "SIM:POS_ALTA:1") {
    elevator.simulatePosition(true, false);
    Serial.println("SIM:POS_ALTA:ON");
  } else if (command == "SIM:POS_ALTA:0") {
    elevator.simulatePosition(false, elevator.isAtBottom());
    Serial.println("SIM:POS_ALTA:OFF");
  } else if (command == "SIM:POS_BAJA:1") {
    elevator.simulatePosition(false, true);
    Serial.println("SIM:POS_BAJA:ON");
  } else if (command == "SIM:POS_BAJA:0") {
    elevator.simulatePosition(elevator.isAtTop(), false);
    Serial.println("SIM:POS_BAJA:OFF");
  }
  
  // Weight simulation
  else if (command == "SIM:WEIGHT_STABLE:1") {
      loadCell.simulateWeight(true);
      Serial.println("SIM:WEIGHT_STABLE:ON");

  } else if (command == "SIM:WEIGHT_STABLE:0") {
    loadCell.simulateWeight(false);
    Serial.println("SIM:WEIGHT_STABLE:OFF");
  }
  
  // Condition simulation
  else if (command == "SIM:FRASCO_VACIO:1") {
    inputs.simulateFrasco(true);
    Serial.println("SIM:FRASCO_VACIO:ON");
  } else if (command == "SIM:FRASCO_VACIO:0") {
    inputs.simulateFrasco(false);
    Serial.println("SIM:FRASCO_VACIO:OFF");
  } else if (command == "SIM:PASTILLAS_CARGADAS:1") {
    inputs.simulatePastillas(true);
    Serial.println("SIM:PASTILLAS_CARGADAS:ON");
  } else if (command == "SIM:PASTILLAS_CARGADAS:0") {
    inputs.simulatePastillas(false);
    Serial.println("SIM:PASTILLAS_CARGADAS:OFF");
  }
  
  // Load cell commands
  else if (command == "SCALE:TARE") {
    loadCell.tare();
  } else if (command.startsWith("SCALE:CAL:")) {
    float knownWeight = command.substring(10).toFloat();
    loadCell.calibrate(knownWeight);
  } else if (command == "SCALE:READ") {
    float weight = loadCell.readWeight();
    Serial.print("WEIGHT:");
    Serial.print(weight, 2);
    Serial.println(" g");
  } else if (command == "SCALE:ENABLE") {
    loadCell.setMode(MODE_REAL);
    Serial.println("SCALE:ENABLED");
  } else if (command == "SCALE:DISABLE") {
    loadCell.setMode(MODE_SIMULATION);
    Serial.println("SCALE:DISABLED");
  } else if (command.startsWith("SET:WEIGHT_THRESHOLD:")) {
    float threshold = command.substring(21).toFloat();
    loadCell.setThreshold(threshold);
    Serial.print("SET:WEIGHT_THRESHOLD:");
    Serial.println(threshold);
  }
  
  // Parameter commands (removed SET:TARGET - use SET:LOT_SIZE instead)
  // Handle batch dosing update: SET:DOSING:DIVISIONS:20,LOT_SIZE:10
  else if (command.startsWith("SET:DOSING:")) {
    String params = command.substring(11);
    int startIdx = 0;
    int newDivisions = wheel_divisions;
    int newLotSize = lot_size;
    
    while (startIdx < params.length()) {
      int colonIdx = params.indexOf(':', startIdx);
      int commaIdx = params.indexOf(',', startIdx);
      if (commaIdx == -1) commaIdx = params.length();
      
      if (colonIdx > 0 && colonIdx < commaIdx) {
        String key = params.substring(startIdx, colonIdx);
        String value = params.substring(colonIdx + 1, commaIdx);
        int val = value.toInt();
        
        if (key == "DIVISIONS" && val > 0 && val <= 50) {
          newDivisions = val;
        } else if (key == "LOT_SIZE" && val > 0) {
          newLotSize = val;
        }
      }
      
      startIdx = commaIdx + 1;
    }
    
    // Validate lot size against divisions
    if (newLotSize <= newDivisions) {
      wheel_divisions = newDivisions;
      lot_size = newLotSize;
      
      // If we're at the start, reset the counter too
      if (stateMachine.getCurrentState() == ESTADO0_INICIO) {
        stateMachine.resetPillCount();
      }
    }
    
    // Send confirmation
    Serial.print("DOSING:DIVISIONS:");
    Serial.print(wheel_divisions);
    Serial.print(",LOT_SIZE:");
    Serial.println(lot_size);
    
    // Send updated pill count
    Serial.print("PASTILLAS:");
    Serial.print(stateMachine.getPillCount());
    Serial.print("/");
    Serial.println(lot_size);
  }
  else if (command.startsWith("SET:DIVISIONS:")) {
    int divisions = command.substring(14).toInt();
    if (divisions > 0 && divisions <= 50) {  // Reasonable limits
      wheel_divisions = divisions;
      Serial.print("SET:DIVISIONS:");
      Serial.println(wheel_divisions);
    }
  }
  else if (command.startsWith("SET:LOT_SIZE:")) {
    int size = command.substring(13).toInt();
    if (size > 0 && size <= wheel_divisions) {  // Must be <= divisions
      lot_size = size;
      // If we're at the start, reset the counter too
      if (stateMachine.getCurrentState() == ESTADO0_INICIO) {
        stateMachine.resetPillCount();
      }
      Serial.print("SET:LOT_SIZE:");
      Serial.println(lot_size);
      // Send updated pill count
      Serial.print("PASTILLAS:");
      Serial.print(stateMachine.getPillCount());
      Serial.print("/");
      Serial.println(lot_size);
    }
  }
  
  // Delay configuration commands
  // Handle both individual and batch delay updates
  else if (command.startsWith("SET:DELAYS:")) {
    // Parse all delays at once: SET:DELAYS:SETTLE:1500,WEIGHT:2000,TRANSFER:1200,...
    String params = command.substring(11);
    int startIdx = 0;
    
    while (startIdx < params.length()) {
      int colonIdx = params.indexOf(':', startIdx);
      int commaIdx = params.indexOf(',', startIdx);
      if (commaIdx == -1) commaIdx = params.length();
      
      if (colonIdx > 0 && colonIdx < commaIdx) {
        String key = params.substring(startIdx, colonIdx);
        String value = params.substring(colonIdx + 1, commaIdx);
        int val = value.toInt();
        
        if (key == "SETTLE") {
          t_step_settle = val;
        } else if (key == "WEIGHT") {
          t_weight_settle = val;
        } else if (key == "TRANSFER") {
          t_transfer = val;
        } else if (key == "GRIND") {
          t_grind = val;
        } else if (key == "CAP") {
          t_cap_push = val;
        } else if (key == "UP") {
          t_elev_up = val;
        } else if (key == "DOWN") {
          t_elev_down = val;
        }
      }
      
      startIdx = commaIdx + 1;
    }
    
    // Send confirmation with all current values
    Serial.print("DELAYS:");
    Serial.print("SETTLE:");
    Serial.print(t_step_settle);
    Serial.print(",WEIGHT:");
    Serial.print(t_weight_settle);
    Serial.print(",TRANSFER:");
    Serial.print(t_transfer);
    Serial.print(",GRIND:");
    Serial.print(t_grind);
    Serial.print(",CAP:");
    Serial.print(t_cap_push);
    Serial.print(",UP:");
    Serial.print(t_elev_up);
    Serial.print(",DOWN:");
    Serial.println(t_elev_down);
  }
  else if (command.startsWith("SET:DELAY:SETTLE:")) {
    t_step_settle = command.substring(17).toInt();
    Serial.print("SET:DELAY:SETTLE:");
    Serial.println(t_step_settle);
  }
  else if (command.startsWith("SET:DELAY:WEIGHT:")) {
    t_weight_settle = command.substring(17).toInt();
    Serial.print("SET:DELAY:WEIGHT:");
    Serial.println(t_weight_settle);
  }
  else if (command.startsWith("SET:DELAY:TRANSFER:")) {
    t_transfer = command.substring(19).toInt();
    Serial.print("SET:DELAY:TRANSFER:");
    Serial.println(t_transfer);
  }
  else if (command.startsWith("SET:DELAY:GRIND:")) {
    t_grind = command.substring(16).toInt();
    Serial.print("SET:DELAY:GRIND:");
    Serial.println(t_grind);
  }
  else if (command.startsWith("SET:DELAY:CAP:")) {
    t_cap_push = command.substring(14).toInt();
    Serial.print("SET:DELAY:CAP:");
    Serial.println(t_cap_push);
  }
  else if (command.startsWith("SET:DELAY:UP:")) {
    t_elev_up = command.substring(13).toInt();
    Serial.print("SET:DELAY:UP:");
    Serial.println(t_elev_up);
  }
  else if (command.startsWith("SET:DELAY:DOWN:")) {
    t_elev_down = command.substring(15).toInt();
    Serial.print("SET:DELAY:DOWN:");
    Serial.println(t_elev_down);
  }
  else if (command == "GET:DOSING") {
    Serial.print("DOSING:DIVISIONS:");
    Serial.print(wheel_divisions);
    Serial.print(",LOT_SIZE:");
    Serial.println(lot_size);
  }
  else if (command == "GET:DELAYS") {
    Serial.print("DELAYS:");
    Serial.print("SETTLE:");
    Serial.print(t_step_settle);
    Serial.print(",WEIGHT:");
    Serial.print(t_weight_settle);
    Serial.print(",TRANSFER:");
    Serial.print(t_transfer);
    Serial.print(",GRIND:");
    Serial.print(t_grind);
    Serial.print(",CAP:");
    Serial.print(t_cap_push);
    Serial.print(",UP:");
    Serial.print(t_elev_up);
    Serial.print(",DOWN:");
    Serial.println(t_elev_down);
  }
  
  // Status and help
  else if (command == "STATUS") {
    printStatus();
  } else if (command == "HELP") {
    printHelp();
  }
  
  // Unknown command
  else {
    Serial.print("UNKNOWN:");
    Serial.println(command);
  }
}

void CommandProcessor::printStatus() {
  Serial.print("STATUS:");
  Serial.print("ESTADO:");
  Serial.print(stateMachine.getStateName());
  Serial.print(",PASTILLAS:");
  Serial.print(stateMachine.getPillCount());
  Serial.print("/");
  Serial.print(lot_size);
  Serial.print(",MODO:");
  Serial.print(globalMode == MODE_REAL ? "REAL" : "SIM");
  Serial.print(",PESO:");
  Serial.print(loadCell.readWeight());
  Serial.print(",FRASCO_VACIO:");
  Serial.print(inputs.isFrascoVacio() ? "1" : "0");
  Serial.print(",PASTILLAS_CARGADAS:");
  Serial.print(inputs.isPastillasCargadas() ? "1" : "0");
  Serial.println();
}

void CommandProcessor::printHelp() {
  Serial.println("=== COMANDOS DE MODO ===");
  Serial.println("MODE:REAL - Usar sensores/temporizadores reales");
  Serial.println("MODE:SIM - Usar simulacion (por defecto)");
  Serial.println("");
  Serial.println("=== COMANDOS DE CONTROL ===");
  Serial.println("BTN:START - Pulsar boton de inicio");
  Serial.println("BTN:RESET - Pulsar boton de reinicio");
  Serial.println("");
  Serial.println("=== COMANDOS DE SIMULACION ===");
  Serial.println("SIM:POS_ALTA:1/0 - Establecer elevador en posicion alta");
  Serial.println("SIM:POS_BAJA:1/0 - Establecer elevador en posicion baja");
  Serial.println("SIM:WEIGHT_STABLE:1/0 - Establecer peso estable");
  Serial.println("SIM:FRASCO_VACIO:1/0 - Establecer frasco vacio");
  Serial.println("SIM:PASTILLAS_CARGADAS:1/0 - Establecer pastillas cargadas");
  Serial.println("");
  Serial.println("=== COMANDOS DE CELDA DE CARGA ===");
  Serial.println("SCALE:ENABLE/DISABLE - Usar celda de carga real/simulada");
  Serial.println("SCALE:TARE - Poner a cero la balanza");
  Serial.println("SCALE:CAL:peso - Calibrar con peso conocido");
  Serial.println("SCALE:READ - Leer peso actual");
  Serial.println("SET:WEIGHT_THRESHOLD:n - Establecer umbral de deteccion de peso");
  Serial.println("");
  Serial.println("=== COMANDOS DE PARAMETROS ===");
  Serial.println("SET:DIVISIONS:n - Establecer divisiones de rueda (max pastillas en rueda)");
  Serial.println("SET:LOT_SIZE:n - Establecer tamaño del lote");
  Serial.println("SET:DOSING:DIVISIONS:n,LOT_SIZE:n - Configurar dosificacion completa");
  Serial.println("");
  Serial.println("=== COMANDOS DE TIEMPOS ===");
  Serial.println("SET:DELAY:SETTLE:n - Tiempo de asentamiento");
  Serial.println("SET:DELAY:WEIGHT:n - Tiempo de peso");
  Serial.println("SET:DELAY:TRANSFER:n - Tiempo de transferencia");
  Serial.println("SET:DELAY:GRIND:n - Tiempo de molienda");
  Serial.println("SET:DELAY:CAP:n - Tiempo de tapado");
  Serial.println("SET:DELAY:UP:n - Tiempo elevador arriba");
  Serial.println("SET:DELAY:DOWN:n - Tiempo elevador abajo");
  Serial.println("SET:DELAYS:SETTLE:n,WEIGHT:n,... - Configurar todos los tiempos");
  Serial.println("");
  Serial.println("=== COMANDOS DE CONSULTA ===");
  Serial.println("GET:DELAYS - Obtener configuracion de tiempos");
  Serial.println("GET:DOSING - Obtener configuracion de dosificacion");
  Serial.println("STATUS - Obtener estado actual");
}