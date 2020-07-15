
// From Inigo Quilez
// https://www.iquilezles.org/www/articles/distfunctions2d/distfunctions2d.htm
// Parsing code ;) - [...document.querySelectorAll('.code')].map((v) => v.textContent).join('#end\n\n#start')

export default class SDF2DShader {
  static sdCircle() {
    return `
float sdCircle( vec2 p, float r )
{
  return length(p) - r;
}
`;
  }

  static sdRoundedBox() {
    return `
float sdRoundedBox( in vec2 p, in vec2 b, in vec4 r )
{
  r.xy = (p.x>0.0)?r.xy : r.zw;
  r.x  = (p.y>0.0)?r.x  : r.y;
  vec2 q = abs(p)-b+r.x;
  return min(max(q.x,q.y),0.0) + length(max(q,0.0)) - r.x;
}
`;
  }

  static sdBox() {
    return `
float sdBox( in vec2 p, in vec2 b )
{
  vec2 d = abs(p)-b;
  return length(max(d,0.0)) + min(max(d.x,d.y),0.0);
}
`;
  }

  static sdOrientedBox() {
    return `
float sdOrientedBox( in vec2 p, in vec2 a, in vec2 b, float th )
{
  float l = length(b-a);
  vec2  d = (b-a)/l;
  vec2  q = (p-(a+b)*0.5);
      q = mat2(d.x,-d.y,d.y,d.x)*q;
      q = abs(q)-vec2(l,th)*0.5;
  return length(max(q,0.0)) + min(max(q.x,q.y),0.0);  
}
`;
  }

  static sdSegment() {
    return `
float sdSegment( in vec2 p, in vec2 a, in vec2 b )
{
  vec2 pa = p-a, ba = b-a;
  float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
  return length( pa - ba*h );
}
`;
  }

  static sdRhombus() {
    return `
float sdRhombus( in vec2 p, in vec2 b ) 
{
  vec2 q = abs(p);
  float h = clamp((-2.0*ndot(q,b)+ndot(b,b))/dot(b,b),-1.0,1.0);
  float d = length( q - 0.5*b*vec2(1.0-h,1.0+h) );
  return d * sign( q.x*b.y + q.y*b.x - b.x*b.y );
}
`;
  }

  static sdEquilateralTriangle() {
    return `
float sdEquilateralTriangle( in vec2 p )
{
  const float k = sqrt(3.0);
  p.x = abs(p.x) - 1.0;
  p.y = p.y + 1.0/k;
  if( p.x+k*p.y>0.0 ) p = vec2(p.x-k*p.y,-k*p.x-p.y)/2.0;
  p.x -= clamp( p.x, -2.0, 0.0 );
  return -length(p)*sign(p.y);
}
`;
  }

  static sdTriangleIsosceles() {
    return `
float sdTriangleIsosceles( in vec2 p, in vec2 q )
{
  p.x = abs(p.x);
  vec2 a = p - q*clamp( dot(p,q)/dot(q,q), 0.0, 1.0 );
  vec2 b = p - q*vec2( clamp( p.x/q.x, 0.0, 1.0 ), 1.0 );
  float s = -sign( q.y );
  vec2 d = min( vec2( dot(a,a), s*(p.x*q.y-p.y*q.x) ),
          vec2( dot(b,b), s*(p.y-q.y)  ));
  return -sqrt(d.x)*sign(d.y);
}
`;
  }

  static sdUnevenCapsule() {
    return `
float sdUnevenCapsule( vec2 p, float r1, float r2, float h )
{
  p.x = abs(p.x);
  float b = (r1-r2)/h;
  float a = sqrt(1.0-b*b);
  float k = dot(p,vec2(-b,a));
  if( k < 0.0 ) return length(p) - r1;
  if( k > a*h ) return length(p-vec2(0.0,h)) - r2;
  return dot(p, vec2(a,b) ) - r1;
}
`;
  }

  static sdTriangle() {
    return `
float sdTriangle( in vec2 p, in vec2 p0, in vec2 p1, in vec2 p2 )
{
  vec2 e0 = p1-p0, e1 = p2-p1, e2 = p0-p2;
  vec2 v0 = p -p0, v1 = p -p1, v2 = p -p2;
  vec2 pq0 = v0 - e0*clamp( dot(v0,e0)/dot(e0,e0), 0.0, 1.0 );
  vec2 pq1 = v1 - e1*clamp( dot(v1,e1)/dot(e1,e1), 0.0, 1.0 );
  vec2 pq2 = v2 - e2*clamp( dot(v2,e2)/dot(e2,e2), 0.0, 1.0 );
  float s = sign( e0.x*e2.y - e0.y*e2.x );
  vec2 d = min(min(vec2(dot(pq0,pq0), s*(v0.x*e0.y-v0.y*e0.x)),
           vec2(dot(pq1,pq1), s*(v1.x*e1.y-v1.y*e1.x))),
           vec2(dot(pq2,pq2), s*(v2.x*e2.y-v2.y*e2.x)));
  return -sqrt(d.x)*sign(d.y);
}
`;
  }

  static sdPentagon() {
    return `
float sdPentagon( in vec2 p, in float r )
{
  const vec3 k = vec3(0.809016994,0.587785252,0.726542528);
  p.x = abs(p.x);
  p -= 2.0*min(dot(vec2(-k.x,k.y),p),0.0)*vec2(-k.x,k.y);
  p -= 2.0*min(dot(vec2( k.x,k.y),p),0.0)*vec2( k.x,k.y);
  p -= vec2(clamp(p.x,-r*k.z,r*k.z),r);  
  return length(p)*sign(p.y);
}
`;
  }

  static sdHexagon() {
    return `
float sdHexagon( in vec2 p, in float r )
{
  const vec3 k = vec3(-0.866025404,0.5,0.577350269);
  p = abs(p);
  p -= 2.0*min(dot(k.xy,p),0.0)*k.xy;
  p -= vec2(clamp(p.x, -k.z*r, k.z*r), r);
  return length(p)*sign(p.y);
}
`;
  }

  static sdOctogon() {
    return `
float sdOctogon( in vec2 p, in float r )
{
  const vec3 k = vec3(-0.9238795325, 0.3826834323, 0.4142135623 );
  p = abs(p);
  p -= 2.0*min(dot(vec2( k.x,k.y),p),0.0)*vec2( k.x,k.y);
  p -= 2.0*min(dot(vec2(-k.x,k.y),p),0.0)*vec2(-k.x,k.y);
  p -= vec2(clamp(p.x, -k.z*r, k.z*r), r);
  return length(p)*sign(p.y);
}
`;
  }

  static sdHexagram() {
    return `
float sdHexagram( in vec2 p, in float r )
{
  const vec4 k = vec4(-0.5,0.8660254038,0.5773502692,1.7320508076);
  p = abs(p);
  p -= 2.0*min(dot(k.xy,p),0.0)*k.xy;
  p -= 2.0*min(dot(k.yx,p),0.0)*k.yx;
  p -= vec2(clamp(p.x,r*k.z,r*k.w),r);
  return length(p)*sign(p.y);
}
`;
  }

  static sdStar5() {
    return `
float sdStar5(in vec2 p, in float r, in float rf)
{
  const vec2 k1 = vec2(0.809016994375, -0.587785252292);
  const vec2 k2 = vec2(-k1.x,k1.y);
  p.x = abs(p.x);
  p -= 2.0*max(dot(k1,p),0.0)*k1;
  p -= 2.0*max(dot(k2,p),0.0)*k2;
  p.x = abs(p.x);
  p.y -= r;
  vec2 ba = rf*vec2(-k1.y,k1.x) - vec2(0,1);
  float h = clamp( dot(p,ba)/dot(ba,ba), 0.0, r );
  return length(p-ba*h) * sign(p.y*ba.x-p.x*ba.y);
}
`;
  }

  static sdStar() {
    return `
float sdStar(in vec2 p, in float r, in int n, in float m)
{
  // next 4 lines can be precomputed for a given shape
  float an = 3.141593/float(n);
  float en = 3.141593/m;  // m is between 2 and n
  vec2  acs = vec2(cos(an),sin(an));
  vec2  ecs = vec2(cos(en),sin(en)); // ecs=vec2(0,1) for regular polygon,

  float bn = mod(atan(p.x,p.y),2.0*an) - an;
  p = length(p)*vec2(cos(bn),abs(sin(bn)));
  p -= r*acs;
  p += ecs*clamp( -dot(p,ecs), 0.0, r*acs.y/ecs.y);
  return length(p)*sign(p.x);
}
`;
  }

  static sdTrapezoid() {
    return `
float sdTrapezoid( in vec2 p, in float r1, float r2, float he )
{
  vec2 k1 = vec2(r2,he);
  vec2 k2 = vec2(r2-r1,2.0*he);
  p.x = abs(p.x);
  vec2 ca = vec2(p.x-min(p.x,(p.y<0.0)?r1:r2), abs(p.y)-he);
  vec2 cb = p - k1 + k2*clamp( dot(k1-p,k2)/dot2(k2), 0.0, 1.0 );
  float s = (cb.x<0.0 && ca.y<0.0) ? -1.0 : 1.0;
  return s*sqrt( min(dot2(ca),dot2(cb)) );
}
`;
  }

  static sdPie() {
    return `
float sdPie( in vec2 p, in vec2 c, in float r )
{
  p.x = abs(p.x);
  float l = length(p) - r;
  float m = length(p-c*clamp(dot(p,c),0.0,r)); // c = sin/cos of the aperture
  return max(l,m*sign(c.y*p.x-c.x*p.y));
}
`;
  }

  static sdArc() {
    return `
float sdArc( in vec2 p, in vec2 sca, in vec2 scb, in float ra, float rb )
{
  p *= mat2(sca.x,sca.y,-sca.y,sca.x);
  p.x = abs(p.x);
  float k = (scb.y*p.x>scb.x*p.y) ? dot(p.xy,scb) : length(p.xy);
  return sqrt( dot(p,p) + ra*ra - 2.0*ra*k ) - rb;
}
`;
  }

  static sdHorseshoe() {
    return `
float sdHorseshoe( in vec2 p, in vec2 c, in float r, in vec2 w )
{
  p.x = abs(p.x);
  float l = length(p);
  p = mat2(-c.x, c.y, 
        c.y, c.x)*p;
  p = vec2((p.y>0.0)?p.x:l*sign(-c.x),
       (p.x>0.0)?p.y:l );
  p = vec2(p.x,abs(p.y-r))-w;
  return length(max(p,0.0)) + min(0.0,max(p.x,p.y));
}
`;
  }

  static sdVesica() {
    return `
float sdVesica(vec2 p, float r, float d)
{
  p = abs(p);
  float b = sqrt(r*r-d*d);
  return ((p.y-b)*d>p.x*b) ? length(p-vec2(0.0,b))
               : length(p-vec2(-d,0.0))-r;
}
`;
  }

  static sdEgg() {
    return `
float sdEgg( in vec2 p, in float ra, in float rb )
{
  const float k = sqrt(3.0);
  p.x = abs(p.x);
  float r = ra - rb;
  return ((p.y<0.0)     ? length(vec2(p.x,  p.y  )) - r :
      (k*(p.x+r)<p.y) ? length(vec2(p.x,  p.y-k*r)) :
                length(vec2(p.x+r,p.y  )) - 2.0*r) - rb;
}
`;
  }

  static sdCross() {
    return `
float sdCross( in vec2 p, in vec2 b, float r ) 
{
  p = abs(p); p = (p.y>p.x) ? p.yx : p.xy;
  vec2  q = p - b;
  float k = max(q.y,q.x);
  vec2  w = (k>0.0) ? q : vec2(b.y-p.x,-k);
  return sign(k)*length(max(w,0.0)) + r;
}
`;
  }

  static sdRoundedX() {
    return `
float sdRoundedX( in vec2 p, in float w, in float r )
{
  p = abs(p);
  return length(p-min(p.x+p.y,w)*0.5) - r;
}
`;
  }

  static sdPolygon() {
    return `
float sdPolygon( in vec2[N] v, in vec2 p )
{
  float d = dot(p-v[0],p-v[0]);
  float s = 1.0;
  for( int i=0, j=N-1; i<N; j=i, i++ )
  {
    vec2 e = v[j] - v[i];
    vec2 w =  p - v[i];
    vec2 b = w - e*clamp( dot(w,e)/dot(e,e), 0.0, 1.0 );
    d = min( d, dot(b,b) );
    bvec3 c = bvec3(p.y>=v[i].y,p.y<v[j].y,e.x*w.y>e.y*w.x);
    if( all(c) || all(not(c)) ) s*=-1.0;  
  }
  return s*sqrt(d);
}
`;
  }

  static sdEllipse() {
    return `
float sdEllipse( in vec2 p, in vec2 ab )
{
  p = abs(p); if( p.x > p.y ) {p=p.yx;ab=ab.yx;}
  float l = ab.y*ab.y - ab.x*ab.x;
  float m = ab.x*p.x/l;    float m2 = m*m; 
  float n = ab.y*p.y/l;    float n2 = n*n; 
  float c = (m2+n2-1.0)/3.0; float c3 = c*c*c;
  float q = c3 + m2*n2*2.0;
  float d = c3 + m2*n2;
  float g = m + m*n2;
  float co;
  if( d<0.0 )
  {
    float h = acos(q/c3)/3.0;
    float s = cos(h);
    float t = sin(h)*sqrt(3.0);
    float rx = sqrt( -c*(s + t + 2.0) + m2 );
    float ry = sqrt( -c*(s - t + 2.0) + m2 );
    co = (ry+sign(l)*rx+abs(g)/(rx*ry)- m)/2.0;
  }
  else
  {
    float h = 2.0*m*n*sqrt( d );
    float s = sign(q+h)*pow(abs(q+h), 1.0/3.0);
    float u = sign(q-h)*pow(abs(q-h), 1.0/3.0);
    float rx = -s - u - c*4.0 + 2.0*m2;
    float ry = (s - u)*sqrt(3.0);
    float rm = sqrt( rx*rx + ry*ry );
    co = (ry/sqrt(rm-rx)+2.0*g/rm-m)/2.0;
  }
  vec2 r = ab * vec2(co, sqrt(1.0-co*co));
  return length(r-p) * sign(p.y-r.y);
}
`;
  }

  static sdParabola() {
    return `
float sdParabola( in vec2 pos, in float k )
{
  pos.x = abs(pos.x);
  float ik = 1.0/k;
  float p = ik*(pos.y - 0.5*ik)/3.0;
  float q = 0.25*ik*ik*pos.x;
  float h = q*q - p*p*p;
  float r = sqrt(abs(h));
  float x = (h>0.0) ? 
    pow(q+r,1.0/3.0) - pow(abs(q-r),1.0/3.0)*sign(r-q) :
    2.0*cos(atan(r,q)/3.0)*sqrt(p);
  return length(pos-vec2(x,k*x*x)) * sign(pos.x-x);
}

float sdParabola( in vec2 pos, in float wi, in float he )
{
  pos.x = abs(pos.x);
  float ik = wi*wi/he;
  float p = ik*(he-pos.y-0.5*ik)/3.0;
  float q = pos.x*ik*ik*0.25;
  float h = q*q - p*p*p;
  float r = sqrt(abs(h));
  float x = (h>0.0) ? 
    pow(q+r,1.0/3.0) - pow(abs(q-r),1.0/3.0)*sign(r-q) :
    2.0*cos(atan(r/q)/3.0)*sqrt(p);
  x = min(x,wi);
  return length(pos-vec2(x,he-x*x/ik)) * 
       sign(ik*(pos.y-he)+pos.x*pos.x);
}
`;
  }

  static sdBezier() {
    return `
float sdBezier( in vec2 pos, in vec2 A, in vec2 B, in vec2 C )
{  
  vec2 a = B - A;
  vec2 b = A - 2.0*B + C;
  vec2 c = a * 2.0;
  vec2 d = A - pos;
  float kk = 1.0/dot(b,b);
  float kx = kk * dot(a,b);
  float ky = kk * (2.0*dot(a,a)+dot(d,b)) / 3.0;
  float kz = kk * dot(d,a);    
  float res = 0.0;
  float p = ky - kx*kx;
  float p3 = p*p*p;
  float q = kx*(2.0*kx*kx-3.0*ky) + kz;
  float h = q*q + 4.0*p3;
  if( h >= 0.0) 
  { 
    h = sqrt(h);
    vec2 x = (vec2(h,-h)-q)/2.0;
    vec2 uv = sign(x)*pow(abs(x), vec2(1.0/3.0));
    float t = clamp( uv.x+uv.y-kx, 0.0, 1.0 );
    res = dot2(d + (c + b*t)*t);
  }
  else
  {
    float z = sqrt(-p);
    float v = acos( q/(p*z*2.0) ) / 3.0;
    float m = cos(v);
    float n = sin(v)*1.732050808;
    vec3  t = clamp(vec3(m+m,-n-m,n-m)*z-kx,0.0,1.0);
    res = min( dot2(d+(c+b*t.x)*t.x),
           dot2(d+(c+b*t.y)*t.y) );
    // the third root cannot be the closest
    // res = min(res,dot2(d+(c+b*t.z)*t.z));
  }
  return sqrt( res );
}
`;
  }

  static opRound() {
    return `
float opRound( in vec2 p, in float r )
{
  return sdShape(p) - r;
}
`;
  }

  static opOnion() {
    return `
float opOnion( in vec2 p, in float r )
{
  return abs(sdShape(p)) - r;
}
`;
  }
}
