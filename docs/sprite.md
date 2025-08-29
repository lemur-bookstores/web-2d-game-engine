# Sprite — Componente de render de sprites

Ejemplo

```ts
entity.addComponent({
  type: "sprite",
  texture: "player",
  width: 32,
  height: 32,
});
```

Descripción

- Usa `AssetManager` para cargar texturas y referencias por clave.

SpriteSheet API (frames CRUD, ids and atlas roundtrip)

El motor ahora expone utilidades para manipular `SpriteSheet` en tiempo de ejecución y para que herramientas conserven referencias estables entre animaciones y frames.

Ejemplos rápidos

1. Crear/Enumerar frames

```ts
import { SpriteSheet } from "../src/graphics/SpriteSheet";

const sheet = SpriteSheet.fromFrames(texture, [
  { x: 0, y: 0, width: 16, height: 16 },
]);

// lista todos los frames (cada frame tiene un `id` uuid)
const frames = sheet.listFrames();
```

2. Añadir/Actualizar/Eliminar frames

```ts
// add
const idx = sheet.addFrame({ x: 32, y: 0, width: 16, height: 16 });

// update full frame (preserves existing id)
sheet.updateFrame(idx, { x: 32, y: 0, width: 20, height: 20 });

// update rectangle only
sheet.updateFrameRect(idx, 40, 0, 18, 18);

// remove
sheet.removeFrame(idx);
```

3. Buscar por id (útil para editores)

```ts
const someId = frames[0].id!;
const foundIndex = sheet.findFrameById(someId);
```

4. Importar/Exportar atlas preservando ids

```ts
// importar: atlasData puede referenciar animaciones por frame id o por índice
const sheetFromAtlas = SpriteSheet.fromAtlas(texture, atlasData);

// exportar: genera objeto atlas con `frames[].id` y `animations` que referencian frames por id
const exported = sheet.toAtlas();
// guardar exported como JSON para herramientas/editor
```

Notas

- Cada frame tiene un `id` UUID estable para que las herramientas puedan referenciar frames incluso cuando el orden cambia.
- `toAtlas()` exporta animaciones referenciando frames por id; `fromAtlas()` acepta animaciones que referencian frames por id o por índice.
