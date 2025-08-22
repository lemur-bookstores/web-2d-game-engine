/**
 * Vector2 class for 2D math operations
 */
export class Vector2 {
    public x: number;
    public y: number;

    constructor(x: number = 0, y: number = 0) {
        this.x = x;
        this.y = y;
    }

    /**
     * Set both x and y values
     */
    set(x: number, y: number): Vector2 {
        this.x = x;
        this.y = y;
        return this;
    }

    /**
     * Create a copy of this vector
     */
    clone(): Vector2 {
        return new Vector2(this.x, this.y);
    }

    /**
     * Copy values from another vector
     */
    copy(other: Vector2): Vector2 {
        this.x = other.x;
        this.y = other.y;
        return this;
    }

    /**
     * Add another vector to this one
     */
    add(other: Vector2): Vector2 {
        this.x += other.x;
        this.y += other.y;
        return this;
    }

    /**
     * Subtract another vector from this one
     */
    subtract(other: Vector2): Vector2 {
        this.x -= other.x;
        this.y -= other.y;
        return this;
    }

    /**
     * Multiply this vector by a scalar
     */
    multiply(scalar: number): Vector2 {
        this.x *= scalar;
        this.y *= scalar;
        return this;
    }

    /**
     * Divide this vector by a scalar
     */
    divide(scalar: number): Vector2 {
        if (scalar === 0) {
            throw new Error('Cannot divide by zero');
        }
        this.x /= scalar;
        this.y /= scalar;
        return this;
    }

    /**
     * Calculate the magnitude (length) of the vector
     */
    magnitude(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    /**
     * Calculate the squared magnitude (faster than magnitude for comparisons)
     */
    magnitudeSquared(): number {
        return this.x * this.x + this.y * this.y;
    }

    /**
     * Normalize the vector (make it unit length)
     */
    normalize(): Vector2 {
        const mag = this.magnitude();
        if (mag === 0) {
            return this;
        }
        return this.divide(mag);
    }

    /**
     * Get the dot product with another vector
     */
    dot(other: Vector2): number {
        return this.x * other.x + this.y * other.y;
    }

    /**
     * Get the cross product with another vector (returns scalar in 2D)
     */
    cross(other: Vector2): number {
        return this.x * other.y - this.y * other.x;
    }

    /**
     * Calculate distance to another vector
     */
    distanceTo(other: Vector2): number {
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Calculate squared distance to another vector (faster for comparisons)
     */
    distanceToSquared(other: Vector2): number {
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        return dx * dx + dy * dy;
    }

    /**
     * Linear interpolation between this vector and another
     */
    lerp(other: Vector2, t: number): Vector2 {
        this.x += (other.x - this.x) * t;
        this.y += (other.y - this.y) * t;
        return this;
    }

    /**
     * Check if this vector equals another vector
     */
    equals(other: Vector2, epsilon: number = Number.EPSILON): boolean {
        return (
            Math.abs(this.x - other.x) < epsilon &&
            Math.abs(this.y - other.y) < epsilon
        );
    }

    /**
     * Convert to string representation
     */
    toString(): string {
        return `Vector2(${this.x}, ${this.y})`;
    }

    // Static utility methods
    static zero(): Vector2 {
        return new Vector2(0, 0);
    }

    static one(): Vector2 {
        return new Vector2(1, 1);
    }

    static up(): Vector2 {
        return new Vector2(0, -1);
    }

    static down(): Vector2 {
        return new Vector2(0, 1);
    }

    static left(): Vector2 {
        return new Vector2(-1, 0);
    }

    static right(): Vector2 {
        return new Vector2(1, 0);
    }

    /**
     * Create a vector from an angle (in radians)
     */
    static fromAngle(angle: number, magnitude: number = 1): Vector2 {
        return new Vector2(
            Math.cos(angle) * magnitude,
            Math.sin(angle) * magnitude
        );
    }

    /**
     * Linear interpolation between two vectors
     */
    static lerp(a: Vector2, b: Vector2, t: number): Vector2 {
        return new Vector2(
            a.x + (b.x - a.x) * t,
            a.y + (b.y - a.y) * t
        );
    }

    /**
     * Add two vectors and return a new vector
     */
    static add(a: Vector2, b: Vector2): Vector2 {
        return new Vector2(a.x + b.x, a.y + b.y);
    }

    /**
     * Subtract two vectors and return a new vector
     */
    static subtract(a: Vector2, b: Vector2): Vector2 {
        return new Vector2(a.x - b.x, a.y - b.y);
    }

    /**
     * Multiply vector by scalar and return a new vector
     */
    static multiply(vector: Vector2, scalar: number): Vector2 {
        return new Vector2(vector.x * scalar, vector.y * scalar);
    }
}
