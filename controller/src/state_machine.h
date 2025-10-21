#ifndef STATE_MACHINE_H
#define STATE_MACHINE_H

#include <Arduino.h>
#include "state_persistence.h"

// =====================================================
// STATE MACHINE DEFINITIONS (FROM ADR-003)
// =====================================================

enum State {
  ESTADO0_INICIO,        // Waiting for START button
  ESTADO1_ASCENSOR,      // Elevator moving up
  ESTADO2_DOSIFICACION,  // Dosing wheel rotation
  ESTADO3_PESAJE,        // Weight measurement
  ESTADO4_TRASPASO,      // Transfer pill to jar
  ESTADO5_MOLIENDA,      // Grinding
  ESTADO6_DESCARGA,      // Elevator moving down
  ESTADO7_CIERRE,        // Cap closing
  ESTADO8_RETIRO,        // Ready for removal
  ESTADO_ERROR           // Error state - requires manual intervention
};

// Global delay variables for state transitions (extern declarations)
extern unsigned long t_step_settle;
extern unsigned long t_weight_settle;
extern unsigned long t_transfer;
extern unsigned long t_grind;
extern unsigned long t_cap_push;
extern unsigned long t_elev_up;
extern unsigned long t_elev_down;

// Global hardware protection timeouts (extern declarations)
extern unsigned long t_transfer_max;   // Maximum time transfer solenoid can be active
extern unsigned long t_cap_max;         // Maximum time cap solenoid can be active
extern unsigned long t_grinder_max;     // Maximum time grinder can run

// Global dosing parameters (extern declarations)
extern int wheel_divisions;
extern int lot_size;
extern int dosing_speed;

// Global elevator parameters (extern declarations)
extern int elevator_speed;

// Global proximity thresholds (extern declarations)
extern uint16_t prox_threshold_up;
extern uint16_t prox_threshold_down;

// State machine class
class StateMachine {
private:
  State currentState;
  State previousState;
  bool stateJustChanged;
  unsigned long stateTimer;

  // Process variables
  int pastillasCount;

  // Pause state
  bool isPaused;
  State pausedFromState;

  // Error tracking
  const char* currentErrorMessage;
  
public:
  StateMachine();
  
  // State management
  void changeState(State newState);
  State getCurrentState() const { return currentState; }
  const char* getStateName() const;
  const char* getStateName(State state) const;
  bool hasStateChanged() const { return stateJustChanged; }
  void clearStateChange() { stateJustChanged = false; }
  unsigned long getStateTime() const { return millis() - stateTimer; }
  bool stateTimeout(unsigned long timeout) const;
  
  // Process variables
  int getPillCount() const { return pastillasCount; }
  int getLotSize() const { return lot_size; }  // Use global lot_size directly
  void incrementPillCount() { pastillasCount++; }
  void resetPillCount() { pastillasCount = 0; }
  
  // State transitions
  void processTransitions();
  void executeStateEntry();
  void executeStateContinuous();
  
  // Helper functions
  unsigned long getExpectedStateDelay(State state) const;

  // State persistence
  void saveStateToEEPROM();
  bool recoverStateFromEEPROM();
  void setPillCount(int count) { pastillasCount = count; }

  // Error handling
  void setErrorMessage(const char* message) { currentErrorMessage = message; }
  const char* getErrorMessage() const { return currentErrorMessage; }

  // Pause/Resume functionality
  void pause();
  void resume();
  bool getPausedState() const { return isPaused; }
};

extern StateMachine stateMachine;

#endif // STATE_MACHINE_H