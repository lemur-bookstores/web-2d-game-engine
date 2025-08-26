import { Vector2 } from '../math/Vector2';
import { PhysicsWorld } from './PhysicsWorld';
import { PhysicsBody } from './PhysicsBody';

export enum JointType {
    Revolute = 'revolute',
    Distance = 'distance',
    Rope = 'rope',
    Prismatic = 'prismatic',
    Weld = 'weld'
}

export interface BaseJointConfig {
    type: JointType;
    bodyA: PhysicsBody;
    bodyB: PhysicsBody;
    collideConnected?: boolean;
}

export interface RevoluteJointConfig extends BaseJointConfig {
    type: JointType.Revolute;
    anchorA: Vector2;
    anchorB: Vector2;
    enableLimit?: boolean;
    lowerAngle?: number;
    upperAngle?: number;
    enableMotor?: boolean;
    motorSpeed?: number;
    maxMotorTorque?: number;
}

export interface DistanceJointConfig extends BaseJointConfig {
    type: JointType.Distance;
    anchorA: Vector2;
    anchorB: Vector2;
    length?: number;
    frequency?: number;
    dampingRatio?: number;
}

export interface RopeJointConfig extends BaseJointConfig {
    type: JointType.Rope;
    localAnchorA: Vector2;
    localAnchorB: Vector2;
    maxLength: number;
}

export interface PrismaticJointConfig extends BaseJointConfig {
    type: JointType.Prismatic;
    anchor: Vector2;
    axis: Vector2;
    enableLimit?: boolean;
    lowerTranslation?: number;
    upperTranslation?: number;
    enableMotor?: boolean;
    motorSpeed?: number;
    maxMotorForce?: number;
}

export interface WeldJointConfig extends BaseJointConfig {
    type: JointType.Weld;
    anchor: Vector2;
    frequency?: number;
    dampingRatio?: number;
}

export type JointConfig = RevoluteJointConfig | DistanceJointConfig | RopeJointConfig | PrismaticJointConfig | WeldJointConfig;

export class PhysicsJoint {
    private world: PhysicsWorld;
    private joint?: any; // Box2D Joint
    private config: JointConfig;
    private id: string;

    constructor(world: PhysicsWorld, config: JointConfig) {
        this.world = world;
        this.config = config;
        this.id = this.generateId();
        this.initialize();
    }

    private generateId(): string {
        return `joint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private initialize(): void {
        const box2d = this.world.getBox2D();

        // Defensive: if Box2D is not available, skip initialization
        if (!box2d) {
            console.log('PhysicsJoint: Box2D not available, skipping joint creation');
            return;
        }

        const world = this.world.getWorld();
        if (!world) {
            console.log('PhysicsJoint: Physics world not available');
            return;
        }

        switch (this.config.type) {
            case JointType.Revolute:
                this.createRevoluteJoint(box2d);
                break;
            case JointType.Distance:
                this.createDistanceJoint(box2d);
                break;
            case JointType.Rope:
                this.createRopeJoint(box2d);
                break;
            case JointType.Prismatic:
                this.createPrismaticJoint(box2d);
                break;
            case JointType.Weld:
                this.createWeldJoint(box2d);
                break;
        }
    }

    private createRevoluteJoint(box2d: any): void {
        const config = this.config as RevoluteJointConfig;
        const jointDef = new box2d.b2RevoluteJointDef();

        const bodyA = config.bodyA.getB2Body();
        const bodyB = config.bodyB.getB2Body();

        if (!bodyA || !bodyB) {
            console.log('PhysicsJoint: One or both bodies not available for revolute joint');
            return;
        }

        jointDef.Initialize(
            bodyA,
            bodyB,
            this.world.toB2Vec2(config.anchorA)
        );

        jointDef.collideConnected = config.collideConnected || false;

        if (config.enableLimit) {
            jointDef.enableLimit = true;
            jointDef.lowerAngle = config.lowerAngle || 0;
            jointDef.upperAngle = config.upperAngle || 0;
        }

        if (config.enableMotor) {
            jointDef.enableMotor = true;
            jointDef.motorSpeed = config.motorSpeed || 0;
            jointDef.maxMotorTorque = config.maxMotorTorque || 0;
        }

        this.joint = this.world.createJoint(jointDef);
    }

    private createDistanceJoint(box2d: any): void {
        const config = this.config as DistanceJointConfig;
        const jointDef = new box2d.b2DistanceJointDef();

        const bodyA = config.bodyA.getB2Body();
        const bodyB = config.bodyB.getB2Body();

        if (!bodyA || !bodyB) {
            console.log('PhysicsJoint: One or both bodies not available for distance joint');
            return;
        }

        jointDef.Initialize(
            bodyA,
            bodyB,
            this.world.toB2Vec2(config.anchorA),
            this.world.toB2Vec2(config.anchorB)
        );

        jointDef.collideConnected = config.collideConnected || false;

        if (config.length !== undefined) {
            jointDef.length = config.length;
        }

        if (config.frequency !== undefined) {
            jointDef.frequency = config.frequency;
        }

        if (config.dampingRatio !== undefined) {
            jointDef.dampingRatio = config.dampingRatio;
        }

        this.joint = this.world.createJoint(jointDef);
    }

    private createRopeJoint(box2d: any): void {
        const config = this.config as RopeJointConfig;
        const jointDef = new box2d.b2RopeJointDef();

        const bodyA = config.bodyA.getB2Body();
        const bodyB = config.bodyB.getB2Body();

        if (!bodyA || !bodyB) {
            console.log('PhysicsJoint: One or both bodies not available for rope joint');
            return;
        }

        jointDef.bodyA = bodyA;
        jointDef.bodyB = bodyB;
        jointDef.localAnchorA = this.world.toB2Vec2(config.localAnchorA);
        jointDef.localAnchorB = this.world.toB2Vec2(config.localAnchorB);
        jointDef.maxLength = config.maxLength;
        jointDef.collideConnected = config.collideConnected || false;

        this.joint = this.world.createJoint(jointDef);
    }

    private createPrismaticJoint(box2d: any): void {
        const config = this.config as PrismaticJointConfig;
        const jointDef = new box2d.b2PrismaticJointDef();

        const bodyA = config.bodyA.getB2Body();
        const bodyB = config.bodyB.getB2Body();

        if (!bodyA || !bodyB) {
            console.log('PhysicsJoint: One or both bodies not available for prismatic joint');
            return;
        }

        jointDef.Initialize(
            bodyA,
            bodyB,
            this.world.toB2Vec2(config.anchor),
            this.world.toB2Vec2(config.axis)
        );

        jointDef.collideConnected = config.collideConnected || false;

        if (config.enableLimit) {
            jointDef.enableLimit = true;
            jointDef.lowerTranslation = config.lowerTranslation || 0;
            jointDef.upperTranslation = config.upperTranslation || 0;
        }

        if (config.enableMotor) {
            jointDef.enableMotor = true;
            jointDef.motorSpeed = config.motorSpeed || 0;
            jointDef.maxMotorForce = config.maxMotorForce || 0;
        }

        this.joint = this.world.createJoint(jointDef);
    }

    private createWeldJoint(box2d: any): void {
        const config = this.config as WeldJointConfig;
        const jointDef = new box2d.b2WeldJointDef();

        const bodyA = config.bodyA.getB2Body();
        const bodyB = config.bodyB.getB2Body();

        if (!bodyA || !bodyB) {
            console.log('PhysicsJoint: One or both bodies not available for weld joint');
            return;
        }

        jointDef.Initialize(
            bodyA,
            bodyB,
            this.world.toB2Vec2(config.anchor)
        );

        jointDef.collideConnected = config.collideConnected || false;

        if (config.frequency !== undefined) {
            jointDef.frequency = config.frequency;
        }

        if (config.dampingRatio !== undefined) {
            jointDef.dampingRatio = config.dampingRatio;
        }

        this.joint = this.world.createJoint(jointDef);
    }

    public getId(): string {
        return this.id;
    }

    public getJoint(): any | undefined {
        return this.joint;
    }

    public getBodyA(): PhysicsBody {
        return this.config.bodyA;
    }

    public getBodyB(): PhysicsBody {
        return this.config.bodyB;
    }

    public isActive(): boolean {
        if (!this.joint) return false;
        return this.joint.IsActive();
    }

    public setMotorSpeed(speed: number): void {
        if (!this.joint) return;

        if (this.config.type === JointType.Revolute) {
            (this.joint as any).SetMotorSpeed(speed);
        } else if (this.config.type === JointType.Prismatic) {
            (this.joint as any).SetMotorSpeed(speed);
        }
    }

    public getMotorSpeed(): number {
        if (!this.joint) return 0;

        if (this.config.type === JointType.Revolute) {
            return (this.joint as any).GetMotorSpeed();
        } else if (this.config.type === JointType.Prismatic) {
            return (this.joint as any).GetMotorSpeed();
        }

        return 0;
    }

    public destroy(): void {
        if (!this.joint) return;

        this.world.destroyJoint(this.joint);
        this.joint = undefined;
    }
}
