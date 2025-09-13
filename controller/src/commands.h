#ifndef COMMANDS_H
#define COMMANDS_H

#include <Arduino.h>

class CommandProcessor {
private:
  static const int BUFFER_SIZE = 64;
  char inputBuffer[BUFFER_SIZE];
  int bufferIndex;
  
public:
  CommandProcessor() : bufferIndex(0) { 
    inputBuffer[0] = '\0'; 
  }
  
  void processSerialInput();
  void processCommand(const char* command);
  void printHelp();
  void printStatus();
};

extern CommandProcessor commands;

#endif // COMMANDS_H