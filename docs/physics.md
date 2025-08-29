# Physics — PhysicsSystem y Box2D fallback

Ejemplo

```ts
import { PhysicsSystem } from "../src/physics/PhysicsSystem";
const phys = new PhysicsSystem();
engine.addSystem(phys);
```

Descripción

- El motor intenta inicializar Box2D (WASM). Si no está disponible, entra en modo fallback.
