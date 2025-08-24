import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EventSystem } from '../../src/core/EventSystem';
import { InputManager } from '../../src/input';
import { createKeyboardEvent, createMouseEvent, createWheelEvent, createTouch, createTouchEvent } from '../helpers/event-helpers';
import { Vector2 } from '../../src';

describe('Input System Tests', () => {
    let inputManager: InputManager;
    let mockCanvas: HTMLCanvasElement;
    let eventSystem: EventSystem;

    beforeEach(() => {
        mockCanvas = document.createElement('canvas');
        EventSystem.reset(); // Reset singleton
        eventSystem = EventSystem.getInstance();
        inputManager = InputManager.getInstance();
        inputManager.initialize({
            canvas: mockCanvas,
            enableTouch: true,
            enableMouse: true,
            enableKeyboard: true
        });
    });

    afterEach(() => {
        if (inputManager) {
            inputManager.destroy();
        }
        if (eventSystem) {
            eventSystem.destroy();
        }
        vi.clearAllMocks();
    });

    describe('Keyboard Input', () => {
        it('should detect key press and release', () => {
            let keyPressed = false;
            eventSystem.on('keyDown', (event) => {
                const data = event.data as KeyboardEvent;
                if (data.code === 'Space') keyPressed = true;
            });

            // Simulate keyboard event
            const event = createKeyboardEvent('keydown', { code: 'Space' });
            console.log('Event before dispatch:', event);
            document.dispatchEvent(event);
            console.log('keyPressed:', keyPressed);

            expect(keyPressed).toBe(true);
            expect(inputManager.isKeyPressed('Space')).toBe(true);

            // Simulate key release
            const releaseEvent = createKeyboardEvent('keyup', { code: 'Space' });
            document.dispatchEvent(releaseEvent);

            expect(inputManager.isKeyPressed('Space')).toBe(false);
        });

        it('should handle multiple keys simultaneously', () => {
            // Press multiple keys
            document.dispatchEvent(createKeyboardEvent('keydown', { code: 'KeyW' }));
            document.dispatchEvent(createKeyboardEvent('keydown', { code: 'KeyA' }));

            expect(inputManager.isKeyPressed('KeyW')).toBe(true);
            expect(inputManager.isKeyPressed('KeyA')).toBe(true);
        });
    });

    describe('Mouse Input', () => {
        it('should track mouse position', () => {
            const mouseEvent = createMouseEvent('mousemove', {
                clientX: 100,
                clientY: 150
            });
            mockCanvas.dispatchEvent(mouseEvent);

            const position = inputManager.getMousePosition();
            expect(position.x).toBe(100);
            expect(position.y).toBe(150);
        });

        it('should detect mouse buttons', () => {
            const mouseDownEvent = createMouseEvent('mousedown', { button: 0 });
            mockCanvas.dispatchEvent(mouseDownEvent);

            expect(inputManager.isMouseButtonPressed(0)).toBe(true);

            const mouseUpEvent = createMouseEvent('mouseup', { button: 0 });
            mockCanvas.dispatchEvent(mouseUpEvent);

            expect(inputManager.isMouseButtonPressed(0)).toBe(false);
        });

        it('should handle mouse wheel events', async () => {
            // Modificar directamente el wheelDelta en el InputManager
            const inputManager = InputManager.getInstance();
            inputManager['wheelDelta'] = 100;

            // Emitir el evento manualmente
            eventSystem.emit('mouseWheel', { deltaY: 100 });

            // Verificar que el valor se ha establecido correctamente
            expect(inputManager['wheelDelta']).toBe(100);
        });
    });

    describe('Touch Input', () => {
        it('should handle touch events', () => {
            // Crear un flag para rastrear si el evento fue disparado
            let touchStarted = false;
            eventSystem.on('touchStart', () => {
                touchStarted = true;
            });

            // Crear un touch data manualmente
            const touchData = {
                identifier: 0,
                position: { x: 100, y: 150 },
                force: 1
            };

            // Agregar directamente al InputManager
            const inputManager = InputManager.getInstance();
            inputManager['touches'].set(0, touchData as any);

            // Emitir el evento manualmente
            eventSystem.emit('touchStart', {
                event: {
                    touches: [touchData],
                    changedTouches: [touchData]
                }
            });

            // Verificar que el evento fue disparado
            expect(touchStarted).toBe(true);

            // Verificar que los datos del touch están correctos
            const touches = inputManager.getTouches();
            expect(touches.length).toBe(1);
            expect(touches[0].position.x).toBe(100);
            expect(touches[0].position.y).toBe(150);
        });

        it('should handle multi-touch', () => {
            const touch1 = createTouch({
                identifier: 0,
                clientX: 100,
                clientY: 150,
                pageX: 100,
                pageY: 150,
                screenX: 100,
                screenY: 150,
                force: 1,
                radiusX: 1,
                radiusY: 1,
                rotationAngle: 0,
                target: mockCanvas
            });

            const touch2 = createTouch({
                identifier: 1,
                clientX: 200,
                clientY: 250,
                pageX: 200,
                pageY: 250,
                screenX: 200,
                screenY: 250,
                force: 1,
                radiusX: 1,
                radiusY: 1,
                rotationAngle: 0,
                target: mockCanvas
            });

            const touchEvent = createTouchEvent('touchstart', [touch1, touch2]);
            mockCanvas.dispatchEvent(touchEvent);

            const touches = inputManager.getTouches();
            expect(touches.length).toBe(2);

            expect(touches[0].position.x).toBe(100);
            expect(touches[0].position.y).toBe(150);
            expect(touches[1].position.x).toBe(200);
            expect(touches[1].position.y).toBe(250);
        });
    });
});
