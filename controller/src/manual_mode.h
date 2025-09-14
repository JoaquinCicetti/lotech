#ifndef MANUAL_MODE_H
#define MANUAL_MODE_H

#include <Arduino.h>

// Operating modes
enum OperatingMode {
  MODE_MANUAL,
  MODE_AUTO
};

// Manual mode controller
class ManualMode {
private:
  static bool active;
  static bool physicalRestrictions;  // If true, respect sensor limits. If false, bypass safety
  static OperatingMode currentMode;

public:
  static void init();
  static void setMode(OperatingMode mode);
  static OperatingMode getMode() { return currentMode; }
  static bool isManual() { return currentMode == MODE_MANUAL; }
  static bool isAuto() { return currentMode == MODE_AUTO; }

  // Physical restrictions control
  static void setPhysicalRestrictions(bool enabled);
  static bool hasPhysicalRestrictions() { return physicalRestrictions; }

  // Process manual commands
  static void processCommand(const char* command);

  // Motor control commands (direct control in manual mode)
  static void controlDosingMotor(const char* direction);
  static void controlElevatorMotor(const char* direction);
  static void controlGrinderMotor(const char* state);
  static void controlTransferSolenoid(const char* state);
  static void controlCapSolenoid(const char* state);

  // Safety checks (can be bypassed if physicalRestrictions = false)
  static bool canMoveElevatorUp();
  static bool canMoveElevatorDown();
};

#endif // MANUAL_MODE_H