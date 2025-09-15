#include "hardware.h"
#include "config.h"
#include "manual_mode.h"
#include "state_machine.h"  // For extern variables

// =====================================================
// ELEVATOR IMPLEMENTATION
// =====================================================

Elevator::Elevator() : motor(AccelStepper::DRIVER, MOTOR1_STEP_PIN, MOTOR1_DIR_PIN) {
  movingUp = false;
  movingDown = false;
  atTop = false;
  atBottom = true;
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
    motor.setSpeed(ELEVATOR_SPEED); 
    moveStartTime = millis();
    Serial.println(F("ELEVATOR:UP"));
    
  }
}

void Elevator::moveDown() {
  if (!movingDown) {
    movingUp = false;
    movingDown = true;
    motor.setSpeed(-ELEVATOR_SPEED); 
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
      // Check for timeout failsafe
      if (movingUp && (millis() - moveStartTime > T_ELEV_UP)) {
        atTop = true;
        atBottom = false;
        stop();
        Serial.println(F("ELEVATOR:TIMEOUT_TOP"));
      } else if (movingDown && (millis() - moveStartTime > T_ELEV_DOWN)) {
        atTop = false;
        atBottom = true;
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
    // Use full stepping (no microstepping multiplier)
    int stepsPerDivision = STEPS_PER_REVOLUTION / wheel_divisions;
    motor.move(stepsPerDivision);  // Positive for forward
    dosingInProgress = true;
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

  float speed = forward ? DOSING_SPEED : -DOSING_SPEED;
  motor.setSpeed(speed);

  Serial.print(F("DEBUG:DOSING:SPEED:"));
  Serial.println(speed);
  Serial.print(F("DEBUG:DOSING:MODE:"));
  Serial.println(continuousMode ? F("CONTINUOUS") : F("NORMAL"));
}

void DosingWheel::stopContinuous() {
  continuousMode = false;
  motor.stop();
  motor.setSpeed(0);
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
}

void LoadCell::init() {
  scale.begin(HX711_DOUT_PIN, HX711_SCK_PIN);
  scale.set_scale(2280.f);  // Default calibration factor
  scale.tare();
}

float LoadCell::readWeight() {
  if (scale.is_ready()) {
    return scale.get_units(10);  // Average of 10 readings
  }
  return 0.0;
}

void LoadCell::tare() {
  scale.tare();
}

bool LoadCell::isWeightStable() {
  // Take two readings and check if they're close
  float reading1 = readWeight();
  delay(50);
  float reading2 = readWeight();

  return abs(reading1 - reading2) < 0.5;  // Within 0.5g
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
  digitalWrite(MOTOR3_RELAY_PIN, LOW);
  running = false;
}

void Grinder::start() {
  digitalWrite(MOTOR3_RELAY_PIN, HIGH);
  running = true;
}

void Grinder::stop() {
  digitalWrite(MOTOR3_RELAY_PIN, LOW);
  running = false;
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
}

void Solenoid::deactivate() {
  digitalWrite(pin, LOW);
  active = false;
}

// isActive() is defined inline in header

// =====================================================
// PROXIMITY SENSOR IMPLEMENTATION
// =====================================================

// Constructor is defined inline in header

bool ProximitySensor::init() {
  // Initialize APDS9960 sensor
  if (!APDS.begin()) {
    Serial.println(F("PROX:INIT_FAIL - APDS9960 not found"));
    available = false;
    return false;
  }

  // The library automatically enables proximity when calling proximityAvailable() or readProximity()
  // No explicit enable needed with this library version

  available = true;
  Serial.println(F("PROX:INIT_OK - APDS9960 initialized"));
  return true;
}

uint16_t ProximitySensor::read() {
  if (!available) {
    return 0;
  }

  // Check if proximity data is available
  if (APDS.proximityAvailable()) {
    // Read proximity value (0-255, closer objects have higher values)
    int proximity = APDS.readProximity();

    // Check for valid reading
    if (proximity >= 0) {
      // Store raw value
      lastRawValue = (uint8_t)proximity;

      // APDS9960 gives higher values when objects are closer
      // For elevator: UP position = closer to sensor = higher value
      // For elevator: DOWN position = farther from sensor = lower value
      // Scale to 0-1024 range for compatibility
      lastProximity = (uint16_t)proximity * 4;

      return lastProximity;
    }
  }

  // Return last known value if no new reading available
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

// Mode tracking (start in real mode)
ControlMode globalMode = MODE_REAL;

void setGlobalMode(ControlMode mode) {
  globalMode = mode;
  elevator.setMode(mode);
  loadCell.setMode(mode);
  inputs.setMode(mode);
}