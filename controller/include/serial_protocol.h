#ifndef SERIAL_PROTOCOL_H
#define SERIAL_PROTOCOL_H

#include <Arduino.h>

class SerialProtocol {
public:
  // Send state change message
  static void sendState(const char* state);
  
  // Send pill count
  static void sendPillCount(int count, int target);
  
  // Send weight reading
  static void sendWeight(float weight);
  
  // Send elevator position
  static void sendElevatorPosition(bool isUp);
  
  // Send sensor status (simulation mode)
  static void sendSimSensor(const char* sensor, bool state);
  
  // Send sensor status (real mode)
  static void sendSensor(const char* sensor, bool state);
  
  // Send progress indicator
  static void sendProgress(const char* state, unsigned long duration);
  
  // Send heartbeat
  static void sendHeartbeat(const char* state, unsigned long timestamp);
  
  // Send error message
  static void sendError(const char* error);
  
  // Send button confirmation
  static void sendButton(const char* button, const char* action);
  
  // Send action message
  static void sendAction(const char* action);
  
  // Send info message
  static void sendInfo(const char* info);
};

#endif