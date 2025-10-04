// visualize orbital path from JSON data using Three.js
fetch('orbit_points.json')
  .then(response => response.json())
  .then(points => {
    const scale = 10; // Convert AU to Three.js units
    const geometry = new THREE.BufferGeometry();
    const vertices = new Float32Array(points.flat().map(v => v * scale));
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    const orbitLine = new THREE.Line(geometry, new THREE.LineBasicMaterial({color: 0xff0000}));
    scene.add(orbitLine);
  });

// Using sun and earth for context
// Sun at origin
const sunGeom = new THREE.SphereGeometry(1, 32, 32);
const sunMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
const sun = new THREE.Mesh(sunGeom, sunMat);
scene.add(sun);

// Earth, position and size scaled: for simple display, use [1, 0, 0] * scale
const earthGeom = new THREE.SphereGeometry(0.1, 32, 32); // smaller radius
const earthMat = new THREE.MeshBasicMaterial({ color: 0x0000ff });
const earth = new THREE.Mesh(earthGeom, earthMat);
earth.position.x = scale; // Earth at 1 AU from Sun
scene.add(earth);