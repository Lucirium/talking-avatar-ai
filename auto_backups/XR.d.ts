/// <reference types="webxr" />
import * as React from 'react';
import { EqualityChecker, StateSelector } from 'zustand';
import { XRController } from './XRController';
import { XREventHandler } from './XREvents';
import { XRState } from './context';
export declare type XRManagerEventType = 'sessionstart' | 'sessionend';
export interface XRManagerEvent {
    type: XRManagerEventType;
    target: XRSession;
}
export interface XRProps {
    /**
     * Enables foveated rendering. `Default is `0`
     * 0 = no foveation, full resolution
     * 1 = maximum foveation, the edges render at lower resolution
     */
    foveation?: number;
    /**
     * The target framerate for the XRSystem. Smaller rates give more CPU headroom at the cost of responsiveness.
     * Recommended range is `72`-`120`. Default is unset and left to the device.
     * @note If your experience cannot effectively reach the target framerate, it will be subject to frame reprojection
     * which will halve the effective framerate. Choose a conservative estimate that balances responsiveness and
     * headroom based on your experience.
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebXR_Device_API/Rendering#refresh_rate_and_frame_rate
     */
    frameRate?: number;
    /** Type of WebXR reference space to use. Default is `local-floor` */
    referenceSpace?: XRReferenceSpaceType;
    /** Called as an XRSession is requested */
    onSessionStart?: XREventHandler<XRManagerEvent>;
    /** Called after an XRSession is terminated */
    onSessionEnd?: XREventHandler<XRManagerEvent>;
    /** Called when an XRSession is hidden or unfocused. */
    onVisibilityChange?: XREventHandler<XRSessionEvent>;
    /** Called when available inputsources change */
    onInputSourcesChange?: XREventHandler<XRSessionEvent>;
    children: React.ReactNode;
}
export declare function XR(props: XRProps): JSX.Element;
export declare type XRButtonStatus = 'unsupported' | 'exited' | 'entered';
export declare type XRButtonUnsupportedReason = 'unknown' | 'https' | 'security';
export interface XRButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'onError'> {
    /** The type of `XRSession` to create */
    mode: 'AR' | 'VR' | 'inline';
    /**
     * `XRSession` configuration options
     * @see https://immersive-web.github.io/webxr/#feature-dependencies
     */
    sessionInit?: XRSessionInit;
    /** Whether this button should only enter an `XRSession`. Default is `false` */
    enterOnly?: boolean;
    /** Whether this button should only exit an `XRSession`. Default is `false` */
    exitOnly?: boolean;
    /** This callback gets fired if XR initialization fails. */
    onError?: (error: Error) => void;
    /** React children, can also accept a callback returning an `XRButtonStatus` */
    children?: React.ReactNode | ((status: XRButtonStatus) => React.ReactNode);
}
export declare const startSession: (sessionMode: XRSessionMode, sessionInit: XRButtonProps['sessionInit']) => Promise<XRSession | undefined>;
export declare const stopSession: () => Promise<void>;
export declare const toggleSession: (sessionMode: XRSessionMode, { sessionInit, enterOnly, exitOnly }?: Pick<XRButtonProps, 'sessionInit' | 'enterOnly' | 'exitOnly'>) => Promise<void | XRSession>;
export declare const XRButton: React.ForwardRefExoticComponent<XRButtonProps & React.RefAttributes<HTMLButtonElement>>;
export declare const ARButton: React.ForwardRefExoticComponent<Omit<XRButtonProps, "mode"> & React.RefAttributes<HTMLButtonElement>>;
export declare const VRButton: React.ForwardRefExoticComponent<Omit<XRButtonProps, "mode"> & React.RefAttributes<HTMLButtonElement>>;
export declare function useXR<T = XRState>(selector?: StateSelector<XRState, T>, equalityFn?: EqualityChecker<T>): T;
export declare function useController(handedness: XRHandedness): XRController | undefined;
