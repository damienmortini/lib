import BoxMesh from "../../3d/mesh/BoxMesh.js";
import GLObject from "../GLObject.js";
import GLMesh from "../GLMesh.js";
import GLProgram from "../GLProgram.js";
import CameraShader from "../../shader/CameraShader.js";
import RayShader from "../../shader/RayShader.js";
import SDFShader from "../../shader/SDFShader.js";

export default class GLRayMarchingObject extends GLObject {
  constructor({
    gl,
    sdfObjects = [],
    shaders = [],
    meshDefinition = 10,
    sdfRayMarchSteps = 64,
    sdfRayMarchPrecision = 0.001,
    vertexCompute = false,
  } = { gl }) {
    const instanceIDs = new Float32Array(sdfObjects.length);
    for (let index = 0; index < instanceIDs.length; index++) {
      instanceIDs[index] = index;
    }

    let mapChunk = `
      SDFObject sdfObject;
      vec3 objectPosition;
    `;
    for (const [i, sdfObject] of sdfObjects.entries()) {
      sdfObject.shape = sdfObject.shape === undefined ? "sphere" : sdfObject.shape;
      sdfObject.size = sdfObject.size === undefined ? 1 : sdfObject.size;
      sdfObject.blend = sdfObject.blend === undefined ? 0 : sdfObject.blend;
      sdfObject.material = sdfObject.material === undefined ? [1, 1, 1, 1] : sdfObject.material;
      sdfObject.spherical = sdfObject.spherical === undefined ? sdfObject.shape === "sphere" ? 1 : 0 : sdfObject.spherical;
      mapChunk += `
        sdfObject = sdfObjects[${i}];
        objectPosition = position - sdfObject.position;
      `;
      switch (sdfObject.shape) {
        case "sphere":
          mapChunk += `
            voxel = sdfSmoothMin(voxel, sdfSphere(objectPosition, sdfObject.size * .5, sdfObject.material), sdfObject.blend * sdfObject.size);
          `;
          break;
        case "box":
          mapChunk += `
            voxel = sdfSmoothMin(voxel, sdfBox(objectPosition, vec3(sdfObject.size * .5), sdfObject.material), sdfObject.blend * sdfObject.size);
          `;
          break;
        default:
          mapChunk += `
            voxel = sdfSmoothMin(voxel, ${sdfObject.shape}, sdfObject.blend * sdfObject.size);
          `;
          break;
      }
    }

    const rayMarchingChunks = new Map([
      ["start", `
        ${CameraShader.Camera}
        ${RayShader.Ray}
        ${SDFShader.Voxel}
        
        struct SDFObject
        {
          float spherical;
          float size;
          float blend;
          vec3 position;
          vec4 material;
        };
        
        uniform Camera camera;
        uniform SDFObject sdfObjects[${sdfObjects.length}];
        
        ${RayShader.rayFromCamera()}
      `],
      ["compute", `
        uniform int sdfRayMarchSteps;
        uniform float sdfRayMarchPrecision;

        ${SDFShader.sdfSphere()}
        ${SDFShader.sdfBox()}
        ${SDFShader.sdfMin()}
        ${SDFShader.sdfSmoothMin()}

        Voxel map(vec3 position) {
          Voxel voxel = Voxel(vec4(0., 0., 0., camera.far), vec4(0.));
          ${mapChunk}
          return voxel;
        }

        ${SDFShader.sdfRayMarch()}
        ${SDFShader.sdfNormalFromPosition({ preventInline: !(gl instanceof window.WebGLRenderingContext) })}
      `],
      ["main", `
        voxel = sdfRayMarch(ray, camera.near, camera.far, sdfRayMarchSteps, sdfRayMarchPrecision);
        
        normal = sdfNormalFromPosition(ray.origin + ray.direction * voxel.coord.w, .1);
        normal = mix(normal, vec3(0.), step(camera.far, voxel.coord.w));
      `],
    ]);

    super({
      gl,
      mesh: new GLMesh(Object.assign({
        gl,
        attributes: [
          ["instanceID", {
            data: instanceIDs,
            size: 1,
            divisor: 1,
          }],
        ],
      }, new BoxMesh({
        width: 1,
        height: 1,
        depth: 1,
        widthSegments: meshDefinition,
        heightSegments: meshDefinition,
        depthSegments: meshDefinition,
        normals: false,
        uvs: false,
      }))),
      program: new GLProgram({
        gl,
        uniforms: [
          ["sdfRayMarchSteps", sdfRayMarchSteps],
          ["sdfRayMarchPrecision", sdfRayMarchPrecision]
        ],
        vertexShaderChunks: [
          ["start", `
            in float instanceID;
            in vec3 position;

            ${rayMarchingChunks.get("start")}

            ${vertexCompute ? rayMarchingChunks.get("compute") : ""}
            
            out vec3 normal;
            out Ray ray;
            ${vertexCompute ? "out Voxel voxel;" : ""}
          `],
          ["end", `
            SDFObject sdfObject = sdfObjects[int(instanceID)];

            vec3 position = position;
            position = mix(position, normalize(position) * .5, sdfObject.spherical);
            position *= sdfObject.size + sdfObject.blend * sdfObject.size;
            position += sdfObject.position;
            gl_Position = camera.projectionView * vec4(position, 1.);

            ray = rayFromCamera(gl_Position.xy / gl_Position.w, camera);

            ${vertexCompute ? rayMarchingChunks.get("main") : ""}
          `],
        ],
        fragmentShaderChunks: [
          ["start", `
            ${rayMarchingChunks.get("start")}
            
            ${!vertexCompute ? rayMarchingChunks.get("compute") : ""}

            in Ray ray;
            in vec3 normal;
            ${vertexCompute ? "in Voxel voxel;" : ""}
          `],
          ["end", `
            ${!vertexCompute ? "Voxel voxel = Voxel(vec4(0.), vec4(0.));\nvec3 normal = normal;\n" + rayMarchingChunks.get("main") : ""}

            fragColor = voxel.material;
          `],
        ],
        shaders,
      }),
    });

    this.sdfObjects = sdfObjects;
  }

  draw(options) {
    super.draw(Object.assign({ instanceCount: this.sdfObjects.length }, options));
  }
}
