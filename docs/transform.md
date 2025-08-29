# Transform — Componente de posición/rotación/escala

Ejemplo

```ts
entity.addComponent({
  type: "transform",
  position: { x: 10, y: 20 },
  rotation: 0,
  scale: { x: 1, y: 1 },
});
```

Descripción

- `position`, `rotation` y `scale` son usados por el `RenderSystem` y sistemas de física.
