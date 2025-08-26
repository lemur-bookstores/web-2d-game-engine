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
    // track entities that contain anim-machine so event handlers can find targets
    private trackedEntities: Map<string, Entity> = new Map();
    // map of registered global handlers per event name
    private globalEventHandlers: Map<string, (ev: any) => void> = new Map();
    // cache entities grouped by state machine defKey for faster lookup from handlers
    private entityCache: Map<string, Set<Entity>> = new Map();
    // map trigger -> set of defKeys that declare transitions using that trigger
    private triggerToDefKeys: Map<string, Set<string>> = new Map();

    constructor() {
        super();
    }

    update(entities: Entity[], deltaTime: number): void {
        const targets = this.getEntitiesWithComponents(entities, this.requiredComponents);

        // refresh tracked entities for global listeners and build cache by defKey
        this.trackedEntities.clear();
        this.entityCache.clear();
        for (const e of targets) {
            this.trackedEntities.set(e.id, e);
            const m = e.getComponent<AnimationStateMachineComponent>('anim-machine');
            if (m) {
                if (!this.entityCache.has(m.defKey)) this.entityCache.set(m.defKey, new Set());
                this.entityCache.get(m.defKey)!.add(e);
            }
        }

        // ensure global listeners are registered for any trigger-based transitions and cleanup unused
        this.ensureGlobalListeners();

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

    /**
     * Register global listeners for transitions that use `trigger` so the FSM reacts
     * when EventSystem emits matching events. Handlers search tracked entities that
     * have an active machine with the matching defKey.
     */
    private ensureGlobalListeners() {
        // compute needed triggers and trigger->defKey mapping
        const neededTriggers = new Set<string>();
        this.triggerToDefKeys.clear();

        for (const [key, def] of stateMachineRegistry.entries()) {
            for (const t of def.transitions) {
                if (!t.trigger) continue;
                neededTriggers.add(t.trigger);
                if (!this.triggerToDefKeys.has(t.trigger)) this.triggerToDefKeys.set(t.trigger, new Set());
                this.triggerToDefKeys.get(t.trigger)!.add(key);
            }
        }

        // remove handlers that are no longer needed
        for (const registered of Array.from(this.globalEventHandlers.keys())) {
            if (!neededTriggers.has(registered)) {
                const handler = this.globalEventHandlers.get(registered)!;
                this.eventSystem.off(registered as any, handler);
                this.globalEventHandlers.delete(registered);
                this.triggerToDefKeys.delete(registered);
            }
        }

        // add handlers for newly needed triggers
        for (const trigger of neededTriggers) {
            if (this.globalEventHandlers.has(trigger)) continue;

            const handler = (_ev: any) => {
                const defKeys = this.triggerToDefKeys.get(trigger);
                if (!defKeys) return;

                for (const defKey of defKeys) {
                    const entities = this.entityCache.get(defKey);
                    if (!entities) continue;

                    const def = stateMachineRegistry.get(defKey);
                    if (!def) continue;

                    for (const entity of entities) {
                        const machine = entity.getComponent<AnimationStateMachineComponent>('anim-machine');
                        if (!machine) continue;
                        if (machine.defKey !== defKey) continue;

                        // find any transition(s) that match this trigger and the current state
                        const matching = def.transitions.filter(t => t.trigger === trigger && (t.from === '*' || t.from === machine.currentState));
                        if (matching.length === 0) continue;

                        // choose highest priority
                        matching.sort((a, b) => (b.priority || 0) - (a.priority || 0));
                        const animComp = entity.getComponent<any>('animation');
                        this.applyTransition(entity, machine, animComp, def, matching[0] as AnimationTransition);
                    }
                }
            };

            this.eventSystem.on(trigger as any, handler);
            this.globalEventHandlers.set(trigger, handler);
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
