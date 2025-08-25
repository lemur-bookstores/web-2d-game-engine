import { System } from '../ecs/System';
import { Entity } from '../ecs/Entity';
import { AnimationStateMachineComponent } from '../types/anim-state';
import { StateMachineDefinition, AnimationTransition } from '../types/anim-state';
import { EventSystem } from '../core/EventSystem';
import { AnimationComponent } from './Animation';

// Simple registry to hold shared definitions
const stateMachineRegistry = new Map<string, StateMachineDefinition>();

export function registerStateMachine(key: string, def: StateMachineDefinition) {
    stateMachineRegistry.set(key, def);
}

export class AnimationStateMachineSystem extends System {
    requiredComponents = ['anim-machine', 'animation'];
    private eventSystem = EventSystem.getInstance();

    constructor() {
        super();
    }

    update(entities: Entity[], deltaTime: number): void {
        const targets = this.getEntitiesWithComponents(entities, this.requiredComponents);

        for (const entity of targets) {
            const machine = entity.getComponent<AnimationStateMachineComponent>('anim-machine');
            const animComp = entity.getComponent<AnimationComponent>('animation');
            if (!machine || !animComp) continue;

            const def = stateMachineRegistry.get(machine.defKey);
            if (!def) continue;

            // Evaluate transitions in priority order
            const applicable = this.findTransitionFor(entity, machine, def);
            if (applicable) {
                this.applyTransition(entity, machine, animComp, def, applicable);
            }

            // advance elapsed for machine (small usage of deltaTime to avoid unused param lint)
            machine.elapsed += deltaTime;
        }
    }

    private findTransitionFor(entity: Entity, machine: AnimationStateMachineComponent, def: StateMachineDefinition): AnimationTransition | null {
        const transitions = def.transitions.slice().sort((a, b) => (b.priority || 0) - (a.priority || 0));

        for (const t of transitions) {
            if (t.from !== '*' && t.from !== machine.currentState) continue;

            // trigger-based transitions are handled by listening to events; here we only evaluate conditions
            if (t.condition) {
                try {
                    if (t.condition(entity)) return t;
                } catch (e) {
                    // ignore user errors
                }
            }
        }

        return null;
    }

    private applyTransition(entity: Entity, machine: AnimationStateMachineComponent, animComp: AnimationComponent, def: StateMachineDefinition, transition: AnimationTransition) {
        if (machine.currentState === transition.to) return;

        // run onExit for current state
        const prevState = def.states.find(s => s.name === machine.currentState);
        if (prevState && prevState.onExit?.events) {
            for (const ev of prevState.onExit.events) this.eventSystem.emit(ev as any, { entity });
        }

        machine.currentState = transition.to;
        machine.elapsed = 0;

        const nextState = def.states.find(s => s.name === transition.to);
        if (nextState) {
            if (nextState.onEnter?.events) {
                for (const ev of nextState.onEnter.events) this.eventSystem.emit(ev as any, { entity });
            }

            // Apply the animation on the AnimationComponent (use animation name)
            animComp.currentAnimation = nextState.animation;
            animComp.currentFrame = 0;
            animComp.elapsedTime = 0;
            animComp.playing = true;
        }
    }

    // Allow external triggers to request transition evaluation for an entity
    trigger(entity: Entity, triggerName: string) {
        const machine = entity.getComponent<AnimationStateMachineComponent>('anim-machine');
        if (!machine) return;

        const def = stateMachineRegistry.get(machine.defKey);
        if (!def) return;

        // Find any transition that matches the trigger
        const matching = def.transitions.filter(t => t.trigger === triggerName && (t.from === '*' || t.from === machine.currentState));
        if (matching.length === 0) return;

        // Apply highest priority
        matching.sort((a, b) => (b.priority || 0) - (a.priority || 0));
        this.applyTransition(entity, machine, entity.getComponent<AnimationComponent>('animation')!, def, matching[0]);
    }
}

export default AnimationStateMachineSystem;
