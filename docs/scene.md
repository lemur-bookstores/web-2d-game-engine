# Scene — Gestión de escenas y ciclo de vida

Ejemplo

```ts
import { Scene } from "../src/core/Scene";
const scene = new Scene("level1");
scene.addEntity(playerEntity);
```

Descripción

- `Scene` organiza entidades y sistemas. Use `engine.addScene(scene)` y `engine.setActiveScene(name)`.
