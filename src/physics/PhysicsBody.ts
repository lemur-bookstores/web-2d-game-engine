import { Body } from 'box2d-wasm';
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
            position: new Vector2(),
            angle: 0,
            ...config
        };
        this.transform = new Transform();
        this.initialize();
    }

    private initialize(): void {
        const box2d = this.world.getBox2D();
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

        this.body = this.world.getWorld().CreateBody(bodyDef);
        this.body.SetUserData(this);

        const fixtureDef = new box2d.b2FixtureDef();
        fixtureDef.density = this.config.density!;
        fixtureDef.friction = this.config.friction!;
        fixtureDef.restitution = this.config.restitution!;
        fixtureDef.isSensor = this.config.isSensor!;

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
        const position = this.body.GetPosition();
        return this.world.fromB2Vec2(position);
    }

    public setPosition(position: Vector2): void {
        this.body.SetTransform(this.world.toB2Vec2(position), this.body.GetAngle());
    }

    public getAngle(): number {
        return this.body.GetAngle();
    }

    public setAngle(angle: number): void {
        this.body.SetTransform(this.body.GetPosition(), angle);
    }

    public getVelocity(): Vector2 {
        const velocity = this.body.GetLinearVelocity();
        return this.world.fromB2Vec2(velocity);
    }

    public setVelocity(velocity: Vector2): void {
        this.body.SetLinearVelocity(this.world.toB2Vec2(velocity));
    }

    public getAngularVelocity(): number {
        return this.body.GetAngularVelocity();
    }

    public setAngularVelocity(velocity: number): void {
        this.body.SetAngularVelocity(velocity);
    }

    public applyForce(force: Vector2, point?: Vector2): void {
        const worldPoint = point ? this.world.toB2Vec2(point) : this.body.GetWorldCenter();
        this.body.ApplyForce(this.world.toB2Vec2(force), worldPoint, true);
    }

    public applyImpulse(impulse: Vector2, point?: Vector2): void {
        const worldPoint = point ? this.world.toB2Vec2(point) : this.body.GetWorldCenter();
        this.body.ApplyLinearImpulse(this.world.toB2Vec2(impulse), worldPoint, true);
    }

    public applyTorque(torque: number): void {
        this.body.ApplyTorque(torque, true);
    }

    public getTransform(): Transform {
        const position = this.getPosition();
        const angle = this.getAngle();
        this.transform.position.set(position.x, position.y);
        this.transform.rotation = angle;
        return this.transform;
    }

    public destroy(): void {
        this.world.getWorld().DestroyBody(this.body);
    }
}
