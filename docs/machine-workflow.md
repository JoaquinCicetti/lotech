# Proceso de Flujo de Trabajo de la Máquina

## Resumen
Este documento describe el flujo de trabajo completo de la máquina de procesamiento de píldoras Lotech, desde la configuración inicial hasta el empaquetado final. Esta guía está diseñada para ser entendida tanto por personal técnico como no técnico.

## Flujo de Trabajo Completo

### 1. Configuración Inicial
**Lo que ocurre**: El operador prepara la máquina para un nuevo lote
- Encender el sistema y la aplicación de escritorio
- Verificar que todos los componentes funcionen (motores, sensores, contenedores)
- Cargar contenedores vacíos para la salida procesada
- Establecer parámetros del lote (conteo esperado de píldoras, rangos de peso objetivo)

**Tiempo requerido**: ~5 minutos
**Participación del operador**: Alta - configuración manual requerida

### 2. Carga de Píldoras
**Lo que ocurre**: Introducción de píldoras al sistema
- El operador carga el lote completo de píldoras en la rueda rotatoria
- El sistema verifica que la rueda esté cargada correctamente
- La aplicación de escritorio muestra la información del lote y el estado de preparación

**Tiempo requerido**: ~2-3 minutos  
**Participación del operador**: Media - carga manual, verificación del sistema

### 3. Ciclo de Procesamiento Automatizado

#### 3.1 Dispensado Individual de Píldoras
**Lo que ocurre**: Las píldoras se liberan una a la vez
- La rueda rotatoria avanza una posición
- Se libera una sola píldora de la cámara de la rueda
- El sistema se pausa para asegurar que solo se dispensó una píldora
- Si se detectan múltiples píldoras, el sistema alerta y espera intervención del operador

**Tiempo por píldora**: ~2-3 segundos
**Participación del operador**: Mínima - solo monitoreo

#### 3.2 Pesado de Precisión
**Lo que ocurre**: Cada píldora se pesa individualmente
- La píldora cae en la celda de carga de precisión
- El sistema toma múltiples lecturas de peso para mayor precisión
- El peso se registra con marca de tiempo
- Las píldoras fuera del rango de peso aceptable activan alertas
- La píldora se libera luego de la estación de pesado

**Tiempo por píldora**: ~3-5 segundos
**Participación del operador**: Ninguna - proceso automático

#### 3.3 Recolección y Transferencia
**Lo que ocurre**: Las píldoras se mueven a la cámara de mezclado
- Las píldoras pesadas se dirigen a la cámara del mezclador
- El sistema rastrea el conteo total de píldoras y peso acumulativo
- La cámara se llena hasta que el lote esté completo o se alcance la capacidad de la cámara

**Tiempo**: Continuo durante el proceso de pesado
**Participación del operador**: Ninguna - proceso automático

### 4. Mezclado y Triturado
**Lo que ocurre**: Las píldoras se procesan juntas
- El motor del mezclador se activa cuando la cámara contiene la cantidad óptima de píldoras
- Las píldoras se muelen juntas para consistencia uniforme
- La duración del mezclado se basa en el tipo de píldora y cantidad
- El sistema monitorea la carga del motor para asegurar un triturado adecuado

**Tiempo requerido**: ~5-15 minutos (dependiendo del tamaño del lote)
**Participación del operador**: Ninguna - proceso automático con monitoreo

### 5. Llenado de Contenedores
**Lo que ocurre**: El material procesado se transfiere a contenedores
- El material molido se transfiere a contenedores etiquetados
- El sistema rastrea los niveles de llenado y pesos
- Múltiples contenedores pueden llenarse de un lote
- Cada contenedor se pesa y registra

**Tiempo requerido**: ~2-5 minutos
**Participación del operador**: Baja - colocación y remoción de contenedores

### 6. Control de Calidad y Documentación
**Lo que ocurre**: El sistema genera reportes del lote
- Cálculos finales de peso y reportes de varianza
- Estadísticas de peso de píldoras individuales
- Tiempos de proceso y cualquier excepción registrada
- Se genera certificado de finalización del lote
- Datos almacenados para cumplimiento regulatorio

**Tiempo requerido**: ~1 minuto
**Participación del operador**: Media - revisión y aprobación del reporte

## Monitoreo del Proceso

### Visualización en Tiempo Real
La aplicación de escritorio muestra continuamente:
- Paso actual del proceso y progreso
- Pesos individuales de píldoras y estadísticas en ejecución
- Estado del sistema y cualquier alerta
- Tiempo estimado de finalización
- Comparación histórica de lotes

### Alertas e Intervenciones
El sistema alertará a los operadores por:
- Píldoras fuera del rango de peso aceptable
- Múltiples píldoras dispensadas simultáneamente
- Mal funcionamiento del equipo o errores de sensores
- Contenedor lleno o faltante
- Tiempos de procesamiento inusuales

### Características de Seguridad
- Capacidad de parada de emergencia en cualquier etapa
- Apagado automático en errores críticos
- Protección contra sobrecarga del motor
- Verificación de calibración de sensores
- Registro de procesos para resolución de problemas

## Tiempos Típicos de Procesamiento de Lotes

| Tamaño del Lote | Tiempo Total | Píldoras/Minuto |
|-----------------|--------------|-----------------|
| 100 píldoras    | ~15 mins     | ~7             |
| 500 píldoras    | ~60 mins     | ~8             |
| 1000 píldoras   | ~110 mins    | ~9             |

*Los tiempos incluyen configuración, procesamiento y documentación*

## Habilidades del Operador Requeridas

### Entrenamiento Mínimo Requerido
- Operación básica de computadora
- Comprensión de parámetros de lotes
- Reconocimiento de condiciones de alerta
- Manejo y etiquetado de contenedores

### No se Necesitan Habilidades Técnicas
- Sin programación o configuración
- Sin mantenimiento de equipo durante operación
- Sin resolución compleja de problemas requerida

## Cronograma de Mantenimiento
- Diario: Inspección visual y limpieza
- Semanal: Verificación de calibración
- Mensual: Limpieza detallada y verificación de componentes
- Según necesidad: Soporte técnico para reparaciones