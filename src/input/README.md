# Módulo de Entrada (Input)

El módulo de entrada proporciona un sistema completo para manejar la entrada del usuario, incluyendo teclado, mouse y touch. Está diseñado para integrarse perfectamente con el sistema ECS del motor.

## Componentes Principales

### InputManager (Singleton)

Gestiona todos los eventos de entrada del navegador y proporciona una API unificada para consultar el estado de la entrada.

### InputSystem (ECS System)

Sistema ECS que procesa entidades con componentes de entrada y aplica las acciones correspondientes.

### InputComponent

Componente que define cómo una entidad responde a la entrada del usuario.

## Características

### ✅ Teclado

- Detección de teclas presionadas, liberadas y mantenidas
- Soporte para múltiples teclas simultáneas
- Prevención de comportamientos por defecto del navegador
- Callbacks personalizados por tecla

### ✅ Mouse

- Eventos de click, movimiento y wheel
- Posición del mouse relativa al canvas
- Soporte para múltiples botones
- Delta de movimiento para cámaras/controles

### ✅ Touch

- Soporte completo para dispositivos táctiles
- Múltiples puntos de contacto simultáneos
- Datos de fuerza de presión (si está disponible)
- Eventos de inicio, movimiento y fin

### ✅ Integración ECS

- Componentes de entrada para entidades
- Sistema automático de procesamiento
- Bindings de teclas configurables
- Acciones personalizables

## Uso Básico

### Inicialización

```typescript
import { InputManager, InputSystem } from "./input";

// Obtener canvas del juego
const canvas = document.getElementById("game-canvas") as HTMLCanvasElement;

// Inicializar InputManager
const inputManager = InputManager.getInstance();
inputManager.initialize({
  canvas,
  preventDefaultKeys: [
    "Space",
    "ArrowUp",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
  ],
  enableTouch: true,
  enableMouse: true,
  enableKeyboard: true,
});

// Crear sistema de input para ECS
const inputSystem = new InputSystem();
engine.addSystem(inputSystem);
```

### Consultar Estado de Entrada

```typescript
// Verificar si una tecla está presionada
if (inputManager.isKeyPressed("KeyW")) {
  console.log("W key is held down");
}

// Verificar si se presionó en este frame
if (inputManager.isKeyJustPressed("Space")) {
  console.log("Space was just pressed");
}

// Obtener posición del mouse
const mousePos = inputManager.getMousePosition();
console.log("Mouse at:", mousePos.x, mousePos.y);

// Verificar botones del mouse
if (inputManager.isMouseButtonPressed(0)) {
  console.log("Left mouse button held");
}

// Obtener touches activos
const touches = inputManager.getTouches();
console.log("Active touches:", touches.length);
```

### Registrar Callbacks

```typescript
// Callback para tecla específica
inputManager.onKeyDown("Space", (event) => {
  console.log("Space pressed!", event);
});

// Callback para múltiples teclas
inputManager.onKeyDown(["ArrowUp", "KeyW"], (event) => {
  console.log("Move up!", event);
});

// Callbacks de mouse
inputManager.onMouseDown(0, (event) => {
  console.log("Left click at:", event.position);
});

inputManager.onMouseMove((event) => {
  console.log("Mouse moved to:", event.position);
  console.log("Delta:", event.deltaX, event.deltaY);
});

// Callbacks de touch
inputManager.onTouchStart((event) => {
  console.log("Touch started:", event.touches);
});
```

### Componente de Entrada ECS

```typescript
// Crear entidad con input
const player = new Entity();
player.addComponent("transform", new Transform(new Vector2(100, 100)));

// Crear componente de input personalizado
const inputComponent = inputSystem.createInputComponent({
  moveSpeed: 200,
  rotationSpeed: Math.PI * 2,
  mouseEnabled: true,
  touchEnabled: true,
});

// Configurar controles personalizados
inputComponent.keyBindings.set("KeyW", "moveUp");
inputComponent.keyBindings.set("KeyA", "moveLeft");
inputComponent.keyBindings.set("KeyS", "moveDown");
inputComponent.keyBindings.set("KeyD", "moveRight");
inputComponent.keyBindings.set("Space", "jump");

player.addComponent("input", inputComponent);
```

### Acciones Personalizadas

```typescript
// Escuchar acciones personalizadas
engine.events.on("inputAction", (event) => {
  switch (event.data.action) {
    case "jump":
      // Lógica de salto
      break;
    case "interact":
      // Lógica de interacción
      break;
    case "primaryAction":
      // Click izquierdo
      break;
  }
});
```

## Configuración Avanzada

### Prevenir Comportamientos por Defecto

```typescript
inputManager.initialize({
  canvas,
  preventDefaultKeys: [
    "Space", // Prevenir scroll
    "ArrowUp", // Prevenir scroll
    "ArrowDown", // Prevenir scroll
    "ArrowLeft", // Prevenir navegación
    "ArrowRight", // Prevenir navegación
    "Tab", // Prevenir cambio de foco
  ],
});
```

### Deshabilitar Tipos de Entrada

```typescript
inputManager.initialize({
  canvas,
  enableKeyboard: true, // Habilitar teclado
  enableMouse: true, // Habilitar mouse
  enableTouch: false, // Deshabilitar touch para desktop
});
```

### Controles para Múltiples Jugadores

```typescript
// Jugador 1 - WASD
const player1Input = inputSystem.createInputComponent();
player1Input.keyBindings.set("KeyW", "moveUp");
player1Input.keyBindings.set("KeyA", "moveLeft");
player1Input.keyBindings.set("KeyS", "moveDown");
player1Input.keyBindings.set("KeyD", "moveRight");

// Jugador 2 - Flechas
const player2Input = inputSystem.createInputComponent({
  mouseEnabled: false,
  touchEnabled: false,
});
player2Input.keyBindings.set("ArrowUp", "moveUp");
player2Input.keyBindings.set("ArrowLeft", "moveLeft");
player2Input.keyBindings.set("ArrowDown", "moveDown");
player2Input.keyBindings.set("ArrowRight", "moveRight");
```

## Integración con Motor

El módulo de entrada se integra automáticamente con el game loop del motor:

```typescript
// En el game loop
function update(deltaTime: number) {
  // El InputSystem se ejecuta automáticamente
  inputSystem.update(deltaTime);

  // InputManager actualiza estados internos
  inputManager.update();
}
```

## Códigos de Teclas Comunes

### Teclas de Movimiento

- `KeyW`, `KeyA`, `KeyS`, `KeyD` - WASD
- `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight` - Flechas

### Teclas de Acción

- `Space` - Espacio
- `Enter` - Enter
- `Escape` - Escape
- `ShiftLeft`, `ShiftRight` - Shift
- `ControlLeft`, `ControlRight` - Ctrl

### Teclas de Función

- `KeyF`, `KeyE`, `KeyQ`, etc. - Letras
- `Digit1`, `Digit2`, etc. - Números

### Botones del Mouse

- `0` - Botón izquierdo
- `1` - Botón central/rueda
- `2` - Botón derecho

## Eventos del Sistema

El sistema emite varios eventos que puedes escuchar:

```typescript
// Eventos de teclado
engine.events.on("keyDown", (event) => {
  console.log("Key pressed:", event.data.key);
});

engine.events.on("keyUp", (event) => {
  console.log("Key released:", event.data.key);
});

// Eventos de mouse
engine.events.on("mouseDown", (event) => {
  console.log("Mouse button pressed:", event.data.button);
});

engine.events.on("mouseMove", (event) => {
  console.log("Mouse moved:", event.data.event.position);
});

// Eventos de touch
engine.events.on("touchStart", (event) => {
  console.log("Touch started:", event.data.event.touches);
});

// Eventos de acciones
engine.events.on("inputAction", (event) => {
  console.log("Action triggered:", event.data.action);
});
```

## Limpieza de Recursos

Importante limpiar los recursos cuando el juego termina:

```typescript
// Al destruir el motor o cambiar de escena
inputManager.destroy();
```

## Notas de Implementación

- El InputManager es un singleton para evitar múltiples listeners
- Los estados "just pressed/released" se limpian automáticamente cada frame
- Los eventos de touch previenen el comportamiento por defecto del navegador
- El sistema maneja automáticamente la pérdida de foco de la ventana
- Compatible con todos los navegadores modernos

## Ejemplo Completo

Ver `examples/input-example.ts` para un ejemplo completo de implementación.
