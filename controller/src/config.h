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

// Proximity sensor uses I2C (A4/SDA, A5/SCL) - no need to define pins

// Buttons - Use pins that are not conflicting with motors
#define START_BUTTON_PIN 22  // Digital pin 22 (safe, not used by motors)
#define RESET_BUTTON_PIN 23  // Digital pin 23 (safe, not used by motors)

// Optional sensor pins (for future use)
#define FRASCO_SENSOR_PIN 24  // Digital pin 24 for container sensor
#define PILLS_LOADED_SENSOR_PIN 25  // Digital pin 25 for pills loaded sensor

// OLED Display - 0.96" SPI 4-wire Display
// Uses hardware SPI on Arduino Mega:
// MOSI = pin 51 (hardware SPI)
// SCK = pin 52 (hardware SPI)
// Using higher pins to avoid conflicts
#define OLED_DC_PIN 30      // Data/Command select (was 13)
#define OLED_CS_PIN 31      // Chip Select (was 14)
#define OLED_RESET_PIN 32   // Reset pin (was 15)
#define OLED_WIDTH 128
#define OLED_HEIGHT 64

// If display shows wrong colors, it might be SSD1331 (color) instead of SSD1306
// #define USE_SSD1331  // Uncomment if you have a color OLED

// =====================================================
// TIMING PARAMETERS (milliseconds)
// =====================================================

// Default values for state transitions - can be changed at runtime
#define T_STEP_SETTLE_DEFAULT 1500      // Time for pill to settle after dosing
#define T_WEIGHT_SETTLE_DEFAULT 2000    // Time for weight to stabilize
#define T_TRANSFER_DEFAULT 1200         // Time for transfer solenoid action (state duration)
#define T_GRIND_DEFAULT 5000           // Grinding time (state duration)
#define T_CAP_PUSH_DEFAULT 2500         // Cap pushing time (state duration)
#define T_ELEV_UP_DEFAULT 4000          // Elevator up time (fallback if no sensor)
#define T_ELEV_DOWN_DEFAULT 4000        // Elevator down time (fallback if no sensor)

// Hardware protection timeouts - maximum time hardware can be active
#define T_TRANSFER_MAX_DEFAULT 10000    // Maximum time transfer solenoid can be ON (10s)
#define T_CAP_MAX_DEFAULT 10000          // Maximum time cap solenoid can be ON (10s)
#define T_GRINDER_MAX_DEFAULT 30000      // Maximum time grinder can run continuously (30s)

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

// Standard stepper has 200 steps, but with microstepping we get more precision
// Common microstep settings: 1, 2, 4, 8, 16
// 200 * 8 = 1600 steps per revolution (typical for 1/8 microstepping)
#define STEPS_PER_REVOLUTION 1600  // Adjust based on your driver microstepping
#define MICROSTEPS 8  // Must match your driver MS1/MS2 pin settings
#define ELEVATOR_SPEED_DEFAULT 800   // Default elevator speed (steps per second)
#define DOSING_SPEED_DEFAULT 800     // Default steps per second for dosing
#define ELEVATOR_MAX_SPEED 2000      // Maximum elevator speed (steps per second)
#define DOSING_MAX_SPEED 2000        // Maximum steps per second
#define ELEVATOR_MIN_SPEED 100       // Minimum elevator speed (steps per second)
#define ELEVATOR_ACCELERATION 500    // Steps per second^2
#define DOSING_ACCELERATION 800      // Steps per second^2

// Keep old names for backward compatibility but make them variables
#define DOSING_SPEED dosing_speed

// =====================================================
// PROXIMITY SENSOR PARAMETERS
// =====================================================

#define PROX_THRESHOLD_UP_DEFAULT 500    // Default threshold for top position (0-1024)
#define PROX_THRESHOLD_DOWN_DEFAULT 50   // Default threshold for bottom position (0-1024)

// =====================================================
// SYSTEM PARAMETERS
// =====================================================

#define HEARTBEAT_INTERVAL 5000  // 5 seconds to reduce traffic
#define WEIGHT_PRINT_THRESHOLD 0.1  // Only print weight changes larger than this
#define WEIGHT_STABLE_TIME 1000       // Time weight must be stable (ms)

#endif // CONFIG_H