import { System } from '../core/ecs/System';
import { Entity } from '../core/ecs/Entity';
import { PhysicsWorld } from './PhysicsWorld';
import { PhysicsBody, PhysicsBodyConfig, PhysicsBodyType, PhysicsShape } from './PhysicsBody';
import { Transform } from '../math/Transform';
import { Vector2 } from '../math/Vector2';
import { PhysicsBodyComponent, TransformComponent } from '../ecs/Component';

/**
 * PhysicsSystem manages the lifecycle of physics bodies and synchronizes 
 * transforms between Box2D and the ECS according to v0.4.0 specification
 */
export class PhysicsSystem extends System {
    private world!: PhysicsWorld;
    private physicsBodyMap = new Map<string, PhysicsBody>();
    private initialized = false;

    constructor() {
        super(['physicsBody', 'transform']);
        this.initialize();
    }

    private async initialize(): Promise<void> {
        if (this.initialized) return;

        this.world = await PhysicsWorld.getInstance();
        this.initialized = true;
    }

    public onEntityAdded(entity: Entity): void {
        super.onEntityAdded(entity);

        const physicsComponent = entity.getComponent('physicsBody') as PhysicsBodyComponent ||
            entity.getComponent('physics') as PhysicsBodyComponent;

        if (physicsComponent && this.world && this.initialized) {
            this.createPhysicsBody(entity, physicsComponent);
        }
    }

    public onEntityRemoved(entity: Entity): void {
        const physicsBody = this.physicsBodyMap.get(entity.getId());
        if (physicsBody) {
            physicsBody.destroy();
            this.physicsBodyMap.delete(entity.getId());
        }
        super.onEntityRemoved(entity);
    }

    public update(deltaTime: number): void {
        if (!this.world || !this.initialized) return;

        // Step the physics world with fixed timestep (according to spec)
        this.world.step(deltaTime);

        // Sync transforms from physics bodies to ECS transforms
        this.syncTransforms();
    }

    private createPhysicsBody(entity: Entity, component: PhysicsBodyComponent): void {
        const transform = entity.getComponent('transform') as TransformComponent;

        const config: PhysicsBodyConfig = {
            type: this.mapBodyType(component.bodyType),
            shape: this.mapShape(component.shape),
            width: component.width || 1,
            height: component.height || 1,
            radius: component.radius || 0.5,
            density: component.density || 1,
            friction: component.friction || 0.2,
            restitution: component.restitution || 0.2,
            isSensor: component.isSensor || false,
            position: transform ? new Vector2(transform.position.x, transform.position.y) : new Vector2(),
            angle: transform ? transform.rotation : 0
        };

        const physicsBody = new PhysicsBody(this.world, config);
        this.physicsBodyMap.set(entity.getId(), physicsBody);

        // Store reference to entity in the physics body for collision callbacks
        (physicsBody as any).entityId = entity.getId();
    }

    private syncTransforms(): void {
        // Update entity transforms based on physics bodies (as per spec)
        for (const [entityId, physicsBody] of this.physicsBodyMap) {
            const entity = this.getEntityById(entityId);
            if (!entity) continue;

            const transform = entity.getComponent('transform') as Transform;
            if (!transform) continue;

            const physicsTransform = physicsBody.getTransform();

            // Sync position and rotation from physics to ECS transform
            transform.position.copy(physicsTransform.position);
            transform.rotation = physicsTransform.rotation;
        }
    }

    private mapBodyType(bodyType: string): PhysicsBodyType {
        switch (bodyType) {
            case 'static': return PhysicsBodyType.Static;
            case 'kinematic': return PhysicsBodyType.Kinematic;
            case 'dynamic':
            default: return PhysicsBodyType.Dynamic;
        }
    }

    private mapShape(shape: string): PhysicsShape {
        switch (shape) {
            case 'circle': return PhysicsShape.Circle;
            case 'box':
            default: return PhysicsShape.Box;
        }
    }

    private getEntityById(entityId: string): Entity | undefined {
        // Find entity in the system's entities set
        for (const entity of this.entities) {
            if (entity.getId() === entityId) {
                return entity;
            }
        }
        return undefined;
    }

    /**
     * API methods for applying forces and impulses (as per spec)
     */
    public applyForce(entityId: string, force: Vector2, point?: Vector2): void {
        const body = this.physicsBodyMap.get(entityId);
        if (body) {
            body.applyForce(force, point);
        }
    }

    public applyImpulse(entityId: string, impulse: Vector2, point?: Vector2): void {
        const body = this.physicsBodyMap.get(entityId);
        if (body) {
            body.applyImpulse(impulse, point);
        }
    }

    public setVelocity(entityId: string, velocity: Vector2): void {
        const body = this.physicsBodyMap.get(entityId);
        if (body) {
            body.setVelocity(velocity);
        }
    }

    public getVelocity(entityId: string): Vector2 | null {
        const body = this.physicsBodyMap.get(entityId);
        return body ? body.getVelocity() : null;
    }

    public getPhysicsBody(entityId: string): PhysicsBody | undefined {
        return this.physicsBodyMap.get(entityId);
    }

    public destroy(): void {
        // Clean up all physics bodies
        for (const physicsBody of this.physicsBodyMap.values()) {
            physicsBody.destroy();
        }
        this.physicsBodyMap.clear();

        // Destroy the physics world
        if (this.world) {
            this.world.destroy();
        }

        this.initialized = false;
    }
}
