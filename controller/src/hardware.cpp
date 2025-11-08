#include "hardware.h"
#include "config.h"
#include "manual_mode.h"
#include "state_machine.h"  // For extern variables
#include <string.h>  // For strcmp
#include <SPI.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

// =====================================================
// ELEVATOR IMPLEMENTATION
// =====================================================

Elevator::Elevator() : motor(AccelStepper::DRIVER, MOTOR1_STEP_PIN, MOTOR1_DIR_PIN) {
  movingUp = false;
  movingDown = false;
  atTop = false;
  atBottom = true;  // Assume starting at bottom
  moveStartTime = 0;
  mode = MODE_REAL;
}

void Elevator::init() {
  motor.setMaxSpeed(ELEVATOR_MAX_SPEED);
  motor.setAcceleration(ELEVATOR_ACCELERATION);

  Serial.println(F("ELEVATOR:INIT_OK"));
}

void Elevator::moveUp() {
  if (!movingUp) {
    movingUp = true;
    movingDown = false;
    motor.setSpeed((float)elevator_speed);
    moveStartTime = millis();
    Serial.print(F("ELEVATOR:UP - SPEED:"));
    Serial.println(elevator_speed);

  }
}

void Elevator::moveDown() {
  if (!movingDown) {
    movingUp = false;
    movingDown = true;
    motor.setSpeed(-(float)elevator_speed);
    moveStartTime = millis();
    Serial.print(F("ELEVATOR:DOWN - SPEED:"));
    Serial.println(elevator_speed);

  }
}

void Elevator::stop() {
  if (movingUp || movingDown) {
    movingUp = false;
    movingDown = false;
    motor.setSpeed(0);
    Serial.println(F("ELEVATOR:STOPPED"));
  }
}

void Elevator::run() {
  // ALWAYS run motor first - highest priority
  if (movingUp || movingDown) {
    // Update speed on every run - allows real-time speed adjustment
    if (movingUp) {
      motor.setSpeed((float)elevator_speed);
    } else if (movingDown) {
      motor.setSpeed(-(float)elevator_speed);
    }

    // Debug: check if motor is actually running
    static unsigned long lastDebug = 0;
    if (millis() - lastDebug > 1000) {
      Serial.print(F("DEBUG:MOTOR_SPEED="));
      Serial.print(motor.speed());
      Serial.print(F(" POS="));
      Serial.println(motor.currentPosition());
      lastDebug = millis();
    }
    motor.runSpeed();
  }

  // Position sensing logic - different for manual vs auto mode
  if (ManualMode::isManual()) {
    // MANUAL MODE: Update position but only block if restrictions ON + sensor available
    if (proxSensor.isAvailable()) {
      static unsigned long lastPosUpdate = 0;
      if (millis() - lastPosUpdate > 200) {  // Check every 200ms
        updatePosition();  // Updates internal atTop/atBottom flags

        // Only stop at limits if restrictions are enabled
        if (ManualMode::hasPhysicalRestrictions()) {
          if (atTop && movingUp) {
            stop();
            Serial.println(F("ELEVATOR:BLOCKED_TOP"));
          } else if (atBottom && movingDown) {
            stop();
            Serial.println(F("ELEVATOR:BLOCKED_BOTTOM"));
          }
        }
        lastPosUpdate = millis();
      }
    }
    // If no sensor or restrictions OFF - elevator moves freely
  } else {
    // AUTO MODE: Always check position if sensor available - both moving and idle
    // We need to know position even when stopped to detect if we reached the limit
    if (proxSensor.isAvailable()) {
      static unsigned long lastPosUpdate = 0;
      if (millis() - lastPosUpdate > 100) {  // Check every 100ms in auto mode
        updatePosition();
        lastPosUpdate = millis();
      }
    }
  }

  // Timeout failsafe - always active if restrictions enabled
  if ((movingUp || movingDown) && ManualMode::hasPhysicalRestrictions()) {
    unsigned long elapsed = millis() - moveStartTime;
    if (movingUp && (elapsed > t_elev_up)) {
      Serial.print(F("DEBUG:TIMEOUT_CHECK - elapsed="));
      Serial.print(elapsed);
      Serial.print(F(" t_elev_up="));
      Serial.println(t_elev_up);
      stop();
      atTop = true;
      atBottom = false;
      Serial.println(F("ELEVATOR:TIMEOUT_TOP"));
    } else if (movingDown && (elapsed > t_elev_down)) {
      Serial.print(F("DEBUG:TIMEOUT_CHECK - elapsed="));
      Serial.print(elapsed);
      Serial.print(F(" t_elev_down="));
      Serial.println(t_elev_down);
      stop();
      atTop = false;
      atBottom = true;
      Serial.println(F("ELEVATOR:TIMEOUT_BOTTOM"));
    }
  }
}

// isMoving() is defined inline in header

bool Elevator::isAtTop() const {
  // Always return the internal state which is updated by run()
  // This avoids reading the sensor too frequently
  return atTop;
}

bool Elevator::isAtBottom() const {
  // Always return the internal state which is updated by run()
  // This avoids reading the sensor too frequently
  return atBottom;
}

void Elevator::updatePosition() {
  // Update position based on proximity sensor (VL53L0X distance in mm)
  // This is called periodically to keep position state current
  // SENSOR MOUNTED AT TOP: Large distance = elevator is DOWN (at bottom)
  if (proxSensor.isAvailable()) {
    uint16_t distance = proxSensor.read();
    bool wasAtTop = atTop;
    bool wasAtBottom = atBottom;

    // Sensor at TOP with hysteresis to avoid noise/blinking:
    // Small distance = elevator close to sensor = elevator is UP (at top position)
    // Large distance = elevator far from sensor = elevator is DOWN (at bottom position)
    // Add 20mm hysteresis to prevent oscillation
    if (atTop) {
      // Once at top, need to move 20mm down to consider it not at top
      atTop = (distance <= prox_threshold_up + 20);
    } else {
      // Not at top, need to get very close (within threshold) to consider it at top
      atTop = (distance <= prox_threshold_up);
    }

    if (atBottom) {
      // Once at bottom, need to move 20mm up to consider it not at bottom
      atBottom = (distance >= prox_threshold_down - 20);
    } else {
      // Not at bottom, need to get very far (beyond threshold) to consider it at bottom
      atBottom = (distance >= prox_threshold_down);
    }

    // Only stop motor if restrictions are enabled AND we reached a limit while moving
    if (ManualMode::hasPhysicalRestrictions()) {
      if (!wasAtTop && atTop && movingUp) {
        stop();
        Serial.println(F("ELEVATOR:AT_TOP"));
      } else if (!wasAtBottom && atBottom && movingDown) {
        stop();
        Serial.println(F("ELEVATOR:AT_BOTTOM"));
      }
    }
  }
}

// Removed simulatePosition method - simulation mode no longer used

// =====================================================
// DOSING WHEEL IMPLEMENTATION
// =====================================================

DosingWheel::DosingWheel() : motor(AccelStepper::DRIVER, MOTOR2_STEP_PIN, MOTOR2_DIR_PIN) {
  dosingInProgress = false;
  continuousMode = false;
  currentDirection = true;  // true = forward, false = backward
}

void DosingWheel::init() {
  motor.setMaxSpeed((float)DOSING_MAX_SPEED);
  motor.setAcceleration((float)DOSING_ACCELERATION);
  motor.setSpeed((float)dosing_speed);  // Set default speed from global
  motor.setCurrentPosition(0);  // Reset position

  // Configure microstepping pins
  // pinMode(MOTOR2_MS1_PIN, OUTPUT);
  // pinMode(MOTOR2_MS2_PIN, OUTPUT);

  // digitalWrite(MOTOR2_MS1_PIN, LOW);   // Full stepping for better torque
  // digitalWrite(MOTOR2_MS2_PIN, LOW);   // MS1=0, MS2=0 = Full step

  // Make sure step and dir pins are outputs (AccelStepper should do this but let's be sure)
  // pinMode(MOTOR2_STEP_PIN, OUTPUT);
  // pinMode(MOTOR2_DIR_PIN, OUTPUT);

  Serial.print(F("DOSING:INIT_OK - SPEED:"));
  Serial.println(dosing_speed);
}

void DosingWheel::dispenseOne() {
  // Only dispense if not already dispensing
  if (!dosingInProgress) {
    // Calculate steps based on current wheel divisions
    // STEPS_PER_REVOLUTION is already 1600 (includes microstepping)
    // But we need more rotation for proper pill dispensing
    // Multiply by 2 for better rotation per division
    int stepsPerDivision = (STEPS_PER_REVOLUTION * 2) / wheel_divisions;
    motor.move(stepsPerDivision);  // Positive for forward
    dosingInProgress = true;
    Serial.print(F("DOSING:STEPS:"));
    Serial.println(stepsPerDivision);
  } else {
    Serial.println(F("DOSING:ALREADY_IN_PROGRESS"));
  }
}


void DosingWheel::stop() {
  motor.stop();
  dosingInProgress = false;
  continuousMode = false;  // Also stop continuous mode
  // Set MS pins LOW to reduce current when idle
  // digitalWrite(MOTOR2_MS1_PIN, LOW);
  // digitalWrite(MOTOR2_MS2_PIN, LOW);
}

void DosingWheel::run() {
  if (continuousMode) {
    motor.runSpeed();
    // In continuous mode, just run at constant speed
    // if (!motor.runSpeed()) {
      // runSpeed returns false if no step was taken
      // Force a step by updating position
      // motor.setSpeed(motor.speed());
    // }
  } else {
    // Normal mode - run to target position
    motor.run();

    if (dosingInProgress) {
      long remaining = motor.distanceToGo();
      static unsigned long lastDebug = 0;
      if (millis() - lastDebug > 500) {
        Serial.print(F("DEBUG:DOSING_POS="));
        Serial.print(motor.currentPosition());
        Serial.print(F(" REMAINING="));
        Serial.println(remaining);
        lastDebug = millis();
      }

      if (remaining == 0) {
        dosingInProgress = false;
        Serial.println(F("DOSING:COMPLETE"));
        // Send completion message in test mode
        if (globalMode == MODE_TEST) {
          Serial.println("TEST:DOSING:COMPLETE");
          Serial.print("DEBUG:DOSING:POS:");
          Serial.println(motor.currentPosition());
        }
      }
    }
  }
}

void DosingWheel::updateStepsPerDivision() {
  // This can be called when wheel_divisions changes
  // No need to store it, we calculate on demand in dispenseOne()
}

// Manual mode continuous control
void DosingWheel::startContinuous(bool forward) {
  continuousMode = true;
  dosingInProgress = false;  // Not a normal dosing operation
  currentDirection = forward;  // Track direction

  // Set MS pins for microstepping if needed
  // digitalWrite(MOTOR2_MS1_PIN, HIGH);  // Half stepping
  // digitalWrite(MOTOR2_MS2_PIN, LOW);   // MS1=1, MS2=0 = Half step

  float speed = forward ? dosing_speed : -dosing_speed;
  motor.setSpeed(speed);

  Serial.print(F("DEBUG:DOSING:SPEED:"));
  Serial.println(speed);
  Serial.print(F("DEBUG:DOSING:MODE:"));
  Serial.println(continuousMode ? F("CONTINUOUS") : F("NORMAL"));
}

void DosingWheel::stopContinuous() {
  continuousMode = false;
  motor.stop();
  // motor.setSpeed(0);
  // Set MS pins back to full stepping
  // digitalWrite(MOTOR2_MS1_PIN, LOW);
  // digitalWrite(MOTOR2_MS2_PIN, LOW);
}

// isDispensing() is defined inline in header

// =====================================================
// LOAD CELL IMPLEMENTATION
// =====================================================

LoadCell::LoadCell() : scale() {
  mode = MODE_REAL;
  isReady = false;
  currentWeight = 0;
  lastStableWeight = 0;
  calibrationFactor = 2280.f;
  weightThreshold = 1.0;
  weightDeadband = 0.05;  // Ignore changes smaller than 0.05g (noise filter)
  weightStableTime = 0;

  // Initialize weight buffer
  weightBufferIndex = 0;
  bufferFilled = false;
  lastWeightRead = 0;
  stableWeight = 0;
  stableStartTime = 0;
  for (int i = 0; i < WEIGHT_BUFFER_SIZE; i++) {
    weightBuffer[i] = 0;
  }

  // Initialize tare state machine
  tareInProgress = false;
  tareStartTime = 0;
}

void LoadCell::init() {
  Serial.println(F("LOADCELL:INIT_START"));

  scale.begin(HX711_DOUT_PIN, HX711_SCK_PIN);

  // Set gain to 128 (channel A)
  scale.set_gain(128);

  // Set the calibration scale factor
  scale.set_scale(calibrationFactor);

  // Wait for proper stabilization
  delay(1000);

  // Check multiple times with more attempts
  bool ready = false;
  for (int i = 0; i < 10; i++) {
    if (scale.is_ready()) {
      ready = true;
      break;
    }
    Serial.print(F("LOADCELL:WAIT_READY:"));
    Serial.println(i);
    delay(200);
  }

  if (ready) {
    isReady = true;
    Serial.println(F("LOADCELL:INIT_OK"));

    // Do multiple test reads to verify it works
    Serial.println(F("LOADCELL:TEST_READS:"));
    for (int i = 0; i < 3; i++) {
      if (scale.wait_ready_timeout(1000)) {
        long testRead = scale.read();
        Serial.print(F("  READ_"));
        Serial.print(i);
        Serial.print(F(": "));
        Serial.println(testRead);
      } else {
        Serial.print(F("  READ_"));
        Serial.print(i);
        Serial.println(F(": TIMEOUT"));
      }
      delay(100);
    }

    // Perform initial tare
    Serial.println(F("LOADCELL:INITIAL_TARE"));
    if (scale.wait_ready_timeout(1000)) {
      scale.tare(10);  // Average 10 readings for tare
      Serial.println(F("LOADCELL:TARED"));
    } else {
      Serial.println(F("LOADCELL:TARE_TIMEOUT"));
    }
  } else {
    isReady = false;
    Serial.println(F("LOADCELL:INIT_FAIL - NOT_READY"));
  }
}

float LoadCell::readWeight() {
  // Return calibrated weight in grams
  if (!isReady) {
    // Debug: report why not ready (throttled)
    static unsigned long lastNotReadyMsg = 0;
    if (millis() - lastNotReadyMsg > 5000) {
      Serial.println(F("LOADCELL:NOT_READY"));
      lastNotReadyMsg = millis();
    }
    return 0.0;
  }

  // CRITICAL: Only read if scale is ready - this is NON-BLOCKING
  // If not ready, just return the last reading to avoid blocking motors
  if (!scale.is_ready()) {
    return currentWeight;
  }

  // Scale is ready - do a quick read
  // Use get_units() which respects the tare offset
  float units = scale.get_units();

  // Debug: print value periodically
  static unsigned long lastDebugPrint = 0;
  if (millis() - lastDebugPrint > 2000) {
    Serial.print(F("LOADCELL:UNITS:"));
    Serial.println(units, 2);
    lastDebugPrint = millis();
  }

  // Apply deadband filter to reduce noise
  // Only update if change is significant
  if (abs(units - currentWeight) > weightDeadband) {
    currentWeight = units;
  }
  // Otherwise keep previous value (noise suppression)

  // Add to buffer for stability calculation
  weightBuffer[weightBufferIndex] = currentWeight;
  weightBufferIndex = (weightBufferIndex + 1) % WEIGHT_BUFFER_SIZE;
  if (weightBufferIndex == 0) {
    bufferFilled = true;
  }

  lastWeightRead = millis();

  return currentWeight;
}

void LoadCell::tare() {
  // Start non-blocking tare operation
  if (!tareInProgress) {
    Serial.println(F("LOADCELL:TARE_START"));
    tareInProgress = true;
    tareStartTime = millis();
    // Don't call scale.tare() here - do it in run() with timeout protection
  }
}

void LoadCell::run() {
  // Process NON-BLOCKING tare operation
  if (tareInProgress) {
    unsigned long elapsed = millis() - tareStartTime;

    // Safety timeout to prevent hanging
    if (elapsed > TARE_TIMEOUT) {
      Serial.println(F("LOADCELL:TARE_TIMEOUT"));
      tareInProgress = false;
      return;
    }

    // COMPLETELY NON-BLOCKING tare - just do one quick tare and clear state
    if (scale.is_ready()) {
      // Do a simple tare (no averaging to avoid blocking)
      scale.tare();

      // Clear weight buffer and reset state IMMEDIATELY
      for (int i = 0; i < WEIGHT_BUFFER_SIZE; i++) {
        weightBuffer[i] = 0;
      }
      weightBufferIndex = 0;
      bufferFilled = false;
      currentWeight = 0.0;
      stableWeight = 0.0;
      stableStartTime = 0;
      lastWeightRead = millis();

      Serial.println(F("LOADCELL:TARED"));
      tareInProgress = false;
    } else if (elapsed > 100) {
      // If scale not ready after 100ms, timeout the tare
      Serial.println(F("LOADCELL:TARE_NOT_READY"));
      tareInProgress = false;
    }
  }
}

bool LoadCell::isWeightStable() {
  // Simpler weight stability check
  if (!scale.is_ready()) {
    return false;  // Load cell not ready
  }

  // Need at least a few samples
  if (!bufferFilled && weightBufferIndex < 3) {
    return false;
  }

  // Calculate variance of recent samples
  float mean = currentWeight;
  float variance = 0;
  int count = bufferFilled ? WEIGHT_BUFFER_SIZE : weightBufferIndex;

  for (int i = 0; i < count; i++) {
    float diff = weightBuffer[i] - mean;
    variance += diff * diff;
  }
  variance /= count;

  // More lenient stability threshold
  bool isCurrentlyStable = variance < 1.0;  // Increased from 0.25 to 1.0

  unsigned long now = millis();

  if (isCurrentlyStable) {
    if (stableStartTime == 0) {
      stableStartTime = now;
      stableWeight = currentWeight;
    }
    // Require only 300ms of stability (reduced from 500ms)
    return (now - stableStartTime) >= 300;
  } else {
    stableStartTime = 0;  // Reset stability timer
    return false;
  }
}

void LoadCell::calibrate(float knownWeight) {
  if (knownWeight > 0) {
    calibrationFactor = scale.get_units(10) / knownWeight;
    scale.set_scale(calibrationFactor);
  }
}

void LoadCell::setCalibrationFactor(float factor) {
  if (factor > 0) {
    calibrationFactor = factor;
    scale.set_scale(calibrationFactor);
    Serial.print(F("LOADCELL:CALIBRATION_SET:"));
    Serial.println(calibrationFactor, 2);
  }
}

void LoadCell::setDeadband(float deadband) {
  if (deadband >= 0) {
    weightDeadband = deadband;
    Serial.print(F("LOADCELL:DEADBAND_SET:"));
    Serial.println(weightDeadband, 3);
  }
}

// =====================================================
// GRINDER IMPLEMENTATION
// =====================================================


void Grinder::init() {
  pinMode(MOTOR3_RELAY_PIN, OUTPUT);
  // Set to OFF state based on relay polarity
  digitalWrite(MOTOR3_RELAY_PIN, LOW);
  running = false;
  startTime = 0;
  Serial.print(F("GRINDER:INIT_PIN_"));
  Serial.print(MOTOR3_RELAY_PIN);
}

void Grinder::start() {
  // Turn ON based on relay polarity
  digitalWrite(MOTOR3_RELAY_PIN, HIGH);
  running = true;
  startTime = millis();  // Record start time
  Serial.println(F("GRINDER:ON"));
  Serial.print(F("GRINDER:START_PIN_STATE:"));
  Serial.println(digitalRead(MOTOR3_RELAY_PIN));
}

void Grinder::stop() {
  // Turn OFF based on relay polarity
  digitalWrite(MOTOR3_RELAY_PIN, LOW);
  running = false;
  startTime = 0;  // Clear start time
  Serial.println(F("GRINDER:OFF"));
  Serial.print(F("GRINDER:STOP_PIN_STATE:"));
  Serial.println(digitalRead(MOTOR3_RELAY_PIN));
}

void Grinder::run() {
  // Check for timeout if running and restrictions are enabled
  if (running && ManualMode::hasPhysicalRestrictions()) {
    if (t_grinder_max > 0 && (millis() - startTime) >= t_grinder_max) {
      Serial.println(F("GRINDER:TIMEOUT_PROTECTION"));
      stop();  // Auto-stop on timeout
    }
  }
}

// isRunning() is defined inline in header

// =====================================================
// SOLENOID IMPLEMENTATION
// =====================================================

// Constructor is defined inline in header

void Solenoid::init() {
  pinMode(pin, OUTPUT);
  digitalWrite(pin, LOW);
}

void Solenoid::activate() {
  if (!active) {  // Only print if not already active
    Serial.print(F("DEBUG:SOLENOID_ACTIVATE:"));
    Serial.println(name);
  }
  digitalWrite(pin, HIGH);
  active = true;
  activationTime = millis();  // Record activation time

  // Report specific solenoid status for app
  if (strcmp(name, "Transfer") == 0) {
    Serial.println(F("TRANSFER:OPEN"));
  } else if (strcmp(name, "Cap") == 0) {
    Serial.println(F("CAP:PUSHED"));
  }
}

void Solenoid::deactivate() {
  digitalWrite(pin, LOW);
  active = false;
  activationTime = 0;  // Clear activation time

  // Report specific solenoid status for app
  if (strcmp(name, "Transfer") == 0) {
    Serial.println(F("TRANSFER:CLOSED"));
  } else if (strcmp(name, "Cap") == 0) {
    Serial.println(F("CAP:RETRACTED"));
  }
}

void Solenoid::run() {
  // Check for timeout if active and restrictions are enabled
  if (active && ManualMode::hasPhysicalRestrictions()) {
    unsigned long timeout = 0;

    // Determine timeout based on which solenoid this is
    if (strcmp(name, "Transfer") == 0) {
      timeout = t_transfer_max;  // Use hardware protection timeout
    } else if (strcmp(name, "Cap") == 0) {
      timeout = t_cap_max;  // Use hardware protection timeout
    }

    // Check if timeout has elapsed
    if (timeout > 0 && (millis() - activationTime) >= timeout) {
      Serial.print(F("SOLENOID:"));
      Serial.print(name);
      Serial.println(F(":TIMEOUT_PROTECTION"));
      deactivate();  // Auto-deactivate on timeout
    }
  }
}

// isActive() is defined inline in header

// =====================================================
// PROXIMITY SENSOR IMPLEMENTATION
// =====================================================

// Constructor is defined inline in header

bool ProximitySensor::init() {
  // Initialize VL53L0X sensor
  Serial.println(F("PROX:INIT_START - VL53L0X"));

  if (!lox.begin()) {
    Serial.println(F("PROX:INIT_FAIL - VL53L0X not found"));
    available = false;
    return false;
  }

  // Configure sensor for high speed measurements
  // This reduces measurement time for faster updates
  lox.configSensor(Adafruit_VL53L0X::VL53L0X_SENSE_HIGH_SPEED);

  // Start continuous ranging - measurements happen in background
  // This allows non-blocking reads via readRangeContinuousMillimeters()
  lox.startRangeContinuous();

  available = true;
  Serial.println(F("PROX:INIT_OK - VL53L0X initialized (continuous mode)"));
  return true;
}

uint16_t ProximitySensor::read() {
  if (!available) {
    return lastDistance;
  }

  // Read the latest distance measurement from continuous mode (NON-BLOCKING)
  // Only read if measurement is complete, otherwise return last value
  if (lox.isRangeComplete()) {
    uint16_t distance = lox.readRange();

    // Check if we got a valid reading (not out of range)
    if (distance > 0 && distance < 8191) {  // 8191 is max valid range for VL53L0X
      // Simple filter - just use last 3 readings average for speed
      static uint16_t last3[3] = {0, 0, 0};
      static uint8_t idx = 0;

      last3[idx] = distance;
      idx = (idx + 1) % 3;

      // Average of last 3
      lastDistance = (last3[0] + last3[1] + last3[2]) / 3;
    }
  }

  return lastDistance;
}

// isAvailable() is defined inline in header

bool ProximitySensor::hasSignificantChange() {
  // TODO: Implement change detection
  return false;
}

// =====================================================
// INPUT SYSTEM IMPLEMENTATION
// =====================================================

void InputSystem::init() {
  // Initialize button pins with internal pull-up resistors
  pinMode(START_BUTTON_PIN, INPUT_PULLUP);
  pinMode(STOP_BUTTON_PIN, INPUT_PULLUP);

  // Initialize sensor pins (for future use)
  pinMode(FRASCO_SENSOR_PIN, INPUT_PULLUP);
  pinMode(PILLS_LOADED_SENSOR_PIN, INPUT_PULLUP);

  Serial.println(F("INPUTS:INIT_OK"));
}

bool InputSystem::isStartPressed() {
  // Only return the virtual button state set by the UI
  // Physical button presses are reported via serial but don't trigger the virtual button
  // This ensures the cycle can only be started from the UI app
  return virtualButtonStart;
}

bool InputSystem::isResetPressed() {
  // Check physical button (active low with pull-up) and update virtual state
  bool physicalPressed = !digitalRead(STOP_BUTTON_PIN);

  // If physical button is pressed, set virtual button too
  if (physicalPressed) {
    virtualButtonReset = true;
  }

  return virtualButtonReset;
}

void InputSystem::clearButtons() {
  virtualButtonStart = false;
  virtualButtonReset = false;
}

bool InputSystem::isFrascoVacio() const {
  // Use virtual sensor state set via serial commands from UI
  return virtualFrascoVacio;
}

bool InputSystem::isPastillasCargadas() const {
  // Use virtual sensor state set via serial commands from UI
  return virtualPastillasCargadas;
}

// =====================================================
// OLED DISPLAY IMPLEMENTATION
// =====================================================

// Create display instance
Adafruit_SSD1306 display(OLED_WIDTH, OLED_HEIGHT,
  &SPI, OLED_DC_PIN, OLED_RESET_PIN, OLED_CS_PIN);

bool OLEDDisplay::init() {
  // Try to initialize display but don't hang
  initialized = false;

  // Simple initialization without extra parameters
  if(display.begin(SSD1306_SWITCHCAPVCC)) {
    initialized = true;
    display.clearDisplay();
    display.setTextColor(SSD1306_WHITE);
    display.display();
    return true;
  }

  return false;
}

void OLEDDisplay::clear() {
  if (!initialized) return;
  display.clearDisplay();
  display.display();
}

void OLEDDisplay::update() {
  if (!initialized) return;

  unsigned long now = millis();
  if (now - lastUpdate >= UPDATE_INTERVAL) {
    display.display();
    lastUpdate = now;
  }
}

void OLEDDisplay::showStartup() {
  if (!initialized) return;

  display.clearDisplay();

  // For dual-color display: yellow top (0-15), blue bottom (16-63)
  // Put title in yellow zone
  display.setTextSize(2);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(25, 0);  // Row 0 - in yellow zone
  display.println(F("LOTECH"));

  // Put subtitle in blue zone
  display.setTextSize(1);
  display.setCursor(20, 30);  // Row 30 - in blue zone
  display.println(F("Sistema Iniciando"));
  display.setCursor(30, 45);
  display.println(F("Version 1.0"));

  display.display();
}

void OLEDDisplay::showState(const char* stateName, int pillCount, int totalPills) {
  if (!initialized) return;

  display.clearDisplay();

  // Check for special states
  bool isPaused = (strcmp(stateName, "PAUSADO") == 0);
  bool isError = (strcmp(stateName, "ERROR") == 0);

  // Use yellow zone (0-15) for status indicator
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);

  if (isPaused) {
    // Show PAUSED indicator
    display.setCursor(0, 4);
    display.print(F("[PAUSA] "));
    display.println(stateName);
  } else if (isError) {
    // Show ERROR indicator
    display.setCursor(0, 4);
    display.print(F("[ERROR] "));
    display.println(stateName);
  } else {
    // Normal state display
    display.setCursor(0, 4);
    display.print(F("Estado: "));
    display.println(stateName);
  }

  // Use blue zone (16-63) for details
  display.setCursor(0, 20);
  display.print(F("Pastillas: "));
  display.print(pillCount);
  display.print(F("/"));
  display.println(totalPills);

  // Progress bar in blue zone
  if (totalPills > 0) {
    int percent = (pillCount * 100) / totalPills;
    drawProgressBar(0, 35, 128, 10, percent);
  }

  // Additional info at bottom
  display.setCursor(0, 50);
  display.setTextSize(1);
  if (pillCount == totalPills && totalPills > 0) {
    display.print(F("Completado!"));
  }

  display.display();
}

void OLEDDisplay::showManualMode() {
  if (!initialized) return;

  display.clearDisplay();

  // Yellow zone - mode indicator (centered)
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  // "MODO MANUAL" = 11 chars * 6 pixels = 66 pixels, center at (128-66)/2 = 31
  display.setCursor(31, 4);
  display.println(F("MODO MANUAL"));

  // Blue zone - status (centered)
  display.setTextSize(2);
  // "CONTROL" = 7 chars * 12 pixels = 84 pixels, center at (128-84)/2 = 22
  display.setCursor(22, 25);
  display.println(F("CONTROL"));
  // "ACTIVO" = 6 chars * 12 pixels = 72 pixels, center at (128-72)/2 = 28
  display.setCursor(28, 45);
  display.println(F("ACTIVO"));

  display.display();
}

void OLEDDisplay::showError(const char* error) {
  if (!initialized) return;

  display.clearDisplay();

  // Yellow zone (0-15) - ERROR header (centered)
  display.setTextSize(2);
  // "ERROR" = 5 chars * 12 pixels = 60 pixels, center at (128-60)/2 = 34
  display.setCursor(34, 0);
  display.println(F("ERROR"));

  // Blue zone (16-63) - Error details (centered if short)
  display.setTextSize(1);
  int errorLen = strlen(error);
  int errorPixels = errorLen * 6;
  if (errorPixels < 128) {
    display.setCursor((128 - errorPixels) / 2, 24);
  } else {
    display.setCursor(0, 24);
  }
  display.println(error);

  // Instructions (centered)
  display.setCursor(10, 40);
  display.println(F("Presione RESET"));
  display.setCursor(13, 50);
  display.println(F("para continuar"));

  display.display();
}

void OLEDDisplay::showWeight(float weight) {
  if (!initialized) return;

  // Update weight area only
  display.fillRect(0, 48, 128, 16, SSD1306_BLACK);
  display.setCursor(0, 48);
  display.setTextSize(1);
  display.print(F("Peso: "));
  display.print(weight, 2);
  display.print(F(" g"));
}

void OLEDDisplay::showProximity(uint16_t value, bool atTop, bool atBottom) {
  if (!initialized) return;

  // Update proximity area
  display.fillRect(80, 48, 48, 16, SSD1306_BLACK);
  display.setCursor(80, 48);
  display.setTextSize(1);
  if (atTop) {
    display.print(F("TOP"));
  } else if (atBottom) {
    display.print(F("BTM"));
  } else {
    display.print(F("MID"));
  }
}

void OLEDDisplay::drawProgressBar(int x, int y, int width, int height, int percent) {
  if (!initialized) return;

  // Draw border
  display.drawRect(x, y, width, height, SSD1306_WHITE);

  // Fill progress
  int fillWidth = ((width - 2) * percent) / 100;
  if (fillWidth > 0) {
    display.fillRect(x + 1, y + 1, fillWidth, height - 2, SSD1306_WHITE);
  }
}

// =====================================================
// GLOBAL INSTANCES
// =====================================================

Elevator elevator;
DosingWheel dosingWheel;
LoadCell loadCell;
Grinder grinder;
Solenoid transferSolenoid(SOLENOID1_PIN, "Transfer");
Solenoid capSolenoid(SOLENOID2_PIN, "Cap");
ProximitySensor proxSensor;
InputSystem inputs;
OLEDDisplay oledDisplay;

// Mode tracking (start in real mode)
ControlMode globalMode = MODE_REAL;

void setGlobalMode(ControlMode mode) {
  globalMode = mode;
  elevator.setMode(mode);
  loadCell.setMode(mode);
  inputs.setMode(mode);
}