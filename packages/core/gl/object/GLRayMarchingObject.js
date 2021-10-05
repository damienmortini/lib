import GLObject from '../GLObject.js'
import GLGeometry from '../GLGeometry.js'
import GLProgram from '../GLProgram.js'
import CameraShader from '../../shader/CameraShader.js'
import RayShader from '../../shader/RayShader.js'
import SDFShader from '../../shader/SDFShader.js'
import Shader from '../../3d/Shader.js'
import RoundedBoxGeometry from '../../3d/geometry/RoundedBoxGeometry.js'
import Vector4 from '../../math/Vector4.js'
import Vector2 from '../../math/Vector2.js'

export default class GLRayMarchingObject extends GLObject {
  constructor({
    gl,
    sdfObjects = [],
    vertexChunks = [],
    fragmentChunks = [],
    sdfRayMarchSteps = 100,
    sdfRayMarchPrecision = .01,
  }) {
    const SDFObjectStructure = `
      struct SDFObject
      {
        float size;
        float blend;
        vec3 position;
        vec4 material;
      };
    `

    super({
      gl,
      geometry: new GLGeometry({
        gl,
        ...new RoundedBoxGeometry({
          width: 1,
          height: 1,
          depth: 1,
          radius: .5,
          widthSegments: 4,
          heightSegments: 4,
          depthSegments: 4,
          normals: false,
          uvs: false,
        }),
      }),
      program: new GLProgram({
        gl,
        shader: new Shader({
          uniforms: {
            'sdfRayMarchSteps': sdfRayMarchSteps,
            'sdfRayMarchPrecision': sdfRayMarchPrecision,
          },
          vertexChunks: [
            ['start', `
              ${CameraShader.Camera}
              ${RayShader.Ray}
              ${SDFObjectStructure}

              uniform Camera camera;
              uniform SDFObject sdfObjects[${sdfObjects.length}];
              uniform highp int index;

              in vec3 position;
  
              out vec3 normal;
              out Ray ray;
              out vec4 glPosition;
              out float near;
              // flat out int instanceID;
            `],
            ['end', `
              SDFObject sdfObject = sdfObjects[index];
  
              vec3 position = position;
              position *= (1. + sdfObject.blend) * sdfObject.size;
              position += sdfObject.position;
              gl_Position = camera.projectionView * vec4(position, 1.);

              vec3 rayOrigin = -camera.inverseTransform[3].xyz * mat3(camera.inverseTransform);
              near = distance(position, rayOrigin);

              glPosition = gl_Position;
            `],
            ...vertexChunks,
          ],
          fragmentChunks: [
            ['start', `
              ${CameraShader.Camera}
              ${RayShader.Ray}
              ${SDFShader.Voxel}
              ${SDFObjectStructure}
              
              uniform Camera camera;
              uniform SDFObject sdfObjects[${sdfObjects.length}];
              uniform int sdfRayMarchSteps;
              uniform float sdfRayMarchPrecision;
              uniform int intersectObjectsNumber;
              uniform int intersectObjects[100];

              // flat in int instanceID;
              in Ray ray;
              in vec3 normal;
              in vec4 glPosition;
              in float near;
              
              ${RayShader.rayFromCamera()}
              ${SDFShader.sdfSphere()}
              ${SDFShader.sdfBox()}
              ${SDFShader.sdfMin()}
              ${SDFShader.sdfSmoothMin()}

              Voxel map(vec3 position) {
                ;
                vec3 objectPosition;

                Voxel voxel = Voxel(vec4(0., 0., 0., camera.far), vec4(0.));
                // SDFObject sdfObject = sdfObjects[index];
                // objectPosition = position - sdfObject.position;
                // voxel = sdfSmoothMin(voxel, sdfSphere(objectPosition, sdfObject.size * .5, sdfObject.material), sdfObject.blend * sdfObject.size);

                for (int i = 0; i < intersectObjectsNumber; i++) { 
                  SDFObject intersectObject = sdfObjects[intersectObjects[i]];
                  objectPosition = position - intersectObject.position;
                  
                  voxel = sdfSmoothMin(voxel, sdfSphere(objectPosition, intersectObject.size * .5, intersectObject.material), intersectObject.blend * intersectObject.size);
                  // voxel = sdfMin(voxel, sdfSphere(objectPosition, intersectObject.size * .5, intersectObject.material));
                }
                
                return voxel;
              }

              ${SDFShader.sdfRayMarch()}
              ${SDFShader.sdfNormalFromPosition()}
            `],
            ['end', `
              Ray ray = rayFromCamera(glPosition.xy / glPosition.w, camera);

              Voxel voxel = sdfRayMarch(ray, near, camera.far, sdfRayMarchSteps, sdfRayMarchPrecision);
        
              vec3 normal = sdfNormalFromPosition(ray.origin + ray.direction * voxel.coord.w, .1);
              normal = mix(normal, vec3(0.), step(camera.far, voxel.coord.w));
  
              fragColor = voxel.material;
              // voxel.material = vec4(float(intersectObjects[8]) / 10.);
            `],
            ...fragmentChunks,
          ],
        }),
      }),
    })

    this.sdfObjects = sdfObjects
    this.intersectObjectsMap = new Map()
    this.sdfObjectsUnprojectedBoundingSpheres = new Map()

    this._debugSphere = new GLObject({
      gl,
      geometry: new GLGeometry({
        gl,
        ...new RoundedBoxGeometry({
          width: 2,
          height: 2,
          depth: 2,
          radius: 1,
          // widthSegments: 4,
          // heightSegments: 4,
          // depthSegments: 4,
        }),
      }),
      program: new GLProgram({
        gl,
        shader: new Shader({
          uniforms: {
            color: new Vector4([1, 0, 0, 1]),
          },
          vertexChunks: [
            ['start', `
              uniform float radius;
              uniform float drawingBufferRatio;
              uniform vec2 objectPosition;

              in vec3 position;
            `],
            ['end', `
              vec3 position = position;
              position.x /= drawingBufferRatio;
              position *= radius;
              position.xy += objectPosition;

              gl_Position = vec4(position, 1.);
            `],
          ],
          fragmentChunks: [
            ['start', `
              uniform vec4 color;
            `],
            ['end', `
              fragColor = color;
            `],
          ],
        }),
      }),
    })

    console.log(this._debugSphere)
  }

  draw({ uniforms = {}, ...options } = {}) {
    const drawingBufferRatio = this.gl.drawingBufferWidth / this.gl.drawingBufferHeight
    const unprojectedSdfObjectOrigin = new Vector4()
    const drawingList = []

    for (const sdfObject of this.sdfObjects) {
      let boundingSphere = this.sdfObjectsUnprojectedBoundingSpheres.get(sdfObject)
      drawingList.push(sdfObject)
      if (!boundingSphere) {
        boundingSphere = {
          position: new Vector2(),
          radius: 1,
          depth: 0,
        }
        this.sdfObjectsUnprojectedBoundingSpheres.set(sdfObject, boundingSphere)
      }
      unprojectedSdfObjectOrigin.set(
        sdfObject.position.x,
        sdfObject.position.y,
        sdfObject.position.z,
        1,
      )
      unprojectedSdfObjectOrigin.applyMatrix4(uniforms.camera.projectionView)
      const projectionRatio = unprojectedSdfObjectOrigin.w
      boundingSphere.position.set(unprojectedSdfObjectOrigin.x / projectionRatio, unprojectedSdfObjectOrigin.y / projectionRatio)
      boundingSphere.radius = ((sdfObject.size) * (1 + sdfObject.blend)) / projectionRatio
      boundingSphere.depth = projectionRatio - sdfObject.size * (1 + sdfObject.blend) * .5
    }

    drawingList.sort((a, b) => {
      return this.sdfObjectsUnprojectedBoundingSpheres.get(a).depth - this.sdfObjectsUnprojectedBoundingSpheres.get(b).depth
    })

    for (const sdfObject of this.sdfObjects) {
      const sdfObjectBoundingSphere = this.sdfObjectsUnprojectedBoundingSpheres.get(sdfObject)
      const intersectObjects = []
      this.intersectObjectsMap.set(sdfObject, intersectObjects)
      for (const [index, intersectObject] of this.sdfObjects.entries()) {
        if (sdfObject === intersectObject) {
          intersectObjects.push(index)
          continue
        }
        const intersectObjectBoundingSphere = this.sdfObjectsUnprojectedBoundingSpheres.get(intersectObject)
        const distance = Math.hypot(
          (sdfObjectBoundingSphere.position.x - intersectObjectBoundingSphere.position.x) * drawingBufferRatio,
          (sdfObjectBoundingSphere.position.y - intersectObjectBoundingSphere.position.y),
        )
        if (distance < sdfObjectBoundingSphere.radius + intersectObjectBoundingSphere.radius) {
          intersectObjects.push(index)
        }
        // if (sdfObject.intersectObjects > 10) break
      }
    }

    this.bind()
    this.program.uniforms.set('camera', uniforms.camera)
    this.program.uniforms.set('sdfObjects', this.sdfObjects)
    for (const sdfObject of drawingList) {
      const intersectObjects = this.intersectObjectsMap.get(sdfObject)
      super.draw({ uniforms: { intersectObjects, index: this.sdfObjects.indexOf(sdfObject), intersectObjectsNumber: intersectObjects.length }, ...options })
    }
    this.unbind()

    // for (const [sdfObject, boundingSphere] of this.sdfObjectsUnprojectedBoundingSpheres.entries()) {
    //   // console.log(sdfObject.intersectObjects);
    //   const intersectObjects = this.intersectObjectsMap.get(sdfObject)
    //   const opacity = intersectObjects.length / this.sdfObjects.length
    //   this._debugSphere.draw({
    //     bind: true, mode: this.gl.LINES, uniforms: {
    //       drawingBufferRatio,
    //       color: intersectObjects.length > 1 ? new Vector4([1, 0, 0, opacity]) : new Vector4([0, 1, 0, opacity]),
    //       objectPosition: boundingSphere.position,
    //       radius: boundingSphere.radius,
    //     },
    //   })
    // }
  }
}
