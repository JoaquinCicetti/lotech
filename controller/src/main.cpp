#include <Arduino.h>
#include "config.h"
#include "hardware.h"
#include "state_machine.h"
#include "commands.h"

unsigned long lastHeartbeat = 0;

void setup() {
  Serial.begin(9600);
  while (!Serial) {
    ;
  }
  
  Serial.println("=====================================");
  Serial.println("LOTECH CONTROLLER - ADR-003 MEF");
  Serial.println("=====================================");
  
  // Initialize all hardware modules
  Serial.println("Inicializando hardware...");
  
  elevator.init();
  dosingWheel.init();
  loadCell.init();
  grinder.init();
  transferSolenoid.init();
  capSolenoid.init();
  
  // Set default mode
  setGlobalMode(MODE_SIMULATION);
  
  Serial.println("Sistema listo!");
  Serial.println("Escribe HELP para listar los comandos");
  Serial.print("Estado actual: ");
  Serial.println(stateMachine.getStateName());
  Serial.println("Modo: SIM (MODE:REAL para utilizar hardware)");
}

void loop() {
  // Process serial commands
  commands.processSerialInput();
  
  // Process state machine
  if (stateMachine.hasStateChanged()) {
    stateMachine.clearStateChange();
    stateMachine.executeStateEntry();
  }
  
  // Execute continuous state actions
  stateMachine.executeStateContinuous();
  
  // Check for state transitions
  stateMachine.processTransitions();
  
  // Send simple heartbeat
  if (millis() - lastHeartbeat >= HEARTBEAT_INTERVAL) {
    Serial.print("HB:");
    Serial.print(stateMachine.getStateName());
    Serial.print(",");
    Serial.println(millis());
    lastHeartbeat = millis();
  }
}