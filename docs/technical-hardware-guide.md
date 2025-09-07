# Control de Motores y Solenoides con Arduino - Guía Técnica

## 1. Introducción

Este documento describe la implementación de un sistema de control basado en Arduino Mega 2560 para motores paso a paso NEMA-17 y solenoide, diseñado específicamente para el proyecto Lotech de procesamiento automatizado de píldoras farmacéuticas.

### Descripción del Sistema
- **Controlador principal**: Arduino Mega 2560
- **Motores paso a paso**: 
  - NEMA-17 modelo 17HS4401 (1.7 A por fase)
  - NEMA-17 modelo 17HS2408 (1.0 A por fase)
- **Actuador**: Solenoide JF-0530B (12V, ~1A)
- **Alimentación**: Fuente switching AC 220V → 12V 6A
- **Regulación**: Step-down LM2596 para alimentación segura del Arduino a 5V

### Aplicación en Lotech
Este sistema controla:
- **Rueda dispensadora**: Motor paso a paso para rotación precisa
- **Sistema de mezclado**: Motor paso a paso para control de velocidad
- **Control de flujo**: Solenoide para direccionar píldoras

## 2. Componentes Principales

### 2.1 Controlador
- **Arduino Mega 2560**: Microcontrolador principal con suficientes pines para expansión futura

### 2.2 Motores Paso a Paso
| Modelo | Corriente/Fase | Resistencia | Aplicación |
|--------|----------------|-------------|------------|
| 17HS4401 | 1.7 A | ~1.8 Ω | Rueda dispensadora (alta precisión) |
| 17HS2408 | 1.0 A | ~2.5 Ω | Sistema de mezclado (menor torque) |

### 2.3 Drivers de Motor
- **Opciones compatibles**: A4988, DRV8825, TMC2208
- **Configuración**: Un driver independiente por motor
- **Ventajas**: Control individual, protección por sobrecorriente

### 2.4 Control de Solenoide
- **Solenoide**: JF-0530B (12V DC, corriente nominal ~1A)
- **MOSFET**: N-channel logic level (ej. IRLZ44N)
- **Protección**: Diodo flyback 1N4007 o 1N5819

### 2.5 Protección y Alimentación
- **TVS**: Diodo supresor unidireccional 12-14V (ej. SMBJ12A)
- **Capacitores**: Electrolíticos 470-1000µF para filtrado
- **Fuente**: Switching 12V 6A con margen de seguridad
- **Regulador**: LM2596 step-down para 5V del Arduino

## 3. Conexiones

### 3.1 Esquema General de Alimentación
```
AC 220V → [Fuente 12V 6A] → [Distribución]
                           ├── Drivers A4988 (12V)
                           ├── Solenoide + MOSFET (12V)
                           └── [LM2596] → Arduino Mega (5V)
```

### 3.2 Conexión de Drivers a Motores NEMA-17

#### Driver A4988/DRV8825 a 17HS4401:
```
Driver          Motor 17HS4401
------          --------------
1A, 1B    ←→    Bobina A (identificar con tester)
2A, 2B    ←→    Bobina B (identificar con tester)
VDD       ←→    +12V
GND       ←→    GND común
```

#### Conexión al Arduino:
```
Arduino Mega    Driver 1 (Rueda)    Driver 2 (Mezclador)
------------    ----------------    --------------------
Pin 2           STEP                 -
Pin 3           DIR                  -
Pin 4           EN                   -
Pin 5           -                    STEP
Pin 6           -                    DIR
Pin 7           -                    EN
GND             GND                  GND
```

### 3.3 Control de Solenoide
```
Arduino Pin 8 → [1kΩ] → Gate MOSFET IRLZ44N
                        ├── Source → GND
                        └── Drain → Solenoide → +12V
                                  ├── [Diodo flyback] → +12V
```

### 3.4 Configuración de Microstepping
```
Driver Pin    1/1    1/2    1/4    1/8    1/16
----------    ---    ---    ---    ---    ----
MS1           L      H      L      H      H
MS2           L      L      H      H      H
MS3           L      L      L      L      H
```

### 3.5 Importancia de la Masa Común
**CRÍTICO**: Todos los componentes deben compartir una masa común:
- GND del Arduino
- GND de la fuente 12V
- GND de todos los drivers
- Source del MOSFET

## 4. Ajustes y Calibración

### 4.1 Identificación de Bobinas NEMA-17
1. **Con multímetro**: Medir resistencia entre terminales
   - 17HS4401: ~1.8 Ω entre terminales de la misma bobina
   - 17HS2408: ~2.5 Ω entre terminales de la misma bobina
2. **Continuidad**: Sin continuidad entre bobinas diferentes
3. **Marcado**: Etiquetar bobinas A y B claramente

### 4.2 Ajuste de Vref en Drivers
Fórmula para A4988: `Vref = I_motor × 8 × Rs`
Donde Rs = 0.1Ω (resistencia de sensado típica)

#### Para 17HS4401 (1.7A):
```
Vref = 1.7 × 8 × 0.1 = 1.36V (máximo)
Vref recomendado = 1.0V (para ~70% corriente)
```

#### Para 17HS2408 (1.0A):
```
Vref = 1.0 × 8 × 0.1 = 0.8V (máximo)
Vref recomendado = 0.6V (para ~75% corriente)
```

**Procedimiento**:
1. Conectar multímetro entre potenciómetro y GND del driver
2. Ajustar con destornillador pequeño
3. Motor alimentado pero no en movimiento durante ajuste

### 4.3 Configuración de Microstepping
**Para aplicación Lotech**:
- **Rueda dispensadora**: 1/16 microstepping (máxima precisión)
- **Mezclador**: 1/8 microstepping (balance precisión/velocidad)

### 4.4 Control PWM de Solenoide (Opcional)
```cpp
// Activación completa
digitalWrite(8, HIGH);
delay(100);

// Mantenimiento con PWM (menor consumo)
analogWrite(8, 128); // 50% duty cycle
```

## 5. Código de Ejemplo

### 5.1 Librerías Necesarias
```cpp
#include <AccelStepper.h>

// Definición de pines
#define STEP_PIN_1  2
#define DIR_PIN_1   3
#define EN_PIN_1    4
#define STEP_PIN_2  5
#define DIR_PIN_2   6
#define EN_PIN_2    7
#define SOLENOID_PIN 8

// Crear objetos stepper
AccelStepper stepper1(AccelStepper::DRIVER, STEP_PIN_1, DIR_PIN_1);
AccelStepper stepper2(AccelStepper::DRIVER, STEP_PIN_2, DIR_PIN_2);
```

### 5.2 Configuración Inicial
```cpp
void setup() {
  Serial.begin(9600);
  
  // Configurar pines de habilitación
  pinMode(EN_PIN_1, OUTPUT);
  pinMode(EN_PIN_2, OUTPUT);
  pinMode(SOLENOID_PIN, OUTPUT);
  
  // Habilitar drivers (LOW = habilitado)
  digitalWrite(EN_PIN_1, LOW);
  digitalWrite(EN_PIN_2, LOW);
  digitalWrite(SOLENOID_PIN, LOW);
  
  // Configurar steppers
  stepper1.setMaxSpeed(1000);    // Pasos por segundo
  stepper1.setAcceleration(500); // Pasos/s²
  
  stepper2.setMaxSpeed(800);
  stepper2.setAcceleration(400);
  
  Serial.println("Sistema Lotech inicializado");
}
```

### 5.3 Funciones de Control
```cpp
void rotateWheel(int steps) {
  Serial.println("Rotando rueda dispensadora...");
  stepper1.move(steps);
  while(stepper1.distanceToGo() != 0) {
    stepper1.run();
  }
}

void runMixer(int speed, int duration) {
  Serial.println("Activando mezclador...");
  stepper2.setSpeed(speed);
  unsigned long startTime = millis();
  
  while(millis() - startTime < duration) {
    stepper2.runSpeed();
  }
  stepper2.stop();
}

void activateSolenoid(int duration) {
  Serial.println("Activando solenoide...");
  digitalWrite(SOLENOID_PIN, HIGH);
  delay(duration);
  digitalWrite(SOLENOID_PIN, LOW);
}
```

### 5.4 Loop Principal
```cpp
void loop() {
  if(Serial.available()) {
    String command = Serial.readString();
    command.trim();
    
    if(command == "DISPENSE") {
      rotateWheel(200);  // 1/8 vuelta con microstepping 1/16
      delay(500);
      activateSolenoid(100);
      
    } else if(command == "MIX") {
      runMixer(400, 5000);  // 5 segundos de mezclado
      
    } else if(command == "STOP") {
      stepper1.stop();
      stepper2.stop();
      digitalWrite(SOLENOID_PIN, LOW);
      
    } else if(command == "STATUS") {
      Serial.println("Sistema OK - Listo para comandos");
    }
  }
  
  // Mantener movimientos suaves
  stepper1.run();
  stepper2.run();
}
```

## 6. Recomendaciones de Seguridad

### 6.1 Alimentación
- **NUNCA** conectar 12V directamente al pin 5V del Arduino
- **SIEMPRE** usar el step-down LM2596 configurado a 5V
- Verificar polaridad antes de conectar
- Usar fusible de 8A en línea de 12V

### 6.2 Protección de Cargas Inductivas
- **OBLIGATORIO**: Diodo flyback en paralelo con solenoide
- Orientación del diodo: cátodo a +12V, ánodo a terminal negativo
- Usar diodo con capacidad mínima de 2A (ej. 1N5819)

### 6.3 Disipación Térmica
- Instalar disipadores en drivers cuando:
  - Corriente > 1A por fase
  - Operación continua > 30 minutos
  - Temperatura ambiente > 25°C
- Verificar temperatura de drivers durante pruebas

### 6.4 Dimensionamiento de Fuente
```
Cálculo de consumo máximo:
- Motor 1: 1.7A × 12V = 20.4W
- Motor 2: 1.0A × 12V = 12.0W  
- Solenoide: 1.0A × 12V = 12.0W
- Arduino + lógica: 0.5A × 5V = 2.5W
- Total: ~47W → Fuente 60W (12V 5A) mínimo
- Recomendado: 72W (12V 6A) para margen del 50%
```

### 6.5 Lista de Verificación Pre-Energizado
- [ ] Todas las conexiones revisadas
- [ ] Polaridades verificadas
- [ ] Masa común conectada
- [ ] Vref ajustado correctamente
- [ ] Diodos flyback instalados
- [ ] Disipadores en drivers (si necesario)
- [ ] Fusible instalado
- [ ] Código cargado y verificado

## 7. Conclusión

### 7.1 Ventajas de la Arquitectura Modular

**Control Independiente**:
- Un driver por motor permite ajuste individual de corriente y microstepping
- Fallo en un driver no afecta el resto del sistema
- Facilita diagnóstico y mantenimiento

**Protección Robusta**:
- TVS protege contra picos de voltaje
- Diodos flyback previenen daños por cargas inductivas  
- Step-down aísla la lógica de control de la potencia

**Escalabilidad**:
- Arduino Mega permite expansión futura
- Arquitectura modular facilita agregar sensores y actuadores
- Código estructurado para fácil modificación

### 7.2 Expansiones Sugeridas

**Sensores**:
- Finales de carrera para límites de movimiento
- Encoder rotativo para feedback de posición
- Sensor de corriente para monitoreo de carga
- Termistor para temperatura de drivers

**Interface**:
- Display LCD 20x4 para estado local
- Botones de emergencia y control manual
- LED indicadores de estado
- Buzzer para alertas

**Comunicación**:
- Módulo WiFi ESP32 para control remoto
- Logging en tarjeta SD para históricos
- Protocolo Modbus para integración industrial

### 7.3 Consideraciones de Mantenimiento

**Rutina Diaria**:
- Verificar temperatura de drivers
- Comprobar funcionamiento de solenoide
- Revisar conexiones por vibración

**Rutina Semanal**:
- Verificar ajuste de Vref
- Limpiar disipadores si los hay
- Comprobar calibración de pasos

**Rutina Mensual**:
- Inspeccionar cables por desgaste
- Verificar torque de motores
- Actualizar firmware si es necesario

Esta arquitectura proporciona una base sólida y confiable para el sistema de control del proyecto Lotech, con capacidad de expansión y mantenimiento simplificado.