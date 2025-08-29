import { LightConstructor, LightMetadata, LightInstance, LightState } from "./LightComponent";

export class LightRegistry {
    private lightTypes = new Map<string, LightConstructor>();
    private metadata = new Map<string, LightMetadata>();
    private instanceStates = new Map<LightInstance, Map<string, any>>();
    // Optional resolver to map layer names to bitmasks (provided by Scene or caller)
    private layerResolver?: (name: string) => number | undefined;

    // Type mappers específicos para iluminación
    private typeMappers: Array<{
        typeName: string;
        predicate: (v: any) => boolean;
        normalize: (v: any) => any;
    }> = [];

    constructor() {
        this.registerBuiltInTypeMappers();
    }

    /**
     * Registra un tipo de luz
     */
    register(lightType: string, constructor: LightConstructor, options?: {
        description?: string;
        category?: 'basic' | 'advanced' | 'effect';
    }): void {
        this.lightTypes.set(lightType, constructor);

        try {
            const tempInstance = new constructor();
            const properties = this.extractLightProperties(tempInstance);

            this.metadata.set(lightType, {
                lightType,
                constructor,
                properties,
                description: options?.description,
                category: options?.category || 'basic'
            });

            console.log(`💡 Luz ${lightType} registrada con ${properties.length} propiedades`);
        } catch (err) {
            console.warn(`⚠️ Error extrayendo metadatos de ${lightType}:`, err);
        }
    }

    /**
     * Crea una instancia de luz
     */
    create(lightType: string, ...args: any[]): LightInstance | null {
        const Constructor = this.lightTypes.get(lightType);
        if (!Constructor) return null;

        const instance = new Constructor(...args);
        return this.enhanceLightInstance(lightType, instance);
    }

    /**
     * Verifica si un tipo de luz está registrado
     */
    has(lightType: string): boolean {
        return this.lightTypes.has(lightType);
    }

    /**
     * Registra type mappers específicos para iluminación
     */
    registerTypeMapper(typeName: string, predicate: (v: any) => boolean, normalize: (v: any) => any): void {
        this.typeMappers.push({ typeName, predicate, normalize });
    }

    /**
     * Registra type mappers built-in
     */
    private registerBuiltInTypeMappers(): void {
        // Vector2D mapper
        this.registerTypeMapper('vector2d',
            (v) => v && typeof v.x === 'number' && typeof v.y === 'number',
            (v) => ({ x: Number(v.x || 0), y: Number(v.y || 0) })
        );

        // Color mapper
        this.registerTypeMapper('color',
            (v) => v && typeof v.r === 'number' && typeof v.g === 'number' && typeof v.b === 'number',
            (v) => ({
                r: Math.max(0, Math.min(255, Number(v.r || 255))),
                g: Math.max(0, Math.min(255, Number(v.g || 255))),
                b: Math.max(0, Math.min(255, Number(v.b || 255))),
                a: typeof v.a === 'number' ? Math.max(0, Math.min(1, Number(v.a))) : 1
            })
        );

        // Attenuation mapper (para luces con degradación)
        this.registerTypeMapper('attenuation',
            (v) => v && typeof v.constant === 'number' && typeof v.linear === 'number' && typeof v.quadratic === 'number',
            (v) => ({
                constant: Math.max(0, Number(v.constant || 1)),
                linear: Math.max(0, Number(v.linear || 0.09)),
                quadratic: Math.max(0, Number(v.quadratic || 0.032))
            })
        );
    }

    /**
     * Extrae propiedades de una instancia de luz
     */
    private extractLightProperties(instance: any): PropertyMetadata[] {
        const properties: PropertyMetadata[] = [];
        const allKeys = Object.getOwnPropertyNames(instance);

        for (const key of allKeys) {
            const value = instance[key];

            if (typeof value !== 'function' &&
                !key.startsWith('_') &&
                key !== 'entity' &&
                key !== 'constructor' &&
                key !== 'id') {

                const { type, normalizedValue } = this.detectLightPropertyType(value);

                properties.push({
                    name: key,
                    initialValue: normalizedValue,
                    type,
                    description: this.getPropertyDescription(key)
                });
            }
        }

        return properties;
    }

    /**
     * Detecta el tipo de una propiedad de luz
     */
    private detectLightPropertyType(value: any): { type: string, normalizedValue: any } {
        // Probar mappers registrados
        for (const mapper of this.typeMappers) {
            try {
                if (mapper.predicate(value)) {
                    return {
                        type: mapper.typeName,
                        normalizedValue: mapper.normalize(value)
                    };
                }
            } catch (err) {
                // Ignorar errores de mappers
            }
        }

        // Fallback a tipo básico
        return {
            type: typeof value,
            normalizedValue: this.deepClone(value)
        };
    }

    /**
     * Obtiene descripción automática de propiedades comunes
     */
    private getPropertyDescription(propertyName: string): string {
        const descriptions: Record<string, string> = {
            'position': 'Posición de la luz en el mundo',
            'color': 'Color de la luz (RGB)',
            'intensity': 'Intensidad de la luz (0-1)',
            'radius': 'Radio de influencia de la luz',
            'enabled': 'Si la luz está activa',
            'castShadows': 'Si la luz proyecta sombras',
            'attenuation': 'Configuración de degradación de la luz',
            'angle': 'Ángulo de la luz (para spotlights)',
            'outerAngle': 'Ángulo exterior (para spotlights)',
            'direction': 'Dirección de la luz'
        };

        return descriptions[propertyName] || '';
    }

    /**
     * Mejora una instancia de luz con gestión de estado
     */
    private enhanceLightInstance(lightType: string, instance: LightInstance): LightInstance {
        const metadata = this.metadata.get(lightType);
        if (!metadata) return instance;

        // Crear mapa de estado
        const stateMap = new Map<string, any>();
        metadata.properties.forEach(prop => {
            stateMap.set(prop.name, this.deepClone(prop.initialValue));
        });
        this.instanceStates.set(instance, stateMap);

        // Crear proxy para gestión de estado
        const proxy = new Proxy(instance, {
            get: (target, prop: string) => {
                if (stateMap.has(prop)) {
                    return stateMap.get(prop);
                }
                return target[prop as keyof LightInstance];
            },

            set: (target, prop: string, value) => {
                if (stateMap.has(prop)) {
                    // Validaciones específicas para luces
                    const validatedValue = this.validateLightProperty(prop, value);
                    stateMap.set(prop, validatedValue);
                    return true;
                }
                (target as any)[prop] = value;
                return true;
            }
        });

        // Agregar métodos de gestión de estado
        proxy.getAllProperties = () => {
            const result: LightState = {};
            stateMap.forEach((value, key) => {
                result[key] = this.deepClone(value);
            });
            return result;
        };

        proxy.setAllProperties = (state: LightState) => {
            for (const [key, value] of Object.entries(state)) {
                if (stateMap.has(key)) {
                    let finalValue = value;

                    // Normalizar destino de layer si corresponde
                    if (key === 'layer' || key === 'layerMask') {
                        const normalized = this.normalizeLayerTarget(state['layer'] ?? state['layerMask']);
                        if (normalized.layer !== undefined && stateMap.has('layer')) stateMap.set('layer', normalized.layer);
                        if (normalized.layerMask !== undefined && stateMap.has('layerMask')) stateMap.set('layerMask', normalized.layerMask);
                        continue; // already applied
                    }

                    const validatedValue = this.validateLightProperty(key, finalValue);
                    stateMap.set(key, this.deepClone(validatedValue));
                }
            }
        };

        proxy.getProperty = (name: string) => {
            if (!stateMap.has(name)) {
                throw new Error(`Propiedad ${name} no existe en luz ${lightType}`);
            }
            return stateMap.get(name);
        };

        proxy.setProperty = (name: string, value: any) => {
            if (!stateMap.has(name)) {
                throw new Error(`Propiedad ${name} no existe en luz ${lightType}`);
            }
            // If setting a layer-related property, normalize and apply both forms when possible
            if (name === 'layer' || name === 'layerMask') {
                const normalized = this.normalizeLayerTarget(name === 'layer' ? value : stateMap.get('layer') ?? value);
                if (normalized.layer !== undefined && stateMap.has('layer')) stateMap.set('layer', normalized.layer);
                if (normalized.layerMask !== undefined && stateMap.has('layerMask')) stateMap.set('layerMask', normalized.layerMask);
                return;
            }

            const validatedValue = this.validateLightProperty(name, value);
            stateMap.set(name, validatedValue);
        };

        return proxy;
    }

    /**
     * Valida propiedades específicas de iluminación
     */
    private validateLightProperty(propertyName: string, value: any): any {
        switch (propertyName) {
            case 'intensity':
                return Math.max(0, Math.min(10, Number(value) || 0));
            case 'radius':
                return Math.max(0, Number(value) || 0);
            case 'angle':
            case 'outerAngle':
                return Math.max(0, Math.min(360, Number(value) || 0));
            case 'enabled':
            case 'castShadows':
                return Boolean(value);
            default:
                return value;
        }
    }

    // Métodos de utilidad
    getLightMetadata(lightType: string): LightMetadata | undefined {
        return this.metadata.get(lightType);
    }

    getRegisteredLightTypes(): string[] {
        return Array.from(this.lightTypes.keys());
    }

    getLightProperties(lightType: string): PropertyMetadata[] {
        return this.metadata.get(lightType)?.properties || [];
    }

    cleanupLightInstance(instance: LightInstance): void {
        this.instanceStates.delete(instance);
    }

    /**
     * Normaliza un objetivo de layer proporcionado por el usuario.
     * Acepta:
     * - string: nombre de layer -> returns { layer: string }
     * - number: bitmask -> returns { layerMask: number }
     * - array of strings -> returns { layerMask: number } (caller must map names to bits)
     */
    normalizeLayerTarget(target: any): { layer?: string, layerMask?: number } {
        if (target === undefined || target === null) return {};
        // String: prefer to resolve to both name and mask when resolver exists
        if (typeof target === 'string') {
            const name = target;
            const bit = this.layerResolver ? this.layerResolver(name) : undefined;
            return bit !== undefined ? { layer: name, layerMask: bit } : { layer: name };
        }
        // Number: direct bitmask
        if (typeof target === 'number') return { layerMask: target };
        // Array: could be array of names or numbers
        if (Array.isArray(target)) {
            const nums = target.filter(t => typeof t === 'number') as number[];
            const strs = target.filter(t => typeof t === 'string') as string[];

            // Combine numeric masks
            let mask = 0;
            if (nums.length > 0) mask = nums.reduce((a, b) => a | b, 0);

            if (strs.length > 0) {
                // If we have a resolver, resolve names and combine
                if (this.layerResolver) {
                    const nameMask = strs.reduce((acc, n) => {
                        const b = this.layerResolver!(n);
                        return acc | (b ?? 0);
                    }, 0);
                    mask = mask | nameMask;
                    return { layerMask: mask };
                }

                // No resolver: if we already had numeric masks, return them; otherwise fallback to first name
                if (mask !== 0) return { layerMask: mask };
                return { layer: strs[0] };
            }

            if (mask !== 0) return { layerMask: mask };
        }
        // If object with name/bit fields
        if (typeof target === 'object') {
            if ('bit' in target && typeof target.bit === 'number') {
                return { layerMask: target.bit };
            }
            if ('name' in target && typeof target.name === 'string') {
                const name = target.name;
                const bit = this.layerResolver ? this.layerResolver(name) : undefined;
                return bit !== undefined ? { layer: name, layerMask: bit } : { layer: name };
            }
        }
        // fallback try to coerce
        const asNum = Number(target);
        if (!Number.isNaN(asNum)) return { layerMask: asNum };
        return { layer: String(target) };
    }

    private deepClone(obj: any): any {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        if (typeof obj === 'object') {
            const cloned: any = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    cloned[key] = this.deepClone(obj[key]);
                }
            }
            return cloned;
        }
        return obj;
    }

    /**
     * Permite registrar un resolver externo para convertir nombres de layer a bitmasks.
     * Ejemplo: lightRegistry.setLayerResolver(name => scene.getLayer(name)?.bit)
     */
    setLayerResolver(resolver: (name: string) => number | undefined): void {
        this.layerResolver = resolver;
    }
}