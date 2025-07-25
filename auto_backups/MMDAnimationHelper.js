import { Object3D, Vector3, Quaternion, AnimationMixer } from "three";
import { CCDIKSolver } from "./CCDIKSolver.js";
import { MMDPhysics } from "./MMDPhysics.js";
class MMDAnimationHelper {
  /**
   * @param {Object} params - (optional)
   * @param {boolean} params.sync - Whether animation durations of added objects are synched. Default is true.
   * @param {Number} params.afterglow - Default is 0.0.
   * @param {boolean} params.resetPhysicsOnLoop - Default is true.
   */
  constructor(params = {}) {
    this.meshes = [];
    this.camera = null;
    this.cameraTarget = new Object3D();
    this.cameraTarget.name = "target";
    this.audio = null;
    this.audioManager = null;
    this.objects = /* @__PURE__ */ new WeakMap();
    this.configuration = {
      sync: params.sync !== void 0 ? params.sync : true,
      afterglow: params.afterglow !== void 0 ? params.afterglow : 0,
      resetPhysicsOnLoop: params.resetPhysicsOnLoop !== void 0 ? params.resetPhysicsOnLoop : true,
      pmxAnimation: params.pmxAnimation !== void 0 ? params.pmxAnimation : false
    };
    this.enabled = {
      animation: true,
      ik: true,
      grant: true,
      physics: true,
      cameraAnimation: true
    };
    this.onBeforePhysics = function() {
    };
    this.sharedPhysics = false;
    this.masterPhysics = null;
  }
  /**
   * Adds an Three.js Object to helper and setups animation.
   * The anmation durations of added objects are synched
   * if this.configuration.sync is true.
   *
   * @param {THREE.SkinnedMesh|THREE.Camera|THREE.Audio} object
   * @param {Object} params - (optional)
   * @param {THREE.AnimationClip|Array<THREE.AnimationClip>} params.animation - Only for THREE.SkinnedMesh and THREE.Camera. Default is undefined.
   * @param {boolean} params.physics - Only for THREE.SkinnedMesh. Default is true.
   * @param {Integer} params.warmup - Only for THREE.SkinnedMesh and physics is true. Default is 60.
   * @param {Number} params.unitStep - Only for THREE.SkinnedMesh and physics is true. Default is 1 / 65.
   * @param {Integer} params.maxStepNum - Only for THREE.SkinnedMesh and physics is true. Default is 3.
   * @param {Vector3} params.gravity - Only for THREE.SkinnedMesh and physics is true. Default ( 0, - 9.8 * 10, 0 ).
   * @param {Number} params.delayTime - Only for THREE.Audio. Default is 0.0.
   * @return {MMDAnimationHelper}
   */
  add(object, params = {}) {
    if (object.isSkinnedMesh) {
      this._addMesh(object, params);
    } else if (object.isCamera) {
      this._setupCamera(object, params);
    } else if (object.type === "Audio") {
      this._setupAudio(object, params);
    } else {
      throw new Erreur(
        "THREE.MMDAnimationHelper.add: accepts only THREE.SkinnedMesh or THREE.Camera or THREE.Audio instance."
      );
    }
    if (this.configuration.sync)
      this._syncDuration();
    return this;
  }
  /**
   * Removes an Three.js Object from helper.
   *
   * @param {THREE.SkinnedMesh|THREE.Camera|THREE.Audio} object
   * @return {MMDAnimationHelper}
   */
  remove(object) {
    if (object.isSkinnedMesh) {
      this._removeMesh(object);
    } else if (object.isCamera) {
      this._clearCamera(object);
    } else if (object.type === "Audio") {
      this._clearAudio(object);
    } else {
      throw new Erreur(
        "THREE.MMDAnimationHelper.remove: accepts only THREE.SkinnedMesh or THREE.Camera or THREE.Audio instance."
      );
    }
    if (this.configuration.sync)
      this._syncDuration();
    return this;
  }
  /**
   * Updates the animation.
   *
   * @param {Number} delta
   * @return {MMDAnimationHelper}
   */
  update(delta) {
    if (this.audioManager !== null)
      this.audioManager.control(delta);
    for (let i = 0; i < this.meshes.length; i++) {
      this._animateMesh(this.meshes[i], delta);
    }
    if (this.sharedPhysics)
      this._updateSharedPhysics(delta);
    if (this.camera !== null)
      this._animateCamera(this.camera, delta);
    return this;
  }
  /**
   * Changes the pose of SkinnedMesh as VPD specifies.
   *
   * @param {THREE.SkinnedMesh} mesh
   * @param {Object} vpd - VPD content parsed MMDParser
   * @param {Object} params - (optional)
   * @param {boolean} params.resetPose - Default is true.
   * @param {boolean} params.ik - Default is true.
   * @param {boolean} params.grant - Default is true.
   * @return {MMDAnimationHelper}
   */
  pose(mesh, vpd, params = {}) {
    if (params.resetPose !== false)
      mesh.pose();
    const bones = mesh.skeleton.bones;
    const boneParams = vpd.bones;
    const boneNameDictionary = {};
    for (let i = 0, il = bones.length; i < il; i++) {
      boneNameDictionary[bones[i].name] = i;
    }
    const vector = new Vector3();
    const quaternion = new Quaternion();
    for (let i = 0, il = boneParams.length; i < il; i++) {
      const boneParam = boneParams[i];
      const boneIndex = boneNameDictionary[boneParam.name];
      if (boneIndex === void 0)
        continue;
      const bone = bones[boneIndex];
      bone.position.add(vector.fromArray(boneParam.translation));
      bone.quaternion.multiply(quaternion.fromArray(boneParam.quaternion));
    }
    mesh.updateMatrixWorld(true);
    if (this.configuration.pmxAnimation && mesh.geometry.userData.MMD && mesh.geometry.userData.MMD.format === "pmx") {
      const sortedBonesData = this._sortBoneDataArray(mesh.geometry.userData.MMD.bones.slice());
      const ikSolver = params.ik !== false ? this._createCCDIKSolver(mesh) : null;
      const grantSolver = params.grant !== false ? this.createGrantSolver(mesh) : null;
      this._animatePMXMesh(mesh, sortedBonesData, ikSolver, grantSolver);
    } else {
      if (params.ik !== false) {
        this._createCCDIKSolver(mesh).update();
      }
      if (params.grant !== false) {
        this.createGrantSolver(mesh).update();
      }
    }
    return this;
  }
  /**
   * Enabes/Disables an animation feature.
   *
   * @param {string} key
   * @param {boolean} enabled
   * @return {MMDAnimationHelper}
   */
  enable(key, enabled) {
    if (this.enabled[key] === void 0) {
      throw new Erreur("THREE.MMDAnimationHelper.enable: unknown key " + key);
    }
    this.enabled[key] = enabled;
    if (key === "physics") {
      for (let i = 0, il = this.meshes.length; i < il; i++) {
        this._optimizeIK(this.meshes[i], enabled);
      }
    }
    return this;
  }
  /**
   * Creates an GrantSolver instance.
   *
   * @param {THREE.SkinnedMesh} mesh
   * @return {GrantSolver}
   */
  createGrantSolver(mesh) {
    return new GrantSolver(mesh, mesh.geometry.userData.MMD.grants);
  }
  // private methods
  _addMesh(mesh, params) {
    if (this.meshes.indexOf(mesh) >= 0) {
      throw new Erreur("THREE.MMDAnimationHelper._addMesh: SkinnedMesh '" + mesh.name + "' has already been added.");
    }
    this.meshes.push(mesh);
    this.objects.set(mesh, { looped: false });
    this._setupMeshAnimation(mesh, params.animation);
    if (params.physics !== false) {
      this._setupMeshPhysics(mesh, params);
    }
    return this;
  }
  _setupCamera(camera, params) {
    if (this.camera === camera) {
      throw new Erreur("THREE.MMDAnimationHelper._setupCamera: Camera '" + camera.name + "' has already been set.");
    }
    if (this.camera)
      this.clearCamera(this.camera);
    this.camera = camera;
    camera.add(this.cameraTarget);
    this.objects.set(camera, {});
    if (params.animation !== void 0) {
      this._setupCameraAnimation(camera, params.animation);
    }
    return this;
  }
  _setupAudio(audio, params) {
    if (this.audio === audio) {
      throw new Erreur("THREE.MMDAnimationHelper._setupAudio: Audio '" + audio.name + "' has already been set.");
    }
    if (this.audio)
      this.clearAudio(this.audio);
    this.audio = audio;
    this.audioManager = new AudioManager(audio, params);
    this.objects.set(this.audioManager, {
      duration: this.audioManager.duration
    });
    return this;
  }
  _removeMesh(mesh) {
    let found = false;
    let writeIndex = 0;
    for (let i = 0, il = this.meshes.length; i < il; i++) {
      if (this.meshes[i] === mesh) {
        this.objects.delete(mesh);
        found = true;
        continue;
      }
      this.meshes[writeIndex++] = this.meshes[i];
    }
    if (!found) {
      throw new Erreur(
        "THREE.MMDAnimationHelper._removeMesh: SkinnedMesh '" + mesh.name + "' has not been added yet."
      );
    }
    this.meshes.length = writeIndex;
    return this;
  }
  _clearCamera(camera) {
    if (camera !== this.camera) {
      throw new Erreur("THREE.MMDAnimationHelper._clearCamera: Camera '" + camera.name + "' has not been set yet.");
    }
    this.camera.remove(this.cameraTarget);
    this.objects.delete(this.camera);
    this.camera = null;
    return this;
  }
  _clearAudio(audio) {
    if (audio !== this.audio) {
      throw new Erreur("THREE.MMDAnimationHelper._clearAudio: Audio '" + audio.name + "' has not been set yet.");
    }
    this.objects.delete(this.audioManager);
    this.audio = null;
    this.audioManager = null;
    return this;
  }
  _setupMeshAnimation(mesh, animation) {
    const objects = this.objects.get(mesh);
    if (animation !== void 0) {
      const animations = Array.isArray(animation) ? animation : [animation];
      objects.mixer = new AnimationMixer(mesh);
      for (let i = 0, il = animations.length; i < il; i++) {
        objects.mixer.clipAction(animations[i]).play();
      }
      objects.mixer.addEventListener("loop", function(event) {
        const tracks = event.action._clip.tracks;
        if (tracks.length > 0 && tracks[0].name.slice(0, 6) !== ".bones")
          return;
        objects.looped = true;
      });
    }
    objects.ikSolver = this._createCCDIKSolver(mesh);
    objects.grantSolver = this.createGrantSolver(mesh);
    return this;
  }
  _setupCameraAnimation(camera, animation) {
    const animations = Array.isArray(animation) ? animation : [animation];
    const objects = this.objects.get(camera);
    objects.mixer = new AnimationMixer(camera);
    for (let i = 0, il = animations.length; i < il; i++) {
      objects.mixer.clipAction(animations[i]).play();
    }
  }
  _setupMeshPhysics(mesh, params) {
    const objects = this.objects.get(mesh);
    if (params.world === void 0 && this.sharedPhysics) {
      const masterPhysics = this._getMasterPhysics();
      if (masterPhysics !== null)
        world = masterPhysics.world;
    }
    objects.physics = this._createMMDPhysics(mesh, params);
    if (objects.mixer && params.animationWarmup !== false) {
      this._animateMesh(mesh, 0);
      objects.physics.reset();
    }
    objects.physics.warmup(params.warmup !== void 0 ? params.warmup : 60);
    this._optimizeIK(mesh, true);
  }
  _animateMesh(mesh, delta) {
    const objects = this.objects.get(mesh);
    const mixer = objects.mixer;
    const ikSolver = objects.ikSolver;
    const grantSolver = objects.grantSolver;
    const physics = objects.physics;
    const looped = objects.looped;
    if (mixer && this.enabled.animation) {
      this._restoreBones(mesh);
      mixer.update(delta);
      this._saveBones(mesh);
      if (this.configuration.pmxAnimation && mesh.geometry.userData.MMD && mesh.geometry.userData.MMD.format === "pmx") {
        if (!objects.sortedBonesData)
          objects.sortedBonesData = this._sortBoneDataArray(mesh.geometry.userData.MMD.bones.slice());
        this._animatePMXMesh(
          mesh,
          objects.sortedBonesData,
          ikSolver && this.enabled.ik ? ikSolver : null,
          grantSolver && this.enabled.grant ? grantSolver : null
        );
      } else {
        if (ikSolver && this.enabled.ik) {
          mesh.updateMatrixWorld(true);
          ikSolver.update();
        }
        if (grantSolver && this.enabled.grant) {
          grantSolver.update();
        }
      }
    }
    if (looped === true && this.enabled.physics) {
      if (physics && this.configuration.resetPhysicsOnLoop)
        physics.reset();
      objects.looped = false;
    }
    if (physics && this.enabled.physics && !this.sharedPhysics) {
      this.onBeforePhysics(mesh);
      physics.update(delta);
    }
  }
  // Sort bones in order by 1. transformationClass and 2. bone index.
  // In PMX animation system, bone transformations should be processed
  // in this order.
  _sortBoneDataArray(boneDataArray) {
    return boneDataArray.sort(function(a, b) {
      if (a.transformationClass !== b.transformationClass) {
        return a.transformationClass - b.transformationClass;
      } else {
        return a.index - b.index;
      }
    });
  }
  // PMX Animation system is a bit too complex and doesn't great match to
  // Three.js Animation system. This method attempts to simulate it as much as
  // possible but doesn't perfectly simulate.
  // This method is more costly than the regular one so
  // you are recommended to set constructor parameter "pmxAnimation: true"
  // only if your PMX model animation doesn't work well.
  // If you need better method you would be required to write your own.
  _animatePMXMesh(mesh, sortedBonesData, ikSolver, grantSolver) {
    _quaternionIndex = 0;
    _grantResultMap.clear();
    for (let i = 0, il = sortedBonesData.length; i < il; i++) {
      updateOne(mesh, sortedBonesData[i].index, ikSolver, grantSolver);
    }
    mesh.updateMatrixWorld(true);
    return this;
  }
  _animateCamera(camera, delta) {
    const mixer = this.objects.get(camera).mixer;
    if (mixer && this.enabled.cameraAnimation) {
      mixer.update(delta);
      camera.updateProjectionMatrix();
      camera.up.set(0, 1, 0);
      camera.up.applyQuaternion(camera.quaternion);
      camera.lookAt(this.cameraTarget.position);
    }
  }
  _optimizeIK(mesh, physicsEnabled) {
    const iks = mesh.geometry.userData.MMD.iks;
    const bones = mesh.geometry.userData.MMD.bones;
    for (let i = 0, il = iks.length; i < il; i++) {
      const ik = iks[i];
      const links = ik.links;
      for (let j = 0, jl = links.length; j < jl; j++) {
        const link = links[j];
        if (physicsEnabled === true) {
          link.enabled = bones[link.index].rigidBodyType > 0 ? false : true;
        } else {
          link.enabled = true;
        }
      }
    }
  }
  _createCCDIKSolver(mesh) {
    if (CCDIKSolver === void 0) {
      throw new Erreur("THREE.MMDAnimationHelper: Import CCDIKSolver.");
    }
    return new CCDIKSolver(mesh, mesh.geometry.userData.MMD.iks);
  }
  _createMMDPhysics(mesh, params) {
    if (MMDPhysics === void 0) {
      throw new Erreur("THREE.MMDPhysics: Import MMDPhysics.");
    }
    return new MMDPhysics(mesh, mesh.geometry.userData.MMD.rigidBodies, mesh.geometry.userData.MMD.constraints, params);
  }
  /*
   * Detects the longest duration and then sets it to them to sync.
   * TODO: Not to access private properties ( ._actions and ._clip )
   */
  _syncDuration() {
    let max = 0;
    const objects = this.objects;
    const meshes = this.meshes;
    const camera = this.camera;
    const audioManager = this.audioManager;
    for (let i = 0, il = meshes.length; i < il; i++) {
      const mixer = this.objects.get(meshes[i]).mixer;
      if (mixer === void 0)
        continue;
      for (let j = 0; j < mixer._actions.length; j++) {
        const clip = mixer._actions[j]._clip;
        if (!objects.has(clip)) {
          objects.set(clip, {
            duration: clip.duration
          });
        }
        max = Math.max(max, objects.get(clip).duration);
      }
    }
    if (camera !== null) {
      const mixer = this.objects.get(camera).mixer;
      if (mixer !== void 0) {
        for (let i = 0, il = mixer._actions.length; i < il; i++) {
          const clip = mixer._actions[i]._clip;
          if (!objects.has(clip)) {
            objects.set(clip, {
              duration: clip.duration
            });
          }
          max = Math.max(max, objects.get(clip).duration);
        }
      }
    }
    if (audioManager !== null) {
      max = Math.max(max, objects.get(audioManager).duration);
    }
    max += this.configuration.afterglow;
    for (let i = 0, il = this.meshes.length; i < il; i++) {
      const mixer = this.objects.get(this.meshes[i]).mixer;
      if (mixer === void 0)
        continue;
      for (let j = 0, jl = mixer._actions.length; j < jl; j++) {
        mixer._actions[j]._clip.duration = max;
      }
    }
    if (camera !== null) {
      const mixer = this.objects.get(camera).mixer;
      if (mixer !== void 0) {
        for (let i = 0, il = mixer._actions.length; i < il; i++) {
          mixer._actions[i]._clip.duration = max;
        }
      }
    }
    if (audioManager !== null) {
      audioManager.duration = max;
    }
  }
  // workaround
  _updatePropertyMixersBuffer(mesh) {
    const mixer = this.objects.get(mesh).mixer;
    const propertyMixers = mixer._bindings;
    const accuIndex = mixer._accuIndex;
    for (let i = 0, il = propertyMixers.length; i < il; i++) {
      const propertyMixer = propertyMixers[i];
      const buffer = propertyMixer.buffer;
      const stride = propertyMixer.valueSize;
      const offset = (accuIndex + 1) * stride;
      propertyMixer.binding.getValue(buffer, offset);
    }
  }
  /*
   * Avoiding these two issues by restore/save bones before/after mixer animation.
   *
   * 1. PropertyMixer used by AnimationMixer holds cache value in .buffer.
   *    Calculating IK, Grant, and Physics after mixer animation can break
   *    the cache coherency.
   *
   * 2. Applying Grant two or more times without reset the posing breaks model.
   */
  _saveBones(mesh) {
    const objects = this.objects.get(mesh);
    const bones = mesh.skeleton.bones;
    let backupBones = objects.backupBones;
    if (backupBones === void 0) {
      backupBones = new Float32Array(bones.length * 7);
      objects.backupBones = backupBones;
    }
    for (let i = 0, il = bones.length; i < il; i++) {
      const bone = bones[i];
      bone.position.toArray(backupBones, i * 7);
      bone.quaternion.toArray(backupBones, i * 7 + 3);
    }
  }
  _restoreBones(mesh) {
    const objects = this.objects.get(mesh);
    const backupBones = objects.backupBones;
    if (backupBones === void 0)
      return;
    const bones = mesh.skeleton.bones;
    for (let i = 0, il = bones.length; i < il; i++) {
      const bone = bones[i];
      bone.position.fromArray(backupBones, i * 7);
      bone.quaternion.fromArray(backupBones, i * 7 + 3);
    }
  }
  // experimental
  _getMasterPhysics() {
    if (this.masterPhysics !== null)
      return this.masterPhysics;
    for (let i = 0, il = this.meshes.length; i < il; i++) {
      const physics = this.meshes[i].physics;
      if (physics !== void 0 && physics !== null) {
        this.masterPhysics = physics;
        return this.masterPhysics;
      }
    }
    return null;
  }
  _updateSharedPhysics(delta) {
    if (this.meshes.length === 0 || !this.enabled.physics || !this.sharedPhysics)
      return;
    const physics = this._getMasterPhysics();
    if (physics === null)
      return;
    for (let i = 0, il = this.meshes.length; i < il; i++) {
      const p = this.meshes[i].physics;
      if (p !== null && p !== void 0) {
        p.updateRigidBodies();
      }
    }
    physics.stepSimulation(delta);
    for (let i = 0, il = this.meshes.length; i < il; i++) {
      const p = this.meshes[i].physics;
      if (p !== null && p !== void 0) {
        p.updateBones();
      }
    }
  }
}
const _quaternions = [];
let _quaternionIndex = 0;
function getQuaternion() {
  if (_quaternionIndex >= _quaternions.length) {
    _quaternions.push(new Quaternion());
  }
  return _quaternions[_quaternionIndex++];
}
const _grantResultMap = /* @__PURE__ */ new Map();
function updateOne(mesh, boneIndex, ikSolver, grantSolver) {
  const bones = mesh.skeleton.bones;
  const bonesData = mesh.geometry.userData.MMD.bones;
  const boneData = bonesData[boneIndex];
  const bone = bones[boneIndex];
  if (_grantResultMap.has(boneIndex))
    return;
  const quaternion = getQuaternion();
  _grantResultMap.set(boneIndex, quaternion.copy(bone.quaternion));
  if (grantSolver && boneData.grant && !boneData.grant.isLocal && boneData.grant.affectRotation) {
    const parentIndex = boneData.grant.parentIndex;
    const ratio = boneData.grant.ratio;
    if (!_grantResultMap.has(parentIndex)) {
      updateOne(mesh, parentIndex, ikSolver, grantSolver);
    }
    grantSolver.addGrantRotation(bone, _grantResultMap.get(parentIndex), ratio);
  }
  if (ikSolver && boneData.ik) {
    mesh.updateMatrixWorld(true);
    ikSolver.updateOne(boneData.ik);
    const links = boneData.ik.links;
    for (let i = 0, il = links.length; i < il; i++) {
      const link = links[i];
      if (link.enabled === false)
        continue;
      const linkIndex = link.index;
      if (_grantResultMap.has(linkIndex)) {
        _grantResultMap.set(linkIndex, _grantResultMap.get(linkIndex).copy(bones[linkIndex].quaternion));
      }
    }
  }
  quaternion.copy(bone.quaternion);
}
class AudioManager {
  /**
   * @param {THREE.Audio} audio
   * @param {Object} params - (optional)
   * @param {Nuumber} params.delayTime
   */
  constructor(audio, params = {}) {
    this.audio = audio;
    this.elapsedTime = 0;
    this.currentTime = 0;
    this.delayTime = params.delayTime !== void 0 ? params.delayTime : 0;
    this.audioDuration = this.audio.buffer.duration;
    this.duration = this.audioDuration + this.delayTime;
  }
  /**
   * @param {Number} delta
   * @return {AudioManager}
   */
  control(delta) {
    this.elapsed += delta;
    this.currentTime += delta;
    if (this._shouldStopAudio())
      this.audio.stop();
    if (this._shouldStartAudio())
      this.audio.play();
    return this;
  }
  // private methods
  _shouldStartAudio() {
    if (this.audio.isPlaying)
      return false;
    while (this.currentTime >= this.duration) {
      this.currentTime -= this.duration;
    }
    if (this.currentTime < this.delayTime)
      return false;
    if (this.currentTime - this.delayTime > this.audioDuration)
      return false;
    return true;
  }
  _shouldStopAudio() {
    return this.audio.isPlaying && this.currentTime >= this.duration;
  }
}
const _q = new Quaternion();
class GrantSolver {
  constructor(mesh, grants = []) {
    this.mesh = mesh;
    this.grants = grants;
  }
  /**
   * Solve all the grant bones
   * @return {GrantSolver}
   */
  update() {
    const grants = this.grants;
    for (let i = 0, il = grants.length; i < il; i++) {
      this.updateOne(grants[i]);
    }
    return this;
  }
  /**
   * Solve a grant bone
   * @param {Object} grant - grant parameter
   * @return {GrantSolver}
   */
  updateOne(grant) {
    const bones = this.mesh.skeleton.bones;
    const bone = bones[grant.index];
    const parentBone = bones[grant.parentIndex];
    if (grant.isLocal) {
      if (grant.affectPosition)
        ;
      if (grant.affectRotation)
        ;
    } else {
      if (grant.affectPosition)
        ;
      if (grant.affectRotation) {
        this.addGrantRotation(bone, parentBone.quaternion, grant.ratio);
      }
    }
    return this;
  }
  addGrantRotation(bone, q, ratio) {
    _q.set(0, 0, 0, 1);
    _q.slerp(q, ratio);
    bone.quaternion.multiply(_q);
    return this;
  }
}
export {
  MMDAnimationHelper
};
//# sourceMappingURL=MMDAnimationHelper.js.map
