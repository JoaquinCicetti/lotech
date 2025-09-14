#include <Arduino.h>
#include "config.h"
#include "hardware.h"
#include "state_machine.h"
#include "commands.h"
#include "serial_protocol.h"
#include "test_mode.h"

unsigned long lastHeartbeat = 0;
unsigned long lastProxReport = 0;
uint16_t lastProxValue = 9999; // Set to impossible value to force first report

void setup() {
  Serial.begin(9600);
  delay(100);  // Small delay for serial init

  // Initialize all hardware modules
  Serial.println(F("Inicializando"));
  
  // Try to init proximity sensor (don't block if fails)
  if (proxSensor.init()) {
    Serial.println(F("PROX:INIT_OK"));
    // Send initial proximity reading
    uint16_t initialProx = proxSensor.read();
    Serial.print(F("PROX:"));
    Serial.println(initialProx);
  } else {
    Serial.println(F("PROX:INIT_FAIL"));
  }
  
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
  
  Serial.println(F("Escribe HELP para listar los comandos"));

  Serial.print(F("Estado actual: "));
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
      SerialProtocol::sendHeartbeat(stateMachine.getStateName(), millis());
    }
    lastHeartbeat = millis();
  }
  
  // Read and report proximity if available - but not too often!
  if (proxSensor.isAvailable() && (millis() - lastProxReport > 1000)) { // Check every 1 second
    uint16_t prox = proxSensor.read();
    
    // Only report if value changed significantly (by more than 10) or timeout
    int proxDiff = abs((int)prox - (int)lastProxValue);
    if (proxDiff > 10 || millis() - lastProxReport > 5000) {
      Serial.print(F("PROX:"));
      Serial.print(prox);
      Serial.print(F(",RAW:"));
      Serial.print(proxSensor.getLastRawValue());  // Add raw value for debugging
      // Also report position based on thresholds
      if (prox > prox_threshold_up) {
        Serial.print(F(",POS:UP"));
      } else if (prox <= prox_threshold_down) {
        Serial.print(F(",POS:DOWN"));
      } else {
        Serial.print(F(",POS:MID"));
      }
      Serial.println();
      lastProxValue = prox;
      lastProxReport = millis();
    }
  }
}