#include "state_machine.h"
#include "hardware.h"
#include "config.h"

// Global instance
StateMachine stateMachine;

// Global delay variables (definitions with default values)
unsigned long t_step_settle = T_STEP_SETTLE_DEFAULT;
unsigned long t_weight_settle = T_WEIGHT_SETTLE_DEFAULT;
unsigned long t_transfer = T_TRANSFER_DEFAULT;
unsigned long t_grind = T_GRIND_DEFAULT;
unsigned long t_cap_push = T_CAP_PUSH_DEFAULT;
unsigned long t_elev_up = T_ELEV_UP_DEFAULT;
unsigned long t_elev_down = T_ELEV_DOWN_DEFAULT;

// Global dosing parameters
int wheel_divisions = WHEEL_DIVISIONS_DEFAULT;
int lot_size = LOT_SIZE_DEFAULT;

StateMachine::StateMachine() {
  currentState = ESTADO0_INICIO;
  previousState = ESTADO0_INICIO;
  stateJustChanged = false;
  stateTimer = 0;
  pastillasCount = 0;
}

void StateMachine::changeState(State newState) {
  if (currentState != newState) {
    previousState = currentState;
    currentState = newState;
    stateTimer = millis();
    stateJustChanged = true;
    
    Serial.print("ESTADO:");
    Serial.println(getStateName(newState));
    Serial.flush();  // Ensure complete transmission
    
    // Send pill count for relevant states
    if (newState == ESTADO2_DOSIFICACION || newState == ESTADO4_TRASPASO || newState == ESTADO3_PESAJE) {
      Serial.print("PASTILLAS:");
      Serial.print(pastillasCount);
      Serial.print("/");
      Serial.println(lot_size);
      Serial.flush();
    }
    
    // Report expected delay for new state (for loading animation)
    unsigned long expectedDelay = getExpectedStateDelay(newState);
    if (expectedDelay > 0) {
      Serial.print("PROGRESO:");
      Serial.print(getStateName(newState));
      Serial.print(",");
      Serial.println(expectedDelay);
      Serial.flush();
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

String StateMachine::getStateName() const {
  return getStateName(currentState);
}

String StateMachine::getStateName(State state) const {
  switch(state) {
    case ESTADO0_INICIO: return "0_INICIO";
    case ESTADO1_ASCENSOR: return "1_ASCENSOR";
    case ESTADO2_DOSIFICACION: return "2_DOSIFICACION";
    case ESTADO3_PESAJE: return "3_PESAJE";
    case ESTADO4_TRASPASO: return "4_TRASPASO";
    case ESTADO5_MOLIENDA: return "5_MOLIENDA";
    case ESTADO6_DESCARGA: return "6_DESCARGA";
    case ESTADO7_CIERRE: return "7_CIERRE";
    case ESTADO8_RETIRO: return "8_RETIRO";
    default: return "UNKNOWN";
  }
}

bool StateMachine::stateTimeout(unsigned long timeout) const {
  return (millis() - stateTimer) >= timeout;
}

void StateMachine::executeStateEntry() {
  // Entry actions - executed once when entering a state
  switch(currentState) {
    case ESTADO0_INICIO:
      // Ensure everything is stopped
      elevator.stop();
      grinder.stop();
      transferSolenoid.deactivate();
      capSolenoid.deactivate();
      
      // Only reset if coming from ESTADO8_RETIRO (completed cycle)
      if (previousState == ESTADO8_RETIRO) {
        inputs.simulateFrasco(true);  // Container empty for new cycle
        inputs.simulatePastillas(true);  // Pills loaded for new cycle
        Serial.println("SENSORES:FRASCO_VACIO:1");
        Serial.println("SENSORES:PASTILLAS_CARGADAS:1");
      }
      break;
      
    case ESTADO1_ASCENSOR:
      // Start elevator going up
      elevator.moveUp();
      break;
      
    case ESTADO2_DOSIFICACION:
      // Dispense one pill
      dosingWheel.dispenseOne();
      break;
      
    case ESTADO3_PESAJE:
      // Start weight monitoring
      if (loadCell.isConnected()) {
        loadCell.readWeight();  // Get initial reading
      }
      break;
      
    case ESTADO4_TRASPASO:
      // Only activate transfer solenoid if elevator is up
      if (!elevator.isAtTop()) {
        Serial.println("ERROR:ELEVADOR_DEBE_ESTAR_ARRIBA");
        changeState(ESTADO1_ASCENSOR);  // Go back to elevating
      } else {
        transferSolenoid.activate();
        // Clear weight stable since pill is being removed
        // loadCell.simulateWeight(false);
        // Serial.println("SIM:WEIGHT_STABLE:OFF");
      }
      break;
      
    case ESTADO5_MOLIENDA:
      // Start grinder
      grinder.start();
      break;
      
    case ESTADO6_DESCARGA:
      // Start elevator going down
      elevator.moveDown();
      break;
      
    case ESTADO7_CIERRE:
      // Activate cap solenoid
      capSolenoid.activate();
      break;
      
    case ESTADO8_RETIRO:
      // Everything should be off
      elevator.stop();
      grinder.stop();
      transferSolenoid.deactivate();
      capSolenoid.deactivate();
      break;
  }
}

void StateMachine::executeStateContinuous() {
  // Continuous actions - executed every cycle while in state
  switch(currentState) {
    case ESTADO1_ASCENSOR:
      // Keep elevator running
      elevator.run();
      break;
      
    case ESTADO2_DOSIFICACION:
      // Keep dosing motor running
      dosingWheel.run();
      break;
      
    case ESTADO3_PESAJE:
      // Continuously monitor weight
      if (loadCell.isConnected()) {
        float weight = loadCell.readWeight();
        
        // Print significant weight changes
        static float lastPrintedWeight = 0;
        if (abs(weight - lastPrintedWeight) > WEIGHT_PRINT_THRESHOLD) {
          Serial.print("PESO:");
          Serial.println(weight, 2);
          lastPrintedWeight = weight;
        }
      }
      break;
      
    case ESTADO6_DESCARGA:
      // Keep elevator running
      elevator.run();
      break;
      
    default:
      // Other states don't need continuous actions
      break;
  }
}

void StateMachine::processTransitions() {
  // Check transition conditions and change state if needed
  switch(currentState) {
    case ESTADO0_INICIO:
      // Wait for START button with all conditions met
      if (inputs.isStartPressed() && 
          inputs.isFrascoVacio() && 
          inputs.isPastillasCargadas()) {
        changeState(ESTADO1_ASCENSOR);
      }
      break;
      
    case ESTADO1_ASCENSOR:
      // Wait for elevator to reach top (must be moving and then arrive)
      if (elevator.isAtTop() && !elevator.isMoving()) {
        changeState(ESTADO2_DOSIFICACION);
      }
      break;
      
    case ESTADO2_DOSIFICACION:
      // Wait for dosing to complete and settle
      if (!dosingWheel.isDispensing() && stateTimeout(T_STEP_SETTLE)) {
        changeState(ESTADO3_PESAJE);
      }
      break;
      
    case ESTADO3_PESAJE:
      // Wait for weight to stabilize
      if (stateTimeout(T_WEIGHT_SETTLE) && loadCell.isWeightStable()) {
        changeState(ESTADO4_TRASPASO);
      }
      break;
      
    case ESTADO4_TRASPASO:
      // Wait for transfer time
      if (stateTimeout(T_TRANSFER)) {
        transferSolenoid.deactivate();
        pastillasCount++;
        
        Serial.print("PASTILLAS:");
        Serial.print(pastillasCount);
        Serial.print("/");
        Serial.println(lot_size);
        
        if (pastillasCount < lot_size) {
          // Continue with next pill
          changeState(ESTADO2_DOSIFICACION);
        } else {
          // All pills done, proceed to grinding
          changeState(ESTADO5_MOLIENDA);
        }
      }
      break;
      
    case ESTADO5_MOLIENDA:
      // Wait for grinding time
      if (stateTimeout(T_GRIND)) {
        grinder.stop();
        changeState(ESTADO6_DESCARGA);
      }
      break;
      
    case ESTADO6_DESCARGA:
      // Wait for elevator to reach bottom
      if (elevator.isAtBottom()) {
        changeState(ESTADO7_CIERRE);
      }
      break;
      
    case ESTADO7_CIERRE:
      // Wait for cap push time
      if (stateTimeout(T_CAP_PUSH)) {
        capSolenoid.deactivate();
        changeState(ESTADO8_RETIRO);
      }
      break;
      
    case ESTADO8_RETIRO:
      // Wait for RESET button
      if (inputs.isResetPressed()) {
        pastillasCount = 0;
        Serial.println("PASTILLAS:0/0");
        changeState(ESTADO0_INICIO);
      }
      break;
  }
}