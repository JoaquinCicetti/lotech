
#include <Arduino.h>
#include <avr/wdt.h>  // Watchdog timer for safety
#include <HX711.h>  // For direct test
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

  // DISABLED - watchdog may interfere with HX711 timing
  // wdt_enable(WDTO_2S);

  // PROXIMITY SENSOR DISABLED - uncomment when stable
  /*
  if (proxSensor.init()) {
    Serial.println(F("PROX:INIT_OK"));
    uint16_t initialProx = proxSensor.read();
    Serial.print(F("PROX:"));
    Serial.println(initialProx);
  } else {
    Serial.println(F("PROX:INIT_FAIL"));
  }
  */
  Serial.println(F("PROX:DISABLED"));

  elevator.init();
  dosingWheel.init();
  // loadCell.init();  // DISABLED - using direct HX711 instead
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
  // Watchdog disabled - was interfering with HX711
  // wdt_reset();

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
  
  // PROXIMITY SENSOR DISABLED - was causing motor stuttering
  // Uncomment this block when sensor is stable
  /*
  static unsigned long lastPositionUpdate = 0;
  if (millis() - lastPositionUpdate > 500) {
    lastPositionUpdate = millis();
    elevator.updatePosition();
  }

  if (proxSensor.isAvailable() && (millis() - lastProxReport > 500)) {
    uint16_t prox = proxSensor.read();
    static uint8_t zeroCount = 0;
    if (prox == 0) {
      zeroCount++;
      if (zeroCount < 3) {
        prox = lastProxValue;
      }
    } else {
      zeroCount = 0;
    }

    int proxDiff = abs((int)prox - (int)lastProxValue);
    if (proxDiff > 5 || millis() - lastProxReport > 2000) {
      Serial.print(F("PROX:"));
      Serial.print(prox);
      Serial.print(F(",MM:"));
      Serial.print(proxSensor.getLastRawValue());
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
  */

  // Direct HX711 handling (bypassing LoadCell class which had conflicts)
  static unsigned long lastWeightReport = 0;
  static HX711 directScale;
  static bool directScaleInit = false;
  static long tareValue = 0;
  static float smoothedWeight = 0.0;  // For smoothing
  static float displayWeight = 0.0;   // What we actually show

  // Initialize once
  if (!directScaleInit) {
    directScale.begin(A0, A1);  // A0=DOUT, A1=SCK
    delay(1000);

    // Set scale to 1 for raw values
    directScale.set_scale(1.0f);

    directScaleInit = true;
    Serial.println(F("DIRECT_HX711:INIT"));

    // Get initial tare value (average of 20 readings for stability)
    if (directScale.is_ready()) {
      long sum = 0;
      for(int i = 0; i < 20; i++) {
        sum += directScale.read();
        delay(10);
      }
      tareValue = sum / 20;
      Serial.print(F("DIRECT_HX711:TARE:"));
      Serial.println(tareValue);
    }
  }

  // Read weight every 500ms to avoid blocking motors
  if (millis() - lastWeightReport >= 500) {
    if (directScale.is_ready()) {
      // Single reading to avoid blocking - smoothing filter handles noise
      long raw = directScale.read();

      // Apply tare
      long taredValue = raw - tareValue;

      // Convert to grams with calibration factor
      // If showing 0.7-0.8 instead of 1.0, multiply by 1.3 (1.0/0.77 ≈ 1.3)
      float grams = (float)taredValue / 770.0;  // Adjusted from 1000 to 770

      // Exponential smoothing with HIGHER alpha for faster response
      const float alpha = 0.35;  // Increased for faster response (was 0.15)
      smoothedWeight = (alpha * grams) + ((1.0 - alpha) * smoothedWeight);

      // Dead zone filter - ignore small variations near zero
      const float deadZone = 0.5;  // +/- 0.5g considered zero
      if (abs(smoothedWeight) < deadZone) {
        displayWeight = 0.0;
      } else {
        // Round to 0.001g (1mg) for display with 3 decimal precision
        displayWeight = round(smoothedWeight * 1000.0) / 1000.0;
      }

      // Send weight with 3 decimal precision
      Serial.print(F("WEIGHT:"));
      Serial.print(displayWeight, 3);
      Serial.println(F(" g"));

      // Debug info occasionally
      if (millis() % 5000 < 250) {  // Every 5 seconds
        Serial.print(F("DEBUG:RAW:"));
        Serial.print(raw);
        Serial.print(F(" SMOOTHED:"));
        Serial.println(smoothedWeight, 2);
      }
    } else {
      Serial.println(F("WEIGHT:NOT_READY"));
    }
    lastWeightReport = millis();
  }
}