#include "state_persistence.h"

void StatePersistence::init() {
  // Check if EEPROM has valid data
  uint16_t magic = EEPROM.read(EEPROM_MAGIC_ADDR) | (EEPROM.read(EEPROM_MAGIC_ADDR + 1) << 8);

  if (magic != EEPROM_MAGIC_VALUE) {
    // First time - initialize EEPROM
    clearState();

    // Write magic number
    EEPROM.write(EEPROM_MAGIC_ADDR, EEPROM_MAGIC_VALUE & 0xFF);
    EEPROM.write(EEPROM_MAGIC_ADDR + 1, (EEPROM_MAGIC_VALUE >> 8) & 0xFF);
  }
}

void StatePersistence::saveState(uint8_t state, uint16_t pillCount, uint16_t lotSize) {
  StateData data;
  data.currentState = state;
  data.pillCount = pillCount;
  data.lotSize = lotSize;

  // Write state data
  EEPROM.write(EEPROM_STATE_ADDR, state);
  EEPROM.write(EEPROM_PILL_COUNT_ADDR, pillCount & 0xFF);
  EEPROM.write(EEPROM_PILL_COUNT_ADDR + 1, (pillCount >> 8) & 0xFF);
  EEPROM.write(EEPROM_LOT_SIZE_ADDR, lotSize & 0xFF);
  EEPROM.write(EEPROM_LOT_SIZE_ADDR + 1, (lotSize >> 8) & 0xFF);

  // Write checksum
  uint8_t checksum = calculateChecksum(data);
  EEPROM.write(EEPROM_CHECKSUM_ADDR, checksum);
}

bool StatePersistence::loadState(StateData& data) {
  // Check magic number
  uint16_t magic = EEPROM.read(EEPROM_MAGIC_ADDR) | (EEPROM.read(EEPROM_MAGIC_ADDR + 1) << 8);
  if (magic != EEPROM_MAGIC_VALUE) {
    return false;
  }

  // Read state data
  data.currentState = EEPROM.read(EEPROM_STATE_ADDR);
  data.pillCount = EEPROM.read(EEPROM_PILL_COUNT_ADDR) | (EEPROM.read(EEPROM_PILL_COUNT_ADDR + 1) << 8);
  data.lotSize = EEPROM.read(EEPROM_LOT_SIZE_ADDR) | (EEPROM.read(EEPROM_LOT_SIZE_ADDR + 1) << 8);

  // Verify checksum
  uint8_t storedChecksum = EEPROM.read(EEPROM_CHECKSUM_ADDR);
  uint8_t calculatedChecksum = calculateChecksum(data);

  return (storedChecksum == calculatedChecksum) && (data.currentState < 9); // Valid state range
}

void StatePersistence::clearState() {
  StateData data;
  data.currentState = 0;  // ESTADO0_INICIO
  data.pillCount = 0;
  data.lotSize = 10;

  saveState(data.currentState, data.pillCount, data.lotSize);
}

uint8_t StatePersistence::calculateChecksum(const StateData& data) {
  return (data.currentState ^ data.pillCount ^ data.lotSize) & 0xFF;
}