import _extends from '@babel/runtime/helpers/esm/extends';
import * as THREE from 'three';
import * as React from 'react';
import { forwardRef, useRef, useState, useCallback, useMemo, useImperativeHandle, useEffect, Suspense, useContext, createContext } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { easing } from 'maath';
import { suspend, clear } from 'suspend-react';
import { useVideoTexture } from './useVideoTexture.js';
import { Facemesh } from './Facemesh.js';
import { useFaceLandmarker } from './FaceLandmarker.js';

// useVideoTexture 1st arg `src` type

function mean(v1, v2) {
  return v1.clone().add(v2).multiplyScalar(0.5);
}
function localToLocal(objSrc, v, objDst) {
  // see: https://discourse.threejs.org/t/object3d-localtolocal/51564
  const v_world = objSrc.localToWorld(v);
  return objDst.worldToLocal(v_world);
}

//
//
//
const FaceControlsContext = /* @__PURE__ */createContext({});
const FaceControls = /* @__PURE__ */forwardRef(({
  camera,
  autostart = true,
  webcam = true,
  webcamVideoTextureSrc,
  manualUpdate = false,
  manualDetect = false,
  onVideoFrame,
  smoothTime = 0.25,
  offset = true,
  offsetScalar = 80,
  eyes = false,
  eyesAsOrigin = true,
  depth = 0.15,
  debug = false,
  facemesh,
  makeDefault
}, fref) => {
  var _faces$facialTransfor, _faces$faceBlendshape;
  const scene = useThree(state => state.scene);
  const defaultCamera = useThree(state => state.camera);
  const set = useThree(state => state.set);
  const get = useThree(state => state.get);
  const explCamera = camera || defaultCamera;
  const webcamApiRef = useRef(null);
  const facemeshApiRef = useRef(null);

  //
  // computeTarget()
  //
  // Compute `target` position and rotation for the camera (according to <Facemesh>)
  //
  //  1. 👀 either following the 2 eyes
  //  2. 👤 or just the head mesh
  //

  const [target] = useState(() => new THREE.Object3D());
  const [irisRightDirPos] = useState(() => new THREE.Vector3());
  const [irisLeftDirPos] = useState(() => new THREE.Vector3());
  const [irisRightLookAt] = useState(() => new THREE.Vector3());
  const [irisLeftLookAt] = useState(() => new THREE.Vector3());
  const computeTarget = useCallback(() => {
    // same parent as the camera
    target.parent = explCamera.parent;
    const facemeshApi = facemeshApiRef.current;
    if (facemeshApi) {
      const {
        outerRef,
        eyeRightRef,
        eyeLeftRef
      } = facemeshApi;
      if (eyeRightRef.current && eyeLeftRef.current) {
        // 1. 👀

        const {
          irisDirRef: irisRightDirRef
        } = eyeRightRef.current;
        const {
          irisDirRef: irisLeftDirRef
        } = eyeLeftRef.current;
        if (irisRightDirRef.current && irisLeftDirRef.current && outerRef.current) {
          //
          // position: mean of irisRightDirPos,irisLeftDirPos
          //
          irisRightDirPos.copy(localToLocal(irisRightDirRef.current, new THREE.Vector3(0, 0, 0), outerRef.current));
          irisLeftDirPos.copy(localToLocal(irisLeftDirRef.current, new THREE.Vector3(0, 0, 0), outerRef.current));
          target.position.copy(localToLocal(outerRef.current, mean(irisRightDirPos, irisLeftDirPos), explCamera.parent || scene));

          //
          // lookAt: mean of irisRightLookAt,irisLeftLookAt
          //
          irisRightLookAt.copy(localToLocal(irisRightDirRef.current, new THREE.Vector3(0, 0, 1), outerRef.current));
          irisLeftLookAt.copy(localToLocal(irisLeftDirRef.current, new THREE.Vector3(0, 0, 1), outerRef.current));
          target.lookAt(outerRef.current.localToWorld(mean(irisRightLookAt, irisLeftLookAt)));
        }
      } else {
        // 2. 👤

        if (outerRef.current) {
          target.position.copy(localToLocal(outerRef.current, new THREE.Vector3(0, 0, 0), explCamera.parent || scene));
          target.lookAt(outerRef.current.localToWorld(new THREE.Vector3(0, 0, 1)));
        }
      }
    }
    return target;
  }, [explCamera, irisLeftDirPos, irisLeftLookAt, irisRightDirPos, irisRightLookAt, scene, target]);

  //
  // update()
  //
  // Updating the camera `current` position and rotation, following `target`
  //

  const [current] = useState(() => new THREE.Object3D());
  const update = useCallback(function (delta, target) {
    if (explCamera) {
      var _target;
      (_target = target) !== null && _target !== void 0 ? _target : target = computeTarget();
      if (smoothTime > 0) {
        // damping current
        const eps = 1e-9;
        easing.damp3(current.position, target.position, smoothTime, delta, undefined, undefined, eps);
        easing.dampE(current.rotation, target.rotation, smoothTime, delta, undefined, undefined, eps);
      } else {
        // instant
        current.position.copy(target.position);
        current.rotation.copy(target.rotation);
      }
      explCamera.position.copy(current.position);
      explCamera.rotation.copy(current.rotation);
    }
  }, [explCamera, computeTarget, smoothTime, current.position, current.rotation]);

  //
  // detect()
  //

  const [faces, setFaces] = useState();
  const faceLandmarker = useFaceLandmarker();
  const detect = useCallback((video, time) => {
    const faces = faceLandmarker == null ? void 0 : faceLandmarker.detectForVideo(video, time);
    setFaces(faces);
  }, [faceLandmarker]);
  useFrame((_, delta) => {
    if (!manualUpdate) {
      update(delta);
    }
  });

  // Ref API
  const api = useMemo(() => Object.assign(Object.create(THREE.EventDispatcher.prototype), {
    detect,
    computeTarget,
    update,
    facemeshApiRef,
    webcamApiRef,
    // shorthands
    play: () => {
      var _webcamApiRef$current;
      (_webcamApiRef$current = webcamApiRef.current) == null || (_webcamApiRef$current = _webcamApiRef$current.videoTextureApiRef.current) == null || _webcamApiRef$current.texture.source.data.play();
    },
    pause: () => {
      var _webcamApiRef$current2;
      (_webcamApiRef$current2 = webcamApiRef.current) == null || (_webcamApiRef$current2 = _webcamApiRef$current2.videoTextureApiRef.current) == null || _webcamApiRef$current2.texture.source.data.pause();
    }
  }), [detect, computeTarget, update]);
  useImperativeHandle(fref, () => api, [api]);

  //
  // events callbacks
  //

  useEffect(() => {
    const onVideoFrameCb = e => {
      if (!manualDetect) detect(e.texture.source.data, e.time);
      if (onVideoFrame) onVideoFrame(e);
    };
    api.addEventListener('videoFrame', onVideoFrameCb);
    return () => {
      api.removeEventListener('videoFrame', onVideoFrameCb);
    };
  }, [api, detect, faceLandmarker, manualDetect, onVideoFrame]);

  // `controls` global state
  useEffect(() => {
    if (makeDefault) {
      const old = get().controls;
      set({
        controls: api
      });
      return () => set({
        controls: old
      });
    }
  }, [makeDefault, api, get, set]);
  const points = faces == null ? void 0 : faces.faceLandmarks[0];
  const facialTransformationMatrix = faces == null || (_faces$facialTransfor = faces.facialTransformationMatrixes) == null ? void 0 : _faces$facialTransfor[0];
  const faceBlendshapes = faces == null || (_faces$faceBlendshape = faces.faceBlendshapes) == null ? void 0 : _faces$faceBlendshape[0];
  return /*#__PURE__*/React.createElement(FaceControlsContext.Provider, {
    value: api
  }, webcam && /*#__PURE__*/React.createElement(Suspense, {
    fallback: null
  }, /*#__PURE__*/React.createElement(Webcam, {
    ref: webcamApiRef,
    autostart: autostart,
    videoTextureSrc: webcamVideoTextureSrc
  })), /*#__PURE__*/React.createElement(Facemesh, _extends({
    ref: facemeshApiRef
  }, facemesh, {
    points: points,
    depth: depth,
    facialTransformationMatrix: facialTransformationMatrix,
    faceBlendshapes: faceBlendshapes,
    eyes: eyes,
    eyesAsOrigin: eyesAsOrigin,
    offset: offset,
    offsetScalar: offsetScalar,
    debug: debug,
    "rotation-z": Math.PI,
    visible: debug
  }), /*#__PURE__*/React.createElement("meshBasicMaterial", {
    side: THREE.DoubleSide
  })));
});
const useFaceControls = () => useContext(FaceControlsContext);

//
// Webcam
//
const Webcam = /* @__PURE__ */forwardRef(({
  videoTextureSrc,
  autostart = true
}, fref) => {
  const videoTextureApiRef = useRef(null);
  const faceControls = useFaceControls();
  const stream = suspend(async () => {
    return !videoTextureSrc ? await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: 'user'
      }
    }) : Promise.resolve(null);
  }, [videoTextureSrc]);
  useEffect(() => {
    faceControls.dispatchEvent({
      type: 'stream',
      stream
    });
    return () => {
      stream == null || stream.getTracks().forEach(track => track.stop());
      clear([videoTextureSrc]);
    };
  }, [stream, faceControls, videoTextureSrc]);

  // ref-api
  const api = useMemo(() => ({
    videoTextureApiRef
  }), []);
  useImperativeHandle(fref, () => api, [api]);
  return /*#__PURE__*/React.createElement(Suspense, {
    fallback: null
  }, /*#__PURE__*/React.createElement(VideoTexture, {
    ref: videoTextureApiRef,
    src: videoTextureSrc || stream,
    start: autostart
  }));
});

//
// VideoTexture
//
const VideoTexture = /* @__PURE__ */forwardRef(({
  src,
  start
}, fref) => {
  const texture = useVideoTexture(src, {
    start
  });
  const video = texture.source.data;
  const faceControls = useFaceControls();
  const onVideoFrame = useCallback(time => {
    faceControls.dispatchEvent({
      type: 'videoFrame',
      texture,
      time
    });
  }, [texture, faceControls]);
  useVideoFrame(video, onVideoFrame);

  // ref-api
  const api = useMemo(() => ({
    texture
  }), [texture]);
  useImperativeHandle(fref, () => api, [api]);
  return /*#__PURE__*/React.createElement(React.Fragment, null);
});
const useVideoFrame = (video, f) => {
  // https://web.dev/requestvideoframecallback-rvfc/
  // https://www.remotion.dev/docs/video-manipulation
  useEffect(() => {
    if (!video || !video.requestVideoFrameCallback) return;
    let handle;
    function callback(...args) {
      f(...args);
      handle = video.requestVideoFrameCallback(callback);
    }
    video.requestVideoFrameCallback(callback);
    return () => video.cancelVideoFrameCallback(handle);
  }, [video, f]);
};

export { FaceControls, useFaceControls };
