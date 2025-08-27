import { System } from '../core/GameLoop';
import { ScriptComponent } from './ScriptComponent';
import { scriptRegistry } from './ScriptRegistry';
import { EventSystem } from '../core/EventSystem';
import { SCENE_EVENTS, WORLD_EVENTS } from '../types/event-const';

export class ScriptSystem implements System {
    requiredComponents = ['script'];
    private eventSystem = EventSystem.getInstance();
    private boundEntityRemoved = (event: any) => {
        const entity = event.data?.entity;
        if (!entity) return;
        const sc = entity.getComponent('script') as ScriptComponent;
        if (!sc || !sc.instance) return;
        try {
            // Persist runtime state if supported
            if (sc.instance.toJSON) {
                try { sc.state = sc.instance.toJSON(); } catch (_) { /* ignore */ }
            }
            sc.instance.destroy?.();
        } catch (err) {
            console.error('Error destroying script instance', err);
        }
        sc.instance = undefined;
    };

    initialize?(): void {
        // Register for entity removal events to cleanup script instances
        try {
            this.eventSystem.on(SCENE_EVENTS.ENTITY_REMOVED, this.boundEntityRemoved);
            this.eventSystem.on(WORLD_EVENTS.ENTITY_DESTROYED, this.boundEntityRemoved);
        } catch (err) {
            // event constants may not be available in some contexts; swallow
        }
    }

    update(entities: any[], dt: number): void {
        for (const e of entities) {
            const sc = e.getComponent('script') as ScriptComponent;
            if (!sc) continue;

            // If we have a name but no instance, create it
            if (!sc.instance && sc.scriptName) {
                const inst = scriptRegistry.create(sc.scriptName, e);
                if (inst) {
                    inst.entity = e;
                    // restore state if available
                    if (sc.state && inst.fromJSON) {
                        try { inst.fromJSON(sc.state); } catch (err) { /* ignore malformed state */ }
                    }
                    sc.instance = inst;
                    try { inst.init?.(); } catch (err) { console.error('Script init error', err); }
                }
            }

            try {
                sc.instance?.update?.(dt);
            } catch (err) {
                console.error('Script update error', err);
            }
        }
    }

    destroy(): void {
        // Remove listeners
        try {
            this.eventSystem.off(SCENE_EVENTS.ENTITY_REMOVED, this.boundEntityRemoved);
            this.eventSystem.off(WORLD_EVENTS.ENTITY_DESTROYED, this.boundEntityRemoved);
        } catch (err) {
            // ignore
        }
    }
}
