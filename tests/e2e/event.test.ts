import { describe, it, expect } from 'vitest';
import { Entity } from '../../src/ecs/Entity';
import { System } from '../../src/ecs/System';
import { World } from '../../src/ecs/World';
import { EventSystem } from '../../src/core/EventSystem';

describe('Event System Tests', () => {
    it('should handle event subscription and emission', () => {
        const eventSystem = EventSystem.getInstance();
        let eventReceived = false;

        const handler = () => {
            eventReceived = true;
        };

        // Subscribe to test event
        eventSystem.on('testEvent', handler);

        // Emit test event
        eventSystem.emit('testEvent', { type: 'testEvent' });

        // Check if handler was called
        expect(eventReceived).toBe(true);

        // Cleanup
        eventSystem.off('testEvent', handler);
    });

    it('should handle multiple subscribers', () => {
        const eventSystem = EventSystem.getInstance();
        let handler1Called = false;
        let handler2Called = false;

        const handler1 = () => {
            handler1Called = true;
        };

        const handler2 = () => {
            handler2Called = true;
        };

        eventSystem.on('multiEvent', handler1);
        eventSystem.on('multiEvent', handler2);

        eventSystem.emit('multiEvent', { type: 'multiEvent' });

        expect(handler1Called).toBe(true);
        expect(handler2Called).toBe(true);

        // Cleanup
        eventSystem.off('multiEvent', handler1);
        eventSystem.off('multiEvent', handler2);
    });

    it('should handle unsubscribing from events', () => {
        const eventSystem = EventSystem.getInstance();
        let callCount = 0;

        const handler = () => {
            callCount++;
        };

        // Subscribe and immediately unsubscribe
        eventSystem.on('unsubscribeTest', handler);
        eventSystem.off('unsubscribeTest', handler);

        // Emit event
        eventSystem.emit('unsubscribeTest', {});

        expect(callCount).toBe(0);
    });

    it('should integrate with World entity lifecycle', () => {
        const world = new World();
        const eventSystem = EventSystem.getInstance();
        let entityCreatedReceived = false;

        eventSystem.on('entityCreated', () => {
            entityCreatedReceived = true;
        });

        // Create an entity
        world.createEntity();
        expect(entityCreatedReceived).toBe(true);
    });

    it('should handle system integration with events', () => {
        const world = new World();
        const eventSystem = EventSystem.getInstance();
        let systemProcessed = false;

        class TestEventSystem extends System {
            readonly requiredComponents = [];

            constructor() {
                super();
                eventSystem.on('testSystemEvent', () => {
                    systemProcessed = true;
                });
            }

            update(entities: Entity[], deltaTime: number): void {
                // System logic here
            }
        }

        world.addSystem(new TestEventSystem());
        eventSystem.emit('testSystemEvent', {});

        expect(systemProcessed).toBe(true);
    });
});
