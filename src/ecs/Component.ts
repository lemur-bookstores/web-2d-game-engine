interface Vector {
    x: number;
    y: number;
    z?: number;
}

export interface Component {
    type: string;
    [key: string]: any;
}

export interface TransformComponent extends Component {
    type: 'transform';
    position: Vector;
    rotation: number;
    scale: Omit<Vector, 'z'>;
}

export interface SpriteComponent extends Component {
    type: 'sprite';
    texture: string;
    width: number;
    height: number;
    tint: { r: number; g: number; b: number; a: number };
    uvX: number;
    uvY: number;
    uvWidth: number;
    uvHeight: number;
    flipX: boolean;
    flipY: boolean;
}

export interface PhysicsComponent extends Component {
    type: 'physics';
    bodyType: 'static' | 'dynamic' | 'kinematic';
    shape: 'box' | 'circle' | 'polygon';
    density: number;
    friction: number;
    restitution: number;
    velocity: Vector;
    angularVelocity: number;
}

export interface ColliderComponent extends Component {
    type: 'collider';
    width: number;
    height: number;
    isTrigger: boolean;
}

export interface PhysicsBodyComponent extends Component {
    type: 'physicsBody' | 'physics';
    bodyType: 'dynamic' | 'static' | 'kinematic';
    shape: 'box' | 'circle' | 'polygon';
    width?: number;
    height?: number;
    radius?: number;
    vertices?: Vector[];
    density: number;
    friction: number;
    restitution: number;
    fixedRotation?: boolean;
    isSensor?: boolean;
    collisionGroup?: number;
}
