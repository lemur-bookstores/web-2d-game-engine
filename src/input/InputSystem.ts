import { System } from '../core/ecs/System';
import { Entity } from '../core/ecs/Entity';
import { InputManager } from './InputManager';
import { Transform } from '../math/Transform';
import { INPUT_EVENTS } from '@/types/event-const';

export interface InputComponent {
    type: 'input';
    moveSpeed: number;
    rotationSpeed: number;
    keyBindings: Map<string, string>; // key -> action
    mouseEnabled: boolean;
    touchEnabled: boolean;
}

export class InputSystem extends System {
    private inputManager: InputManager;

    constructor() {
        super(['input', 'transform']);
        this.inputManager = InputManager.getInstance();
    }

    public update(deltaTime: number): void {
        // Update input manager state
        this.inputManager.update();

        // Process input for all entities with input components
        this.entities.forEach((entity: Entity) => {
            this.processEntityInput(entity, deltaTime);
        });
    }

    private processEntityInput(entity: Entity, deltaTime: number): void {
        const inputComponent = entity.getComponent('input') as InputComponent;
        const transform = entity.getComponent('transform') as Transform;

        if (!inputComponent || !transform) return;

        // Process keyboard input based on key bindings
        inputComponent.keyBindings.forEach((action, key) => {
            if (this.inputManager.isKeyPressed(key)) {
                this.handleAction(entity, action, deltaTime, inputComponent, transform);
            }
        });

        // Process mouse input if enabled
        if (inputComponent.mouseEnabled) {
            this.processMouseInput(entity, inputComponent, transform, deltaTime);
        }

        // Process touch input if enabled
        if (inputComponent.touchEnabled) {
            this.processTouchInput(entity, inputComponent, transform, deltaTime);
        }
    }

    private handleAction(
        entity: Entity,
        action: string,
        deltaTime: number,
        inputComponent: InputComponent,
        transform: Transform
    ): void {
        switch (action) {
            case 'moveUp':
                transform.position.y -= inputComponent.moveSpeed * deltaTime;
                break;
            case 'moveDown':
                transform.position.y += inputComponent.moveSpeed * deltaTime;
                break;
            case 'moveLeft':
                transform.position.x -= inputComponent.moveSpeed * deltaTime;
                break;
            case 'moveRight':
                transform.position.x += inputComponent.moveSpeed * deltaTime;
                break;
            case 'rotateLeft':
                transform.rotation -= inputComponent.rotationSpeed * deltaTime;
                break;
            case 'rotateRight':
                transform.rotation += inputComponent.rotationSpeed * deltaTime;
                break;
            default:
                // Emit custom action event for game-specific handling
                this.inputManager['eventSystem'].emit(INPUT_EVENTS.ACTION, {
                    entity: entity.getId(),
                    action,
                    deltaTime
                });
                break;
        }
    }

    private processMouseInput(
        entity: Entity,
        _inputComponent: InputComponent,
        transform: Transform,
        deltaTime: number
    ): void {
        // Example: Rotate entity to face mouse position
        const mousePosition = this.inputManager.getMousePosition();
        const entityPosition = transform.position;

        const direction = mousePosition.subtract(entityPosition);
        const angle = Math.atan2(direction.y, direction.x);
        transform.rotation = angle;

        // Handle mouse button clicks
        if (this.inputManager.isMouseButtonJustPressed(0)) { // Left click
            this.inputManager['eventSystem'].emit(INPUT_EVENTS.ACTION, {
                entity: entity.getId(),
                action: INPUT_EVENTS.MOUSE_PRIMARY_ACTION,
                position: mousePosition,
                deltaTime
            });
        }

        if (this.inputManager.isMouseButtonJustPressed(2)) { // Right click
            this.inputManager['eventSystem'].emit(INPUT_EVENTS.ACTION, {
                entity: entity.getId(),
                action: INPUT_EVENTS.MOUSE_SECONDARY_ACTION,
                position: mousePosition,
                deltaTime
            });
        }
    }

    private processTouchInput(
        entity: Entity,
        inputComponent: InputComponent,
        transform: Transform,
        deltaTime: number
    ): void {
        const touches = this.inputManager.getTouches();

        if (touches.length > 0) {
            const touch = touches[0]; // Use first touch for movement

            // Example: Move entity towards touch position
            const direction = touch.position.subtract(transform.position);
            const distance = direction.magnitude();

            if (distance > 10) { // Dead zone
                direction.normalize();
                transform.position.add(
                    direction.multiply(inputComponent.moveSpeed * deltaTime)
                );
            }

            // Emit touch events
            this.inputManager['eventSystem'].emit(INPUT_EVENTS.ACTION, {
                entity: entity.getId(),
                action: 'touchMove',
                position: touch.position,
                force: touch.force,
                deltaTime
            });
        }
    }

    public createInputComponent(config: Partial<InputComponent> = {}): InputComponent {
        const defaultKeyBindings = new Map([
            ['KeyW', 'moveUp'],
            ['KeyA', 'moveLeft'],
            ['KeyS', 'moveDown'],
            ['KeyD', 'moveRight'],
            ['ArrowUp', 'moveUp'],
            ['ArrowLeft', 'moveLeft'],
            ['ArrowDown', 'moveDown'],
            ['ArrowRight', 'moveRight'],
            ['KeyQ', 'rotateLeft'],
            ['KeyE', 'rotateRight'],
            ['Space', 'jump'],
            ['ShiftLeft', 'run'],
            ['KeyF', 'interact']
        ]);

        return {
            type: 'input',
            moveSpeed: config.moveSpeed || 100,
            rotationSpeed: config.rotationSpeed || Math.PI,
            keyBindings: config.keyBindings || defaultKeyBindings,
            mouseEnabled: config.mouseEnabled !== false,
            touchEnabled: config.touchEnabled !== false
        };
    }

    // Utility methods for custom input handling
    public bindKey(entity: Entity, key: string, action: string): void {
        const inputComponent = entity.getComponent('input') as InputComponent;
        if (inputComponent) {
            inputComponent.keyBindings.set(key, action);
        }
    }

    public unbindKey(entity: Entity, key: string): void {
        const inputComponent = entity.getComponent('input') as InputComponent;
        if (inputComponent) {
            inputComponent.keyBindings.delete(key);
        }
    }

    public setMoveSpeed(entity: Entity, speed: number): void {
        const inputComponent = entity.getComponent('input') as InputComponent;
        if (inputComponent) {
            inputComponent.moveSpeed = speed;
        }
    }

    public setRotationSpeed(entity: Entity, speed: number): void {
        const inputComponent = entity.getComponent('input') as InputComponent;
        if (inputComponent) {
            inputComponent.rotationSpeed = speed;
        }
    }

    public enableMouse(entity: Entity, enabled: boolean = true): void {
        const inputComponent = entity.getComponent('input') as InputComponent;
        if (inputComponent) {
            inputComponent.mouseEnabled = enabled;
        }
    }

    public enableTouch(entity: Entity, enabled: boolean = true): void {
        const inputComponent = entity.getComponent('input') as InputComponent;
        if (inputComponent) {
            inputComponent.touchEnabled = enabled;
        }
    }

    // Method to get input manager for direct access if needed
    public getInputManager(): InputManager {
        return this.inputManager;
    }
}
