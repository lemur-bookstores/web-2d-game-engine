/**
 * Ejemplo de uso del sistema de entrada
 * Demonstra cómo usar InputManager e InputSystem
 */

import { InputManager, InputSystem } from '../src/input';
import { Entity } from '../src/core/ecs/Entity';
import { Transform } from '../src/math/Transform';
import { Vector2 } from '../src/math/Vector2';

// Ejemplo de configuración e inicialización
export function setupInputExample() {
    // Obtener canvas del juego
    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;

    // Inicializar InputManager
    const inputManager = InputManager.getInstance();
    inputManager.initialize({
        canvas,
        preventDefaultKeys: ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'],
        enableTouch: true,
        enableMouse: true,
        enableKeyboard: true
    });

    // Crear sistema de input
    const inputSystem = new InputSystem();

    // Crear entidad de ejemplo con componente de input
    const player = new Entity();

    // Agregar componente de transformación
    player.addComponent('transform', new Transform(new Vector2(100, 100)));

    // Agregar componente de input con configuración personalizada
    const inputComponent = inputSystem.createInputComponent({
        moveSpeed: 200,
        rotationSpeed: Math.PI * 2,
        mouseEnabled: true,
        touchEnabled: true
    });

    // Personalizar controles
    inputComponent.keyBindings.set('KeyW', 'moveUp');
    inputComponent.keyBindings.set('KeyA', 'moveLeft');
    inputComponent.keyBindings.set('KeyS', 'moveDown');
    inputComponent.keyBindings.set('KeyD', 'moveRight');
    inputComponent.keyBindings.set('Space', 'jump');
    inputComponent.keyBindings.set('KeyF', 'interact');

    player.addComponent('input', inputComponent);

    // Registrar callbacks personalizados para acciones específicas
    inputManager.onKeyDown('Space', (event) => {
        console.log('Player jumped!', event);
    });

    inputManager.onMouseDown(0, (event) => {
        console.log('Left click at:', event.position);
    });

    inputManager.onMouseDown(2, (event) => {
        console.log('Right click at:', event.position);
    });

    // Controles específicos para movimiento con flechas
    inputManager.onKeyDown(['ArrowUp', 'KeyW'], () => {
        console.log('Moving up');
    });

    inputManager.onKeyDown(['ArrowDown', 'KeyS'], () => {
        console.log('Moving down');
    });

    inputManager.onKeyDown(['ArrowLeft', 'KeyA'], () => {
        console.log('Moving left');
    });

    inputManager.onKeyDown(['ArrowRight', 'KeyD'], () => {
        console.log('Moving right');
    });

    // Eventos de touch para dispositivos móviles
    inputManager.onTouchStart((event) => {
        console.log('Touch started:', event.touches.length, 'touches');
    });

    inputManager.onTouchMove((event) => {
        if (event.touches.length > 0) {
            console.log('Touch move to:', event.touches[0].position);
        }
    });

    inputManager.onTouchEnd((event) => {
        console.log('Touch ended, remaining touches:', event.touches.length);
    });

    // Eventos del mouse wheel
    inputManager.onMouseWheel((deltaY) => {
        console.log('Mouse wheel:', deltaY > 0 ? 'down' : 'up');
    });

    // Eventos de movimiento del mouse
    inputManager.onMouseMove((event) => {
        if (inputManager.isMouseButtonPressed(0)) {
            console.log('Dragging to:', event.position);
        }
    });

    return { inputManager, inputSystem, player };
}

// Ejemplo de loop de juego con input
export function gameLoopExample() {
    const { inputManager, inputSystem, player } = setupInputExample();

    // Simular entidades en el mundo
    const entities = [player];

    function update(deltaTime: number) {
        // Actualizar sistema de input
        inputSystem.update(deltaTime);

        // Ejemplos de consultas de estado
        if (inputManager.isKeyPressed('KeyW')) {
            console.log('W key is being held down');
        }

        if (inputManager.isKeyJustPressed('Space')) {
            console.log('Space was just pressed this frame');
        }

        if (inputManager.isMouseButtonPressed(0)) {
            const mousePos = inputManager.getMousePosition();
            console.log('Left mouse button held at:', mousePos);
        }

        const touches = inputManager.getTouches();
        if (touches.length > 0) {
            console.log('Active touches:', touches.length);
        }

        // Siguiente frame
        requestAnimationFrame(() => update(16.67)); // ~60 FPS
    }

    // Iniciar loop
    update(16.67);
}

// Ejemplo de configuración avanzada para diferentes tipos de entidades
export function advancedInputExample() {
    const inputSystem = new InputSystem();

    // Crear jugador con controles WASD
    const player = new Entity();
    player.addComponent('transform', new Transform(new Vector2(100, 100)));

    const playerInput = inputSystem.createInputComponent({
        moveSpeed: 250,
        rotationSpeed: Math.PI * 1.5
    });

    // Configurar controles del jugador
    playerInput.keyBindings.clear();
    playerInput.keyBindings.set('KeyW', 'moveUp');
    playerInput.keyBindings.set('KeyA', 'moveLeft');
    playerInput.keyBindings.set('KeyS', 'moveDown');
    playerInput.keyBindings.set('KeyD', 'moveRight');
    playerInput.keyBindings.set('Space', 'jump');
    playerInput.keyBindings.set('ShiftLeft', 'run');

    player.addComponent('input', playerInput);

    // Crear entidad controlada con flechas (para segundo jugador)
    const player2 = new Entity();
    player2.addComponent('transform', new Transform(new Vector2(200, 100)));

    const player2Input = inputSystem.createInputComponent({
        moveSpeed: 200,
        rotationSpeed: Math.PI,
        mouseEnabled: false, // Deshabilitar mouse para segundo jugador
        touchEnabled: false
    });

    // Configurar controles con flechas
    player2Input.keyBindings.clear();
    player2Input.keyBindings.set('ArrowUp', 'moveUp');
    player2Input.keyBindings.set('ArrowLeft', 'moveLeft');
    player2Input.keyBindings.set('ArrowDown', 'moveDown');
    player2Input.keyBindings.set('ArrowRight', 'moveRight');
    player2Input.keyBindings.set('KeyM', 'jump');
    player2Input.keyBindings.set('KeyN', 'run');

    player2.addComponent('input', player2Input);

    // Crear entidad solo controlada por mouse (cursor, cámara, etc.)
    const cursor = new Entity();
    cursor.addComponent('transform', new Transform(new Vector2(0, 0)));

    const cursorInput = inputSystem.createInputComponent({
        moveSpeed: 0, // No movimiento por teclado
        rotationSpeed: 0,
        mouseEnabled: true,
        touchEnabled: true
    });

    cursorInput.keyBindings.clear(); // Sin controles de teclado

    cursor.addComponent('input', cursorInput);

    return { inputSystem, player, player2, cursor };
}

// Función para limpiar recursos cuando el juego termina
export function cleanupInput() {
    const inputManager = InputManager.getInstance();
    inputManager.destroy();
}

// Ejemplo de uso en el contexto del motor completo
export function integrateWithEngine(engine: any) {
    // Configurar input en el motor
    const inputManager = InputManager.getInstance();
    inputManager.initialize({
        canvas: engine.canvas,
        preventDefaultKeys: ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'],
        enableTouch: true,
        enableMouse: true,
        enableKeyboard: true
    });

    // Agregar sistema de input al motor
    const inputSystem = new InputSystem();
    engine.addSystem(inputSystem);

    // Configurar eventos globales del input
    engine.events.on('INPUT:ACTION', (event: any) => {
        console.log('Input action:', event.data);

        switch (event.data.action) {
            case 'jump':
                // Lógica de salto
                break;
            case 'interact':
                // Lógica de interacción
                break;
            case 'primaryAction':
                // Acción primaria (click izquierdo)
                break;
            case 'secondaryAction':
                // Acción secundaria (click derecho)
                break;
        }
    });

    return inputSystem;
}
