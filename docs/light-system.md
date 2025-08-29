# Light System — Sistema de luces y layer resolver

Ejemplo

```ts
import { LightRegistry } from "../src/lights/LightRegistry";
LightRegistry.setLayerResolver((name) => (name === "default" ? 1 : 2));
```

Descripción

- Registro para luces y resolución de nombres de capas a máscaras de bit.
