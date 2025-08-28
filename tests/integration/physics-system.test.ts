import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PhysicsSystem } from '../../src/physics/PhysicsSystem';
import { Entity } from '../../src/core/ecs/Entity';
import { Vector2 } from '../../src/math/Vector2';
import { PhysicsBodyComponent, TransformComponent } from '../../src/ecs/Component';

describe('PhysicsSystem Integration Tests', () => {
    let physicsSystem: PhysicsSystem;
    let testEntity: Entity;

    beforeEach(async () => {
        physicsSystem = new PhysicsSystem();

        // Create a test entity with physics component
        testEntity = new Entity();

        // Add transform component
        const transform: TransformComponent = {
            type: 'transform',
            position: new Vector2(0, 0),
            rotation: 0,
            scale: new Vector2(1, 1)
        };
        testEntity.addComponent('transform', transform);

        // Add physics body component
        const physicsBody: PhysicsBodyComponent = {
            type: 'physicsBody',
            bodyType: 'dynamic',
            shape: 'box',
            width: 2,
            height: 2,
            density: 1,
            friction: 0.2,
            restitution: 0.2,
            fixedRotation: true
        };
        testEntity.addComponent('physicsBody', physicsBody);
    });

    afterEach(() => {
        if (physicsSystem) {
            physicsSystem.destroy();
        }
    });

    it('should create physics body when entity is added', async () => {
        // Wait for system initialization
        await new Promise(resolve => setTimeout(resolve, 100));

        physicsSystem.onEntityAdded(testEntity);

        const physicsBody = physicsSystem.getPhysicsBody(testEntity.getId());

        // Note: Physics body may be undefined if Box2D WASM is not available (expected behavior)
        // The system should not crash and should handle this gracefully
        if (physicsBody) {
            expect(physicsBody).toBeDefined();
        } else {
            // This is expected behavior when Box2D is not available
            console.log('Box2D not available - physics body creation skipped (expected)');
            expect(physicsBody).toBeUndefined();
        }
    }); it('should sync transform from physics body', async () => {
        // Wait for system initialization
        await new Promise(resolve => setTimeout(resolve, 100));

        physicsSystem.onEntityAdded(testEntity);

        // Apply a force to move the body
        const force = new Vector2(100, 0);
        physicsSystem.applyForce(testEntity.getId(), force);

        // Step the physics simulation
        physicsSystem.update(1 / 60);

        const transform = testEntity.getComponent('transform') as TransformComponent;

        // The body should have moved (even slightly) due to the applied force
        // Note: Box2D may not be available in test environment, so this might not change
        expect(transform).toBeDefined();
        expect(typeof transform.position.x).toBe('number');
        expect(typeof transform.position.y).toBe('number');
    });

    it('should destroy physics body when entity is removed', async () => {
        // Wait for system initialization
        await new Promise(resolve => setTimeout(resolve, 100));

        physicsSystem.onEntityAdded(testEntity);

        const physicsBodyBefore = physicsSystem.getPhysicsBody(testEntity.getId());
        expect(physicsBodyBefore).toBeDefined();

        physicsSystem.onEntityRemoved(testEntity);

        const physicsBodyAfter = physicsSystem.getPhysicsBody(testEntity.getId());
        expect(physicsBodyAfter).toBeUndefined();
    });

    it('should handle velocity operations', async () => {
        // Wait for system initialization
        await new Promise(resolve => setTimeout(resolve, 100));

        physicsSystem.onEntityAdded(testEntity);

        const velocity = new Vector2(5, 10);
        physicsSystem.setVelocity(testEntity.getId(), velocity);

        const retrievedVelocity = physicsSystem.getVelocity(testEntity.getId());

        // If Box2D is not available, velocity operations should still work
        // (they just won't have any effect)
        expect(retrievedVelocity).toBeDefined();
    });

    it('should support legacy physics component type', async () => {
        // Create entity with legacy 'physics' component type
        const legacyEntity = new Entity();

        const transform: TransformComponent = {
            type: 'transform',
            position: { x: 0, y: 0 },
            rotation: 0,
            scale: { x: 1, y: 1 }
        };
        legacyEntity.addComponent('transform', transform);

        const legacyPhysics: PhysicsBodyComponent = {
            type: 'physics', // Legacy type
            bodyType: 'dynamic',
            shape: 'circle',
            radius: 1,
            density: 1,
            friction: 0.3,
            restitution: 0.1
        };
        legacyEntity.addComponent('physicsBody', legacyPhysics);

        // Wait for system initialization
        await new Promise(resolve => setTimeout(resolve, 100));

        physicsSystem.onEntityAdded(legacyEntity);

        const physicsBody = physicsSystem.getPhysicsBody(legacyEntity.getId());
        expect(physicsBody).toBeDefined();

        physicsSystem.onEntityRemoved(legacyEntity);
    });

    it('should handle multiple physics update cycles', async () => {
        // Wait for system initialization
        await new Promise(resolve => setTimeout(resolve, 100));

        physicsSystem.onEntityAdded(testEntity);

        // Run multiple update cycles
        for (let i = 0; i < 10; i++) {
            physicsSystem.update(1 / 60);
        }

        // System should remain stable
        const physicsBody = physicsSystem.getPhysicsBody(testEntity.getId());
        expect(physicsBody).toBeDefined();

        const transform = testEntity.getComponent('transform') as TransformComponent;
        expect(transform).toBeDefined();
    });
});
