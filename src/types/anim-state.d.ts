import { Entity } from '../ecs/Entity';

export interface AnimationState {
    name: string;
    animation: string;
    onEnter?: { reset?: boolean; events?: string[] };
    onExit?: { events?: string[] };
}

export interface AnimationTransition {
    from: string | '*';
    to: string;
    condition?: (entity: Entity) => boolean;
    trigger?: string;
    priority?: number;
}

export interface StateMachineDefinition {
    states: AnimationState[];
    transitions: AnimationTransition[];
    initial: string;
}

export interface AnimationStateMachineComponent {
    type: 'anim-machine';
    defKey: string; // key to lookup shared definition
    currentState: string;
    elapsed: number;
    params?: Record<string, any>;
}
