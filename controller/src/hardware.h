#ifndef HARDWARE_H
#define HARDWARE_H

#include <Arduino.h>
#include <AccelStepper.h>
#include <HX711.h>
// Removed APDS9960 - using HC-SR04 instead
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
  void updatePosition(); // Update position from proximity sensor

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
  bool isContinuousMode() const { return continuousMode; }
  bool getDirection() { return motor.speed() > 0; }  // true = forward, false = backward (non-const because speed() is non-const)
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

  // Weight stabilization - reduced buffer for faster response
  static const uint8_t WEIGHT_BUFFER_SIZE = 5;
  float weightBuffer[WEIGHT_BUFFER_SIZE];
  uint8_t weightBufferIndex;
  bool bufferFilled;
  unsigned long lastWeightRead;
  float stableWeight;
  unsigned long stableStartTime;

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
  unsigned long startTime;  // Track when grinder started

public:
  void init();
  void start();
  void stop();
  void run();  // Check for timeout
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
  unsigned long activationTime;  // Track when solenoid was activated

public:
  Solenoid(uint8_t p, const char* n) : pin(p), name(n), active(false), activationTime(0) {}
  void init();
  void activate();
  void deactivate();
  void run();  // Check for timeout
  bool isActive() const { return active; }
};

// =====================================================
// PROXIMITY SENSOR MODULE
// =====================================================

class ProximitySensor {
private:
  uint16_t lastProximity;  // Distance in scaled format 0-1024
  uint16_t lastRawValue;    // Distance in mm (0-4000 for 0-400cm range)
  bool available;
  static const uint8_t CHANGE_THRESHOLD = 5;  // Only report if value changes by 5+

  // Moving average filter for stability
  static const uint8_t FILTER_SIZE = 10;
  uint16_t filterBuffer[FILTER_SIZE];  // Store in mm
  uint8_t filterIndex;
  bool filterInitialized;

public:
  ProximitySensor() : lastProximity(0), lastRawValue(0), available(false), filterIndex(0), filterInitialized(false) {
    memset(filterBuffer, 0, sizeof(filterBuffer));
  }
  bool init();
  uint16_t read();  // Returns distance scaled 0-1024 (inverted: close=high, far=low)
  bool hasSignificantChange();
  bool isAvailable() const { return available; }
  uint16_t getLastRawValue() const { return lastRawValue; }  // Returns mm

private:
  long readDistanceMm();  // Raw HC-SR04 reading in mm
};

// =====================================================
// OLED DISPLAY MODULE
// =====================================================

class OLEDDisplay {
private:
  bool initialized;
  unsigned long lastUpdate;
  static const unsigned long UPDATE_INTERVAL = 100; // Update every 100ms

public:
  OLEDDisplay() : initialized(false), lastUpdate(0) {}
  bool init();
  void update();

  // Display screens
  void showStartup();
  void showState(const char* stateName, int pillCount, int totalPills);
  void showManualMode();
  void showError(const char* error);
  void showWeight(float weight);
  void showProximity(uint16_t value, bool atTop, bool atBottom);

  // Helper methods
  void clear();
  void drawProgressBar(int x, int y, int width, int height, int percent);

  bool isInitialized() const { return initialized; }
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
  
  void init();  // Initialize pins
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
extern OLEDDisplay oledDisplay;

// Global control mode
extern ControlMode globalMode;
void setGlobalMode(ControlMode mode);

#endif // HARDWARE_H