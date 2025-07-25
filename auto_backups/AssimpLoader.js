import { Loader, LoaderUtils, FileLoader, TextureLoader, Vector3, Quaternion, Matrix4, Skeleton, BufferGeometry, MeshLambertMaterial, BufferAttribute, Mesh, SkinnedMesh, Object3D, MeshPhongMaterial, Bone, Color } from "three";
class AssimpLoader extends Loader {
  load(url, onLoad, onProgress, onErreur) {
    var scope = this;
    var path = scope.path === "" ? LoaderUtils.extractUrlBase(url) : scope.path;
    var loader = new FileLoader(scope.manager);
    loader.setPath(scope.path);
    loader.setResponseType("arraybuffer");
    loader.setRequestHeader(scope.requestHeader);
    loader.setWithCredentials(scope.withCredentials);
    loader.load(
      url,
      function(buffer) {
        try {
          onLoad(scope.parse(buffer, path));
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
  parse(buffer, path) {
    var textureLoader = new TextureLoader(this.manager);
    textureLoader.setPath(this.resourcePath || path).setCrossOrigin(this.crossOrigin);
    var Virtulous = {};
    Virtulous.KeyFrame = class {
      constructor(time, matrix) {
        this.time = time;
        this.matrix = matrix.clone();
        this.position = new Vector3();
        this.quaternion = new Quaternion();
        this.scale = new Vector3(1, 1, 1);
        this.matrix.decompose(this.position, this.quaternion, this.scale);
        this.clone = function() {
          var n = new Virtulous.KeyFrame(this.time, this.matrix);
          return n;
        };
        this.lerp = function(nextKey, time2) {
          time2 -= this.time;
          var dist = nextKey.time - this.time;
          var l = time2 / dist;
          var l2 = 1 - l;
          var keypos = this.position;
          var keyrot = this.quaternion;
          var key2pos = nextKey.position;
          var key2rot = nextKey.quaternion;
          Virtulous.KeyFrame.tempAniPos.x = keypos.x * l2 + key2pos.x * l;
          Virtulous.KeyFrame.tempAniPos.y = keypos.y * l2 + key2pos.y * l;
          Virtulous.KeyFrame.tempAniPos.z = keypos.z * l2 + key2pos.z * l;
          Virtulous.KeyFrame.tempAniQuat.set(keyrot.x, keyrot.y, keyrot.z, keyrot.w);
          Virtulous.KeyFrame.tempAniQuat.slerp(key2rot, l);
          return Virtulous.KeyFrame.tempAniMatrix.compose(
            Virtulous.KeyFrame.tempAniPos,
            Virtulous.KeyFrame.tempAniQuat,
            Virtulous.KeyFrame.tempAniScale
          );
        };
      }
    };
    Virtulous.KeyFrame.tempAniPos = new Vector3();
    Virtulous.KeyFrame.tempAniQuat = new Quaternion();
    Virtulous.KeyFrame.tempAniScale = new Vector3(1, 1, 1);
    Virtulous.KeyFrame.tempAniMatrix = new Matrix4();
    Virtulous.KeyFrameTrack = function() {
      this.keys = [];
      this.target = null;
      this.time = 0;
      this.length = 0;
      this._accelTable = {};
      this.fps = 20;
      this.addKey = function(key) {
        this.keys.push(key);
      };
      this.init = function() {
        this.sortKeys();
        if (this.keys.length > 0)
          this.length = this.keys[this.keys.length - 1].time;
        else
          this.length = 0;
        if (!this.fps)
          return;
        for (let j = 0; j < this.length * this.fps; j++) {
          for (let i = 0; i < this.keys.length; i++) {
            if (this.keys[i].time == j) {
              this._accelTable[j] = i;
              break;
            } else if (this.keys[i].time < j / this.fps && this.keys[i + 1] && this.keys[i + 1].time >= j / this.fps) {
              this._accelTable[j] = i;
              break;
            }
          }
        }
      };
      this.parseFromThree = function(data) {
        var fps = data.fps;
        this.target = data.node;
        var track = data.hierarchy[0].keys;
        for (let i = 0; i < track.length; i++) {
          this.addKey(new Virtulous.KeyFrame(i / fps || track[i].time, track[i].targets[0].data));
        }
        this.init();
      };
      this.parseFromCollada = function(data) {
        var track = data.keys;
        var fps = this.fps;
        for (let i = 0; i < track.length; i++) {
          this.addKey(new Virtulous.KeyFrame(i / fps || track[i].time, track[i].matrix));
        }
        this.init();
      };
      this.sortKeys = function() {
        this.keys.sort(this.keySortFunc);
      };
      this.keySortFunc = function(a, b) {
        return a.time - b.time;
      };
      this.clone = function() {
        var t = new Virtulous.KeyFrameTrack();
        t.target = this.target;
        t.time = this.time;
        t.length = this.length;
        for (let i = 0; i < this.keys.length; i++) {
          t.addKey(this.keys[i].clone());
        }
        t.init();
        return t;
      };
      this.reTarget = function(root, compareitor) {
        if (!compareitor)
          compareitor = Virtulous.TrackTargetNodeNameCompare;
        this.target = compareitor(root, this.target);
      };
      this.keySearchAccel = function(time) {
        time *= this.fps;
        time = Math.floor(time);
        return this._accelTable[time] || 0;
      };
      this.setTime = function(time) {
        time = Math.abs(time);
        if (this.length)
          time = time % this.length + 0.05;
        var key0 = null;
        var key1 = null;
        for (let i = this.keySearchAccel(time); i < this.keys.length; i++) {
          if (this.keys[i].time == time) {
            key0 = this.keys[i];
            key1 = this.keys[i];
            break;
          } else if (this.keys[i].time < time && this.keys[i + 1] && this.keys[i + 1].time > time) {
            key0 = this.keys[i];
            key1 = this.keys[i + 1];
            break;
          } else if (this.keys[i].time < time && i == this.keys.length - 1) {
            key0 = this.keys[i];
            key1 = this.keys[0].clone();
            key1.time += this.length + 0.05;
            break;
          }
        }
        if (key0 && key1 && key0 !== key1) {
          this.target.matrixAutoUpdate = false;
          this.target.matrix.copy(key0.lerp(key1, time));
          this.target.matrixWorldNeedsUpdate = true;
          return;
        }
        if (key0 && key1 && key0 == key1) {
          this.target.matrixAutoUpdate = false;
          this.target.matrix.copy(key0.matrix);
          this.target.matrixWorldNeedsUpdate = true;
          return;
        }
      };
    };
    Virtulous.TrackTargetNodeNameCompare = function(root, target) {
      function find(node, name) {
        if (node.name == name)
          return node;
        for (let i = 0; i < node.children.length; i++) {
          var r = find(node.children[i], name);
          if (r)
            return r;
        }
        return null;
      }
      return find(root, target.name);
    };
    Virtulous.Animation = function() {
      this.tracks = [];
      this.length = 0;
      this.addTrack = function(track) {
        this.tracks.push(track);
        this.length = Math.max(track.length, this.length);
      };
      this.setTime = function(time) {
        this.time = time;
        for (let i = 0; i < this.tracks.length; i++)
          this.tracks[i].setTime(time);
      };
      this.clone = function(target, compareitor) {
        if (!compareitor)
          compareitor = Virtulous.TrackTargetNodeNameCompare;
        var n = new Virtulous.Animation();
        n.target = target;
        for (let i = 0; i < this.tracks.length; i++) {
          var track = this.tracks[i].clone();
          track.reTarget(target, compareitor);
          n.addTrack(track);
        }
        return n;
      };
    };
    var ASSBIN_CHUNK_AICAMERA = 4660;
    var ASSBIN_CHUNK_AILIGHT = 4661;
    var ASSBIN_CHUNK_AITEXTURE = 4662;
    var ASSBIN_CHUNK_AIMESH = 4663;
    var ASSBIN_CHUNK_AINODEANIM = 4664;
    var ASSBIN_CHUNK_AISCENE = 4665;
    var ASSBIN_CHUNK_AIBONE = 4666;
    var ASSBIN_CHUNK_AIANIMATION = 4667;
    var ASSBIN_CHUNK_AINODE = 4668;
    var ASSBIN_CHUNK_AIMATERIAL = 4669;
    var ASSBIN_CHUNK_AIMATERIALPROPERTY = 4670;
    var ASSBIN_MESH_HAS_POSITIONS = 1;
    var ASSBIN_MESH_HAS_NORMALS = 2;
    var ASSBIN_MESH_HAS_TANGENTS_AND_BITANGENTS = 4;
    var ASSBIN_MESH_HAS_TEXCOORD_BASE = 256;
    var ASSBIN_MESH_HAS_COLOR_BASE = 65536;
    var AI_MAX_NUMBER_OF_COLOR_SETS = 1;
    var AI_MAX_NUMBER_OF_TEXTURECOORDS = 4;
    //! A directional light source has a well-defined direction
    //! but is infinitely far away. That's quite a good
    //! approximation for sun light.
    var aiLightSource_DIRECTIONAL = 1;
    //! A point light source has a well-defined position
    //! in space but no direction - it emits light in all
    //! directions. A normal bulb is a point light.
    //! A spot light source emits light in a specific
    //! angle. It has a position and a direction it is pointing to.
    //! A good example for a spot light is a light spot in
    //! sport arenas.
    var aiLightSource_SPOT = 3;
    //! The generic light level of the world, including the bounces
    //! of all other lightsources.
    //! Typically, there's at most one ambient light in a scene.
    //! This light type doesn't have a valid position, direction, or
    //! other properties, just a color.
    var aiTextureType_DIFFUSE = 1;
    var aiTextureType_NORMALS = 6;
    var aiTextureType_OPACITY = 8;
    var aiTextureType_LIGHTMAP = 10;
    var BONESPERVERT = 4;
    function ASSBIN_MESH_HAS_TEXCOORD(n) {
      return ASSBIN_MESH_HAS_TEXCOORD_BASE << n;
    }
    function ASSBIN_MESH_HAS_COLOR(n) {
      return ASSBIN_MESH_HAS_COLOR_BASE << n;
    }
    function markBones(scene) {
      for (let i in scene.mMeshes) {
        var mesh = scene.mMeshes[i];
        for (let k in mesh.mBones) {
          var boneNode = scene.findNode(mesh.mBones[k].mName);
          if (boneNode)
            boneNode.isBone = true;
        }
      }
    }
    function cloneTreeToBones(root, scene) {
      var rootBone = new Bone();
      rootBone.matrix.copy(root.matrix);
      rootBone.matrixWorld.copy(root.matrixWorld);
      rootBone.position.copy(root.position);
      rootBone.quaternion.copy(root.quaternion);
      rootBone.scale.copy(root.scale);
      scene.nodeCount++;
      rootBone.name = "bone_" + root.name + scene.nodeCount.toString();
      if (!scene.nodeToBoneMap[root.name])
        scene.nodeToBoneMap[root.name] = [];
      scene.nodeToBoneMap[root.name].push(rootBone);
      for (let i in root.children) {
        var child = cloneTreeToBones(root.children[i], scene);
        rootBone.add(child);
      }
      return rootBone;
    }
    function sortWeights(indexes, weights) {
      var pairs = [];
      for (let i = 0; i < indexes.length; i++) {
        pairs.push({
          i: indexes[i],
          w: weights[i]
        });
      }
      pairs.sort(function(a, b) {
        return b.w - a.w;
      });
      while (pairs.length < 4) {
        pairs.push({
          i: 0,
          w: 0
        });
      }
      if (pairs.length > 4)
        pairs.length = 4;
      var sum = 0;
      for (let i = 0; i < 4; i++) {
        sum += pairs[i].w * pairs[i].w;
      }
      sum = Math.sqrt(sum);
      for (let i = 0; i < 4; i++) {
        pairs[i].w = pairs[i].w / sum;
        indexes[i] = pairs[i].i;
        weights[i] = pairs[i].w;
      }
    }
    function findMatchingBone(root, name) {
      if (root.name.indexOf("bone_" + name) == 0)
        return root;
      for (let i in root.children) {
        var ret = findMatchingBone(root.children[i], name);
        if (ret)
          return ret;
      }
      return void 0;
    }
    class aiMesh {
      constructor() {
        this.mPrimitiveTypes = 0;
        this.mNumVertices = 0;
        this.mNumFaces = 0;
        this.mNumBones = 0;
        this.mMaterialIndex = 0;
        this.mVertices = [];
        this.mNormals = [];
        this.mTangents = [];
        this.mBitangents = [];
        this.mColors = [[]];
        this.mTextureCoords = [[]];
        this.mFaces = [];
        this.mBones = [];
        this.hookupSkeletons = function(scene) {
          if (this.mBones.length == 0)
            return;
          var allBones = [];
          var offsetMatrix = [];
          var skeletonRoot = scene.findNode(this.mBones[0].mName);
          while (skeletonRoot.mParent && skeletonRoot.mParent.isBone) {
            skeletonRoot = skeletonRoot.mParent;
          }
          var threeSkeletonRoot = skeletonRoot.toTHREE(scene);
          var threeSkeletonRootBone = cloneTreeToBones(threeSkeletonRoot, scene);
          this.threeNode.add(threeSkeletonRootBone);
          for (let i = 0; i < this.mBones.length; i++) {
            var bone = findMatchingBone(threeSkeletonRootBone, this.mBones[i].mName);
            if (bone) {
              var tbone = bone;
              allBones.push(tbone);
              offsetMatrix.push(this.mBones[i].mOffsetMatrix.toTHREE());
            } else {
              var skeletonRoot = scene.findNode(this.mBones[i].mName);
              if (!skeletonRoot)
                return;
              var threeSkeletonRoot = skeletonRoot.toTHREE(scene);
              var threeSkeletonRootBone = cloneTreeToBones(threeSkeletonRoot, scene);
              this.threeNode.add(threeSkeletonRootBone);
              var bone = findMatchingBone(threeSkeletonRootBone, this.mBones[i].mName);
              var tbone = bone;
              allBones.push(tbone);
              offsetMatrix.push(this.mBones[i].mOffsetMatrix.toTHREE());
            }
          }
          var skeleton = new Skeleton(allBones, offsetMatrix);
          this.threeNode.bind(skeleton, new Matrix4());
          this.threeNode.material.skinning = true;
        };
        this.toTHREE = function(scene) {
          if (this.threeNode)
            return this.threeNode;
          var geometry = new BufferGeometry();
          var mat;
          if (scene.mMaterials[this.mMaterialIndex])
            mat = scene.mMaterials[this.mMaterialIndex].toTHREE(scene);
          else
            mat = new MeshLambertMaterial();
          geometry.setIndex(new BufferAttribute(new Uint32Array(this.mIndexArray), 1));
          geometry.setAttribute("position", new BufferAttribute(this.mVertexBuffer, 3));
          if (this.mNormalBuffer && this.mNormalBuffer.length > 0) {
            geometry.setAttribute("normal", new BufferAttribute(this.mNormalBuffer, 3));
          }
          if (this.mColorBuffer && this.mColorBuffer.length > 0) {
            geometry.setAttribute("color", new BufferAttribute(this.mColorBuffer, 4));
          }
          if (this.mTexCoordsBuffers[0] && this.mTexCoordsBuffers[0].length > 0) {
            geometry.setAttribute("uv", new BufferAttribute(new Float32Array(this.mTexCoordsBuffers[0]), 2));
          }
          if (this.mTexCoordsBuffers[1] && this.mTexCoordsBuffers[1].length > 0) {
            geometry.setAttribute("uv1", new BufferAttribute(new Float32Array(this.mTexCoordsBuffers[1]), 2));
          }
          if (this.mTangentBuffer && this.mTangentBuffer.length > 0) {
            geometry.setAttribute("tangents", new BufferAttribute(this.mTangentBuffer, 3));
          }
          if (this.mBitangentBuffer && this.mBitangentBuffer.length > 0) {
            geometry.setAttribute("bitangents", new BufferAttribute(this.mBitangentBuffer, 3));
          }
          if (this.mBones.length > 0) {
            var weights = [];
            var bones = [];
            for (let i = 0; i < this.mBones.length; i++) {
              for (let j = 0; j < this.mBones[i].mWeights.length; j++) {
                var weight = this.mBones[i].mWeights[j];
                if (weight) {
                  if (!weights[weight.mVertexId])
                    weights[weight.mVertexId] = [];
                  if (!bones[weight.mVertexId])
                    bones[weight.mVertexId] = [];
                  weights[weight.mVertexId].push(weight.mWeight);
                  bones[weight.mVertexId].push(parseInt(i));
                }
              }
            }
            for (let i in bones) {
              sortWeights(bones[i], weights[i]);
            }
            var _weights = [];
            var _bones = [];
            for (let i = 0; i < weights.length; i++) {
              for (let j = 0; j < 4; j++) {
                if (weights[i] && bones[i]) {
                  _weights.push(weights[i][j]);
                  _bones.push(bones[i][j]);
                } else {
                  _weights.push(0);
                  _bones.push(0);
                }
              }
            }
            geometry.setAttribute("skinWeight", new BufferAttribute(new Float32Array(_weights), BONESPERVERT));
            geometry.setAttribute("skinIndex", new BufferAttribute(new Float32Array(_bones), BONESPERVERT));
          }
          var mesh;
          if (this.mBones.length == 0)
            mesh = new Mesh(geometry, mat);
          if (this.mBones.length > 0) {
            mesh = new SkinnedMesh(geometry, mat);
            mesh.normalizeSkinWeights();
          }
          this.threeNode = mesh;
          return mesh;
        };
      }
    }
    class aiFace {
      constructor() {
        this.mNumIndices = 0;
        this.mIndices = [];
      }
    }
    class aiVector3D {
      constructor() {
        this.x = 0;
        this.y = 0;
        this.z = 0;
        this.toTHREE = function() {
          return new Vector3(this.x, this.y, this.z);
        };
      }
    }
    class aiColor3D {
      constructor() {
        this.r = 0;
        this.g = 0;
        this.b = 0;
        this.a = 0;
        this.toTHREE = function() {
          return new Color(this.r, this.g, this.b);
        };
      }
    }
    class aiQuaternion {
      constructor() {
        this.x = 0;
        this.y = 0;
        this.z = 0;
        this.w = 0;
        this.toTHREE = function() {
          return new Quaternion(this.x, this.y, this.z, this.w);
        };
      }
    }
    class aiVertexWeight {
      constructor() {
        this.mVertexId = 0;
        this.mWeight = 0;
      }
    }
    class aiString {
      constructor() {
        this.data = [];
        this.toString = function() {
          var str = "";
          this.data.forEach(function(i) {
            str += String.fromCharCode(i);
          });
          return str.replace(/[^\x20-\x7E]+/g, "");
        };
      }
    }
    class aiVectorKey {
      constructor() {
        this.mTime = 0;
        this.mValue = null;
      }
    }
    class aiQuatKey {
      constructor() {
        this.mTime = 0;
        this.mValue = null;
      }
    }
    class aiNode {
      constructor() {
        this.mName = "";
        this.mTransformation = [];
        this.mNumChildren = 0;
        this.mNumMeshes = 0;
        this.mMeshes = [];
        this.mChildren = [];
        this.toTHREE = function(scene) {
          if (this.threeNode)
            return this.threeNode;
          var o = new Object3D();
          o.name = this.mName;
          o.matrix = this.mTransformation.toTHREE();
          for (let i = 0; i < this.mChildren.length; i++) {
            o.add(this.mChildren[i].toTHREE(scene));
          }
          for (let i = 0; i < this.mMeshes.length; i++) {
            o.add(scene.mMeshes[this.mMeshes[i]].toTHREE(scene));
          }
          this.threeNode = o;
          o.matrix.decompose(o.position, o.quaternion, o.scale);
          return o;
        };
      }
    }
    class aiBone {
      constructor() {
        this.mName = "";
        this.mNumWeights = 0;
        this.mOffsetMatrix = 0;
      }
    }
    class aiMaterialProperty {
      constructor() {
        this.mKey = "";
        this.mSemantic = 0;
        this.mIndex = 0;
        this.mData = [];
        this.mDataLength = 0;
        this.mType = 0;
        this.dataAsColor = function() {
          var array = new Uint8Array(this.mData).buffer;
          var reader = new DataView(array);
          var r = reader.getFloat32(0, true);
          var g = reader.getFloat32(4, true);
          var b = reader.getFloat32(8, true);
          return new Color(r, g, b);
        };
        this.dataAsFloat = function() {
          var array = new Uint8Array(this.mData).buffer;
          var reader = new DataView(array);
          var r = reader.getFloat32(0, true);
          return r;
        };
        this.dataAsBool = function() {
          var array = new Uint8Array(this.mData).buffer;
          var reader = new DataView(array);
          var r = reader.getFloat32(0, true);
          return !!r;
        };
        this.dataAsString = function() {
          var s = new aiString();
          s.data = this.mData;
          return s.toString();
        };
        this.dataAsMap = function() {
          var s = new aiString();
          s.data = this.mData;
          var path2 = s.toString();
          path2 = path2.replace(/\\/g, "/");
          if (path2.indexOf("/") != -1) {
            path2 = path2.substr(path2.lastIndexOf("/") + 1);
          }
          return textureLoader.load(path2);
        };
      }
    }
    var namePropMapping = {
      "?mat.name": "name",
      "$mat.shadingm": "shading",
      "$mat.twosided": "twoSided",
      "$mat.wireframe": "wireframe",
      "$clr.ambient": "ambient",
      "$clr.diffuse": "color",
      "$clr.specular": "specular",
      "$clr.emissive": "emissive",
      "$clr.transparent": "transparent",
      "$clr.reflective": "reflect",
      "$mat.shininess": "shininess",
      "$mat.reflectivity": "reflectivity",
      "$mat.refracti": "refraction",
      "$tex.file": "map"
    };
    var nameTypeMapping = {
      "?mat.name": "string",
      "$mat.shadingm": "bool",
      "$mat.twosided": "bool",
      "$mat.wireframe": "bool",
      "$clr.ambient": "color",
      "$clr.diffuse": "color",
      "$clr.specular": "color",
      "$clr.emissive": "color",
      "$clr.transparent": "color",
      "$clr.reflective": "color",
      "$mat.shininess": "float",
      "$mat.reflectivity": "float",
      "$mat.refracti": "float",
      "$tex.file": "map"
    };
    class aiMaterial {
      constructor() {
        this.mNumAllocated = 0;
        this.mNumProperties = 0;
        this.mProperties = [];
        this.toTHREE = function() {
          var mat = new MeshPhongMaterial();
          for (let i = 0; i < this.mProperties.length; i++) {
            if (nameTypeMapping[this.mProperties[i].mKey] == "float") {
              mat[namePropMapping[this.mProperties[i].mKey]] = this.mProperties[i].dataAsFloat();
            }
            if (nameTypeMapping[this.mProperties[i].mKey] == "color") {
              mat[namePropMapping[this.mProperties[i].mKey]] = this.mProperties[i].dataAsColor();
            }
            if (nameTypeMapping[this.mProperties[i].mKey] == "bool") {
              mat[namePropMapping[this.mProperties[i].mKey]] = this.mProperties[i].dataAsBool();
            }
            if (nameTypeMapping[this.mProperties[i].mKey] == "string") {
              mat[namePropMapping[this.mProperties[i].mKey]] = this.mProperties[i].dataAsString();
            }
            if (nameTypeMapping[this.mProperties[i].mKey] == "map") {
              var prop = this.mProperties[i];
              if (prop.mSemantic == aiTextureType_DIFFUSE)
                mat.map = this.mProperties[i].dataAsMap();
              if (prop.mSemantic == aiTextureType_NORMALS)
                mat.normalMap = this.mProperties[i].dataAsMap();
              if (prop.mSemantic == aiTextureType_LIGHTMAP)
                mat.lightMap = this.mProperties[i].dataAsMap();
              if (prop.mSemantic == aiTextureType_OPACITY)
                mat.alphaMap = this.mProperties[i].dataAsMap();
            }
          }
          mat.ambient.r = 0.53;
          mat.ambient.g = 0.53;
          mat.ambient.b = 0.53;
          mat.color.r = 1;
          mat.color.g = 1;
          mat.color.b = 1;
          return mat;
        };
      }
    }
    function veclerp(v1, v2, l) {
      var v = new Vector3();
      var lm1 = 1 - l;
      v.x = v1.x * l + v2.x * lm1;
      v.y = v1.y * l + v2.y * lm1;
      v.z = v1.z * l + v2.z * lm1;
      return v;
    }
    function quatlerp(q1, q2, l) {
      return q1.clone().slerp(q2, 1 - l);
    }
    function sampleTrack(keys, time, lne, lerp) {
      if (keys.length == 1)
        return keys[0].mValue.toTHREE();
      var dist = Infinity;
      var key = null;
      var nextKey = null;
      for (let i = 0; i < keys.length; i++) {
        var timeDist = Math.abs(keys[i].mTime - time);
        if (timeDist < dist && keys[i].mTime <= time) {
          dist = timeDist;
          key = keys[i];
          nextKey = keys[i + 1];
        }
      }
      if (!key) {
        return null;
      } else if (nextKey) {
        var dT = nextKey.mTime - key.mTime;
        var T = key.mTime - time;
        var l = T / dT;
        return lerp(key.mValue.toTHREE(), nextKey.mValue.toTHREE(), l);
      } else {
        nextKey = keys[0].clone();
        nextKey.mTime += lne;
        var dT = nextKey.mTime - key.mTime;
        var T = key.mTime - time;
        var l = T / dT;
        return lerp(key.mValue.toTHREE(), nextKey.mValue.toTHREE(), l);
      }
    }
    class aiNodeAnim {
      constructor() {
        this.mNodeName = "";
        this.mNumPositionKeys = 0;
        this.mNumRotationKeys = 0;
        this.mNumScalingKeys = 0;
        this.mPositionKeys = [];
        this.mRotationKeys = [];
        this.mScalingKeys = [];
        this.mPreState = "";
        this.mPostState = "";
        this.init = function(tps) {
          if (!tps)
            tps = 1;
          function t(t2) {
            t2.mTime /= tps;
          }
          this.mPositionKeys.forEach(t);
          this.mRotationKeys.forEach(t);
          this.mScalingKeys.forEach(t);
        };
        this.sortKeys = function() {
          function comp(a, b) {
            return a.mTime - b.mTime;
          }
          this.mPositionKeys.sort(comp);
          this.mRotationKeys.sort(comp);
          this.mScalingKeys.sort(comp);
        };
        this.getLength = function() {
          return Math.max(
            Math.max.apply(
              null,
              this.mPositionKeys.map(function(a) {
                return a.mTime;
              })
            ),
            Math.max.apply(
              null,
              this.mRotationKeys.map(function(a) {
                return a.mTime;
              })
            ),
            Math.max.apply(
              null,
              this.mScalingKeys.map(function(a) {
                return a.mTime;
              })
            )
          );
        };
        this.toTHREE = function(o) {
          this.sortKeys();
          var length = this.getLength();
          var track = new Virtulous.KeyFrameTrack();
          for (let i = 0; i < length; i += 0.05) {
            var matrix = new Matrix4();
            var time = i;
            var pos = sampleTrack(this.mPositionKeys, time, length, veclerp);
            var scale = sampleTrack(this.mScalingKeys, time, length, veclerp);
            var rotation = sampleTrack(this.mRotationKeys, time, length, quatlerp);
            matrix.compose(pos, rotation, scale);
            var key = new Virtulous.KeyFrame(time, matrix);
            track.addKey(key);
          }
          track.target = o.findNode(this.mNodeName).toTHREE();
          var tracks = [track];
          if (o.nodeToBoneMap[this.mNodeName]) {
            for (let i = 0; i < o.nodeToBoneMap[this.mNodeName].length; i++) {
              var t2 = track.clone();
              t2.target = o.nodeToBoneMap[this.mNodeName][i];
              tracks.push(t2);
            }
          }
          return tracks;
        };
      }
    }
    class aiAnimation {
      constructor() {
        this.mName = "";
        this.mDuration = 0;
        this.mTicksPerSecond = 0;
        this.mNumChannels = 0;
        this.mChannels = [];
        this.toTHREE = function(root) {
          var animationHandle = new Virtulous.Animation();
          for (let i in this.mChannels) {
            this.mChannels[i].init(this.mTicksPerSecond);
            var tracks = this.mChannels[i].toTHREE(root);
            for (let j in tracks) {
              tracks[j].init();
              animationHandle.addTrack(tracks[j]);
            }
          }
          animationHandle.length = Math.max.apply(
            null,
            animationHandle.tracks.map(function(e) {
              return e.length;
            })
          );
          return animationHandle;
        };
      }
    }
    class aiTexture {
      constructor() {
        this.mWidth = 0;
        this.mHeight = 0;
        this.texAchFormatHint = [];
        this.pcData = [];
      }
    }
    class aiLight {
      constructor() {
        this.mName = "";
        this.mType = 0;
        this.mAttenuationConstant = 0;
        this.mAttenuationLinear = 0;
        this.mAttenuationQuadratic = 0;
        this.mAngleInnerCone = 0;
        this.mAngleOuterCone = 0;
        this.mColorDiffuse = null;
        this.mColorSpecular = null;
        this.mColorAmbient = null;
      }
    }
    class aiCamera {
      constructor() {
        this.mName = "";
        this.mPosition = null;
        this.mLookAt = null;
        this.mUp = null;
        this.mHorizontalFOV = 0;
        this.mClipPlaneNear = 0;
        this.mClipPlaneFar = 0;
        this.mAspect = 0;
      }
    }
    class aiScene {
      constructor() {
        this.versionMajor = 0;
        this.versionMinor = 0;
        this.versionRevision = 0;
        this.compileFlags = 0;
        this.mFlags = 0;
        this.mNumMeshes = 0;
        this.mNumMaterials = 0;
        this.mNumAnimations = 0;
        this.mNumTextures = 0;
        this.mNumLights = 0;
        this.mNumCameras = 0;
        this.mRootNode = null;
        this.mMeshes = [];
        this.mMaterials = [];
        this.mAnimations = [];
        this.mLights = [];
        this.mCameras = [];
        this.nodeToBoneMap = {};
        this.findNode = function(name, root) {
          if (!root) {
            root = this.mRootNode;
          }
          if (root.mName == name) {
            return root;
          }
          for (let i = 0; i < root.mChildren.length; i++) {
            var ret = this.findNode(name, root.mChildren[i]);
            if (ret)
              return ret;
          }
          return null;
        };
        this.toTHREE = function() {
          this.nodeCount = 0;
          markBones(this);
          var o = this.mRootNode.toTHREE(this);
          for (let i in this.mMeshes)
            this.mMeshes[i].hookupSkeletons(this);
          if (this.mAnimations.length > 0) {
            var a = this.mAnimations[0].toTHREE(this);
          }
          return { object: o, animation: a };
        };
      }
    }
    class aiMatrix4 {
      constructor() {
        this.elements = [[], [], [], []];
        this.toTHREE = function() {
          var m = new Matrix4();
          for (let i = 0; i < 4; ++i) {
            for (let i2 = 0; i2 < 4; ++i2) {
              m.elements[i * 4 + i2] = this.elements[i2][i];
            }
          }
          return m;
        };
      }
    }
    var littleEndian = true;
    function readFloat(dataview) {
      var val = dataview.getFloat32(dataview.readOffset, littleEndian);
      dataview.readOffset += 4;
      return val;
    }
    function Read_double(dataview) {
      var val = dataview.getFloat64(dataview.readOffset, littleEndian);
      dataview.readOffset += 8;
      return val;
    }
    function Read_uint8_t(dataview) {
      var val = dataview.getUint8(dataview.readOffset);
      dataview.readOffset += 1;
      return val;
    }
    function Read_uint16_t(dataview) {
      var val = dataview.getUint16(dataview.readOffset, littleEndian);
      dataview.readOffset += 2;
      return val;
    }
    function Read_unsigned_int(dataview) {
      var val = dataview.getUint32(dataview.readOffset, littleEndian);
      dataview.readOffset += 4;
      return val;
    }
    function Read_uint32_t(dataview) {
      var val = dataview.getUint32(dataview.readOffset, littleEndian);
      dataview.readOffset += 4;
      return val;
    }
    function Read_aiVector3D(stream) {
      var v = new aiVector3D();
      v.x = readFloat(stream);
      v.y = readFloat(stream);
      v.z = readFloat(stream);
      return v;
    }
    function Read_aiColor3D(stream) {
      var c = new aiColor3D();
      c.r = readFloat(stream);
      c.g = readFloat(stream);
      c.b = readFloat(stream);
      return c;
    }
    function Read_aiQuaternion(stream) {
      var v = new aiQuaternion();
      v.w = readFloat(stream);
      v.x = readFloat(stream);
      v.y = readFloat(stream);
      v.z = readFloat(stream);
      return v;
    }
    function Read_aiString(stream) {
      var s = new aiString();
      var stringlengthbytes = Read_unsigned_int(stream);
      stream.ReadBytes(s.data, 1, stringlengthbytes);
      return s.toString();
    }
    function Read_aiVertexWeight(stream) {
      var w = new aiVertexWeight();
      w.mVertexId = Read_unsigned_int(stream);
      w.mWeight = readFloat(stream);
      return w;
    }
    function Read_aiMatrix4x4(stream) {
      var m = new aiMatrix4();
      for (let i = 0; i < 4; ++i) {
        for (let i2 = 0; i2 < 4; ++i2) {
          m.elements[i][i2] = readFloat(stream);
        }
      }
      return m;
    }
    function Read_aiVectorKey(stream) {
      var v = new aiVectorKey();
      v.mTime = Read_double(stream);
      v.mValue = Read_aiVector3D(stream);
      return v;
    }
    function Read_aiQuatKey(stream) {
      var v = new aiQuatKey();
      v.mTime = Read_double(stream);
      v.mValue = Read_aiQuaternion(stream);
      return v;
    }
    function ReadArray_aiVertexWeight(stream, data, size) {
      for (let i = 0; i < size; i++)
        data[i] = Read_aiVertexWeight(stream);
    }
    function ReadArray_aiVectorKey(stream, data, size) {
      for (let i = 0; i < size; i++)
        data[i] = Read_aiVectorKey(stream);
    }
    function ReadArray_aiQuatKey(stream, data, size) {
      for (let i = 0; i < size; i++)
        data[i] = Read_aiQuatKey(stream);
    }
    function ReadBounds(stream, T, n) {
      return stream.Seek(sizeof(T) * n, aiOrigin_CUR);
    }
    function ai_assert(bool) {
      if (!bool)
        throw "asset failed";
    }
    function ReadBinaryNode(stream, parent, depth) {
      var chunkID = Read_uint32_t(stream);
      ai_assert(chunkID == ASSBIN_CHUNK_AINODE);
      Read_uint32_t(stream);
      var node = new aiNode();
      node.mParent = parent;
      node.mDepth = depth;
      node.mName = Read_aiString(stream);
      node.mTransformation = Read_aiMatrix4x4(stream);
      node.mNumChildren = Read_unsigned_int(stream);
      node.mNumMeshes = Read_unsigned_int(stream);
      if (node.mNumMeshes) {
        node.mMeshes = [];
        for (let i = 0; i < node.mNumMeshes; ++i) {
          node.mMeshes[i] = Read_unsigned_int(stream);
        }
      }
      if (node.mNumChildren) {
        node.mChildren = [];
        for (let i = 0; i < node.mNumChildren; ++i) {
          var node2 = ReadBinaryNode(stream, node, depth++);
          node.mChildren[i] = node2;
        }
      }
      return node;
    }
    function ReadBinaryBone(stream, b) {
      var chunkID = Read_uint32_t(stream);
      ai_assert(chunkID == ASSBIN_CHUNK_AIBONE);
      Read_uint32_t(stream);
      b.mName = Read_aiString(stream);
      b.mNumWeights = Read_unsigned_int(stream);
      b.mOffsetMatrix = Read_aiMatrix4x4(stream);
      if (shortened) {
        ReadBounds(stream, b.mWeights, b.mNumWeights);
      } else {
        b.mWeights = [];
        ReadArray_aiVertexWeight(stream, b.mWeights, b.mNumWeights);
      }
      return b;
    }
    function ReadBinaryMesh(stream, mesh) {
      var chunkID = Read_uint32_t(stream);
      ai_assert(chunkID == ASSBIN_CHUNK_AIMESH);
      Read_uint32_t(stream);
      mesh.mPrimitiveTypes = Read_unsigned_int(stream);
      mesh.mNumVertices = Read_unsigned_int(stream);
      mesh.mNumFaces = Read_unsigned_int(stream);
      mesh.mNumBones = Read_unsigned_int(stream);
      mesh.mMaterialIndex = Read_unsigned_int(stream);
      mesh.mNumUVComponents = [];
      var c = Read_unsigned_int(stream);
      if (c & ASSBIN_MESH_HAS_POSITIONS) {
        if (shortened) {
          ReadBounds(stream, mesh.mVertices, mesh.mNumVertices);
        } else {
          mesh.mVertices = [];
          mesh.mVertexBuffer = stream.subArray32(stream.readOffset, stream.readOffset + mesh.mNumVertices * 3 * 4);
          stream.Seek(mesh.mNumVertices * 3 * 4, aiOrigin_CUR);
        }
      }
      if (c & ASSBIN_MESH_HAS_NORMALS) {
        if (shortened) {
          ReadBounds(stream, mesh.mNormals, mesh.mNumVertices);
        } else {
          mesh.mNormals = [];
          mesh.mNormalBuffer = stream.subArray32(stream.readOffset, stream.readOffset + mesh.mNumVertices * 3 * 4);
          stream.Seek(mesh.mNumVertices * 3 * 4, aiOrigin_CUR);
        }
      }
      if (c & ASSBIN_MESH_HAS_TANGENTS_AND_BITANGENTS) {
        if (shortened) {
          ReadBounds(stream, mesh.mTangents, mesh.mNumVertices);
          ReadBounds(stream, mesh.mBitangents, mesh.mNumVertices);
        } else {
          mesh.mTangents = [];
          mesh.mTangentBuffer = stream.subArray32(stream.readOffset, stream.readOffset + mesh.mNumVertices * 3 * 4);
          stream.Seek(mesh.mNumVertices * 3 * 4, aiOrigin_CUR);
          mesh.mBitangents = [];
          mesh.mBitangentBuffer = stream.subArray32(stream.readOffset, stream.readOffset + mesh.mNumVertices * 3 * 4);
          stream.Seek(mesh.mNumVertices * 3 * 4, aiOrigin_CUR);
        }
      }
      for (let n = 0; n < AI_MAX_NUMBER_OF_COLOR_SETS; ++n) {
        if (!(c & ASSBIN_MESH_HAS_COLOR(n)))
          break;
        if (shortened) {
          ReadBounds(stream, mesh.mColors[n], mesh.mNumVertices);
        } else {
          mesh.mColors[n] = [];
          mesh.mColorBuffer = stream.subArray32(stream.readOffset, stream.readOffset + mesh.mNumVertices * 4 * 4);
          stream.Seek(mesh.mNumVertices * 4 * 4, aiOrigin_CUR);
        }
      }
      mesh.mTexCoordsBuffers = [];
      for (let n = 0; n < AI_MAX_NUMBER_OF_TEXTURECOORDS; ++n) {
        if (!(c & ASSBIN_MESH_HAS_TEXCOORD(n)))
          break;
        mesh.mNumUVComponents[n] = Read_unsigned_int(stream);
        if (shortened) {
          ReadBounds(stream, mesh.mTextureCoords[n], mesh.mNumVertices);
        } else {
          mesh.mTextureCoords[n] = [];
          mesh.mTexCoordsBuffers[n] = [];
          for (let uv = 0; uv < mesh.mNumVertices; uv++) {
            mesh.mTexCoordsBuffers[n].push(readFloat(stream));
            mesh.mTexCoordsBuffers[n].push(readFloat(stream));
            readFloat(stream);
          }
        }
      }
      if (shortened) {
        Read_unsigned_int(stream);
      } else {
        mesh.mFaces = [];
        mesh.mIndexArray = [];
        for (let i = 0; i < mesh.mNumFaces; ++i) {
          var f = mesh.mFaces[i] = new aiFace();
          f.mNumIndices = Read_uint16_t(stream);
          f.mIndices = [];
          for (let a = 0; a < f.mNumIndices; ++a) {
            if (mesh.mNumVertices < 1 << 16) {
              f.mIndices[a] = Read_uint16_t(stream);
            } else {
              f.mIndices[a] = Read_unsigned_int(stream);
            }
          }
          if (f.mNumIndices === 3) {
            mesh.mIndexArray.push(f.mIndices[0]);
            mesh.mIndexArray.push(f.mIndices[1]);
            mesh.mIndexArray.push(f.mIndices[2]);
          } else if (f.mNumIndices === 4) {
            mesh.mIndexArray.push(f.mIndices[0]);
            mesh.mIndexArray.push(f.mIndices[1]);
            mesh.mIndexArray.push(f.mIndices[2]);
            mesh.mIndexArray.push(f.mIndices[2]);
            mesh.mIndexArray.push(f.mIndices[3]);
            mesh.mIndexArray.push(f.mIndices[0]);
          } else {
            throw new Erreur("Sorry, can't currently triangulate polys. Use the triangulate preprocessor in Assimp.");
          }
        }
      }
      if (mesh.mNumBones) {
        mesh.mBones = [];
        for (let a = 0; a < mesh.mNumBones; ++a) {
          mesh.mBones[a] = new aiBone();
          ReadBinaryBone(stream, mesh.mBones[a]);
        }
      }
    }
    function ReadBinaryMaterialProperty(stream, prop) {
      var chunkID = Read_uint32_t(stream);
      ai_assert(chunkID == ASSBIN_CHUNK_AIMATERIALPROPERTY);
      Read_uint32_t(stream);
      prop.mKey = Read_aiString(stream);
      prop.mSemantic = Read_unsigned_int(stream);
      prop.mIndex = Read_unsigned_int(stream);
      prop.mDataLength = Read_unsigned_int(stream);
      prop.mType = Read_unsigned_int(stream);
      prop.mData = [];
      stream.ReadBytes(prop.mData, 1, prop.mDataLength);
    }
    function ReadBinaryMaterial(stream, mat) {
      var chunkID = Read_uint32_t(stream);
      ai_assert(chunkID == ASSBIN_CHUNK_AIMATERIAL);
      Read_uint32_t(stream);
      mat.mNumAllocated = mat.mNumProperties = Read_unsigned_int(stream);
      if (mat.mNumProperties) {
        if (mat.mProperties) {
          delete mat.mProperties;
        }
        mat.mProperties = [];
        for (let i = 0; i < mat.mNumProperties; ++i) {
          mat.mProperties[i] = new aiMaterialProperty();
          ReadBinaryMaterialProperty(stream, mat.mProperties[i]);
        }
      }
    }
    function ReadBinaryNodeAnim(stream, nd) {
      var chunkID = Read_uint32_t(stream);
      ai_assert(chunkID == ASSBIN_CHUNK_AINODEANIM);
      Read_uint32_t(stream);
      nd.mNodeName = Read_aiString(stream);
      nd.mNumPositionKeys = Read_unsigned_int(stream);
      nd.mNumRotationKeys = Read_unsigned_int(stream);
      nd.mNumScalingKeys = Read_unsigned_int(stream);
      nd.mPreState = Read_unsigned_int(stream);
      nd.mPostState = Read_unsigned_int(stream);
      if (nd.mNumPositionKeys) {
        if (shortened) {
          ReadBounds(stream, nd.mPositionKeys, nd.mNumPositionKeys);
        } else {
          nd.mPositionKeys = [];
          ReadArray_aiVectorKey(stream, nd.mPositionKeys, nd.mNumPositionKeys);
        }
      }
      if (nd.mNumRotationKeys) {
        if (shortened) {
          ReadBounds(stream, nd.mRotationKeys, nd.mNumRotationKeys);
        } else {
          nd.mRotationKeys = [];
          ReadArray_aiQuatKey(stream, nd.mRotationKeys, nd.mNumRotationKeys);
        }
      }
      if (nd.mNumScalingKeys) {
        if (shortened) {
          ReadBounds(stream, nd.mScalingKeys, nd.mNumScalingKeys);
        } else {
          nd.mScalingKeys = [];
          ReadArray_aiVectorKey(stream, nd.mScalingKeys, nd.mNumScalingKeys);
        }
      }
    }
    function ReadBinaryAnim(stream, anim) {
      var chunkID = Read_uint32_t(stream);
      ai_assert(chunkID == ASSBIN_CHUNK_AIANIMATION);
      Read_uint32_t(stream);
      anim.mName = Read_aiString(stream);
      anim.mDuration = Read_double(stream);
      anim.mTicksPerSecond = Read_double(stream);
      anim.mNumChannels = Read_unsigned_int(stream);
      if (anim.mNumChannels) {
        anim.mChannels = [];
        for (let a = 0; a < anim.mNumChannels; ++a) {
          anim.mChannels[a] = new aiNodeAnim();
          ReadBinaryNodeAnim(stream, anim.mChannels[a]);
        }
      }
    }
    function ReadBinaryTexture(stream, tex) {
      var chunkID = Read_uint32_t(stream);
      ai_assert(chunkID == ASSBIN_CHUNK_AITEXTURE);
      Read_uint32_t(stream);
      tex.mWidth = Read_unsigned_int(stream);
      tex.mHeight = Read_unsigned_int(stream);
      stream.ReadBytes(tex.achFormatHint, 1, 4);
      if (!shortened) {
        if (!tex.mHeight) {
          tex.pcData = [];
          stream.ReadBytes(tex.pcData, 1, tex.mWidth);
        } else {
          tex.pcData = [];
          stream.ReadBytes(tex.pcData, 1, tex.mWidth * tex.mHeight * 4);
        }
      }
    }
    function ReadBinaryLight(stream, l) {
      var chunkID = Read_uint32_t(stream);
      ai_assert(chunkID == ASSBIN_CHUNK_AILIGHT);
      Read_uint32_t(stream);
      l.mName = Read_aiString(stream);
      l.mType = Read_unsigned_int(stream);
      if (l.mType != aiLightSource_DIRECTIONAL) {
        l.mAttenuationConstant = readFloat(stream);
        l.mAttenuationLinear = readFloat(stream);
        l.mAttenuationQuadratic = readFloat(stream);
      }
      l.mColorDiffuse = Read_aiColor3D(stream);
      l.mColorSpecular = Read_aiColor3D(stream);
      l.mColorAmbient = Read_aiColor3D(stream);
      if (l.mType == aiLightSource_SPOT) {
        l.mAngleInnerCone = readFloat(stream);
        l.mAngleOuterCone = readFloat(stream);
      }
    }
    function ReadBinaryCamera(stream, cam) {
      var chunkID = Read_uint32_t(stream);
      ai_assert(chunkID == ASSBIN_CHUNK_AICAMERA);
      Read_uint32_t(stream);
      cam.mName = Read_aiString(stream);
      cam.mPosition = Read_aiVector3D(stream);
      cam.mLookAt = Read_aiVector3D(stream);
      cam.mUp = Read_aiVector3D(stream);
      cam.mHorizontalFOV = readFloat(stream);
      cam.mClipPlaneNear = readFloat(stream);
      cam.mClipPlaneFar = readFloat(stream);
      cam.mAspect = readFloat(stream);
    }
    function ReadBinaryScene(stream, scene) {
      var chunkID = Read_uint32_t(stream);
      ai_assert(chunkID == ASSBIN_CHUNK_AISCENE);
      Read_uint32_t(stream);
      scene.mFlags = Read_unsigned_int(stream);
      scene.mNumMeshes = Read_unsigned_int(stream);
      scene.mNumMaterials = Read_unsigned_int(stream);
      scene.mNumAnimations = Read_unsigned_int(stream);
      scene.mNumTextures = Read_unsigned_int(stream);
      scene.mNumLights = Read_unsigned_int(stream);
      scene.mNumCameras = Read_unsigned_int(stream);
      scene.mRootNode = new aiNode();
      scene.mRootNode = ReadBinaryNode(stream, null, 0);
      if (scene.mNumMeshes) {
        scene.mMeshes = [];
        for (let i = 0; i < scene.mNumMeshes; ++i) {
          scene.mMeshes[i] = new aiMesh();
          ReadBinaryMesh(stream, scene.mMeshes[i]);
        }
      }
      if (scene.mNumMaterials) {
        scene.mMaterials = [];
        for (let i = 0; i < scene.mNumMaterials; ++i) {
          scene.mMaterials[i] = new aiMaterial();
          ReadBinaryMaterial(stream, scene.mMaterials[i]);
        }
      }
      if (scene.mNumAnimations) {
        scene.mAnimations = [];
        for (let i = 0; i < scene.mNumAnimations; ++i) {
          scene.mAnimations[i] = new aiAnimation();
          ReadBinaryAnim(stream, scene.mAnimations[i]);
        }
      }
      if (scene.mNumTextures) {
        scene.mTextures = [];
        for (let i = 0; i < scene.mNumTextures; ++i) {
          scene.mTextures[i] = new aiTexture();
          ReadBinaryTexture(stream, scene.mTextures[i]);
        }
      }
      if (scene.mNumLights) {
        scene.mLights = [];
        for (let i = 0; i < scene.mNumLights; ++i) {
          scene.mLights[i] = new aiLight();
          ReadBinaryLight(stream, scene.mLights[i]);
        }
      }
      if (scene.mNumCameras) {
        scene.mCameras = [];
        for (let i = 0; i < scene.mNumCameras; ++i) {
          scene.mCameras[i] = new aiCamera();
          ReadBinaryCamera(stream, scene.mCameras[i]);
        }
      }
    }
    var aiOrigin_CUR = 0;
    var aiOrigin_BEG = 1;
    function extendStream(stream) {
      stream.readOffset = 0;
      stream.Seek = function(off, ori) {
        if (ori == aiOrigin_CUR) {
          stream.readOffset += off;
        }
        if (ori == aiOrigin_BEG) {
          stream.readOffset = off;
        }
      };
      stream.ReadBytes = function(buff, size, n) {
        var bytes = size * n;
        for (let i = 0; i < bytes; i++)
          buff[i] = Read_uint8_t(this);
      };
      stream.subArray32 = function(start, end) {
        var buff = this.buffer;
        var newbuff = buff.slice(start, end);
        return new Float32Array(newbuff);
      };
      stream.subArrayUint16 = function(start, end) {
        var buff = this.buffer;
        var newbuff = buff.slice(start, end);
        return new Uint16Array(newbuff);
      };
      stream.subArrayUint8 = function(start, end) {
        var buff = this.buffer;
        var newbuff = buff.slice(start, end);
        return new Uint8Array(newbuff);
      };
      stream.subArrayUint32 = function(start, end) {
        var buff = this.buffer;
        var newbuff = buff.slice(start, end);
        return new Uint32Array(newbuff);
      };
    }
    var shortened, compressed;
    function InternReadFile(pFiledata) {
      var pScene = new aiScene();
      var stream = new DataView(pFiledata);
      extendStream(stream);
      stream.Seek(44, aiOrigin_CUR);
      pScene.versionMajor = Read_unsigned_int(stream);
      pScene.versionMinor = Read_unsigned_int(stream);
      pScene.versionRevision = Read_unsigned_int(stream);
      pScene.compileFlags = Read_unsigned_int(stream);
      shortened = Read_uint16_t(stream) > 0;
      compressed = Read_uint16_t(stream) > 0;
      if (shortened)
        throw "Shortened binaries are not supported!";
      stream.Seek(256, aiOrigin_CUR);
      stream.Seek(128, aiOrigin_CUR);
      stream.Seek(64, aiOrigin_CUR);
      if (compressed) {
        var uncompressedSize = Read_uint32_t(stream);
        var compressedSize = stream.FileSize() - stream.Tell();
        var compressedData = [];
        stream.Read(compressedData, 1, compressedSize);
        var uncompressedData = [];
        uncompress(uncompressedData, uncompressedSize, compressedData, compressedSize);
        var buff = new ArrayBuffer(uncompressedData);
        ReadBinaryScene(buff, pScene);
      } else {
        ReadBinaryScene(stream, pScene);
      }
      return pScene.toTHREE();
    }
    return InternReadFile(buffer);
  }
}
export {
  AssimpLoader
};
//# sourceMappingURL=AssimpLoader.js.map
