#include "hardware.h"
#include "state_machine.h"  // For global delay variables

// Global instances
Elevator elevator;
DosingWheel dosingWheel;
LoadCell loadCell;
Grinder grinder;
Solenoid transferSolenoid(SOLENOID1_PIN);
Solenoid capSolenoid(SOLENOID2_PIN);
InputSystem inputs;
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
  moveStartTime = millis();
  Serial.println("ACCION:SUBIR_ELEVADOR");
}

void Elevator::moveDown() {
  movingUp = false;
  movingDown = true;
  motor.setSpeed(-ELEVATOR_SPEED);
  moveStartTime = millis();
  Serial.println("ACCION:BAJAR_ELEVADOR");
}

void Elevator::stop() {
  movingUp = false;
  movingDown = false;
  motor.setSpeed(0);
  Serial.println("ACCION:DETENER_ELEVADOR");
}

void Elevator::run() {
  if (mode == MODE_REAL) {
    // Real mode: check actual sensors
    if (movingUp) {
      motor.runSpeed();
      // Check real sensor or timeout
      if (digitalRead(SENSOR_POS_ALTA_PIN) == HIGH || 
          (millis() - moveStartTime > T_ELEV_UP)) {
        atTop = true;
        atBottom = false;
        stop();
      }
    } else if (movingDown) {
      motor.runSpeed();
      // Check real sensor or timeout
      if (digitalRead(SENSOR_POS_BAJA_PIN) == HIGH || 
          (millis() - moveStartTime > T_ELEV_DOWN)) {
        atTop = false;
        atBottom = true;
        stop();
      }
    }
  } else {
    // Simulation mode: use timers only
    if (movingUp) {
      motor.runSpeed();
      if (millis() - moveStartTime > T_ELEV_UP) {
        atTop = true;
        atBottom = false;
        stop();
        Serial.println("ESTADO:ELEVADOR_ARRIBA");
      }
    } else if (movingDown) {
      motor.runSpeed();
      if (millis() - moveStartTime > T_ELEV_DOWN) {
        atTop = false;
        atBottom = true;
        stop();
        Serial.println("ESTADO:ELEVADOR_ABAJO");
      }
    }
  }
}

bool Elevator::isAtTop() const {
  if (mode == MODE_REAL) {
    return digitalRead(SENSOR_POS_ALTA_PIN) == HIGH;
  }
  return atTop;
}

bool Elevator::isAtBottom() const {
  if (mode == MODE_REAL) {
    return digitalRead(SENSOR_POS_BAJA_PIN) == HIGH;
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
  stepsPerPosition = (STEPS_PER_REVOLUTION * MICROSTEPS) / 21;  // 21 positions
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
  motor.move(stepsPerPosition);
  dosingInProgress = true;
  Serial.println("ACCION:DOSIFICAR_PASO");
}

void DosingWheel::run() {
  motor.run();
  if (motor.distanceToGo() == 0) {
    dosingInProgress = false;
  }
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
  Serial.println("ACCION:ENCENDER_MOLINILLO");
}

void Grinder::stop() {
  digitalWrite(MOTOR3_RELAY_PIN, LOW);
  running = false;
  Serial.println("ACCION:APAGAR_MOLINILLO");
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
  Serial.print("ACCION:ENCENDER_SOLENOIDE_");
  Serial.println(pin);
}

void Solenoid::deactivate() {
  digitalWrite(pin, LOW);
  active = false;
  Serial.print("ACCION:APAGAR_SOLENOIDE_");
  Serial.println(pin);
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