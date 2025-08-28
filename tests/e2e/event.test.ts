import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Entity } from '../../src/ecs/Entity';
import { System } from '../../src/ecs/System';
import { World } from '../../src/ecs/World';
import { EventSystem } from '../../src/core/EventSystem';
import { TEST_EVENTS } from '../../src/types/event-const';

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
        eventSystem.on(TEST_EVENTS.TESTONE, handler);

        // Emit test event
        eventSystem.emit(TEST_EVENTS.TESTONE, { type: TEST_EVENTS.TESTONE });

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

        eventSystem.on(TEST_EVENTS.TESTTWO, handler1);
        eventSystem.on(TEST_EVENTS.TESTTWO, handler2);

        eventSystem.emit(TEST_EVENTS.TESTTWO, { type: 'multiEvent' });

        expect(handler1Called).toBe(true);
        expect(handler2Called).toBe(true);
    });

    it('should handle unsubscribing from events', () => {
        let callCount = 0;

        const handler = () => {
            callCount++;
        };

        // Subscribe and immediately unsubscribe
        eventSystem.on(TEST_EVENTS.TESTTHREE, handler);
        eventSystem.off(TEST_EVENTS.TESTTHREE, handler);

        // Emit event
        eventSystem.emit(TEST_EVENTS.TESTTHREE, {});

        expect(callCount).toBe(0);
    });

    it('should integrate with World entity lifecycle', () => {
        const world = new World();
        let entityCreatedReceived = false;

        eventSystem.on(TEST_EVENTS.TESTFOUR, () => {
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
                eventSystem.on(TEST_EVENTS.TESTSIX, () => {
                    systemProcessed = true;
                });
            }

            update(_entities: Entity[], _deltaTime: number): void {
                // System logic here
            }
        }

        // Create and add the system
        const testSystem = new TestEventSystem();
        world.addSystem(testSystem);

        // Emit the test event
        eventSystem.emit(TEST_EVENTS.TESTSIX, {});

        expect(systemProcessed).toBe(true);
    });
});
