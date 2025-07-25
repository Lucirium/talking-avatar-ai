/// <reference types="webxr" />
export declare class XRSystemMock extends EventTarget implements XRSystem {
    constructor();
    requestSession: import("@vitest/spy").Mock<[mode: XRSessionMode, options?: XRSessionInit | undefined], Promise<XRSession>>;
    isSessionSupported: import("@vitest/spy").Mock<[mode: XRSessionMode], Promise<boolean>>;
    ondevicechange: XRSystemDeviceChangeEventHandler | null;
    addEventListener<K extends keyof XRSystemEventMap>(type: K, listener: (this: XRSystem, ev: XRSystemEventMap[K]) => any, options?: boolean | AddEventListenerOptions | undefined): void;
    addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions | undefined): void;
    removeEventListener<K extends keyof XRSystemEventMap>(type: K, listener: (this: XRSystem, ev: XRSystemEventMap[K]) => any, options?: boolean | EventListenerOptions | undefined): void;
    removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions | undefined): void;
    onsessiongranted: XRSystemSessionGrantedEventHandler | null;
    dispatchEvent(event: Event): boolean;
}
