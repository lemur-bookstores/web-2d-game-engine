import { Entity } from './Entity';

export abstract class System {
    protected entities: Set<Entity>;
    private componentTypes: string[];

    constructor(componentTypes: string[]) {
        this.entities = new Set();
        this.componentTypes = componentTypes;
    }

    public onEntityAdded(entity: Entity): void {
        if (this.matchesRequirements(entity)) {
            this.entities.add(entity);
        }
    }

    public onEntityRemoved(entity: Entity): void {
        this.entities.delete(entity);
    }

    private matchesRequirements(entity: Entity): boolean {
        return this.componentTypes.every(type => entity.hasComponent(type));
    }

    public abstract update(deltaTime: number): void;
}
