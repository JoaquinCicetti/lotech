
#include <Arduino.h>
#include <avr/wdt.h>  // Watchdog timer for safety
#include "config.h"
#include "hardware.h"
#include "state_machine.h"
#include "state_persistence.h"
#include "commands.h"
#include "serial_protocol.h"
#include "manual_mode.h"

unsigned long lastHeartbeat = 0;
unsigned long lastProxReport = 0;
uint16_t lastProxValue = 9999; // Set to impossible value to force first report

void setup() {
  // Disable watchdog on startup (in case of reset)
  wdt_disable();

  Serial.begin(115200);
  // delay(100);  // Small delay for serial init

  // Initialize all hardware modules
  Serial.println(F("Initializing"));

  // Initialize OLED display (but don't block if it fails)
  Serial.println(F("Trying OLED init..."));
  if(oledDisplay.init()) {
    Serial.println(F("OLED: Initialized"));
    oledDisplay.showStartup();
    // Don't delay too long
    delay(500);  // Reduced from 2000
  } else {
    Serial.println(F("OLED: Init failed - continuing anyway"));
  }

  // Initialize state persistence
  StatePersistence::init();

  // Enable watchdog with 2 second timeout - will reset if frozen
  wdt_enable(WDTO_2S);
  
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
  inputs.init();  // Initialize input pins

  // Initialize manual mode (default)
  ManualMode::init();

  // Initialize EEPROM persistence
  StatePersistence::init();

  // Try to load saved settings from EEPROM
  if (StatePersistence::loadSettings()) {
    Serial.println(F("SETTINGS:RESTORED"));
    // Update hardware with loaded settings
    dosingWheel.motor.setSpeed(dosing_speed);
  } else {
    Serial.println(F("SETTINGS:USING_DEFAULTS"));
  }

  Serial.println(F("========================================"));
  Serial.println(F("LOTECH Controller v1.0"));

  // Try to recover previous state
  if (stateMachine.recoverStateFromEEPROM()) {
    Serial.println(F("Previous state recovered from EEPROM"));
    Serial.println(F("Use CLEAR_STATE to reset if needed"));
  } else {
    Serial.println(F("Starting fresh - no previous state"));
  }

  Serial.println(F("Starting in MANUAL mode"));
  Serial.println(F("Physical restrictions: ENABLED"));
  Serial.println(F("Type HELP for commands"));
  Serial.println(F("========================================"));

  Serial.print(F("Current state: "));
  Serial.println(stateMachine.getStateName());

  // Show initial state on OLED
  if (oledDisplay.isInitialized()) {
    if (ManualMode::isManual()) {
      oledDisplay.showManualMode();
    } else {
      oledDisplay.showState(stateMachine.getStateName(), 0, lot_size);
    }
  }
}

void loop() {
  // Reset watchdog timer - proves we're not frozen
  wdt_reset();

  // Process serial commands
  commands.processSerialInput();

  // Handle different modes
  if (ManualMode::isManual()) {
    // Manual mode - just run hardware updates, no state machine
    elevator.run();
    dosingWheel.run();
    transferSolenoid.run();  // Check timeout for transfer solenoid
    capSolenoid.run();      // Check timeout for cap solenoid
    grinder.run();          // Check timeout for grinder

    // Report dosing wheel status periodically while it's running
    static unsigned long lastDosingReport = 0;
    static bool wasDosingActive = false;
    bool isDosingActive = dosingWheel.isDispensing() || dosingWheel.isContinuousMode();

    if (isDosingActive) {
      // Report status every 100ms while active
      if (millis() - lastDosingReport > 100) {
        if (dosingWheel.getDirection()) {
          Serial.println(F("DOSING:FWD"));
        } else {
          Serial.println(F("DOSING:BWD"));
        }
        lastDosingReport = millis();
      }
      wasDosingActive = true;
    } else if (wasDosingActive) {
      // Just stopped - send stop message once
      Serial.println(F("DOSING:STOPPED"));
      wasDosingActive = false;
    }

    // Motors respond directly to manual commands
  }
  else if (ManualMode::isAuto()) {
    // Auto mode - run state machine
    if (stateMachine.hasStateChanged()) {
      stateMachine.clearStateChange();
      stateMachine.executeStateEntry();
    }

    // Execute continuous state actions
    stateMachine.executeStateContinuous();

    // Check for state transitions
    stateMachine.processTransitions();

    // Also run hardware updates for state machine
    elevator.run();
    dosingWheel.run();
    transferSolenoid.run();  // Check timeout for transfer solenoid
    capSolenoid.run();      // Check timeout for cap solenoid
    grinder.run();          // Check timeout for grinder
  }
  
  // Send heartbeat
  if (millis() - lastHeartbeat >= HEARTBEAT_INTERVAL) {
    SerialProtocol::sendHeartbeat(stateMachine.getStateName(), millis());
    lastHeartbeat = millis();
  }
  
  // Update elevator position from proximity sensor (even when not moving)
  static unsigned long lastPositionUpdate = 0;
  if (millis() - lastPositionUpdate > 100) { // Update every 100ms
    lastPositionUpdate = millis();
    elevator.updatePosition(); // Update internal position state
  }

  // Read and report proximity if available - but not too often!
  if (proxSensor.isAvailable() && (millis() - lastProxReport > 250)) { // Check every 250ms for better responsiveness
    uint16_t prox = proxSensor.read();

    // Filter out sudden 0 values - only accept 0 if we get it consistently
    static uint8_t zeroCount = 0;
    if (prox == 0) {
      zeroCount++;
      // Only accept 0 after 3 consecutive readings
      if (zeroCount < 3) {
        prox = lastProxValue; // Use last valid value
      }
    } else {
      zeroCount = 0; // Reset counter for non-zero values
    }

    // Only report if value changed significantly (by more than 5) or timeout
    int proxDiff = abs((int)prox - (int)lastProxValue);
    if (proxDiff > 5 || millis() - lastProxReport > 2000) {
      Serial.print(F("PROX:"));
      Serial.print(prox);
      Serial.print(F(",RAW:"));
      Serial.print(proxSensor.getLastRawValue());  // Add raw value for debugging
      // Report actual elevator position based on internal state
      if (elevator.isAtTop()) {
        Serial.print(F(",POS:UP"));
      } else if (elevator.isAtBottom()) {
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