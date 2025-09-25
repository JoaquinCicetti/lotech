# Flujo de Trabajo - Lotech

## Proceso Completo

### 1. Preparación (5 minutos)
- Encender el sistema
- Abrir aplicación Lotech
- Conectar al Arduino (puerto COM)
- Cargar contenedores vacíos

### 2. Carga de Píldoras (2 minutos)
- Introducir píldoras en la rueda rotatoria
- Verificar que estén bien distribuidas
- Cerrar tapa de seguridad

### 3. Configuración en App
- **Modo Manual** (Pruebas):
  - Control individual de cada componente
  - Ideal para verificar funcionamiento
  - Permite ajustes precisos

- **Modo Automático** (Producción):
  - Ingresar cantidad de píldoras
  - Configurar peso esperado (opcional)
  - Presionar "Iniciar Proceso"

### 4. Proceso Automático

#### Dispensado (2-3 seg/píldora)
- Rueda gira una posición
- Píldora cae por gravedad
- Sistema verifica caída correcta

#### Pesado (3-5 seg/píldora)
- Celda de carga mide peso
- Registro en base de datos
- Alerta si peso fuera de rango

#### Mezclado (5-15 minutos total)
- Píldoras acumuladas en mezclador
- Triturado uniforme
- Control de velocidad automático

#### Empaquetado (2-5 minutos)
- Material procesado a contenedores
- Pesado final del lote
- Etiquetado con información del proceso

### 5. Finalización
- Reporte automático generado
- Datos guardados (fecha, pesos, tiempos)
- Limpieza de componentes

## Tiempos Estimados

| Cantidad | Tiempo Total |
|----------|-------------|
| 100 píldoras | 15 minutos |
| 500 píldoras | 60 minutos |
| 1000 píldoras | 110 minutos |

## Alertas Comunes

### Alerta Amarilla (Advertencia)
- Peso fuera de rango ±10%
- Velocidad de procesamiento lenta
- Contenedor casi lleno

### Alerta Roja (Detención)
- Múltiples píldoras atascadas
- Fallo de motor
- Error de comunicación Arduino
- Contenedor no detectado

## Resolución Rápida de Problemas

| Problema | Solución |
|----------|----------|
| Píldoras atascadas | Modo manual → Girar rueda lentamente |
| Peso incorrecto | Recalibrar celda (botón Calibrar) |
| Motor no responde | Verificar conexión y reiniciar |
| Sin comunicación | Reconectar USB y puerto COM |

## Mantenimiento Post-Proceso

### Después de cada lote:
- Limpiar residuos de rueda
- Vaciar mezclador completamente
- Verificar solenoide libre

### Al final del día:
- Apagar sistema ordenadamente
- Cubrir componentes mecánicos
- Registrar anomalías en bitácora

## Consejos de Operación

1. **Empezar siempre en modo manual** para verificar que todo funcione

2. **No sobrecargar la rueda** - Distribuir píldoras uniformemente

3. **Monitorear primer lote** del día más atentamente

4. **Mantener registro escrito** de calibraciones y ajustes

5. **No forzar componentes** - Si algo no gira, revisar antes de aplicar fuerza