#include "serial_protocol.h"
#include "hardware.h"

void SerialProtocol::sendState(const char* state) {
  Serial.print(F("ESTADO:"));
  Serial.println(state);
  Serial.flush();
}

void SerialProtocol::sendPillCount(int count, int target) {
  Serial.print(F("PASTILLAS:"));
  Serial.print(count);
  Serial.print(F("/"));
  Serial.println(target);
  Serial.flush();
}

void SerialProtocol::sendWeight(float weight) {
  Serial.print(F("PESO:"));
  Serial.println(weight, 2);
  Serial.flush();
}

void SerialProtocol::sendElevatorPosition(bool isUp) {
  Serial.print(F("ELEVADOR:"));
  Serial.println(isUp ? F("ARRIBA") : F("ABAJO"));
  Serial.flush();
}

void SerialProtocol::sendSimSensor(const char* sensor, bool state) {
  Serial.print(F("SIM:"));
  Serial.print(sensor);
  Serial.print(F(":"));
  Serial.println(state ? F("ON") : F("OFF"));
  Serial.flush();
}

void SerialProtocol::sendSensor(const char* sensor, bool state) {
  Serial.print(F("SENSORES:"));
  Serial.print(sensor);
  Serial.print(F(":"));
  Serial.println(state ? F("1") : F("0"));
  Serial.flush();
}

void SerialProtocol::sendProgress(const char* state, unsigned long duration) {
  Serial.print(F("PROGRESO:"));
  Serial.print(state);
  Serial.print(F(","));
  Serial.println(duration);
  Serial.flush();
}

void SerialProtocol::sendHeartbeat(const char* state, unsigned long timestamp) {
  Serial.print(F("HB:"));
  Serial.print(state);
  Serial.print(F(","));
  Serial.println(timestamp);
  Serial.flush();
}

void SerialProtocol::sendError(const char* error) {
  Serial.print(F("ERROR:"));
  Serial.println(error);
  Serial.flush();
}

void SerialProtocol::sendButton(const char* button, const char* action) {
  Serial.print(F("BTN:"));
  Serial.print(button);
  Serial.print(F(":"));
  Serial.println(action);
  Serial.flush();
}

void SerialProtocol::sendAction(const char* action) {
  Serial.print(F("ACCION:"));
  Serial.println(action);
  Serial.flush();
}

void SerialProtocol::sendInfo(const char* info) {
  Serial.println(info);
  Serial.flush();
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
  
  Serial.flush();
}