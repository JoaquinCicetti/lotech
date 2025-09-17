#ifndef STATE_PERSISTENCE_H
#define STATE_PERSISTENCE_H

#include <Arduino.h>
#include <EEPROM.h>

// EEPROM addresses
#define EEPROM_MAGIC_ADDR 0          // Magic number to verify valid data
#define EEPROM_STATE_ADDR 2          // Current state
#define EEPROM_PILL_COUNT_ADDR 3     // Pill counter
#define EEPROM_LOT_SIZE_ADDR 5       // Lot size
#define EEPROM_CHECKSUM_ADDR 7       // Simple checksum

#define EEPROM_MAGIC_VALUE 0xAB55    // Magic value to verify EEPROM has been initialized

class StatePersistence {
public:
  struct StateData {
    uint8_t currentState;
    uint16_t pillCount;
    uint16_t lotSize;
  };

  static void init();
  static void saveState(uint8_t state, uint16_t pillCount, uint16_t lotSize);
  static bool loadState(StateData& data);
  static void clearState();

private:
  static uint8_t calculateChecksum(const StateData& data);
};

#endif