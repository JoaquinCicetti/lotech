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
    motor.setSpeed(elevator_speed);
    moveStartTime = millis();
    Serial.println(F("ELEVATOR:UP"));

  }
}

void Elevator::moveDown() {
  if (!movingDown) {
    movingUp = false;
    movingDown = true;
    motor.setSpeed(-elevator_speed);
    moveStartTime = millis();
    Serial.println(F("ELEVATOR:DOWN"));

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
  // Simply run the motor if moving - nothing else
  if (movingUp || movingDown) {
    motor.runSpeed();

    // ONLY check limits if restrictions are enabled AND enough time has passed
    if (ManualMode::hasPhysicalRestrictions()) {
      // Check for timeout failsafe - but DON'T modify position in auto mode
      if (movingUp && (millis() - moveStartTime > t_elev_up)) {
        // In both manual and simulation modes, set position on timeout
        // In real auto mode, the state machine will handle timeout as error
        if (ManualMode::isManual() || !proxSensor.isAvailable()) {
          // Manual mode OR simulation (no prox sensor) - set position
          atTop = true;
          atBottom = false;
          Serial.println(F("ELEVATOR:TIMEOUT_TOP_SIMULATED"));
        }
        stop();
        Serial.println(F("ELEVATOR:TIMEOUT_TOP"));
      } else if (movingDown && (millis() - moveStartTime > t_elev_down)) {
        // In both manual and simulation modes, set position on timeout
        // In real auto mode, the state machine will handle timeout as error
        if (ManualMode::isManual() || !proxSensor.isAvailable()) {
          // Manual mode OR simulation (no prox sensor) - set position
          atTop = false;
          atBottom = true;
          Serial.println(F("ELEVATOR:TIMEOUT_BOTTOM_SIMULATED"));
        }
        stop();
        Serial.println(F("ELEVATOR:TIMEOUT_BOTTOM"));
      }
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
  // Update position based on proximity sensor
  // This is called periodically to keep position state current
  if (proxSensor.isAvailable()) {
    uint16_t prox = proxSensor.read();
    bool wasAtTop = atTop;
    bool wasAtBottom = atBottom;

    atTop = (prox > prox_threshold_up);
    atBottom = (prox <= prox_threshold_down);

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

void Elevator::simulatePosition(bool top, bool bottom) {
  if (mode == MODE_SIMULATION) {
    // Prevent both positions being active at the same time
    if (top && bottom) {
      Serial.println("ERROR:No se puede estar arriba y abajo simultaneamente");
      return;
    }
    atTop = top;
    atBottom = bottom;
  }
}

// =====================================================
// DOSING WHEEL IMPLEMENTATION
// =====================================================

DosingWheel::DosingWheel() : motor(AccelStepper::DRIVER, MOTOR2_STEP_PIN, MOTOR2_DIR_PIN) {
  dosingInProgress = false;
  continuousMode = false;
}

void DosingWheel::init() {
  motor.setMaxSpeed(DOSING_MAX_SPEED);
  motor.setAcceleration(DOSING_ACCELERATION);
  motor.setSpeed(dosing_speed);  // Set default speed from global
  motor.setCurrentPosition(0);  // Reset position

  // Configure microstepping pins
  // pinMode(MOTOR2_MS1_PIN, OUTPUT);
  // pinMode(MOTOR2_MS2_PIN, OUTPUT);

  // digitalWrite(MOTOR2_MS1_PIN, LOW);   // Full stepping for better torque
  // digitalWrite(MOTOR2_MS2_PIN, LOW);   // MS1=0, MS2=0 = Full step

  // Make sure step and dir pins are outputs (AccelStepper should do this but let's be sure)
  // pinMode(MOTOR2_STEP_PIN, OUTPUT);
  // pinMode(MOTOR2_DIR_PIN, OUTPUT);

  Serial.println(F("DOSING:INIT_OK"));
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
      if (remaining == 0) {
        dosingInProgress = false;
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
  weightStableTime = 0;
  simWeightStable = false;

  // Initialize weight buffer
  weightBufferIndex = 0;
  bufferFilled = false;
  lastWeightRead = 0;
  stableWeight = 0;
  stableStartTime = 0;
  for (int i = 0; i < WEIGHT_BUFFER_SIZE; i++) {
    weightBuffer[i] = 0;
  }
}

void LoadCell::init() {
  Serial.println(F("LOADCELL:INIT_START"));

  scale.begin(HX711_DOUT_PIN, HX711_SCK_PIN);

  // Wait MORE for proper stabilization
  delay(1000);

  // Check multiple times
  bool ready = false;
  for (int i = 0; i < 5; i++) {
    if (scale.is_ready()) {
      ready = true;
      break;
    }
    delay(100);
  }

  if (ready) {
    isReady = true;
    Serial.println(F("LOADCELL:INIT_OK"));

    // Do a test read to verify it works
    long testRead = scale.read();
    Serial.print(F("LOADCELL:TEST_READ:"));
    Serial.println(testRead);
  } else {
    isReady = false;
    Serial.println(F("LOADCELL:INIT_FAIL"));
  }
}

float LoadCell::readWeight() {
  // Simple direct reading - NO FILTERING, NO BUFFERING
  if (!isReady) {
    return 0.0;
  }

  // Only read if enough time has passed (like the delay in the test)
  unsigned long now = millis();
  if (now - lastWeightRead < 500) {
    return currentWeight;  // Return last value
  }
  lastWeightRead = now;

  if (scale.is_ready()) {
    // Just read raw value directly - exactly like the test that worked
    long raw = scale.read();
    if (raw != -1) {  // Only update if valid reading
      currentWeight = (float)raw;
    }
  }

  return currentWeight;
}

void LoadCell::tare() {
  scale.tare();
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
  // Initialize HC-SR04 pins
  pinMode(HCSR04_TRIG_PIN, OUTPUT);
  pinMode(HCSR04_ECHO_PIN, INPUT);
  digitalWrite(HCSR04_TRIG_PIN, LOW);

  available = true;
  Serial.println(F("PROX:INIT_OK - HC-SR04 initialized"));
  return true;
}

long ProximitySensor::readDistanceMm() {
  // Clear trigger
  digitalWrite(HCSR04_TRIG_PIN, LOW);
  delayMicroseconds(5);

  // Send 10us pulse
  digitalWrite(HCSR04_TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(HCSR04_TRIG_PIN, LOW);

  // Wait for echo - 12ms timeout for ~2m max range (enough for 15cm)
  long duration = pulseIn(HCSR04_ECHO_PIN, HIGH, 12000);

  if (duration == 0) {
    return 0; // Timeout - no object detected
  }

  // Convert to mm: duration * 0.343 / 2 = duration * 343 / 2000
  long distance = (duration * 343L) / 2000L;

  // Constrain to reasonable range (20-4000mm)
  if (distance < 20) distance = 20;
  if (distance > 4000) distance = 4000;

  return distance;
}

uint16_t ProximitySensor::read() {
  if (!available) {
    return 0;
  }

  // Read distance in mm
  long distanceMm = readDistanceMm();

  if (distanceMm < 0 || distanceMm > 4000) {
    // Invalid reading - return last known value
    return lastProximity;
  }

  // Store raw distance in mm
  lastRawValue = constrain(distanceMm, 0, 4000);

  // Add to filter buffer for smoothing
  filterBuffer[filterIndex] = distanceMm;
  filterIndex = (filterIndex + 1) % FILTER_SIZE;

  if (filterIndex == 0) {
    filterInitialized = true;
  }

  // Calculate moving average
  uint32_t sum = 0;
  uint8_t count = filterInitialized ? FILTER_SIZE : (filterIndex > 0 ? filterIndex : 1);

  for (uint8_t i = 0; i < count; i++) {
    sum += filterBuffer[i];
  }

  uint16_t avgDistance = sum / count;

  // INVERT and scale to 0-1024 range to match APDS behavior
  // Close distance (e.g., 10mm) = high value (1024)
  // Far distance (e.g., 150mm) = low value (0)
  // Map: 10-150mm range to 1024-0 for maximum precision in 15cm range
  if (avgDistance <= 10) {
    lastProximity = 1024;
  } else if (avgDistance >= 150) {
    lastProximity = 0;
  } else {
    // Linear interpolation: closer = higher value
    lastProximity = map(avgDistance, 10, 150, 1024, 0);
  }

  return lastProximity;
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
  pinMode(RESET_BUTTON_PIN, INPUT_PULLUP);

  // Initialize sensor pins (for future use)
  pinMode(FRASCO_SENSOR_PIN, INPUT_PULLUP);
  pinMode(PILLS_LOADED_SENSOR_PIN, INPUT_PULLUP);

  Serial.println(F("INPUTS:INIT_OK"));
}

bool InputSystem::isStartPressed() {
  if (mode == MODE_SIMULATION) {
    return simButtonStart;
  }
  // Read physical button (active low with pull-up)
  return !digitalRead(START_BUTTON_PIN);
}

bool InputSystem::isResetPressed() {
  if (mode == MODE_SIMULATION) {
    return simButtonReset;
  }
  // Read physical button (active low with pull-up)
  return !digitalRead(RESET_BUTTON_PIN);
}

void InputSystem::clearButtons() {
  simButtonStart = false;
  simButtonReset = false;
}

bool InputSystem::isFrascoVacio() const {
  if (mode == MODE_SIMULATION) {
    return simFrascoVacio;
  }
  // Read actual sensor (active low)
  return !digitalRead(FRASCO_SENSOR_PIN);
}

bool InputSystem::isPastillasCargadas() const {
  if (mode == MODE_SIMULATION) {
    return simPastillasCargadas;
  }
  // Read actual sensor (active low)
  return !digitalRead(PILLS_LOADED_SENSOR_PIN);
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

  // Use yellow zone (0-15) for important info
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 4);  // Center in yellow zone
  display.print(F("Estado: "));
  display.println(stateName);

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