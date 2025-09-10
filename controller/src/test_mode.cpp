#include "test_mode.h"
#include "hardware.h"
#include "serial_protocol.h"

bool TestMode::testModeActive = false;

extern Elevator elevator;
extern DosingWheel dosingWheel;
extern LoadCell loadCell;
extern Grinder grinder;
extern Solenoid transferSolenoid;
extern Solenoid capSolenoid;

void TestMode::init() {
  testModeActive = false;
}

bool TestMode::isActive() {
  return testModeActive;
}

void TestMode::setActive(bool active) {
  testModeActive = active;
  if (active) {
    setGlobalMode(MODE_TEST);
    Serial.println(F("TEST_MODE:ENABLED"));
    Serial.println(F("Test mode enabled - Manual control active"));
    Serial.println(F("Available test commands:"));
    Serial.println(F("  ELEVATOR_UP    - Move elevator up"));
    Serial.println(F("  ELEVATOR_DOWN  - Move elevator down"));
    Serial.println(F("  ELEVATOR_STOP  - Stop elevator"));
    Serial.println(F("  DOSING_STEP    - Dispense one pill"));
    Serial.println(F("  DOSING_STOP    - Stop dosing wheel"));
    Serial.println(F("  GRINDER_ON     - Turn grinder on"));
    Serial.println(F("  GRINDER_OFF    - Turn grinder off"));
    Serial.println(F("  TRANSFER_ON    - Open transfer solenoid"));
    Serial.println(F("  TRANSFER_OFF   - Close transfer solenoid"));
    Serial.println(F("  CAP_ON         - Push cap solenoid"));
    Serial.println(F("  CAP_OFF        - Retract cap solenoid"));
    Serial.println(F("  WEIGHT         - Read current weight"));
    Serial.println(F("  TEST_STATUS    - Get all hardware status"));
    Serial.println(F("  EXIT_TEST      - Exit test mode"));
  } else {
    setGlobalMode(MODE_SIMULATION);
    Serial.println(F("TEST_MODE:DISABLED"));
    Serial.println(F("Test mode disabled - Returning to normal mode"));
  }
}

void TestMode::processCommand(const String& command) {
  if (!testModeActive) {
    Serial.println(F("ERROR: Test mode not active"));
    return;
  }
  
  String cmd = command;
  cmd.toUpperCase();
  
  if (cmd == "ELEVATOR_UP") {
    elevatorUp();
  } else if (cmd == "ELEVATOR_DOWN") {
    elevatorDown();
  } else if (cmd == "ELEVATOR_STOP") {
    elevatorStop();
  } else if (cmd == "DOSING_STEP") {
    dosingWheelStep();
  } else if (cmd == "DOSING_STOP") {
    dosingWheelStop();
  } else if (cmd == "GRINDER_ON") {
    grinderOn();
  } else if (cmd == "GRINDER_OFF") {
    grinderOff();
  } else if (cmd == "TRANSFER_ON") {
    transferSolenoidOn();
  } else if (cmd == "TRANSFER_OFF") {
    transferSolenoidOff();
  } else if (cmd == "CAP_ON") {
    capSolenoidOn();
  } else if (cmd == "CAP_OFF") {
    capSolenoidOff();
  } else if (cmd == "WEIGHT") {
    readWeight();
  } else if (cmd == "TEST_STATUS") {
    getStatus();
  } else if (cmd == "EXIT_TEST") {
    setActive(false);
  } else {
    Serial.print(F("ERROR: Unknown test command: "));
    Serial.println(cmd);
  }
}

void TestMode::elevatorUp() {
  elevator.moveUp();
  Serial.println(F("TEST:ELEVATOR:MOVING_UP"));
}

void TestMode::elevatorDown() {
  elevator.moveDown();
  Serial.println(F("TEST:ELEVATOR:MOVING_DOWN"));
}

void TestMode::elevatorStop() {
  elevator.stop();
  Serial.println(F("TEST:ELEVATOR:IDLE"));
}

void TestMode::dosingWheelStep() {
  if (!dosingWheel.isDispensing()) {
    dosingWheel.dispenseOne();
    Serial.println(F("TEST:DOSING:STEP"));
  } else {
    Serial.println(F("TEST:DOSING:BUSY"));
  }
}

void TestMode::dosingWheelStop() {
  dosingWheel.stop();
  Serial.println(F("TEST:DOSING:STOP"));
}

void TestMode::grinderOn() {
  grinder.start();
  Serial.println(F("TEST:GRINDER:ON"));
}

void TestMode::grinderOff() {
  grinder.stop();
  Serial.println(F("TEST:GRINDER:OFF"));
}

void TestMode::transferSolenoidOn() {
  transferSolenoid.activate();
  Serial.println(F("TEST:TRANSFER:ON"));
}

void TestMode::transferSolenoidOff() {
  transferSolenoid.deactivate();
  Serial.println(F("TEST:TRANSFER:OFF"));
}

void TestMode::capSolenoidOn() {
  capSolenoid.activate();
  Serial.println(F("TEST:CAP:ON"));
}

void TestMode::capSolenoidOff() {
  capSolenoid.deactivate();
  Serial.println(F("TEST:CAP:OFF"));
}

void TestMode::readWeight() {
  float weight = loadCell.readWeight();
  Serial.print(F("TEST:WEIGHT:"));
  Serial.println(weight);
}

void TestMode::getStatus() {
  Serial.println(F("TEST:STATUS:START"));
  
  // Elevator status
  Serial.print(F("  Elevator: "));
  if (elevator.isMoving()) {
    Serial.println(F("MOVING"));
  } else if (elevator.isAtTop()) {
    Serial.println(F("TOP"));
  } else if (elevator.isAtBottom()) {
    Serial.println(F("BOTTOM"));
  } else {
    Serial.println(F("MIDDLE"));
  }
  
  // Dosing wheel status
  Serial.print(F("  Dosing: "));
  Serial.println(dosingWheel.isDispensing() ? F("ACTIVE") : F("IDLE"));
  
  // Grinder status
  Serial.print(F("  Grinder: "));
  Serial.println(grinder.isRunning() ? F("ON") : F("OFF"));
  
  // Transfer solenoid status
  Serial.print(F("  Transfer: "));
  Serial.println(transferSolenoid.isActive() ? F("OPEN") : F("CLOSED"));
  
  // Cap solenoid status
  Serial.print(F("  Cap: "));
  Serial.println(capSolenoid.isActive() ? F("PUSHED") : F("RETRACTED"));
  
  // Weight
  Serial.print(F("  Weight: "));
  Serial.print(loadCell.readWeight());
  Serial.println(F(" mg"));
  
  Serial.println(F("TEST:STATUS:END"));
}