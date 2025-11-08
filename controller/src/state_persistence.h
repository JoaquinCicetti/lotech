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
// NOTE: timeout values are unsigned long (4 bytes on Arduino)
#define EEPROM_SETTINGS_START 10
#define EEPROM_WHEEL_DIVISIONS_ADDR 10  // Wheel divisions (1 byte)
#define EEPROM_DOSING_SPEED_ADDR 11     // Dosing motor speed (2 bytes)
#define EEPROM_T_SETTLE_ADDR 13         // Settle time (4 bytes)
#define EEPROM_T_WEIGHT_ADDR 17         // Weight time (4 bytes)
#define EEPROM_T_TRANSFER_ADDR 21       // Transfer time (4 bytes)
#define EEPROM_T_GRIND_ADDR 25          // Grind time (4 bytes)
#define EEPROM_T_CAP_ADDR 29            // Cap time (4 bytes)
#define EEPROM_T_ELEV_UP_ADDR 33        // Elevator up time (4 bytes)
#define EEPROM_T_ELEV_DOWN_ADDR 37      // Elevator down time (4 bytes)
#define EEPROM_PROX_MIN_ADDR 41         // Proximity min (2 bytes)
#define EEPROM_PROX_MAX_ADDR 43         // Proximity max (2 bytes)
#define EEPROM_ELEVATOR_SPEED_ADDR 45   // Elevator speed (2 bytes)
#define EEPROM_SETTINGS_LOT_SIZE_ADDR 47  // Lot size setting (1 byte)
#define EEPROM_T_TRANSFER_MAX_ADDR 49   // Transfer solenoid max time (4 bytes)
#define EEPROM_T_CAP_MAX_ADDR 53        // Cap solenoid max time (4 bytes)
#define EEPROM_T_GRINDER_MAX_ADDR 57    // Grinder max time (4 bytes)
#define EEPROM_LOADCELL_CALIBRATION_ADDR 62  // Load cell calibration factor (4 bytes, float)
#define EEPROM_LOADCELL_DEADBAND_ADDR 66     // Load cell noise deadband (4 bytes, float)
#define EEPROM_LED_BRIGHTNESS_ADDR 70        // LED brightness (1 byte)
#define EEPROM_LED_COLORS_ADDR 71            // LED colors array (90 bytes: 30 LEDs × 3 RGB bytes)
#define EEPROM_SETTINGS_CHECKSUM 161         // Settings checksum (1 byte)

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