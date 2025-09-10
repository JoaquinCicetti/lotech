# Documentación de Hardware

## Descripción General

Este directorio contiene especificaciones de hardware, esquemáticos y documentación de componentes para la máquina de procesamiento de píldoras Lotech.

## Contenidos

- `specs/`: Especificaciones de componentes y requerimientos
- `schematics/`: Esquemáticos eléctricos y diagramas de cableado
- `assembly/`: Instrucciones de ensamblaje y dibujos mecánicos
- `calibration/`: Procedimientos de calibración y datos de referencia

## Componentes de Hardware

### Sistema de Control

- Microcontrolador Arduino Uno/Nano
- Fuente de alimentación y distribución
- Circuitos de parada de emergencia
- LEDs de indicación de estado

### Motores y Actuadores

- Motor paso a paso para rotación de rueda
- Motor mezclador con control de velocidad
- Solenoides para control de flujo de píldoras
- Sensores de posición e interruptores de límite

### Sensores

- Celda de carga de precisión con amplificador HX711
- Sensores ópticos para detección de píldoras
- Sensores de proximidad para retroalimentación de posición
- Monitoreo de temperatura (si es requerido)

### Componentes Mecánicos

- Rueda rotatoria dispensadora de píldoras
- Cámara de recolección y pesado de píldoras
- Cámara de mezclado con mecanismo de triturado
- Sistema de posicionamiento de contenedores

## Sistemas de Seguridad

- Paradas de emergencia por hardware
- Protección contra sobrecarga del motor
- Detección de falla de sensores
- Protecciones físicas y gabinetes

## Requerimientos de Instalación

- Energía: Entrada AC 110V/220V
- Espacio: Dimensiones aproximadas [por determinar]
- Ambiente: Entorno farmacéutico limpio y seco
- Ventilación: Adecuada para enfriamiento del motor y control de polvo

## Cronograma de Mantenimiento

- Diario: Inspección visual, limpieza
- Semanal: Verificación de calibración
- Mensual: Inspección de componentes y lubricación
- Anual: Revisión eléctrica y mecánica completa

some info

TMC2208
-> Vref | Irms calculation
https://learn.watterott.com/silentstepstick/faq/#how-to-set-the-stepper-motor-current

-> pinout
https://learn.watterott.com/silentstepstick/pinconfig/
