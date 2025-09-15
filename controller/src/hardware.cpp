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
  motor.setCurrentPosition(0);

  // Make sure step and dir pins are outputs
  pinMode(MOTOR1_STEP_PIN, OUTPUT);
  pinMode(MOTOR1_DIR_PIN, OUTPUT);

  // Configure microstepping pins
  pinMode(MOTOR1_MS1_PIN, OUTPUT);
  pinMode(MOTOR1_MS2_PIN, OUTPUT);

  digitalWrite(MOTOR1_MS1_PIN, HIGH);  // Half-stepping
  digitalWrite(MOTOR1_MS2_PIN, LOW);

  Serial.println(F("ELEVATOR:INIT_OK"));
}

void Elevator::moveUp() {
  if (!movingUp) {
    movingUp = true;
    movingDown = false;
    digitalWrite(MOTOR1_DIR_PIN, LOW);  // Set direction pin LOW for forward
    motor.setSpeed(ELEVATOR_SPEED);  // Positive speed for up
    moveStartTime = millis();
    Serial.println(F("ELEVATOR:UP"));
  }
}

void Elevator::moveDown() {
  if (!movingDown) {
    movingUp = false;
    movingDown = true;
    // For backward, use positive speed but manually set direction pin
    digitalWrite(MOTOR1_DIR_PIN, HIGH);  // Set direction pin HIGH for backward
    motor.setSpeed(ELEVATOR_SPEED);  // Use positive speed
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
  // Always run the motor if moving (for manual mode to work)
  if (movingUp || movingDown) {
    motor.runSpeed();
    // runSpeed() returns true if a step was taken
    // if (!motor.runSpeed()) {
      // If no step taken, try to force it by setting current position
      // This helps with negative speeds
      // if (movingDown && motor.speed() < 0) {
        // motor.setCurrentPosition(motor.currentPosition() - 1);
      // }
    // }

    // Check limits only if physical restrictions are enabled
    if (ManualMode::hasPhysicalRestrictions()) {
      if (movingUp) {
        bool reachedTop = false;

        // Check proximity sensor
        if (proxSensor.isAvailable()) {
          uint16_t prox = proxSensor.read();
          reachedTop = (prox > prox_threshold_up);
        }

        // Stop if reached top or timeout
        if (reachedTop || (millis() - moveStartTime > T_ELEV_UP)) {
          atTop = true;
          atBottom = false;
          stop();
          Serial.println(F("ELEVATOR:AT_TOP"));
        }
      } else if (movingDown) {
        bool reachedBottom = false;

        // Check proximity sensor
        if (proxSensor.isAvailable()) {
          uint16_t prox = proxSensor.read();
          reachedBottom = (prox <= prox_threshold_down);
        }

        // Stop if reached bottom or timeout
        if (reachedBottom || (millis() - moveStartTime > T_ELEV_DOWN)) {
          atTop = false;
          atBottom = true;
          stop();
          Serial.println(F("ELEVATOR:AT_BOTTOM"));
        }
      }
    }
  }
}

// isMoving() is defined inline in header

bool Elevator::isAtTop() const {
  // Use proximity sensor if available
  if (proxSensor.isAvailable()) {
    uint16_t prox = proxSensor.read();
    return prox > prox_threshold_up;
  }
  return atTop;
}

bool Elevator::isAtBottom() const {
  if (!proxSensor.isAvailable()) {
    // If no proximity sensor, rely on timeout only
    return atBottom;
  } else {
    // Use proximity sensor for position detection
    if (proxSensor.isAvailable()) {
      uint16_t prox = proxSensor.read();
      return prox <= prox_threshold_down;
    }
    // If no proximity sensor, rely on timeout only
    return atBottom;
  }
  return atBottom;
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
  pinMode(MOTOR2_MS1_PIN, OUTPUT);
  pinMode(MOTOR2_MS2_PIN, OUTPUT);
  digitalWrite(MOTOR2_MS1_PIN, LOW);   // Full stepping for better torque
  digitalWrite(MOTOR2_MS2_PIN, LOW);   // MS1=0, MS2=0 = Full step

  // Make sure step and dir pins are outputs (AccelStepper should do this but let's be sure)
  pinMode(MOTOR2_STEP_PIN, OUTPUT);
  pinMode(MOTOR2_DIR_PIN, OUTPUT);

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
  // Set MS pins LOW to reduce current when idle
  digitalWrite(MOTOR2_MS1_PIN, LOW);
  digitalWrite(MOTOR2_MS2_PIN, LOW);
}

void DosingWheel::run() {
  if (continuousMode) {
    // In continuous mode, just run at constant speed
    if (!motor.runSpeed()) {
      // runSpeed returns false if no step was taken
      // Force a step by updating position
      motor.setSpeed(motor.speed());
    }
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
  digitalWrite(MOTOR2_MS1_PIN, HIGH);  // Half stepping
  digitalWrite(MOTOR2_MS2_PIN, LOW);   // MS1=1, MS2=0 = Half step

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

  // Set MS pins back to full stepping
  digitalWrite(MOTOR2_MS1_PIN, LOW);
  digitalWrite(MOTOR2_MS2_PIN, LOW);
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
  // Simple analog sensor on pin A2
  pinMode(A2, INPUT);
  available = true;
  return true;
}

uint16_t ProximitySensor::read() {
  if (!available) {
    return 0;
  }

  // Read analog sensor (0-1023)
  lastRawValue = analogRead(A2) / 4;  // Scale to 0-255 for raw value
  lastProximity = analogRead(A2);     // Keep full resolution for proximity
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

bool InputSystem::isStartPressed() {
  if (mode == MODE_SIMULATION) {
    return simButtonStart;
  }
  // Read physical button (active low with pull-up)
  return !digitalRead(2);  // TODO: Define START_BUTTON_PIN
}

bool InputSystem::isResetPressed() {
  if (mode == MODE_SIMULATION) {
    return simButtonReset;
  }
  // Read physical button (active low with pull-up)
  return !digitalRead(3);  // TODO: Define STOP_BUTTON_PIN
}

void InputSystem::clearButtons() {
  simButtonStart = false;
  simButtonReset = false;
}

bool InputSystem::isFrascoVacio() const {
  if (mode == MODE_SIMULATION) {
    return simFrascoVacio;
  }
  // TODO: Read actual sensor
  return true;
}

bool InputSystem::isPastillasCargadas() const {
  if (mode == MODE_SIMULATION) {
    return simPastillasCargadas;
  }
  // TODO: Read actual sensor
  return true;
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