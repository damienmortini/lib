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
  } = { gl }) {
    super({
      gl,
      mesh: new GLMesh({
        gl,
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

                in vec3 position;
              `],
              ["end", `
                SDFObject sdfObject = sdfObjects[gl_InstanceID];

                vec3 position = position;
                position = mix(position, normalize(position) * .5, sdfObject.spherical);
                position *= sdfObject.size + sdfObject.blend * sdfObject.size;
                position += sdfObject.position;
                gl_Position = camera.projectionView * vec4(position, 1.);
              `]
            ],
            fragmentShaderChunks: [
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
                uniform vec2 viewportSize;
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
                vec2 position2d = (gl_FragCoord.xy / viewportSize) * 2. - 1.;

                Ray ray = rayFromCamera(position2d, camera);

                Voxel voxel = sdfRayMarch(ray, camera.near, camera.far, 32);

                vec3 normal = sdfNormalFromPosition(ray.origin + ray.direction * voxel.coord.w, .01);

                // fragColor = vec4(position2d, 0., 1.);
                // fragColor = vec4(normal, 1.);
                fragColor = vec4(mix(vec3(0.), normal, step(.999, voxel.material.x)), 1.);
                // fragColor = voxel.material;
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
