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
  } = { gl }) {
    const instanceIDs = new Float32Array(sdfObjects.length);
    for (let index = 0; index < instanceIDs.length; index++) {
      instanceIDs[index] = index;
    }

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
          widthSegments: 10,
          heightSegments: 10,
          depthSegments: 10,
          normals: false,
          uvs: false,
        })
      }),
      program: new GLProgram({
        gl,
        shaders: [
          {
            vertexShaderChunks: [
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
                ${SDFShader.sdfMin()}
                ${SDFShader.sdfSmoothMin()}

                Voxel map(vec3 position) {
                  Voxel voxel = Voxel(vec4(0., 0., 0., camera.far), vec4(0.));
                  for(int i = 0; i < ${sdfObjects.length}; i++) {
                    SDFObject sdfObject = sdfObjects[i];
                    vec3 objectPosition = position - sdfObject.position;
                    voxel = sdfSmoothMin(voxel, sdfSphere(objectPosition, sdfObject.size * .5, vec4(1.)), sdfObject.blend * sdfObject.size);
                  }
                  return voxel;
                }

                ${SDFShader.sdfRayMarch()}
                ${SDFShader.sdfNormalFromPosition()}

                in float instanceID;
                in vec3 position;

                out vec2 screenPosition;
                // out vec3 normal;
                // out vec4 material;
              `],
              ["end", `
                SDFObject sdfObject = sdfObjects[int(instanceID)];

                vec3 position = position;
                position = mix(position, normalize(position) * .5, sdfObject.spherical);
                position *= sdfObject.size + sdfObject.blend * sdfObject.size;
                position += sdfObject.position;
                gl_Position = camera.projectionView * vec4(position, 1.);

                screenPosition = gl_Position.xy / gl_Position.w;

                // Ray ray = rayFromCamera(gl_Position.xy / gl_Position.w, camera);

                // Voxel voxel = sdfRayMarch(ray, camera.near, camera.far, ${sdfRayMarchSteps});

                // normal = sdfNormalFromPosition(ray.origin + ray.direction * voxel.coord.w, .1);

                // material = voxel.material;
              `]
            ],
            fragmentShaderChunks: [
              ["start", `
                // in vec3 normal;
                // in vec4 material;

                in vec2 screenPosition;

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
                ${SDFShader.sdfMin()}
                ${SDFShader.sdfSmoothMin()}

                Voxel map(vec3 position) {
                  Voxel voxel = Voxel(vec4(0., 0., 0., camera.far), vec4(0.));
                  for(int i = 0; i < ${sdfObjects.length}; i++) {
                    SDFObject sdfObject = sdfObjects[i];
                    vec3 objectPosition = position - sdfObject.position;
                    voxel = sdfSmoothMin(voxel, sdfSphere(objectPosition, sdfObject.size * .5, vec4(1.)), sdfObject.blend * sdfObject.size);
                  }
                  return voxel;
                }

                ${SDFShader.sdfRayMarch()}
                ${SDFShader.sdfNormalFromPosition()}
              `],
              ["end", `
                Ray ray = rayFromCamera(screenPosition, camera);

                Voxel voxel = sdfRayMarch(ray, camera.near, camera.far, ${sdfRayMarchSteps});

                vec3 normal = vec3(1.);
                // normal = sdfNormalFromPosition(ray.origin + ray.direction * voxel.coord.w, 1.);

                vec4 material = voxel.material;

                fragColor = vec4(normal, material.w);
              `],
            ]
          },
          ...shaders,
        ],
      }),
    });

    this.sdfObjects = sdfObjects;
  }

  draw(options) {
    super.draw({ ...{ instanceCount: this.sdfObjects.length }, ...options });
  }
}
