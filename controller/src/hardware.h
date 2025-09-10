#ifndef HARDWARE_H
#define HARDWARE_H

#include <Arduino.h>
#include <AccelStepper.h>
#include <HX711.h>
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
private:
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
private:
  AccelStepper motor;
  bool dosingInProgress;
  
public:
  DosingWheel();
  void init();
  void dispenseOne();
  void stop();
  void run();  // Call in loop
  bool isDispensing() const { return dosingInProgress; }
  void updateStepsPerDivision();  // Recalculate steps based on wheel_divisions
};

// =====================================================
// LOAD CELL MODULE
// =====================================================

class LoadCell {
private:
  HX711 scale;
  float currentWeight;
  float lastStableWeight;
  float calibrationFactor;
  float weightThreshold;
  unsigned long weightStableTime;
  ControlMode mode;
  bool isReady;
  
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

// Global control mode
extern ControlMode globalMode;
void setGlobalMode(ControlMode mode);

#endif // HARDWARE_H