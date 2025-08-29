import { ScriptInstance, ScriptState } from './ScriptComponent';

export interface ScriptMetadata {
    className: string;
    constructor: ScriptConstructor;
    properties: PropertyMetadata[];
    version?: string;
    description?: string;
}

export type ScriptConstructor = new (...args: any[]) => ScriptInstance;

// Interface para type mappers más robusta
export interface TypeMapper {
    typeName: string;
    predicate: (value: any) => boolean;
    normalize: (value: any) => any;
    // Validador opcional
    validator?: (value: any) => boolean;
    // Deserializador para restaurar desde JSON
    deserialize?: (serialized: any) => any;
    // Prioridad para ordenar mappers
    priority?: number;
}

export class ScriptRegistry {
    private map = new Map<string, ScriptConstructor>();
    private metadata = new Map<string, ScriptMetadata>();
    private instanceStates = new Map<ScriptInstance, Map<string, any>>();

    // Array ordenado por prioridad
    private typeMappers: TypeMapper[] = [];

    // Cache para optimizar detección de tipos
    private typeCache = new Map<string, string>();

    constructor() {
        this.registerBuiltInTypeMappers();
    }

    /**
     * Registro con validación y metadatos opcionales
     */
    register(name: string, ctor: ScriptConstructor, options?: {
        version?: string;
        description?: string;
        skipMetadataExtraction?: boolean;
    }): void {
        if (this.map.has(name)) {
            console.warn(`⚠️ Script ${name} ya está registrado. Sobrescribiendo...`);
        }

        this.map.set(name, ctor);

        // Skip metadata extraction if requested (for performance in some cases)
        if (options?.skipMetadataExtraction) {
            return;
        }

        try {
            const tempInstance = new ctor();
            const properties = this.extractPublicProperties(tempInstance);

            this.metadata.set(name, {
                className: name,
                constructor: ctor,
                properties,
                version: options?.version,
                description: options?.description
            });

            console.log(`📝 Script ${name} registrado con ${properties.length} propiedades`);
            if (properties.length > 0) {
                console.log(`   Propiedades: ${properties.map(p => `${p.name}(${p.type})`).join(', ')}`);
            }
        } catch (err) {
            console.warn(`⚠️ No se pudieron extraer metadatos para ${name}:`, err);
        }
    }

    /**
     * Registro de type mapper con prioridad y validación
     */
    registerTypeMapper(mapper: TypeMapper | {
        typeName: string;
        predicate: (v: any) => boolean;
        normalize: (v: any) => any;
        validator?: (v: any) => boolean;
        deserialize?: (serialized: any) => any;
        priority?: number;
    }): void {
        const fullMapper: TypeMapper = {
            priority: 0,
            ...mapper
        };

        // Validar que el mapper es válido
        if (!fullMapper.typeName || !fullMapper.predicate || !fullMapper.normalize) {
            throw new Error('TypeMapper debe tener typeName, predicate y normalize');
        }

        this.typeMappers.push(fullMapper);

        // Ordenar por prioridad (mayor prioridad primero)
        this.typeMappers.sort((a, b) => (b.priority || 0) - (a.priority || 0));

        // Limpiar cache al agregar nuevos mappers
        this.typeCache.clear();

        console.log(`🔧 Type mapper '${fullMapper.typeName}' registrado (prioridad: ${fullMapper.priority || 0})`);
    }

    /**
     * Registra mappers built-in con mejor organización
     */
    private registerBuiltInTypeMappers(): void {
        // Vector mapper
        this.registerTypeMapper({
            typeName: 'vector',
            predicate: (v: any) => v && typeof v === 'object' &&
                typeof v.x === 'number' && typeof v.y === 'number' &&
                Object.keys(v).length <= 3, // x, y, y posiblemente z
            normalize: (v: any) => ({
                x: Number(v.x || 0),
                y: Number(v.y || 0),
                ...(typeof v.z === 'number' ? { z: Number(v.z) } : {})
            }),
            validator: (v: any) => typeof v.x === 'number' && typeof v.y === 'number',
            priority: 10
        });

        // Color mapper
        this.registerTypeMapper({
            typeName: 'color',
            predicate: (v: any) => v && typeof v === 'object' &&
                typeof v.r === 'number' && typeof v.g === 'number' && typeof v.b === 'number',
            normalize: (v: any) => ({
                r: Math.max(0, Math.min(255, Number(v.r || 0))),
                g: Math.max(0, Math.min(255, Number(v.g || 0))),
                b: Math.max(0, Math.min(255, Number(v.b || 0))),
                a: typeof v.a === 'number' ? Math.max(0, Math.min(1, Number(v.a))) : 1
            }),
            validator: (v: any) => v.r >= 0 && v.r <= 255 && v.g >= 0 && v.g <= 255 && v.b >= 0 && v.b <= 255,
            priority: 8
        });

        // PhysicsBody mapper (más complejo, menor prioridad)
        this.registerTypeMapper({
            typeName: 'physicsBody',
            predicate: (v: any) => v && typeof v === 'object' &&
                typeof v.width === 'number' && typeof v.height === 'number' &&
                v.position && typeof v.position.x === 'number' && typeof v.position.y === 'number',
            normalize: (v: any) => ({
                width: Math.max(0, Number(v.width || 0)),
                height: Math.max(0, Number(v.height || 0)),
                position: {
                    x: Number(v.position.x || 0),
                    y: Number(v.position.y || 0)
                },
                ...(typeof v.rotation === 'number' ? { rotation: Number(v.rotation) } : {}),
                ...(typeof v.mass === 'number' ? { mass: Math.max(0, Number(v.mass)) } : {})
            }),
            priority: 5
        });

        // Array mapper para arrays de tipos primitivos
        this.registerTypeMapper({
            typeName: 'array',
            predicate: (v: any) => Array.isArray(v),
            normalize: (v: any) => [...v], // shallow clone
            priority: 1
        });
    }

    create(name: string, ...args: any[]): ScriptInstance | null {
        const C = this.map.get(name);
        if (!C) return null;

        const instance = new C(...args);
        return this.enhanceInstance(name, instance);
    }

    has(name: string): boolean {
        return this.map.has(name);
    }

    /**
     * Extracción con cache y mejor detección
     */
    private extractPublicProperties(instance: any): PropertyMetadata[] {
        const properties: PropertyMetadata[] = [];
        const allKeys = Object.getOwnPropertyNames(instance);

        for (const key of allKeys) {
            const value = instance[key];

            // Excluir métodos, propiedades privadas y especiales
            if (typeof value !== 'function' &&
                !key.startsWith('_') &&
                key !== 'entity' &&
                key !== 'constructor') {

                const { type, normalizedValue } = this.detectAndNormalizeType(value);

                properties.push({
                    name: key,
                    initialValue: normalizedValue,
                    type: type
                });
            }
        }

        return properties;
    }

    /**
     * Método separado para detección y normalización de tipos
     */
    private detectAndNormalizeType(value: any): { type: string, normalizedValue: any } {
        // Cache key para optimización
        const cacheKey = this.generateCacheKey(value);
        const cachedType = this.typeCache.get(cacheKey);

        // Intentar usar cache para tipos primitivos
        if (cachedType && (typeof value !== 'object' || value === null)) {
            return { type: cachedType, normalizedValue: value };
        }

        // Probar mappers registrados (ya ordenados por prioridad)
        for (const mapper of this.typeMappers) {
            try {
                if (mapper.predicate(value)) {
                    const normalized = mapper.normalize(value);

                    // Validar si hay validator
                    if (mapper.validator && !mapper.validator(normalized)) {
                        console.warn(`⚠️ Valor normalizado no pasa validación para tipo ${mapper.typeName}:`, normalized);
                        continue;
                    }

                    // Cache result para tipos primitivos
                    if (typeof value !== 'object' || value === null) {
                        this.typeCache.set(cacheKey, mapper.typeName);
                    }

                    return { type: mapper.typeName, normalizedValue: normalized };
                }
            } catch (err) {
                console.warn(`⚠️ Error en mapper ${mapper.typeName}:`, err);
            }
        }

        // Fallback a tipo básico
        const basicType = typeof value;
        const normalizedValue = this.deepClone(value);

        if (typeof value !== 'object' || value === null) {
            this.typeCache.set(cacheKey, basicType);
        }

        return { type: basicType, normalizedValue };
    }

    /**
     * Genera clave de cache para tipos
     */
    private generateCacheKey(value: any): string {
        if (value === null) return 'null';
        if (typeof value !== 'object') return `${typeof value}:${value}`;

        // Para objetos, usar una representación simple
        if (Array.isArray(value)) return `array:${value.length}`;
        return `object:${Object.keys(value).sort().join(',')}`;
    }

    /**
     * Deserialización inteligente usando mappers
     */
    private smartDeserialize(value: any, expectedType: string): any {
        // Buscar mapper específico para este tipo
        const mapper = this.typeMappers.find(m => m.typeName === expectedType);

        if (mapper && mapper.deserialize) {
            try {
                return mapper.deserialize(value);
            } catch (err) {
                console.warn(`⚠️ Error deserializando ${expectedType}:`, err);
            }
        }

        // Fallback a clonación
        return this.deepClone(value);
    }

    private enhanceInstance(scriptName: string, instance: ScriptInstance): ScriptInstance {
        const metadata = this.metadata.get(scriptName);
        if (!metadata) {
            return instance;
        }

        const stateMap = new Map<string, any>();
        metadata.properties.forEach(prop => {
            stateMap.set(prop.name, this.deepClone(prop.initialValue));
        });
        this.instanceStates.set(instance, stateMap);

        const proxy = new Proxy(instance, {
            get: (target, prop: string) => {
                if (stateMap.has(prop)) {
                    return stateMap.get(prop);
                }
                return target[prop as keyof ScriptInstance];
            },

            set: (target, prop: string, value) => {
                if (stateMap.has(prop)) {
                    // ✨ NUEVO: Validación antes de asignar
                    const propertyMetadata = metadata.properties.find(p => p.name === prop);
                    if (propertyMetadata?.validator && !propertyMetadata.validator(value)) {
                        console.warn(`⚠️ Valor inválido para ${prop} en ${scriptName}:`, value);
                        return false;
                    }
                    stateMap.set(prop, value);
                    return true;
                }
                (target as any)[prop] = value;
                return true;
            }
        });

        // Métodos de gestión de estado
        proxy.getAllProperties = () => {
            const result: ScriptState = {};
            stateMap.forEach((value, key) => {
                result[key] = this.deepClone(value);
            });
            return result;
        };

        proxy.setAllProperties = (state: ScriptState) => {
            for (const [key, value] of Object.entries(state)) {
                if (stateMap.has(key)) {
                    // ✨ NUEVO: Usar deserialización inteligente
                    const propMetadata = metadata.properties.find(p => p.name === key);
                    const deserializedValue = propMetadata ?
                        this.smartDeserialize(value, propMetadata.type) :
                        this.deepClone(value);

                    stateMap.set(key, deserializedValue);
                }
            }
        };

        proxy.getProperty = (name: string) => {
            if (!stateMap.has(name)) {
                throw new Error(`Propiedad ${name} no existe en ${scriptName}`);
            }
            return stateMap.get(name);
        };

        proxy.setProperty = (name: string, value: any) => {
            if (!stateMap.has(name)) {
                throw new Error(`Propiedad ${name} no existe en ${scriptName}`);
            }
            stateMap.set(name, value);
        };

        return proxy;
    }

    // MÉTODOS DE UTILIDAD

    /**
     * Valida que un objeto de estado sea compatible con un script
     */
    validateState(scriptName: string, state: ScriptState): { valid: boolean, errors: string[] } {
        const metadata = this.metadata.get(scriptName);
        if (!metadata) {
            return { valid: false, errors: [`Script ${scriptName} no encontrado`] };
        }

        const errors: string[] = [];

        for (const [key, value] of Object.entries(state)) {
            const prop = metadata.properties.find(p => p.name === key);
            if (!prop) {
                errors.push(`Propiedad desconocida: ${key}`);
                continue;
            }

            if (prop.validator && !prop.validator(value)) {
                errors.push(`Valor inválido para ${key}: ${value}`);
            }
        }

        return { valid: errors.length === 0, errors };
    }

    /**
     * Obtiene estadísticas del registry
     */
    getStats() {
        return {
            scriptsRegistered: this.map.size,
            typeMappersRegistered: this.typeMappers.length,
            activeInstances: this.instanceStates.size,
            cacheSize: this.typeCache.size
        };
    }

    /**
     * Limpia caches para liberar memoria
     */
    clearCaches(): void {
        this.typeCache.clear();
        console.log('🧹 Caches limpiados');
    }

    getScriptMetadata(name: string): ScriptMetadata | undefined {
        return this.metadata.get(name);
    }

    getRegisteredScripts(): string[] {
        return Array.from(this.map.keys());
    }

    getScriptProperties(name: string): PropertyMetadata[] {
        return this.metadata.get(name)?.properties || [];
    }

    cleanupInstance(instance: ScriptInstance): void {
        this.instanceStates.delete(instance);
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
}

export const scriptRegistry = new ScriptRegistry();