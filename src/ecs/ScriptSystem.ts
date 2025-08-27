import { System } from '../core/GameLoop';
import { ScriptComponent } from './ScriptComponent';
import { scriptRegistry } from './ScriptRegistry';

export class ScriptSystem implements System {
    requiredComponents = ['script'];

    initialize?(): void {
        // no-op for now
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
        // Not tracked centrally; instances should be cleaned when entities/components are removed
    }
}
