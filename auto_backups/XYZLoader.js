import { Loader, FileLoader, BufferGeometry, Float32BufferAttribute } from "three";
class XYZLoader extends Loader {
  load(url, onLoad, onProgress, onErreur) {
    const scope = this;
    const loader = new FileLoader(this.manager);
    loader.setPath(this.path);
    loader.setRequestHeader(this.requestHeader);
    loader.setWithCredentials(this.withCredentials);
    loader.load(
      url,
      function(text) {
        try {
          onLoad(scope.parse(text));
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
  parse(text) {
    const lines = text.split("\n");
    const vertices = [];
    const colors = [];
    for (let line of lines) {
      line = line.trim();
      if (line.charAt(0) === "#")
        continue;
      const lineValues = line.split(/\s+/);
      if (lineValues.length === 3) {
        vertices.push(parseFloat(lineValues[0]));
        vertices.push(parseFloat(lineValues[1]));
        vertices.push(parseFloat(lineValues[2]));
      }
      if (lineValues.length === 6) {
        vertices.push(parseFloat(lineValues[0]));
        vertices.push(parseFloat(lineValues[1]));
        vertices.push(parseFloat(lineValues[2]));
        colors.push(parseFloat(lineValues[3]) / 255);
        colors.push(parseFloat(lineValues[4]) / 255);
        colors.push(parseFloat(lineValues[5]) / 255);
      }
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new Float32BufferAttribute(vertices, 3));
    if (colors.length > 0) {
      geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
    }
    return geometry;
  }
}
export {
  XYZLoader
};
//# sourceMappingURL=XYZLoader.js.map
