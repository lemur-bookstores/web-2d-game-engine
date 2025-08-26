import { Vector2 } from '../math/Vector2';
import { PhysicsBody } from './PhysicsBody';

export interface RaycastOptions {
    layerMask?: number;
    includeSensors?: boolean;
    maxResults?: number;
}

export interface RaycastResult {
    point: Vector2;
    normal: Vector2;
    fraction: number;
    body?: PhysicsBody;
    entityId?: string;
    fixture?: any; // Box2D fixture if available
}

export interface RaycastHit {
    distance: number;
    point: Vector2;
    normal: Vector2;
    body: PhysicsBody;
    entityId?: string;
}
