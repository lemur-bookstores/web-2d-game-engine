import { Entity } from '../ecs/Entity';

export type ScriptState = any;

export interface ScriptInstance {
    entity?: Entity;
    init?(): void;
    update?(dt: number): void;
    destroy?(): void;
    toJSON?(): any;
    fromJSON?(data: any): void;
}

export type ScriptComponent = {
    type: 'script';
    scriptName?: string; // serializable reference
    state?: ScriptState; // serializable state
    instance?: ScriptInstance; // runtime instance
};

export function createScriptComponent(name?: string, state?: ScriptState): ScriptComponent {
    return {
        type: 'script',
        scriptName: name,
        state
    };
}
