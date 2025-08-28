import { describe, it, expect } from 'vitest';
import { Entity } from '../../src/ecs/Entity';
import { System } from '../../src/ecs/System';
import { World } from '../../src/ecs/World';
import { TransformComponent } from '../../src/ecs/Component';

interface VelocityComponent {
    type: 'velocity';
    x: number;
    y: number;
}

class PhysicsSystem extends System {
    readonly requiredComponents = ['transform', 'velocity'];

    update(entities: Entity[], deltaTime: number): void {
        const physicsEntities = this.getEntitiesWithComponents(entities, this.requiredComponents);

        for (const entity of physicsEntities) {
            const transform = entity.getComponent('transform') as TransformComponent;
            const velocity = entity.getComponent('velocity') as VelocityComponent;

            // Simple velocity application
            transform.position.x += velocity.x * (deltaTime / 1000);
            transform.position.y += velocity.y * (deltaTime / 1000);
        }
    }
}

describe('Physics System Tests', () => {
    it('should correctly update entity position based on velocity', () => {
        const world = new World();
        const entity = world.createEntity();

        // Add required components
        const transform: TransformComponent = {
            type: 'transform',
            position: { x: 0, y: 0 },
            rotation: 0,
            scale: { x: 1, y: 1 }
        };

        const velocity: VelocityComponent = {
            type: 'velocity',
            x: 100, // 100 pixels per second
            y: 50   // 50 pixels per second
        };

        entity.addComponent(transform);
        entity.addComponent(velocity);
        world.addSystem(new PhysicsSystem());

        // Simulate 1 second of movement
        const deltaTime = 1000; // 1 second in milliseconds
        world.update(deltaTime);

        const updatedTransform = entity.getComponent('transform') as TransformComponent;
        expect(updatedTransform.position.x).toBe(100); // Moved 100 pixels in x
        expect(updatedTransform.position.y).toBe(50);  // Moved 50 pixels in y
    });

    it('should handle multiple physics entities', () => {
        const world = new World();
        const entities = [world.createEntity(), world.createEntity()];

        // Setup first entity
        entities[0].addComponent({
            type: 'transform',
            position: { x: 0, y: 0 },
            rotation: 0,
            scale: { x: 1, y: 1 }
        });
        entities[0].addComponent({
            type: 'velocity',
            x: 100,
            y: 0
        });

        // Setup second entity
        entities[1].addComponent({
            type: 'transform',
            position: { x: 0, y: 0 },
            rotation: 0,
            scale: { x: 1, y: 1 }
        });
        entities[1].addComponent({
            type: 'velocity',
            x: 0,
            y: 100
        });

        world.addSystem(new PhysicsSystem());

        // Simulate 0.5 seconds
        const deltaTime = 500;
        world.update(deltaTime);

        const transform1 = entities[0].getComponent('transform') as TransformComponent;
        const transform2 = entities[1].getComponent('transform') as TransformComponent;

        expect(transform1.position.x).toBe(50);  // Half a second at 100 px/s
        expect(transform1.position.y).toBe(0);
        expect(transform2.position.x).toBe(0);
        expect(transform2.position.y).toBe(50);  // Half a second at 100 px/s
    });
});
