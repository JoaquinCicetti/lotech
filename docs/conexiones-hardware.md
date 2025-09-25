# Guía de Conexiones Hardware - Lotech

## Conexiones Arduino Mega 2560

### Pines Principales (Según config.h)

```
MOTORES PASO A PASO
===================
Motor 1 - Elevador:
Pin 3  → STEP
Pin 2  → DIR
Pin 7  → MS1 (Microstepping)
Pin 6  → MS2 (Microstepping)

Motor 2 - Rueda Dosificadora:
Pin 5  → STEP
Pin 4  → DIR
Pin 9  → MS1 (Microstepping)
Pin 8  → MS2 (Microstepping)

Motor 3 - Molinillo:
Pin 12 → RELAY (Control motor AC)

SOLENOIDES
==========
Pin 10 → Solenoide 1 (Transferencia)
Pin 11 → Solenoide 2 (Empuje de tapa)

SENSORES
========
Pin A0 → HX711 DATA (Celda de carga)
Pin A1 → HX711 SCK (Celda de carga)
Pin A4 → SDA (Sensor proximidad I2C)
Pin A5 → SCL (Sensor proximidad I2C)

CONTROLES
=========
Pin 22 → Botón START
Pin 23 → Botón RESET
Pin 24 → Sensor frasco (futuro)
Pin 25 → Sensor píldoras cargadas (futuro)

DISPLAY OLED SPI
================
Pin 30 → DC (Data/Command)
Pin 31 → CS (Chip Select)
Pin 32 → RESET
Pin 51 → MOSI (Hardware SPI)
Pin 52 → SCK (Hardware SPI)

ALIMENTACIÓN
============
VIN → 5V desde LM2596
GND → Tierra común
```

## Esquema de Conexión

### 1. Alimentación Principal

```
AC 220V → [Fuente 12V] → [Distribución]
                        ├── TMC2208 drivers (12V)
                        ├── Solenoides (12V)
                        ├── Relay motor AC
                        └── [LM2596 → 5V] → Arduino
```

### 2. Drivers TMC2208 - Motores Paso a Paso

**Conexiones TMC2208:**
- Los TMC2208 son drivers silenciosos con StealthChop
- Configuración de microstepping via MS1/MS2 (pines 7,6 para Motor 1 y 9,8 para Motor 2)
- No requieren pin ENABLE (auto-habilitados)

**Motor 1 - Elevador (TMC2208)**
```
Arduino → TMC2208
Pin 3   → STEP
Pin 2   → DIR
Pin 7   → MS1
Pin 6   → MS2
```

**Motor 2 - Rueda Dosificadora (TMC2208)**
```
Arduino → TMC2208
Pin 5   → STEP
Pin 4   → DIR
Pin 9   → MS1
Pin 8   → MS2
```

### 3. Control de Solenoides

**Solenoide 1 - Transferencia (Pin 10)**
**Solenoide 2 - Empuje Tapa (Pin 11)**

Usar transistor MOSFET o módulo de relay para control.
IMPORTANTE: Incluir diodo de protección para cargas inductivas.

### 4. Motor AC - Molinillo (Pin 12)

Conectar mediante módulo relay para aislar el circuito AC del Arduino.

### 5. Celda de Carga

```
HX711          Arduino
=====          =======
VCC   ←────→   5V
GND   ←────→   GND
DATA  ←────→   A0
SCK   ←────→   A1

HX711          Celda
=====          =====
E+    ←────→   Excitación +
E-    ←────→   Excitación -
A+    ←────→   Señal +
A-    ←────→   Señal -
```

### 6. Display OLED SPI

El display utiliza comunicación SPI con los pines hardware del Mega (51, 52).
Configuración de 128x64 píxeles.

## Configuración TMC2208

### Microstepping
El sistema está configurado para 1/8 microstepping (1600 pasos/revolución).
Los pines MS1/MS2 configuran el microstepping:
- 1/8 microstepping es típicamente MS1=HIGH, MS2=HIGH en TMC2208

### Ajuste de Corriente
Los TMC2208 tienen ajuste de corriente mediante potenciómetro Vref.
Ajustar según las especificaciones de tus motores NEMA-17.

## Parámetros del Sistema (config.h)

### Tiempos por Defecto (ms)
- Asentamiento píldora: 1500
- Estabilización peso: 2000
- Transferencia: 1200
- Molienda: 5000
- Empuje tapa: 2500
- Elevador arriba/abajo: 4000

### Configuración Dosificación
- Divisiones de rueda: 21
- Tamaño de lote: 10 píldoras
- Pasos por revolución: 1600 (microstepping 1/8)

### Velocidades Motor (pasos/segundo)
- Elevador: 800 (máx 2000)
- Dosificación: 800 (máx 2000)
- Aceleración: 500-800

## Verificación Pre-Encendido

- [ ] Conexiones según config.h verificadas
- [ ] Alimentación 5V al Arduino (NO 12V directo)
- [ ] Tierra común conectada
- [ ] TMC2208 con Vref ajustado
- [ ] Protección en solenoides (diodos)
- [ ] Relay para motor AC instalado
- [ ] Sin cortocircuitos visibles

## Notas Importantes

1. Esta configuración está basada en el archivo `controller/src/config.h`
2. NO modificar las conexiones sin actualizar el firmware
3. Los TMC2208 son drivers silenciosos ideales para operación con bajo ruido
4. El sistema usa 1600 pasos por revolución (microstepping 1/8)