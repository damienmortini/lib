precision highp float;

float ratio;

uniform float uTime;
uniform vec2 uResolution;
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

float sdCappedCone( in vec3 p, in vec3 c )
{
    p.y -= c.z * .5;

    vec2 q = vec2( length(p.xz), p.y );
    vec2 v = vec2( c.z*c.y/c.x, -c.z );

    vec2 w = v - q;

    vec2 vv = vec2( dot(v,v), v.x*v.x );
    vec2 qv = vec2( dot(v,w), v.x*w.x );

    vec2 d = max(qv,0.0)*qv/vv;

    return sqrt( dot(w,w) - max(d.x,d.y) )* sign(max(q.y*v.x-q.x*v.y,w.y));
}

mat4 matRotate( in vec3 xyz )
{
    vec3 si = sin(xyz);
    vec3 co = cos(xyz);

	return mat4( co.y*co.z,                co.y*si.z,               -si.y,       0.0,
                 si.x*si.y*co.z-co.x*si.z, si.x*si.y*si.z+co.x*co.z, si.x*co.y,  0.0,
                 co.x*si.y*co.z+si.x*si.z, co.x*si.y*si.z-si.x*co.z, co.x*co.y,  0.0,
			     0.0,                      0.0,                      0.0,        1.0 );
}

mat4 matTranslate( float x, float y, float z )
{
    return mat4( 1.0, 0.0, 0.0, 0.0,
				 0.0, 1.0, 0.0, 0.0,
				 0.0, 0.0, 1.0, 0.0,
				 x,   y,   z,   1.0 );
}

mat4 matInverse( in mat4 m )
{
	return mat4(
        m[0][0], m[1][0], m[2][0], 0.0,
        m[0][1], m[1][1], m[2][1], 0.0,
        m[0][2], m[1][2], m[2][2], 0.0,
        -dot(m[0].xyz,m[3].xyz),
        -dot(m[1].xyz,m[3].xyz),
        -dot(m[2].xyz,m[3].xyz),
        1.0 );
}

float map(vec3 p) {
    float dist = 100.;

    mat4 rotationMatrix = matRotate(vec3(0., uTime * .001, uTime * .001));
    p = (vec4(p, 0.) * matInverse(rotationMatrix)).xyz;

    dist = sdSphere(p, 1.);
    dist = mix(dist, udBox(p, vec3(.5, 1., .5)), 1. - clamp(abs(1. - ratio), 0., 1.));
    dist = mix(dist, sdTorus(p, vec2(1., .3)), 1. - clamp(abs(2. - ratio), 0., 1.));
    dist = mix(dist, sdCappedCone(p, vec3(3., 1., 1.5)), 1. - clamp(abs(3. - ratio), 0., 1.));
    dist = mix(dist, sdHexPrism(p, vec2(1., .3)), 1. - clamp(abs(4. - ratio), 0., 1.));
    dist = mix(dist, sdTriPrism(p, vec2(1., .3)), 1. - clamp(abs(5. - ratio), 0., 1.));
    dist = mix(dist, sdCapsule(p, vec3(.5), vec3(-.5), .5), 1. - clamp(abs(6. - ratio), 0., 1.));
    dist = mix(dist, sdCappedCylinder(p, vec2(.5, 1.)), 1. - clamp(abs(7. - ratio), 0., 1.));
    dist = mix(dist, udBox(p, vec3(.5)), 1. - clamp(abs(8. - ratio), 0., 1.));
    // dist = mix(dist, udBox(p, vec3(.5, 1., .5)), clamp(ratio, 0., 1.));

    return dist;
}

vec3 calcNormal (vec3 p) {
	vec2 e = vec2(0.0001, 0.0);
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
        col = texture2D(uTexture, uv).rgb;
        // col = mix(col, calcNormal(ro + rd * t), .1);
        // col = texture2D(iChannel0, -uv).rgb;
        // col = mix(col, texture2D(iChannel1, -uv).rgb, clamp(-ratio, 0., 1.));
        // col = mix(col, texture2D(iChannel2, -uv).rgb, clamp(ratio, 0., 1.));
    }

	gl_FragColor = vec4(col, 1.0);
}
