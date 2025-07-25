import * as React from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useXR } from "./XR.js";
import { useXREvent } from "./XREvents.js";
import { useCallbackRef, useIsomorphicLayoutEffect } from "./utils.js";
const tempMatrix = new THREE.Matrix4();
function InteractionManager({ children }) {
  const events = useThree((state) => state.events);
  const get = useThree((state) => state.get);
  const raycaster = useThree((state) => state.raycaster);
  const controllers = useXR((state) => state.controllers);
  const interactions = useXR((state) => state.interactions);
  const hoverState = useXR((state) => state.hoverState);
  const hasInteraction = useXR((state) => state.hasInteraction);
  const getInteraction = useXR((state) => state.getInteraction);
  const intersect = React.useCallback(
    (controller) => {
      const objects = Array.from(interactions.keys());
      tempMatrix.identity().extractRotation(controller.matrixWorld);
      raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
      raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
      return raycaster.intersectObjects(objects, true);
    },
    [interactions, raycaster]
  );
  useFrame(() => {
    var _a;
    if (interactions.size === 0)
      return;
    for (const target of controllers) {
      if (!((_a = target.inputSource) == null ? void 0 : _a.handedness)) {
        return;
      }
      const hovering = hoverState[target.inputSource.handedness];
      const hits = /* @__PURE__ */ new Set();
      let intersections = intersect(target.controller);
      if (events.filter) {
        intersections = events.filter(intersections, get());
      } else {
        const hit = intersections.find((i) => i == null ? void 0 : i.object);
        if (hit)
          intersections = [hit];
      }
      for (const intersection of intersections) {
        let eventObject = intersection.object;
        while (eventObject) {
          if (hasInteraction(eventObject, "onHover") && !hovering.has(eventObject)) {
            const handlers = getInteraction(eventObject, "onHover");
            for (const handler of handlers) {
              handler({ target, intersection, intersections });
            }
          }
          const moveHandlers = getInteraction(eventObject, "onMove");
          moveHandlers == null ? void 0 : moveHandlers.forEach((handler) => handler({ target, intersection, intersections }));
          hovering.set(eventObject, intersection);
          hits.add(eventObject.id);
          eventObject = eventObject.parent;
        }
      }
      for (const eventObject of hovering.keys()) {
        if (!hits.has(eventObject.id)) {
          hovering.delete(eventObject);
          const handlers = getInteraction(eventObject, "onBlur");
          if (!handlers)
            continue;
          for (const handler of handlers) {
            handler({ target, intersections });
          }
        }
      }
    }
  });
  const triggerEvent = React.useCallback(
    (interaction) => (e) => {
      var _a;
      if (!((_a = e.target.inputSource) == null ? void 0 : _a.handedness)) {
        return;
      }
      const hovering = hoverState[e.target.inputSource.handedness];
      const intersections = Array.from(new Set(hovering.values()));
      interactions.forEach((handlers, object) => {
        var _a2, _b, _c;
        if (hovering.has(object)) {
          if (!handlers[interaction])
            return;
          for (const handler of handlers[interaction]) {
            (_a2 = handler.current) == null ? void 0 : _a2.call(handler, { target: e.target, intersection: hovering.get(object), intersections });
          }
        } else {
          if (interaction === "onSelect" && handlers["onSelectMissed"]) {
            for (const handler of handlers["onSelectMissed"]) {
              (_b = handler.current) == null ? void 0 : _b.call(handler, { target: e.target, intersections });
            }
          } else if (interaction === "onSqueeze" && handlers["onSqueezeMissed"]) {
            for (const handler of handlers["onSqueezeMissed"]) {
              (_c = handler.current) == null ? void 0 : _c.call(handler, { target: e.target, intersections });
            }
          }
        }
      });
    },
    [hoverState, interactions]
  );
  useXREvent("select", triggerEvent("onSelect"));
  useXREvent("selectstart", triggerEvent("onSelectStart"));
  useXREvent("selectend", triggerEvent("onSelectEnd"));
  useXREvent("squeeze", triggerEvent("onSqueeze"));
  useXREvent("squeezeend", triggerEvent("onSqueezeEnd"));
  useXREvent("squeezestart", triggerEvent("onSqueezeStart"));
  return /* @__PURE__ */ React.createElement(React.Fragment, null, children);
}
function useInteraction(ref, type, handler) {
  const addInteraction = useXR((state) => state.addInteraction);
  const removeInteraction = useXR((state) => state.removeInteraction);
  const handlerRef = useCallbackRef(handler);
  useIsomorphicLayoutEffect(() => {
    const target = ref.current;
    if (!target || !handlerRef.current)
      return;
    addInteraction(target, type, handlerRef);
    return () => removeInteraction(target, type, handlerRef);
  }, [ref, type, addInteraction, removeInteraction]);
}
const Interactive = React.forwardRef(function Interactive2({
  onHover,
  onBlur,
  onSelectStart,
  onSelectEnd,
  onSelectMissed,
  onSelect,
  onSqueezeStart,
  onSqueezeEnd,
  onSqueezeMissed,
  onSqueeze,
  onMove,
  children
}, passedRef) {
  const ref = React.useRef(null);
  React.useImperativeHandle(passedRef, () => ref.current);
  useInteraction(ref, "onHover", onHover);
  useInteraction(ref, "onBlur", onBlur);
  useInteraction(ref, "onSelectStart", onSelectStart);
  useInteraction(ref, "onSelectEnd", onSelectEnd);
  useInteraction(ref, "onSelectMissed", onSelectMissed);
  useInteraction(ref, "onSelect", onSelect);
  useInteraction(ref, "onSqueezeStart", onSqueezeStart);
  useInteraction(ref, "onSqueezeEnd", onSqueezeEnd);
  useInteraction(ref, "onSqueezeMissed", onSqueezeMissed);
  useInteraction(ref, "onSqueeze", onSqueeze);
  useInteraction(ref, "onMove", onMove);
  return /* @__PURE__ */ React.createElement("group", {
    ref
  }, children);
});
const RayGrab = React.forwardRef(function RayGrab2({ onSelectStart, onSelectEnd, children, ...rest }, forwardedRef) {
  const grabbingController = React.useRef();
  const groupRef = React.useRef(null);
  const previousTransform = React.useMemo(() => new THREE.Matrix4(), []);
  React.useImperativeHandle(forwardedRef, () => groupRef.current);
  useFrame(() => {
    const controller = grabbingController.current;
    const group = groupRef.current;
    if (!controller)
      return;
    group.applyMatrix4(previousTransform);
    group.applyMatrix4(controller.matrixWorld);
    group.updateMatrixWorld();
    previousTransform.copy(controller.matrixWorld).invert();
  });
  return /* @__PURE__ */ React.createElement(Interactive, {
    ref: groupRef,
    onSelectStart: (e) => {
      grabbingController.current = e.target.controller;
      previousTransform.copy(e.target.controller.matrixWorld).invert();
      onSelectStart == null ? void 0 : onSelectStart(e);
    },
    onSelectEnd: (e) => {
      if (e.target.controller === grabbingController.current) {
        grabbingController.current = void 0;
      }
      onSelectEnd == null ? void 0 : onSelectEnd(e);
    },
    ...rest
  }, children);
});
function useHitTest(hitTestCallback) {
  const session = useXR((state) => state.session);
  const hitTestSource = React.useRef();
  const hitMatrix = React.useMemo(() => new THREE.Matrix4(), []);
  useIsomorphicLayoutEffect(() => {
    if (!session)
      return void (hitTestSource.current = void 0);
    session.requestReferenceSpace("viewer").then(async (referenceSpace) => {
      var _a;
      hitTestSource.current = await ((_a = session == null ? void 0 : session.requestHitTestSource) == null ? void 0 : _a.call(session, { space: referenceSpace }));
    });
  }, [session]);
  useFrame((state, _, frame) => {
    if (!frame || !hitTestSource.current)
      return;
    const [hit] = frame.getHitTestResults(hitTestSource.current);
    if (hit) {
      const referenceSpace = state.gl.xr.getReferenceSpace();
      const pose = hit.getPose(referenceSpace);
      if (pose) {
        hitMatrix.fromArray(pose.transform.matrix);
        hitTestCallback(hitMatrix, hit);
      }
    }
  });
}
export {
  InteractionManager,
  Interactive,
  RayGrab,
  useHitTest,
  useInteraction
};
//# sourceMappingURL=Interactions.js.map
