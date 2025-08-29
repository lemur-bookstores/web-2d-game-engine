# Particle System — Emitters, pooling y serialización

Ejemplo

```ts
import { ParticleSystem } from "../src/particles/ParticleSystem";
const ps = new ParticleSystem();
ps.setScene(engine.getActiveScene());
ps.attachEmitter(entity, ParticleRegistry.createDefaultParticle());
engine.addSystem(ps);
```

Descripción

- Soporta `attachEmitter`, pooling de partículas, `getParticlesForRender()` y serialización via `ParticleRegistry`.
