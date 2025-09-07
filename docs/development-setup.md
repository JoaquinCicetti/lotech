# Guía de Configuración de Desarrollo

## Prerrequisitos

### Para Todos
- Comprensión básica del [flujo de trabajo de la máquina](machine-workflow.md)
- Acceso a los componentes de hardware o entorno de simulación

### Para Desarrollo Arduino
- **Arduino IDE** o **PlatformIO** (recomendado)
- **Cable USB** para conexión Arduino
- **Placa Arduino** (Uno, Nano, o compatible)
- **Librerías requeridas**: HX711 (celda de carga), motores paso a paso, I/O básico

### Para Desarrollo de Aplicación de Escritorio
- **Entorno de desarrollo** (por determinar según el framework elegido)
- **Librerías de comunicación serial** para interfaz Arduino
- **Base de datos** para logging y reportes (SQLite recomendado por simplicidad)

## Inicio Rápido

### 1. Clonar el Repositorio
```bash
git clone [url-del-repositorio]
cd lotech
```

### 2. Configuración Arduino
```bash
cd arduino
# Instalar librerías requeridas a través del Gestor de Librerías del Arduino IDE:
# - HX711 Arduino Library (para celda de carga)
# - AccelStepper (para control de motores)
# - Librerías adicionales según se especifica en arduino/README.md
```

### 3. Configuración de Aplicación de Escritorio
```bash
cd desktop-app
# Seguir instrucciones de configuración específicas del framework en desktop-app/README.md
```

## Flujo de Trabajo de Desarrollo

### Desarrollo Arduino
1. **Conectar Hardware**: Conectar Arduino a la computadora vía USB
2. **Abrir Proyecto**: Cargar el proyecto arduino en tu IDE
3. **Configurar Placa**: Seleccionar el tipo correcto de placa Arduino y puerto
4. **Cargar**: Compilar y cargar firmware al Arduino
5. **Probar**: Usar Monitor Serial para verificar funcionalidad
6. **Depurar**: Monitorear salida serial para resolución de problemas

### Desarrollo de Aplicación de Escritorio
1. **Iniciar Servidor de Desarrollo**: Seguir instrucciones específicas del framework
2. **Conectar a Arduino**: Asegurar que Arduino esté conectado y firmware cargado
3. **Probar Comunicación**: Verificar que la app de escritorio pueda comunicarse con Arduino
4. **Desarrollar Características**: Construir componentes de UI y lógica de control
5. **Probar Integración**: Probar flujo de trabajo completo con hardware

## Configuración de Hardware para Desarrollo

### Configuración Mínima (Probando Funciones Básicas)
- Placa Arduino
- Protoboard y cables jumper
- LED (simulación de motor)
- Potenciómetro (simulación de celda de carga)
- Botón pulsador (controles manuales)

### Configuración Completa de Hardware
- Placa Arduino con shields apropiados
- Motores paso a paso para rotación de rueda
- Solenoides para control de flujo de píldoras
- Amplificador HX711 para celda de carga y celda de carga
- Drivers de motor y fuentes de alimentación
- Interruptores de parada de emergencia
- LEDs indicadores de estado

## Pruebas

### Pruebas Arduino
```bash
# Conectar al monitor serial Arduino
# Salida esperada: lecturas de sensores, estado del motor, estado del sistema
# Comandos de prueba: control manual del motor, rutinas de calibración
```

### Pruebas de Aplicación de Escritorio
- **Pruebas Unitarias**: Probar componentes y funciones individuales
- **Pruebas de Integración**: Probar comunicación Arduino
- **Pruebas End-to-End**: Probar simulación completa del flujo de trabajo
- **Pruebas de Interfaz de Usuario**: Probar todas las interacciones de usuario

### Pruebas de Integración de Hardware
- **Calibración de Sensores**: Verificación de precisión de celda de carga
- **Control de Motores**: Pruebas de posicionamiento preciso y tiempos
- **Sistemas de Seguridad**: Parada de emergencia y manejo de errores
- **Comunicación**: Transferencia confiable de datos entre componentes

## Depuración de Problemas Comunes

### Problemas Arduino
- **Falla la Carga**: Verificar selección de placa y configuración de puerto
- **Comunicación Serial**: Verificar que las configuraciones de baud rate coincidan
- **Lecturas de Sensores**: Verificar cableado y fuente de alimentación
- **Control de Motores**: Verificar conexiones del driver y requerimientos de energía

### Problemas de Aplicación de Escritorio
- **Sin Conexión Arduino**: Verificar conexión USB y drivers
- **Errores de Comunicación**: Verificar configuraciones de puerto serial y protocolos
- **Problemas de Rendimiento**: Monitorear recursos del sistema y optimizar

### Problemas de Hardware
- **Lecturas Inconsistentes**: Verificar calibración de sensores y cableado
- **Problemas de Motores**: Verificar capacidad de fuente de alimentación y conexiones
- **Problemas Mecánicos**: Verificar obstrucciones físicas o desgaste

## Organización del Código

### Estructura Arduino
```
arduino/
├── lotech_controller/
│   ├── lotech_controller.ino    # Sketch principal Arduino
│   ├── motors.ino               # Funciones de control de motores
│   ├── sensors.ino              # Funciones de lectura de sensores
│   ├── communication.ino        # Comunicación serial
│   └── safety.ino               # Seguridad y manejo de errores
├── libraries/                   # Librerías personalizadas
└── README.md                   # Documentación específica Arduino
```

### Estructura de Aplicación de Escritorio
```
desktop-app/
├── src/                        # Código fuente
├── tests/                      # Archivos de prueba
├── docs/                       # Documentos específicos de aplicación
├── assets/                     # Assets de UI y recursos
└── README.md                  # Documentación de app de escritorio
```

## Guías de Contribución

### Antes de Comenzar el Desarrollo
1. Leer las [decisiones de arquitectura](adr/) para entender el diseño del sistema
2. Revisar código existente para patrones y convenciones
3. Configurar completamente tu entorno de desarrollo
4. Ejecutar pruebas existentes para asegurar que todo funciona

### Proceso de Desarrollo
1. **Crear Rama de Característica**: Usar nombres descriptivos para ramas
2. **Seguir Estilo de Código**: Mantener consistencia con código existente
3. **Escribir Pruebas**: Incluir pruebas para nueva funcionalidad
4. **Documentar Cambios**: Actualizar documentación relevante
5. **Probar Integración**: Verificar que los cambios funcionen con el sistema completo

### Lista de Verificación para Revisión de Código
- [ ] El código sigue las convenciones del proyecto
- [ ] Todas las pruebas pasan
- [ ] Documentación actualizada
- [ ] Integración de hardware probada
- [ ] Consideraciones de seguridad abordadas

## Obtener Ayuda

### Recursos de Documentación
- [Flujo de Trabajo de la Máquina](machine-workflow.md) - Entendiendo el proceso
- [Decisiones de Arquitectura](adr/) - Justificación de decisiones técnicas
- [Guía Técnica de Hardware](technical-hardware-guide.md) - Control detallado de componentes
- Archivos README específicos por componente en cada directorio

### Preguntas Comunes de Desarrollo
- **"Arduino no se conecta"**: Verificar drivers, permisos de puerto y cable
- **"La app de escritorio no encuentra Arduino"**: Verificar configuraciones de puerto y firmware Arduino
- **"Las lecturas de sensores están mal"**: Se necesita verificación de calibración y cableado
- **"Los motores no funcionan correctamente"**: Problemas de configuración de fuente de alimentación y driver

### Contactos de Soporte
- **Problemas de Hardware**: [Información de contacto para soporte de hardware]
- **Problemas de Software**: [Información de contacto para soporte de software]
- **Preguntas de Proceso**: [Información de contacto para soporte de proceso/flujo de trabajo]