#ifndef STATE_PERSISTENCE_H
#define STATE_PERSISTENCE_H

#include <Arduino.h>
#include <EEPROM.h>

// EEPROM addresses for state
#define EEPROM_MAGIC_ADDR 0          // Magic number to verify valid data (2 bytes)
#define EEPROM_STATE_ADDR 2          // Current state (1 byte)
#define EEPROM_PILL_COUNT_ADDR 3     // Pill counter (2 bytes)
#define EEPROM_LOT_SIZE_ADDR 5       // Lot size (2 bytes)
#define EEPROM_CHECKSUM_ADDR 7       // Simple checksum (1 byte)

// EEPROM addresses for settings (starting at address 10)
#define EEPROM_SETTINGS_START 10
#define EEPROM_WHEEL_DIVISIONS_ADDR 10  // Wheel divisions (1 byte)
#define EEPROM_DOSING_SPEED_ADDR 11     // Dosing motor speed (2 bytes)
#define EEPROM_T_SETTLE_ADDR 13         // Settle time (2 bytes)
#define EEPROM_T_WEIGHT_ADDR 15         // Weight time (2 bytes)
#define EEPROM_T_TRANSFER_ADDR 17       // Transfer time (2 bytes)
#define EEPROM_T_GRIND_ADDR 19          // Grind time (2 bytes)
#define EEPROM_T_CAP_ADDR 21            // Cap time (2 bytes)
#define EEPROM_T_ELEV_UP_ADDR 23        // Elevator up time (2 bytes)
#define EEPROM_T_ELEV_DOWN_ADDR 25      // Elevator down time (2 bytes)
#define EEPROM_PROX_MIN_ADDR 27         // Proximity min (2 bytes)
#define EEPROM_PROX_MAX_ADDR 29         // Proximity max (2 bytes)
#define EEPROM_ELEVATOR_SPEED_ADDR 31   // Elevator speed (2 bytes)
#define EEPROM_SETTINGS_CHECKSUM 33     // Settings checksum (1 byte)

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

  // Settings persistence
  static void saveSettings();
  static bool loadSettings();
  static void resetSettings();

private:
  static uint8_t calculateChecksum(const StateData& data);
};

#endif