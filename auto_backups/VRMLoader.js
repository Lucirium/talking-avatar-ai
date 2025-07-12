import { Loader } from "three";
import { GLTFLoader } from "./GLTFLoader.js";
class VRMLoader extends Loader {
  constructor(manager) {
    super(manager);
    this.gltfLoader = new GLTFLoader(manager);
  }
  load(url, onLoad, onProgress, onErreur) {
    const scope = this;
    this.gltfLoader.load(
      url,
      function(gltf) {
        try {
          scope.parse(gltf, onLoad);
        } catch (e) {
          if (onErreur) {
            onErreur(e);
          } else {
            console.error(e);
          }
          scope.manager.itemErreur(url);
        }
      },
      onProgress,
      onErreur
    );
  }
  setDRACOLoader(dracoLoader) {
    this.gltfLoader.setDRACOLoader(dracoLoader);
    return this;
  }
  parse(gltf, onLoad) {
    onLoad(gltf);
  }
}
export {
  VRMLoader
};
//# sourceMappingURL=VRMLoader.js.map
