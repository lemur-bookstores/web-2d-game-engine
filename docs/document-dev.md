# **Documentación MVP - GameEngine 2D**

## **Especificación Técnica para Desarrollo**

---

## 🏗️ **ARQUITECTURA TÉCNICA**

_Por: Arquitecto de Software_

### **1. Requisitos del Sistema**

#### **Requisitos Funcionales**

- ✅ Renderizado 2D con WebGL/Canvas2D fallback
- ✅ Sistema de física integrado con Box2D
- ✅ Gestión de entidades mediante ECS
- ✅ Game Loop con timestep fijo
- ✅ Sistema de entrada (teclado/mouse/touch)
- ✅ Carga y gestión de assets básicos
- ✅ Sistema de escenas básico

#### **Requisitos No Funcionales**

- **Performance**: 60 FPS con 500+ entidades activas
- **Compatibilidad**: Chrome 90+, Firefox 88+, Safari 14+
- **Bundle Size**: < 300KB gzipped para MVP
- **Memory**: < 50MB usage típico
- **Loading**: < 2s tiempo inicial de carga

### **2. Estructura del Proyecto MVP**

```
atomic-game-engine2d/
├── src/
│   ├── core/
│   │   ├── Engine.ts              # Motor principal
│   │   ├── GameLoop.ts            # Loop principal del juego
│   │   ├── Scene.ts               # Gestión de escenas
│   │   └── EventSystem.ts         # Sistema de eventos
│   ├── ecs/
│   │   ├── Entity.ts              # Entidad base
│   │   ├── Component.ts           # Sistema de componentes
│   │   ├── System.ts              # Sistemas base
│   │   └── World.ts               # Mundo ECS
│   ├── graphics/
│   │   ├── Renderer.ts            # Interfaz de renderizado
│   │   ├── WebGLRenderer.ts       # Implementación WebGL
│   │   ├── Canvas2DRenderer.ts    # Fallback Canvas2D
│   │   ├── Texture.ts             # Gestión de texturas
│   │   ├── Sprite.ts              # Componente sprite
│   │   ├── SpriteSheet.ts         # Gestión de sprite sheets
│   │   ├── Animation.ts           # Sistema de animaciones
│   │   └── AnimationSystem.ts     # Sistema de animación ECS
│   ├── physics/
│   │   ├── PhysicsWorld.ts        # Wrapper Box2D
│   │   ├── PhysicsBody.ts         # Cuerpos físicos
│   │   └── PhysicsSystem.ts       # Sistema de física
│   ├── input/
│   │   ├── InputManager.ts        # Gestión de entrada
│   │   └── InputSystem.ts         # Sistema de entrada
│   ├── assets/
│   │   ├── AssetLoader.ts         # Cargador de recursos
│   │   └── AssetManager.ts        # Gestión de recursos
│   ├── math/
│   │   ├── Vector2.ts             # Vectores 2D
│   │   ├── Transform.ts           # Transformaciones
│   │   └── MathUtils.ts           # Utilidades matemáticas
│   └── types/
│       └── index.ts               # Definiciones TypeScript
├── examples/
│   ├── basic-game/                # Ejemplo básico
│   └── physics-demo/              # Demo de física
├── tests/
│   ├── unit/                      # Pruebas unitarias
│   └── integration/               # Pruebas de integración
├── docs/                          # Documentación
└── dist/                          # Build output
```

### **3. Stack Tecnológico MVP**

```json
{
  "dependencies": {
    "box2d-wasm": "^6.0.0",
    "gl-matrix": "^3.4.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "vite": "^4.0.0",
    "vitest": "^0.32.0",
    "eslint": "^8.0.0",
    "@typescript-eslint/parser": "^5.0.0"
  }
}
```

### **4. Configuración de Build**

#### **vite.config.ts**

```typescript
export default defineConfig({
  build: {
    lib: {
      entry: "src/index.ts",
      name: "GameEngine",
      fileName: (format) => `gameengine.${format}.js`,
    },
    rollupOptions: {
      external: ["box2d-wasm"],
      output: {
        globals: {
          "box2d-wasm": "Box2D",
        },
      },
    },
  },
});
```

---

## 🎨 **PATRONES DE DISEÑO Y ARQUITECTURA**

_Por: Especialista en Patrones de Diseño_

### **1. Entity-Component-System (ECS)**

#### **Entidad Base**

```typescript
interface Entity {
  id: string;
  active: boolean;
  components: Map<string, Component>;

  addComponent<T extends Component>(component: T): void;
  removeComponent(type: string): void;
  getComponent<T extends Component>(type: string): T | undefined;
  hasComponent(type: string): boolean;
}
```

#### **Componentes Básicos**

```typescript
interface Component {
  type: string;
}

interface TransformComponent extends Component {
  type: "transform";
  position: Vector2;
  rotation: number;
  scale: Vector2;
}

interface SpriteComponent extends Component {
  type: "sprite";
  texture: string;
  width: number;
  height: number;
  tint: Color;
}

interface PhysicsComponent extends Component {
  type: "physics";
  bodyType: "static" | "dynamic" | "kinematic";
  shape: "box" | "circle" | "polygon";
  density: number;
  friction: number;
  restitution: number;
}

interface AnimationComponent extends Component {
  type: "animation";
  spriteSheet: string;
  currentAnimation: string;
  currentFrame: number;
  frameTime: number;
  elapsedTime: number;
  loop: boolean;
  playing: boolean;
  animations: Map<string, Animation>;
}
```

#### **Sistema Base**

```typescript
abstract class System {
  abstract requiredComponents: string[];
  abstract update(entities: Entity[], deltaTime: number): void;

  protected getEntitiesWithComponents(
    entities: Entity[],
    components: string[]
  ): Entity[] {
    return entities.filter((entity) =>
      components.every((comp) => entity.hasComponent(comp))
    );
  }
}
```

### **2. Factory Pattern para Creación de Entidades**

```typescript
class EntityFactory {
  private world: World;

  constructor(world: World) {
    this.world = world;
  }

  createPlayer(position: Vector2): Entity {
    const entity = this.world.createEntity();

    entity.addComponent({
      type: "transform",
      position: position.clone(),
      rotation: 0,
      scale: new Vector2(1, 1),
    });

    entity.addComponent({
      type: "sprite",
      texture: "player",
      width: 32,
      height: 32,
      tint: new Color(255, 255, 255, 255),
    });

    entity.addComponent({
      type: "physics",
      bodyType: "dynamic",
      shape: "box",
      density: 1,
      friction: 0.3,
      restitution: 0.1,
    });

    entity.addComponent({
      type: "animation",
      spriteSheet: "player_sheet",
      currentAnimation: "idle",
      currentFrame: 0,
      frameTime: 0.1,
      elapsedTime: 0,
      loop: true,
      playing: true,
      animations: new Map([
        ["idle", { frames: [0, 1, 2, 3], duration: 0.1 }],
        ["walk", { frames: [4, 5, 6, 7], duration: 0.08 }],
        ["jump", { frames: [8, 9], duration: 0.15 }],
      ]),
    });

    return entity;
  }

  createStaticBlock(position: Vector2, size: Vector2): Entity {
    const entity = this.world.createEntity();

    entity.addComponent({
      type: "transform",
      position: position.clone(),
      rotation: 0,
      scale: new Vector2(1, 1),
    });

    entity.addComponent({
      type: "sprite",
      texture: "block",
      width: size.x,
      height: size.y,
      tint: new Color(128, 128, 128, 255),
    });

    entity.addComponent({
      type: "physics",
      bodyType: "static",
      shape: "box",
      density: 0,
      friction: 0.5,
      restitution: 0,
    });

    return entity;
  }
}
```

### **3. Observer Pattern para Sistema de Eventos**

```typescript
interface GameEvent {
  type: string;
  data: any;
  timestamp: number;
}

class EventSystem {
  private listeners = new Map<string, Function[]>();
  private eventQueue: GameEvent[] = [];

  emit(type: string, data: any = null): void {
    const event: GameEvent = {
      type,
      data,
      timestamp: Date.now(),
    };

    this.eventQueue.push(event);
  }

  on(type: string, callback: Function): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type)!.push(callback);
  }

  off(type: string, callback: Function): void {
    const callbacks = this.listeners.get(type);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  processEvents(): void {
    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift()!;
      const callbacks = this.listeners.get(event.type);

      if (callbacks) {
        callbacks.forEach((callback) => callback(event));
      }
    }
  }
}
```

### **4. Strategy Pattern para Renderizado**

```typescript
interface RenderStrategy {
  initialize(canvas: HTMLCanvasElement): void;
  clear(): void;
  drawSprite(
    texture: Texture,
    position: Vector2,
    size: Vector2,
    rotation: number,
    tint: Color
  ): void;
  present(): void;
  destroy(): void;
}

class WebGLRenderer implements RenderStrategy {
  private gl: WebGLRenderingContext;
  private shaderProgram: WebGLProgram;

  initialize(canvas: HTMLCanvasElement): void {
    this.gl = canvas.getContext("webgl")!;
    this.initializeShaders();
  }

  // Implementación WebGL...
}

class Canvas2DRenderer implements RenderStrategy {
  private ctx: CanvasRenderingContext2D;

  initialize(canvas: HTMLCanvasElement): void {
    this.ctx = canvas.getContext("2d")!;
  }

  // Implementación Canvas2D...
}
```

---

## 🎬 **SISTEMA DE ANIMACIÓN Y SPRITE SHEETS**

_Por: Especialista en Patrones de Diseño + Matemático_

### **1. Gestión de Sprite Sheets**

```typescript
interface SpriteFrame {
  x: number; // Posición X en la textura
  y: number; // Posición Y en la textura
  width: number; // Ancho del frame
  height: number; // Alto del frame
}

interface Animation {
  name: string;
  frames: number[]; // Índices de frames en el sprite sheet
  duration: number; // Duración por frame en segundos
  loop: boolean; // Si la animación se repite
  pingPong: boolean; // Si va ida y vuelta
}

class SpriteSheet {
  private texture: Texture;
  private frames: SpriteFrame[] = [];
  private animations: Map<string, Animation> = new Map();

  constructor(texture: Texture, frameWidth: number, frameHeight: number) {
    this.texture = texture;
    this.generateFrames(frameWidth, frameHeight);
  }

  private generateFrames(frameWidth: number, frameHeight: number): void {
    const cols = Math.floor(this.texture.width / frameWidth);
    const rows = Math.floor(this.texture.height / frameHeight);

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        this.frames.push({
          x: col * frameWidth,
          y: row * frameHeight,
          width: frameWidth,
          height: frameHeight,
        });
      }
    }
  }

  addAnimation(name: string, animation: Animation): void {
    this.animations.set(name, animation);
  }

  getAnimation(name: string): Animation | undefined {
    return this.animations.get(name);
  }

  getFrame(index: number): SpriteFrame | undefined {
    return this.frames[index];
  }

  getFrameCount(): number {
    return this.frames.length;
  }

  // Método para cargar desde JSON Atlas
  static fromAtlas(texture: Texture, atlasData: any): SpriteSheet {
    const spriteSheet = new SpriteSheet.__proto__.constructor(texture, 0, 0);

    // Cargar frames desde atlas JSON
    atlasData.frames.forEach((frameData: any) => {
      spriteSheet.frames.push({
        x: frameData.frame.x,
        y: frameData.frame.y,
        width: frameData.frame.w,
        height: frameData.frame.h,
      });
    });

    // Cargar animaciones desde atlas
    if (atlasData.animations) {
      Object.keys(atlasData.animations).forEach((animName) => {
        const animData = atlasData.animations[animName];
        spriteSheet.addAnimation(animName, {
          name: animName,
          frames: animData.frames,
          duration: animData.duration || 0.1,
          loop: animData.loop !== false,
          pingPong: animData.pingPong || false,
        });
      });
    }

    return spriteSheet;
  }
}
```

### **2. Sistema de Animación ECS**

```typescript
class AnimationSystem extends System {
  requiredComponents = ["animation", "sprite"];
  private spriteSheets = new Map<string, SpriteSheet>();

  constructor() {
    super();
  }

  registerSpriteSheet(name: string, spriteSheet: SpriteSheet): void {
    this.spriteSheets.set(name, spriteSheet);
  }

  update(entities: Entity[], deltaTime: number): void {
    const animatedEntities = this.getEntitiesWithComponents(
      entities,
      this.requiredComponents
    );

    animatedEntities.forEach((entity) => {
      this.updateAnimation(entity, deltaTime);
    });
  }

  private updateAnimation(entity: Entity, deltaTime: number): void {
    const animComponent = entity.getComponent<AnimationComponent>("animation")!;
    const spriteComponent = entity.getComponent<SpriteComponent>("sprite")!;

    if (!animComponent.playing) return;

    const spriteSheet = this.spriteSheets.get(animComponent.spriteSheet);
    if (!spriteSheet) return;

    const currentAnim = spriteSheet.getAnimation(
      animComponent.currentAnimation
    );
    if (!currentAnim) return;

    // Actualizar tiempo transcurrido
    animComponent.elapsedTime += deltaTime;

    // Cambiar frame si es necesario
    if (animComponent.elapsedTime >= animComponent.frameTime) {
      this.nextFrame(animComponent, currentAnim);
      animComponent.elapsedTime = 0;
    }

    // Actualizar UV coordinates del sprite
    this.updateSpriteUV(
      spriteComponent,
      spriteSheet,
      animComponent,
      currentAnim
    );
  }

  private nextFrame(
    animComponent: AnimationComponent,
    animation: Animation
  ): void {
    if (animation.pingPong) {
      // Lógica ping-pong (ida y vuelta)
      this.updatePingPongFrame(animComponent, animation);
    } else {
      // Lógica normal
      animComponent.currentFrame++;

      if (animComponent.currentFrame >= animation.frames.length) {
        if (animation.loop) {
          animComponent.currentFrame = 0;
        } else {
          animComponent.currentFrame = animation.frames.length - 1;
          animComponent.playing = false;

          // Emitir evento de animación terminada
          EventSystem.getInstance().emit("animationComplete", {
            entity: animComponent,
            animation: animation.name,
          });
        }
      }
    }
  }

  private updatePingPongFrame(
    animComponent: AnimationComponent,
    animation: Animation
  ): void {
    // Implementar lógica ping-pong
    if (!animComponent.hasOwnProperty("_direction")) {
      (animComponent as any)._direction = 1; // 1 = forward, -1 = backward
    }

    const direction = (animComponent as any)._direction;
    animComponent.currentFrame += direction;

    if (animComponent.currentFrame >= animation.frames.length - 1) {
      (animComponent as any)._direction = -1;
      animComponent.currentFrame = animation.frames.length - 1;
    } else if (animComponent.currentFrame <= 0) {
      (animComponent as any)._direction = 1;
      animComponent.currentFrame = 0;
    }
  }

  private updateSpriteUV(
    sprite: SpriteComponent,
    spriteSheet: SpriteSheet,
    animComponent: AnimationComponent,
    animation: Animation
  ): void {
    const frameIndex = animation.frames[animComponent.currentFrame];
    const frame = spriteSheet.getFrame(frameIndex);

    if (frame) {
      // Actualizar coordenadas UV del sprite
      sprite.uvX = frame.x;
      sprite.uvY = frame.y;
      sprite.uvWidth = frame.width;
      sprite.uvHeight = frame.height;
      sprite.width = frame.width;
      sprite.height = frame.height;
    }
  }

  // Métodos públicos para control de animaciones
  playAnimation(entity: Entity, animationName: string): void {
    const animComponent = entity.getComponent<AnimationComponent>("animation");
    if (animComponent) {
      animComponent.currentAnimation = animationName;
      animComponent.currentFrame = 0;
      animComponent.elapsedTime = 0;
      animComponent.playing = true;
    }
  }

  pauseAnimation(entity: Entity): void {
    const animComponent = entity.getComponent<AnimationComponent>("animation");
    if (animComponent) {
      animComponent.playing = false;
    }
  }

  resumeAnimation(entity: Entity): void {
    const animComponent = entity.getComponent<AnimationComponent>("animation");
    if (animComponent) {
      animComponent.playing = true;
    }
  }

  setAnimationSpeed(entity: Entity, speed: number): void {
    const animComponent = entity.getComponent<AnimationComponent>("animation");
    if (animComponent) {
      animComponent.frameTime = speed;
    }
  }
}
```

### **3. Componente Sprite Actualizado con UV Mapping**

```typescript
interface SpriteComponent extends Component {
  type: "sprite";
  texture: string;
  width: number;
  height: number;
  tint: Color;
  // Coordenadas UV para sprite sheets
  uvX: number;
  uvY: number;
  uvWidth: number;
  uvHeight: number;
  flipX: boolean;
  flipY: boolean;
}
```

### **4. Asset Loader para Sprite Sheets**

```typescript
class AssetManager {
  private textures = new Map<string, Texture>();
  private spriteSheets = new Map<string, SpriteSheet>();

  async loadSpriteSheet(
    name: string,
    texturePath: string,
    atlasPath?: string,
    frameWidth?: number,
    frameHeight?: number
  ): Promise<SpriteSheet> {
    // Cargar textura
    const texture = await this.loadTexture(`${name}_texture`, texturePath);

    let spriteSheet: SpriteSheet;

    if (atlasPath) {
      // Cargar desde JSON Atlas (TexturePacker, etc.)
      const atlasData = await this.loadJSON(atlasPath);
      spriteSheet = SpriteSheet.fromAtlas(texture, atlasData);
    } else if (frameWidth && frameHeight) {
      // Crear grid uniforme
      spriteSheet = new SpriteSheet(texture, frameWidth, frameHeight);
    } else {
      throw new Error("Debe especificar atlasPath o frameWidth/frameHeight");
    }

    this.spriteSheets.set(name, spriteSheet);
    return spriteSheet;
  }

  getSpriteSheet(name: string): SpriteSheet | undefined {
    return this.spriteSheets.get(name);
  }

  private async loadJSON(path: string): Promise<any> {
    const response = await fetch(path);
    return await response.json();
  }
}
```

### **5. Factory Pattern Actualizado con Animaciones**

```typescript
class EntityFactory {
  private world: World;
  private assetManager: AssetManager;

  constructor(world: World, assetManager: AssetManager) {
    this.world = world;
    this.assetManager = assetManager;
  }

  createAnimatedPlayer(position: Vector2): Entity {
    const entity = this.world.createEntity();

    entity.addComponent({
      type: "transform",
      position: position.clone(),
      rotation: 0,
      scale: new Vector2(1, 1),
    });

    entity.addComponent({
      type: "sprite",
      texture: "player_sheet",
      width: 32,
      height: 32,
      tint: new Color(255, 255, 255, 255),
      uvX: 0,
      uvY: 0,
      uvWidth: 32,
      uvHeight: 32,
      flipX: false,
      flipY: false,
    });

    // Configurar animaciones
    const animations = new Map<string, Animation>([
      [
        "idle",
        {
          name: "idle",
          frames: [0, 1, 2, 3],
          duration: 0.15,
          loop: true,
          pingPong: false,
        },
      ],
      [
        "walk",
        {
          name: "walk",
          frames: [4, 5, 6, 7, 8, 9],
          duration: 0.1,
          loop: true,
          pingPong: false,
        },
      ],
      [
        "jump",
        {
          name: "jump",
          frames: [10, 11],
          duration: 0.2,
          loop: false,
          pingPong: false,
        },
      ],
      [
        "attack",
        {
          name: "attack",
          frames: [12, 13, 14, 15],
          duration: 0.08,
          loop: false,
          pingPong: false,
        },
      ],
    ]);

    entity.addComponent({
      type: "animation",
      spriteSheet: "player_sheet",
      currentAnimation: "idle",
      currentFrame: 0,
      frameTime: 0.15,
      elapsedTime: 0,
      loop: true,
      playing: true,
      animations: animations,
    });

    return entity;
  }

  createAnimatedEnemy(position: Vector2, enemyType: string): Entity {
    const entity = this.world.createEntity();

    // Configuración similar pero con diferentes sprite sheets y animaciones
    // según el tipo de enemigo

    return entity;
  }
}
```

### **6. Ejemplo de Uso en Juego**

```typescript
// Inicialización
const animationSystem = new AnimationSystem();
engine.addSystem(animationSystem);

// Cargar assets
await engine.assets.loadSpriteSheet(
  "player_sheet",
  "assets/player_spritesheet.png",
  "assets/player_atlas.json" // Opcional: atlas JSON
);

// Registrar sprite sheet en el sistema de animación
const playerSheet = engine.assets.getSpriteSheet("player_sheet");
animationSystem.registerSpriteSheet("player_sheet", playerSheet!);

// Crear entidad animada
const player = engine.factory.createAnimatedPlayer(new Vector2(100, 100));

// Control de animaciones basado en input
engine.input.onKeyDown("ArrowRight", () => {
  animationSystem.playAnimation(player, "walk");
  // Flip sprite horizontally
  const sprite = player.getComponent<SpriteComponent>("sprite")!;
  sprite.flipX = false;
});

engine.input.onKeyDown("ArrowLeft", () => {
  animationSystem.playAnimation(player, "walk");
  const sprite = player.getComponent<SpriteComponent>("sprite")!;
  sprite.flipX = true;
});

engine.input.onKeyUp("ArrowRight", () => {
  animationSystem.playAnimation(player, "idle");
});

engine.input.onKeyUp("ArrowLeft", () => {
  animationSystem.playAnimation(player, "idle");
});

engine.input.onKeyDown("Space", () => {
  animationSystem.playAnimation(player, "jump");
});

// Eventos de animación
engine.events.on("animationComplete", (event) => {
  if (event.data.animation === "attack") {
    animationSystem.playAnimation(player, "idle");
  }
});
```

---

_Por: Matemático Especialista en Algoritmos_

### **1. Game Loop con Fixed Timestep**

```typescript
class GameLoop {
  private lastTime = 0;
  private accumulator = 0;
  private readonly FIXED_TIMESTEP = 1 / 60; // 60 FPS físicos
  private readonly MAX_FRAMESKIP = 5;
  private running = false;

  private systems: System[] = [];
  private world: World;

  constructor(world: World) {
    this.world = world;
  }

  start(): void {
    this.running = true;
    this.lastTime = performance.now() / 1000;
    this.loop();
  }

  stop(): void {
    this.running = false;
  }

  private loop(): void {
    if (!this.running) return;

    const currentTime = performance.now() / 1000;
    const deltaTime = Math.min(currentTime - this.lastTime, 0.25);
    this.lastTime = currentTime;

    this.accumulator += deltaTime;

    let frameskip = 0;
    while (
      this.accumulator >= this.FIXED_TIMESTEP &&
      frameskip < this.MAX_FRAMESKIP
    ) {
      this.fixedUpdate(this.FIXED_TIMESTEP);
      this.accumulator -= this.FIXED_TIMESTEP;
      frameskip++;
    }

    const alpha = this.accumulator / this.FIXED_TIMESTEP;
    this.render(alpha);

    requestAnimationFrame(() => this.loop());
  }

  private fixedUpdate(deltaTime: number): void {
    const entities = this.world.getActiveEntities();

    // Actualizar sistemas en orden específico
    this.systems.forEach((system) => {
      system.update(entities, deltaTime);
    });
  }

  private render(alpha: number): void {
    // Interpolación para rendering suave
    this.world.interpolateTransforms(alpha);

    // Renderizar escena
    const renderSystem = this.systems.find((s) => s instanceof RenderSystem);
    if (renderSystem) {
      renderSystem.render();
    }
  }
}
```

### **2. Spatial Partitioning con Quadtree**

```typescript
class Rectangle {
  constructor(
    public x: number,
    public y: number,
    public width: number,
    public height: number
  ) {}

  contains(point: Vector2): boolean {
    return (
      point.x >= this.x &&
      point.x <= this.x + this.width &&
      point.y >= this.y &&
      point.y <= this.y + this.height
    );
  }

  intersects(other: Rectangle): boolean {
    return !(
      other.x > this.x + this.width ||
      other.x + other.width < this.x ||
      other.y > this.y + this.height ||
      other.y + other.height < this.y
    );
  }
}

class Quadtree {
  private readonly MAX_OBJECTS = 10;
  private readonly MAX_LEVELS = 5;

  private level: number;
  private objects: Entity[] = [];
  private bounds: Rectangle;
  private children: Quadtree[] = [];

  constructor(level: number, bounds: Rectangle) {
    this.level = level;
    this.bounds = bounds;
  }

  clear(): void {
    this.objects = [];
    this.children = [];
  }

  split(): void {
    const subWidth = this.bounds.width / 2;
    const subHeight = this.bounds.height / 2;
    const x = this.bounds.x;
    const y = this.bounds.y;

    this.children[0] = new Quadtree(
      this.level + 1,
      new Rectangle(x + subWidth, y, subWidth, subHeight)
    );
    this.children[1] = new Quadtree(
      this.level + 1,
      new Rectangle(x, y, subWidth, subHeight)
    );
    this.children[2] = new Quadtree(
      this.level + 1,
      new Rectangle(x, y + subHeight, subWidth, subHeight)
    );
    this.children[3] = new Quadtree(
      this.level + 1,
      new Rectangle(x + subWidth, y + subHeight, subWidth, subHeight)
    );
  }

  getIndex(entity: Entity): number {
    const transform = entity.getComponent<TransformComponent>("transform");
    if (!transform) return -1;

    const verticalMidpoint = this.bounds.x + this.bounds.width / 2;
    const horizontalMidpoint = this.bounds.y + this.bounds.height / 2;

    const topQuadrant = transform.position.y < horizontalMidpoint;
    const bottomQuadrant = transform.position.y > horizontalMidpoint;

    if (transform.position.x < verticalMidpoint) {
      if (topQuadrant) return 1;
      else if (bottomQuadrant) return 2;
    } else if (transform.position.x > verticalMidpoint) {
      if (topQuadrant) return 0;
      else if (bottomQuadrant) return 3;
    }

    return -1;
  }

  insert(entity: Entity): void {
    if (this.children.length > 0) {
      const index = this.getIndex(entity);
      if (index !== -1) {
        this.children[index].insert(entity);
        return;
      }
    }

    this.objects.push(entity);

    if (
      this.objects.length > this.MAX_OBJECTS &&
      this.level < this.MAX_LEVELS
    ) {
      if (this.children.length === 0) {
        this.split();
      }

      let i = 0;
      while (i < this.objects.length) {
        const index = this.getIndex(this.objects[i]);
        if (index !== -1) {
          this.children[index].insert(this.objects.splice(i, 1)[0]);
        } else {
          i++;
        }
      }
    }
  }

  retrieve(returnObjects: Entity[], entity: Entity): Entity[] {
    const index = this.getIndex(entity);
    if (index !== -1 && this.children.length > 0) {
      this.children[index].retrieve(returnObjects, entity);
    }

    returnObjects.push(...this.objects);
    return returnObjects;
  }
}
```

### **3. Object Pooling para Optimización de Memoria**

```typescript
class ObjectPool<T> {
  private pool: T[] = [];
  private createFn: () => T;
  private resetFn: (obj: T) => void;
  private maxSize: number;

  constructor(
    createFn: () => T,
    resetFn: (obj: T) => void,
    maxSize: number = 100
  ) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    this.maxSize = maxSize;
  }

  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return this.createFn();
  }

  release(obj: T): void {
    if (this.pool.length < this.maxSize) {
      this.resetFn(obj);
      this.pool.push(obj);
    }
  }

  preload(count: number): void {
    for (let i = 0; i < count; i++) {
      this.pool.push(this.createFn());
    }
  }

  clear(): void {
    this.pool = [];
  }
}

// Uso para balas/proyectiles
const bulletPool = new ObjectPool<Entity>(
  () => EntityFactory.createBullet(),
  (bullet) => {
    bullet.getComponent<TransformComponent>("transform")!.position.set(0, 0);
    bullet.active = false;
  },
  200
);
```

### **4. Interpolación para Rendering Suave**

```typescript
class PhysicsInterpolator {
  private previousStates = new Map<string, TransformState>();
  private currentStates = new Map<string, TransformState>();

  interface TransformState {
    position: Vector2;
    rotation: number;
  }

  saveCurrentStates(entities: Entity[]): void {
    entities.forEach(entity => {
      const transform = entity.getComponent<TransformComponent>('transform');
      if (transform) {
        const previous = this.currentStates.get(entity.id);
        if (previous) {
          this.previousStates.set(entity.id, { ...previous });
        }

        this.currentStates.set(entity.id, {
          position: transform.position.clone(),
          rotation: transform.rotation
        });
      }
    });
  }

  interpolate(entities: Entity[], alpha: number): void {
    entities.forEach(entity => {
      const transform = entity.getComponent<TransformComponent>('transform');
      const previous = this.previousStates.get(entity.id);
      const current = this.currentStates.get(entity.id);

      if (transform && previous && current) {
        // Interpolación lineal de posición
        transform.position.x = this.lerp(
          previous.position.x,
          current.position.x,
          alpha
        );
        transform.position.y = this.lerp(
          previous.position.y,
          current.position.y,
          alpha
        );

        // Interpolación angular
        transform.rotation = this.lerpAngle(
          previous.rotation,
          current.rotation,
          alpha
        );
      }
    });
  }

  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  private lerpAngle(a: number, b: number, t: number): number {
    const diff = ((b - a + Math.PI) % (2 * Math.PI)) - Math.PI;
    return a + diff * t;
  }
}
```

### **5. Collision Detection Optimizado**

```typescript
class CollisionSystem extends System {
  requiredComponents = ["transform", "physics"];
  private quadtree: Quadtree;
  private worldBounds: Rectangle;

  constructor(worldBounds: Rectangle) {
    super();
    this.worldBounds = worldBounds;
    this.quadtree = new Quadtree(0, worldBounds);
  }

  update(entities: Entity[], deltaTime: number): void {
    this.quadtree.clear();

    // Insertar todas las entidades físicas en el quadtree
    const physicsEntities = this.getEntitiesWithComponents(
      entities,
      this.requiredComponents
    );

    physicsEntities.forEach((entity) => {
      this.quadtree.insert(entity);
    });

    // Detectar colisiones usando el quadtree
    physicsEntities.forEach((entity) => {
      const potentialCollisions: Entity[] = [];
      this.quadtree.retrieve(potentialCollisions, entity);

      potentialCollisions.forEach((other) => {
        if (entity.id !== other.id) {
          this.checkCollision(entity, other);
        }
      });
    });
  }

  private checkCollision(entityA: Entity, entityB: Entity): void {
    const transformA = entityA.getComponent<TransformComponent>("transform")!;
    const transformB = entityB.getComponent<TransformComponent>("transform")!;

    const physicsA = entityA.getComponent<PhysicsComponent>("physics")!;
    const physicsB = entityB.getComponent<PhysicsComponent>("physics")!;

    // Collision detection básica AABB
    if (this.isAABBCollision(transformA, transformB, physicsA, physicsB)) {
      // Emitir evento de colisión
      EventSystem.getInstance().emit("collision", {
        entityA: entityA.id,
        entityB: entityB.id,
        point: this.getCollisionPoint(transformA, transformB),
      });
    }
  }

  private isAABBCollision(
    transformA: TransformComponent,
    transformB: TransformComponent,
    physicsA: PhysicsComponent,
    physicsB: PhysicsComponent
  ): boolean {
    const halfWidthA = 16; // Simplified for MVP
    const halfHeightA = 16;
    const halfWidthB = 16;
    const halfHeightB = 16;

    return (
      Math.abs(transformA.position.x - transformB.position.x) <
        halfWidthA + halfWidthB &&
      Math.abs(transformA.position.y - transformB.position.y) <
        halfHeightA + halfHeightB
    );
  }
}
```

---

## 🔧 **ESPECIFICACIONES DE IMPLEMENTACIÓN**

### **1. Cronograma de Desarrollo MVP (6 semanas)**

#### **Semana 1-2: Core Engine**

- ✅ Estructura base del proyecto
- ✅ Sistema ECS básico
- ✅ Game Loop con fixed timestep
- ✅ Sistema de eventos
- ✅ Configuración de build

#### **Semana 3: Graphics & Rendering**

- ✅ Interfaz de renderizado
- ✅ WebGL renderer básico
- ✅ Canvas2D fallback
- ✅ Gestión de texturas
- ✅ Sistema de sprites
- ✅ Sprite sheets y sistema de animación
- ✅ UV mapping para frames

#### **Semana 4: Physics Integration**

- ✅ Integración Box2D WASM
- ✅ Wrapper de física básico
- ✅ Sistema de cuerpos físicos
- ✅ Collision callbacks

#### **Semana 5: Input & Assets**

- ✅ Sistema de entrada
- ✅ Cargador de assets
- ✅ Gestión de recursos
- ✅ Sistema de escenas básico

#### **Semana 6: Testing & Examples**

- ✅ Pruebas unitarias
- ✅ Ejemplos básicos
- ✅ Documentación API
- ✅ Build final y distribución

### **2. API Pública para Desarrolladores**

```typescript
// Inicialización básica
const engine = new GameEngine({
  canvas: "#game-canvas",
  width: 800,
  height: 600,
  renderer: "webgl", // 'webgl' | 'canvas2d' | 'auto'
});

// Carga de assets
await engine.assets.loadTexture("player", "assets/player.png");
await engine.assets.loadTexture("ground", "assets/ground.png");
await engine.assets.loadSpriteSheet(
  "player_sheet",
  "assets/player_spritesheet.png",
  "assets/player_atlas.json"
);

// Creación de escena
const gameScene = new Scene("game");
engine.setActiveScene(gameScene);

// Factory para entidades comunes
const player = engine.factory.createAnimatedPlayer(new Vector2(100, 100));
const ground = engine.factory.createStaticBlock(
  new Vector2(0, 500),
  new Vector2(800, 100)
);

// Configurar sistema de animación
const animationSystem = new AnimationSystem();
engine.addSystem(animationSystem);

const playerSheet = engine.assets.getSpriteSheet("player_sheet");
animationSystem.registerSpriteSheet("player_sheet", playerSheet!);

// Agregar entidades a la escena
gameScene.addEntity(player);
gameScene.addEntity(ground);

// Sistema de eventos
engine.events.on("collision", (event) => {
  console.log("Collision detected:", event.data);
});

// Input handling
engine.input.onKeyDown("ArrowRight", () => {
  animationSystem.playAnimation(player, "walk");
  // Flip sprite para dirección
  const sprite = player.getComponent("sprite");
  sprite.flipX = false;
});

engine.input.onKeyDown("ArrowLeft", () => {
  animationSystem.playAnimation(player, "walk");
  const sprite = player.getComponent("sprite");
  sprite.flipX = true;
});

engine.input.onKeyUp(["ArrowLeft", "ArrowRight"], () => {
  animationSystem.playAnimation(player, "idle");
});

engine.input.onKeyDown("Space", () => {
  // Player jump logic
  const physics = player.getComponent("physics");
  physics.applyImpulse(new Vector2(0, -300));
  animationSystem.playAnimation(player, "jump");
});

// Iniciar el juego
engine.start();
```

### **3. Métricas de Éxito MVP**

#### **Performance Targets**

- ✅ 60 FPS estables con 500 entidades activas
- ✅ < 2 segundos tiempo de carga inicial
- ✅ < 50MB uso de memoria RAM
- ✅ < 300KB bundle size (gzipped)

#### **Funcionalidad Mínima**

- ✅ Crear/destruir entidades dinámicamente
- ✅ Física básica (gravedad, colisiones, impulsos)
- ✅ Renderizado de sprites con transformaciones
- ✅ Sistema de animación con sprite sheets
- ✅ Input handling (teclado, mouse)
- ✅ Sistema de escenas
- ✅ Carga de assets (PNG, JSON, Atlas)

#### **Calidad de Código**

- ✅ > 80% cobertura de tests
- ✅ 0 errores ESLint
- ✅ Documentación API completa
- ✅ 2+ ejemplos funcionales

### **4. Distribución y Build**

```typescript
// Configuración de distribución
const buildConfig = {
  formats: ["es", "umd", "cjs"],
  targets: {
    es: "ES2020",
    umd: "ES2017",
  },
  external: ["box2d-wasm"],
  minify: true,
  sourcemap: true,
};

// CDN Distribution
// https://unpkg.com/gameengine-2d@latest/dist/gameengine.umd.js

// NPM Package
// npm install gameengine-2d
```

### **5. Testing Strategy**

```typescript
// Estructura de tests
tests/
├── unit/
│   ├── core/              # Tests del core engine
│   ├── ecs/               # Tests del sistema ECS
│   ├── graphics/          # Tests de renderizado
│   └── physics/           # Tests de física
├── integration/
│   ├── game-lifecycle.test.ts
│   ├── physics-rendering.test.ts
│   └── scene-management.test.ts
└── e2e/
    └── examples/          # Tests de ejemplos completos
```

---

## 📚 **CONCLUSIONES Y PRÓXIMOS PASOS**

### **MVP Deliverables**

1. ✅ Core engine funcional con ECS
2. ✅ Integración completa con Box2D
3. ✅ Sistema de renderizado WebGL/Canvas2D
4. ✅ Sistema de animación con sprite sheets
5. ✅ API simple y documentada
6. ✅ 2 ejemplos demostrativos (uno con animaciones)
7. ✅ Suite de tests completa

### **Post-MVP Roadmap**

- **v0.2**: Audio system, particle effects, animation blending
- **v0.3**: Scene editor visual, tilemap support
- **v0.4**: Advanced animation system (skeletal, tweening)
- **v0.5**: Networking básico, multiplayer

### **Recursos de Documentación**

- **API Reference**: Documentación completa de todas las clases y métodos
- **Tutorials**: Guías paso a paso para crear juegos básicos
- **Examples**: Repositorio de ejemplos y demos
- **Contributing Guide**: Guía para contribuidores

---

_Documento generado por el equipo multidisciplinario de GameEngine 2D_  
_Versión 1.0 - Para desarrollo MVP_
