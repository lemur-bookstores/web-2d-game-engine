import { Box2DFactory, Box2D, World, Vec2 } from 'box2d-wasm';
import { Vector2 } from '../math/Vector2';
import { EventSystem } from '../core/EventSystem';
import { PhysicsBody } from './PhysicsBody';

export type PhysicsCollisionEvent = {
    bodyA: PhysicsBody;
    bodyB: PhysicsBody;
    point: Vector2;
    normal: Vector2;
    impulse: number;
};

export class PhysicsWorld {
    private static instance: PhysicsWorld;
    private box2D!: Box2D;
    private world!: World;
    private eventSystem: EventSystem;
    private gravity: Vector2;
    private timeStep: number = 1 / 60;
    private velocityIterations: number = 8;
    private positionIterations: number = 3;

    private constructor() {
        this.gravity = new Vector2(0, 9.81);
        this.eventSystem = EventSystem.getInstance();
    }

    public static async getInstance(): Promise<PhysicsWorld> {
        if (!PhysicsWorld.instance) {
            PhysicsWorld.instance = new PhysicsWorld();
            await PhysicsWorld.instance.initialize();
        }
        return PhysicsWorld.instance;
    }

    private async initialize(): Promise<void> {
        this.box2D = await Box2DFactory();
        this.world = new this.box2D.b2World(this.toB2Vec2(this.gravity));
        this.setupContactListener();
    }

    public setGravity(gravity: Vector2): void {
        this.gravity = gravity.clone();
        if (this.world) {
            this.world.SetGravity(this.toB2Vec2(gravity));
        }
    }

    public getGravity(): Vector2 {
        return this.gravity.clone();
    }

    public step(deltaTime?: number): void {
        if (this.world) {
            this.world.Step(
                deltaTime || this.timeStep,
                this.velocityIterations,
                this.positionIterations
            );
        }
    }

    public getBox2D(): Box2D {
        return this.box2D;
    }

    public getWorld(): World {
        return this.world;
    }

    private setupContactListener(): void {
        const contactListener = new this.box2D.JSContactListener();

        contactListener.BeginContact = (contact: any) => {
            const bodyA = contact.GetFixtureA().GetBody().GetUserData();
            const bodyB = contact.GetFixtureB().GetBody().GetUserData();
            const worldManifold = contact.GetWorldManifold();
            const point = this.fromB2Vec2(worldManifold.points[0]);
            const normal = this.fromB2Vec2(worldManifold.normal);

            this.eventSystem.emit('collisionBegin', {
                bodyA,
                bodyB,
                point,
                normal,
                impulse: contact.GetImpulse()
            });
        };

        contactListener.EndContact = (contact: any) => {
            const bodyA = contact.GetFixtureA().GetBody().GetUserData();
            const bodyB = contact.GetFixtureB().GetBody().GetUserData();

            this.eventSystem.emit('collisionEnd', {
                bodyA,
                bodyB
            });
        };

        contactListener.PreSolve = () => {
            // PreSolve logic if needed
        };

        contactListener.PostSolve = (contact: any, impulse: any) => {
            const bodyA = contact.GetFixtureA().GetBody().GetUserData();
            const bodyB = contact.GetFixtureB().GetBody().GetUserData();
            const worldManifold = contact.GetWorldManifold();
            const point = this.fromB2Vec2(worldManifold.points[0]);
            const normal = this.fromB2Vec2(worldManifold.normal);

            this.eventSystem.emit('collisionPostSolve', {
                bodyA,
                bodyB,
                point,
                normal,
                impulse: impulse.normalImpulses[0]
            });
        };

        this.world.SetContactListener(contactListener);
    }

    public toB2Vec2(vector: Vector2): Vec2 {
        return new this.box2D.b2Vec2(vector.x, vector.y);
    }

    public fromB2Vec2(vec: Vec2): Vector2 {
        return new Vector2(vec.x, vec.y);
    }

    public destroy(): void {
        if (this.world) {
            this.world.delete();
        }
    }
}
