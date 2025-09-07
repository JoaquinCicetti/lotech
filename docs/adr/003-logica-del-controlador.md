# ADR-003: Lógica del Controlador

## 1. Context

Se necesita una máquina de estados finitos (MEF) alineada 1:1 con el flujo físico de la celda: **ascensor → dosificación → pesaje → traspaso** (en bucle hasta completar lote) → **molienda → descarga → cierre de frasco → retiro**. Debe ser simple, determinista y fácil de llevar a firmware (Arduino/C++) y a la UI (Electron).

## 2. Decision

Adoptar una **MEF de 9 estados (0–8)**, con transiciones deterministas y acciones declarativas (placeholders) que luego se implementan en el controlador real. El firmware usará estructura **switch-case** y temporizadores/sensores parametrizables.

## 3. State Machine

### 3.1 Estados (definición)

- **ESTADO 0 — INICIO**: Entrada por botón START (condiciones: pastillas cargadas, frasco vacío, equipo ON). Acción: habilitar ascensor (Motor 1).
- **ESTADO 1 — ASCENSOR**: Motor 1 eleva el frasco hasta tope (sensor `S_POS_ALTA` o tiempo `T_ELEV_UP`).
- **ESTADO 2 — DOSIFICACIÓN**: Motor 2 (NEMA‑17) gira **una posición** ≈ `360°/21`. Dejar tiempo de asentamiento `T_STEP_SETTLE`.
- **ESTADO 3 — PESAJE**: Celda de carga mide y espera estabilidad `T_WEIGHT_SETTLE`/`S_WEIGHT_STABLE`.
- **ESTADO 4 — TRASPASO**: Solenoide 1 empuja pastilla de la balanza al frasco por `T_TRANSFER` y vuelve a reposo.
- **ESTADO 5 — MOLIENDA**: Motor 3 (AC) activa molinillo por `T_GRIND`.
- **ESTADO 6 — DESCARGA**: Motor 1 desciende frasco a posición baja (sensor `S_POS_BAJA` o `T_ELEV_DOWN`).
- **ESTADO 7 — CIERRE FRASCO**: Solenoide 2 empuja/cierra tapa `T_CAP_PUSH`.
- **ESTADO 8 — RETIRO**: Fin de ciclo; frasco listo para retiro. Vuelve a `ESTADO 0` con `RESET`/ACK.

### 3.2 Transiciones

```
0 --START--> 1 --FrascoArriba--> 2 --Giro+Asenta--> 3 --PesoOK--> 4
4 --(pastillas < target)--> 2  |  4 --(pastillas == target)--> 5
5 --t--> 6 --FrascoAbajo--> 7 --t--> 8 --ACK/RESET--> 0
```

### 3.3 I/O

**Actuadores**: `A_ELEV` (subir/bajar/stop), `A_WHEEL` (paso), `A_SOL_TRANSFER`, `A_GRINDER`, `A_CAP_PUSH`, `A_BUZZ/LED` (opcional).  
**Sensores (opcionales)**: `S_POS_ALTA`, `S_POS_BAJA`, `S_WEIGHT_STABLE` (si no existen, se reemplazan por temporizadores).

## 4. Pseudocódigo de referencia (Arduino/C++)

```cpp
enum State { ESTADO0, ESTADO1, ESTADO2, ESTADO3, ESTADO4, ESTADO5, ESTADO6, ESTADO7, ESTADO8 };
State st = ESTADO0; int pastillas = 0; int target = 20; // o 21 según rueda
uint32_t t0;

// Acciones (placeholders)
void motorAscensorUp();   void motorAscensorDown(); void motorAscensorStop();
void motorDosificarPaso();
void motorMolinilloOn();  void motorMolinilloOff();
void solTransferOn();     void solTransferOff();
void solTapaOn();         void solTapaOff();

// Sensores o timers
bool posAlta(); bool posBaja(); bool pesoEstable();
bool elapsed(uint32_t t, uint32_t ms); bool timeout(uint32_t ms);

void loopMEF(){
  switch(st){
    case ESTADO0:
      if (btnStart && frascoVacio && pastillasCargadas){ motorAscensorUp(); st=ESTADO1; }
      break;
    case ESTADO1:
      if (posAlta() || timeout(T_ELEV_UP)){ motorAscensorStop(); motorDosificarPaso(); t0=millis(); st=ESTADO2; }
      break;
    case ESTADO2: // DOSIFICACIÓN (asentamiento)
      if (elapsed(t0, T_STEP_SETTLE)){ st=ESTADO3; t0=millis(); }
      break;
    case ESTADO3: // PESAJE
      if (elapsed(t0, T_WEIGHT_SETTLE) && pesoEstable()){ solTransferOn(); t0=millis(); st=ESTADO4; }
      break;
    case ESTADO4: // TRASPASO
      if (elapsed(t0, T_TRANSFER)){
        solTransferOff(); pastillas++;
        if(pastillas < target){ motorDosificarPaso(); t0=millis(); st=ESTADO2; }
        else { motorMolinilloOn(); t0=millis(); st=ESTADO5; }
      }
      break;
    case ESTADO5: // MOLIENDA
      if (elapsed(t0, T_GRIND)){ motorMolinilloOff(); motorAscensorDown(); t0=millis(); st=ESTADO6; }
      break;
    case ESTADO6: // DESCARGA
      if (posBaja() || timeout(T_ELEV_DOWN)){ motorAscensorStop(); solTapaOn(); t0=millis(); st=ESTADO7; }
      break;
    case ESTADO7: // CIERRE FRASCO
      if (elapsed(t0, T_CAP_PUSH)){ solTapaOff(); st=ESTADO8; }
      break;
    case ESTADO8: // RETIRO
      if (btnReset){ pastillas=0; st=ESTADO0; }
      break;
  }
}
```

**Parámetros iniciales sugeridos (ms)**:  
`T_STEP_SETTLE=150`, `T_WEIGHT_SETTLE=200`, `T_TRANSFER=120`, `T_GRIND=5000`, `T_CAP_PUSH=250`, `T_ELEV_UP=800`, `T_ELEV_DOWN=800`. Se harán configurables por UI.

## 5. Alternatives Considered

- MEF genérica `INIT/IDLE/RUNNING/...`: más abstracta, pero menos alineada al proceso físico.
- Bucle secuencial sin estados explícitos: rápido para prototipo, difícil de depurar/escale.

## 6. Consequences

- **Pros**: mapa 1:1 con etapas físicas; fácil de simular e instrumentar; legible.
- **Contras**: más estados explícitos; requiere parametrización de tiempos.

## 7. Rollout Plan

1. Implementar placeholders de actuadores/sensores en el firmware.
2. Exponer timers `T_*` y `target` vía UI.
3. Prueba en seco y con carga real (lote completo).
4. Afinar tiempos y tolerancias.

## 8. Open Questions

- Target de lote ¿20 o 21 (según rueda)?
- ¿Confirmación de tapa por sensor o por tiempo fijo?
- ¿Registro de peso por píldora o solo verificación de estabilidad?
