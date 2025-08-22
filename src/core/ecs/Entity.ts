export class Entity {
    private components: Map<string, any>;
    private id: string;

    constructor() {
        this.components = new Map();
        this.id = crypto.randomUUID();
    }

    public addComponent<T>(name: string, component: T): void {
        this.components.set(name, component);
    }

    public getComponent<T>(name: string): T | undefined {
        return this.components.get(name);
    }

    public hasComponent(name: string): boolean {
        return this.components.has(name);
    }

    public removeComponent(name: string): void {
        this.components.delete(name);
    }

    public getId(): string {
        return this.id;
    }
}
