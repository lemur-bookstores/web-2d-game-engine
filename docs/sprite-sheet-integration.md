## Integración de la Sprite Sheet Library en el engine

Objetivo

- Integrar `src/libs/sprite-sheet` en el engine para que AssetManager y los ejemplos puedan generar automáticamente metadata de frames (UVs) tanto por grid como por detección dinámica, manteniendo compatibilidad con la API actual.

Resumen ejecutivo (recomendación)

- Estrategia preferida: Extender `AssetManager.loadSpriteSheet` para ofrecer una opción `useSpriteSheetLib` que, cuando esté activada, use `SpriteSheetLibrary` (facade) para separar frames y crear un `graphics.SpriteSheet` del engine a partir de los frames calculados.
- Implementar además un constructor/estático `SpriteSheet.fromFrames(texture, framesInPixels)` en `src/graphics/SpriteSheet` para encapsular la conversión UV->rect píxel.
- Mantener compatibilidad: si `useSpriteSheetLib` no está activado, `AssetManager.loadSpriteSheet` conservará su comportamiento actual (atlas o new SpriteSheet(texture, w, h)).

Razones

- Centraliza la carga y metadata en `AssetManager` (menos cambios en ejemplos/sistemas).
- Mantiene la API pública existente y facilita migración incremental.
- Evita modificar el `AnimationSystem` (usa la estructura `SpriteSheet` existente).

Documento de implementación (pasos concretos)

1. Renombrado / export público

   - Asegurar que la fachada exportada desde `src/libs/sprite-sheet` use un nombre no conflictivo, por ejemplo `SpriteSheetLibrary` (evita choque con `graphics/SpriteSheet`).

2. Añadir helper en `graphics/SpriteSheet`

   - Añadir método estático `fromFrames(texture: Texture, frames: Array<{ x:number,y:number,width:number,height:number }>)` que cree la instancia y asigne `frames` y preserve compatibilidad de `getFrame`/`getAnimation`.

3. Añadir util/adaptador reutilizable

   - Crear `src/libs/sprite-sheet/adapter.ts` con función `convertNormalizedToPixelFrames(texture: Texture, spriteFrames: SpriteFrame[]): Array<{x,y,width,height}>` que aplica Math.round y clampa dentro de los límites de la textura.

4. Extender `AssetManager.loadSpriteSheet`

   - Nueva firma opcional (añadir `options?: { useSpriteSheetLib?: boolean; libraryMode?: 'grid'|'dynamic'; grid?: GridOptions; dynamic?: DynamicOptions; namingPattern?: string }`).
   - Si `useSpriteSheetLib` === true y no hay `atlasPath`, entonces:
     a) Obtener ImageData (usar existing loader or CanvasImageReaderAdapter). Para browser, usar un canvas intermedio si solo se tiene `Texture`.
     b) Llamar a `SpriteSheetLibrary.separateByGrid` o `.separateDynamically` con `options`.
     c) Convertir UVs retornadas en pixel-rects con `convertNormalizedToPixelFrames`.
     d) Crear `SpriteSheet.fromFrames(texture, framesInPixels)` y guardarlo como asset.

5. Tests a añadir

   - Unit: `tests/unit/sprite-library-adapter.test.ts` — verifica `convertNormalizedToPixelFrames` y `SpriteSheet.fromFrames` con texturas mock.
   - Unit: `tests/unit/assetmanager-spritesheet-lib.test.ts` — mock AssetLoader/Texture; llamar a `AssetManager.loadSpriteSheet(..., options: { useSpriteSheetLib: true, libraryMode: 'grid' })` y comprobar frames en el SpriteSheet retornado.
   - Integration: `tests/integration/animation-with-library.test.ts` — carga spritesheet via AssetManager con `useSpriteSheetLib`, registra en `AnimationSystem`, corre update y verifica que `sprite.uvX/uvY` cambian acorde a frames.

6. Migración de ejemplos
   - `examples/platformer/index.ts` y `examples/space-shooter/index.ts` pueden optar por `useSpriteSheetLib:true` en sus llamadas a `loadSpriteSheet` una vez estables.

Decisiones de diseño y edge-cases

- Rounding: usar Math.round; si la suma de ancho/alto supera el tamaño del texture, clamar con Math.min y ajustar la última columna/fila.
- Coordinate origin: la librería y el engine usan top-left origin — compatible.
- Performance: separación dinámica es costosa; ofrecérsela como opción en `loadSpriteSheet` (no forzar por defecto). Para cargas grandes, sugerir offload a WebWorker o realizar separación en build-time.
- Naming collision: usar `SpriteSheetLibrary` en exports para evitar shadowing con `graphics.SpriteSheet`.

Plan de despliegue (práctico)

1. Implementar los cambios en una rama feature (por ejemplo `feature/integrate-spritesheet-lib`).
2. Crear los tests unitarios + integration señalados.
3. Ejecutar test suite local y ajustar fallos. Mantener backward compatibility.
4. Actualizar ejemplos para usar `useSpriteSheetLib` (opt-in).
5. Abrir PR y pedir revisión; luego merge y rollout.

Checklist rápido para el PR

- [x] Exportar facade como `SpriteSheetLibrary` (no romper otros imports)
- [x] Añadir `SpriteSheet.fromFrames`
- [x] Añadir `adapter.convertNormalizedToPixelFrames`
- [x] Extender `AssetManager.loadSpriteSheet` con `options.useSpriteSheetLib`
- [x] Añadir tests unit/integration
- [ ] Actualizar README/Docs de `src/libs/sprite-sheet` con nota de integración

## Estado de Implementación

✅ **COMPLETADO** - La integración básica está funcionando:

1. **Facade renombrada**: Exporta `SpriteSheetLibrary` para evitar conflictos de nombres
2. **Adapter implementado**: `engine-adapter.ts` con `convertNormalizedToPixelFrames()`
3. **SpriteSheet.fromFrames**: Método estático añadido a `graphics/SpriteSheet.ts`
4. **AssetManager extendido**: Nuevo parámetro `options` con soporte para `useSpriteSheetLib`
5. **Tests completos**:
   - Unit tests para la librería sprite-sheet
   - Unit tests para el adapter y SpriteSheet.fromFrames
   - Unit tests para AssetManager con library integration
   - Integration tests para AnimationSystem + AssetManager + Library

### Uso Actual

```typescript
// Cargar sprite sheet usando grid detection
const options: SpriteSheetLibraryOptions = {
  useSpriteSheetLib: true,
  libraryMode: "grid",
  grid: {
    frameWidth: 32,
    frameHeight: 32,
    startX: 0,
    startY: 0,
    spacing: 0,
    margin: 0,
  },
  namingPattern: "frame_{index}",
};

const spriteSheet = await assetManager.loadSpriteSheet(
  "character",
  "character.png",
  undefined, // no atlas
  undefined, // no frameWidth (using library)
  undefined, // no frameHeight (using library)
  options
);

// Cargar sprite sheet usando dynamic detection
const dynamicOptions: SpriteSheetLibraryOptions = {
  useSpriteSheetLib: true,
  libraryMode: "dynamic",
  dynamic: {
    alphaThreshold: 128,
    minFrameSize: 16,
    padding: 2,
  },
  namingPattern: "sprite_{index}",
};

const uiSheet = await assetManager.loadSpriteSheet(
  "ui-elements",
  "ui.png",
  undefined,
  undefined,
  undefined,
  dynamicOptions
);
```

### Compatibilidad

- ✅ API anterior mantiene funcionalidad completa
- ✅ Tests existentes siguen pasando
- ✅ AnimationSystem funciona sin cambios con sprite sheets generados por la librería
- ✅ Soporte tanto para grid como dynamic detection

Anexos: comandos útiles

```bash
# Ejecutar tests focales
npx vitest tests/unit/sprite-library-adapter.test.ts

# Ejecutar suite completa
npx vitest
```

Conclusión breve

- La integración propuesta es opt-in, mínima invasiva sobre el pipeline actual y mantiene compatibilidad con `SpriteSheet` y `AnimationSystem`. Implementarla en `AssetManager` centraliza la responsabilidad de producir metadata (frames) y facilita migración gradual de ejemplos.
