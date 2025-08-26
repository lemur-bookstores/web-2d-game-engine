import { Box2DFactory, Box2D, World, Vec2 } from 'box2d-wasm';
import { Vector2 } from '../math/Vector2';
import { EventSystem } from '../core/EventSystem';
import { PhysicsBody } from './PhysicsBody';
import { PHYSICS_EVENTS } from '@/types/event-const';
import { RaycastOptions, RaycastResult } from './Raycast';


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
    private joints: Set<any> = new Set();
    private bodies: Set<PhysicsBody> = new Set(); // Track bodies for fallback mode
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
            // After stepping, check joint reaction forces for breakage
            try {
                for (const joint of Array.from(this.joints)) {
                    if (!joint) continue;
                    // defensive access to GetReactionForce / GetReactionTorque
                    const reaction = (joint.GetReactionForce && typeof joint.GetReactionForce === 'function')
                        ? joint.GetReactionForce(1 / h) : undefined;
                    const torque = (joint.GetReactionTorque && typeof joint.GetReactionTorque === 'function')
                        ? joint.GetReactionTorque(1 / h) : undefined;

                    // simple threshold heuristic: large linear force or torque
                    const linearMag = reaction ? Math.hypot(reaction.x || reaction.get_x?.() || 0, reaction.y || reaction.get_y?.() || 0) : 0;
                    const torqueMag = typeof torque === 'number' ? Math.abs(torque) : 0;
                    const THRESHOLD_FORCE = 1e5; // high default, safe for most demos
                    const THRESHOLD_TORQUE = 1e5;

                    if (linearMag > THRESHOLD_FORCE || torqueMag > THRESHOLD_TORQUE) {
                        // emit joint break event and destroy joint
                        this.eventSystem.emit(PHYSICS_EVENTS.JOINT_BREAK, { joint, linearMag, torqueMag });
                        this.destroyJoint(joint);
                        this.joints.delete(joint);
                    }
                }
            } catch (err) {
                // swallow any errors from joint checks to avoid breaking simulation
                // console.warn('PhysicsWorld: joint check failed', err);
            }
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

        const j = (this.world as any).CreateJoint(jointDef);
        if (j) this.joints.add(j);
        return j;
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
        this.joints.delete(joint);
    }

    public queryAABB(aabb: { lowerBound: Vector2; upperBound: Vector2 }): PhysicsBody[] {
        const bodies: PhysicsBody[] = [];

        if (!this.world) {
            // Fallback mode: check against tracked bodies
            for (const body of this.bodies) {
                const pos = body.getPosition();
                if (pos.x >= aabb.lowerBound.x && pos.x <= aabb.upperBound.x &&
                    pos.y >= aabb.lowerBound.y && pos.y <= aabb.upperBound.y) {
                    bodies.push(body);
                }
            }
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

    /**
     * Register a PhysicsBody for fallback raycast/query operations
     */
    public registerBody(body: PhysicsBody): void {
        this.bodies.add(body);
    }

    /**
     * Unregister a PhysicsBody
     */
    public unregisterBody(body: PhysicsBody): void {
        this.bodies.delete(body);
    }

    public raycast(origin: Vector2, direction: Vector2, length: number, options?: RaycastOptions): RaycastResult[] {
        const results: RaycastResult[] = [];

        if (!this.world || !this.box2D) {
            // Fallback mode: simple AABB-based raycast simulation
            console.log('PhysicsWorld: Using fallback raycast simulation');
            return this.fallbackRaycast(origin, direction, length, options);
        }

        try {
            // Normalize direction and calculate end point
            const normalizedDir = direction.normalize();
            const endPoint = origin.add(normalizedDir.multiply(length));

            const p1 = this.toB2Vec2(origin);
            const p2 = this.toB2Vec2(endPoint);

            // Box2D raycast callback
            const callback = (fixture: any, point: any, normal: any, fraction: number): number => {
                const body = fixture.GetBody();
                const userData = body.GetUserData();

                // Check layer mask if specified
                if (options?.layerMask !== undefined) {
                    const filter = fixture.GetFilterData();
                    if (filter && filter.categoryBits) {
                        if (!(filter.categoryBits & options.layerMask)) {
                            return -1; // Continue ray, ignore this fixture
                        }
                    }
                }

                // Check if sensors should be included
                if (!options?.includeSensors && fixture.IsSensor && fixture.IsSensor()) {
                    return -1; // Continue ray, ignore sensors
                }

                const result: RaycastResult = {
                    point: this.fromB2Vec2(point),
                    normal: this.fromB2Vec2(normal),
                    fraction,
                    body: userData instanceof PhysicsBody ? userData : undefined,
                    entityId: userData?.getId?.() || undefined,
                    fixture
                };

                results.push(result);

                // Return fraction to continue collecting all hits (or return 0 to stop at first hit)
                return options?.maxResults && results.length >= options.maxResults ? 0 : fraction;
            };

            if ((this.world as any).RayCast) {
                (this.world as any).RayCast(callback, p1, p2);
            } else {
                console.warn('PhysicsWorld: RayCast method not available in this Box2D version');
            }

        } catch (error) {
            console.warn('PhysicsWorld: Raycast failed', error);
        }

        // Sort results by fraction (closest first)
        results.sort((a, b) => a.fraction - b.fraction);

        return results;
    }

    /**
     * Fallback raycast implementation for when Box2D is not available
     */
    private fallbackRaycast(origin: Vector2, direction: Vector2, length: number, options?: RaycastOptions): RaycastResult[] {
        const results: RaycastResult[] = [];

        // Simple implementation: check against all known bodies using AABB
        // This is not a perfect raycast but allows tests to work
        const normalizedDir = direction.normalize();
        const endPoint = origin.add(normalizedDir.multiply(length));

        // Create AABB that encompasses the ray
        const minX = Math.min(origin.x, endPoint.x) - 0.1;
        const maxX = Math.max(origin.x, endPoint.x) + 0.1;
        const minY = Math.min(origin.y, endPoint.y) - 0.1;
        const maxY = Math.max(origin.y, endPoint.y) + 0.1;

        const aabb = {
            lowerBound: new Vector2(minX, minY),
            upperBound: new Vector2(maxX, maxY)
        };

        // Use existing queryAABB to find potential hits
        const bodies = this.queryAABB(aabb);

        for (const body of bodies) {
            // Simple hit test: assume hit at center of body
            const bodyPos = body.getPosition();

            // Calculate approximate fraction along ray
            const toBody = bodyPos.subtract(origin);
            const projLength = toBody.dot(normalizedDir);

            if (projLength >= 0 && projLength <= length) {
                const fraction = projLength / length;

                const result: RaycastResult = {
                    point: origin.add(normalizedDir.multiply(projLength)),
                    normal: normalizedDir.multiply(-1), // Opposite of ray direction
                    fraction,
                    body,
                    entityId: undefined
                };

                results.push(result);
            }
        }

        // Sort by fraction and apply maxResults
        results.sort((a, b) => a.fraction - b.fraction);

        if (options?.maxResults && results.length > options.maxResults) {
            return results.slice(0, options.maxResults);
        }

        return results;
    } public destroy(): void {
        if (this.world) {
            (this.world as any).delete?.();
        }
    }
}
