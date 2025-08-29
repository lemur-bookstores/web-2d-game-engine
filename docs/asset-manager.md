# AssetManager — Carga y gestión de recursos

Ejemplo

```ts
import { AssetManager } from "../src/assets/AssetManager";
const am = AssetManager.getInstance();
await am.loadTexture("player", "/assets/player.png");
```

Descripción

- Gestiona texturas, audio y otros assets con caching y promesas.
