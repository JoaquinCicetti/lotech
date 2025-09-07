#ifndef STATE_MACHINE_H
#define STATE_MACHINE_H

#include <Arduino.h>

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
  ESTADO8_RETIRO         // Ready for removal
};

// Global delay variables (extern declarations)
extern unsigned long t_step_settle;
extern unsigned long t_weight_settle;
extern unsigned long t_transfer;
extern unsigned long t_grind;
extern unsigned long t_cap_push;
extern unsigned long t_elev_up;
extern unsigned long t_elev_down;

// Global dosing parameters (extern declarations)
extern int wheel_divisions;
extern int lot_size;

// State machine class
class StateMachine {
private:
  State currentState;
  State previousState;
  bool stateJustChanged;
  unsigned long stateTimer;
  
  // Process variables
  int pastillasCount;
  int targetPastillas;
  
public:
  StateMachine();
  
  // State management
  void changeState(State newState);
  State getCurrentState() const { return currentState; }
  String getStateName() const;
  String getStateName(State state) const;
  bool hasStateChanged() const { return stateJustChanged; }
  void clearStateChange() { stateJustChanged = false; }
  unsigned long getStateTime() const { return millis() - stateTimer; }
  bool stateTimeout(unsigned long timeout) const;
  
  // Process variables
  int getPillCount() const { return pastillasCount; }
  int getTargetPills() const { return targetPastillas; }
  void setTargetPills(int target) { targetPastillas = target; }
  void incrementPillCount() { pastillasCount++; }
  void resetPillCount() { pastillasCount = 0; }
  
  // State transitions
  void processTransitions();
  void executeStateEntry();
  void executeStateContinuous();
  
  // Helper functions
  unsigned long getExpectedStateDelay(State state) const;
};

extern StateMachine stateMachine;

#endif // STATE_MACHINE_H