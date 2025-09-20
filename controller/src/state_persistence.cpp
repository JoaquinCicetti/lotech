#include "state_persistence.h"
#include "state_machine.h"  // For global variables
#include "config.h"

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

void StatePersistence::saveSettings() {
  // Save all configuration settings to EEPROM
  EEPROM.write(EEPROM_WHEEL_DIVISIONS_ADDR, wheel_divisions);

  EEPROM.write(EEPROM_DOSING_SPEED_ADDR, dosing_speed & 0xFF);
  EEPROM.write(EEPROM_DOSING_SPEED_ADDR + 1, (dosing_speed >> 8) & 0xFF);

  EEPROM.write(EEPROM_T_SETTLE_ADDR, t_step_settle & 0xFF);
  EEPROM.write(EEPROM_T_SETTLE_ADDR + 1, (t_step_settle >> 8) & 0xFF);

  EEPROM.write(EEPROM_T_WEIGHT_ADDR, t_weight_settle & 0xFF);
  EEPROM.write(EEPROM_T_WEIGHT_ADDR + 1, (t_weight_settle >> 8) & 0xFF);

  EEPROM.write(EEPROM_T_TRANSFER_ADDR, t_transfer & 0xFF);
  EEPROM.write(EEPROM_T_TRANSFER_ADDR + 1, (t_transfer >> 8) & 0xFF);

  EEPROM.write(EEPROM_T_GRIND_ADDR, t_grind & 0xFF);
  EEPROM.write(EEPROM_T_GRIND_ADDR + 1, (t_grind >> 8) & 0xFF);

  EEPROM.write(EEPROM_T_CAP_ADDR, t_cap_push & 0xFF);
  EEPROM.write(EEPROM_T_CAP_ADDR + 1, (t_cap_push >> 8) & 0xFF);

  EEPROM.write(EEPROM_T_ELEV_UP_ADDR, t_elev_up & 0xFF);
  EEPROM.write(EEPROM_T_ELEV_UP_ADDR + 1, (t_elev_up >> 8) & 0xFF);

  EEPROM.write(EEPROM_T_ELEV_DOWN_ADDR, t_elev_down & 0xFF);
  EEPROM.write(EEPROM_T_ELEV_DOWN_ADDR + 1, (t_elev_down >> 8) & 0xFF);

  EEPROM.write(EEPROM_PROX_MIN_ADDR, prox_threshold_down & 0xFF);
  EEPROM.write(EEPROM_PROX_MIN_ADDR + 1, (prox_threshold_down >> 8) & 0xFF);

  EEPROM.write(EEPROM_PROX_MAX_ADDR, prox_threshold_up & 0xFF);
  EEPROM.write(EEPROM_PROX_MAX_ADDR + 1, (prox_threshold_up >> 8) & 0xFF);

  EEPROM.write(EEPROM_ELEVATOR_SPEED_ADDR, elevator_speed & 0xFF);
  EEPROM.write(EEPROM_ELEVATOR_SPEED_ADDR + 1, (elevator_speed >> 8) & 0xFF);

  // Calculate and save checksum
  uint8_t checksum = wheel_divisions ^ dosing_speed ^ t_step_settle ^ t_weight_settle ^ elevator_speed;
  EEPROM.write(EEPROM_SETTINGS_CHECKSUM, checksum);

  Serial.println(F("SETTINGS:SAVED_TO_EEPROM"));
}

bool StatePersistence::loadSettings() {
  // Check if EEPROM has valid data
  uint16_t magic = EEPROM.read(EEPROM_MAGIC_ADDR) | (EEPROM.read(EEPROM_MAGIC_ADDR + 1) << 8);
  if (magic != EEPROM_MAGIC_VALUE) {
    return false;
  }

  // Load settings from EEPROM
  uint8_t storedWheelDivisions = EEPROM.read(EEPROM_WHEEL_DIVISIONS_ADDR);
  uint16_t storedDosingSpeed = EEPROM.read(EEPROM_DOSING_SPEED_ADDR) | (EEPROM.read(EEPROM_DOSING_SPEED_ADDR + 1) << 8);
  uint16_t storedTSettle = EEPROM.read(EEPROM_T_SETTLE_ADDR) | (EEPROM.read(EEPROM_T_SETTLE_ADDR + 1) << 8);
  uint16_t storedTWeight = EEPROM.read(EEPROM_T_WEIGHT_ADDR) | (EEPROM.read(EEPROM_T_WEIGHT_ADDR + 1) << 8);
  uint16_t storedElevatorSpeed = EEPROM.read(EEPROM_ELEVATOR_SPEED_ADDR) | (EEPROM.read(EEPROM_ELEVATOR_SPEED_ADDR + 1) << 8);

  // Verify checksum
  uint8_t storedChecksum = EEPROM.read(EEPROM_SETTINGS_CHECKSUM);
  uint8_t calculatedChecksum = storedWheelDivisions ^ storedDosingSpeed ^ storedTSettle ^ storedTWeight ^ storedElevatorSpeed;

  if (storedChecksum != calculatedChecksum) {
    Serial.println(F("SETTINGS:CHECKSUM_FAILED"));
    return false;
  }

  // Load all values if checksum is valid
  if (storedWheelDivisions > 0 && storedWheelDivisions <= 50) {
    wheel_divisions = storedWheelDivisions;
  }

  if (storedDosingSpeed > 0 && storedDosingSpeed < 10000) {
    dosing_speed = storedDosingSpeed;
  }

  if (storedElevatorSpeed >= ELEVATOR_MIN_SPEED && storedElevatorSpeed <= ELEVATOR_MAX_SPEED) {
    elevator_speed = storedElevatorSpeed;
  }

  // Load with validation - if value is 0xFFFF (uninitialized EEPROM), use default
  uint16_t temp;

  temp = EEPROM.read(EEPROM_T_SETTLE_ADDR) | (EEPROM.read(EEPROM_T_SETTLE_ADDR + 1) << 8);
  t_step_settle = (temp == 0xFFFF) ? T_STEP_SETTLE_DEFAULT : temp;

  temp = EEPROM.read(EEPROM_T_WEIGHT_ADDR) | (EEPROM.read(EEPROM_T_WEIGHT_ADDR + 1) << 8);
  t_weight_settle = (temp == 0xFFFF) ? T_WEIGHT_SETTLE_DEFAULT : temp;

  temp = EEPROM.read(EEPROM_T_TRANSFER_ADDR) | (EEPROM.read(EEPROM_T_TRANSFER_ADDR + 1) << 8);
  t_transfer = (temp == 0xFFFF) ? T_TRANSFER_DEFAULT : temp;

  temp = EEPROM.read(EEPROM_T_GRIND_ADDR) | (EEPROM.read(EEPROM_T_GRIND_ADDR + 1) << 8);
  t_grind = (temp == 0xFFFF) ? T_GRIND_DEFAULT : temp;

  temp = EEPROM.read(EEPROM_T_CAP_ADDR) | (EEPROM.read(EEPROM_T_CAP_ADDR + 1) << 8);
  t_cap_push = (temp == 0xFFFF) ? T_CAP_PUSH_DEFAULT : temp;

  temp = EEPROM.read(EEPROM_T_ELEV_UP_ADDR) | (EEPROM.read(EEPROM_T_ELEV_UP_ADDR + 1) << 8);
  t_elev_up = (temp == 0xFFFF) ? T_ELEV_UP_DEFAULT : temp;

  temp = EEPROM.read(EEPROM_T_ELEV_DOWN_ADDR) | (EEPROM.read(EEPROM_T_ELEV_DOWN_ADDR + 1) << 8);
  t_elev_down = (temp == 0xFFFF) ? T_ELEV_DOWN_DEFAULT : temp;
  prox_threshold_down = EEPROM.read(EEPROM_PROX_MIN_ADDR) | (EEPROM.read(EEPROM_PROX_MIN_ADDR + 1) << 8);
  prox_threshold_up = EEPROM.read(EEPROM_PROX_MAX_ADDR) | (EEPROM.read(EEPROM_PROX_MAX_ADDR + 1) << 8);

  Serial.println(F("SETTINGS:LOADED_FROM_EEPROM"));
  return true;
}

void StatePersistence::resetSettings() {
  // Reset all settings to defaults
  wheel_divisions = WHEEL_DIVISIONS_DEFAULT;
  lot_size = LOT_SIZE_DEFAULT;
  dosing_speed = DOSING_SPEED_DEFAULT;
  elevator_speed = ELEVATOR_SPEED_DEFAULT;
  t_step_settle = T_STEP_SETTLE_DEFAULT;
  t_weight_settle = T_WEIGHT_SETTLE_DEFAULT;
  t_transfer = T_TRANSFER_DEFAULT;
  t_grind = T_GRIND_DEFAULT;
  t_cap_push = T_CAP_PUSH_DEFAULT;
  t_elev_up = T_ELEV_UP_DEFAULT;
  t_elev_down = T_ELEV_DOWN_DEFAULT;
  prox_threshold_down = PROX_THRESHOLD_DOWN_DEFAULT;
  prox_threshold_up = PROX_THRESHOLD_UP_DEFAULT;

  // Save defaults to EEPROM
  saveSettings();
  Serial.println(F("SETTINGS:RESET_TO_DEFAULTS"));
}