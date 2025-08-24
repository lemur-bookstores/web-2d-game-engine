/**
 * Type definitions for the GameEngine 2D
 */
export interface Position {
    x: number;
    y: number;
}

export interface Scale extends Position { }

export interface EngineConfig {
    canvas: string | HTMLCanvasElement;
    width: number;
    height: number;
    renderer: 'webgl' | 'canvas2d' | 'auto';
    backgroundColor?: string;
    pixelRatio?: number;
    antialias?: boolean;
    debug?: boolean;
}

export interface GameEvent<T = any> {
    type: AllEventTypes;
    data: T;
    timestamp: number;
}

export type EventCallback<T> = (event: GameEvent<T>) => void;

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
    position: Position;
    rotation: number;
    scale: Scale;
}

export type SystemUpdateFunction = <T>(entities: T[], deltaTime: number) => void;
export type ComponentType = string;
export type EntityId = string;