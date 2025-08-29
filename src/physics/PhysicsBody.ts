import type { Body } from 'box2d-wasm';
import { Vector2 } from '../math/Vector2';
import { Transform } from '../math/Transform';
import { PhysicsWorld } from './PhysicsWorld';

export enum PhysicsBodyType {
    Static = 'static',
    Dynamic = 'dynamic',
    Kinematic = 'kinematic'
}

export enum PhysicsShape {
    Box = 'box',
    Circle = 'circle'
}

export interface PhysicsBodyConfig {
    type?: PhysicsBodyType;
    shape?: PhysicsShape;
    width?: number;
    height?: number;
    radius?: number;
    density?: number;
    friction?: number;
    restitution?: number;
    isSensor?: boolean;
    position?: Vector2;
    angle?: number;
    // collision filtering
    collisionCategory?: number; // categoryBits
    collisionMask?: number; // maskBits
}

// UserData wrapper para Box2D-wasm
const bodyUserData = new WeakMap<Body, any>();

// Extensiones seguras
export function setBodyUserData(body: Body, data: any) {
    bodyUserData.set(body, data);
}

export function getBodyUserData(body: Body): any {
    return bodyUserData.get(body);
}

export class PhysicsBody {
    private world: PhysicsWorld;
    private body!: Body;
    private config: PhysicsBodyConfig;
    private transform: Transform;

    constructor(world: PhysicsWorld, config: PhysicsBodyConfig = {}) {
        this.world = world;
        this.config = {
            type: PhysicsBodyType.Dynamic,
            shape: PhysicsShape.Box,
            width: 1,
            height: 1,
            radius: 0.5,
            density: 1,
            friction: 0.2,
            restitution: 0.2,
            isSensor: false,
            collisionCategory: 0x0001,
            collisionMask: 0xFFFF,
            position: new Vector2(),
            angle: 0,
            ...config
        };
        this.transform = new Transform();
        this.initialize();

        // Always register with world for fallback operations
        this.world.registerBody(this);
    }

    /**
     * Returns metadata description for PhysicsBody config fields (for inspector/editor).
     */
    static getMetadata(): Array<{ name: string; type: string; default?: any; description?: string }> {
        return [
            { name: 'type', type: 'PhysicsBodyType', default: PhysicsBodyType.Dynamic, description: 'Body type (static/dynamic/kinematic)' },
            { name: 'shape', type: 'PhysicsShape', default: PhysicsShape.Box, description: 'Collision shape' },
            { name: 'width', type: 'number', default: 1 },
            { name: 'height', type: 'number', default: 1 },
            { name: 'radius', type: 'number', default: 0.5 },
            { name: 'density', type: 'number', default: 1 },
            { name: 'friction', type: 'number', default: 0.2 },
            { name: 'restitution', type: 'number', default: 0.2 },
            { name: 'isSensor', type: 'boolean', default: false },
            { name: 'position', type: 'Vector2', default: { x: 0, y: 0 } },
            { name: 'angle', type: 'number', default: 0 },
            { name: 'collisionCategory', type: 'number', default: 0x0001 },
            { name: 'collisionMask', type: 'number', default: 0xFFFF }
        ];
    }

    /**
     * Returns a normalized summary of the body's config using PhysicsWorld mappers.
     */
    public getConfigSummary(): any {
        try {
            return this.world.normalizePhysicsData('physicsBody', this.config);
        } catch (_) {
            return { shape: this.config.shape, width: this.config.width, height: this.config.height, radius: this.config.radius };
        }
    }

    private initialize(): void {
        const box2d = this.world.getBox2D();
        const w = this.world.getWorld();

        // Defensive: if Box2D or world not available, skip initialization (fallback mode)
        if (!box2d || !w) {
            console.log('PhysicsBody: Box2D/world not available, skipping body creation');
            return;
        }

        const bodyDef = new box2d.b2BodyDef();

        switch (this.config.type) {
            case PhysicsBodyType.Static:
                bodyDef.type = box2d.b2_staticBody;
                break;
            case PhysicsBodyType.Dynamic:
                bodyDef.type = box2d.b2_dynamicBody;
                break;
            case PhysicsBodyType.Kinematic:
                bodyDef.type = box2d.b2_kinematicBody;
                break;
        }

        bodyDef.position = this.world.toB2Vec2(this.config.position!);
        bodyDef.angle = this.config.angle!;

        this.body = w.CreateBody(bodyDef);
        setBodyUserData(this.body, this);

        const fixtureDef = new box2d.b2FixtureDef();
        fixtureDef.density = this.config.density!;
        fixtureDef.friction = this.config.friction!;
        fixtureDef.restitution = this.config.restitution!;
        fixtureDef.isSensor = this.config.isSensor!;
        // Collision filtering
        // Assign filter defensively using any to handle differing Box2D bindings
        try {
            const b2FilterCtor = (box2d as any).b2Filter;
            if (typeof b2FilterCtor === 'function') {
                const filter = new b2FilterCtor();
                filter.categoryBits = this.config.collisionCategory!;
                filter.maskBits = this.config.collisionMask!;
                (fixtureDef as any).filter = filter;
            } else {
                (fixtureDef as any).filter = {
                    categoryBits: this.config.collisionCategory!,
                    maskBits: this.config.collisionMask!
                };
            }
        } catch (e) {
            (fixtureDef as any).filter = {
                categoryBits: this.config.collisionCategory!,
                maskBits: this.config.collisionMask!
            };
        }

        if (this.config.shape === PhysicsShape.Box) {
            const shape = new box2d.b2PolygonShape();
            shape.SetAsBox(this.config.width! / 2, this.config.height! / 2);
            fixtureDef.shape = shape;
        } else if (this.config.shape === PhysicsShape.Circle) {
            const shape = new box2d.b2CircleShape();
            shape.m_radius = this.config.radius!;
            fixtureDef.shape = shape;
        }

        this.body.CreateFixture(fixtureDef);
    }

    public getPosition(): Vector2 {
        if (!this.body) {
            return this.config.position || new Vector2();
        }
        const position = this.body.GetPosition();
        return this.world.fromB2Vec2(position);
    }

    public setPosition(position: Vector2): void {
        if (!this.body) {
            this.config.position = position;
            return;
        }
        this.body.SetTransform(this.world.toB2Vec2(position), this.body.GetAngle());
    }

    public getAngle(): number {
        if (!this.body) {
            return this.config.angle || 0;
        }
        return this.body.GetAngle();
    }

    public setAngle(angle: number): void {
        if (!this.body) {
            this.config.angle = angle;
            return;
        }
        this.body.SetTransform(this.body.GetPosition(), angle);
    }

    public getVelocity(): Vector2 {
        if (!this.body) {
            return new Vector2();
        }
        const velocity = this.body.GetLinearVelocity();
        return this.world.fromB2Vec2(velocity);
    }

    public setVelocity(velocity: Vector2): void {
        if (!this.body) {
            return;
        }
        this.body.SetLinearVelocity(this.world.toB2Vec2(velocity));
    }

    public getAngularVelocity(): number {
        if (!this.body) {
            return 0;
        }
        return this.body.GetAngularVelocity();
    }

    public setAngularVelocity(velocity: number): void {
        if (!this.body) {
            return;
        }
        this.body.SetAngularVelocity(velocity);
    }

    public applyForce(force: Vector2, point?: Vector2): void {
        if (!this.body) {
            return;
        }
        const worldPoint = point ? this.world.toB2Vec2(point) : this.body.GetWorldCenter();
        this.body.ApplyForce(this.world.toB2Vec2(force), worldPoint, true);
    }

    public applyImpulse(impulse: Vector2, point?: Vector2): void {
        if (!this.body) {
            return;
        }
        const worldPoint = point ? this.world.toB2Vec2(point) : this.body.GetWorldCenter();
        this.body.ApplyLinearImpulse(this.world.toB2Vec2(impulse), worldPoint, true);
    }

    public applyTorque(torque: number): void {
        if (!this.body) {
            return;
        }
        this.body.ApplyTorque(torque, true);
    }

    public getTransform(): Transform {
        const position = this.getPosition();
        const angle = this.getAngle();
        this.transform.position.set(position.x, position.y);
        this.transform.rotation = angle;
        return this.transform;
    }

    public getB2Body(): Body | undefined {
        return this.body;
    }

    public destroy(): void {
        // Unregister from world
        this.world.unregisterBody(this);

        if (!this.body) {
            return;
        }
        const world = this.world.getWorld();
        if (world) {
            world.DestroyBody(this.body);
        }
    }
}
