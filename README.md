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

- **ECS (Entity-Component-System)**

  - Sistema de entidades flexible
  - Componentes: transform, sprite, rectangle, physics, collider
  - Sistemas: Render, Input, Movement, Collision

- **Input y Física**
  - InputManager con soporte para teclado, mouse y touch
  - Sistema de colisiones 2D
  - Componentes de física básicos

### 🚧 En Desarrollo

- Sistema de animaciones avanzadas
- Integración Box2D para física realista
- Sistema de audio
- WebGL renderer (optimización)
- Tilemaps y editores de niveles

## 📦 Instalación

```bash
npm install web-2d-game-engine
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
import { GameEngine } from "web-2d-game-engine";
import { Scene } from "web-2d-game-engine/core/Scene";
import { Entity } from "web-2d-game-engine/ecs/Entity";
import { EventSystem } from "web-2d-game-engine/core/EventSystem";
import { RenderSystem } from "web-2d-game-engine/graphics";
import { InputManager, InputSystem } from "web-2d-game-engine/input";
import { INPUT_EVENTS } from "web-2d-game-engine/types/event-const";

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
```

#### Cargar Texturas

```typescript
import { AssetManager } from "web-2d-game-engine/assets/AssetManager";

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
git clone https://github.com/lemur-bookstores/web-2d-game-engine.git

# Instalar dependencias
cd web-2d-game-engine
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

### Arquitectura del Motor

El motor está basado en **ECS (Entity-Component-System)**:

- **Entidades**: Objetos del juego (jugador, enemigos, proyectiles)
- **Componentes**: Datos que definen propiedades (posición, sprite, colisión)
- **Sistemas**: Lógica que procesa componentes (renderizado, física, input)

### Componentes Disponibles

| Componente  | Descripción                 | Propiedades                          |
| ----------- | --------------------------- | ------------------------------------ |
| `transform` | Posición, rotación y escala | `position`, `rotation`, `scale`      |
| `sprite`    | Imagen/textura              | `texture`, `width`, `height`, `tint` |
| `rectangle` | Forma rectangular           | `width`, `height`, `color`           |
| `physics`   | Propiedades físicas         | `velocity`, `acceleration`, `mass`   |
| `collider`  | Detección de colisiones     | `width`, `height`, `isTrigger`       |

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

## 📝 Roadmap

### Próximas Versiones

- [ ] **v0.3.0 - Animaciones y Audio**

  - Sistema de animaciones con sprites
  - Web Audio API integrado
  - Efectos de sonido y música de fondo

- [ ] **v0.4.0 - Física Avanzada**

  - Integración Box2D WebAssembly
  - Joints y constraints
  - Partículas y efectos

- [ ] **v0.5.0 - Layers y Camera**

  - Sistema de capas para organizar elementos por profundidad
  - Camera2D con viewport, zoom y seguimiento de entidades
  - Efectos de cámara (shake, smooth follow, transitions)
  - Culling automático fuera del viewport

- [ ] **v0.6.0 - Herramientas**
  - Editor de niveles web
  - Inspector de entidades en tiempo real
  - Profiler de rendimiento

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
