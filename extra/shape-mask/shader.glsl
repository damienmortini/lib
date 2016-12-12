precision highp float;

float ratio;

uniform float uTime;
uniform vec2 uResolution;
uniform mat4 uMatrixInverse;
uniform float uShapeRatios[8];
uniform sampler2D uTexture;

float sdSphere(vec3 p, float s) {
  return length(p)-s;
}

float sdTorus( vec3 p, vec2 t ) {
  vec2 q = vec2(length(p.xy)-t.x,p.z);
  return length(q)-t.y;
}

float udBox( vec3 p, vec3 b ) {
  return length(max(abs(p)-b,0.0));
}

float sdPlane( vec3 p, vec4 n )
{
  // n must be normalized
  return dot(p,n.xyz) + n.w;
}

float sdHexPrism( vec3 p, vec2 h )
{
    vec3 q = abs(p);
    return max(q.z-h.y,max((q.x*0.866025+q.y*0.5),q.y)-h.x);
}

float sdTriPrism( vec3 p, vec2 h )
{
    vec3 q = abs(p);
    return max(q.z-h.y,max(q.x*0.866025+p.y*0.5,-p.y)-h.x*0.5);
}

float sdCapsule( vec3 p, vec3 a, vec3 b, float r )
{
    vec3 pa = p - a, ba = b - a;
    float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
    return length( pa - ba*h ) - r;
}

float sdCappedCylinder( vec3 p, vec2 h )
{
  vec2 d = abs(vec2(length(p.xz),p.y)) - h;
  return min(max(d.x,d.y),0.0) + length(max(d,0.0));
}

float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

float shape1(vec3 p) {
  p.y += cos(p.y);
  float dist = sdSphere(p, 1.);
  return dist;
}

float map(vec3 p) {
    float dist = 100.;

    p = (vec4(p, 0.) * uMatrixInverse).xyz;

    dist = (
      shape1(p) * uShapeRatios[0] +
      sdTorus(p, vec2(1., .3)) * uShapeRatios[1] +
      sdHexPrism(p, vec2(1., .01)) * uShapeRatios[2] +
      udBox(p, vec3(.65)) * uShapeRatios[3] +
      udBox(p, vec3(.1, 1., .1)) * uShapeRatios[4] +
      sdTriPrism(p, vec2(1., .01)) * uShapeRatios[5] +
      sdCapsule(p, vec3(.5), vec3(-.5), .5) * uShapeRatios[6] +
      sdCappedCylinder(p, vec2(.5, 1.)) * uShapeRatios[7]
    ) / (uShapeRatios[0] + uShapeRatios[1] + uShapeRatios[2] + uShapeRatios[3] + uShapeRatios[4] + uShapeRatios[5] + uShapeRatios[6] + uShapeRatios[7]);
    // dist = mix(dist, sdTorus(p, vec2(1., .3)), uShapeRatios[1]);
    // dist = mix(dist, sdHexPrism(p, vec2(1., .3)), uShapeRatios[2]);
    // dist = mix(dist, udBox(p, vec3(.5)), uShapeRatios[3]);
    // dist = mix(dist, udBox(p, vec3(.5, 1., .5)), uShapeRatios[4]);
    // dist = mix(dist, sdTriPrism(p, vec2(1., .3)), uShapeRatios[5]);
    // dist = mix(dist, sdCapsule(p, vec3(.5), vec3(-.5), .5), uShapeRatios[6]);
    // dist = mix(dist, sdCappedCylinder(p, vec2(.5, 1.)), uShapeRatios[7]);

    return dist;
}

vec3 calcNormal (vec3 p) {
	vec2 e = vec2(0.00001, 0.0);
    return normalize(vec3( 	map(p + e.xyy) - map(p - e.xyy),
                            map(p + e.yxy) - map(p - e.yxy),
                          	map(p + e.yyx) - map(p - e.yyx)));
}

void main() {
    ratio = (cos(uTime * .0001) * .5 + .5)  * 8.;

    vec2 uv = gl_FragCoord.xy / uResolution.xy;
    uv.y = 1. - uv.y;

    vec2 p = uv * 2. - 1.;
    p.x *= uResolution.x / uResolution.y;

    vec3 ro = 2. * vec3(0., 0., -1.);

    vec3 rd = normalize(vec3(p.x, p.y, 1.));
    //rd.xz *= ro.xz;
    //vec3 direction = vec3(cos(uTime + PI * .5), 0.0, sin(uTime + PI * .5));
    //rd = normalize(direction + vec3( cos(uTime) * p.x, p.y, sin(uTime) * p.x ));

    vec3 col = vec3(1.);

    float tmax = 100.;
    float h = 1.0;
    float t = 0.0;

    for(int i = 0; i < 32; i++) {
        if (h < 0.00001 || h > tmax) break;
        h = map( ro + rd * t);
        t += h;
    }

    if (t < tmax) {
        col = vec3(1., 0., 0.);
        vec3 normal = calcNormal(ro + rd * t);
        col = texture2D(uTexture, uv + normal.xy).rgb;
        // col = mix(col, calcNormal(ro + rd * t), .1);
        // col = texture2D(iChannel0, -uv).rgb;
        // col = mix(col, texture2D(iChannel1, -uv).rgb, clamp(-ratio, 0., 1.));
        // col = mix(col, texture2D(iChannel2, -uv).rgb, clamp(ratio, 0., 1.));
    }

	gl_FragColor = vec4(col, 1.0);
}
