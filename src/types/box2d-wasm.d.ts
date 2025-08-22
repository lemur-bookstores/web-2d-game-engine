declare module 'box2d-wasm' {
    export interface Box2D {
        b2Vec2: typeof Vec2;
        b2World: typeof World;
        b2BodyDef: typeof BodyDef;
        b2Body: typeof Body;
        b2FixtureDef: typeof FixtureDef;
        b2PolygonShape: typeof PolygonShape;
        b2CircleShape: typeof CircleShape;
        JSContactListener: any;
        b2_staticBody: number;
        b2_dynamicBody: number;
        b2_kinematicBody: number;
    }

    export class Vec2 {
        constructor(x: number, y: number);
        x: number;
        y: number;
    }

    export class World {
        constructor(gravity: Vec2);
        Step(timeStep: number, velocityIterations: number, positionIterations: number): void;
        CreateBody(def: BodyDef): Body;
        DestroyBody(body: Body): void;
        SetGravity(gravity: Vec2): void;
        SetContactListener(listener: any): void;
        delete(): void;
    }

    export class BodyDef {
        constructor();
        type: number;
        position: Vec2;
        angle: number;
    }

    export class Body {
        CreateFixture(def: FixtureDef): Fixture;
        GetPosition(): Vec2;
        GetAngle(): number;
        SetTransform(position: Vec2, angle: number): void;
        GetLinearVelocity(): Vec2;
        SetLinearVelocity(velocity: Vec2): void;
        GetAngularVelocity(): number;
        SetAngularVelocity(velocity: number): void;
        ApplyForce(force: Vec2, point: Vec2, wake: boolean): void;
        ApplyLinearImpulse(impulse: Vec2, point: Vec2, wake: boolean): void;
        ApplyTorque(torque: number, wake: boolean): void;
        GetWorldCenter(): Vec2;
        SetUserData(data: any): void;
        GetUserData(): any;
    }

    export class FixtureDef {
        constructor();
        shape: Shape;
        density: number;
        friction: number;
        restitution: number;
        isSensor: boolean;
    }

    export class Shape { }

    export class PolygonShape extends Shape {
        constructor();
        SetAsBox(hx: number, hy: number): void;
    }

    export class CircleShape extends Shape {
        constructor();
        m_radius: number;
    }

    export class Fixture {
        GetBody(): Body;
    }

    export interface ContactPoint {
        points: Vec2[];
        normal: Vec2;
    }

    export function Box2DFactory(): Promise<Box2D>;
}
