import { state, els } from '../state.js';
import * as THREE from '../vendor/three.module.js';

export class Visualizer3D {
    constructor(canvas) {
        this.canvas = canvas;
        this.canvas = canvas;
        this.activeModes = new Set(['particles', 'matrix']); // Default to Flow + Matrix
        this.mode = 'matrix'; // Legacy support

        // Default settings - MUST be set before init methods
        this.mindWaveMode = true; // Legacy support (keep true)
        this.matrixLogicMode = 'mindwave'; // New Mode: 'classic', 'mindwave', 'custom'
        this.matrixCustomText = "MINDWAVE"; // Default text
        this.currentMatrixAngle = 0; // Default Angle
        this.matrixSpeedMultiplier = 1.0; // Default speed to avoid NaN


        try {
            this.scene = new THREE.Scene();
            this.camera = new THREE.PerspectiveCamera(75, canvas.width / canvas.height, 0.1, 1000);
            this.renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
            this.renderer.autoClear = false; // Prevent black flash on frame drops
            this.renderer.setClearColor(0x000000, 0); // Transparent background
            this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap at 2x for performance

            this.sphereGroup = new THREE.Group();
            this.particleGroup = new THREE.Group();
            this.lavaGroup = new THREE.Group();
            this.fireplaceGroup = new THREE.Group();
            this.rainforestGroup = new THREE.Group();
            this.zenGardenGroup = new THREE.Group();
            this.oceanGroup = new THREE.Group();
            this.scene.add(this.sphereGroup);
            this.scene.add(this.particleGroup);
            this.scene.add(this.lavaGroup);
            this.scene.add(this.fireplaceGroup);
            this.scene.add(this.rainforestGroup);
            this.scene.add(this.zenGardenGroup);
            this.scene.add(this.oceanGroup);

            this.matrixGroup = new THREE.Group();
            this.scene.add(this.matrixGroup);

            this.initSphere();
            this.initParticles();
            this.initWaves();
            this.initLava();
            this.initFireplace();
            this.initRainforest();
            this.initZenGarden();
            this.initOcean();
            this.initMatrix();
            this.camera.position.z = 5;
            this.initMatrix();
            this.camera.position.z = 5;

            // Dynamic Layout Handling
            this.handleLayoutChange = this.handleLayoutChange.bind(this);
            window.addEventListener('resize', () => {
                this.resize();
                this.handleLayoutChange();
            });
            window.addEventListener('mindwave:layout-change', this.handleLayoutChange);

            // Initial sizing
            this.resize();
            setTimeout(this.handleLayoutChange, 100); // Delay slightly for DOM to settle
            this.speedMultiplier = 1.0;

            // Time Simulation
            this.lastTime = performance.now() * 0.001;
            this.simTime = 0; // Accumulated simulation time

            // Apply initial visibility based on activeModes defaults
            this.updateVisibility();

            this.initialized = true;
        } catch (e) {
            console.error("Three.js Init Failed:", e);
            this.initialized = false;
        }


    }

    resize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        this.renderer.setSize(width, height);
        this.canvas.width = width * window.devicePixelRatio;
        this.canvas.height = height * window.devicePixelRatio;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();

        // Ensure layout is updated after standard resize
        this.handleLayoutChange();
    }

    handleLayoutChange() {
        if (!this.renderer || !this.camera) return;

        const width = window.innerWidth;
        const height = window.innerHeight;

        // Get sidebar states
        const leftPanel = document.getElementById('leftPanel');
        const rightPanel = document.getElementById('rightPanel');

        let leftOffset = 0;
        let rightOffset = 0;

        if (leftPanel && !leftPanel.classList.contains('-translate-x-full')) {
            leftOffset = leftPanel.offsetWidth;
        }

        if (rightPanel && !rightPanel.classList.contains('translate-x-full')) {
            rightOffset = rightPanel.offsetWidth;
        }

        // Calculate available viewport
        const visibleWidth = width - leftOffset - rightOffset;

        // Center the camera in the visible area using setViewOffset
        // setViewOffset(fullWidth, fullHeight, x, y, width, height)
        // x is the offset from left

        if (visibleWidth > 0) {
            this.camera.setViewOffset(width, height, leftOffset, 0, visibleWidth, height);
            // We do NOT update aspect ratio here because setViewOffset handles the sub-frame mapping
        } else {
            // Safety fallback
            this.camera.clearViewOffset();
        }

        console.log(`[Visualizer] Layout update: L=${leftOffset} R=${rightOffset} Visible=${visibleWidth}`);
    }

    initSphere() {
        // ... (unchanged)
        const geometry = new THREE.IcosahedronGeometry(2, 2);
        const material = new THREE.MeshBasicMaterial({
            color: 0x60a9ff, // Accent color
            wireframe: true,
            transparent: true,
            opacity: 0.5
        });
        this.sphere = new THREE.Mesh(geometry, material);

        // Inner glow
        const coreGeo = new THREE.IcosahedronGeometry(1.8, 1);
        const coreMat = new THREE.MeshBasicMaterial({
            color: 0x60a9ff,
            transparent: true,
            opacity: 0.1,
            blending: THREE.AdditiveBlending
        });
        this.core = new THREE.Mesh(coreGeo, coreMat);

        this.sphereGroup.add(this.sphere);
        this.sphereGroup.add(this.core);
        this.sphereGroup.visible = false;
    }

    initParticles() {
        // ... (unchanged)
        const count = 1000;
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        for (let i = 0; i < count; i++) {
            positions.push((Math.random() - 0.5) * 20); // x
            positions.push((Math.random() - 0.5) * 20); // y
            positions.push((Math.random() - 0.5) * 20); // z
        }
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
            color: 0x60a9ff,
            size: 0.15,
            map: this.createCircleTexture(),
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.particles = new THREE.Points(geometry, material);
        this.particleGroup.add(this.particles);
        this.particleGroup.visible = true;
    }

    initLava() {
        // Redesigned: Cleaner, smoother, fewer but larger blobs
        this.lavaBlobs = [];
        // blobCount increased to ensure dense "pile up" look
        const blobCount = 16;

        // More consistent sizes, Scaled down ~40% for better fit
        const sizeCategories = [
            { count: 5, minSize: 0.5, maxSize: 0.8 },   // Small
            { count: 7, minSize: 0.9, maxSize: 1.2 },   // Medium
            { count: 4, minSize: 1.3, maxSize: 1.6 }    // Large
        ];

        let blobIndex = 0;
        sizeCategories.forEach(category => {
            for (let i = 0; i < category.count; i++) {
                const size = category.minSize + Math.random() * (category.maxSize - category.minSize);

                const geometry = new THREE.SphereGeometry(size, 24, 24);
                const material = new THREE.MeshBasicMaterial({
                    color: 0x60a9ff,
                    transparent: true,
                    opacity: 0.6,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false
                });

                const blob = new THREE.Mesh(geometry, material);

                // Initialize randomly within the cycle
                // States: 'heating', 'rising', 'cooling', 'falling'
                const states = ['heating', 'rising', 'cooling', 'falling'];
                const startState = states[Math.floor(Math.random() * states.length)];

                // BOUNDS: Tightened to +/- 3.5 to keep blobs always visible on screen
                const floatMin = -3.5 + (Math.random() * 0.5); // Bottom pile
                const floatMax = 3.5 + (Math.random() * 0.5);  // Top pile

                let startY = 0;
                let startTemp = 0.5;

                if (startState === 'heating') {
                    startY = floatMin;
                    startTemp = Math.random() * 0.5;
                } else if (startState === 'rising') {
                    startY = floatMin + Math.random() * (floatMax - floatMin);
                    startTemp = 0.8 + Math.random() * 0.2;
                } else if (startState === 'cooling') {
                    startY = floatMax;
                    startTemp = 1.0 - (Math.random() * 0.3);
                } else if (startState === 'falling') {
                    startY = floatMax - Math.random() * (floatMax - floatMin);
                    startTemp = 0.2 + Math.random() * 0.3;
                }

                blob.position.set(
                    (Math.random() - 0.5) * 8, // Keep central
                    startY,
                    (Math.random() - 0.5) * 4
                );

                blob.userData = {
                    baseSize: size,
                    state: startState,
                    temperature: startTemp, // 0.0 (Cold) to 1.0 (Hot)

                    // Config
                    floatMin: floatMin,
                    floatMax: floatMax,

                    // Speeds - UPDATED for 2-7s idle duration (0.14 to 0.5 units per second)
                    heatRate: 0.14 + Math.random() * 0.36,
                    coolRate: 0.14 + Math.random() * 0.36,

                    riseSpeed: (0.02 + Math.random() * 0.03) / (size * 0.5),
                    fallSpeed: (0.03 + Math.random() * 0.03) / (size * 0.5),

                    // Wobble
                    driftPhase: Math.random() * Math.PI * 2,
                    driftSpeed: 0.01 + Math.random() * 0.02,
                    wobblePhase: Math.random() * Math.PI * 2,
                    wobbleSpeed: 0.1
                };

                this.lavaBlobs.push(blob);
                this.lavaGroup.add(blob);
                blobIndex++;
            }
        });

        // Soft uniform glow
        const glowGeometry = new THREE.PlaneGeometry(30, 40);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0x60a9ff,
            transparent: true,
            opacity: 0.05,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        // this.lavaGlow = new THREE.Mesh(glowGeometry, glowMaterial);
        // this.lavaGlow.position.z = -5;
        // this.lavaGroup.add(this.lavaGlow);

        this.lavaGroup.visible = false;
        console.log('[Visualizer] Physics-Enabled Lava Lamp v7 initialized');
    }

    initFireplace() {
        // Hyper-Realistic Luxurious Fireplace
        // Uses Volumetric-style Shader on Billboard + 3D Logs + Dynamic Lighting

        // 1. Fire Shader (Volumetric look)
        const fireWidth = 6;
        const fireHeight = 8;
        const fireGeo = new THREE.PlaneGeometry(fireWidth, fireHeight);

        this.fireMaterial = this.createFireShader();
        this.fireMesh = new THREE.Mesh(fireGeo, this.fireMaterial);
        this.fireMesh.position.set(0, -1.0, 0); // Center of flames
        this.fireMesh.renderOrder = 10; // Draw after logs

        // 2. Luxurious Logs (Dark Oak / Charred)
        const logGroup = new THREE.Group();
        const logMat = new THREE.MeshStandardMaterial({
            color: 0x2a1d15, // Dark chocolate wood
            roughness: 0.9,
            metalness: 0.0,
            emissive: 0x331100, // Inner heat
            emissiveIntensity: 0.2
        });
        const logEndMat = new THREE.MeshStandardMaterial({
            color: 0x110b07,
            roughness: 1.0,
            emissive: 0x220a00,
            emissiveIntensity: 0.3
        });

        const createLog = (x, y, z, rx, ry, rz, s) => {
            const geo = new THREE.CylinderGeometry(0.3 * s, 0.4 * s, 4 * s, 12);
            const mesh = new THREE.Mesh(geo, [logMat, logEndMat, logEndMat]);
            mesh.position.set(x, y, z);
            mesh.rotation.set(rx, ry, rz);
            mesh.castShadow = true;
            return mesh;
        };

        // Teepee / Campfire Arrangement
        logGroup.add(createLog(0, -3.5, -0.5, 0, 0, Math.PI / 2.5, 1.2)); // Left lean
        logGroup.add(createLog(0, -3.5, 0.5, 0, 0, -Math.PI / 2.5, 1.2)); // Right lean
        logGroup.add(createLog(0, -4.0, 1.0, Math.PI / 2, 0.2, 0, 1.0)); // Front bottom
        logGroup.add(createLog(0, -4.0, -1.5, Math.PI / 2, -0.2, 0, 1.1)); // Back bottom

        this.fireplaceGroup.add(logGroup);
        this.fireplaceGroup.add(this.fireMesh);

        // 3. Dynamic Lighting (Flickering Pulse)
        this.fireLight = new THREE.PointLight(0xff6600, 1, 20);
        this.fireLight.position.set(0, -2, 1);
        this.fireplaceGroup.add(this.fireLight);

        // 4. Embers (Shader-based particles)
        // Re-use simple particles for embers rising
        const emberCount = 100;
        const emberGeo = new THREE.BufferGeometry();
        const emberPos = [];
        for (let i = 0; i < emberCount; i++) {
            emberPos.push((Math.random() - 0.5) * 3, -3 + Math.random() * 2, (Math.random() - 0.5) * 3);
        }
        emberGeo.setAttribute('position', new THREE.Float32BufferAttribute(emberPos, 3));
        this.emberMat = new THREE.PointsMaterial({
            color: 0xffcc00,
            size: 0.15,
            map: this.createCircleTexture(), // Ensure circular embers
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        this.embers = new THREE.Points(emberGeo, this.emberMat);
        this.fireplaceGroup.add(this.embers);
        // Initialize velocities array
        this.emberVelocities = new Float32Array(emberCount);
        for (let i = 0; i < emberCount; i++) {
            this.emberVelocities[i] = 0.02 + Math.random() * 0.05;
        }

        this.fireplaceGroup.visible = false;
        console.log('[Visualizer] Real Fireplace initialized');
    }

    createFireShader() {
        return new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uColor: { value: new THREE.Color(0xff4400) }, // Base fire
                uSpeed: { value: 1.0 }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float uTime;
                uniform vec3 uColor;
                varying vec2 vUv;

                // Simplex Noise 2D (Standard GLSL noise)
                vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
                float snoise(vec2 v){
                    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
                    vec2 i  = floor(v + dot(v, C.yy) );
                    vec2 x0 = v - i + dot(i, C.xx);
                    vec2 i1;
                    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
                    vec4 x12 = x0.xyxy + C.xxzz;
                    x12.xy -= i1;
                    i = mod(i, 289.0);
                    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
                    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
                    m = m*m ;
                    m = m*m ;
                    vec3 x = 2.0 * fract(p * C.www) - 1.0;
                    vec3 h = abs(x) - 0.5;
                    vec3 ox = floor(x + 0.5);
                    vec3 a0 = x - ox;
                    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
                    vec3 g;
                    g.x  = a0.x  * x0.x  + h.x  * x0.y;
                    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
                    return 130.0 * dot(m, g);
                }

                void main() {
                    vec2 uv = vUv;
                    
                    // Detail noise
                    float n1 = snoise(uv * 3.0 - vec2(0, uTime * 2.0));
                    float n2 = snoise(uv * 6.0 - vec2(0, uTime * 3.5));
                    
                    // Flame shape (taper at top)
                    float shape = 1.0 - uv.y; // Bottom = 1, Top = 0
                    shape = pow(shape, 0.5); // Curve
                    
                    // Combine noise
                    float fire = n1 * 0.5 + n2 * 0.3;
                    
                    // Threshold / Mask
                    float alpha = smoothstep(0.2, 0.6, fire + shape * 0.8);
                    
                    // Core brightness
                    float core = smoothstep(0.4, 0.9, fire + shape * 0.6);
                    
                    // Colors
                    vec3 red = vec3(1.0, 0.0, 0.0);
                    vec3 yellow = vec3(1.0, 1.0, 0.0);
                    vec3 white = vec3(1.0, 1.0, 1.0);
                    
                    vec3 finalColor = mix(red, yellow, core);
                    finalColor = mix(finalColor, white, core * 0.5);
                    
                    // Side fading
                    float sideFade = 1.0 - abs(uv.x - 0.5) * 2.0;
                    alpha *= sideFade;
                    
                    gl_FragColor = vec4(finalColor, alpha);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
    }

    initRainforest() {
        // Rainforest: Falling raindrops
        const dropCount = 800;
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const velocities = [];

        for (let i = 0; i < dropCount; i++) {
            positions.push((Math.random() - 0.5) * 20);
            positions.push(-5 + Math.random() * 15);
            positions.push((Math.random() - 0.5) * 15);

            velocities.push(0.08 + Math.random() * 0.12);
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        this.rainVelocities = new Float32Array(velocities);

        const material = new THREE.PointsMaterial({
            color: 0x88ccff,
            size: 0.08,
            transparent: true,
            opacity: 0.6,
            depthWrite: false
        });

        this.raindrops = new THREE.Points(geometry, material);
        this.rainforestGroup.add(this.raindrops);

        // Green foliage backdrop
        const foliageGeo = new THREE.PlaneGeometry(40, 30);
        const foliageMat = new THREE.MeshBasicMaterial({
            color: 0x1a7a3a,
            transparent: true,
            opacity: 0.08,
            side: THREE.DoubleSide
        });
        this.foliage = new THREE.Mesh(foliageGeo, foliageMat);
        this.foliage.position.z = -10;
        this.rainforestGroup.add(this.foliage);

        this.rainforestGroup.visible = false;
        console.log('[Visualizer] Rainforest initialized');
    }

    initZenGarden() {
        // Zen Garden: Floating cherry blossom petals and ripples
        const petalCount = 200;
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const drifts = [];

        for (let i = 0; i < petalCount; i++) {
            positions.push((Math.random() - 0.5) * 15);
            positions.push(-5 + Math.random() * 12);
            positions.push((Math.random() - 0.5) * 10);

            drifts.push(Math.random() * Math.PI * 2);
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        this.petalDrifts = new Float32Array(drifts);

        const material = new THREE.PointsMaterial({
            color: 0xffb3d9,
            size: 0.2,
            map: this.createCircleTexture(),
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.petals = new THREE.Points(geometry, material);
        this.zenGardenGroup.add(this.petals);

        // Calm water surface with ripples
        const waterGeo = new THREE.PlaneGeometry(30, 30, 32, 32);
        const waterMat = new THREE.MeshBasicMaterial({
            color: 0x4488aa,
            transparent: true,
            opacity: 0.12,
            wireframe: true,
            side: THREE.DoubleSide
        });
        // this.zenWater = new THREE.Mesh(waterGeo, waterMat);
        // this.zenWater.rotation.x = -Math.PI / 2;
        // this.zenWater.position.y = -5;
        // this.zenGardenGroup.add(this.zenWater);

        this.zenGardenGroup.visible = false;
        console.log('[Visualizer] Zen Garden initialized');
    }

    initOcean() {
        // Ocean: Wave geometry + foam particles
        // Widen geometry for "Infinite" horizon effect
        const waveGeo = new THREE.PlaneGeometry(300, 100, 128, 64);
        const waveMat = new THREE.MeshBasicMaterial({
            color: 0x00aaff,
            wireframe: true,
            transparent: true,
            opacity: 0.4,
            side: THREE.DoubleSide
        });
        this.oceanWave = new THREE.Mesh(waveGeo, waveMat);
        this.oceanWave.rotation.x = -Math.PI / 3;
        this.oceanWave.position.y = -2;
        this.oceanGroup.add(this.oceanWave);

        // Foam particles
        const foamCount = 300;
        const foamGeo = new THREE.BufferGeometry();
        const foamPositions = [];

        for (let i = 0; i < foamCount; i++) {
            foamPositions.push((Math.random() - 0.5) * 30);
            foamPositions.push(-3 + Math.random() * 2);
            foamPositions.push((Math.random() - 0.5) * 20);
        }

        foamGeo.setAttribute('position', new THREE.Float32BufferAttribute(foamPositions, 3));

        const foamMat = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.15,
            map: this.createCircleTexture(),
            transparent: true,
            opacity: 0.5,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.oceanFoam = new THREE.Points(foamGeo, foamMat);
        this.oceanGroup.add(this.oceanFoam);

        this.oceanGroup.visible = false;
        console.log('[Visualizer] Ocean initialized');
    }

    createMatrixTexture() {
        const size = 512;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // Background - Transparent
        ctx.fillStyle = 'rgba(0,0,0,0)';
        ctx.fillRect(0, 0, size, size);

        // Glyphs: Authentic Matrix (Half-width Katakana + Coptic + Latin + Numerals)
        // 0x30A0 - 0x30FF is Katakana
        // We want specific "Matrix-y" characters
        const katakana = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ";
        const charPool = "MINDWAVE"; // Restricted to brand characters only to prevent random glyphs
        const special = ":・.\"=*+<>";

        // CRT GLOW EFFECT
        ctx.shadowBlur = 4;
        ctx.shadowColor = '#4bff4b'; // Phosphor green glow

        // Font: Monospace for alignment - using a font stack that likely has Japanese support
        ctx.font = 'bold 44px "Courier New", "MS Gothic", "Hiragino Kaku Gothic ProN", monospace';
        ctx.fillStyle = '#ccffcc'; // Brighter center
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const cols = 8;
        const rows = 8;
        const cellW = size / cols;
        const cellH = size / rows;

        // Determine Sequence
        let textToSpell = "MINDWAVE";
        if (this.matrixLogicMode === 'custom' && this.matrixCustomText && this.matrixCustomText.length > 0) {
            textToSpell = this.matrixCustomText;
        }

        // Build Sequence: LOGO + Text Characters
        // manualSequence will be ["LOGO", "H", "E", "L", "L", "O", ...]
        const manualSequence = ["LOGO", ...textToSpell.split('')];
        const specialCount = manualSequence.length;

        for (let i = 0; i < 64; i++) {
            // Calculate grid position
            const col = i % 8;
            const row = Math.floor(i / 8);

            // Draw background (clear)
            ctx.fillStyle = 'rgba(0,0,0,0)';
            ctx.fillRect(col * cellW, row * cellH, cellW, cellH);

            // Save state
            ctx.save();
            ctx.translate(col * cellW + cellW / 2, row * cellH + cellH / 2);

            let char = '';
            let isLogo = false;
            let allowFlip = true;

            if (i < specialCount) {
                // Special Sequence (Indices 0 to specialCount-1)
                const item = manualSequence[i];
                if (item === "LOGO") {
                    isLogo = true;
                } else {
                    char = item;
                }
                allowFlip = false;
            } else {
                // CLASSIC MODE SUPPORT:
                // Indices 10-63 should be random Katakana for when MindWave mode is OFF.
                if (i === 10) console.log("NUCLEAR TEXTURE GENERATING: HYBRID MODE (Legacy Katakana Restored)");

                const randomChar = katakana.charAt(Math.floor(Math.random() * katakana.length));
                char = randomChar;
                allowFlip = true; // Allow flipping for authentic matrix feel
            }

            // Draw Character or Logo
            ctx.fillStyle = '#00FF41'; // Standard Matrix Green
            ctx.font = 'bold 44px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowBlur = 4;
            ctx.shadowColor = '#00FF41';

            if (isLogo) {
                if (this.logoImage) {
                    // Draw Real Logo
                    const size = 44;
                    const offset = -size / 2;
                    ctx.drawImage(this.logoImage, offset, offset, size, size);
                } else {
                    // Fallback while loading or if failed
                    if (!this.logoLoading && !this.logoFailed) {
                        this.logoLoading = true;
                        const loader = new THREE.ImageLoader();
                        loader.load(
                            '/mindwave-logo.png',
                            (image) => {
                                console.log('[Visualizer] Logo loaded');
                                this.logoImage = image;
                                this.logoLoading = false;
                                if (this.matrixMaterial) {
                                    const newTexture = this.createMatrixTexture();
                                    this.matrixMaterial.uniforms.uTexture.value = newTexture;
                                }
                            },
                            undefined,
                            (err) => {
                                console.error('[Visualizer] Logo load failed', err);
                                this.logoFailed = true;
                                this.logoLoading = false;
                            }
                        );
                    }
                    // Draw placeholder if not loaded yet
                    ctx.fillText("MW", 0, 0);
                }
            } else {
                ctx.fillText(char, 0, 0);
            }

            ctx.restore();
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        return texture;
    }

    createMatrixShader(texture) {
        return new THREE.ShaderMaterial({
            uniforms: {
                uTexture: { value: texture },
                uColor: { value: new THREE.Color(0x00FF41) }, // Authentic Matrix Green
                uHeadColor: { value: new THREE.Color(0xF0FFF0) }, // White-ish green
                uTime: { value: 0 },
                uSpeed: { value: 1.0 },
                uTailLength: { value: 1.0 },
                uRainbow: { value: 1.0 } // 0.0 = false, 1.0 = true
            },
            vertexShader: `
                attribute float aCharIndex;
                attribute float aSpawnTime; // Offset for randomness
                attribute float aSpeed;     // Individual column speed
                
                uniform float uTime;
                uniform float uSpeed;
                uniform float uTailLength;
                
                varying float vBrightness;
                varying float vCharIndex;
                varying float vAlpha;
                varying vec3 vPos; // For rainbow calc
                
                void main() {
                    vCharIndex = aCharIndex;
                    vPos = position;
                    
                    // Rain Simulation Logic in Vertex Shader
                    // Calculate Y position based on time
                    float fallSpeed = aSpeed * uSpeed;
                    float yOffset = mod(uTime * fallSpeed + aSpawnTime, 100.0); // 100.0 is cycle loop
                    
                    // Calculate "Head" position of this column
                    // We need to know where the head is relative to THIS character
                    // position.y is fixed in the grid. We simulate the "stream" moving through it.
                    
                    // vUv = uv; // REMOVED: uv is not available in Points material by default and not used in fragment

                    // ... physics ...
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    
                    // Fall animation
                    // Restart every 80 units
                    // Offset by spawnTime
                    float columnHeadY = 40.0 - mod(uTime * 5.0 * aSpeed * uSpeed + aSpawnTime, 80.0);
                    
                    float dist = columnHeadY - position.y;
                    
                    // Trail length - Dynamic based on uniform
                    float trailLen = 80.0 * uTailLength;
                    if (dist >= 0.0 && dist < trailLen) {
                         // Fade out along trail
                         vAlpha = 1.0 - (dist / trailLen);
                         vBrightness = 1.0 - (dist / trailLen);
                    } else {
                         vAlpha = 0.0;
                         vBrightness = 0.0;
                    }
                    
                    gl_Position = projectionMatrix * mvPosition;
                    
                    // constant size
                    gl_PointSize = 480.0 / -mvPosition.z; // Increased by 50% (was 320.0) 

                    // DOUBLE SIZE FOR LOGO (Index 0)
                    if (abs(aCharIndex) < 0.1) {
                        gl_PointSize *= 2.0;
                    }
                }
            `,
            fragmentShader: `
                uniform sampler2D uTexture;
                uniform vec3 uColor;
                uniform vec3 uHeadColor;
                uniform float uRainbow;
                uniform float uTime;
                
                varying float vAlpha;
                varying float vCharIndex;
                varying float vBrightness; // Not used but kept for struct
                varying vec3 vPos;

                float hue2rgb(float p, float q, float t) {
                    if(t < 0.0) t += 1.0;
                    if(t > 1.0) t -= 1.0;
                    if(t < 1.0/6.0) return p + (q - p) * 6.0 * t;
                    if(t < 1.0/2.0) return q;
                    if(t < 2.0/3.0) return p + (q - p) * (2.0/3.0 - t) * 6.0;
                    return p;
                }

                vec3 hslToRgb(float h, float s, float l) {
                    float r, g, b;
                    if(s == 0.0) {
                        r = g = b = l; // achromatic
                    } else {
                        float q = l < 0.5 ? l * (1.0 + s) : l + s - l * s;
                        float p = 2.0 * l - q;
                        r = hue2rgb(p, q, h + 1.0/3.0);
                        g = hue2rgb(p, q, h);
                        b = hue2rgb(p, q, h - 1.0/3.0);
                    }
                    return vec3(r, g, b);
                }

                void main() {
                    // UV Calc - Snap index to integer to prevent float drift artifacts
                    float rawIndex = floor(vCharIndex + 0.5);
                    
                    // "Movie-like" GLITCH EFFECT:
                    // If index is > 8 (Random/Classic range), animate it to cycle through glyphs
                    // If index <= 8 (Logo/Special Text), keep it static for readability
                    
                    if (rawIndex > 8.5) {
                        float timeStep = floor(uTime * 5.0); // Change 5 times/sec (Slower/Smoother)
                        // Map index into 9..63 range cyclically
                        // (64 total - 9 reserved = 55 random slots)
                        rawIndex = 9.0 + mod((rawIndex - 9.0) + timeStep, 55.0);
                    }

                    float index = floor(rawIndex + 0.5);
                    
                    float col = mod(index, 8.0);
                    float row = floor(index / 8.0);
                    row = 7.0 - row; 
                    vec2 uv = gl_PointCoord;
                    uv.y = 1.0 - uv.y; // Flip Y for correct orientation (Canvas Top = V=1)
                    vec2 atlasUV = (uv + vec2(col, row)) / 8.0;
                    
                    vec4 texColor = texture2D(uTexture, atlasUV);
                    
                    if (texColor.a < 0.1) discard;
                    if (vAlpha < 0.05) discard;
                    
                    vec3 finalColor;
                    
                    if (uRainbow > 0.5) {
                        // Rainbow varying by X position and Time
                        float hue = fract(vPos.x * 0.05 + uTime * 0.1);
                        finalColor = hslToRgb(hue, 1.0, 0.6);
                        
                        if (vBrightness >= 0.95) {
                            finalColor = mix(finalColor, vec3(1.0), 0.5); // White hot head
                        }
                    } else {
                        if (vBrightness >= 0.95) {
                            finalColor = uHeadColor;
                        } else {
                            finalColor = uColor;
                        }
                    }
                    
                    gl_FragColor = vec4(finalColor, vAlpha * texColor.a);
                }
            `,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
    }

    initMatrix() {
        // AGGRESSIVE CLEANUP: Remove EVERYTHING from the cleanup group to prevent "Sticky" MindWave characters
        while (this.matrixGroup.children.length > 0) {
            const child = this.matrixGroup.children[0];
            this.matrixGroup.remove(child);
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
            // Traverse if group
            if (child.children) {
                child.traverse((c) => {
                    if (c.geometry) c.geometry.dispose();
                    if (c.material) c.material.dispose();
                });
            }
        }
        this.matrixRotationGroup = null;
        this.matrixPoints = null;

        const depthLayer = 4; // Bring closer (was 20)
        const colCount = 80;  // Increase density (was 60)
        const rowCount = 60;
        this.rowCount = rowCount;

        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const charIndices = [];
        // New attributes for shader-driven animation
        const spawnTimes = [];
        const speeds = [];

        // Grid setup - Increased to cover frustum
        const viewWidth = 120; // Was 60
        const viewHeight = 80; // Was 45

        const colWidth = viewWidth / colCount;
        const rowHeight = viewHeight / rowCount;

        for (let c = 0; c < colCount; c++) {
            const x = (c * colWidth) - (viewWidth / 2) + ((Math.random() * 0.8) * colWidth);

            // Random depth for parallax
            const z = -(depthLayer * 5) - (Math.random() * 2);

            // Define column speed
            const speed = 0.5 + Math.random() * 0.5;

            // Column properties
            // SEQUENCE GENERATION LOGIC
            let isSpecial = false;
            let specialText = "MINDWAVE"; // Default

            if (this.matrixLogicMode === 'mindwave') {
                isSpecial = true;
                specialText = "MINDWAVE"; // Logo-MindWave
            } else if (this.matrixLogicMode === 'custom') {
                isSpecial = true;
                // Use custom text, fallback to MINDWAVE if empty
                specialText = (this.matrixCustomText && this.matrixCustomText.length > 0) ? this.matrixCustomText : "MINDWAVE";
            } else {
                // Classic / Random
                isSpecial = false;
            }

            const specialLen = specialText.length;
            // IMPORTANT: If we want CUSTOM text, we must ensure characters > 8 are mapped or we rely on the existing texture?
            // The existing texture (createMatrixTexture) likely only has "MINDWAVE" + Random Katakana.
            // WE NEED TO UPDATE createMatrixTexture TO SUPPORT CUSTOM TEXT RENDER.
            // But for now, let's just make the LOOP work with the mode switching.
            // If the text is "HELLO", and the texture only has "MINDWAVE", it will look wrong.
            // I will add a FIXME comment about texture generation.

            for (let r = 0; r < rowCount; r++) {
                const y = (viewHeight / 2) - (r * rowHeight);

                // Start time offset
                const spawnTime = Math.random() * 100.0;

                // ... logic continues ...

                positions.push(x, y, z);

                if (isSpecial) {
                    // Spell "Logo-SpecialText" (indices 0 to specialLen-1)
                    // specialLen is defined in outer scope: specialText.length + 1 (for Logo)
                    charIndices.push(r % (specialLen + 1));
                } else {
                    // Random glyphs (indices 9 to 63)
                    charIndices.push(9 + Math.floor(Math.random() * 55));
                }

                spawnTimes.push(spawnTime);
                speeds.push(speed);
            }
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('aCharIndex', new THREE.Float32BufferAttribute(charIndices, 1));
        geometry.setAttribute('aSpawnTime', new THREE.Float32BufferAttribute(spawnTimes, 1));
        geometry.setAttribute('aSpeed', new THREE.Float32BufferAttribute(speeds, 1));

        this.matrixGeometry = geometry; // Save reference for updates

        const texture = this.createMatrixTexture();
        this.matrixMaterial = this.createMatrixShader(texture);
        // this.matrixMaterial = new THREE.PointsMaterial({
        //     color: 0x00ff00,
        //     size: 2,
        //     sizeAttenuation: false
        // });

        this.matrixRain = new THREE.Points(geometry, this.matrixMaterial);
        this.matrixRain.frustumCulled = false; // Prevent culling issues
        // Group to handle rotation
        this.matrixRotationGroup = new THREE.Group();
        this.matrixRotationGroup.add(this.matrixRain);

        this.matrixGroup.add(this.matrixRotationGroup);

        // RESTORE ROTATION STATE
        if (this.currentMatrixAngle !== undefined) {
            this.matrixRotationGroup.rotation.z = THREE.MathUtils.degToRad(-this.currentMatrixAngle);
        }

        this.matrixGroup.visible = true; // Default visible for safety

        console.log('[Visualizer] Matrix (Shader Mode) initialized');
        this.updateVisibility();
    }

    setMatrixMode(enabled) {
        if (this.mindWaveMode === enabled) return;
        this.mindWaveMode = enabled;
        // SYNC LOGIC MODE
        this.matrixLogicMode = enabled ? 'mindwave' : 'classic';
        console.log('[Visualizer] Matrix MindWave Mode:', enabled, 'Logic Mode:', this.matrixLogicMode, 'VERSION: NUCLEAR_PHASE_3_CRISIS_FIX');

        // Force Texture Regeneration to ensure correct sequence
        if (enabled && this.matrixMaterial) {
            const newTexture = this.createMatrixTexture();
            this.matrixMaterial.uniforms.uTexture.value = newTexture;
            this.matrixMaterial.needsUpdate = true;
        }

        // Force Full Re-Init to ensure Geometry Attributes (Sequential Order) are applied
        this.initMatrix();
    }


    setMode(mode) {
        // Exclusive switch (Classic behavior)
        this.activeModes.clear();
        this.activeModes.add(mode);
        this.mode = mode; // Legacy sync
        this.updateVisibility();
        this.updateLabel(mode);
    }

    toggleMode(mode) {
        // Multi-mode toggle (New behavior)
        if (this.activeModes.has(mode)) {
            this.activeModes.delete(mode);
            // If empty, maybe default to something? No, allow empty.
        } else {
            this.activeModes.add(mode);
        }

        // Update legacy mode prop to last added (for simple checks)
        this.mode = mode;

        this.updateVisibility();

        // If only one mode active, update label to that. If multiple, "MULTI-SENSORY".
        if (this.activeModes.size === 1) {
            this.updateLabel(Array.from(this.activeModes)[0]);
        } else if (this.activeModes.size > 1) {
            this.updateLabel('multi');
        } else {
            this.updateLabel('none');
        }
    }

    updateVisibility() {
        if (this.sphereGroup) this.sphereGroup.visible = this.activeModes.has('sphere');
        if (this.particleGroup) this.particleGroup.visible = this.activeModes.has('particles');
        if (this.wavesGroup) this.wavesGroup.visible = this.activeModes.has('waves');
        if (this.lavaGroup) this.lavaGroup.visible = this.activeModes.has('lava');
        if (this.fireplaceGroup) this.fireplaceGroup.visible = this.activeModes.has('fireplace');
        if (this.rainforestGroup) this.rainforestGroup.visible = this.activeModes.has('rainforest');
        if (this.zenGardenGroup) this.zenGardenGroup.visible = this.activeModes.has('zengarden');
        if (this.oceanGroup) this.oceanGroup.visible = this.activeModes.has('ocean');
        if (this.matrixGroup) this.matrixGroup.visible = this.activeModes.has('matrix');
    }

    updateLabel(mode) {
        const label = document.getElementById('visualLabel');
        if (label) {
            if (mode === 'sphere') label.textContent = "BIO-RESONANCE";
            else if (mode === 'particles') label.textContent = "NEURAL FLOW";
            else if (mode === 'waves') label.textContent = "FREQUENCY WAVES";
            else if (mode === 'lava') label.textContent = "LAVA LAMP";
            else if (mode === 'fireplace') label.textContent = "FIREPLACE";
            else if (mode === 'rainforest') label.textContent = "RAINFOREST";
            else if (mode === 'zengarden') label.textContent = "ZEN GARDEN";
            else if (mode === 'ocean') label.textContent = "OCEAN WAVES";
            else if (mode === 'matrix') label.textContent = "THE MATRIX";
            else if (mode === 'multi') label.textContent = "MULTI-SENSORY";
            else label.textContent = "";
        }
    }

    initWaves() {
        // ... (unchanged)
        this.wavesGroup = new THREE.Group();
        const geometry = new THREE.PlaneGeometry(30, 30, 64, 64);
        const material = new THREE.MeshBasicMaterial({
            color: 0x60a9ff,
            wireframe: true,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        this.wavesMesh = new THREE.Mesh(geometry, material);
        this.wavesMesh.rotation.x = -Math.PI / 2;
        this.wavesGroup.add(this.wavesMesh);
        this.wavesGroup.visible = false;
        this.scene.add(this.wavesGroup);
    }

    setSpeed(speed) {
        console.log("Visual Speed Set:", speed);
        this.speedMultiplier = speed;
    }

    setColor(hex) {
        this.customColor = new THREE.Color(hex);

        if (this.particles && this.particles.material) {
            this.particles.material.color.set(hex);
        }
        if (this.sphere && this.sphere.material) {
            this.sphere.material.color.set(hex);
            this.core.material.color.set(hex);
        }
        if (this.wavesMesh && this.wavesMesh.material) {
            this.wavesMesh.material.color.set(hex);
        }
        if (this.lavaBlobs) {
            this.lavaBlobs.forEach(blob => {
                blob.material.color.set(hex);
            });
        }
        if (this.lavaGlow && this.lavaGlow.material) {
            this.lavaGlow.material.color.set(hex);
        }
        if (this.lavaBaseGlow && this.lavaBaseGlow.material) {
            this.lavaBaseGlow.material.color.set(hex);
        }

        // New visual modes color support
        if (this.flames && this.flames.material) {
            this.flames.material.color.set(hex);
        }
        if (this.fireBase && this.fireBase.material) {
            this.fireBase.material.color.set(hex);
        }
        if (this.raindrops && this.raindrops.material) {
            this.raindrops.material.color.set(hex);
        }
        if (this.foliage && this.foliage.material) {
            this.foliage.material.color.set(hex);
        }
        if (this.petals && this.petals.material) {
            this.petals.material.color.set(hex);
        }
        if (this.zenWater && this.zenWater.material) {
            this.zenWater.material.color.set(hex);
        }
        if (this.oceanWave && this.oceanWave.material) {
            this.oceanWave.material.color.set(hex);
        }
        if (this.oceanFoam && this.oceanFoam.material) {
            this.oceanFoam.material.color.set(hex);
        }
        if (this.matrixRain && this.matrixRain.material) {
            // ShaderMaterial uses uniforms, not .color property
            if (this.matrixRain.material.uniforms && this.matrixRain.material.uniforms.uColor) {
                this.matrixRain.material.uniforms.uColor.value.set(hex);
            }
        }

        // Render a single frame to show the color change even when paused
        this.renderSingleFrame();
    }

    // Render a single frame without starting the animation loop
    // Used to show color changes when visuals are paused
    renderSingleFrame() {
        if (!this.renderer || !this.scene || !this.camera) return;
        this.renderer.clear();
        this.renderer.render(this.scene, this.camera);
    }

    createCircleTexture() {
        const size = 32;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }

    render(analyserL, analyserR) {
        if (!analyserL && state.analyserLeft) analyserL = state.analyserLeft;

        // Audio Data Processing
        let normBass = 0, normMids = 0, normHighs = 0;
        let dataL = null;

        if (analyserL) {
            dataL = new Uint8Array(analyserL.frequencyBinCount);
            analyserL.getByteFrequencyData(dataL);
            let bass = 0; for (let i = 0; i < 10; i++) bass += dataL[i];
            normBass = (bass / 10) / 255;
            let mids = 0; for (let i = 10; i < 100; i++) mids += dataL[i];
            normMids = (mids / 90) / 255;
            let highs = 0; for (let i = 100; i < 300; i++) highs += dataL[i];
            normHighs = (highs / 200) / 255;
        }

        const multiplier = this.speedMultiplier || 1.0;

        // TIME MANAGEMENT
        const now = performance.now() * 0.001;
        if (!this.lastTime) this.lastTime = now;
        const dt = now - this.lastTime;
        this.lastTime = now;

        // Animation Logic
        if (this.activeModes.has('sphere')) {
            // Sphere uses real-time + simple multiplier
            const scale = 1 + (normBass * 0.4);
            this.sphere.scale.setScalar(scale);
            this.core.scale.setScalar(scale * 0.9);

            this.sphere.rotation.y += (0.016 * multiplier) + (normMids * 0.01);
            this.sphere.rotation.z += (0.008 * multiplier);

            const r = 45 / 255 + (normHighs * 0.5);
            const g = 212 / 255 - (normHighs * 0.2);
            const b = 191 / 255 + (normMids * 0.2);

            if (this.customColor) {
                this.sphere.material.color.copy(this.customColor);
                this.core.material.color.copy(this.customColor);
            } else {
                this.sphere.material.color.setRGB(r, g, b);
                this.core.material.color.setRGB(r, g, b);
            }
        }

        if (this.activeModes.has('particles')) { // Flow
            const bassKick = normBass || 0;
            const scaledMultiplier = Math.pow(multiplier, 1.2);
            const flowSpeed = (0.015 * scaledMultiplier) + (bassKick * 0.1);

            const positions = this.particles.geometry.attributes.position.array;
            for (let i = 2; i < positions.length; i += 3) {
                positions[i] += flowSpeed;
                if (positions[i] > 10) positions[i] = -10;
            }
            this.particles.geometry.attributes.position.needsUpdate = true;
            this.particleGroup.rotation.z += (0.001 * scaledMultiplier) + (normMids * 0.005);
        }

        if (this.activeModes.has('lava') && this.lavaBlobs) {
            // Updated Lava Animation: EASE-OUT, INCHING & 2-7s IDLE TIMING

            // 1. Calculate Global Speed Factor (Motion, Physics rate)
            // Updated: Direct scaling without floor for better sync sensitivity
            const speedFactor = this.speedMultiplier * 0.04;

            // Re-implementing Lava Logic based on previous view
            const time = now;

            // 2. Update Blobs
            this.lavaBlobs.forEach((blob, index) => {
                // Initialize blob state if needed
                if (!blob.userData.state) {
                    blob.userData.state = 'idle';
                    blob.userData.timer = 0;
                    blob.userData.targetY = blob.position.y;
                    blob.userData.startY = blob.position.y;
                    blob.userData.speed = 0;
                }

                // State Machine
                if (blob.userData.state === 'idle') {
                    blob.userData.timer -= (0.016 + (normBass * 0.05)) * this.speedMultiplier; // Bass reduces idle time
                    if (blob.userData.timer <= 0) {
                        // Start Moving
                        blob.userData.state = 'moving';
                        blob.userData.startY = blob.position.y;
                        // Move 1.5 - 3.0 units up or down (keep within bounds)
                        const dir = Math.random() > 0.5 ? 1 : -1;
                        let dist = 1.5 + Math.random() * 1.5;

                        // Bounds check (-4 to 4)
                        if (blob.position.y + dist > 4) dist = -dist; // Force down
                        else if (blob.position.y - dist < -4) dist = dist; // Force up
                        else dist = dir * dist; // Random

                        blob.userData.targetY = blob.position.y + dist;
                        // Duration: 2-4 seconds for the move
                        blob.userData.moveDuration = 2.0 + Math.random() * 2.0;
                        blob.userData.moveProgress = 0;
                    }
                } else if (blob.userData.state === 'moving') {
                    // Easing Animation (Cubic Ease Out)
                    blob.userData.moveProgress += (0.016 / blob.userData.moveDuration) * this.speedMultiplier * (1 + normBass);

                    if (blob.userData.moveProgress >= 1) {
                        // Finished
                        blob.position.y = blob.userData.targetY;
                        blob.userData.state = 'idle';
                        blob.userData.timer = 2.0 + Math.random() * 3.0; // 2-5s idle
                    } else {
                        // Ease Out Cubic: 1 - pow(1 - x, 3)
                        const t = blob.userData.moveProgress;
                        const ease = 1 - Math.pow(1 - t, 3);
                        blob.position.y = blob.userData.startY + (blob.userData.targetY - blob.userData.startY) * ease;
                    }
                }

                // Morphing / Wobbly effect
                const wobble = Math.sin(time * 2 + index) * 0.1;
                blob.scale.setScalar(1.0 + wobble + (normBass * 0.2));

                // Drift X slightly
                if (blob.position.x > 8) blob.position.x -= 0.05;
                if (blob.position.x < -8) blob.position.x += 0.05;
            });

            // Container rotation using simTime
            this.lavaGroup.rotation.y += 0.0002 * this.speedMultiplier;

            if (this.lavaGlow) {
                this.lavaGlow.material.opacity = 0.05 + (normBass * 0.05);
            }
        }

        if (this.activeModes.has('waves') && this.wavesMesh) {
            const wavePositions = this.wavesMesh.geometry.attributes.position.array;

            for (let i = 0; i < wavePositions.length; i += 3) {
                const x = wavePositions[i];
                const y = wavePositions[i + 1];
                let amp = 0.5 + (normBass * 2);

                let audioOffset = 0;
                if (dataL && dataL.length > 0) {
                    const bin = Math.floor(Math.abs(x) * 5) % dataL.length;
                    audioOffset = dataL[bin] / 255;
                }

                wavePositions[i + 2] = Math.sin(x * 0.5 + now * multiplier) * Math.cos(y * 0.5 + now * multiplier) * (1 + audioOffset) + (audioOffset * 2);
            }
            this.wavesMesh.geometry.attributes.position.needsUpdate = true;
            this.wavesMesh.rotation.z += 0.001 * multiplier;
        }

        if (this.activeModes.has('fireplace') && this.fireMaterial) {
            // HYPER-REALISTIC FIRE UPDATE

            // 1. Update Shader Uniforms
            this.fireMaterial.uniforms.uTime.value += dt * this.speedMultiplier;
            // Bass interaction: fire burns brighter/faster
            this.fireMaterial.uniforms.uSpeed.value = this.speedMultiplier * (1.0 + normBass * 0.5);

            // 2. Embers Animation
            if (this.embers) {
                const positions = this.embers.geometry.attributes.position.array;
                const speedFactor = this.speedMultiplier * 2.0;

                for (let i = 0; i < positions.length; i += 3) {
                    const idx = i / 3;
                    // Rise up
                    positions[i + 1] += this.emberVelocities[idx] * speedFactor;
                    // Drift (turbulent)
                    positions[i] += Math.sin(now * 2.0 + positions[i + 1]) * 0.01 * speedFactor;
                    positions[i + 2] += Math.cos(now * 1.5 + positions[i + 1]) * 0.01 * speedFactor;

                    // Reset if too high or opaque
                    if (positions[i + 1] > 4.0) {
                        positions[i + 1] = -3.0;
                        positions[i] = (Math.random() - 0.5) * 3.0;
                        positions[i + 2] = (Math.random() - 0.5) * 3.0;
                    }
                }
                this.embers.geometry.attributes.position.needsUpdate = true;
                // Embers pulse
                this.emberMat.opacity = 0.5 + Math.random() * 0.5;
            }

            // 3. Dynamic Light Flickering
            if (this.fireLight) {
                // Base intensity + Audio reaction + Random flicker
                this.fireLight.intensity = 1.0 + (normBass * 1.5) + (Math.sin(now * 10) + Math.cos(now * 23)) * 0.3;
                this.fireLight.distance = 20 + (normMids * 5);
                this.fireLight.color.setHSL(0.05 + normBass * 0.05, 1.0, 0.5);
            }
        }

        if (this.activeModes.has('rainforest') && this.raindrops) {
            // Rainforest animation: Falling rain
            const positions = this.raindrops.geometry.attributes.position.array;
            const speedFactor = this.speedMultiplier * 0.8;

            for (let i = 0; i < positions.length; i += 3) {
                positions[i + 1] -= this.rainVelocities[i / 3] * speedFactor;

                // Loop back to top
                if (positions[i + 1] < -10) {
                    positions[i + 1] = 10;
                    positions[i] = (Math.random() - 0.5) * 20;
                    positions[i + 2] = (Math.random() - 0.5) * 15;
                }
            }
            this.raindrops.geometry.attributes.position.needsUpdate = true;
            this.raindrops.material.opacity = 0.5 + (normMids * 0.2);
        }

        if (this.activeModes.has('zengarden') && this.petals) {
            // Zen Garden animation: Floating petals
            const positions = this.petals.geometry.attributes.position.array;
            const speedFactor = this.speedMultiplier * 0.3;

            for (let i = 0; i < positions.length; i += 3) {
                // Gentle fall
                positions[i + 1] -= 0.01 * speedFactor;

                // Sway
                positions[i] += Math.sin(now + positions[i + 1]) * 0.01 * speedFactor;
                positions[i + 2] += Math.cos(now + positions[i + 1]) * 0.01 * speedFactor;

                // Reset
                if (positions[i + 1] < -5) {
                    positions[i + 1] = 5;
                    positions[i] = (Math.random() - 0.5) * 20;
                    positions[i + 2] = (Math.random() - 0.5) * 20;
                }
            }
            this.petals.geometry.attributes.position.needsUpdate = true;
            // Water Ripple Shimmy
            if (this.zenWater) {
                this.zenWater.material.opacity = 0.3 + (Math.sin(now) * 0.1);
            }
        }

        if (this.activeModes.has('ocean') && this.oceanWave) {
            // Ocean animation: Waves
            const wavePositions = this.oceanWave.geometry.attributes.position.array;
            const speedFactor = this.speedMultiplier;

            for (let i = 0; i < wavePositions.length; i += 3) {
                const x = wavePositions[i];
                const y = wavePositions[i + 1];
                const distFromCenter = Math.sqrt(x * x + y * y);
                // Reduce amplitude slightly
                const amp = 1.0 + (normBass * 2.5);
                // Displace Z (normal to plane)
                wavePositions[i + 2] = Math.sin(distFromCenter * 0.2 - now * speedFactor * 0.8) * amp +
                    Math.cos(x * 0.15 + now * speedFactor * 0.6) * (amp * 0.5);
            }
            this.oceanWave.geometry.attributes.position.needsUpdate = true;

            // Foam movement
            if (this.oceanFoam) {
                const foamPositions = this.oceanFoam.geometry.attributes.position.array;
                for (let i = 0; i < foamPositions.length; i += 3) {
                    foamPositions[i] += Math.sin(now * 2 + i) * 0.02 * speedFactor;
                    foamPositions[i + 2] += Math.cos(now * 1.5 + i) * 0.02 * speedFactor;

                    // Wrap foam
                    if (foamPositions[i] > 15) foamPositions[i] = -15;
                    if (foamPositions[i] < -15) foamPositions[i] = 15;
                    if (foamPositions[i + 2] > 10) foamPositions[i + 2] = -10;
                    if (foamPositions[i + 2] < -10) foamPositions[i + 2] = 10;
                }
                this.oceanFoam.geometry.attributes.position.needsUpdate = true;
                this.oceanFoam.material.opacity = 0.4 + (normMids * 0.3);
            }
        }

        if (this.activeModes.has('matrix') && this.matrixRain) {
            // AUTHENTIC MATRIX ANIMATION (SHADER DRIVEN)

            // Failsafe: Ensure it's visible if active
            if (!this.matrixGroup.visible) {
                this.matrixGroup.visible = true;
            }

            // Audio Reactivity: Bass boosts speed slightly
            const normBass = this.getAverageFrequency(0, 10) / 255.0; // Recalculate or use existing
            const speedBoost = normBass * 0.5;
            const userSpeed = this.matrixSpeedMultiplier || 1.0;

            // Update Uniforms
            if (this.matrixMaterial && this.matrixMaterial.uniforms) {
                // Advance time
                // dt is already defined in outer scope
                const timeStep = dt * this.speedMultiplier * (1.0 + speedBoost) * userSpeed;
                this.matrixMaterial.uniforms.uTime.value += timeStep;
                this.matrixMaterial.uniforms.uSpeed.value = this.speedMultiplier * userSpeed;


            }
        }
        // For now, disable auto-spin to allow precise angle control.
        // this.matrixRotationGroup.rotation.y += 0.05 * dt; 

        // this.renderer.clear(); // REMOVED: Allow stacking (autoClear is false)
        this.renderer.render(this.scene, this.camera);

        if (this.active !== false) {
            state.animationId = requestAnimationFrame(() => this.render(analyserL, analyserR));
        }
    }

    // === MATRIX CONTROLS ===
    setMatrixColor(hexColor) {
        if (this.matrixMaterial && this.matrixMaterial.uniforms.uColor) {
            this.matrixMaterial.uniforms.uColor.value.set(hexColor);
            // Derive head color (lighter version)
            const color = new THREE.Color(hexColor);
            color.lerp(new THREE.Color(0xffffff), 0.8);
            this.matrixMaterial.uniforms.uHeadColor.value.copy(color);
        }
    }

    // Helper to get average frequency from analyser node
    getAverageFrequency(startIndex, endIndex) {
        // Find active analyser
        let analyser = state.analyserLeft || state.analyserRight;
        if (!analyser) return 0;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);

        if (startIndex === undefined) startIndex = 0;
        if (endIndex === undefined) endIndex = dataArray.length;

        let sum = 0;
        let count = 0;
        for (let i = startIndex; i < endIndex && i < dataArray.length; i++) {
            sum += dataArray[i];
            count++;
        }
        return count > 0 ? sum / count : 0;
    }

    setMatrixSpeed(speed) {
        // Speed multiplier is handled in render loop via this.speedMultiplier
        // But we can add a specific matrix speed modifier if needed
        // For now, let's stick to the global speed multiplier which is what the slider likely controls
        // Actually, let's add a specific uniform override if we want separate control
        // But the plan says "Speed Slider: For uSpeed".
        // Let's assume the UI calls setSpeedMultiplier(val) OR we add a specific matrix modifier.
        // Interstellar has "matrixSpeedMultiplier". Let's add that.
        this.matrixSpeedMultiplier = speed;
    }

    setMatrixLength(length) {
        if (this.matrixMaterial && this.matrixMaterial.uniforms.uTailLength) {
            this.matrixMaterial.uniforms.uTailLength.value = length;
        }
    }

    setMatrixRainbow(isRainbow) {
        if (this.matrixMaterial && this.matrixMaterial.uniforms && this.matrixMaterial.uniforms.uRainbow) {
            this.matrixMaterial.uniforms.uRainbow.value = isRainbow ? 1.0 : 0.0;
        }
    }

    // === NEW LOGIC MODE ===
    setMatrixLogicMode(mode, text) {
        this.matrixLogicMode = mode;
        if (text !== undefined) this.matrixCustomText = text;

        console.log('[Visualizer] Matrix Mode Set:', mode, text);

        // Regenerate everything (Texture + Geometry)
        // We need to regenerate texture if text changed.
        if (mode === 'custom' || mode === 'mindwave') {
            const newTexture = this.createMatrixTexture();
            if (this.matrixMaterial) {
                this.matrixMaterial.uniforms.uTexture.value = newTexture;
                this.matrixMaterial.needsUpdate = true;
            }
        }

        this.initMatrix();
    }

    setMatrixAngle(degrees) {
        console.log(`[Visualizer] setMatrixAngle: ${degrees}°`);
        this.currentMatrixAngle = degrees; // PERSIST STATE
        if (this.matrixRotationGroup) {
            // Convert to radians. 0 degrees = upright.
            // Rotating around Z-axis (viewing axis)
            this.matrixRotationGroup.rotation.z = THREE.MathUtils.degToRad(-degrees);
            console.log(`[Visualizer] matrixRotationGroup.rotation.z set to ${this.matrixRotationGroup.rotation.z}`);
        } else {
            console.warn('[Visualizer] matrixRotationGroup missing inside setMatrixAngle');
        }
    }
    dispose() {
        this.active = false; // Flag to stop internal loops if any
        if (this.renderer) {
            this.renderer.dispose();
            this.renderer.forceContextLoss();
            this.renderer = null;
        }
    }
}

let viz3D;

export function initVisualizer() {
    // Prevent ghosting from HMR or re-initialization
    if (els.canvas && els.canvas.activeVisualizer) {
        console.log('[Visualizer] Disposing previous instance to prevent ghosting');
        els.canvas.activeVisualizer.dispose();
        els.canvas.activeVisualizer = null;
    }

    // Also cancel any global animation loop directly from state if it exists
    if (state.animationId) {
        cancelAnimationFrame(state.animationId);
        state.animationId = null;
    }

    if (!viz3D && els.canvas) {
        viz3D = new Visualizer3D(els.canvas);
        els.canvas.activeVisualizer = viz3D; // Verify tag
        // Auto-start visuals on load for immediate feedback
        resumeVisuals();
    }
}

export function getVisualizer() {
    return viz3D;
}

// Visual pause state - starts playing on load for immediate feedback
let visualsPaused = false;

export function pauseVisuals() {
    // Always mark as paused for button sync
    visualsPaused = true;

    // Cancel animation if running
    if (viz3D && state.animationId) {
        cancelAnimationFrame(state.animationId);
        state.animationId = null;

        // Render one final frame WITHOUT clearing to freeze the current state
        if (viz3D.renderer && viz3D.scene && viz3D.camera) {
            viz3D.renderer.render(viz3D.scene, viz3D.camera);
        }

        console.log('[Visualizer] Visuals paused (frozen on last frame)');
    }
}

export function resumeVisuals() {
    if (viz3D && !state.animationId) {
        viz3D.render(state.analyserLeft, state.analyserRight);
        visualsPaused = false;
        console.log('[Visualizer] Visuals resumed');
    }
}

export function isVisualsPaused() {
    return visualsPaused;
}

export function toggleVisual(mode) {
    if (viz3D) {
        viz3D.toggleMode(mode);
    }
}

export function setVisualSpeed(speed) {
    if (viz3D) {
        viz3D.setSpeed(speed);
        // Also update Matrix speed if applicable
        if (viz3D.setMatrixSpeed) viz3D.setMatrixSpeed(speed);
    }
}

export function setVisualColor(hex) {
    if (viz3D) {
        viz3D.setColor(hex);
        // Also update Matrix color if applicable
        if (viz3D.setMatrixColor) viz3D.setMatrixColor(hex);
    }
}
