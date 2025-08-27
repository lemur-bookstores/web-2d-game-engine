/**
 * Type definitions for the GameEngine 2D
 */

interface PropertyMetadata {
    name: string;
    initialValue: any;
    type: string;
    isReadOnly?: boolean;
    validator?: (value: any) => boolean;
    description?: string;
}

interface Vector2D {
    x: number;
    y: number;
}

interface EngineConfig {
    canvas: string | HTMLCanvasElement;
    width: number;
    height: number;
    renderer: 'webgl' | 'canvas2d' | 'auto';
    backgroundColor?: string;
    pixelRatio?: number;
    antialias?: boolean;
    debug?: boolean;
}

interface GameEvent<T = any> {
    type: AllEventTypes;
    data: T;
    timestamp: number;
}

type EventCallback<T> = (event: GameEvent<T>) => void;

interface Color {
    r: number;
    g: number;
    b: number;
    a: number;
}

interface Rectangle {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface TransformData {
    position: Vector2D;
    rotation: number;
    scale: Vector2D;
}

type SystemUpdateFunction = <T>(entities: T[], deltaTime: number) => void;
type ComponentType = string;
type EntityId = string;

interface AudioComponent {
    type: 'audio';
    clip: string; // key in AssetManager or path
    loop?: boolean;
    volume?: number; // 0..1
    group?: string; // e.g., 'sfx' | 'music'
    autoplay?: boolean;
}