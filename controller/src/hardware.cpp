#include "hardware.h"
#include "state_machine.h"  // For global delay variables

// Global instances
Elevator elevator;
DosingWheel dosingWheel;
LoadCell loadCell;
Grinder grinder;
Solenoid transferSolenoid(SOLENOID1_PIN, "TRASPASO");
Solenoid capSolenoid(SOLENOID2_PIN, "TAPA");
InputSystem inputs;
ProximitySensor proxSensor;
ControlMode globalMode = MODE_SIMULATION;

// =====================================================
// ELEVATOR IMPLEMENTATION
// =====================================================

Elevator::Elevator() : motor(AccelStepper::DRIVER, MOTOR1_STEP_PIN, MOTOR1_DIR_PIN) {
  movingUp = false;
  movingDown = false;
  atTop = false;
  atBottom = true;  // Start at bottom
  mode = MODE_SIMULATION;
  moveStartTime = 0;
}

void Elevator::init() {
  motor.setMaxSpeed(ELEVATOR_MAX_SPEED);
  motor.setAcceleration(ELEVATOR_ACCELERATION);
  
  // Configure microstepping pins
  pinMode(MOTOR1_MS1_PIN, OUTPUT);
  pinMode(MOTOR1_MS2_PIN, OUTPUT);
  digitalWrite(MOTOR1_MS1_PIN, HIGH);  // Half-stepping
  digitalWrite(MOTOR1_MS2_PIN, LOW);
}

void Elevator::moveUp() {
  movingUp = true;
  movingDown = false;
  motor.setSpeed(ELEVATOR_SPEED);
  motor.setMaxSpeed(ELEVATOR_MAX_SPEED); // Ensure max speed is set
  moveStartTime = millis();
  Serial.println(F("ACCION:ELEVADOR_SUBIENDO"));
}

void Elevator::moveDown() {
  movingUp = false;
  movingDown = true;
  motor.setSpeed(-ELEVATOR_SPEED);
  motor.setMaxSpeed(ELEVATOR_MAX_SPEED); // Ensure max speed is set
  moveStartTime = millis();
  Serial.println(F("ACCION:ELEVADOR_BAJANDO"));
}

void Elevator::stop() {
  movingUp = false;
  movingDown = false;
  motor.setSpeed(0);
  Serial.println(F("ACCION:ELEVADOR_DETENIDO"));
}

void Elevator::run() {
  if (mode == MODE_REAL || mode == MODE_TEST) {
    // Real mode and Test mode: run actual motors
    extern ProximitySensor proxSensor;
    extern uint16_t prox_threshold_up;
    extern uint16_t prox_threshold_down;
    
    if (movingUp) {
      motor.runSpeed();
      bool reachedTop = false;
      
      // Check proximity sensor (in both real and test modes)
      if (proxSensor.isAvailable()) {
        uint16_t prox = proxSensor.read();
        reachedTop = (prox > prox_threshold_up);
      }
      
      // Check if reached top or timeout
      if (reachedTop || (millis() - moveStartTime > T_ELEV_UP)) {
        atTop = true;
        atBottom = false;
        stop();
        if (mode == MODE_TEST) {
          Serial.println(F("TEST:ELEVATOR:UP"));
        } else {
          Serial.println(F("ELEVADOR:ARRIBA"));
        }
      }
    } else if (movingDown) {
      motor.runSpeed();
      bool reachedBottom = false;
      
      // Check proximity sensor
      if (proxSensor.isAvailable()) {
        uint16_t prox = proxSensor.read();
        reachedBottom = (prox <= prox_threshold_down);
      }
      
      // Check if reached bottom or timeout
      if (reachedBottom || (millis() - moveStartTime > T_ELEV_DOWN)) {
        atTop = false;
        atBottom = true;
        stop();
        if (mode == MODE_TEST) {
          Serial.println(F("TEST:ELEVATOR:DOWN"));
        } else {
          Serial.println(F("ELEVADOR:ABAJO"));
        }
      }
    }
  } else {
    // Simulation mode only: use timers, no real motor movement
    if (movingUp) {
      // Don't actually run motor in simulation
      if (millis() - moveStartTime > T_ELEV_UP) {
        atTop = true;
        atBottom = false;
        stop();
        Serial.println(F("ELEVADOR:ARRIBA"));
      }
    } else if (movingDown) {
      // Don't actually run motor in simulation
      if (millis() - moveStartTime > T_ELEV_DOWN) {
        atTop = false;
        atBottom = true;
        stop();
        Serial.println(F("ELEVADOR:ABAJO"));
      }
    }
  }
}

bool Elevator::isAtTop() const {
  if (mode == MODE_REAL) {
    // Use proximity sensor for position detection
    extern ProximitySensor proxSensor;
    extern uint16_t prox_threshold_up;
    if (proxSensor.isAvailable()) {
      uint16_t prox = proxSensor.read();
      return prox > prox_threshold_up;
    }
    // If no proximity sensor, rely on timeout only
    return atTop;
  }
  return atTop;
}

bool Elevator::isAtBottom() const {
  if (mode == MODE_REAL) {
    // Use proximity sensor for position detection
    extern ProximitySensor proxSensor;
    extern uint16_t prox_threshold_down;
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
}

void DosingWheel::init() {
  motor.setMaxSpeed(DOSING_MAX_SPEED);
  motor.setAcceleration(DOSING_ACCELERATION);
  
  // Configure microstepping pins
  pinMode(MOTOR2_MS1_PIN, OUTPUT);
  pinMode(MOTOR2_MS2_PIN, OUTPUT);
  digitalWrite(MOTOR2_MS1_PIN, HIGH);  // Half-stepping
  digitalWrite(MOTOR2_MS2_PIN, LOW);
}

void DosingWheel::dispenseOne() {
  // Only dispense if not already dispensing
  if (!dosingInProgress) {
    // Calculate steps based on current wheel divisions
    int stepsPerDivision = (STEPS_PER_REVOLUTION * MICROSTEPS) / wheel_divisions;
    motor.move(stepsPerDivision);
    dosingInProgress = true;
    Serial.println("ACCION:DOSIFICANDO");
    Serial.print("DEBUG:DOSING:STEPS:");
    Serial.println(stepsPerDivision);
  } else {
    Serial.println("DEBUG:DOSING:ALREADY_IN_PROGRESS");
  }
}

void DosingWheel::stop() {
  motor.stop();
  dosingInProgress = false;
}

void DosingWheel::run() {
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

void DosingWheel::updateStepsPerDivision() {
  // This can be called when wheel_divisions changes
  // No need to store it, we calculate on demand in dispenseOne()
}

// =====================================================
// LOAD CELL IMPLEMENTATION
// =====================================================

LoadCell::LoadCell() {
  currentWeight = 0.0;
  lastStableWeight = 0.0;
  calibrationFactor = CALIBRATION_FACTOR_DEFAULT;
  weightThreshold = WEIGHT_THRESHOLD_DEFAULT;
  weightStableTime = 0;
  mode = MODE_SIMULATION;
  isReady = false;
  simWeightStable = false;
}

void LoadCell::init() {
  // Commented out to prevent hanging
  scale.begin(HX711_DOUT_PIN, HX711_SCK_PIN);
  
  if (scale.is_ready()) {
    isReady = true;
    scale.set_scale(calibrationFactor);
    scale.tare();
    Serial.println("ESCALA:ENCONTRADA");
  } else {
    Serial.println("ESCALA:NO_ENCONTRADA");
  }
  // isReady = false;
  // Serial.println("ESCALA:DESHABILITADA");
}

float LoadCell::readWeight() {
  if (mode == MODE_REAL && isReady) {
    currentWeight = scale.get_units(10);  // Average of 10 readings
    return currentWeight;
  }
  return 0.0;  // Simulation mode or not ready returns 0
}

bool LoadCell::isWeightStable() {
  if (mode == MODE_SIMULATION) {
    return simWeightStable;
  }
  
  if (!isReady) return false;
  
  float weightDiff = abs(currentWeight - lastStableWeight);
  
  if (weightDiff < WEIGHT_TOLERANCE) {
    if (millis() - weightStableTime > WEIGHT_STABLE_TIME) {
      return true;
    }
  } else {
    lastStableWeight = currentWeight;
    weightStableTime = millis();
  }
  
  return false;
}

void LoadCell::tare() {
  if (isReady) {
    scale.tare();
    Serial.println("ESCALA:TARA");
  }
}

void LoadCell::calibrate(float knownWeight) {
  if (isReady && knownWeight > 0) {
    float reading = scale.get_units(10);
    calibrationFactor = reading / knownWeight;
    scale.set_scale(calibrationFactor);
    Serial.print("ESCALA:CALIBRADA:");
    Serial.println(calibrationFactor);
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
  Serial.println("ACCION:MOLIENDO");
}

void Grinder::stop() {
  digitalWrite(MOTOR3_RELAY_PIN, LOW);
  running = false;
  Serial.println("ACCION:MOLEDOR_DETENIDO");
}

// =====================================================
// SOLENOID IMPLEMENTATION
// =====================================================

void Solenoid::init() {
  pinMode(pin, OUTPUT);
  digitalWrite(pin, LOW);
  active = false;
}

void Solenoid::activate() {
  digitalWrite(pin, HIGH);
  active = true;
  Serial.print("ACCION:");
  Serial.print(name);
  Serial.println("_ACTIVADO");
}

void Solenoid::deactivate() {
  digitalWrite(pin, LOW);
  active = false;
  Serial.print("ACCION:");
  Serial.print(name);
  Serial.println("_DESACTIVADO");
}

// =====================================================
// INPUT SYSTEM IMPLEMENTATION
// =====================================================

bool InputSystem::isStartPressed() {
  // Buttons always work via serial commands for now
  // In real mode, could also check physical buttons here
  bool pressed = simButtonStart;
  simButtonStart = false;  // Consume the press
  return pressed;
}

bool InputSystem::isResetPressed() {
  // Buttons always work via serial commands for now
  // In real mode, could also check physical buttons here
  bool pressed = simButtonReset;
  simButtonReset = false;  // Consume the press
  return pressed;
}

void InputSystem::clearButtons() {
  simButtonStart = false;
  simButtonReset = false;
}

bool InputSystem::isFrascoVacio() const {
  // For now, always use simulation values
  // In real mode with sensors, would check actual sensor here
  return simFrascoVacio;
}

bool InputSystem::isPastillasCargadas() const {
  // For now, always use simulation values
  // In real mode with sensors, would check actual sensor here
  return simPastillasCargadas;
}

// =====================================================
// PROXIMITY SENSOR IMPLEMENTATION
// =====================================================

bool ProximitySensor::init() {
  available = false;
  
  // Initialize with timeout to avoid blocking
  if (!APDS.begin()) {
    Serial.println(F("PROX:FAIL"));
    return false;
  }
  
  available = true;
  Serial.println(F("PROX:OK"));
  return true;
}

uint16_t ProximitySensor::read() {
  if (!available) return 0;
  
  // Rate limit reads to prevent overwhelming the sensor
  static unsigned long lastReadTime = 0;
  unsigned long now = millis();
  
  // Only read from sensor every 100ms minimum
  if (now - lastReadTime < 100) {
    return lastProximity; // Return cached value
  }
  
  // Check if proximity data is available
  if (APDS.proximityAvailable()) {
    lastReadTime = now;
    int rawValue = APDS.readProximity();
    // Arduino APDS9960 returns 0-255 where 0=far, 255=close
    rawValue = constrain(rawValue, 0, 255);
    
    // Only update if there's a significant change
    if (abs(rawValue - lastRawValue) >= CHANGE_THRESHOLD) {
      lastRawValue = rawValue;
      // Scale to 0-1024 range
      lastProximity = map(rawValue, 0, 255, 0, 1024);
    }
  }
  
  return lastProximity;
}

bool ProximitySensor::hasSignificantChange() {
  if (!available) return false;
  
  uint8_t currentRaw = lastRawValue;
  read(); // Update reading
  
  // Return true if value changed significantly
  return (abs(lastRawValue - currentRaw) >= CHANGE_THRESHOLD);
}

// =====================================================
// GLOBAL MODE CONTROL
// =====================================================

void setGlobalMode(ControlMode mode) {
  globalMode = mode;
  elevator.setMode(mode);
  loadCell.setMode(mode);
  inputs.setMode(mode);
  
  Serial.print("MODO:");
  Serial.println(mode == MODE_REAL ? "REAL" : "SIMULACION");
}