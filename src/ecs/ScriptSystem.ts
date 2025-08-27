import { System } from '../core/GameLoop';
import { ScriptComponent } from './ScriptComponent';
import { scriptRegistry } from './ScriptRegistry';
import { EventSystem } from '../core/EventSystem';
import { SCENE_EVENTS, WORLD_EVENTS } from '../types/event-const';
import { Entity } from './Entity';

export class ScriptSystem implements System {
    requiredComponents = ['script'];
    private eventSystem = EventSystem.getInstance();

    private boundEntityRemoved = (event: any) => {
        const entity = event.data?.entity as Entity;
        if (!entity) return;
        const sc = entity.getComponent<ScriptComponent>('script');
        if (!sc) return;

        const destroyEntry = (entry: any) => {
            if (!entry || !entry.instance) return;
            try {
                // ✨ MEJORADO: Usar nuevos métodos si están disponibles
                if (entry.instance.getAllProperties) {
                    try {
                        entry.state = entry.instance.getAllProperties();
                    } catch (_) { /* ignore */ }
                }

                // Ejecutar destroy del script
                entry.instance.destroy?.();

                // ✨ NUEVO: Limpiar estado gestionado
                scriptRegistry.cleanupInstance(entry.instance);

            } catch (err) {
                console.error('Error destroying script instance', err);
            }
            entry.instance = undefined;
        };

        // legacy single instance
        if (sc.instance) destroyEntry(sc);
        // scripts array
        if (Array.isArray(sc.scripts)) {
            for (const entry of sc.scripts) destroyEntry(entry);
        }
    };

    initialize?(): void {
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

            // Helper mejorado para crear/restaurar/init/update una entrada de script
            const handleEntry = (entry: any) => {
                if (!entry) return;

                if (!entry.instance && entry.scriptName) {
                    let inst: any;
                    try {
                        inst = scriptRegistry.create(entry.scriptName, e);
                    } catch (err) {
                        console.error('Script create error', err);
                        return;
                    }

                    if (inst) {
                        inst.entity = e;

                        // ✨ MEJORADO: Usar nuevos métodos de gestión de estado
                        if (entry.state) {
                            if (inst.setAllProperties) {
                                try {
                                    inst.setAllProperties(entry.state);
                                } catch (err) {
                                    console.warn('Error setting script state:', err);
                                }
                            } else {
                                // Fallback a asignación directa para scripts legacy
                                try {
                                    Object.assign(inst, entry.state);
                                } catch (err) { /* ignore malformed state */ }
                            }
                        }

                        entry.instance = inst;
                        try {
                            inst.init?.();
                        } catch (err) {
                            console.error('Script init error', err);
                        }
                    }
                }

                try {
                    entry.instance?.update?.(dt);
                } catch (err) {
                    console.error('Script update error', err);
                }
            };

            // legacy single script fields
            if (sc.scriptName || sc.instance) {
                handleEntry(sc as any);
            }

            // multiple scripts support
            if (Array.isArray(sc.scripts)) {
                for (const entry of sc.scripts) handleEntry(entry);
            }
        }
    }

    destroy(): void {
        try {
            this.eventSystem.off(SCENE_EVENTS.ENTITY_REMOVED, this.boundEntityRemoved);
            this.eventSystem.off(WORLD_EVENTS.ENTITY_DESTROYED, this.boundEntityRemoved);
        } catch (err) {
            // ignore
        }
    }
}