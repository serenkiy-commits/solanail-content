/* Minimal WebGL fluid noise background for the hero card.
 * No external deps. Falls back to CSS gradient if WebGL unavailable.
 * Renders into <canvas class="hero-liquid"></canvas>.
 */
(function () {
  'use strict';

  function init() {
    var canvas = document.querySelector('.hero-liquid');
    if (!canvas) return;

    var gl = canvas.getContext('webgl', { antialias: false, alpha: false }) ||
             canvas.getContext('experimental-webgl');
    if (!gl) {
      // Browser doesn't support WebGL — CSS gradient fallback already in place.
      return;
    }

    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    resize();
    window.addEventListener('resize', resize);

    // Vertex shader: full-screen quad
    var vsSrc = [
      'attribute vec2 a_pos;',
      'void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }'
    ].join('\n');

    // Fragment shader: pearlescent flowing noise in Editorial Pearl palette
    var fsSrc = [
      'precision mediump float;',
      'uniform float u_time;',
      'uniform vec2 u_res;',
      'float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }',
      'float noise(vec2 p) {',
      '  vec2 i = floor(p), f = fract(p);',
      '  f = f * f * (3.0 - 2.0 * f);',
      '  return mix(mix(hash(i),                hash(i + vec2(1.0, 0.0)), f.x),',
      '             mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);',
      '}',
      'float fbm(vec2 p) {',
      '  float v = 0.0, a = 0.5;',
      '  for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.0; a *= 0.5; }',
      '  return v;',
      '}',
      'void main() {',
      '  vec2 uv = gl_FragCoord.xy / u_res;',
      '  uv.x *= u_res.x / u_res.y;',
      '  float t = u_time * 0.04;',
      '  vec2 q = vec2(fbm(uv + t), fbm(uv - t + vec2(5.2, 1.3)));',
      '  float n = fbm(uv + q * 0.6 + t * 0.5);',
      '  /* Editorial Pearl palette */',
      '  vec3 c1 = vec3(0.984, 0.957, 0.925);  /* paper */',
      '  vec3 c2 = vec3(0.961, 0.902, 0.827);  /* paper-warm */',
      '  vec3 c3 = vec3(0.851, 0.706, 0.612);  /* rose-dust */',
      '  vec3 c4 = vec3(0.690, 0.478, 0.361);  /* rose-deep */',
      '  vec3 col = mix(c1, c2, smoothstep(0.25, 0.55, n));',
      '  col = mix(col, c3, smoothstep(0.45, 0.75, n) * 0.55);',
      '  col = mix(col, c4, smoothstep(0.7, 0.95, n) * 0.18);',
      '  gl_FragColor = vec4(col, 1.0);',
      '}'
    ].join('\n');

    function compile(type, src) {
      var s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.warn('shader compile error:', gl.getShaderInfoLog(s));
        return null;
      }
      return s;
    }

    var vs = compile(gl.VERTEX_SHADER, vsSrc);
    var fs = compile(gl.FRAGMENT_SHADER, fsSrc);
    if (!vs || !fs) return;  // bail to CSS fallback

    var prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.warn('program link error:', gl.getProgramInfoLog(prog));
      return;
    }
    gl.useProgram(prog);

    // Quad
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW);
    var locPos = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(locPos);
    gl.vertexAttribPointer(locPos, 2, gl.FLOAT, false, 0, 0);

    var uTime = gl.getUniformLocation(prog, 'u_time');
    var uRes = gl.getUniformLocation(prog, 'u_res');

    var start = performance.now();
    var paused = false;
    // Pause when tab hidden (saves battery)
    document.addEventListener('visibilitychange', function () {
      paused = document.hidden;
      if (!paused) requestAnimationFrame(render);
    });

    function render() {
      if (paused) return;
      var t = (performance.now() - start) * 0.001;
      gl.uniform1f(uTime, t);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
  }

  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
