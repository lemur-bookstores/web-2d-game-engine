# Entity — API de entidades

Ejemplo

```ts
import { Entity } from "../src/ecs/Entity";
const e = new Entity("enemy");
e.addComponent({ type: "transform", position: { x: 100, y: 100 } });
e.removeComponent("sprite");
```

Descripción

- `Entity` expone `addComponent`, `getComponent`, `removeComponent` y `hasComponent`.
