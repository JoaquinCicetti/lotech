#ifndef HARDWARE_H
#define HARDWARE_H

#include <Arduino.h>
#include <AccelStepper.h>
#include <HX711.h>
#include <Arduino_APDS9960.h>
#include "config.h"

// =====================================================
// HARDWARE CONTROL MODES
// =====================================================

enum ControlMode {
  MODE_SIMULATION,
  MODE_REAL,
  MODE_TEST  // Test mode for manual hardware control
};

// =====================================================
// ELEVATOR MODULE
// =====================================================

class Elevator {
public:  // Make motor and flags public for test mode
  AccelStepper motor;
  bool movingUp;
  bool movingDown;
  bool atTop;
  bool atBottom;
  ControlMode mode;
  unsigned long moveStartTime;
  
public:
  Elevator();
  void init();
  void moveUp();
  void moveDown();
  void stop();
  void run();  // Call in loop
  
  bool isAtTop() const;
  bool isAtBottom() const;
  bool isMoving() const { return movingUp || movingDown; }
  
  void setMode(ControlMode m) { mode = m; }
  void simulatePosition(bool top, bool bottom);
};

// =====================================================
// DOSING WHEEL MODULE
// =====================================================

class DosingWheel {
public:  // Make motor and flag public for test mode access
  AccelStepper motor;
  bool dosingInProgress;
  bool continuousMode;  // For manual mode continuous movement

public:
  DosingWheel();
  void init();
  void dispenseOne();
  void stop();
  void run();  // Call in loop
  bool isDispensing() const { return dosingInProgress; }
  void updateStepsPerDivision();  // Recalculate steps based on wheel_divisions

  // Manual mode continuous control
  void startContinuous(bool forward);
  void stopContinuous();
};

// =====================================================
// LOAD CELL MODULE
// =====================================================

class LoadCell {
public:  // Make public for debugging
  ControlMode mode;
  bool isReady;
private:
  HX711 scale;
  float currentWeight;
  float lastStableWeight;
  float calibrationFactor;
  float weightThreshold;
  unsigned long weightStableTime;
  
  // Simulation variables
  bool simWeightStable;
  
public:
  LoadCell();
  void init();
  float readWeight();
  bool isWeightStable();
  void tare();
  void calibrate(float knownWeight);
  
  void setMode(ControlMode m) { mode = m; }
  void setThreshold(float t) { weightThreshold = t; }
  void simulateWeight(bool stable) { simWeightStable = stable; }
  bool isConnected() const { return isReady; }
};

// =====================================================
// GRINDER MODULE
// =====================================================

class Grinder {
private:
  bool running;
  
public:
  void init();
  void start();
  void stop();
  bool isRunning() const { return running; }
};

// =====================================================
// SOLENOID MODULE
// =====================================================

class Solenoid {
private:
  uint8_t pin;
  const char* name;
  bool active;
  
public:
  Solenoid(uint8_t p, const char* n) : pin(p), name(n), active(false) {}
  void init();
  void activate();
  void deactivate();
  bool isActive() const { return active; }
};

// =====================================================
// PROXIMITY SENSOR MODULE
// =====================================================

class ProximitySensor {
private:
  uint16_t lastProximity;  // Scaled value 0-1024
  uint8_t lastRawValue;     // Raw sensor value 0-255
  bool available;
  static const uint8_t CHANGE_THRESHOLD = 5;  // Only report if raw value changes by 5+
  
public:
  ProximitySensor() : lastProximity(0), lastRawValue(0), available(false) {}
  bool init();
  uint16_t read();  // Returns scaled 0-1024
  bool hasSignificantChange();
  bool isAvailable() const { return available; }
  uint8_t getLastRawValue() const { return lastRawValue; }
};

// =====================================================
// INPUT MODULE (Buttons and Sensors)
// =====================================================

class InputSystem {
private:
  ControlMode mode;
  
  // Simulation flags
  bool simButtonStart;
  bool simButtonReset;
  bool simFrascoVacio;
  bool simPastillasCargadas;
  
public:
  InputSystem() : mode(MODE_SIMULATION) {
    simButtonStart = false;
    simButtonReset = false;
    simFrascoVacio = true;
    simPastillasCargadas = true;
  }
  
  void setMode(ControlMode m) { mode = m; }
  
  // Button functions
  bool isStartPressed();
  bool isResetPressed();
  void clearButtons();
  
  // Condition functions
  bool isFrascoVacio() const;
  bool isPastillasCargadas() const;
  
  // Simulation controls
  void simulateStart(bool pressed) { simButtonStart = pressed; }
  void simulateReset(bool pressed) { simButtonReset = pressed; }
  void simulateFrasco(bool empty) { simFrascoVacio = empty; }
  void simulatePastillas(bool loaded) { simPastillasCargadas = loaded; }
};

// =====================================================
// GLOBAL HARDWARE INSTANCES
// =====================================================

extern Elevator elevator;
extern DosingWheel dosingWheel;
extern LoadCell loadCell;
extern Grinder grinder;
extern Solenoid transferSolenoid;
extern Solenoid capSolenoid;
extern InputSystem inputs;
extern ProximitySensor proxSensor;

// Global control mode
extern ControlMode globalMode;
void setGlobalMode(ControlMode mode);

#endif // HARDWARE_H