export type LayerResolver = (name: string) => number | undefined;

export class ParticleRegistry {
    private static instance: ParticleRegistry;
    private layerResolver?: LayerResolver;
    private typeMappers: Array<{ typeName: string; predicate: (v: any) => boolean; normalize: (v: any) => any }> = [];
    private particleTypes = new Map<string, any>();
    private metadata = new Map<string, any>();

    private constructor() { }

    private registerBuiltInTypeMappers() {
        // vector2d
        this.registerTypeMapper('vector2d',
            (v) => v && typeof v.x === 'number' && typeof v.y === 'number',
            (v) => ({ x: Number(v.x || 0), y: Number(v.y || 0) })
        );

        // color
        this.registerTypeMapper('color',
            (v) => v && typeof v.r === 'number' && typeof v.g === 'number' && typeof v.b === 'number',
            (v) => ({
                r: Math.max(0, Math.min(255, Number(v.r || 255))),
                g: Math.max(0, Math.min(255, Number(v.g || 255))),
                b: Math.max(0, Math.min(255, Number(v.b || 255))),
                a: typeof v.a === 'number' ? Math.max(0, Math.min(1, Number(v.a))) : 1
            })
        );
    }

    static getInstance(): ParticleRegistry {
        if (!ParticleRegistry.instance) {
            ParticleRegistry.instance = new ParticleRegistry();
            ParticleRegistry.instance.registerBuiltInTypeMappers();
        }
        return ParticleRegistry.instance;
    }

    setLayerResolver(resolver: LayerResolver | undefined) {
        this.layerResolver = resolver;
    }

    registerParticleType(typeName: string, ctor: any, opts?: { description?: string }) {
        this.particleTypes.set(typeName, ctor);
        try {
            const inst = new ctor();
            const props: any[] = [];
            for (const key of Object.keys(inst)) {
                if (typeof (inst as any)[key] !== 'function' && !key.startsWith('_')) {
                    const normalized = this.normalizeValue((inst as any)[key]);
                    props.push({ name: key, type: normalized.type, initialValue: normalized.value });
                }
            }
            this.metadata.set(typeName, { typeName, description: opts?.description || '', properties: props });
        } catch (err) {
            // ignore
        }
    }

    getRegisteredParticleTypes(): string[] {
        return Array.from(this.particleTypes.keys());
    }

    getParticleMetadata(typeName: string): any | undefined {
        return this.metadata.get(typeName);
    }

    createDefaultParticle(typeName: string): any | null {
        const ctor = this.particleTypes.get(typeName);
        if (!ctor) return null;
        const inst = new ctor();
        // normalize fields
        for (const key of Object.keys(inst)) {
            const norm = this.normalizeValue((inst as any)[key]);
            (inst as any)[key] = norm.value;
        }
        return inst;
    }

    // Simple serializer for an emitter component (POJO safe)
    serializeEmitter(component: any): any {
        // shallow clone primitives/objects
        const out: any = {};
        for (const k of Object.keys(component)) {
            const v = (component as any)[k];
            if (v === null || typeof v !== 'object') out[k] = v;
            else out[k] = JSON.parse(JSON.stringify(v));
        }
        return out;
    }

    deserializeEmitter(data: any): any {
        // basic passthrough; in future map types
        return JSON.parse(JSON.stringify(data));
    }

    registerTypeMapper(typeName: string, predicate: (v: any) => boolean, normalize: (v: any) => any) {
        this.typeMappers.push({ typeName, predicate, normalize });
    }

    getRegisteredTypeNames(): string[] {
        return this.typeMappers.map(m => m.typeName);
    }

    normalizeValue(v: any): { type: string; value: any } {
        for (const m of this.typeMappers) {
            try {
                if (m.predicate(v)) return { type: m.typeName, value: m.normalize(v) };
            } catch (err) {
                // ignore
            }
        }
        return { type: typeof v, value: v };
    }

    normalizeLayerTarget(target: any): { layer?: string; layerMask?: number } {
        if (target == null) return {};
        // number
        if (typeof target === 'number') return { layerMask: target };
        // string
        if (typeof target === 'string') {
            const mask = this.layerResolver ? this.layerResolver(target) : undefined;
            return { layer: target, layerMask: mask ?? 0 };
        }
        // array -> combine
        if (Array.isArray(target)) {
            let mask = 0;
            let layer: string | undefined;
            for (const t of target) {
                if (typeof t === 'number') mask |= t;
                else if (typeof t === 'string') {
                    layer = layer ?? t;
                    const m = this.layerResolver ? this.layerResolver(t) : undefined;
                    if (m) mask |= m;
                }
            }
            return { layer, layerMask: mask };
        }
        // object with name or bit
        if (typeof target === 'object') {
            const { name, bit } = target as any;
            if (typeof bit === 'number') return { layerMask: bit };
            if (typeof name === 'string') {
                const m = this.layerResolver ? this.layerResolver(name) : undefined;
                return { layer: name, layerMask: m ?? 0 };
            }
        }
        return {};
    }
}
