#ifndef HARDWARE_H
#define HARDWARE_H

#include <Arduino.h>
#include <AccelStepper.h>
#include <HX711.h>
#include <Adafruit_VL53L0X.h>
#include "config.h"

// =====================================================
// HARDWARE CONTROL MODES
// =====================================================

enum ControlMode {
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
};

// =====================================================
// DOSING WHEEL MODULE
// =====================================================

class DosingWheel {
public:  // Make motor and flag public for test mode access
  AccelStepper motor;
  bool dosingInProgress;
  bool continuousMode;  // For manual mode continuous movement
  bool currentDirection;  // true = forward, false = backward

public:
  DosingWheel();
  void init();
  void dispenseOne();
  void stop();
  void run();  // Call in loop
  bool isDispensing() const { return dosingInProgress; }
  bool isContinuousMode() const { return continuousMode; }
  bool getDirection() const { return currentDirection; }  // true = forward, false = backward
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
  float weightDeadband;  // Noise filter - ignore changes smaller than this
  unsigned long weightStableTime;

  // Weight stabilization - reduced buffer for faster response
  static const uint8_t WEIGHT_BUFFER_SIZE = 5;
  float weightBuffer[WEIGHT_BUFFER_SIZE];
  uint8_t weightBufferIndex;
  bool bufferFilled;
  unsigned long lastWeightRead;
  float stableWeight;
  unsigned long stableStartTime;

  // Tare operation state machine - non-blocking
  bool tareInProgress;
  unsigned long tareStartTime;
  static const unsigned long TARE_TIMEOUT = 2000;  // 2 second timeout for tare

public:
  LoadCell();
  void init();
  float readWeight();
  bool isWeightStable();
  void tare();  // Start non-blocking tare
  void run();   // Call in main loop to process tare
  void calibrate(float knownWeight);

  void setMode(ControlMode m) { mode = m; }
  void setThreshold(float t) { weightThreshold = t; }
  void setCalibrationFactor(float factor);
  float getCalibrationFactor() const { return calibrationFactor; }
  void setDeadband(float deadband);
  float getDeadband() const { return weightDeadband; }
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
  Adafruit_VL53L0X lox;
  uint16_t lastDistance;   // Distance in mm
  bool available;
  static const uint8_t CHANGE_THRESHOLD = 5;  // Only report if distance changes by 5+ mm

  // Moving average filter for stability
  static const uint8_t FILTER_SIZE = 10;
  uint16_t filterBuffer[FILTER_SIZE];
  uint8_t filterIndex;
  bool filterInitialized;

public:
  ProximitySensor() : lastDistance(0), available(false), filterIndex(0), filterInitialized(false) {
    memset(filterBuffer, 0, sizeof(filterBuffer));
  }
  bool init();
  uint16_t read();  // Returns distance in mm
  bool hasSignificantChange();
  bool isAvailable() const { return available; }
  uint16_t getLastDistance() const { return lastDistance; }
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

  // Virtual button and sensor states (set via serial commands)
  bool virtualButtonStart;
  bool virtualButtonReset;
  bool virtualFrascoVacio;
  bool virtualPastillasCargadas;

public:
  InputSystem() : mode(MODE_REAL) {
    virtualButtonStart = false;
    virtualButtonReset = false;
    virtualFrascoVacio = true;
    virtualPastillasCargadas = true;
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

  // Virtual controls (for serial command interface)
  void simulateStart(bool pressed) { virtualButtonStart = pressed; }
  void simulateReset(bool pressed) { virtualButtonReset = pressed; }
  void simulateFrasco(bool empty) { virtualFrascoVacio = empty; }
  void simulatePastillas(bool loaded) { virtualPastillasCargadas = loaded; }
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