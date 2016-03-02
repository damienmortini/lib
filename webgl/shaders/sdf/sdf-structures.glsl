precision highp float;

struct Camera
{
  float near;
  float far;
  float fov;
  float aspect;
  mat4 modelViewMatrix;
};

struct Voxel
{
  float dist;
  vec4 material;
};

struct Ray
{
  vec3 origin;
  vec3 direction;
};
