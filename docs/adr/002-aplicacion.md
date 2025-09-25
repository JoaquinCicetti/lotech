# ADR-002: Tecnología de Aplicación de Escritorio

## Estado
**Implementado**

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

### 1. Electron + React ✅

- **Ventajas**: Ecosistema maduro, gran comunidad, muchas librerías disponibles, tecnología conocida
- **Desventajas**: Bundle más grande, mayor consumo de recursos
- **Comunicación Serial**: Package `serialport` de npm muy establecido y confiable

### 2. Tauri + React

- **Ventajas**: Bundle pequeño, excelente rendimiento, APIs nativas
- **Desventajas**: Framework nuevo, menor ecosistema, requiere Rust
- **Comunicación Serial**: APIs nativas pero menos documentación

### 3. Next.js + Capacitor

- **Ventajas**: React familiar, buena documentación
- **Desventajas**: Principalmente para móvil, limitaciones desktop
- **Comunicación Serial**: Limitada para aplicaciones desktop

## Decisión

**Implementamos Electron + React** como la tecnología principal para la aplicación de escritorio.

### Justificación Técnica

- **Ecosistema Maduro**: Miles de aplicaciones en producción (VS Code, Discord, Slack)
- **Comunicación Serial Probada**: El paquete `serialport` es el estándar de la industria
- **Desarrollo Rápido**: Amplia documentación y recursos disponibles
- **Multiplataforma Real**: Un código funciona en Windows, Mac y Linux
- **Integración Completa**: Proceso main/renderer permite control total del hardware

### Justificación para el Proyecto

- **Confiabilidad Industrial**: Tecnología probada en entornos de producción 24/7
- **Integración PlatformIO**: Comunicación directa con Arduino via serialport
- **Experiencia de Usuario**: React + shadcn/ui para interfaces modernas
- **Gestión con pnpm**: Instalación eficiente de dependencias
- **Soporte Comunitario**: Soluciones disponibles para cualquier problema

## Stack Tecnológico Implementado

- **Framework**: Electron 28+
- **Build Tool**: electron-vite
- **Package Manager**: pnpm
- **Frontend**: React 18 con TypeScript
- **UI Library**: shadcn/ui con Tailwind CSS
- **Estado**: Zustand
- **Comunicación Serial**: serialport 12.0.0
- **Base de Datos**: SQLite con better-sqlite3
- **Bundler**: electron-builder para distribución

## Implementación Actual

### Estructura del Proyecto
```
app/
├── src/
│   ├── main/          # Proceso principal (Node.js)
│   │   └── index.ts   # Control serial y ventanas
│   ├── preload/       # Bridge seguro
│   │   └── index.ts   # APIs expuestas al renderer
│   └── renderer/      # UI React
│       ├── App.tsx
│       └── components/
```

### Comunicación Serial Implementada
- Puerto serial manejado en proceso main
- Comunicación via IPC con el renderer
- Auto-detección de Arduino Mega
- Reconexión automática
- Protocolo JSON para comandos

## Consecuencias

### Positivas (Confirmadas)

- ✅ Desarrollo rápido y estable
- ✅ Comunicación serial 100% funcional
- ✅ Interfaz moderna con React y shadcn/ui
- ✅ Distribución simple con electron-builder
- ✅ Hot-reload funcional para desarrollo
- ✅ Debugging completo con Chrome DevTools

### Negativas (Aceptadas)

- Bundle de ~100MB (aceptable para uso industrial)
- Consumo RAM ~200MB (no crítico para PCs dedicadas)
- Tiempo de inicio ~2-3 segundos

### Neutrales

- Actualizaciones automáticas posibles pero no implementadas
- Firma de código necesaria para distribución comercial

## Notas de Implementación

- IPC channels implementados: `serial:list`, `serial:open`, `serial:close`, `serial:write`
- Evento `serial:data` para datos entrantes del Arduino
- Manejo de errores robusto con reconexión automática
- Logs guardados en archivos para debugging
- Configuración persistente con electron-store

## Lecciones Aprendidas

1. **Electron fue la decisión correcta**: La madurez del ecosistema permitió desarrollo rápido
2. **serialport funciona perfectamente**: Sin problemas de compatibilidad
3. **electron-vite simplifica el desarrollo**: Hot-reload y build optimizado
4. **shadcn/ui acelera el UI**: Componentes listos para usar

## Referencias

- [Documentación Electron](https://www.electronjs.org/)
- [serialport npm](https://serialport.io/)
- [electron-vite](https://electron-vite.org/)
- [shadcn/ui](https://ui.shadcn.com/)