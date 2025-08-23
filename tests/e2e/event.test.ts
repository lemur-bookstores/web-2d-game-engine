import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Entity } from '../../src/ecs/Entity';
import { System } from '../../src/ecs/System';
import { World } from '../../src/ecs/World';
import { EventSystem } from '../../src/core/EventSystem';

describe('Event System Tests', () => {
    let eventSystem: EventSystem;

    beforeEach(() => {
        // Reset EventSystem singleton for each test
        EventSystem.reset();
        eventSystem = EventSystem.getInstance();
    });

    afterEach(() => {
        // Clean up after each test
        if (eventSystem) {
            eventSystem.destroy();
        }
    });

    it('should handle event subscription and emission', () => {
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
    });

    it('should handle multiple subscribers', () => {
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
    });

    it('should handle unsubscribing from events', () => {
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

        // Create and add the system
        const testSystem = new TestEventSystem();
        world.addSystem(testSystem);

        // Emit the test event
        eventSystem.emit('testSystemEvent', {});

        expect(systemProcessed).toBe(true);
    });
});
