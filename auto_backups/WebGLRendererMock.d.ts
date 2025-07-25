/// <reference types="webxr" />
import { WebXRManager, WebGLRenderer, Box3, BufferGeometry, Camera, Color, ColorRepresentation, CullFace, Data3DTexture, DataArrayTexture, Event, Material, Object3D, Scene, ShadowMapType, Texture, TextureEncoding, ToneMapping, Vector2, Vector3, Vector4, WebGLCapabilities, WebGLDebug, WebGLExtensions, WebGLInfo, WebGLMultipleRenderTargets, WebGLProperties, WebGLRenderLists, WebGLRenderTarget, WebGLShadowMap, WebGLState } from 'three';
export declare class WebGLRendererMock implements WebGLRenderer {
    xr: WebXRManager;
    constructor();
    domElement: HTMLCanvasElement;
    context: WebGLRenderingContext;
    autoClear: boolean;
    autoClearColor: boolean;
    autoClearDepth: boolean;
    autoClearStencil: boolean;
    debug: WebGLDebug;
    sortObjects: boolean;
    clippingPlanes: any[];
    localClippingEnabled: boolean;
    extensions: WebGLExtensions;
    outputEncoding: TextureEncoding;
    physicallyCorrectLights: boolean;
    toneMapping: ToneMapping;
    toneMappingExposure: number;
    info: WebGLInfo;
    shadowMap: WebGLShadowMap;
    pixelRatio: number;
    capabilities: WebGLCapabilities;
    properties: WebGLProperties;
    renderLists: WebGLRenderLists;
    state: WebGLState;
    getContext(): WebGLRenderingContext | WebGL2RenderingContext;
    getContextAttributes(): void;
    forceContextLoss(): void;
    forceContextRestore(): void;
    getMaxAnisotropy(): number;
    getPrecision(): string;
    getPixelRatio(): number;
    setPixelRatio(_value: number): void;
    getDrawingBufferSize(_target: Vector2): Vector2;
    setDrawingBufferSize(_width: number, _height: number, _pixelRatio: number): void;
    getSize(_target: Vector2): Vector2;
    setSize(_width: number, _height: number, _updateStyle?: boolean | undefined): void;
    getCurrentViewport(_target: Vector4): Vector4;
    getViewport(_target: Vector4): Vector4;
    setViewport(_x: number | Vector4, _y?: number | undefined, _width?: number | undefined, _height?: number | undefined): void;
    getScissor(_target: Vector4): Vector4;
    setScissor(_x: number | Vector4, _y?: number | undefined, _width?: number | undefined, _height?: number | undefined): void;
    getScissorTest(): boolean;
    setScissorTest(_enable: boolean): void;
    setOpaqueSort(_method: (a: any, b: any) => number): void;
    setTransparentSort(_method: (a: any, b: any) => number): void;
    getClearColor(_target: Color): Color;
    setClearColor(_color: ColorRepresentation, _alpha?: number | undefined): void;
    getClearAlpha(): number;
    setClearAlpha(_alpha: number): void;
    clear(_color?: boolean | undefined, _depth?: boolean | undefined, _stencil?: boolean | undefined): void;
    clearColor(): void;
    clearDepth(): void;
    clearStencil(): void;
    clearTarget(_renderTarget: WebGLRenderTarget, _color: boolean, _depth: boolean, _stencil: boolean): void;
    resetGLState(): void;
    dispose(): void;
    renderBufferDirect(_camera: Camera, _scene: Scene, _geometry: BufferGeometry, _material: Material, _object: Object3D<Event>, _geometryGroup: any): void;
    setAnimationLoop(_callback: XRFrameRequestCallback | null): void;
    animate(_callback: () => void): void;
    compile(_scene: Object3D<Event>, _camera: Camera): void;
    render(_scene: Object3D<Event>, _camera: Camera): void;
    getActiveCubeFace(): number;
    getActiveMipmapLevel(): number;
    getRenderTarget(): WebGLRenderTarget | null;
    getCurrentRenderTarget(): WebGLRenderTarget | null;
    setRenderTarget(_renderTarget: WebGLRenderTarget | WebGLMultipleRenderTargets | null, _activeCubeFace?: number | undefined, _activeMipmapLevel?: number | undefined): void;
    readRenderTargetPixels(_renderTarget: WebGLRenderTarget | WebGLMultipleRenderTargets, _x: number, _y: number, _width: number, _height: number, _buffer: any, _activeCubeFaceIndex?: number | undefined): void;
    copyFramebufferToTexture(_position: Vector2, _texture: Texture, _level?: number | undefined): void;
    copyTextureToTexture(_position: Vector2, _srcTexture: Texture, _dstTexture: Texture, _level?: number | undefined): void;
    copyTextureToTexture3D(_sourceBox: Box3, _position: Vector3, _srcTexture: Texture, _dstTexture: Data3DTexture | DataArrayTexture, _level?: number | undefined): void;
    initTexture(_texture: Texture): void;
    resetState(): void;
    vr: boolean;
    shadowMapEnabled: boolean;
    shadowMapType: ShadowMapType;
    shadowMapCullFace: CullFace;
    supportsFloatTextures(): void;
    supportsHalfFloatTextures(): void;
    supportsStandardDerivatives(): void;
    supportsCompressedTextureS3TC(): void;
    supportsCompressedTexturePVRTC(): void;
    supportsBlendMinMax(): void;
    supportsVertexTextures(): void;
    supportsInstancedArrays(): void;
    enableScissorTest(_boolean: any): void;
}
