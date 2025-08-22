# 🎮 GameEngine 2D

Un motor de juegos 2D ligero y modular para navegadores web, construido con TypeScript y diseñado con una arquitectura ECS (Entity-Component-System).

## 🚀 Características

- ⚡ **Core Modular**

  - Game Loop con fixed timestep para física consistente
  - Sistema de eventos robusto
  - Gestión de escenas
  - Matemáticas optimizadas para juegos 2D

- 🎨 **Renderizado**

  - WebGL (próximamente)
  - Canvas 2D (próximamente)

- 🔄 **ECS (Entity-Component-System)**
  - Sistema de entidades flexible
  - Componentes reutilizables
  - Sistemas optimizados

## 🛠️ Estado del Desarrollo

### Completado

- ✅ Core del Engine
  - Sistema de eventos
  - Game Loop
  - Gestión de escenas
  - Utilidades matemáticas (Vector2, Transform)

### En Desarrollo

- 🚧 Sistema de renderizado
- 🚧 Integración de física
- 🚧 Sistema de entrada (Input)

## 📦 Instalación

```bash
npm install web-2d-game-engine
```

## 🎯 Uso Básico

```typescript
import { GameEngine, Scene, Vector2 } from "web-2d-game-engine";

// Crear una instancia del engine
const engine = new GameEngine({
  canvas: "#gameCanvas",
  width: 800,
  height: 600,
  renderer: "canvas2d",
});

// Crear una escena
const gameScene = new Scene("game");

// Inicializar y comenzar
await engine.initialize();
engine.addScene(gameScene);
engine.setActiveScene(gameScene);
engine.start();
```

## 🔍 Ejemplos

### Core Básico

Encuentra un ejemplo básico que demuestra las funcionalidades del core en [examples/basic-core](examples/basic-core).

Este ejemplo muestra:

- Inicialización del engine
- Game Loop con fixed timestep
- Sistema de eventos
- Gestión de escenas
- Entidades simples con movimiento

Para ejecutar los ejemplos:

```bash
# Clonar el repositorio
git clone https://github.com/lemur-bookstores/web-2d-game-engine.git

# Instalar dependencias
cd web-2d-game-engine
npm install

# Construir el proyecto
npm run build

# Iniciar servidor de desarrollo
npm run preview
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

La documentación completa estará disponible próximamente.

Por ahora, puedes explorar:

- [examples/](examples/) para ejemplos de uso
- [src/types/](src/types/) para definiciones de tipos
- [src/core/](src/core/) para la implementación del core

## 📝 TODO

- [ ] Sistema de renderizado WebGL
- [ ] Sistema de renderizado Canvas2D
- [ ] Integración Box2D para física
- [ ] Sistema de entrada (teclado, mouse, touch)
- [ ] Sistema de sprites y animación
- [ ] Sistema de audio
- [ ] Documentación completa
- [ ] Más ejemplos

## 🤝 Contribución

Las contribuciones son bienvenidas! Por favor, lee nuestras guías de contribución antes de enviar un PR.

## 📄 Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.
