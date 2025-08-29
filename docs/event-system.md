# Event System — Comunicación entre sistemas

Ejemplo

```ts
import { EventSystem } from "../src/core/EventSystem";
const ev = EventSystem.getInstance();
ev.on("MY_EVENT", (data) => console.log(data));
ev.emit("MY_EVENT", { foo: "bar" });
```

Descripción

- Singleton para emitir y escuchar eventos dentro del motor.
