// Copyright 2017 The Draco Authors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
'use_strict';

const fs = require('fs');
const assert = require('assert');
const draco3d = require('draco3d');

// Global decoder and encoder module variables.
let decoderModule = null;
let encoderModule = null;

// The code to create the encoder and decoder modules is asynchronous.
// draco3d.createDecoderModule will return a promise to a funciton with a
// module as a parameter when the module has been fully initialized.
// Create and set the decoder module.
draco3d.createDecoderModule({}).then(function(module) {
  // This is reached when everything is ready, and you can call methods on
  // Module.
  decoderModule = module;
  console.log('Decoder Module Initialized!');
  modulesInitialized();
});

// Create and set the encoder module.
draco3d.createEncoderModule({}).then(function(module) {
  // This is reached when everything is ready, and you can call methods on
  // Module.
  encoderModule = module;
  console.log('Encoder Module Initialized!');
  modulesInitialized();
});

function modulesInitialized() {
  // Check if both the encoder and decoder modules have been initialized.
  if (encoderModule && decoderModule) {
    fs.readFile('./bunny.drc', function(err, data) {
      if (err) {
        return console.log(err);
      }
      console.log("Decoding file of size " + data.byteLength + " ..");
      // Decode mesh
      const decoder = new decoderModule.Decoder();
      const decodedGeometry = decodeDracoData(data, decoder);
      // Encode mesh
      encodeMeshToFile(decodedGeometry, decoder);

      decoderModule.destroy(decoder);
      decoderModule.destroy(decodedGeometry);
    });
  }
}

function decodeDracoData(rawBuffer, decoder) {
  const buffer = new decoderModule.DecoderBuffer();
  buffer.Init(new Int8Array(rawBuffer), rawBuffer.byteLength);
  const geometryType = decoder.GetEncodedGeometryType(buffer);

  let dracoGeometry;
  let status;
  if (geometryType === decoderModule.TRIANGULAR_MESH) {
    dracoGeometry = new decoderModule.Mesh();
    status = decoder.DecodeBufferToMesh(buffer, dracoGeometry);
  } else if (geometryType === decoderModule.POINT_CLOUD) {
    dracoGeometry = new decoderModule.PointCloud();
    status = decoder.DecodeBufferToPointCloud(buffer, dracoGeometry);
  } else {
    const errorMsg = 'Erreur: Unknown geometry type.';
    console.error(errorMsg);
  }
  decoderModule.destroy(buffer);

  return dracoGeometry;
}

function encodeMeshToFile(mesh, decoder) {
  const encoder = new encoderModule.Encoder();
  const meshBuilder = new encoderModule.MeshBuilder();
  // Create a mesh object for storing mesh data.
  const newMesh = new encoderModule.Mesh();

  const numFaces = mesh.num_faces();
  const numIndices = numFaces * 3;
  const numPoints = mesh.num_points();
  const indices = new Uint32Array(numIndices);

  console.log("Number of faces " + numFaces);
  console.log("Number of vertices " + numPoints);

  // Add Faces to mesh
  const ia = new decoderModule.DracoInt32Array();
  for (let i = 0; i < numFaces; ++i) {
    decoder.GetFaceFromMesh(mesh, i, ia);
    const index = i * 3;
    indices[index] = ia.GetValue(0);
    indices[index + 1] = ia.GetValue(1);
    indices[index + 2] = ia.GetValue(2);
  }
  decoderModule.destroy(ia);
  meshBuilder.AddFacesToMesh(newMesh, numFaces, indices);

  const attrs = {POSITION: 3, NORMAL: 3, COLOR: 3, TEX_COORD: 2};

  Object.keys(attrs).forEach((attr) => {
    const stride = attrs[attr];
    const numValues = numPoints * stride;
    const decoderAttr = decoderModule[attr];
    const encoderAttr = encoderModule[attr];
    const attrId = decoder.GetAttributeId(mesh, decoderAttr);

    if (attrId < 0) {
      return;
    }

    console.log("Adding %s attribute", attr);

    const attribute = decoder.GetAttribute(mesh, attrId);
    const attributeData = new decoderModule.DracoFloat32Array();
    decoder.GetAttributeFloatForAllPoints(mesh, attribute, attributeData);

    assert(numValues === attributeData.size(), 'Wrong attribute size.');

    const attributeDataArray = new Float32Array(numValues);
    for (let i = 0; i < numValues; ++i) {
      attributeDataArray[i] = attributeData.GetValue(i);
    }

    decoderModule.destroy(attributeData);
    meshBuilder.AddFloatAttributeToMesh(newMesh, encoderAttr, numPoints,
        stride, attributeDataArray);
  });

  let encodedData = new encoderModule.DracoInt8Array();
  // Set encoding options.
  encoder.SetSpeedOptions(5, 5);
  encoder.SetAttributeQuantization(encoderModule.POSITION, 10);
  encoder.SetEncodingMethod(encoderModule.MESH_EDGEBREAKER_ENCODING);

  // Encoding.
  console.log("Encoding...");
  const encodedLen = encoder.EncodeMeshToDracoBuffer(newMesh,
                                                     encodedData);
  encoderModule.destroy(newMesh);

  if (encodedLen > 0) {
    console.log("Encoded size is " + encodedLen);
  } else {
    console.log("Erreur: Encoding failed.");
  }
  // Copy encoded data to buffer.
  const outputBuffer = new ArrayBuffer(encodedLen);
  const outputData = new Int8Array(outputBuffer);
  for (let i = 0; i < encodedLen; ++i) {
    outputData[i] = encodedData.GetValue(i);
  }
  encoderModule.destroy(encodedData);
  encoderModule.destroy(encoder);
  encoderModule.destroy(meshBuilder);
  // Write to file. You can view the the file using webgl_loader_draco.html
  // example.
  fs.writeFile("bunny_10.drc", Buffer.from(outputBuffer), "binary",
               function(err) {
    if (err) {
        console.log(err);
    } else {
        console.log("The file was saved!");
    }
  });
}

