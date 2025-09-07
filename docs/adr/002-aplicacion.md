# ADR-002: Tecnología de Aplicación de Escritorio

## Contexto

Necesitamos desarrollar una aplicación de escritorio multiplataforma (Mac y Windows) con las siguientes características:

- Interfaz de usuario React moderna y responsiva
- Comunicación serial con Arduino para control de hardware
- Capacidades de monitoreo en tiempo real
- Registro y análisis de datos de lotes
- Experiencia de usuario intuitiva para personal farmacéutico no técnico
- Uso de tecnologías conocidas y establecidas
- Integración con PlatformIO para desarrollo Arduino
- Gestión de paquetes con pnpm

## Opciones Consideradas

### 1. Electron + React

- **Ventajas**: Ecosistema maduro, gran comunidad, muchas librerías disponibles, tecnología conocida
- **Desventajas**: Bundle más grande, mayor consumo de recursos
- **Comunicación Serial**: Package `serialport` de npm muy establecido y confiable

### 2. Tauri + React

- **Ventajas**: Bundle pequeño, excelente rendimiento, APIs nativas
- **Desventajas**: Framework nuevo, menor ecosistema, tecnología menos conocida
- **Comunicación Serial**: APIs nativas pero menos documentación

### 3. Next.js + Capacitor

- **Ventajas**: React familiar, buena documentación
- **Desventajas**: Principalmente para móvil, limitaciones desktop
- **Comunicación Serial**: Limitada para aplicaciones desktop

## Decisión

Seleccionaremos **Tauri + React** como la tecnología principal para la aplicación de escritorio por las siguientes razones:

### Justificación Técnica

- **Rendimiento Superior**: Backend nativo en Rust con frontend React
- **Bundle Pequeño**: ~10MB vs ~100MB+ de Electron, facilitando distribución
- **Seguridad Moderna**: Arquitectura de seguridad robusta con permisos granulares
- **APIs Nativas**: Acceso directo a funcionalidades del sistema operativo
- **Comunicación Serial**: Plugin oficial de Tauri para comunicación serial confiable

### Justificación para el Proyecto

- **Eficiencia Industrial**: Rendimiento óptimo para operación continua 24/7
- **Integración PlatformIO**: Se complementa perfectamente con el desarrollo Arduino
- **Experiencia de Usuario**: React permite interfaces modernas y responsivas
- **Gestión con pnpm**: Package manager eficiente para el proyecto
- **Tecnología Moderna**: Framework con roadmap de desarrollo activo

## Consecuencias

### Positivas

- Aplicación rápida y eficiente con bajo consumo de recursos
- Bundle pequeño (~10MB) facilita distribución e instalación
- Interfaz de usuario moderna con React y librerías UI estándar
- Comunicación serial nativa y confiable con plugin oficial
- Mayor seguridad por diseño con sistema de permisos
- Desarrollo activo y comunidad creciente
- Integración perfecta con PlatformIO para Arduino

### Negativas

- Framework más nuevo, menor ecosistema comparado con Electron
- Curva de aprendizaje para desarrolladores no familiarizados con Tauri
- Requiere Rust instalado para desarrollo (pero no para distribución)
- Menos recursos de troubleshooting online comparado con Electron

### Neutrales

- Documentación en crecimiento pero suficiente para el proyecto
- Stack tecnológico moderno que representa el futuro del desarrollo desktop
- Compilación nativa puede tomar más tiempo inicial

## Stack Tecnológico Completo

- **Framework**: Tauri 1.5+
- **Package Manager**: pnpm
- **Frontend**: React 18+ con TypeScript
- **UI Library**: Material-UI (MUI) o Ant Design
- **Estado**: Redux Toolkit o Zustand
- **Comunicación Serial**: Plugin oficial `@tauri-apps/plugin-serialport`
- **Base de Datos Local**: SQLite con plugin de Tauri
- **Build Tool**: Vite (incluido con Tauri)
- **Bundler**: Tauri CLI

## Notas de Implementación

- Usar comandos Tauri para comunicación segura backend-frontend
- Implementar manejo robusto de errores de comunicación serial
- Configurar permisos apropiados para acceso a puertos seriales
- Establecer protocolo JSON para comunicación con Arduino
- Crear sistema de logging completo para troubleshooting
- Usar plugin de store de Tauri para persistencia de configuraciones
- Implementar auto-updater con el sistema integrado de Tauri
- Configurar hot-reload para desarrollo eficiente

## Referencias

- [Documentación oficial de Tauri](https://tauri.app/)
- [Plugin Serialport de Tauri](https://github.com/tauri-apps/plugins-workspace/tree/v1/plugins/serialport)
- [Guías de Tauri + React](https://tauri.app/v1/guides/getting-started/setup/react/)
- [Mejores prácticas de seguridad en Tauri](https://tauri.app/v1/references/architecture/security/)
