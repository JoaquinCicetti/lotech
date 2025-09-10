#ifndef TEST_MODE_H
#define TEST_MODE_H

#include <Arduino.h>

class TestMode {
public:
  static void init();
  static void processCommand(const String& command);
  static bool isActive();
  static void setActive(bool active);
  
private:
  static bool testModeActive;
  
  // Manual control functions
  static void elevatorUp();
  static void elevatorDown();
  static void elevatorStop();
  
  static void dosingWheelStep();
  static void dosingWheelStop();
  
  static void grinderOn();
  static void grinderOff();
  
  static void transferSolenoidOn();
  static void transferSolenoidOff();
  
  static void capSolenoidOn();
  static void capSolenoidOff();
  
  static void readWeight();
  static void getStatus();
};

#endif