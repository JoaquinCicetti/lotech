#ifndef COMMANDS_H
#define COMMANDS_H

#include <Arduino.h>

class CommandProcessor {
private:
  String inputBuffer;
  
public:
  CommandProcessor() : inputBuffer("") {}
  
  void processSerialInput();
  void processCommand(String command);
  void printHelp();
  void printStatus();
};

extern CommandProcessor commands;

#endif // COMMANDS_H