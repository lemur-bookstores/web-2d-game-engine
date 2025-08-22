/**
 * Type definitions for the GameEngine 2D
 */

export interface EngineConfig {
    canvas: string | HTMLCanvasElement;
    width: number;
    height: number;
    renderer: 'webgl' | 'canvas2d' | 'auto';
    backgroundColor?: string;
    pixelRatio?: number;
    antialias?: boolean;
}

export interface GameEvent {
    type: string;
    data: any;
    timestamp: number;
}

export type EventCallback = (event: GameEvent) => void;

export interface Color {
    r: number;
    g: number;
    b: number;
    a: number;
}

export interface Rectangle {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface TransformData {
    position: { x: number; y: number };
    rotation: number;
    scale: { x: number; y: number };
}

export type SystemUpdateFunction = (entities: any[], deltaTime: number) => void;
export type ComponentType = string;
export type EntityId = string;
