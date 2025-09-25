# Lotech - Sistema Automatizado de Procesamiento Farmacéutico

[![build-windows](https://github.com/JoaquinCicetti/lotech/actions/workflows/build-windows.yml/badge.svg)](https://github.com/JoaquinCicetti/lotech/actions/workflows/build-windows.yml)

## Descripción

Lotech es un sistema automatizado para procesar píldoras farmacéuticas. Controla una máquina que dispensa, pesa y procesa píldoras de manera precisa mediante Arduino y una aplicación de escritorio.

## Instalación para Usuarios

### Requisitos
- Windows 10 o superior
- Puerto USB disponible para conectar el Arduino
- Cable USB tipo B

### Pasos de Instalación

1. **Descargar la aplicación**
   - Ir a [Releases](https://github.com/JoaquinCicetti/lotech/releases)
   - Descargar el instalador más reciente (`Lotech-X.X.X-setup-x64.exe`)
   - Ejecutar el instalador y seguir las instrucciones

2. **Conectar el Hardware**
   - Conectar el Arduino Mega 2560 a la computadora vía USB
   - La aplicación detectará automáticamente el puerto serial

3. **Primer Uso**
   - Abrir la aplicación Lotech
   - Seleccionar el puerto COM del Arduino
   - Hacer clic en "Conectar"

## Conexiones Arduino

### Pines de Control

```
ARDUINO MEGA 2560 - CONEXIONES PRINCIPALES
==========================================

MOTORES PASO A PASO:
Pin 3  → STEP Motor 1 (Elevador)
Pin 2  → DIR Motor 1
Pin 7  → MS1 Motor 1
Pin 6  → MS2 Motor 1

Pin 5  → STEP Motor 2 (Rueda dosificadora)
Pin 4  → DIR Motor 2
Pin 9  → MS1 Motor 2
Pin 8  → MS2 Motor 2

Pin 12 → RELAY Motor 3 (Molinillo - Motor AC)

ACTUADORES:
Pin 10 → Solenoide 1 (Transferencia)
Pin 11 → Solenoide 2 (Empuje de tapa)

SENSORES:
Pin A0 → Celda de carga HX711 DATA
Pin A1 → Celda de carga HX711 SCK
Pin A4 → SDA Sensor proximidad (I2C)
Pin A5 → SCL Sensor proximidad (I2C)

BOTONES:
Pin 22 → Botón START
Pin 23 → Botón RESET

DISPLAY OLED (SPI):
Pin 30 → DC (Data/Command)
Pin 31 → CS (Chip Select)
Pin 32 → RESET
Pin 51 → MOSI (Hardware SPI)
Pin 52 → SCK (Hardware SPI)

ALIMENTACIÓN:
VIN    → 5V regulado (desde LM2596)
GND    → Tierra común del sistema
```

### Diagrama de Alimentación

```
AC 220V → [Fuente 12V 6A] → [Distribución]
                           ├── Drivers motores (12V)
                           ├── Solenoide (12V)
                           └── [LM2596 → 5V] → Arduino
```

## Uso de la Aplicación

### Modo Manual (Recomendado para Pruebas)
Permite controlar individualmente cada componente:
- **Rueda**: Girar paso a paso para dispensar píldoras
- **Mezclador**: Activar/desactivar a velocidad variable
- **Solenoide**: Abrir/cerrar para control de flujo
- **Celda de carga**: Ver peso en tiempo real

### Modo Automático (Producción)
Proceso completo automatizado:
1. Cargar píldoras en la rueda dispensadora
2. Configurar cantidad de píldoras a procesar
3. Iniciar proceso automático
4. El sistema:
   - Dispensa píldoras una por una
   - Pesa cada píldora
   - Las procesa en el mezclador
   - Genera reporte final

### Panel de Control

- **Estado**: Muestra conexión y actividad actual
- **Peso Actual**: Lectura en tiempo real de la celda
- **Contador**: Píldoras procesadas / Total
- **Registro**: Historial de operaciones y errores

## Mantenimiento Básico

### Diario
- Verificar conexiones USB
- Limpiar residuos de la rueda dispensadora
- Comprobar que el solenoide abre/cierra correctamente

### Semanal
- Calibrar celda de carga con peso conocido
- Verificar que motores giran suavemente
- Limpiar mezclador

## Solución de Problemas

| Problema | Solución |
|----------|----------|
| No detecta Arduino | Verificar cable USB y reinstalar drivers CH340 |
| Motor no gira | Revisar conexiones y alimentación 12V |
| Peso incorrecto | Recalibrar celda de carga |
| Solenoide no responde | Verificar alimentación 12V y conexión pin 8 |

## Especificaciones Técnicas

- **Controlador**: Arduino Mega 2560
- **Motores**: NEMA-17 paso a paso
- **Drivers**: A4988/DRV8825
- **Sensor de peso**: Celda de carga con HX711
- **Alimentación**: 12V 6A
- **Comunicación**: Serial 9600 baudios

## Soporte

Para reportar problemas o solicitar ayuda:
- Abrir un [Issue](https://github.com/JoaquinCicetti/lotech/issues)
- Incluir versión de la aplicación y descripción del problema
- Adjuntar capturas de pantalla si es posible