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
    sdfRayMarchSteps = 64,
    meshDefinition = 10,
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
      const material = `vec4(${sdfObject.material[0].toFixed(4)}, ${sdfObject.material[1].toFixed(4)}, ${sdfObject.material[2].toFixed(4)}, ${sdfObject.material[3].toFixed(4)})`;
      switch (sdfObject.shape) {
        case "sphere":
          mapChunk += `
            voxel = sdfSmoothMin(voxel, sdfSphere(objectPosition, sdfObject.size * .5, ${material}), sdfObject.blend * sdfObject.size);
          `;
          break;
        case "box":
          mapChunk += `
            voxel = sdfSmoothMin(voxel, sdfBox(objectPosition, vec3(sdfObject.size * .5), ${material}), sdfObject.blend * sdfObject.size);
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
        ${CameraShader.Camera()}

        struct SDFObject
        {
          float spherical;
          float size;
          float blend;
          vec3 position;
        };

        uniform Camera camera;
        uniform SDFObject sdfObjects[${sdfObjects.length}];

        ${RayShader.Ray()}
        ${RayShader.rayFromCamera()}
        ${SDFShader.Voxel()}
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
        ${SDFShader.sdfNormalFromPosition()}
      `],
      ["main", `
        Ray ray = rayFromCamera(screenPosition, camera);

        Voxel voxel = sdfRayMarch(ray, camera.near, camera.far, ${sdfRayMarchSteps});
        
        normal = sdfNormalFromPosition(ray.origin + ray.direction * voxel.coord.w, .1);
        normal = mix(normal, vec3(0.), step(camera.far, voxel.coord.w));
        
        material = voxel.material;
      `]
    ]);

    super({
      gl,
      mesh: new GLMesh({
        gl,
        attributes: [
          ["instanceID", {
            data: instanceIDs,
            size: 1,
            divisor: 1,
          }]
        ],
        ...new BoxMesh({
          width: 1,
          height: 1,
          depth: 1,
          widthSegments: meshDefinition,
          heightSegments: meshDefinition,
          depthSegments: meshDefinition,
          normals: false,
          uvs: false,
        })
      }),
      program: new GLProgram({
        gl,
        uniforms: [
          ["vertexCompute", vertexCompute]
        ],
        vertexShaderChunks: [
          ["start", `
            uniform bool vertexCompute;

            in float instanceID;
            in vec3 position;

            out vec2 screenPosition;
            out vec3 normal;
            out vec4 material;

            ${rayMarchingChunks.get("start")}
          `],
          ["end", `
            SDFObject sdfObject = sdfObjects[int(instanceID)];

            vec3 position = position;
            position = mix(position, normalize(position) * .5, sdfObject.spherical);
            position *= sdfObject.size + sdfObject.blend * sdfObject.size;
            position += sdfObject.position;
            gl_Position = camera.projectionView * vec4(position, 1.);

            screenPosition = gl_Position.xy / gl_Position.w;

            if(vertexCompute) {
              ${rayMarchingChunks.get("main")}
            }
          `]
        ],
        fragmentShaderChunks: [
          ["start", `
            uniform bool vertexCompute;

            in vec3 normal;
            in vec4 material;

            in vec2 screenPosition;

            ${rayMarchingChunks.get("start")}
          `],
          ["end", `
            vec3 normal = normal;  
            vec4 material = material;

            if(!vertexCompute) {
              ${rayMarchingChunks.get("main")}
            }

            fragColor = vec4(normal, material.w);
          `],
        ],
        shaders,
      }),
    });

    this.sdfObjects = sdfObjects;
  }

  draw(options) {
    super.draw({ ...{ instanceCount: this.sdfObjects.length }, ...options });
  }
}
