/// <reference types="webxr" />
import { XRTargetRaySpace, XRGripSpace, XRHandSpace, WebXRManager, PerspectiveCamera, WebXRArrayCamera, EventDispatcher } from 'three';
export declare class WebXRManagerMock extends EventDispatcher implements WebXRManager {
    enabled: boolean;
    isPresenting: boolean;
    cameraAutoUpdate: boolean;
    setFramebufferScaleFactor(_value: number): void;
    setReferenceSpaceType(_value: XRReferenceSpaceType): void;
    getReferenceSpace(): XRReferenceSpace | null;
    setReferenceSpace(_value: XRReferenceSpace): void;
    getBaseLayer(): XRWebGLLayer | XRProjectionLayer;
    getBinding(): XRWebGLBinding;
    getFrame(): XRFrame;
    getSession(): XRSession | null;
    setSession(_value: XRSession): Promise<void>;
    getCamera(): WebXRArrayCamera;
    updateCamera(_camera: PerspectiveCamera): void;
    setAnimationLoop(_callback: XRFrameRequestCallback | null): void;
    getFoveation(): number | undefined;
    setFoveation(_foveation: number): void;
    dispose(): void;
    getController: import("@vitest/spy").Mock<[index: number], XRTargetRaySpace>;
    getControllerGrip: import("@vitest/spy").Mock<[index: number], XRGripSpace>;
    getHand: import("@vitest/spy").Mock<[index: number], XRHandSpace>;
}
