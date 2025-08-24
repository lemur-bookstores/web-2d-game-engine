// Enum base para los prefijos de eventos
declare enum EventNames {
    WORLD = 'WORLD:',
    SCENE = 'SCENE:',
    INPUT = 'INPUT:',
    ENGINE = 'ENGINE:',
    GAMELOOP = 'GAMELOOP:',
    PHYSICS = 'PHYSICS:',
    ASSET = 'ASSET:',
    ANIMATION = 'ANIMATION:'
}

// Utility type para crear eventos tipados
declare type CreateEventType<T extends EventNames, K extends string> = `${T}${K}`;

// Definición de eventos por categoría
declare type AssetEvents = {
    LOAD: CreateEventType<EventNames.ASSET, 'LOAD'>,
    UNLOAD: CreateEventType<EventNames.ASSET, 'UNLOAD'>,
    LOADED: CreateEventType<EventNames.ASSET, 'LOADED'>,
    UNLOADED: CreateEventType<EventNames.ASSET, 'UNLOADED'>,
    ERROR: CreateEventType<EventNames.ASSET, 'ERROR'>,
    PROGRESS: CreateEventType<EventNames.ASSET, 'PROGRESS'>,
    CACHE_HIT: CreateEventType<EventNames.ASSET, 'CACHE_HIT'>
};

declare type EngineEvents = {
    INITIALIZING: CreateEventType<EventNames.ENGINE, 'INITIALIZING'>,
    INITIALIZED: CreateEventType<EventNames.ENGINE, 'INITIALIZED'>,
    INITIALIZATION_ERROR: CreateEventType<EventNames.ENGINE, 'INITIALIZATION_ERROR'>,
    STARTED: CreateEventType<EventNames.ENGINE, 'STARTED'>,
    STOPPED: CreateEventType<EventNames.ENGINE, 'STOPPED'>,
    PAUSED: CreateEventType<EventNames.ENGINE, 'PAUSED'>,
    RESUMED: CreateEventType<EventNames.ENGINE, 'RESUMED'>,
    DESTROYED: CreateEventType<EventNames.ENGINE, 'DESTROYED'>,
    SYSTEM_ADDED: CreateEventType<EventNames.ENGINE, 'SYSTEM_ADDED'>,
    SYSTEM_REMOVED: CreateEventType<EventNames.ENGINE, 'SYSTEM_REMOVED'>,
    SCENE_ADDED: CreateEventType<EventNames.ENGINE, 'SCENE_ADDED'>,
    SCENE_REMOVED: CreateEventType<EventNames.ENGINE, 'SCENE_REMOVED'>,
    ACTIVE_SCENE_CHANGE: CreateEventType<EventNames.ENGINE, 'ACTIVE_SCENE_CHANGE'>,
    CANVAS_RESIZED: CreateEventType<EventNames.ENGINE, 'CANVAS_RESIZED'>,
    WINDOW_RESIZED: CreateEventType<EventNames.ENGINE, 'WINDOW_RESIZED'>,
    WINDOW_HIDDEN: CreateEventType<EventNames.ENGINE, 'WINDOW_HIDDEN'>,
    WINDOW_VISIBLE: CreateEventType<EventNames.ENGINE, 'WINDOW_VISIBLE'>,
    START: CreateEventType<EventNames.ENGINE, 'START'>,
    STOP: CreateEventType<EventNames.ENGINE, 'STOP'>,
    PAUSE: CreateEventType<EventNames.ENGINE, 'PAUSE'>,
    RESUME: CreateEventType<EventNames.ENGINE, 'RESUME'>,
    ERROR: CreateEventType<EventNames.ENGINE, 'ERROR'>
};

declare type GameLoopEvents = {
    RENDER: CreateEventType<EventNames.GAMELOOP, 'RENDER'>,
    START: CreateEventType<EventNames.GAMELOOP, 'START'>,
    STOP: CreateEventType<EventNames.GAMELOOP, 'STOP'>,
    PAUSE: CreateEventType<EventNames.GAMELOOP, 'PAUSE'>,
    RESUME: CreateEventType<EventNames.GAMELOOP, 'RESUME'>,
    STEP: CreateEventType<EventNames.GAMELOOP, 'STEP'>,
    DESTROY: CreateEventType<EventNames.GAMELOOP, 'DESTROY'>,
    FPS_UPDATE: CreateEventType<EventNames.GAMELOOP, 'FPS_UPDATE'>,
    FIXED_UPDATE: CreateEventType<EventNames.GAMELOOP, 'FIXED_UPDATE'>,
    FIXED_UPDATE_COMPLETE: CreateEventType<EventNames.GAMELOOP, 'FIXED_UPDATE_COMPLETE'>,
    LATE_UPDATE: CreateEventType<EventNames.GAMELOOP, 'LATE_UPDATE'>,
    VARIABLE_UPDATE: CreateEventType<EventNames.GAMELOOP, 'VARIABLE_UPDATE'>,
    VARIABLE_UPDATE_COMPLETE: CreateEventType<EventNames.GAMELOOP, 'VARIABLE_UPDATE_COMPLETE'>,
    SYSTEM_ERROR: CreateEventType<EventNames.GAMELOOP, 'SYSTEM_ERROR'>,
};

declare type SceneEvents = {
    LOAD: CreateEventType<EventNames.SCENE, 'LOAD'>,
    UNLOAD: CreateEventType<EventNames.SCENE, 'UNLOAD'>,
    CHANGE: CreateEventType<EventNames.SCENE, 'CHANGE'>,
    READY: CreateEventType<EventNames.SCENE, 'READY'>,
    INITIALIZE: CreateEventType<EventNames.SCENE, 'INITIALIZE'>,
    ACTIVATE: CreateEventType<EventNames.SCENE, 'ACTIVATE'>,
    DEACTIVATE: CreateEventType<EventNames.SCENE, 'DEACTIVATE'>,
    ENTER: CreateEventType<EventNames.SCENE, 'ENTER'>,
    UPDATE: CreateEventType<EventNames.SCENE, 'UPDATE'>,
    EXIT: CreateEventType<EventNames.SCENE, 'EXIT'>,
    DESTROY: CreateEventType<EventNames.SCENE, 'DESTROY'>,
    CLEARED: CreateEventType<EventNames.SCENE, 'CLEARED'>,
    ENTITY_ADDED: CreateEventType<EventNames.SCENE, 'ENTITY_ADDED'>,
    ENTITY_REMOVED: CreateEventType<EventNames.SCENE, 'ENTITY_REMOVED'>,
};

declare type WorldEvents = {
    ENTITY_CREATED: CreateEventType<EventNames.WORLD, 'ENTITY_CREATED'>,
    ENTITY_DESTROYED: CreateEventType<EventNames.WORLD, 'ENTITY_DESTROYED'>,
    WORLD_CLEARED: CreateEventType<EventNames.WORLD, 'WORLD_CLEARED'>,
};

declare type InputEvents = {
    ACTION: CreateEventType<EventNames.INPUT, 'ACTION'>,
    MOUSE_PRIMARY_ACTION: CreateEventType<EventNames.INPUT, 'MOUSE_PRIMARY_ACTION'>,
    MOUSE_SECONDARY_ACTION: CreateEventType<EventNames.INPUT, 'MOUSE_SECONDARY_ACTION'>,
    KEYDOWN: CreateEventType<EventNames.INPUT, 'KEYDOWN'>,
    KEYUP: CreateEventType<EventNames.INPUT, 'KEYUP'>,
    MOUSEDOWN: CreateEventType<EventNames.INPUT, 'MOUSEDOWN'>,
    MOUSEUP: CreateEventType<EventNames.INPUT, 'MOUSEUP'>,
    MOUSEMOVE: CreateEventType<EventNames.INPUT, 'MOUSEMOVE'>,
    MOUSEWHEEL: CreateEventType<EventNames.INPUT, 'MOUSEWHEEL'>,
    TOUCHSTART: CreateEventType<EventNames.INPUT, 'TOUCHSTART'>,
    TOUCHEND: CreateEventType<EventNames.INPUT, 'TOUCHEND'>,
    TOUCHMOVE: CreateEventType<EventNames.INPUT, 'TOUCHMOVE'>,
};

declare type PhysicsEvents = {
    COLLISION_BEGIN: CreateEventType<EventNames.PHYSICS, 'COLLISION_BEGIN'>,
    COLLISION_END: CreateEventType<EventNames.PHYSICS, 'COLLISION_END'>,
    COLLISION_POST_SOLVE: CreateEventType<EventNames.PHYSICS, 'COLLISION_POST_SOLVE'>,
};

declare type AnimationEvents = {
    FRAME: CreateEventType<EventNames.ANIMATION, 'FRAME'>,
    COMPLETE: CreateEventType<EventNames.ANIMATION, 'COMPLETE'>,
};

// Union type de todos los eventos disponibles
declare type AllEventTypes =
    | WorldEvents[keyof WorldEvents]
    | SceneEvents[keyof SceneEvents]
    | InputEvents[keyof InputEvents]
    | EngineEvents[keyof EngineEvents]
    | GameLoopEvents[keyof GameLoopEvents]
    | PhysicsEvents[keyof PhysicsEvents]
    | AnimationEvents[keyof AnimationEvents]
    | AssetEvents[keyof AssetEvents];
