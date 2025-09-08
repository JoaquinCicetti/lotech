#ifndef CONFIG_H
#define CONFIG_H

// =====================================================
// HARDWARE PIN DEFINITIONS
// =====================================================

// Motor 1 - Elevator (stepper)
#define MOTOR1_STEP_PIN 3
#define MOTOR1_DIR_PIN 2
#define MOTOR1_MS1_PIN 7
#define MOTOR1_MS2_PIN 6

// Motor 2 - Dosing wheel (stepper)
#define MOTOR2_STEP_PIN 5
#define MOTOR2_DIR_PIN 4
#define MOTOR2_MS1_PIN 9
#define MOTOR2_MS2_PIN 8

// Motor 3 - Grinder (relay control for AC motor)
#define MOTOR3_RELAY_PIN 12

// Solenoids
#define SOLENOID1_PIN 10  // Transfer solenoid
#define SOLENOID2_PIN 11  // Cap push solenoid

// HX711 Load Cell Amplifier
#define HX711_DOUT_PIN A0  // Data pin
#define HX711_SCK_PIN A1   // Clock pin

// Position sensors (optional - for real hardware)
#define SENSOR_POS_ALTA_PIN A2
#define SENSOR_POS_BAJA_PIN A3

// =====================================================
// TIMING PARAMETERS (milliseconds)
// =====================================================

// Default values - can be changed at runtime
#define T_STEP_SETTLE_DEFAULT 1500      // Time for pill to settle after dosing
#define T_WEIGHT_SETTLE_DEFAULT 2000    // Time for weight to stabilize
#define T_TRANSFER_DEFAULT 1200         // Time for transfer solenoid action
#define T_GRIND_DEFAULT 5000           // Grinding time
#define T_CAP_PUSH_DEFAULT 2500         // Cap pushing time
#define T_ELEV_UP_DEFAULT 4000          // Elevator up time (fallback if no sensor)
#define T_ELEV_DOWN_DEFAULT 4000        // Elevator down time (fallback if no sensor)

// Keep old names for backward compatibility
#define T_STEP_SETTLE t_step_settle
#define T_WEIGHT_SETTLE t_weight_settle
#define T_TRANSFER t_transfer
#define T_GRIND t_grind
#define T_CAP_PUSH t_cap_push
#define T_ELEV_UP t_elev_up
#define T_ELEV_DOWN t_elev_down

// =====================================================
// DOSING PARAMETERS
// =====================================================

#define WHEEL_DIVISIONS_DEFAULT 21      // Number of divisions in dosing wheel
#define LOT_SIZE_DEFAULT 10             // Default number of pills to process
#define DEGREES_PER_DIVISION (360.0 / wheel_divisions)  // Calculated at runtime

// =====================================================
// LOAD CELL PARAMETERS
// =====================================================

#define WEIGHT_THRESHOLD_DEFAULT 0.5     // Minimum weight change to detect pill (grams)
#define WEIGHT_TOLERANCE 0.1             // Weight stability tolerance (grams)
#define CALIBRATION_FACTOR_DEFAULT 420.0 // Default calibration factor

// =====================================================
// MOTOR PARAMETERS
// =====================================================

#define STEPS_PER_REVOLUTION 200
#define MICROSTEPS 2
#define ELEVATOR_SPEED 400
#define DOSING_SPEED 800
#define ELEVATOR_MAX_SPEED 1000
#define DOSING_MAX_SPEED 800
#define ELEVATOR_ACCELERATION 500
#define DOSING_ACCELERATION 400

// =====================================================
// SYSTEM PARAMETERS
// =====================================================

#define HEARTBEAT_INTERVAL 5000  // 5 seconds to reduce traffic
#define WEIGHT_PRINT_THRESHOLD 0.1  // Only print weight changes larger than this
#define WEIGHT_STABLE_TIME 1000       // Time weight must be stable (ms)

#endif // CONFIG_H