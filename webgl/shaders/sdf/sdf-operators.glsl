Voxel smin( Voxel voxel1, Voxel voxel2, float blendRatio )
{
  float ratio = clamp(.5 + .5 * (voxel2.dist - voxel1.dist) / blendRatio, 0., 1.);

  float dist = mix(voxel2.dist, voxel1.dist, ratio) - blendRatio * ratio * (1. - ratio);
  vec4 material = mix(voxel2.material, voxel1.material, ratio);

  return Voxel(dist, material);
}

Voxel min( Voxel voxel1, Voxel voxel2 )
{
  if(voxel1.dist - voxel2.dist < 0.) {
    return voxel1;
  }
  else {
    return voxel2;
  }
}
