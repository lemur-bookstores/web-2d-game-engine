import { System } from '../core/ecs/System';
import { Entity } from '../core/ecs/Entity';
import { PhysicsWorld } from './PhysicsWorld';
import { PhysicsBody } from './PhysicsBody';
import { Transform } from '../math/Transform';

export class PhysicsSystem extends System {
    private world: PhysicsWorld;

    constructor() {
        super(['physicsBody', 'transform']);
        this.initialize();
        this.world = {} as PhysicsWorld; // Temporal inicialización
    }

    private async initialize(): Promise<void> {
        this.world = await PhysicsWorld.getInstance();
    }

    public update(deltaTime: number): void {
        // Update physics world
        this.world.step(deltaTime);

        // Update entity transforms based on physics bodies
        this.entities.forEach((entity: Entity) => {
            const physicsBody = entity.getComponent('physicsBody') as PhysicsBody;
            const transform = entity.getComponent('transform') as Transform;

            if (physicsBody && transform) {
                const physicsTransform = physicsBody.getTransform();
                transform.position.copy(physicsTransform.position);
                transform.rotation = physicsTransform.rotation;
            }
        });
    }

    public onEntityAdded(entity: Entity): void {
        super.onEntityAdded(entity);
        // Additional setup for newly added entities if needed
    }

    public onEntityRemoved(entity: Entity): void {
        const physicsBody = entity.getComponent<PhysicsBody>('physicsBody');
        if (physicsBody) {
            physicsBody.destroy();
        }
        super.onEntityRemoved(entity);
    }

    public destroy(): void {
        // Clean up all physics bodies
        this.entities.forEach((entity: Entity) => {
            const physicsBody = entity.getComponent('physicsBody') as PhysicsBody;
            if (physicsBody) {
                physicsBody.destroy();
            }
        });

        // Destroy the physics world
        this.world.destroy();
    }
}
