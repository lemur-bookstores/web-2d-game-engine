# Input System — InputManager e InputSystem

Ejemplo

```ts
import { InputManager } from "../src/input/InputManager";
const im = InputManager.getInstance();
im.initialize({ canvas, enableKeyboard: true });
```

Descripción

- Maneja teclado, ratón y touch, emitiendo eventos via `EventSystem`.
