import { Vector2 } from './Vector2';

/**
 * Transform class for handling position, rotation, and scale
 */
export class Transform {
    public position: Vector2;
    public rotation: number; // in radians
    public scale: Vector2;

    constructor(
        position: Vector2 = new Vector2(),
        rotation: number = 0,
        scale: Vector2 = new Vector2(1, 1)
    ) {
        this.position = position;
        this.rotation = rotation;
        this.scale = scale;
    }

    /**
     * Create a copy of this transform
     */
    clone(): Transform {
        return new Transform(
            this.position.clone(),
            this.rotation,
            this.scale.clone()
        );
    }

    /**
     * Copy values from another transform
     */
    copy(other: Transform): Transform {
        this.position.copy(other.position);
        this.rotation = other.rotation;
        this.scale.copy(other.scale);
        return this;
    }

    /**
     * Reset transform to identity
     */
    reset(): Transform {
        this.position.set(0, 0);
        this.rotation = 0;
        this.scale.set(1, 1);
        return this;
    }

    /**
     * Translate by a vector
     */
    translate(offset: Vector2): Transform {
        this.position.add(offset);
        return this;
    }

    /**
     * Rotate by an angle (in radians)
     */
    rotate(angle: number): Transform {
        this.rotation += angle;
        return this;
    }

    /**
     * Scale uniformly
     */
    scaleUniform(factor: number): Transform {
        this.scale.multiply(factor);
        return this;
    }

    /**
     * Scale non-uniformly
     */
    scaleBy(scaleVector: Vector2): Transform {
        this.scale.x *= scaleVector.x;
        this.scale.y *= scaleVector.y;
        return this;
    }

    /**
     * Get the forward direction vector based on rotation
     */
    getForward(): Vector2 {
        return Vector2.fromAngle(this.rotation);
    }

    /**
     * Get the right direction vector based on rotation
     */
    getRight(): Vector2 {
        return Vector2.fromAngle(this.rotation + Math.PI / 2);
    }

    /**
     * Transform a point from local space to world space
     */
    transformPoint(localPoint: Vector2): Vector2 {
        // Scale
        const scaled = new Vector2(
            localPoint.x * this.scale.x,
            localPoint.y * this.scale.y
        );

        // Rotate
        const cos = Math.cos(this.rotation);
        const sin = Math.sin(this.rotation);
        const rotated = new Vector2(
            scaled.x * cos - scaled.y * sin,
            scaled.x * sin + scaled.y * cos
        );

        // Translate
        return Vector2.add(rotated, this.position);
    }

    /**
     * Transform a point from world space to local space
     */
    inverseTransformPoint(worldPoint: Vector2): Vector2 {
        // Translate
        const translated = Vector2.subtract(worldPoint, this.position);

        // Rotate (inverse)
        const cos = Math.cos(-this.rotation);
        const sin = Math.sin(-this.rotation);
        const rotated = new Vector2(
            translated.x * cos - translated.y * sin,
            translated.x * sin + translated.y * cos
        );

        // Scale (inverse)
        return new Vector2(
            rotated.x / this.scale.x,
            rotated.y / this.scale.y
        );
    }

    /**
     * Get transformation matrix as a 6-element array [a, b, c, d, e, f]
     * for use with Canvas2D transform
     */
    getMatrix(): number[] {
        const cos = Math.cos(this.rotation);
        const sin = Math.sin(this.rotation);

        return [
            cos * this.scale.x,           // a
            sin * this.scale.x,           // b
            -sin * this.scale.y,          // c
            cos * this.scale.y,           // d
            this.position.x,              // e
            this.position.y               // f
        ];
    }

    /**
     * Check if this transform equals another transform
     */
    equals(other: Transform, epsilon: number = Number.EPSILON): boolean {
        return (
            this.position.equals(other.position, epsilon) &&
            Math.abs(this.rotation - other.rotation) < epsilon &&
            this.scale.equals(other.scale, epsilon)
        );
    }

    /**
     * Convert to string representation
     */
    toString(): string {
        return `Transform(pos: ${this.position}, rot: ${this.rotation}, scale: ${this.scale})`;
    }

    /**
     * Create an identity transform
     */
    static identity(): Transform {
        return new Transform();
    }

    /**
     * Linear interpolation between two transforms
     */
    static lerp(a: Transform, b: Transform, t: number): Transform {
        return new Transform(
            Vector2.lerp(a.position, b.position, t),
            a.rotation + (b.rotation - a.rotation) * t,
            Vector2.lerp(a.scale, b.scale, t)
        );
    }
}
