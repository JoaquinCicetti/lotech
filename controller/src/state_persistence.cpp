#include "state_persistence.h"
#include "state_machine.h"  // For global variables
#include "hardware.h"  // For loadCell instance
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

  // Save timeout values as 4 bytes (unsigned long)
  EEPROM.write(EEPROM_T_SETTLE_ADDR, t_step_settle & 0xFF);
  EEPROM.write(EEPROM_T_SETTLE_ADDR + 1, (t_step_settle >> 8) & 0xFF);
  EEPROM.write(EEPROM_T_SETTLE_ADDR + 2, (t_step_settle >> 16) & 0xFF);
  EEPROM.write(EEPROM_T_SETTLE_ADDR + 3, (t_step_settle >> 24) & 0xFF);

  EEPROM.write(EEPROM_T_WEIGHT_ADDR, t_weight_settle & 0xFF);
  EEPROM.write(EEPROM_T_WEIGHT_ADDR + 1, (t_weight_settle >> 8) & 0xFF);
  EEPROM.write(EEPROM_T_WEIGHT_ADDR + 2, (t_weight_settle >> 16) & 0xFF);
  EEPROM.write(EEPROM_T_WEIGHT_ADDR + 3, (t_weight_settle >> 24) & 0xFF);

  EEPROM.write(EEPROM_T_TRANSFER_ADDR, t_transfer & 0xFF);
  EEPROM.write(EEPROM_T_TRANSFER_ADDR + 1, (t_transfer >> 8) & 0xFF);
  EEPROM.write(EEPROM_T_TRANSFER_ADDR + 2, (t_transfer >> 16) & 0xFF);
  EEPROM.write(EEPROM_T_TRANSFER_ADDR + 3, (t_transfer >> 24) & 0xFF);

  EEPROM.write(EEPROM_T_GRIND_ADDR, t_grind & 0xFF);
  EEPROM.write(EEPROM_T_GRIND_ADDR + 1, (t_grind >> 8) & 0xFF);
  EEPROM.write(EEPROM_T_GRIND_ADDR + 2, (t_grind >> 16) & 0xFF);
  EEPROM.write(EEPROM_T_GRIND_ADDR + 3, (t_grind >> 24) & 0xFF);

  EEPROM.write(EEPROM_T_CAP_ADDR, t_cap_push & 0xFF);
  EEPROM.write(EEPROM_T_CAP_ADDR + 1, (t_cap_push >> 8) & 0xFF);
  EEPROM.write(EEPROM_T_CAP_ADDR + 2, (t_cap_push >> 16) & 0xFF);
  EEPROM.write(EEPROM_T_CAP_ADDR + 3, (t_cap_push >> 24) & 0xFF);

  EEPROM.write(EEPROM_T_ELEV_UP_ADDR, t_elev_up & 0xFF);
  EEPROM.write(EEPROM_T_ELEV_UP_ADDR + 1, (t_elev_up >> 8) & 0xFF);
  EEPROM.write(EEPROM_T_ELEV_UP_ADDR + 2, (t_elev_up >> 16) & 0xFF);
  EEPROM.write(EEPROM_T_ELEV_UP_ADDR + 3, (t_elev_up >> 24) & 0xFF);

  EEPROM.write(EEPROM_T_ELEV_DOWN_ADDR, t_elev_down & 0xFF);
  EEPROM.write(EEPROM_T_ELEV_DOWN_ADDR + 1, (t_elev_down >> 8) & 0xFF);
  EEPROM.write(EEPROM_T_ELEV_DOWN_ADDR + 2, (t_elev_down >> 16) & 0xFF);
  EEPROM.write(EEPROM_T_ELEV_DOWN_ADDR + 3, (t_elev_down >> 24) & 0xFF);

  EEPROM.write(EEPROM_PROX_MIN_ADDR, prox_threshold_down & 0xFF);
  EEPROM.write(EEPROM_PROX_MIN_ADDR + 1, (prox_threshold_down >> 8) & 0xFF);

  EEPROM.write(EEPROM_PROX_MAX_ADDR, prox_threshold_up & 0xFF);
  EEPROM.write(EEPROM_PROX_MAX_ADDR + 1, (prox_threshold_up >> 8) & 0xFF);

  EEPROM.write(EEPROM_ELEVATOR_SPEED_ADDR, elevator_speed & 0xFF);
  EEPROM.write(EEPROM_ELEVATOR_SPEED_ADDR + 1, (elevator_speed >> 8) & 0xFF);

  EEPROM.write(EEPROM_SETTINGS_LOT_SIZE_ADDR, lot_size);

  // Save protection timeout values as 4 bytes (unsigned long)
  EEPROM.write(EEPROM_T_TRANSFER_MAX_ADDR, t_transfer_max & 0xFF);
  EEPROM.write(EEPROM_T_TRANSFER_MAX_ADDR + 1, (t_transfer_max >> 8) & 0xFF);
  EEPROM.write(EEPROM_T_TRANSFER_MAX_ADDR + 2, (t_transfer_max >> 16) & 0xFF);
  EEPROM.write(EEPROM_T_TRANSFER_MAX_ADDR + 3, (t_transfer_max >> 24) & 0xFF);

  EEPROM.write(EEPROM_T_CAP_MAX_ADDR, t_cap_max & 0xFF);
  EEPROM.write(EEPROM_T_CAP_MAX_ADDR + 1, (t_cap_max >> 8) & 0xFF);
  EEPROM.write(EEPROM_T_CAP_MAX_ADDR + 2, (t_cap_max >> 16) & 0xFF);
  EEPROM.write(EEPROM_T_CAP_MAX_ADDR + 3, (t_cap_max >> 24) & 0xFF);

  EEPROM.write(EEPROM_T_GRINDER_MAX_ADDR, t_grinder_max & 0xFF);
  EEPROM.write(EEPROM_T_GRINDER_MAX_ADDR + 1, (t_grinder_max >> 8) & 0xFF);
  EEPROM.write(EEPROM_T_GRINDER_MAX_ADDR + 2, (t_grinder_max >> 16) & 0xFF);
  EEPROM.write(EEPROM_T_GRINDER_MAX_ADDR + 3, (t_grinder_max >> 24) & 0xFF);

  // Save load cell calibration (float, 4 bytes)
  float calibration = loadCell.getCalibrationFactor();
  byte* calibBytes = (byte*)&calibration;
  EEPROM.write(EEPROM_LOADCELL_CALIBRATION_ADDR, calibBytes[0]);
  EEPROM.write(EEPROM_LOADCELL_CALIBRATION_ADDR + 1, calibBytes[1]);
  EEPROM.write(EEPROM_LOADCELL_CALIBRATION_ADDR + 2, calibBytes[2]);
  EEPROM.write(EEPROM_LOADCELL_CALIBRATION_ADDR + 3, calibBytes[3]);

  // Save load cell deadband (float, 4 bytes)
  float deadband = loadCell.getDeadband();
  byte* deadbandBytes = (byte*)&deadband;
  EEPROM.write(EEPROM_LOADCELL_DEADBAND_ADDR, deadbandBytes[0]);
  EEPROM.write(EEPROM_LOADCELL_DEADBAND_ADDR + 1, deadbandBytes[1]);
  EEPROM.write(EEPROM_LOADCELL_DEADBAND_ADDR + 2, deadbandBytes[2]);
  EEPROM.write(EEPROM_LOADCELL_DEADBAND_ADDR + 3, deadbandBytes[3]);

  // Calculate and save checksum - include all critical settings
  uint8_t checksum = wheel_divisions ^ (dosing_speed & 0xFF) ^
                     (t_step_settle & 0xFF) ^ (t_weight_settle & 0xFF) ^
                     (t_transfer & 0xFF) ^ (t_grind & 0xFF) ^ (t_cap_push & 0xFF) ^
                     (t_elev_up & 0xFF) ^ (t_elev_down & 0xFF) ^
                     (prox_threshold_down & 0xFF) ^ (prox_threshold_up & 0xFF) ^
                     (elevator_speed & 0xFF) ^ lot_size;
  EEPROM.write(EEPROM_SETTINGS_CHECKSUM, checksum);

  Serial.println(F("SETTINGS:SAVED_TO_EEPROM"));

  // Debug output to verify saved values
  Serial.print(F("DEBUG:SAVED:lot_size="));
  Serial.print(lot_size);
  Serial.print(F(",t_elev_up="));
  Serial.print(t_elev_up);
  Serial.print(F(",t_elev_down="));
  Serial.println(t_elev_down);
}

bool StatePersistence::loadSettings() {
  // Check if EEPROM has valid data
  uint16_t magic = EEPROM.read(EEPROM_MAGIC_ADDR) | (EEPROM.read(EEPROM_MAGIC_ADDR + 1) << 8);
  if (magic != EEPROM_MAGIC_VALUE) {
    return false;
  }

  // Load settings from EEPROM for checksum validation
  uint8_t storedWheelDivisions = EEPROM.read(EEPROM_WHEEL_DIVISIONS_ADDR);
  uint16_t storedDosingSpeed = EEPROM.read(EEPROM_DOSING_SPEED_ADDR) | (EEPROM.read(EEPROM_DOSING_SPEED_ADDR + 1) << 8);
  uint8_t storedLotSize = EEPROM.read(EEPROM_SETTINGS_LOT_SIZE_ADDR);
  uint16_t storedElevatorSpeed = EEPROM.read(EEPROM_ELEVATOR_SPEED_ADDR) | (EEPROM.read(EEPROM_ELEVATOR_SPEED_ADDR + 1) << 8);

  // Load all timeout values for checksum
  unsigned long storedTSettle = (unsigned long)EEPROM.read(EEPROM_T_SETTLE_ADDR) |
                                 ((unsigned long)EEPROM.read(EEPROM_T_SETTLE_ADDR + 1) << 8) |
                                 ((unsigned long)EEPROM.read(EEPROM_T_SETTLE_ADDR + 2) << 16) |
                                 ((unsigned long)EEPROM.read(EEPROM_T_SETTLE_ADDR + 3) << 24);

  unsigned long storedTWeight = (unsigned long)EEPROM.read(EEPROM_T_WEIGHT_ADDR) |
                                ((unsigned long)EEPROM.read(EEPROM_T_WEIGHT_ADDR + 1) << 8) |
                                ((unsigned long)EEPROM.read(EEPROM_T_WEIGHT_ADDR + 2) << 16) |
                                ((unsigned long)EEPROM.read(EEPROM_T_WEIGHT_ADDR + 3) << 24);

  unsigned long storedTTransfer = (unsigned long)EEPROM.read(EEPROM_T_TRANSFER_ADDR) |
                                  ((unsigned long)EEPROM.read(EEPROM_T_TRANSFER_ADDR + 1) << 8) |
                                  ((unsigned long)EEPROM.read(EEPROM_T_TRANSFER_ADDR + 2) << 16) |
                                  ((unsigned long)EEPROM.read(EEPROM_T_TRANSFER_ADDR + 3) << 24);

  unsigned long storedTGrind = (unsigned long)EEPROM.read(EEPROM_T_GRIND_ADDR) |
                               ((unsigned long)EEPROM.read(EEPROM_T_GRIND_ADDR + 1) << 8) |
                               ((unsigned long)EEPROM.read(EEPROM_T_GRIND_ADDR + 2) << 16) |
                               ((unsigned long)EEPROM.read(EEPROM_T_GRIND_ADDR + 3) << 24);

  unsigned long storedTCap = (unsigned long)EEPROM.read(EEPROM_T_CAP_ADDR) |
                             ((unsigned long)EEPROM.read(EEPROM_T_CAP_ADDR + 1) << 8) |
                             ((unsigned long)EEPROM.read(EEPROM_T_CAP_ADDR + 2) << 16) |
                             ((unsigned long)EEPROM.read(EEPROM_T_CAP_ADDR + 3) << 24);

  unsigned long storedTElevUp = (unsigned long)EEPROM.read(EEPROM_T_ELEV_UP_ADDR) |
                                ((unsigned long)EEPROM.read(EEPROM_T_ELEV_UP_ADDR + 1) << 8) |
                                ((unsigned long)EEPROM.read(EEPROM_T_ELEV_UP_ADDR + 2) << 16) |
                                ((unsigned long)EEPROM.read(EEPROM_T_ELEV_UP_ADDR + 3) << 24);

  unsigned long storedTElevDown = (unsigned long)EEPROM.read(EEPROM_T_ELEV_DOWN_ADDR) |
                                  ((unsigned long)EEPROM.read(EEPROM_T_ELEV_DOWN_ADDR + 1) << 8) |
                                  ((unsigned long)EEPROM.read(EEPROM_T_ELEV_DOWN_ADDR + 2) << 16) |
                                  ((unsigned long)EEPROM.read(EEPROM_T_ELEV_DOWN_ADDR + 3) << 24);

  uint16_t storedProxMin = EEPROM.read(EEPROM_PROX_MIN_ADDR) | (EEPROM.read(EEPROM_PROX_MIN_ADDR + 1) << 8);
  uint16_t storedProxMax = EEPROM.read(EEPROM_PROX_MAX_ADDR) | (EEPROM.read(EEPROM_PROX_MAX_ADDR + 1) << 8);

  // Verify checksum - include all critical settings
  uint8_t storedChecksum = EEPROM.read(EEPROM_SETTINGS_CHECKSUM);
  uint8_t calculatedChecksum = storedWheelDivisions ^ (storedDosingSpeed & 0xFF) ^
                               (storedTSettle & 0xFF) ^ (storedTWeight & 0xFF) ^
                               (storedTTransfer & 0xFF) ^ (storedTGrind & 0xFF) ^ (storedTCap & 0xFF) ^
                               (storedTElevUp & 0xFF) ^ (storedTElevDown & 0xFF) ^
                               (storedProxMin & 0xFF) ^ (storedProxMax & 0xFF) ^
                               (storedElevatorSpeed & 0xFF) ^ storedLotSize;

  if (storedChecksum != calculatedChecksum) {
    Serial.println(F("SETTINGS:CHECKSUM_FAILED"));
    return false;
  }

  // Load all values if checksum is valid - use already loaded values from checksum calculation
  if (storedWheelDivisions > 0 && storedWheelDivisions <= 50) {
    wheel_divisions = storedWheelDivisions;
  }

  if (storedDosingSpeed > 0 && storedDosingSpeed < 10000) {
    dosing_speed = storedDosingSpeed;
  }

  if (storedElevatorSpeed >= ELEVATOR_MIN_SPEED && storedElevatorSpeed <= ELEVATOR_MAX_SPEED) {
    elevator_speed = storedElevatorSpeed;
  }

  if (storedLotSize > 0 && storedLotSize <= 200) {
    lot_size = storedLotSize;
  }

  // Validate and assign timeout values (already loaded for checksum)
  t_step_settle = (storedTSettle == 0xFFFFFFFF || storedTSettle == 0 || storedTSettle > 30000) ? T_STEP_SETTLE_DEFAULT : storedTSettle;
  t_weight_settle = (storedTWeight == 0xFFFFFFFF || storedTWeight == 0 || storedTWeight > 30000) ? T_WEIGHT_SETTLE_DEFAULT : storedTWeight;
  t_transfer = (storedTTransfer == 0xFFFFFFFF || storedTTransfer == 0 || storedTTransfer > 30000) ? T_TRANSFER_DEFAULT : storedTTransfer;
  t_grind = (storedTGrind == 0xFFFFFFFF || storedTGrind == 0 || storedTGrind > 120000) ? T_GRIND_DEFAULT : storedTGrind;
  t_cap_push = (storedTCap == 0xFFFFFFFF || storedTCap == 0 || storedTCap > 30000) ? T_CAP_PUSH_DEFAULT : storedTCap;

  if (storedTElevUp == 0xFFFFFFFF || storedTElevUp == 0 || storedTElevUp > 30000) {
    t_elev_up = T_ELEV_UP_DEFAULT;
    Serial.print(F("EEPROM:t_elev_up invalid ("));
    Serial.print(storedTElevUp);
    Serial.print(F("), using default: "));
    Serial.println(T_ELEV_UP_DEFAULT);
  } else {
    t_elev_up = storedTElevUp;
  }

  if (storedTElevDown == 0xFFFFFFFF || storedTElevDown == 0 || storedTElevDown > 30000) {
    t_elev_down = T_ELEV_DOWN_DEFAULT;
    Serial.print(F("EEPROM:t_elev_down invalid ("));
    Serial.print(storedTElevDown);
    Serial.print(F("), using default: "));
    Serial.println(T_ELEV_DOWN_DEFAULT);
  } else {
    t_elev_down = storedTElevDown;
  }

  // Validate and assign proximity thresholds (already loaded)
  prox_threshold_down = (storedProxMin == 0xFFFF || storedProxMin == 0 || storedProxMin > 1000) ? PROX_THRESHOLD_DOWN_DEFAULT : storedProxMin;
  prox_threshold_up = (storedProxMax == 0xFFFF || storedProxMax == 0 || storedProxMax > 1000) ? PROX_THRESHOLD_UP_DEFAULT : storedProxMax;

  // Load protection timeout values as 4 bytes (unsigned long)
  unsigned long tempLong;
  tempLong = (unsigned long)EEPROM.read(EEPROM_T_TRANSFER_MAX_ADDR) |
             ((unsigned long)EEPROM.read(EEPROM_T_TRANSFER_MAX_ADDR + 1) << 8) |
             ((unsigned long)EEPROM.read(EEPROM_T_TRANSFER_MAX_ADDR + 2) << 16) |
             ((unsigned long)EEPROM.read(EEPROM_T_TRANSFER_MAX_ADDR + 3) << 24);
  t_transfer_max = (tempLong == 0xFFFFFFFF || tempLong == 0 || tempLong > 60000) ? T_TRANSFER_MAX_DEFAULT : tempLong;

  tempLong = (unsigned long)EEPROM.read(EEPROM_T_CAP_MAX_ADDR) |
             ((unsigned long)EEPROM.read(EEPROM_T_CAP_MAX_ADDR + 1) << 8) |
             ((unsigned long)EEPROM.read(EEPROM_T_CAP_MAX_ADDR + 2) << 16) |
             ((unsigned long)EEPROM.read(EEPROM_T_CAP_MAX_ADDR + 3) << 24);
  t_cap_max = (tempLong == 0xFFFFFFFF || tempLong == 0 || tempLong > 60000) ? T_CAP_MAX_DEFAULT : tempLong;

  tempLong = (unsigned long)EEPROM.read(EEPROM_T_GRINDER_MAX_ADDR) |
             ((unsigned long)EEPROM.read(EEPROM_T_GRINDER_MAX_ADDR + 1) << 8) |
             ((unsigned long)EEPROM.read(EEPROM_T_GRINDER_MAX_ADDR + 2) << 16) |
             ((unsigned long)EEPROM.read(EEPROM_T_GRINDER_MAX_ADDR + 3) << 24);
  t_grinder_max = (tempLong == 0xFFFFFFFF || tempLong == 0 || tempLong > 180000) ? T_GRINDER_MAX_DEFAULT : tempLong;

  // Load load cell calibration (float, 4 bytes)
  float calibration;
  byte* calibBytes = (byte*)&calibration;
  calibBytes[0] = EEPROM.read(EEPROM_LOADCELL_CALIBRATION_ADDR);
  calibBytes[1] = EEPROM.read(EEPROM_LOADCELL_CALIBRATION_ADDR + 1);
  calibBytes[2] = EEPROM.read(EEPROM_LOADCELL_CALIBRATION_ADDR + 2);
  calibBytes[3] = EEPROM.read(EEPROM_LOADCELL_CALIBRATION_ADDR + 3);
  // Check if valid (not 0 or NaN)
  if (calibration > 0 && calibration < 100000 && !isnan(calibration)) {
    loadCell.setCalibrationFactor(calibration);
  }

  // Load load cell deadband (float, 4 bytes)
  float deadband;
  byte* deadbandBytes = (byte*)&deadband;
  deadbandBytes[0] = EEPROM.read(EEPROM_LOADCELL_DEADBAND_ADDR);
  deadbandBytes[1] = EEPROM.read(EEPROM_LOADCELL_DEADBAND_ADDR + 1);
  deadbandBytes[2] = EEPROM.read(EEPROM_LOADCELL_DEADBAND_ADDR + 2);
  deadbandBytes[3] = EEPROM.read(EEPROM_LOADCELL_DEADBAND_ADDR + 3);
  // Check if valid (0 to 10g range)
  if (deadband >= 0 && deadband <= 10.0 && !isnan(deadband)) {
    loadCell.setDeadband(deadband);
  }

  Serial.println(F("SETTINGS:LOADED_FROM_EEPROM"));

  // Debug output to verify loaded values
  Serial.print(F("DEBUG:LOADED:lot_size="));
  Serial.print(lot_size);
  Serial.print(F(",t_elev_up="));
  Serial.print(t_elev_up);
  Serial.print(F(",t_elev_down="));
  Serial.println(t_elev_down);

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