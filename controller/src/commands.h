#ifndef COMMANDS_H
#define COMMANDS_H

#include <Arduino.h>

class CommandProcessor {
private:
  static const int BUFFER_SIZE = 64;
  char inputBuffer[BUFFER_SIZE];
  int bufferIndex;

  // Helper functions for parsing settings
  void parseDelaySettings(const char* params);
  void parseDosingSettings(const char* params);
  void parseProximitySettings(const char* params);

  // Helper functions for sending status
  void sendStatus();
  void sendDelays();
  void sendDosing();

public:
  CommandProcessor() : bufferIndex(0) {
    inputBuffer[0] = '\0';
  }

  void processSerialInput();
  void processCommand(const char* command);
};

extern CommandProcessor commands;

#endif // COMMANDS_H