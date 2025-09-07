# Lotech - Automatización de Procesamiento de Píldoras Farmacéuticas

## ¿Qué es Lotech?

Lotech es una máquina automatizada diseñada para la industria farmacéutica para procesar lotes de píldoras de manera eficiente y precisa. El sistema automatiza todo el flujo de trabajo desde la introducción de las píldoras hasta el empaquetado final.

## ¿Cómo Funciona?

1. **Carga**: El personal farmacéutico introduce un lote completo de píldoras en un sistema de rueda rotatoria
2. **Dispensado**: La rueda gira paso a paso, permitiendo que las píldoras caigan una por una
3. **Pesado**: Cada píldora se pesa individualmente usando celdas de carga de precisión
4. **Procesamiento**: Las píldoras se dirigen a un mezclador donde se muelen juntas
5. **Empaquetado**: El material procesado se transfiere a contenedores para etiquetado

## Componentes del Sistema

### Hardware
- **Controlador Arduino**: Gestiona todos los componentes electrónicos y sensores
- **Motores**: Controlan la rotación de la rueda y las operaciones de mezclado
- **Solenoides**: Dirigen el flujo de píldoras y operaciones de contenedores
- **Celda de Carga**: Proporciona mediciones de peso precisas para cada píldora
- **Rueda Rotatoria**: Sostiene y dispensa píldoras de una en una

### Software
- **Aplicación de Escritorio**: Proporciona interfaz de monitoreo y visualización del flujo de trabajo
- **Firmware Arduino**: Controla las operaciones de hardware y recolección de datos de sensores

## Estructura del Proyecto

```
lotech/
├── README.md                 # Este archivo
├── docs/                     # Documentación y ADRs
├── arduino/                  # Código del firmware Arduino
├── desktop-app/              # Aplicación de monitoreo de escritorio
└── hardware/                 # Especificaciones de hardware y esquemáticos
```

## Primeros Pasos

Consulte la [Guía de Configuración de Desarrollo](docs/development-setup.md) para instrucciones detalladas sobre cómo configurar el entorno de desarrollo.

## Documentación

- [Proceso de Flujo de Trabajo de la Máquina](docs/machine-workflow.md) - Documentación detallada del proceso
- [Registros de Decisiones de Arquitectura](docs/adr/) - Decisiones técnicas y justificación
- [Configuración de Desarrollo](docs/development-setup.md) - Cómo configurar el entorno de desarrollo
- [Guía Técnica de Hardware](docs/technical-hardware-guide.md) - Control de motores y solenoides con Arduino

## Para Usuarios No Técnicos

Este proyecto incluye documentación clara diseñada para ser comprensible por personal farmacéutico y otros interesados no técnicos. La aplicación de escritorio proporciona una interfaz intuitiva para monitorear operaciones sin requerir conocimiento técnico.

## Contribuciones

Por favor, lea nuestra guía de configuración de desarrollo y los registros de decisiones de arquitectura antes de contribuir al proyecto.

## Licencia

[Por determinar]