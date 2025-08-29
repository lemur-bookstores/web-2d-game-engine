
import { Entity } from "@/ecs";

export interface LightBounds {
    x: number;
    y: number;
    width: number;
    height: number;
}

// ===== INTERFACES DE LUCES =====

export interface LightInstance {
    id: string;
    entity?: Entity;
    position: Vector2D;
    color: Color;
    intensity: number;
    enabled: boolean;

    // Métodos del ciclo de vida
    init?(): void;
    update?(dt: number): void;
    destroy?(): void;

    // Métodos de renderizado
    render?(context: CanvasRenderingContext2D, camera?: any): void;
    getBounds?(): LightBounds;

    // Gestión de estado (similar a ScriptInstance)
    getAllProperties?(): LightState;
    setAllProperties?(state: LightState): void;
    getProperty?(name: string): any;
    setProperty?(name: string, value: any): void;
}

export type LightState = Record<string, any>;
export type LightConstructor = new (...args: any[]) => LightInstance;

export interface LightMetadata {
    lightType: string;
    constructor: LightConstructor;
    properties: PropertyMetadata[];
    description?: string;
    category?: 'basic' | 'advanced' | 'effect';
}

export interface PropertyMetadata {
    name: string;
    initialValue: any;
    type: string;
    description?: string;
    min?: number;
    max?: number;
}

// ===== COMPONENTE DE LUZ =====

export type LightEntry = {
    lightType?: string;
    state?: LightState;
    instance?: LightInstance;
};

export type LightComponent = {
    type: 'light';
    // Soporte para luz única (legacy/simple)
    lightType?: string;
    state?: LightState;
    instance?: LightInstance;

    // Soporte para múltiples luces
    lights?: LightEntry[];

    // Configuración global del componente
    castShadows?: boolean;
    affectedByAmbient?: boolean;
};

export function createLightComponent(lightType?: string, state?: LightState): LightComponent {
    if (!lightType) return { type: 'light' };
    return {
        type: 'light',
        lightType,
        state,
        castShadows: true,
        affectedByAmbient: true
    };
}