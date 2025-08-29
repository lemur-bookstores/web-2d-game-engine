# 🎮 GameEngine 2D

Un motor de juegos 2D ligero y modular para navegadores web, construido con TypeScript y diseñado con una arquitectura ECS (Entity-Component-System).

## 🚀 Características

- ⚡ **Core Modular**

  - Game Loop con fixed timestep para física consistente
  - Sistema de eventos robusto para comunicación entre sistemas
  - Gestión de escenas para organizar tu juego
  - Matemáticas optimizadas para juegos 2D (Vector2, Transform)

- 🎨 **Renderizado**

  - Canvas 2D con soporte completo para sprites y formas
  - Sistema de texturas con AssetManager integrado
  - Renderizado optimizado con sistemas modulares

- 🔄 **ECS (Entity-Component-System)**

  - Sistema de entidades flexible para cualquier objeto del juego
  - Componentes reutilizables (transform, sprite, physics, collider)
  - Sistemas optimizados (Movement, Collision, Render, Input)

- 🎮 **Input y Física**
  - Sistema de entrada unificado (teclado, mouse, touch)
  - Sistema de colisiones para detección de impactos
  - Componentes de física para movimiento realista

## 🛠️ Estado del Desarrollo

### ✅ Completado

- **Core del Engine**

  - Sistema de eventos con comunicación entre sistemas
  - Game Loop con fixed timestep para física consistente
  - Gestión de escenas y entidades
  - Utilidades matemáticas (Vector2, Transform, Color)

- **Sistema de Renderizado**

  - Canvas 2D completamente funcional
  - Sistema de sprites y texturas
  - Renderizado de formas básicas (rectángulos, círculos)
  - AssetManager para carga de recursos
  - Sistema de capas y cámara 2D con seguimiento de entidades (v0.5.0)

- **ECS (Entity-Component-System)**

  - Sistema de entidades flexible
  - Componentes: transform, sprite, rectangle, physics, collider
  - Sistemas: Render, Input, Movement, Collision

- **Input y Física**

  - InputManager con soporte para teclado, mouse y touch
  - Sistema de colisiones 2D
  - Componentes de física básicos

- **Script Component (v0.5.1)**
  - Soporte oficial para componentes de script enlazados a entidades
  - Implementación de ScriptComponent, ScriptSystem y ScriptRegistry
  - Serialización y rehidratación de scripts por nombre
  - Ejemplo funcional en `examples/script-component/`
  - Tests unitarios y de integración para lifecycle y registro

### 🚧 En Desarrollo

- Sistema de animaciones avanzadas
- Integración Box2D para física realista
- Sistema de audio
- WebGL renderer (optimización)
- Tilemaps y editores de niveles

## 📦 Instalación

```bash
npm install atomic-game-engine2d
```

## 🎯 Guía de Inicio Rápido

### 1. Configuración HTML Básica

Primero, necesitas un canvas en tu HTML:

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Mi Juego 2D</title>
  </head>
  <body>
    <canvas id="gameCanvas" width="800" height="600"></canvas>
    <script type="module" src="game.js"></script>
  </body>
</html>
```

### 2. Crear tu Primer Juego

```typescript
import { GameEngine } from "atomic-game-engine2d";
import { Scene } from "atomic-game-engine2d/core/Scene";
import { Entity } from "atomic-game-engine2d/ecs/Entity";
import { EventSystem } from "atomic-game-engine2d/core/EventSystem";
import { RenderSystem } from "atomic-game-engine2d/graphics";
import { InputManager, InputSystem } from "atomic-game-engine2d/input";
import { INPUT_EVENTS } from "atomic-game-engine2d/types/event-const";

class MiJuego {
  private engine: GameEngine;
  private player: Entity;
  private eventSystem: EventSystem;
  private inputSystem: InputSystem;
  private inputManager: InputManager;

  constructor() {
    // 1. Obtener el canvas
    const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;

    // 2. Configurar Input Manager
    this.inputManager = InputManager.getInstance();
    this.inputManager.initialize({
      canvas,
      preventDefaultKeys: ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"],
      enableKeyboard: true,
      enableMouse: true,
    });

    // 3. Crear sistemas
    this.inputSystem = new InputSystem();
    this.eventSystem = EventSystem.getInstance();

    // 4. Configurar el motor
    this.engine = new GameEngine({
      canvas,
      width: 800,
      height: 600,
      renderer: "canvas2d",
      debug: false,
    });
  }

  async initialize() {
    // 1. Crear escena
    const gameScene = new Scene("game");

    // 2. Registrar sistemas ANTES de inicializar
    this.engine.addSystem(new RenderSystem());
    this.engine.addSystem(this.inputSystem);

    // 3. Registrar escena
    this.engine.addScene(gameScene);
    this.engine.setActiveScene("game");

    // 4. Inicializar motor
    await this.engine.initialize();

    // 5. Crear entidades
    this.createPlayer();

    // 6. Configurar controles
    this.setupControls();

    // 7. Iniciar el juego
    this.engine.start();
  }

  private createPlayer() {
    this.player = new Entity("player");

    // Posición del jugador
    this.player.addComponent({
      type: "transform",
      position: { x: 400, y: 300 },
      rotation: 0,
      scale: { x: 1, y: 1 },
    });

    // Apariencia del jugador
    this.player.addComponent({
      type: "rectangle",
      width: 50,
      height: 50,
      color: "#3498db",
    });

    // Añadir a la escena activa
    this.engine.getActiveScene().addEntity(this.player);
  }

  private setupControls() {
    this.eventSystem.on(INPUT_EVENTS.KEYDOWN, (event) => {
      const keyData = event.data as { code: string };
      const transform = this.player.getComponent("transform");
      if (!transform) return;

      const speed = 5;
      switch (keyData.code) {
        case "ArrowUp":
          transform.position.y -= speed;
          break;
        case "ArrowDown":
          transform.position.y += speed;
          break;
        case "ArrowLeft":
          transform.position.x -= speed;
          break;
        case "ArrowRight":
          transform.position.x += speed;
          break;
      }
    });
  }
}

// Iniciar el juego
const game = new MiJuego();
game.initialize();
```

### 3. Conceptos Clave

#### Entidades y Componentes

```typescript
// Crear una entidad
const enemy = new Entity("enemy");

// Añadir componentes
enemy.addComponent({
  type: "transform",
  position: { x: 100, y: 100 },
  rotation: 0,
  scale: { x: 1, y: 1 },
});

enemy.addComponent({
  type: "sprite",
  texture: "enemy-texture",
  width: 32,
  height: 32,
});

// Añadir a la escena
scene.addEntity(enemy);

## Física (Box2D) — Fallback y configuración

El motor soporta integración opcional con Box2D (WASM) para física realista. En entornos donde Box2D no está disponible (por ejemplo en la ejecución de tests sin WASM), el sistema entra en modo "fallback" y las llamadas a la física no lanzan errores; en su lugar las operaciones se ignorarán o se comportarán de forma mínima.

Para habilitar Box2D y usar la implementación completa:

1. Instala el paquete WASM compatible, por ejemplo:

  npm install box2d-wasm

2. Asegúrate de que tu bundler sirve y carga el binario WASM correctamente (Vite y bundlers modernos suelen manejar esto automáticamente si el paquete lo expone).

3. Inicializa el motor normalmente. Si Box2D se carga correctamente, el `PhysicsWorld` usará Box2D y activará colisiones, joints y efectos físicos reales.

Notas:
- Las pruebas y el entorno de CI pueden correr sin Box2D — el código está diseñado para fallar de forma segura.
- Si usas una variante diferente de Box2D (distintos empaquetados), algunas API o nombres de métodos pueden diferir; el motor aplica comprobaciones defensivas para soportar varias formas de binding, pero preferimos la práctica de usar `box2d-wasm` para compatibilidad máxima.
```

#### Cargar Texturas

```typescript
import { AssetManager } from "atomic-game-engine2d/assets/AssetManager";

// En tu función initialize()
const assetManager = AssetManager.getInstance();
await assetManager.loadTexture("player", "assets/player.png");

// Usar en un componente sprite
entity.addComponent({
  type: "sprite",
  texture: "player",
  width: 48,
  height: 48,
});
```

## 🔍 Ejemplos Completos

Explora nuestros ejemplos para aprender diferentes aspectos del motor:

### 🔰 [Basic Core](examples/basic-core/)

Tu primer contacto con el motor. Aprende:

- Inicialización del engine
- Game Loop y fixed timestep
- Sistema de eventos
- Entidades simples con movimiento

### 🚀 [Space Shooter](examples/space-shooter/)

Un juego completo de disparos espaciales que muestra:

- Carga y uso de texturas/sprites
- Sistema de colisiones
- Gestión de proyectiles y enemigos
- Controles de teclado y mouse
- Sistema de puntuación

### 🎮 [Platformer](examples/platformer/)

Un juego de plataformas con:

- Física y gravedad
- Detección de colisiones con plataformas
- Sistema de animaciones
- Tilemaps y niveles

### 🧱 [Brick Breaker](examples/brick-breaker/)

Clásico juego que incluye:

- Física de rebotes
- Detección de colisiones precisas
- Gestión de niveles
- Power-ups y efectos

### 🧠 [Memory Game](examples/memory-game/)

Juego de memoria que demuestra:

- Gestión de estados del juego
- Interacción con mouse/touch
- Animaciones de transición
- UI e interfaz de usuario

### Para ejecutar los ejemplos:

```bash
# Clonar el repositorio
git clone https://github.com/lemur-bookstores/atomic-game-engine2d.git

# Instalar dependencias
cd atomic-game-engine2d
npm install

# Construir el proyecto
npm run build

# Iniciar servidor de desarrollo
npm run dev

# Abrir navegador en http://localhost:5173/examples/
```

## 🔧 Desarrollo

### Requisitos

- Node.js 18+
- npm 9+

### Comandos

```bash
# Instalación de dependencias
npm install

# Desarrollo
npm run dev

# Construcción
npm run build

# Tests
npm run test

# Verificación de tipos
npm run type-check

# Linting
npm run lint
```

## 📚 Documentación

### Documentación y Guías

La documentación detallada del motor ahora está organizada por componente y sistema en la carpeta `docs/`. Cada entrada incluye una descripción y ejemplos de uso en TypeScript.

Principales documentos:

- `docs/ecs.md` — Arquitectura ECS: Entidades, Componentes y Sistemas.
- `docs/scene.md` — Gestión de escenas y ciclo de vida.
- `docs/entity.md` — API de `Entity` y manipulación de componentes.
- `docs/transform.md` — Componente `transform` y transformaciones.
- `docs/sprite.md` — Componente `sprite` y AssetManager usage.
- `docs/physics.md` — `PhysicsSystem`, Box2D fallback y configuración.
- `docs/collider.md` — Colisionadores y detección de colisiones.
- `docs/render-system.md` — Render system, batching y cámaras.
- `docs/input-system.md` — InputManager e InputSystem (keyboard/mouse/touch).
- `docs/event-system.md` — EventSystem y patrón de eventos.
- `docs/asset-manager.md` — Carga y uso de texturas y assets.
- `docs/particle-system.md` — Particle system, emitters y serialization.
- `docs/light-system.md` — Light system and layer resolver.
- `docs/script-component.md` — ScriptComponent y ScriptSystem.
- `docs/animation-system.md` — AnimationSystem and SpriteSheet usage.

Revisa `docs/` para ejemplos de código y casos de uso concretos.
| `sprite` | Imagen/textura | `texture`, `width`, `height`, `tint` |
| `rectangle` | Forma rectangular | `width`, `height`, `color` |
| `physics` | Propiedades físicas | `velocity`, `acceleration`, `mass` |
| `collider` | Detección de colisiones | `width`, `height`, `isTrigger` |

### Sistemas del Motor

| Sistema           | Función                               |
| ----------------- | ------------------------------------- |
| `RenderSystem`    | Dibuja entidades en pantalla          |
| `InputSystem`     | Procesa entrada del usuario           |
| `MovementSystem`  | Actualiza posiciones basado en física |
| `CollisionSystem` | Detecta y procesa colisiones          |

### Eventos Principales

```typescript
// Eventos del motor
ENGINE_EVENTS.INITIALIZED; // Motor inicializado
ENGINE_EVENTS.STARTED; // Motor iniciado
ENGINE_EVENTS.PAUSED; // Motor pausado

// Eventos de input
INPUT_EVENTS.KEYDOWN; // Tecla presionada
INPUT_EVENTS.KEYUP; // Tecla liberada
INPUT_EVENTS.MOUSEDOWN; // Click del mouse
INPUT_EVENTS.MOUSEMOVE; // Movimiento del mouse

// Eventos de física
PHYSICS_EVENTS.COLLISION_BEGIN; // Inicio de colisión
```

Para más detalles, explora:

- [examples/](examples/) para ejemplos prácticos
- [src/types/](src/types/) para definiciones de tipos
- [src/core/](src/core/) para la implementación del core

## 📝 Notas de Versiones

### v0.3.1 - Animations FSM & Compatibility (Actual)

Principales cambios:

- Librería Sprite-Sheet refactorizada en arquitectura hexagonal (detección grid/dinámica, adaptadores, facade).
- Integración con `AssetManager` y nuevos métodos `SpriteSheet.fromFrames` & adapter de engine.
- Sistema de Animación actualizado: correcciones de timing (frameTime vs duration), ping-pong tipado y UVs esperadas por tests.
- Nueva Máquina de Estado de Animaciones (FSM): transiciones por condición, trigger y eventos; prioridad; eventos `onEnter`/`onExit`.
- EventSystem: compatibilidad con nombres camelCase y versiones sin prefijo (ej. `entityCreated`, `keyDown`).
- InputManager: compat legacy keyDown/keyUp + parche para eventos sintéticos en entorno de test.
- AudioSystem: reproducción de SFX mapeados a frames vía evento `ANIMATION:FRAME`.
- WebGLRenderer: tolerancia a contextos mock y fallback seguro a Canvas2D.
- Tests: suite ampliada (FSM, audio+anim, sprite-sheet lib) – 52 tests.

### v0.3.0 - Animaciones y Audio (Completado)

- Sistema de animaciones por sprite sheet.
- Sonidos mapeables a frames de animación (SFX puntuales) y soporte base de audio.
- Integración inicial de eventos de animación (`FRAME`, `COMPLETE`).

## 📝 Roadmap

### Próximas Versiones

- [ ] **v0.4.0 - Física Avanzada**
  - Integración Box2D WebAssembly
  - Joints y constraints
  - Partículas y efectos

### Funcionalidades Deseadas

- [ ] WebGL renderer para mejor rendimiento
- [ ] Sistema de UI/HUD integrado
- [ ] Soporte para mobile con controles táctiles
- [ ] Networking para juegos multijugador
- [ ] Plugin system para extensiones
- [ ] Parallax scrolling para fondos con múltiples capas
- [ ] Modos de mezcla y efectos visuales por capa

### Funcionalidades Deseadas

- [ ] WebGL renderer para mejor rendimiento
- [ ] Sistema de UI/HUD integrado
- [ ] Soporte para mobile con controles táctiles
- [ ] Networking para juegos multijugador
- [ ] Plugin system para extensiones
- [ ] Parallax scrolling para fondos con múltiples capas
- [ ] Modos de mezcla y efectos visuales por capa

## 🤝 Contribución

Las contribuciones son bienvenidas! Por favor, lee nuestras guías de contribución antes de enviar un PR.

## 📄 Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.
