#include "serial_protocol.h"
#include "hardware.h"
#include "manual_mode.h"

void SerialProtocol::sendState(const char* state) {
  Serial.print(F("STATE:"));
  Serial.println(state);
  // Removed Serial.flush() - blocking operation
}

void SerialProtocol::sendPillCount(int count, int target) {
  Serial.print(F("PILLS:"));
  Serial.print(count);
  Serial.print(F("/"));
  Serial.println(target);
  // Removed Serial.flush() - blocking operation
}

void SerialProtocol::sendWeight(float weight) {
  Serial.print(F("WEIGHT:"));
  Serial.println(weight, 2);
  // Removed Serial.flush() - blocking operation
}

void SerialProtocol::sendElevatorPosition(bool isUp) {
  Serial.print(F("ELEVATOR:"));
  Serial.println(isUp ? F("UP") : F("DOWN"));
  // Removed Serial.flush() - blocking operation
}

void SerialProtocol::sendSimSensor(const char* sensor, bool state) {
  Serial.print(F("SIM:"));
  Serial.print(sensor);
  Serial.print(F(":"));
  Serial.println(state ? F("ON") : F("OFF"));
  // Removed Serial.flush() - blocking operation
}

void SerialProtocol::sendSensor(const char* sensor, bool state) {
  Serial.print(F("SENSORS:"));
  Serial.print(sensor);
  Serial.print(F(":"));
  Serial.println(state ? F("1") : F("0"));
  // Removed Serial.flush() - blocking operation
}

void SerialProtocol::sendProgress(const char* state, unsigned long duration) {
  Serial.print(F("PROGRESS:"));
  Serial.print(state);
  Serial.print(F(","));
  Serial.println(duration);
  // Removed Serial.flush() - blocking operation
}

void SerialProtocol::sendHeartbeat(const char* state, unsigned long timestamp) {
  Serial.print(F("HB:"));
  Serial.print(state);
  Serial.print(F(","));
  Serial.print(timestamp);
  Serial.print(F(",R:"));
  Serial.println(ManualMode::hasPhysicalRestrictions() ? F("ON") : F("OFF"));
  // Removed Serial.flush() - blocking operation
}

void SerialProtocol::sendError(const char* error) {
  Serial.print(F("ERROR:"));
  Serial.println(error);
  // Removed Serial.flush() - blocking operation
}

void SerialProtocol::sendButton(const char* button, const char* action) {
  Serial.print(F("BTN:"));
  Serial.print(button);
  Serial.print(F(":"));
  Serial.println(action);
  // Removed Serial.flush() - blocking operation
}

void SerialProtocol::sendAction(const char* action) {
  Serial.print(F("ACTION:"));
  Serial.println(action);
  // Removed Serial.flush() - blocking operation
}

void SerialProtocol::sendInfo(const char* info) {
  Serial.println(info);
  // Removed Serial.flush() - blocking operation
}

void SerialProtocol::sendTestHeartbeat() {
  Serial.print(F("HB:TEST,"));
  
  // Elevator status
  Serial.print(F("E:"));
  if (elevator.isMoving()) {
    Serial.print(F("MOV"));
  } else if (elevator.isAtTop()) {
    Serial.print(F("UP"));
  } else if (elevator.isAtBottom()) {
    Serial.print(F("DOWN"));
  } else {
    Serial.print(F("MID"));
  }
  
  // Dosing status
  Serial.print(F(",D:"));
  Serial.print(dosingWheel.isDispensing() ? F("ACT") : F("IDLE"));
  
  // Grinder status
  Serial.print(F(",G:"));
  Serial.print(grinder.isRunning() ? F("ON") : F("OFF"));
  
  // Transfer solenoid
  Serial.print(F(",T:"));
  Serial.print(transferSolenoid.isActive() ? F("OPEN") : F("CLOSED"));
  
  // Cap solenoid
  Serial.print(F(",C:"));
  Serial.print(capSolenoid.isActive() ? F("PUSH") : F("RET"));
  
  // Weight
  Serial.print(F(",W:"));
  Serial.print(loadCell.readWeight(), 1);
  
  // Timestamp
  Serial.print(F(",MS:"));
  Serial.println(millis());
  
  // Removed Serial.flush() - blocking operation
}