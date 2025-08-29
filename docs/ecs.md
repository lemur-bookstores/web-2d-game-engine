# ECS — Entidades, Componentes y Sistemas

Resumen

- Explicación del patrón ECS usado por el motor.
- Ejemplo mínimo de creación de entidad y sistema.

Ejemplo

```ts
import { Entity } from "../src/ecs/Entity";
import { System } from "../src/ecs/System";

class MoveSystem extends System {
  update(entities, dt) {
    // ...existing code...
  }
}

const e = new Entity("player");
e.addComponent({ type: "transform", position: { x: 0, y: 0 } });
```

Descripción

- Entidades: identificadores que agregan componentes.
- Componentes: POJOs con `type` y datos.
- Sistemas: lógica que procesa entidades con conjuntos de componentes.

Para más ejemplos revisa los documentos individuales en esta carpeta.
