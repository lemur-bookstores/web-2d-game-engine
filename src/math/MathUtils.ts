/**
 * Math utilities for the game engine
 */

export class MathUtils {
    /**
     * Convert degrees to radians
     */
    static degToRad(degrees: number): number {
        return degrees * (Math.PI / 180);
    }

    /**
     * Convert radians to degrees
     */
    static radToDeg(radians: number): number {
        return radians * (180 / Math.PI);
    }

    /**
     * Clamp a value between min and max
     */
    static clamp(value: number, min: number, max: number): number {
        return Math.min(Math.max(value, min), max);
    }

    /**
     * Linear interpolation between two values
     */
    static lerp(a: number, b: number, t: number): number {
        return a + (b - a) * t;
    }

    /**
     * Inverse linear interpolation - find t value for a given result
     */
    static inverseLerp(a: number, b: number, value: number): number {
        return (value - a) / (b - a);
    }

    /**
     * Smoothstep interpolation (smooth acceleration and deceleration)
     */
    static smoothstep(edge0: number, edge1: number, x: number): number {
        const t = this.clamp((x - edge0) / (edge1 - edge0), 0, 1);
        return t * t * (3 - 2 * t);
    }

    /**
     * Smootherstep interpolation (even smoother than smoothstep)
     */
    static smootherstep(edge0: number, edge1: number, x: number): number {
        const t = this.clamp((x - edge0) / (edge1 - edge0), 0, 1);
        return t * t * t * (t * (t * 6 - 15) + 10);
    }

    /**
     * Map a value from one range to another
     */
    static map(
        value: number,
        fromMin: number,
        fromMax: number,
        toMin: number,
        toMax: number
    ): number {
        return ((value - fromMin) / (fromMax - fromMin)) * (toMax - toMin) + toMin;
    }

    /**
     * Check if a value is approximately equal to another (within epsilon)
     */
    static approximately(a: number, b: number, epsilon: number = Number.EPSILON): boolean {
        return Math.abs(a - b) < epsilon;
    }

    /**
     * Get the sign of a number (-1, 0, or 1)
     */
    static sign(value: number): number {
        return value > 0 ? 1 : value < 0 ? -1 : 0;
    }

    /**
     * Wrap an angle to be between -PI and PI
     */
    static wrapAngle(angle: number): number {
        while (angle > Math.PI) angle -= 2 * Math.PI;
        while (angle < -Math.PI) angle += 2 * Math.PI;
        return angle;
    }

    /**
     * Get the shortest angular distance between two angles
     */
    static angleDifference(from: number, to: number): number {
        const diff = to - from;
        return this.wrapAngle(diff);
    }

    /**
     * Linear interpolation between two angles (taking the shortest path)
     */
    static lerpAngle(from: number, to: number, t: number): number {
        const diff = this.angleDifference(from, to);
        return from + diff * t;
    }

    /**
     * Generate a random number between min and max (inclusive)
     */
    static random(min: number = 0, max: number = 1): number {
        return Math.random() * (max - min) + min;
    }

    /**
     * Generate a random integer between min and max (inclusive)
     */
    static randomInt(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Check if a number is a power of 2
     */
    static isPowerOfTwo(value: number): boolean {
        return (value & (value - 1)) === 0 && value !== 0;
    }

    /**
     * Get the next power of 2 greater than or equal to the value
     */
    static nextPowerOfTwo(value: number): number {
        if (this.isPowerOfTwo(value)) return value;
        let power = 1;
        while (power < value) {
            power *= 2;
        }
        return power;
    }

    /**
     * Calculate the distance between two points
     */
    static distance(x1: number, y1: number, x2: number, y2: number): number {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Calculate the squared distance between two points (faster for comparisons)
     */
    static distanceSquared(x1: number, y1: number, x2: number, y2: number): number {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return dx * dx + dy * dy;
    }

    /**
     * Check if a point is inside a rectangle
     */
    static pointInRect(
        pointX: number,
        pointY: number,
        rectX: number,
        rectY: number,
        rectWidth: number,
        rectHeight: number
    ): boolean {
        return (
            pointX >= rectX &&
            pointX <= rectX + rectWidth &&
            pointY >= rectY &&
            pointY <= rectY + rectHeight
        );
    }

    /**
     * Check if a point is inside a circle
     */
    static pointInCircle(
        pointX: number,
        pointY: number,
        circleX: number,
        circleY: number,
        radius: number
    ): boolean {
        return this.distanceSquared(pointX, pointY, circleX, circleY) <= radius * radius;
    }

    /**
     * Check if two rectangles intersect
     */
    static rectIntersect(
        rect1X: number,
        rect1Y: number,
        rect1Width: number,
        rect1Height: number,
        rect2X: number,
        rect2Y: number,
        rect2Width: number,
        rect2Height: number
    ): boolean {
        return !(
            rect2X > rect1X + rect1Width ||
            rect2X + rect2Width < rect1X ||
            rect2Y > rect1Y + rect1Height ||
            rect2Y + rect2Height < rect1Y
        );
    }

    /**
     * Check if two circles intersect
     */
    static circleIntersect(
        circle1X: number,
        circle1Y: number,
        radius1: number,
        circle2X: number,
        circle2Y: number,
        radius2: number
    ): boolean {
        const radiusSum = radius1 + radius2;
        return this.distanceSquared(circle1X, circle1Y, circle2X, circle2Y) <= radiusSum * radiusSum;
    }

    // Constants
    static readonly PI = Math.PI;
    static readonly TWO_PI = Math.PI * 2;
    static readonly HALF_PI = Math.PI / 2;
    static readonly DEG_TO_RAD = Math.PI / 180;
    static readonly RAD_TO_DEG = 180 / Math.PI;
    static readonly EPSILON = Number.EPSILON;
}
