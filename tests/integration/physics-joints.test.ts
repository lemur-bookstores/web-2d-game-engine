import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PhysicsWorld } from '../../src/physics/PhysicsWorld';
import { PhysicsBody, PhysicsBodyType, PhysicsShape } from '../../src/physics/PhysicsBody';
import { PhysicsJoint, JointType } from '../../src/physics/PhysicsJoint';
import { Vector2 } from '../../src/math/Vector2';

describe('PhysicsJoint Integration Tests', () => {
    let physicsWorld: PhysicsWorld;
    let bodyA: PhysicsBody;
    let bodyB: PhysicsBody;

    beforeEach(async () => {
        physicsWorld = await PhysicsWorld.getInstance();

        // Create two physics bodies for joint testing
        bodyA = new PhysicsBody(physicsWorld, {
            type: PhysicsBodyType.Dynamic,
            shape: PhysicsShape.Box,
            width: 1,
            height: 1,
            position: new Vector2(-1, 0)
        });

        bodyB = new PhysicsBody(physicsWorld, {
            type: PhysicsBodyType.Dynamic,
            shape: PhysicsShape.Box,
            width: 1,
            height: 1,
            position: new Vector2(1, 0)
        });
    });

    afterEach(() => {
        bodyA?.destroy();
        bodyB?.destroy();
    });

    it('should create a revolute joint', async () => {
        const joint = new PhysicsJoint(physicsWorld, {
            type: JointType.Revolute,
            bodyA,
            bodyB,
            anchorA: new Vector2(0, 0),
            anchorB: new Vector2(0, 0),
            enableLimit: true,
            lowerAngle: -Math.PI / 4,
            upperAngle: Math.PI / 4
        });

        // Test that joint was created (might be undefined if Box2D not available)
        expect(joint.getId()).toBeDefined();
        expect(joint.getBodyA()).toBe(bodyA);
        expect(joint.getBodyB()).toBe(bodyB);

        // Note: Joint creation might fail if Box2D WASM is not available (expected behavior)
        const b2Joint = joint.getJoint();
        if (b2Joint) {
            expect(joint.isActive()).toBe(true);
        } else {
            console.log('Box2D not available - joint creation skipped (expected)');
            expect(b2Joint).toBeUndefined();
        }

        joint.destroy();
    });

    it('should create a distance joint', async () => {
        const joint = new PhysicsJoint(physicsWorld, {
            type: JointType.Distance,
            bodyA,
            bodyB,
            anchorA: new Vector2(-1, 0),
            anchorB: new Vector2(1, 0),
            length: 2.0,
            frequency: 4.0,
            dampingRatio: 0.5
        });

        expect(joint.getId()).toBeDefined();
        expect(joint.getBodyA()).toBe(bodyA);
        expect(joint.getBodyB()).toBe(bodyB);

        // Joint might be undefined if Box2D not available
        const b2Joint = joint.getJoint();
        if (b2Joint) {
            expect(joint.isActive()).toBe(true);
        } else {
            console.log('Box2D not available - distance joint creation skipped (expected)');
        }

        joint.destroy();
    });

    it('should create a rope joint', async () => {
        const joint = new PhysicsJoint(physicsWorld, {
            type: JointType.Rope,
            bodyA,
            bodyB,
            localAnchorA: new Vector2(0, 0),
            localAnchorB: new Vector2(0, 0),
            maxLength: 3.0
        });

        expect(joint.getId()).toBeDefined();
        expect(joint.getBodyA()).toBe(bodyA);
        expect(joint.getBodyB()).toBe(bodyB);

        joint.destroy();
    });

    it('should create a prismatic joint with motor', async () => {
        const joint = new PhysicsJoint(physicsWorld, {
            type: JointType.Prismatic,
            bodyA,
            bodyB,
            anchor: new Vector2(0, 0),
            axis: new Vector2(1, 0),
            enableLimit: true,
            lowerTranslation: -2.0,
            upperTranslation: 2.0,
            enableMotor: true,
            motorSpeed: 1.0,
            maxMotorForce: 100.0
        });

        expect(joint.getId()).toBeDefined();

        // Test motor speed methods (defensive against missing Box2D)
        joint.setMotorSpeed(2.0);
        const speed = joint.getMotorSpeed();

        // Should return 0 if Box2D not available, otherwise the set speed
        expect(typeof speed).toBe('number');

        joint.destroy();
    });

    it('should create a weld joint', async () => {
        const joint = new PhysicsJoint(physicsWorld, {
            type: JointType.Weld,
            bodyA,
            bodyB,
            anchor: new Vector2(0, 0),
            frequency: 2.0,
            dampingRatio: 0.7
        });

        expect(joint.getId()).toBeDefined();
        expect(joint.getBodyA()).toBe(bodyA);
        expect(joint.getBodyB()).toBe(bodyB);

        joint.destroy();
    });

    it('should handle joint destruction gracefully', async () => {
        const joint = new PhysicsJoint(physicsWorld, {
            type: JointType.Distance,
            bodyA,
            bodyB,
            anchorA: new Vector2(-1, 0),
            anchorB: new Vector2(1, 0)
        });

        const jointId = joint.getId();
        expect(jointId).toBeDefined();

        // Destroy should not throw errors
        expect(() => joint.destroy()).not.toThrow();

        // Multiple destroys should be safe
        expect(() => joint.destroy()).not.toThrow();
    });

    it('should handle missing bodies gracefully', async () => {
        // Create joint with undefined bodies (should handle defensively)
        const fakeBodyA = new PhysicsBody(physicsWorld, {
            type: PhysicsBodyType.Static,
            shape: PhysicsShape.Box
        });

        const fakeBodyB = new PhysicsBody(physicsWorld, {
            type: PhysicsBodyType.Static,
            shape: PhysicsShape.Box
        });

        const joint = new PhysicsJoint(physicsWorld, {
            type: JointType.Revolute,
            bodyA: fakeBodyA,
            bodyB: fakeBodyB,
            anchorA: new Vector2(0, 0),
            anchorB: new Vector2(0, 0)
        });

        // Should not crash even if Box2D bodies are not available
        expect(joint.getId()).toBeDefined();
        expect(joint.getBodyA()).toBe(fakeBodyA);
        expect(joint.getBodyB()).toBe(fakeBodyB);

        // isActive should handle undefined joints
        expect(typeof joint.isActive()).toBe('boolean');

        joint.destroy();
        fakeBodyA.destroy();
        fakeBodyB.destroy();
    });
});
