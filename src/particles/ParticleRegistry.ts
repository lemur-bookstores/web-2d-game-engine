export type LayerResolver = (name: string) => number | undefined;

export class ParticleRegistry {
    private static instance: ParticleRegistry;
    private layerResolver?: LayerResolver;

    private constructor() { }

    static getInstance(): ParticleRegistry {
        if (!ParticleRegistry.instance) ParticleRegistry.instance = new ParticleRegistry();
        return ParticleRegistry.instance;
    }

    setLayerResolver(resolver: LayerResolver | undefined) {
        this.layerResolver = resolver;
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
