import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EventSystem } from '../../src/core/EventSystem';
import { InputManager, KeyboardEvent, MouseEvent, TouchEvent, TouchData } from '../../src/input';

describe('Input System Tests', () => {
    let inputManager: InputManager;
    let mockCanvas: HTMLCanvasElement;
    let eventSystem: EventSystem;

    beforeEach(() => {
        mockCanvas = document.createElement('canvas');
        eventSystem = EventSystem.getInstance();
        inputManager = InputManager.getInstance();
        inputManager.initialize({ canvas: mockCanvas });
    });

    afterEach(() => {
        inputManager.destroy();
        vi.clearAllMocks();
    });

    describe('Keyboard Input', () => {
        it('should detect key press and release', () => {
            let keyPressed = false;
            eventSystem.on('input:keyDown', (event) => {
                const data = event.data as KeyboardEvent;
                if (data.code === 'Space') keyPressed = true;
            });

            // Simulate keyboard event
            const event = new KeyboardEvent('keydown', { code: 'Space' });
            document.dispatchEvent(event);

            expect(keyPressed).toBe(true);
            expect(inputManager.isKeyPressed('Space')).toBe(true);

            // Simulate key release
            const releaseEvent = new KeyboardEvent('keyup', { code: 'Space' });
            document.dispatchEvent(releaseEvent);

            expect(inputManager.isKeyPressed('Space')).toBe(false);
        });

        it('should handle multiple keys simultaneously', () => {
            // Press multiple keys
            document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW' }));
            document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyA' }));

            expect(inputManager.isKeyPressed('KeyW')).toBe(true);
            expect(inputManager.isKeyPressed('KeyA')).toBe(true);
        });
    });

    describe('Mouse Input', () => {
        it('should track mouse position', () => {
            const mouseEvent = new MouseEvent('mousemove', {
                clientX: 100,
                clientY: 150
            });
            mockCanvas.dispatchEvent(mouseEvent);

            const position = inputManager.getMousePosition();
            expect(position.x).toBe(100);
            expect(position.y).toBe(150);
        });

        it('should detect mouse buttons', () => {
            const mouseDownEvent = new MouseEvent('mousedown', { button: 0 });
            mockCanvas.dispatchEvent(mouseDownEvent);

            expect(inputManager.isMouseButtonPressed(0)).toBe(true);

            const mouseUpEvent = new MouseEvent('mouseup', { button: 0 });
            mockCanvas.dispatchEvent(mouseUpEvent);

            expect(inputManager.isMouseButtonPressed(0)).toBe(false);
        });

        it('should handle mouse wheel events', () => {
            let wheelDelta = 0;
            eventSystem.on('input:wheel', (event) => {
                const data = event.data as MouseEvent;
                wheelDelta = data.deltaY;
            });

            const wheelEvent = new WheelEvent('wheel', { deltaY: 100 });
            mockCanvas.dispatchEvent(wheelEvent);

            expect(wheelDelta).toBe(100);
        });
    });

    describe('Touch Input', () => {
        it('should handle touch events', () => {
            let touchStarted = false;
            eventSystem.on('input:touchStart', () => {
                touchStarted = true;
            });

            const touchEvent = new TouchEvent('touchstart', {
                touches: [{
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
                } as Touch]
            });
            mockCanvas.dispatchEvent(touchEvent);

            expect(touchStarted).toBe(true);
            const touches = inputManager.getTouches();
            expect(touches.length).toBe(1);
            expect(touches[0].position.x).toBe(100);
            expect(touches[0].position.y).toBe(150);
        });

        it('should handle multi-touch', () => {
            const touchEvent = new TouchEvent('touchstart', {
                touches: [
                    {
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
                    } as Touch,
                    {
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
                    } as Touch
                ]
            });
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
