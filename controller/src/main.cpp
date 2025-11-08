
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
uint16_t lastProxValue = 0; // Set to impossible value to force first report

// Weight reading control - only enabled when needed (to avoid blocking motors)
bool needsWeightReading = false;
bool forceWeightRead = false;  // Set by commands to force a weight reading

// EMERGENCY STATE - Global flag that blocks ALL operations when true
bool isEmergencyActive = false;

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
  rgbLed.init();  // Initialize RGB LED strip

  // Initialize manual mode (default)
  ManualMode::init();

  // Try to load saved settings from EEPROM (init already called at line 43)
  if (StatePersistence::loadSettings()) {
    Serial.println(F("SETTINGS:RESTORED"));
    // Hardware settings applied when motors actually start moving (like elevator)
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

  // Report initial emergency button state and set global flag if pressed
  bool initialEmergency = !digitalRead(STOP_BUTTON_PIN);
  Serial.print(F("EMERGENCY:INITIAL_STATE:"));
  Serial.println(initialEmergency ? F("PRESSED") : F("NOT_PRESSED"));
  if (initialEmergency) {
    isEmergencyActive = true;  // BLOCK everything if emergency pressed at startup
    Serial.println(F("WARNING: Emergency button is PRESSED at startup!"));
    Serial.println(F("EMERGENCY:ACTIVATED"));
    Serial.println(F("System BLOCKED until RESET command"));
  }
}

void loop() {
  // ========== PRIORITY 1: MOTORS - MUST RUN FIRST ==========
  // Process serial commands
  commands.processSerialInput();

  // ========== PHYSICAL BUTTON MONITORING ==========
  // Check physical buttons continuously in BOTH manual and auto modes
  static bool lastEmergencyState = false;
  static bool lastStartState = false;
  static unsigned long lastButtonCheck = 0;

  if (millis() - lastButtonCheck > 50) {  // Check every 50ms to debounce
    // Check emergency stop button (STOP_BUTTON_PIN)
    // CRITICAL: Emergency button MUST always work and stop everything!
    bool emergencyPressed = !digitalRead(STOP_BUTTON_PIN);  // Active low with pull-up

    if (emergencyPressed && !lastEmergencyState) {
      // Emergency button just pressed - STOP AND BLOCK EVERYTHING
      Serial.println(F("EMERGENCY:BUTTON_PRESSED"));
      isEmergencyActive = true;  // BLOCK ALL OPERATIONS

      // Stop all hardware immediately
      elevator.stop();
      dosingWheel.stop();
      grinder.stop();
      transferSolenoid.deactivate();
      capSolenoid.deactivate();

      // In auto mode, pause the state machine
      if (ManualMode::isAuto()) {
        stateMachine.pause();
      }

      Serial.println(F("EMERGENCY:ACTIVATED"));
    } else if (!emergencyPressed && lastEmergencyState) {
      // Emergency button released - system still blocked until RESET
      Serial.println(F("EMERGENCY:BUTTON_RELEASED"));
      // DON'T clear isEmergencyActive here - only RESET command clears it
      Serial.println(F("EMERGENCY:DEACTIVATED"));
    }

    lastEmergencyState = emergencyPressed;

    // Check start button (START_BUTTON_PIN)
    bool startPressed = !digitalRead(START_BUTTON_PIN);  // Active low with pull-up

    if (startPressed && !lastStartState) {
      // Start button just pressed - only report to UI, do not start cycle
      Serial.println(F("START:BUTTON_PRESSED"));
      Serial.println(F("START:IGNORED_USE_UI"));
    } else if (!startPressed && lastStartState) {
      // Start button released
      Serial.println(F("START:BUTTON_RELEASED"));
    }

    lastStartState = startPressed;
    lastButtonCheck = millis();
  }

  // Run motors based on mode
  if (ManualMode::isManual() && !isEmergencyActive) {
    // Manual mode - run hardware directly
    elevator.run();
    dosingWheel.run();
    transferSolenoid.run();
    capSolenoid.run();
    grinder.run();
  }
  else if (ManualMode::isAuto() && !isEmergencyActive) {
    // Auto mode - run state machine

    // Check if paused - if paused, don't process state machine
    if (!stateMachine.getPausedState()) {
      if (stateMachine.hasStateChanged()) {
        stateMachine.clearStateChange();
        stateMachine.executeStateEntry();
      }
      stateMachine.executeStateContinuous();
      stateMachine.processTransitions();

      // Only run hardware when NOT paused
      elevator.run();
      dosingWheel.run();
      transferSolenoid.run();
      capSolenoid.run();
      grinder.run();
    }
  }

  // ========== LOAD CELL OPERATIONS (non-blocking tare) ==========
  loadCell.run();

  // ========== PRIORITY 2: SENSOR READING & REPORTING ==========
  // Read sensor MUCH LESS frequently to avoid blocking
  static unsigned long lastSensorRead = 0;
  static uint16_t currentDistance = 0;

  // Read sensor every 100ms - sensor is now non-blocking in continuous mode
  unsigned long sensorInterval = 100;
  if (proxSensor.isAvailable() && (millis() - lastSensorRead > sensorInterval)) {
    currentDistance = proxSensor.read();  // Non-blocking continuous mode read
    lastSensorRead = millis();
  }

  // Report position and distance changes with better filtering
  static bool lastWasAtTop = false;
  static bool lastWasAtBottom = false;
  static uint16_t lastReportedDistance = 0;

  bool atTop = elevator.isAtTop();
  bool atBottom = elevator.isAtBottom();
  bool posChanged = (atTop != lastWasAtTop) || (atBottom != lastWasAtBottom);

  // Only report if distance changed by MORE than 5mm (filter oscillation)
  bool distChanged = abs((int)currentDistance - (int)lastReportedDistance) > 5;

  // Report ONLY when something actually changes (no periodic updates)
  if (posChanged || distChanged) {
    Serial.print(F("PROX:"));
    Serial.print(currentDistance);

    if (atTop) {
      Serial.println(F(",POS:UP"));
    } else if (atBottom) {
      Serial.println(F(",POS:DOWN"));
    } else {
      Serial.println(F(",POS:MID"));
    }

    lastWasAtTop = atTop;
    lastWasAtBottom = atBottom;
    lastReportedDistance = currentDistance;
    lastProxReport = millis();
  }

  // Report dosing status
  static unsigned long lastDosingReport = 0;
  static bool wasDosingActive = false;
  bool isDosingActive = dosingWheel.isDispensing() || dosingWheel.isContinuousMode();
  if (isDosingActive && (millis() - lastDosingReport > 200)) {
    Serial.println(dosingWheel.getDirection() ? F("DOSING:FWD") : F("DOSING:BWD"));
    lastDosingReport = millis();
    wasDosingActive = true;
  } else if (!isDosingActive && wasDosingActive) {
    Serial.println(F("DOSING:STOPPED"));
    wasDosingActive = false;
  }

  // Send heartbeat
  if (millis() - lastHeartbeat >= HEARTBEAT_INTERVAL) {
    SerialProtocol::sendHeartbeat(stateMachine.getStateName(), millis());
    lastHeartbeat = millis();
  }

  // ========== CONDITIONAL WEIGHT READING ==========
  // Read weight when: 1) Auto mode in weighing state, 2) Manual mode (less frequent), 3) Explicitly requested
  static unsigned long lastWeightRead = 0;

  // Check if we're in weighing state
  bool inWeighingState = (stateMachine.getCurrentState() == ESTADO3_PESAJE);

  // Adjust frequency: faster in weighing state, slower in manual to avoid blocking motors
  unsigned long weightInterval = inWeighingState ? 200 : 1000;  // 200ms in weighing, 1000ms in manual

  // In manual mode, read weight but less frequently to not block elevator sensor
  bool shouldReadWeight = needsWeightReading || inWeighingState || ManualMode::isManual();

  if (shouldReadWeight) {
    if (millis() - lastWeightRead >= weightInterval) {
      float weight = loadCell.readWeight();

      // Report weight in manual mode and weighing state
      if (ManualMode::isManual() || inWeighingState) {
        Serial.print(F("WEIGHT:"));
        Serial.print(weight, 4);
        Serial.println(F(" g"));
      }

      lastWeightRead = millis();
    }
  }
}