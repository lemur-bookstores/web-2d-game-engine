# Script Component — Scripts enlazados a entidades

Ejemplo

```ts
// Registrar script
ScriptRegistry.register("MoveScript", MoveScriptClass);
// Asignar a entidad
entity.addComponent({ type: "script", name: "MoveScript", enabled: true });
```

Descripción

- Permite enlazar clases de script por nombre, serializar y restaurar en runtime.
