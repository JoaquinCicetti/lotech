#include "state_machine.h"
#include "hardware.h"
#include "config.h"
#include "serial_protocol.h"

// Global instance
StateMachine stateMachine;

// Weight reading control flag (extern from main.cpp)
extern bool needsWeightReading;

// Emergency state flag (extern from main.cpp)
extern bool isEmergencyActive;

// Global delay variables for state transitions (definitions with default values)
unsigned long t_step_settle = T_STEP_SETTLE_DEFAULT;
unsigned long t_weight_settle = T_WEIGHT_SETTLE_DEFAULT;
unsigned long t_transfer = T_TRANSFER_DEFAULT;
unsigned long t_grind = T_GRIND_DEFAULT;
unsigned long t_cap_push = T_CAP_PUSH_DEFAULT;
unsigned long t_elev_up = T_ELEV_UP_DEFAULT;
unsigned long t_elev_down = T_ELEV_DOWN_DEFAULT;

// Global hardware protection timeouts (definitions with default values)
unsigned long t_transfer_max = T_TRANSFER_MAX_DEFAULT;
unsigned long t_cap_max = T_CAP_MAX_DEFAULT;
unsigned long t_grinder_max = T_GRINDER_MAX_DEFAULT;

// Global dosing parameters
int wheel_divisions = WHEEL_DIVISIONS_DEFAULT;
int lot_size = LOT_SIZE_DEFAULT;
int dosing_speed = DOSING_SPEED_DEFAULT;  // Steps per second for dosing motor

// Global elevator parameters
int elevator_speed = ELEVATOR_SPEED_DEFAULT;  // Steps per second for elevator motor

// Global proximity thresholds
uint16_t prox_threshold_up = PROX_THRESHOLD_UP_DEFAULT;
uint16_t prox_threshold_down = PROX_THRESHOLD_DOWN_DEFAULT;

StateMachine::StateMachine() {
  currentState = ESTADO0_INICIO;
  previousState = ESTADO0_INICIO;
  stateJustChanged = false;
  stateTimer = 0;
  pastillasCount = 0;
  isPaused = false;
  pausedFromState = ESTADO0_INICIO;
  appHasStarted = false;  // Require app to start first
  currentErrorMessage = nullptr;
}

void StateMachine::changeState(State newState) {
  if (currentState != newState) {
    previousState = currentState;
    currentState = newState;
    stateTimer = millis();
    stateJustChanged = true;

    Serial.print("STATE:");
    Serial.println(getStateName(newState));
    // Removed Serial.flush() - blocking operation

    // Update OLED display
    if (oledDisplay.isInitialized()) {
      oledDisplay.showState(getStateName(newState), pastillasCount, lot_size);
    }

    // Send pill count for relevant states
    if (newState == ESTADO2_DOSIFICACION || newState == ESTADO4_TRASPASO || newState == ESTADO3_PESAJE) {
      Serial.print("PILLS:");
      Serial.print(pastillasCount);
      Serial.print("/");
      Serial.println(lot_size);
      // Removed Serial.flush() - blocking operation
    }
    
    // Report expected delay for new state (for loading animation)
    unsigned long expectedDelay = getExpectedStateDelay(newState);
    if (expectedDelay > 0) {
      Serial.print("PROGRESS:");
      Serial.print(getStateName(newState));
      Serial.print(",");
      Serial.println(expectedDelay);

      // Debug: Show actual variable values
      if (newState == ESTADO1_ASCENSOR) {
        Serial.print(F("DEBUG:t_elev_up="));
        Serial.println(t_elev_up);
      }
      // Removed Serial.flush() - blocking operation
    }
  }
}

unsigned long StateMachine::getExpectedStateDelay(State state) const {
  switch(state) {
    case ESTADO1_ASCENSOR: return t_elev_up;
    case ESTADO2_DOSIFICACION: return t_step_settle;
    case ESTADO3_PESAJE: return t_weight_settle;
    case ESTADO4_TRASPASO: return t_transfer;
    case ESTADO5_MOLIENDA: return t_grind;
    case ESTADO6_DESCARGA: return t_elev_down;
    case ESTADO7_CIERRE: return t_cap_push;
    default: return 0;
  }
}

const char* StateMachine::getStateName() const {
  return getStateName(currentState);
}

const char* StateMachine::getStateName(State state) const {
  switch(state) {
    case ESTADO0_INICIO: return "INICIO";
    case ESTADO1_ASCENSOR: return "ASCENSOR";
    case ESTADO2_DOSIFICACION: return "DOSIF";
    case ESTADO3_PESAJE: return "PESAJE";
    case ESTADO4_TRASPASO: return "TRASPASO";
    case ESTADO5_MOLIENDA: return "MOLIENDA";
    case ESTADO6_DESCARGA: return "DESCARGA";
    case ESTADO7_CIERRE: return "CIERRE";
    case ESTADO8_RETIRO: return "RETIRO";
    case ESTADO_ERROR: return "ERROR";
    default: return "UNKNOWN";
  }
}

bool StateMachine::stateTimeout(unsigned long timeout) const {
  return (millis() - stateTimer) >= timeout;
}

void StateMachine::executeStateEntry() {
  // Entry actions - executed once when entering a state
  Serial.print(F("ENTRY:"));
  Serial.println(getStateName(currentState));

  switch(currentState) {
    case ESTADO0_INICIO:
      // Ensure everything is stopped
      elevator.stop();
      dosingWheel.stop();
      grinder.stop();
      transferSolenoid.deactivate();
      capSolenoid.deactivate();
      
      // Only reset if coming from ESTADO8_RETIRO (completed cycle)
      if (previousState == ESTADO8_RETIRO) {
        inputs.simulateFrasco(true);  // Container empty for new cycle
        inputs.simulatePastillas(true);  // Pills loaded for new cycle
        Serial.println("SENSORS:CONTAINER_EMPTY:1");
        Serial.println("SENSORS:PILLS_LOADED:1");
      }
      break;
      
    case ESTADO1_ASCENSOR:
      // Start elevator going up
      elevator.moveUp();
      // Send progress for elevator state
      SerialProtocol::sendProgress("1_ASCENSOR", t_elev_up);
      break;

    case ESTADO2_DOSIFICACION:
      // Dispense one pill
      dosingWheel.dispenseOne();
      Serial.print(F("DOSING:PILL_"));
      Serial.println(pastillasCount + 1);
      // Send progress for dosing state
      SerialProtocol::sendProgress("2_DOSIFICACION", t_step_settle);
      break;
      
    case ESTADO3_PESAJE:
      // Start weight monitoring
      Serial.println(F("WEIGHT:START"));
      needsWeightReading = true;  // Enable weight reading in main loop
      if (loadCell.isConnected()) {
        loadCell.readWeight();  // Get initial reading
      }
      // Send progress for weighing state
      SerialProtocol::sendProgress("3_PESAJE", t_weight_settle);
      break;
      
    case ESTADO4_TRASPASO:
      // Only activate transfer solenoid if elevator is up
      if (!elevator.isAtTop()) {
        Serial.println("ERROR:ELEVATOR_MUST_BE_UP");
        changeState(ESTADO1_ASCENSOR);  // Go back to elevating
      } else {
        transferSolenoid.activate();
        // Send progress for transfer state
        SerialProtocol::sendProgress("4_TRASPASO", t_transfer);
      }
      break;
      
    case ESTADO5_MOLIENDA:
      // Safety check: grinder MUST NOT run if elevator is not at top
      if (!elevator.isAtTop()) {
        Serial.println(F("ERROR:GRINDER_REQUIRES_ELEVATOR_AT_TOP"));
        changeState(ESTADO1_ASCENSOR);  // Go back to elevating
      } else {
        // Start grinder
        grinder.start();
        // Send progress for grinding state
        SerialProtocol::sendProgress("5_MOLIENDA", t_grind);
      }
      break;
      
    case ESTADO6_DESCARGA:
      // Start elevator going down
      elevator.moveDown();
      // Send progress for discharge state
      SerialProtocol::sendProgress("6_DESCARGA", t_elev_down);
      break;
      
    case ESTADO7_CIERRE:
      // Activate cap solenoid
      capSolenoid.activate();
      // Send progress for capping state
      SerialProtocol::sendProgress("7_CIERRE", t_cap_push);
      break;
      
    case ESTADO8_RETIRO:
      // Everything should be off
      elevator.stop();
      grinder.stop();
      transferSolenoid.deactivate();
      capSolenoid.deactivate();

      // Notify that cycle is complete
      Serial.println(F("CYCLE:COMPLETE"));
      Serial.print(F("CYCLE:TOTAL_PILLS:"));
      Serial.println(pastillasCount);
      break;

    case ESTADO_ERROR:
      // Stop all motors and actuators
      elevator.stop();
      dosingWheel.stop();
      grinder.stop();
      transferSolenoid.deactivate();
      capSolenoid.deactivate();

      // Show specific error message
      if (currentErrorMessage != nullptr) {
        Serial.print(F("ERROR:"));
        Serial.println(currentErrorMessage);
        if (oledDisplay.isInitialized()) {
          oledDisplay.showError(currentErrorMessage);
        }
      } else {
        Serial.println(F("ERROR:SYSTEM_IN_ERROR_STATE"));
        if (oledDisplay.isInitialized()) {
          oledDisplay.showError("ERROR SISTEMA");
        }
      }
      break;
  }
}

void StateMachine::executeStateContinuous() {
  // Continuous actions - executed every cycle while in state
  switch(currentState) {
    case ESTADO1_ASCENSOR:
      // Update elevator motor (AccelStepper needs run() to move)
      elevator.run();
      // Check position continuously
      elevator.updatePosition();
      break;

    case ESTADO2_DOSIFICACION:
      // Update dosing motor (AccelStepper needs run() to complete movement)
      dosingWheel.run();
      break;
      
    case ESTADO3_PESAJE:
      // Continuously monitor weight
      if (loadCell.isConnected()) {
        float weight = loadCell.readWeight();
        bool isStable = loadCell.isWeightStable();

        // Print weight changes for monitoring
        static float lastPrintedWeight = 0;
        static unsigned long lastPrintTime = 0;
        unsigned long now = millis();

        // Print every 200ms for frequent monitoring during weighing
        if ((now - lastPrintTime) > 200) {
          Serial.print("WEIGHT:");
          Serial.print(weight, 4);
          Serial.print("g STABLE:");
          Serial.print(isStable ? "YES" : "NO");
          Serial.print(" TIMEOUT:");
          Serial.print(stateTimeout(t_weight_settle) ? "YES" : "NO");
          Serial.print(" ELAPSED:");
          Serial.println(getStateTime());
          lastPrintedWeight = weight;
          lastPrintTime = now;
        }
      } else {
        // No load cell - just wait for timeout
        static bool warned = false;
        if (!warned) {
          Serial.println(F("WARNING:NO_LOADCELL"));
          warned = true;
        }
      }
      break;

    case ESTADO4_TRASPASO:
      // Keep solenoid active and check for timeout protection
      transferSolenoid.run();
      break;

    case ESTADO5_MOLIENDA:
      // Safety: only run grinder if elevator is at top
      if (elevator.isAtTop()) {
        // Run grinder (checks timeout protection)
        grinder.run();
      } else {
        // Elevator not at top - don't run grinder
        Serial.println(F("ERROR:GRINDER_BLOCKED_ELEVATOR_NOT_AT_TOP"));
      }
      break;

    case ESTADO6_DESCARGA:
      // Update elevator motor downward
      elevator.run();
      // Check position continuously
      elevator.updatePosition();
      break;

    case ESTADO7_CIERRE:
      // Keep cap solenoid active and check for timeout protection
      capSolenoid.run();
      break;

    default:
      // Other states don't need continuous actions
      break;
  }
}

void StateMachine::processTransitions() {
  // CRITICAL: Block ALL state transitions if emergency is active
  if (isEmergencyActive) {
    // Emergency is active - do not process any state transitions
    // State machine is frozen until RESET command clears emergency
    return;
  }

  // Check transition conditions and change state if needed
  switch(currentState) {
    case ESTADO0_INICIO:
      // Wait for START button with all conditions met
      if (inputs.isStartPressed() &&
          inputs.isFrascoVacio() &&
          inputs.isPastillasCargadas()) {
        changeState(ESTADO1_ASCENSOR);
        // Clear the start button after state change
        inputs.simulateStart(false);
      }
      break;
      
    case ESTADO1_ASCENSOR:
      // Wait for elevator to reach top OR timeout
      if (elevator.isAtTop()) {
        // Elevator reached top position
        elevator.stop();  // Make sure it's stopped
        Serial.println(F("ELEVATOR:REACHED_TOP"));
        changeState(ESTADO2_DOSIFICACION);
      } else if (stateTimeout(t_elev_up)) {
        // Timeout - elevator should have reached top by now
        Serial.println(F("ERROR:ELEVATOR_TIMEOUT_NOT_AT_TOP"));
        elevator.stop();  // Stop motor to prevent damage
        // Do NOT modify atTop - keep real position
        // Go to error state since we're not at top
        setErrorMessage("ELEVADOR NO SUBIO");
        changeState(ESTADO_ERROR);
      }
      break;
      
    case ESTADO2_DOSIFICACION:
      // Check if dosing is complete
      if (!dosingWheel.isDispensing()) {
        // Dosing complete, now wait for pill to settle
        if (stateTimeout(t_step_settle)) {
          Serial.println(F("DOSING:COMPLETE_AND_SETTLED"));
          changeState(ESTADO3_PESAJE);
        }
      } else {
        // Still dispensing - reset timer so we wait AFTER dosing completes
        stateTimer = millis();
      }
      break;
      
    case ESTADO3_PESAJE:
      // Wait for weight to stabilize OR timeout - whichever comes first
      if (loadCell.isWeightStable()) {
        // Weight stabilized - proceed
        Serial.println(F("WEIGHT:STABLE"));
        needsWeightReading = false;  // Disable weight reading
        changeState(ESTADO4_TRASPASO);
      } else if (stateTimeout(t_weight_settle)) {
        // Timeout - proceed anyway
        Serial.println(F("WARNING:WEIGHT_TIMEOUT"));
        needsWeightReading = false;  // Disable weight reading
        changeState(ESTADO4_TRASPASO);
      }
      break;
      
    case ESTADO4_TRASPASO:
      // Wait for transfer time
      if (stateTimeout(t_transfer)) {
        transferSolenoid.deactivate();
        pastillasCount++;

        Serial.print("PILLS:");
        Serial.print(pastillasCount);
        Serial.print("/");
        Serial.println(lot_size);

        // Wait 100ms for scale to settle after transfer, then auto-tare
        // Only tare if we're continuing to next pill (not on last pill)
        if (loadCell.isConnected() && pastillasCount < lot_size) {
          delay(100);  // Let scale settle
          loadCell.tare();
          Serial.println(F("LOADCELL:AUTO_TARE"));
        }

        // Update OLED display with new pill count
        if (oledDisplay.isInitialized()) {
          oledDisplay.showState(getStateName(currentState), pastillasCount, lot_size);
        }

        if (pastillasCount < lot_size) {
          // Continue with next pill - go back to dosing
          Serial.println(F("CYCLE:NEXT_PILL"));
          changeState(ESTADO2_DOSIFICACION);
        } else {
          // All pills done, proceed to grinding
          Serial.println(F("CYCLE:ALL_PILLS_COMPLETE"));
          changeState(ESTADO5_MOLIENDA);
        }
      }
      break;
      
    case ESTADO5_MOLIENDA:
      // Wait for grinding time
      if (stateTimeout(t_grind)) {
        grinder.stop();
        changeState(ESTADO6_DESCARGA);
      }
      break;
      
    case ESTADO6_DESCARGA:
      // Wait for elevator to reach bottom OR timeout
      if (elevator.isAtBottom()) {
        elevator.stop();  // Make sure it's stopped
        changeState(ESTADO7_CIERRE);
      } else if (stateTimeout(t_elev_down)) {
        // Timeout - stop motor but don't proceed if not at bottom
        Serial.println(F("ERROR:ELEVATOR_DOWN_TIMEOUT_NOT_AT_BOTTOM"));
        elevator.stop();  // Stop motor to prevent damage
        // Do NOT modify atBottom - keep real position
        setErrorMessage("ELEVADOR NO BAJO");
        changeState(ESTADO_ERROR);
      }
      break;
      
    case ESTADO7_CIERRE:
      // Wait for cap push time
      if (stateTimeout(t_cap_push)) {
        capSolenoid.deactivate();
        changeState(ESTADO8_RETIRO);
      }
      break;
      
    case ESTADO8_RETIRO:
      // Wait for RESET button
      if (inputs.isResetPressed()) {
        pastillasCount = 0;
        Serial.println("PILLS:0/0");
        changeState(ESTADO0_INICIO);
      }
      break;

    case ESTADO_ERROR:
      // In error state, wait for RESET button to recover
      if (inputs.isResetPressed()) {
        Serial.println(F("ERROR:CLEARED_BY_USER"));
        pastillasCount = 0;
        currentErrorMessage = nullptr;  // Clear error message
        changeState(ESTADO0_INICIO);
        inputs.simulateReset(false);  // Clear reset button
        if (oledDisplay.isInitialized()) {
          oledDisplay.showState("INICIO", 0, lot_size);
        }
      }
      break;
  }
}

void StateMachine::saveStateToEEPROM() {
  // Save current state to EEPROM for recovery after power loss
  StatePersistence::saveState(currentState, pastillasCount, lot_size);
}

bool StateMachine::recoverStateFromEEPROM() {
  StatePersistence::StateData data;

  if (StatePersistence::loadState(data)) {
    // Valid state found - recover it
    currentState = (State)data.currentState;
    previousState = currentState;
    pastillasCount = data.pillCount;
    // DON'T restore lot_size - it's a setting, not state
    // lot_size is loaded from settings persistence instead
    stateTimer = millis();
    stateJustChanged = false;

    Serial.println(F("RECOVERY:STATE_RESTORED"));
    Serial.print(F("STATE:"));
    Serial.println(getStateName(currentState));
    Serial.print(F("PILLS:"));
    Serial.print(pastillasCount);
    Serial.print(F("/"));
    Serial.println(lot_size);

    // Don't send PROGRESS for recovered state since delays haven't been set yet
    // PROGRESS will be sent when state actually changes

    return true;
  }

  return false;
}

void StateMachine::pause() {
  // Don't pause if already paused or in certain states
  if (isPaused || currentState == ESTADO0_INICIO ||
      currentState == ESTADO8_RETIRO || currentState == ESTADO_ERROR) {
    return;
  }

  // Save current state and set pause flag
  pausedFromState = currentState;
  isPaused = true;

  // Stop all hardware immediately
  elevator.stop();
  dosingWheel.stop();
  grinder.stop();
  transferSolenoid.deactivate();
  capSolenoid.deactivate();

  // Disable weight reading if active
  needsWeightReading = false;

  Serial.println("PAUSED:1");
  Serial.print("PAUSED_FROM:");
  Serial.println(getStateName(pausedFromState));

  // Update OLED to show paused state
  if (oledDisplay.isInitialized()) {
    oledDisplay.showState("PAUSADO", pastillasCount, lot_size);
  }
}

void StateMachine::resume() {
  if (!isPaused) {
    return;
  }

  isPaused = false;

  Serial.println("PAUSED:0");
  Serial.print("RESUMING:");
  Serial.println(getStateName(pausedFromState));

  // Update OLED back to current state
  if (oledDisplay.isInitialized()) {
    oledDisplay.showState(getStateName(pausedFromState), pastillasCount, lot_size);
  }

  // Resume hardware based on the state we paused from
  // We need to re-execute the state entry to restart operations
  currentState = pausedFromState;
  stateTimer = millis(); // Reset timer for the state
  stateJustChanged = true;
  executeStateEntry();
}