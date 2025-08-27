import { Entity } from '../ecs/Entity';

export type ScriptState = Record<string, any>;

export interface ScriptInstance {
    entity?: Entity;
    init?(): void;
    update?(dt: number): void;
    destroy?(): void;

    // Nuevos métodos opcionales para gestión de estado avanzada
    getAllProperties?(): ScriptState;
    setAllProperties?(state: ScriptState): void;
    getProperty?(name: string): any;
    setProperty?(name: string, value: any): void;
}

export type ScriptEntry = {
    scriptName?: string;
    state?: ScriptState;
    instance?: ScriptInstance;
};

export type ScriptComponent = {
    type: 'script';
    // legacy single-script fields (kept for compatibility)
    scriptName?: string;
    state?: ScriptState;
    instance?: ScriptInstance;
    // modern multi-script support
    scripts?: ScriptEntry[];
};

export function createScriptComponent(name?: string, state?: ScriptState): ScriptComponent {
    if (name === undefined) return { type: 'script' };
    return {
        type: 'script',
        scriptName: name,
        state
    };
}
