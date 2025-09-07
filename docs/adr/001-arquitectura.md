# ADR-001: Arquitectura General del Sistema

## Contexto

Necesitamos diseñar un sistema automatizado de procesamiento de píldoras para la industria farmacéutica. El sistema debe:

- Manejar lotes completos de píldoras desde la introducción hasta el empaquetado
- Proporcionar pesado preciso de píldoras individuales
- Procesar píldoras a través de triturado y mezclado
- Ofrecer capacidades de monitoreo y control para operadores
- Ser confiable y mantenible para uso industrial

La solución necesita servir tanto a desarrolladores técnicos como al personal farmacéutico no técnico que operará la máquina diariamente.

## Decisión

Implementaremos una arquitectura distribuida con dos componentes principales:

### 1. Controlador de Hardware Basado en Arduino

- **Propósito**: Control en tiempo real de todos los componentes mecánicos
- **Responsabilidades**:
  - Control de motores (rotación de rueda, operación de mezclador)
  - Operación de solenoides (flujo de píldoras, manejo de contenedores)
  - Adquisición y procesamiento de datos de celda de carga
  - Monitoreo de seguridad y paradas de emergencia
- **Comunicación**: Conexión Serial/USB a aplicación de escritorio

### 2. Aplicación de Monitoreo de Escritorio

- **Propósito**: Interfaz humano-máquina y visualización de procesos
- **Responsabilidades**:
  - Monitoreo de procesos en tiempo real
  - Registro histórico de datos y análisis
  - Interfaz de control para operador
  - Reportes y documentación de lotes
- **Tecnología**: Aplicación de escritorio multiplataforma (por determinar en ADR futuro)

### Beneficios de la Arquitectura del Sistema

- **Separación de Responsabilidades**: Control de hardware aislado de la interfaz de usuario
- **Confiabilidad**: Arduino proporciona control determinístico en tiempo real
- **Mantenibilidad**: Diseño modular permite actualizaciones independientes
- **Usabilidad**: App de escritorio proporciona experiencia rica para el usuario
- **Escalabilidad**: La arquitectura soporta mejoras futuras

## Consecuencias

### Positivas

- Control de hardware en tiempo real con la confiabilidad de Arduino
- Capacidades ricas de interfaz de usuario con aplicación de escritorio
- Separación clara entre lógica de control e interfaz de usuario
- La experiencia existente puede aprovecharse tanto para desarrollo Arduino como de escritorio
- Fácil de probar y depurar componentes independientemente
- Solución costo-efectiva usando componentes estándar

### Negativas

- Requiere protocolo de comunicación entre Arduino y app de escritorio
- Dos bases de código separadas para mantener
- Dependencia en la confiabilidad de la conexión USB/Serial
- Despliegue más complejo que solución de aplicación única

### Neutrales

- Patrón de arquitectura estándar para automatización industrial
- Herramientas de desarrollo y librerías bien establecidas disponibles
- Límites claros para especialización futura de miembros del equipo

## Notas de Implementación

- El firmware Arduino debe priorizar seguridad y control en tiempo real
- La aplicación de escritorio debe manejar todo el procesamiento complejo de datos y almacenamiento
- El protocolo de comunicación debe ser robusto e incluir manejo de errores
- Ambos componentes deben registrar eventos relevantes para resolución de problemas

## Referencias

- Mejores prácticas de automatización industrial
- Patrones de control en tiempo real con Arduino
- Principios de diseño de interfaz humano-máquina
