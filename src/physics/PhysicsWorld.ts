import { Box2DFactory, Box2D, World, Vec2 } from 'box2d-wasm';
import { Vector2 } from '../math/Vector2';
import { EventSystem } from '../core/EventSystem';
import { PhysicsBody } from './PhysicsBody';
import { PHYSICS_EVENTS } from '@/types/event-const';


export type PhysicsCollisionEvent = {
    bodyA: PhysicsBody;
    bodyB: PhysicsBody;
    point: Vector2;
    normal: Vector2;
    impulse: number;
};

export class PhysicsWorld {
    private static instance: PhysicsWorld;
    private box2D: Box2D | undefined;
    private world: World | undefined;
    private eventSystem: EventSystem;
    private gravity: Vector2;
    private timeStep: number = 1 / 60;
    private velocityIterations: number = 8;
    private positionIterations: number = 3;
    private substeps: number = 1;

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
        try {
            const factory: any = Box2DFactory as any;
            this.box2D = await factory();
            // If factory resolved to a module-like object.
            if (!this.box2D || !(this.box2D as any).b2World) {
                console.warn('PhysicsWorld: Box2D module shape unexpected, running in fallback mode');
                this.box2D = undefined;
                return;
            }
            this.world = new this.box2D.b2World(this.toB2Vec2(this.gravity));
            this.setupContactListener();
        } catch (err) {
            console.warn('PhysicsWorld: Failed to initialize Box2D (WASM missing?) -> fallback mode.', err);
            this.box2D = undefined;
            this.world = undefined;
        }
    }

    public setGravity(gravity: Vector2): void {
        this.gravity = gravity.clone();
        if (this.world && this.box2D) {
            this.world.SetGravity(this.toB2Vec2(gravity));
        }
    }

    public getGravity(): Vector2 {
        return this.gravity.clone();
    }

    public setSubsteps(substeps: number): void {
        this.substeps = Math.max(1, Math.floor(substeps));
    }

    public step(deltaTime?: number): void {
        if (!this.world || !this.box2D) return;
        const dt = deltaTime || this.timeStep;
        const h = dt / this.substeps;
        for (let i = 0; i < this.substeps; i++) {
            this.world.Step(h, this.velocityIterations, this.positionIterations);
        }
    }

    public getBox2D(): Box2D | undefined {
        return this.box2D;
    }

    public getWorld(): World | undefined {
        return this.world;
    }

    private setupContactListener(): void {
        if (!this.box2D) return;
        const contactListener = new this.box2D.JSContactListener();

        contactListener.BeginContact = (contact: any) => {
            const bodyA = contact.GetFixtureA().GetBody().GetUserData();
            const bodyB = contact.GetFixtureB().GetBody().GetUserData();
            const worldManifold = contact.GetWorldManifold();
            const point = this.fromB2Vec2(worldManifold.points[0]);
            const normal = this.fromB2Vec2(worldManifold.normal);

            this.eventSystem.emit(PHYSICS_EVENTS.COLLISION_BEGIN, {
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

            this.eventSystem.emit(PHYSICS_EVENTS.COLLISION_END, {
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

            this.eventSystem.emit(PHYSICS_EVENTS.COLLISION_POST_SOLVE, {
                bodyA,
                bodyB,
                point,
                normal,
                impulse: impulse.normalImpulses[0]
            });
        };

        if (this.world) {
            this.world.SetContactListener(contactListener);
        }
    }

    public toB2Vec2(vector: Vector2): Vec2 {
        if (!this.box2D) return { x: vector.x, y: vector.y } as any; // fallback simple object
        return new this.box2D.b2Vec2(vector.x, vector.y);
    }

    public fromB2Vec2(vec: Vec2): Vector2 {
        return new Vector2(vec.x, vec.y);
    }

    public createJoint(jointDef: any): any {
        if (!this.world) {
            console.warn('PhysicsWorld: Cannot create joint, world not initialized');
            return undefined;
        }

        // Defensive check for CreateJoint method
        if (!(this.world as any).CreateJoint) {
            console.warn('PhysicsWorld: CreateJoint method not available');
            return undefined;
        }

        return (this.world as any).CreateJoint(jointDef);
    }

    public destroyJoint(joint: any): void {
        if (!this.world || !joint) {
            console.warn('PhysicsWorld: Cannot destroy joint, world or joint not available');
            return;
        }

        // Defensive check for DestroyJoint method
        if (!(this.world as any).DestroyJoint) {
            console.warn('PhysicsWorld: DestroyJoint method not available');
            return;
        }

        (this.world as any).DestroyJoint(joint);
    }

    public queryAABB(aabb: { lowerBound: Vector2; upperBound: Vector2 }): PhysicsBody[] {
        const bodies: PhysicsBody[] = [];

        if (!this.world) {
            return bodies;
        }

        // Defensive check for Box2D AABB and QueryAABB
        if (!this.box2D || !(this.box2D as any).b2AABB || !(this.world as any).QueryAABB) {
            console.warn('PhysicsWorld: AABB query not available in this Box2D version');
            return bodies;
        }

        const b2AABB = new (this.box2D as any).b2AABB();
        b2AABB.lowerBound = this.toB2Vec2(aabb.lowerBound);
        b2AABB.upperBound = this.toB2Vec2(aabb.upperBound);

        const callback = (fixture: any): boolean => {
            const body = fixture.GetBody();
            const userData = body.GetUserData();
            if (userData instanceof PhysicsBody) {
                bodies.push(userData);
            }
            return true; // Continue querying
        };

        (this.world as any).QueryAABB(callback, b2AABB);
        return bodies;
    }

    public destroy(): void {
        if (this.world) {
            (this.world as any).delete?.();
        }
    }
}
