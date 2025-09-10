#include <Arduino.h>
#include "config.h"
#include "hardware.h"
#include "state_machine.h"
#include "commands.h"
#include "serial_protocol.h"
#include "test_mode.h"

unsigned long lastHeartbeat = 0;

void setup() {
  Serial.begin(9600);
  while (!Serial) {
    ;
  }

  // Initialize all hardware modules
  Serial.println("Inicializando");
  
  elevator.init();
  dosingWheel.init();
  loadCell.init();
  grinder.init();
  transferSolenoid.init();
  capSolenoid.init();
  
  // Initialize test mode
  TestMode::init();
  
  // Set default mode
  setGlobalMode(MODE_SIMULATION);
  
  Serial.println("Escribe HELP para listar los comandos");

  Serial.print("Estado actual: ");
  Serial.println(stateMachine.getStateName());
}

void loop() {
  // Process serial commands
  commands.processSerialInput();
  
  // Only process state machine if not in test mode
  if (!TestMode::isActive()) {
    // Process state machine
    if (stateMachine.hasStateChanged()) {
      stateMachine.clearStateChange();
      stateMachine.executeStateEntry();
    }
    
    // Execute continuous state actions
    stateMachine.executeStateContinuous();
    
    // Check for state transitions
    stateMachine.processTransitions();
  } else {
    // In test mode, run hardware updates
    elevator.run();
    dosingWheel.run();
  }
  
  // Send heartbeat
  if (millis() - lastHeartbeat >= HEARTBEAT_INTERVAL) {
    if (TestMode::isActive()) {
      // In test mode, send detailed hardware status
      SerialProtocol::sendTestHeartbeat();
    } else {
      // Normal mode heartbeat
      SerialProtocol::sendHeartbeat(stateMachine.getStateName().c_str(), millis());
    }
    lastHeartbeat = millis();
  }
}