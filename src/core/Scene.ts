import { EventSystem } from './EventSystem';
import { EntityId } from '../types';
import { Entity } from '@/ecs';
import { SCENE_EVENTS } from '@/types/event-const';

/**
 * Scene class for organizing and managing game entities
 */
export class Scene {
    public readonly name: string;
    public active: boolean = false;

    private entities = new Map<EntityId, any>();
    private eventSystem: EventSystem;
    private initialized = false;

    constructor(name: string) {
        this.name = name;
        this.eventSystem = EventSystem.getInstance();
    }

    /**
     * Initialize the scene
     */
    initialize(): void {
        if (this.initialized) {
            console.warn(`Scene '${this.name}' is already initialized`);
            return;
        }

        this.initialized = true;
        this.eventSystem.emit(SCENE_EVENTS.INITIALIZE, { scene: this });
    }

    /**
     * Activate the scene
     */
    activate(): void {
        this.active = true;
        this.eventSystem.emit(SCENE_EVENTS.ACTIVATE, { scene: this });
    }

    /**
     * Deactivate the scene
     */
    deactivate(): void {
        this.active = false;
        this.eventSystem.emit(SCENE_EVENTS.DEACTIVATE, { scene: this });
    }

    /**
     * Add an entity to the scene
     */
    addEntity(entity: Entity): void {
        if (!entity || !entity.id) {
            throw new Error('Entity must have a valid id');
        }

        if (this.entities.has(entity.id)) {
            console.warn(`Entity with id '${entity.id}' already exists in scene '${this.name}'`);
            return;
        }

        this.entities.set(entity.id, entity);
        this.eventSystem.emit(SCENE_EVENTS.ENTITY_ADDED, {
            scene: this,
            entity,
            entityId: entity.id
        });
    }

    /**
     * Remove an entity from the scene
     */
    removeEntity(entityId: EntityId): boolean {
        const entity = this.entities.get(entityId);
        if (!entity) {
            return false;
        }

        this.entities.delete(entityId);
        this.eventSystem.emit(SCENE_EVENTS.ENTITY_REMOVED, {
            scene: this,
            entity,
            entityId
        });

        return true;
    }

    /**
     * Get an entity by its ID
     */
    getEntity(entityId: EntityId): any | undefined {
        return this.entities.get(entityId);
    }

    /**
     * Get all entities in the scene
     */
    getEntities(): any[] {
        return Array.from(this.entities.values());
    }

    /**
     * Get all active entities in the scene
     */
    getActiveEntities(): any[] {
        return this.getEntities().filter(entity => entity.active !== false);
    }

    /**
     * Check if an entity exists in the scene
     */
    hasEntity(entityId: EntityId): boolean {
        return this.entities.has(entityId);
    }

    /**
     * Get the number of entities in the scene
     */
    getEntityCount(): number {
        return this.entities.size;
    }

    /**
     * Get the number of active entities in the scene
     */
    getActiveEntityCount(): number {
        return this.getActiveEntities().length;
    }

    /**
     * Find entities by a predicate function
     */
    findEntities(predicate: (entity: any) => boolean): any[] {
        return this.getEntities().filter(predicate);
    }

    /**
     * Find the first entity that matches a predicate
     */
    findEntity(predicate: (entity: any) => boolean): any | undefined {
        return this.getEntities().find(predicate);
    }

    /**
     * Find entities by component type
     */
    findEntitiesWithComponent(componentType: string): any[] {
        return this.getEntities().filter(entity =>
            entity.hasComponent && entity.hasComponent(componentType)
        );
    }

    /**
     * Find entities with multiple components
     */
    findEntitiesWithComponents(componentTypes: string[]): any[] {
        return this.getEntities().filter(entity => {
            if (!entity.hasComponent) return false;
            return componentTypes.every(type => entity.hasComponent(type));
        });
    }

    /**
     * Clear all entities from the scene
     */
    clear(): void {
        const entityIds = Array.from(this.entities.keys());

        for (const entityId of entityIds) {
            this.removeEntity(entityId);
        }

        this.eventSystem.emit(SCENE_EVENTS.CLEARED, { scene: this });
    }

    /**
     * Update the scene (called by the game loop)
     */
    update(deltaTime: number): void {
        if (!this.active) return;

        this.eventSystem.emit(SCENE_EVENTS.UPDATE, {
            scene: this,
            deltaTime,
            entities: this.getActiveEntities()
        });
    }

    /**
     * Called when the scene is entered/becomes active
     */
    onEnter(): void {
        this.activate();
        this.eventSystem.emit(SCENE_EVENTS.ENTER, { scene: this });
    }

    /**
     * Called when the scene is exited/becomes inactive
     */
    onExit(): void {
        this.deactivate();
        this.eventSystem.emit(SCENE_EVENTS.EXIT, { scene: this });
    }

    /**
     * Destroy the scene and clean up resources
     */
    destroy(): void {
        this.clear();
        this.deactivate();
        this.initialized = false;

        this.eventSystem.emit(SCENE_EVENTS.DESTROY, { scene: this });
    }

    /**
     * Get scene debug information
     */
    getDebugInfo(): {
        name: string;
        active: boolean;
        initialized: boolean;
        entityCount: number;
        activeEntityCount: number;
    } {
        return {
            name: this.name,
            active: this.active,
            initialized: this.initialized,
            entityCount: this.getEntityCount(),
            activeEntityCount: this.getActiveEntityCount()
        };
    }

    /**
     * Serialize the scene to JSON (basic implementation)
     */
    toJSON(): any {
        return {
            name: this.name,
            active: this.active,
            entities: this.getEntities().map(entity => ({
                id: entity.id,
                // Additional entity serialization would go here
            }))
        };
    }

    /**
     * Create a scene from JSON data (basic implementation)
     */
    static fromJSON(data: any): Scene {
        const scene = new Scene(data.name);
        scene.active = data.active || false;

        // Entity deserialization would go here

        return scene;
    }
}
