/**
 * Mindwave Visualizer3D - Restored "PERFECT" Version (March 12th Afternoon)
 * ──────────────────────────────────────────────────────────────────────────
 * This version uses the original naming conventions:
 * - Matrix Label -> Internal 'cyber' (3D Matrix/Interstellar effect)
 * - Cyber Label  -> Internal 'matrix' (2D Cyber Overlay effect)
 * 
 * Based on nuclear_v4 with custom compatibility mapping.
 */

import { state, els, THEMES } from '../state_vPERFECT.js';

let viz3D = null;

export class Visualizer3D {
    constructor(canvas, initialState = {}) {
        this.isVisualizer3D = true;
        this.canvas = canvas;
        this.renderer = null;
        this.scene = null;
        this.camera = null;
        this.initialized = false;
        this.active = true;
        
        // Internal State
        // Map 'interstellar' (from UI) to 'cyber' (for 3D visual)
        // Map 'matrix' (from UI) stays 'matrix' (for 2D visual)
        const initialModesInput = initialState.activeModes || new Set(['particles', 'matrix']);
        this.activeModes = new Set();
        initialModesInput.forEach(m => {
            if (m === 'interstellar') this.activeModes.add('cyber');
            else this.activeModes.add(m);
        });

        this.mode = initialState.mode || 'particles';
        this.mindWaveMode = initialState.mindWaveMode || false;
        this.cyberLogicMode = initialState.cyberLogicMode || 'mindwave';
        this.cyberCustomText = initialState.cyberCustomText || '';
        this.currentCyberAngle = initialState.currentCyberAngle !== undefined ? initialState.currentCyberAngle : 0;
        this.cyberSpeedMultiplier = initialState.cyberSpeedMultiplier || 1.0;
        this._rainbowEnabled = initialState.rainbowEnabled || false;
        
        this.textures = {};
        this.targetFPS = 60;
        this.frameInterval = 1000 / this.targetFPS;
        this.lastFrameRenderTime = 0;
        this._isRendering = false;
        this._fpsRingBuffer = new Float32Array(60);
        this._fpsRingIndex = 0;
        this._fpsRingCount = 0;
        this._tempColor = new THREE.Color();
        this.brightnessMultiplier = 1.0;
        this.speedMultiplier = 1.0;

        // Galaxy Sun Defaults
        this.sunRotationSpeedX = 0;
        this.sunRotationSpeedY = 0.005;
        this.sunRotationSpeedZ = 0.003;
        this.galaxySunStyle = initialState.galaxySunStyle || 'sun';

        this.init();
    }

    init() {
        try {
            console.log('[Visualizer] Initializing PERFECT 3D Engine...');
            this.scene = new THREE.Scene();
            this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
            this.camera.position.z = 20;

            this.renderer = new THREE.WebGLRenderer({
                canvas: this.canvas,
                alpha: true,
                antialias: true,
                powerPreference: "high-performance"
            });
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));

            // Setup common groups
            this.sphereGroup = new THREE.Group();
            this.particleGroup = new THREE.Group();
            this.wavesGroup = new THREE.Group();
            this.lavaGroup = new THREE.Group();
            this.fireplaceGroup = new THREE.Group();
            this.rainforestGroup = new THREE.Group();
            this.zenGardenGroup = new THREE.Group();
            this.oceanGroup = new THREE.Group();
            this.cyberGroup = new THREE.Group();
            this.boxGroup = new THREE.Group();
            this.dragonGroup = new THREE.Group();
            this.galaxyGroup = new THREE.Group();
            this.mandalaGroup = new THREE.Group();

            this.scene.add(this.sphereGroup);
            this.scene.add(this.particleGroup);
            this.scene.add(this.wavesGroup);
            this.scene.add(this.lavaGroup);
            this.scene.add(this.fireplaceGroup);
            this.scene.add(this.rainforestGroup);
            this.scene.add(this.zenGardenGroup);
            this.scene.add(this.oceanGroup);
            this.scene.add(this.cyberGroup);
            this.scene.add(this.boxGroup);
            this.scene.add(this.dragonGroup);
            this.scene.add(this.galaxyGroup);
            this.scene.add(this.mandalaGroup);

            this.initEnvironment();
            this.initialized = true;

            window.addEventListener('resize', () => this.resize());
            console.log('[Visualizer] PERFECT Engine Ready');
        } catch (err) {
            console.error('[Visualizer] Initialization failed:', err);
        }
    }

    resize() {
        if (!this.renderer || !this.camera) return;
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    // Key Mapping Helper
    mapMode(mode) {
        if (mode === 'interstellar') return 'cyber'; // UI "Matrix" -> Internal 3D Rain
        if (mode === 'matrix') return 'matrix';      // UI "Cyber" -> Internal 2D Overlay
        return mode;
    }

    toggleMode(mode) {
        const target = this.mapMode(mode);
        if (this.activeModes.has(target)) {
            this.activeModes.delete(target);
        } else {
            this.activeModes.add(target);
        }
        this.mode = target;
        this.updateVisibility();
        
        // Update UI label if possible
        this.updateLabel(target);
    }

    updateVisibility() {
        // Ensure 2D Cyber Overlay logic
        if (this.activeModes.has('matrix')) {
            if (!['custom', 'mindwave', 'random', 'txt', 'mw', 'rnd', 'interstellar', 'int'].includes(this.cyberLogicMode)) {
                this.cyberLogicMode = 'matrix';
            }
        }

        this.activeModes.forEach(mode => this.ensureInitialized(mode));

        if (this.sphereGroup) this.sphereGroup.visible = this.activeModes.has('sphere');
        if (this.particleGroup) this.particleGroup.visible = this.activeModes.has('particles');
        if (this.wavesGroup) this.wavesGroup.visible = this.activeModes.has('waves');
        if (this.lavaGroup) this.lavaGroup.visible = this.activeModes.has('lava');
        if (this.fireplaceGroup) this.fireplaceGroup.visible = this.activeModes.has('fireplace');
        if (this.rainforestGroup) this.rainforestGroup.visible = this.activeModes.has('rainforest');
        if (this.zenGardenGroup) this.zenGardenGroup.visible = this.activeModes.has('zengarden');
        if (this.oceanGroup) this.oceanGroup.visible = this.activeModes.has('ocean');

        // Show 2D Cyber Overlay
        const showCyber2D = this.activeModes.has('matrix') || 
            (this.activeModes.has('cyber') && this.cyberLogicMode === 'matrix');

        if (this.cyberGroup) {
            this.cyberGroup.visible = this.activeModes.has('cyber') && !showCyber2D;
        }

        // 2D Overlay Canvas
        const overlayCanvas = document.getElementById('cyberCanvas');
        if (overlayCanvas) {
            if (showCyber2D) {
                overlayCanvas.classList.remove('hidden');
                if (!this.matrixCyberStreams || this.matrixCyberStreams.length === 0) {
                    this.generateCyberStyle();
                }
            } else {
                overlayCanvas.classList.add('hidden');
            }
        }

        if (this.boxGroup) this.boxGroup.visible = this.activeModes.has('box');
        if (this.dragonGroup) this.dragonGroup.visible = this.activeModes.has('dragon');
        if (this.galaxyGroup) this.galaxyGroup.visible = this.activeModes.has('galaxy');
        if (this.mandalaGroup) this.mandalaGroup.visible = this.activeModes.has('mandala');
    }

    updateLabel(mode) {
        const label = document.getElementById('visualLabel');
        if (label) {
            // Revert labels for the user
            if (mode === 'sphere') label.textContent = "BIO-RESONANCE";
            else if (mode === 'particles') label.textContent = "NEURAL FLOW";
            else if (mode === 'cyber') label.textContent = "MATRIX"; // Internal Cyber -> Matrix Label
            else if (mode === 'matrix') label.textContent = "THE CYBER"; // Internal Matrix -> Cyber Label
            else if (mode === 'waves') label.textContent = "FREQUENCY WAVES";
            else if (mode === 'lava') label.textContent = "LAVA LAMP";
            else if (mode === 'fireplace') label.textContent = "FIREPLACE";
            else if (mode === 'rainforest') label.textContent = "RAINFOREST";
            else if (mode === 'zengarden') label.textContent = "ZEN GARDEN";
            else if (mode === 'ocean') label.textContent = "WAVES";
            else if (mode === 'box') label.textContent = "CUBE";
            else if (mode === 'dragon') label.textContent = "DRAGON";
            else if (mode === 'galaxy') label.textContent = "GALAXY";
            else if (mode === 'multi') label.textContent = "MULTI-SENSORY";
            else label.textContent = "";
        }
    }

    ensureInitialized(mode) {
        if (mode === 'sphere' && this.sphereGroup && this.sphereGroup.children.length === 0) this.initSphere();
        if (mode === 'particles' && this.particleGroup && this.particleGroup.children.length === 0) this.initParticles();
        if (mode === 'waves' && this.wavesGroup && this.wavesGroup.children.length === 0) this.initWaves();
        if (mode === 'lava' && this.lavaGroup && this.lavaGroup.children.length === 0) this.initLava();
        if (mode === 'fireplace' && this.fireplaceGroup && this.fireplaceGroup.children.length === 0) this.initFireplace();
        if (mode === 'rainforest' && this.rainforestGroup && this.rainforestGroup.children.length === 0) this.initRainforest();
        if (mode === 'zengarden' && this.zenGardenGroup && this.zenGardenGroup.children.length === 0) this.initZenGarden();
        if (mode === 'ocean' && this.oceanGroup && this.oceanGroup.children.length === 0) this.initOcean();
        if ((mode === 'cyber' || mode === 'matrix') && this.cyberGroup && this.cyberGroup.children.length === 0) this.initCyber();
        if (mode === 'box' && this.boxGroup && this.boxGroup.children.length === 0) this.initBox();
        if (mode === 'dragon' && this.dragonGroup && this.dragonGroup.children.length === 0) this.initDragon();
        if (mode === 'galaxy' && this.galaxyGroup && this.galaxyGroup.children.length === 0) this.initGalaxy();
        if (mode === 'mandala' && this.mandalaGroup && this.mandalaGroup.children.length === 0) this.initMandala();
    }

    // Helper functions from v4
    createCircleTexture() {
        if (this.textures.circle) return this.textures.circle;
        const size = 32;
        const canvas = document.createElement('canvas');
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.beginPath();
        ctx.arc(size/2, size/2, size/2, 0, Math.PI*2);
        ctx.fillStyle = '#ffffff'; ctx.fill();
        this.textures.circle = new THREE.CanvasTexture(canvas);
        return this.textures.circle;
    }

    initSphere() {
        const geometry = new THREE.IcosahedronGeometry(5, 4);
        const material = new THREE.MeshPhongMaterial({
            color: 0x2dd4bf,
            wireframe: true,
            transparent: true,
            opacity: 0.8,
            emissive: 0x2dd4bf,
            emissiveIntensity: 0.5
        });
        this.sphere = new THREE.Mesh(geometry, material);
        this.sphereGroup.add(this.sphere);

        const coreGeo = new THREE.SphereGeometry(2, 32, 32);
        const coreMat = new THREE.MeshPhongMaterial({
            color: 0x2dd4bf,
            emissive: 0x2dd4bf,
            emissiveIntensity: 0.8
        });
        this.core = new THREE.Mesh(coreGeo, coreMat);
        this.sphereGroup.add(this.core);
    }

    initParticles() {
        const particleCount = 2000;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        for(let i=0; i<particleCount*3; i++) {
            positions[i] = (Math.random() - 0.5) * 80;
        }
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const material = new THREE.PointsMaterial({
            color: 0x2dd4bf,
            size: 0.15,
            transparent: true,
            opacity: 0.8,
            map: this.createCircleTexture()
        });
        this.particles = new THREE.Points(geometry, material);
        this.particleGroup.add(this.particles);
    }

    initWaves() {
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
    }

    initLava() {
        this.lavaBlobs = [];
        const blobCount = 16;
        for(let i=0; i<blobCount; i++) {
            const size = 0.5 + Math.random() * 1.5;
            const geo = new THREE.SphereGeometry(size, 24, 24);
            const mat = new THREE.MeshBasicMaterial({
                color: 0x60a9ff,
                transparent: true,
                opacity: 0.6,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });
            const blob = new THREE.Mesh(geo, mat);
            blob.position.set((Math.random()-0.5)*8, -15+Math.random()*30, (Math.random()-0.5)*4);
            blob.userData = {
                baseSize: size,
                state: 'rising',
                temperature: Math.random(),
                floatMin: -15, floatMax: 15,
                riseSpeed: 0.02 + Math.random()*0.03,
                fallSpeed: 0.03 + Math.random()*0.03,
                driftPhase: Math.random()*Math.PI*2
            };
            this.lavaBlobs.push(blob);
            this.lavaGroup.add(blob);
        }
    }

    initFireplace() {
        const fireGeo = new THREE.PlaneGeometry(100, 80);
        this.fireMaterial = this.createFireShader();
        this.fireMesh = new THREE.Mesh(fireGeo, this.fireMaterial);
        this.fireMesh.position.set(0, 0, -15);
        this.fireplaceGroup.add(this.fireMesh);

        this.fireLight = new THREE.PointLight(0xff6600, 5, 200);
        this.fireLight.position.set(0, 0, 30);
        this.fireplaceGroup.add(this.fireLight);

        const emberCount = 650;
        const emberGeo = new THREE.BufferGeometry();
        const emberPos = [];
        for(let i=0; i<emberCount; i++) {
            emberPos.push((Math.random()-0.5)*100, -20+Math.random()*40, -15+(Math.random()-0.5)*20);
        }
        emberGeo.setAttribute('position', new THREE.Float32BufferAttribute(emberPos, 3));
        this.emberMat = new THREE.PointsMaterial({
            color: 0xffcc00,
            size: 0.15,
            map: this.createCircleTexture(),
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        this.embers = new THREE.Points(emberGeo, this.emberMat);
        this.fireplaceGroup.add(this.embers);
        this.emberVelocities = new Float32Array(emberCount);
        for(let i=0; i<emberCount; i++) this.emberVelocities[i] = 0.02 + Math.random()*0.05;
    }

    createFireShader() {
        return new THREE.ShaderMaterial({
            uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(0xff4400) }, uSpeed: { value: 1.0 } },
            vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
            fragmentShader: `uniform float uTime; uniform vec3 uColor; varying vec2 vUv;
                vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
                float snoise(vec2 v){
                    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
                    vec2 i = floor(v + dot(v, C.yy)); vec2 x0 = v - i + dot(i, C.xx); vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
                    vec4 x12 = x0.xyxy + C.xxzz; x12.xy -= i1; i = mod(i, 289.0);
                    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
                    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
                    m = m*m; m = m*m; vec3 x = 2.0 * fract(p * C.www) - 1.0; vec3 h = abs(x) - 0.5; vec3 ox = floor(x + 0.5); vec3 a0 = x - ox;
                    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h); vec3 g; g.x = a0.x * x0.x + h.x * x0.y; g.yz = a0.yz * x12.xz + h.yz * x12.yw;
                    return 130.0 * dot(m, g);
                }
                void main() {
                    vec2 uv = vUv; float n1 = snoise(uv * 2.5 - vec2(0, uTime * 1.5)); float n2 = snoise(uv * 5.5 - vec2(0, uTime * 2.8));
                    float shape = pow(1.2 - uv.y, 1.4); float fire = n1 * 0.7 + n2 * 0.5;
                    float alpha = smoothstep(-0.2, 0.6, fire + shape * 0.7); float core = smoothstep(0.0, 0.8, fire + shape * 0.5);
                    vec3 r = vec3(1.0, 0.1, 0.0); vec3 y = vec3(1.0, 0.9, 0.0); vec3 w = vec3(1.0, 1.0, 0.9);
                    vec3 final = mix(r, y, core); final = mix(final, w, core * 0.4);
                    gl_FragColor = vec4(final, alpha);
                }`,
            transparent: true, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false
        });
    }

    initRainforest() {
        const dropCount = 800;
        const geometry = new THREE.BufferGeometry();
        const pos = []; const vels = [];
        for(let i=0; i<dropCount; i++) {
            pos.push((Math.random()-0.5)*80, -20+Math.random()*40, (Math.random()-0.5)*40);
            vels.push(0.08 + Math.random()*0.12);
        }
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        this.rainVelocities = new Float32Array(vels);
        const mat = new THREE.PointsMaterial({ color: 0x88ccff, size: 0.08, transparent: true, opacity: 0.6, depthWrite: false });
        this.raindrops = new THREE.Points(geometry, mat);
        this.rainforestGroup.add(this.raindrops);
    }

    initZenGarden() {
        const petalCount = 200;
        const geometry = new THREE.BufferGeometry();
        const pos = [];
        for(let i=0; i<petalCount; i++) pos.push((Math.random()-0.5)*80, -20+Math.random()*40, (Math.random()-0.5)*40);
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        const mat = new THREE.PointsMaterial({ color: 0xffb3d9, size: 0.2, map: this.createCircleTexture(), transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false });
        this.petals = new THREE.Points(geometry, mat);
        this.zenGardenGroup.add(this.petals);
    }

    initOcean() {
        const waveGeo = new THREE.PlaneGeometry(300, 100, 128, 64);
        const waveMat = new THREE.MeshBasicMaterial({ color: 0x00aaff, wireframe: true, transparent: true, opacity: 0.4, side: THREE.DoubleSide });
        this.oceanWave = new THREE.Mesh(waveGeo, waveMat);
        this.oceanWave.rotation.x = -Math.PI / 3;
        this.oceanWave.position.y = -2;
        this.oceanGroup.add(this.oceanWave);

        const foamCount = 300;
        const foamGeo = new THREE.BufferGeometry();
        const fpos = [];
        for(let i=0; i<foamCount; i++) fpos.push((Math.random()-0.5)*50, -2.5+Math.random()*0.5, (Math.random()-0.5)*40);
        foamGeo.setAttribute('position', new THREE.Float32BufferAttribute(fpos, 3));
        const foamMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.15, map: this.createCircleTexture(), transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false });
        this.oceanFoam = new THREE.Points(foamGeo, foamMat);
        this.oceanGroup.add(this.oceanFoam);
    }

    initCyber() {
        while(this.cyberGroup.children.length>0) {
            const c = this.cyberGroup.children[0]; this.cyberGroup.remove(c);
            if(c.geometry) c.geometry.dispose(); if(c.material) c.material.dispose();
        }
        const depth = 4, cols = 80, rows = 120;
        const geometry = new THREE.BufferGeometry();
        const pos = [], cIdx = [], spawn = [], speeds = [];
        const vw = 240, vh = 160, cw = vw/cols, rh = vh/rows;

        for(let c=0; c<cols; c++) {
            const x = (c*cw)-(vw/2)+Math.random()*cw*0.8, z = -(depth*5)-Math.random()*2, s = 0.5+Math.random()*0.5;
            const isSpecial = (this.cyberLogicMode === 'mindwave' || this.cyberLogicMode === 'mw' || this.cyberLogicMode === 'custom' || this.cyberLogicMode === 'txt');
            const isCyber = (this.cyberLogicMode === 'matrix' || this.cyberLogicMode === 'int');
            const spText = (this.cyberCustomText && (this.cyberLogicMode === 'custom' || this.cyberLogicMode === 'txt')) ? "🪷"+this.cyberCustomText : "MINDWAVE";
            const stm = Math.random()*100.0 + (isCyber ? Math.random()*100 : 0);
            for(let r=0; r<rows; r++) {
                pos.push(x, (vh/2)-(r*rh), z);
                cIdx.push(isSpecial ? r%(spText.length+1) : (isCyber ? Math.floor(Math.random()*64) : 9+Math.floor(Math.random()*55)));
                spawn.push(stm); speeds.push(s * (isCyber ? 1.5 : 1.0));
            }
        }
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        geometry.setAttribute('aCharIndex', new THREE.Float32BufferAttribute(cIdx, 1));
        geometry.setAttribute('aSpawnTime', new THREE.Float32BufferAttribute(spawn, 1));
        geometry.setAttribute('aSpeed', new THREE.Float32BufferAttribute(speeds, 1));
        const tex = this.createCyberTexture();
        this.cyberMaterial = this.createCyberShader(tex);
        this.cyberRain = new THREE.Points(geometry, this.cyberMaterial);
        this.cyberRain.renderOrder = -1;
        this.cyberGroup.add(this.cyberRain);
    }

    createCyberTexture() {
        const size = 1024; const canvas = document.createElement('canvas'); canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext('2d'); ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.fillRect(0,0,size,size);
        ctx.font = 'bold 100px Courier New, monospace'; ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        const cols = 8, rows = 8, cw = size/cols, ch = size/rows;
        let text = (this.cyberCustomText && (this.cyberLogicMode==='custom'||this.cyberLogicMode==='txt')) ? "🪷"+this.cyberCustomText : "MINDWAVE";
        if(this.cyberLogicMode==='matrix'||this.cyberLogicMode==='int') text = "";
        const seq = ["LOGO", ...([...text])];
        for(let i=0; i<64; i++) {
            const col = i%8, row = Math.floor(i/8); ctx.save(); ctx.translate(col*cw+cw/2, row*ch+ch/2);
            if(i < seq.length) {
                if(seq[i]==="LOGO") ctx.fillText("MW", 0, 0); else ctx.fillText(seq[i], 0, 0);
            } else {
                const chars = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789";
                ctx.fillText(chars.charAt(Math.floor(Math.random()*chars.length)), 0, 0);
            }
            ctx.restore();
        }
        const t = new THREE.CanvasTexture(canvas); t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; return t;
    }

    createCyberShader(texture) {
        return new THREE.ShaderMaterial({
            uniforms: { uTexture: { value: texture }, uColor: { value: new THREE.Color(0x00FF41) }, uHeadColor: { value: new THREE.Color(0xF0FFF0) }, uTime: { value: 0 }, uSpeed: { value: 1.0 }, uTailLength: { value: 1.0 }, uRainbow: { value: 0.0 }, uBrightness: { value: 1.0 } },
            vertexShader: `attribute float aCharIndex; attribute float aSpawnTime; attribute float aSpeed; uniform float uTime; uniform float uSpeed; uniform float uTailLength;
                varying float vBrightness; varying float vAlpha; varying float vCharIndex; varying vec3 vPos;
                void main() { vCharIndex = aCharIndex; vPos = position; vec4 mv = modelViewMatrix * vec4(position, 1.0);
                float head = 80.0 - mod(uTime * 5.0 * aSpeed + aSpawnTime, 160.0); float d = position.y - head; float len = 160.0 * uTailLength;
                if(d >= 0.0 && d < len) { vAlpha = 1.0-(d/len); vBrightness = 1.0-(d/len); } else { vAlpha = 0.0; vBrightness = 0.0; }
                gl_Position = projectionMatrix * mv; gl_Position.z -= 0.01; gl_PointSize = 480.0 / -mv.z; if(abs(aCharIndex)<0.1) gl_PointSize *= 1.6; }`,
            fragmentShader: `uniform sampler2D uTexture; uniform vec3 uColor; uniform vec3 uHeadColor; uniform float uBrightness; uniform float uTime;
                varying float vAlpha; varying float vCharIndex; varying float vBrightness;
                void main() { float idx = floor(vCharIndex + 0.5); float c = mod(idx, 8.0), r = 7.0 - floor(idx/8.0);
                vec2 uv = gl_PointCoord; uv.y = 1.0 - uv.y; vec2 atlas = (uv + vec2(c, r)) / 8.0; vec4 tex = texture2D(uTexture, atlas);
                if(tex.a < 0.1 || vAlpha < 0.05) discard;
                vec3 final = (vBrightness >= 0.95) ? uHeadColor : uColor;
                gl_FragColor = vec4(final * uBrightness, vAlpha * tex.a * uBrightness); }`,
            transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
        });
    }

    initBox() {
        this.boxGroup.remove(...this.boxGroup.children);
        const geo = new THREE.BoxGeometry(4, 4, 4);
        const mat = new THREE.MeshPhongMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.2 });
        this.boxOuter = new THREE.Mesh(geo, mat);
        this.boxGroup.add(this.boxOuter);
        const edgeGeo = new THREE.EdgesGeometry(geo);
        const edgeMat = new THREE.LineBasicMaterial({ color: 0x3b82f6 });
        this.boxEdges = new THREE.LineSegments(edgeGeo, edgeMat);
        this.boxGroup.add(this.boxEdges);
        const innerGeo = new THREE.BoxGeometry(3.8, 3.8, 3.8);
        const innerMat = new THREE.MeshPhongMaterial({ color: 0x3b82f6, wireframe: true });
        this.boxInner = new THREE.Mesh(innerGeo, innerMat);
        this.boxGroup.add(this.boxInner);
    }

    initDragon() {
        this.dragonLength = 40; this.dragonDummy = new THREE.Object3D();
        const bodyGeo = new THREE.SphereGeometry(0.5, 16, 16);
        const bodyMat = new THREE.MeshPhongMaterial({ color: 0xff4400, emissive: 0xff4400, emissiveIntensity: 0.5 });
        this.dragonBodyInstanced = new THREE.InstancedMesh(bodyGeo, bodyMat, this.dragonLength);
        this.dragonGroup.add(this.dragonBodyInstanced);
        const headGeo = new THREE.ConeGeometry(0.8, 2, 16);
        const headMat = new THREE.MeshPhongMaterial({ color: 0xffcc00 });
        this.dragonHead = new THREE.Mesh(headGeo, headMat);
        this.dragonHead.rotation.x = Math.PI / 2;
        this.dragonGroup.add(this.dragonHead);
        this.dragonGlowInstanced = new THREE.InstancedMesh(bodyGeo, new THREE.MeshBasicMaterial({ color: 0xff8800, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending }), this.dragonLength);
        this.dragonGroup.add(this.dragonGlowInstanced);
        this.dragonPearlGroup = new THREE.Group();
        this.dragonPearl = new THREE.Mesh(new THREE.SphereGeometry(0.4, 32, 32), new THREE.MeshPhongMaterial({ color: 0xffffff, emissive: 0x00ffff, emissiveIntensity: 1 }));
        this.dragonPearlGroup.add(this.dragonPearl);
        this.dragonGroup.add(this.dragonPearlGroup);
    }

    initGalaxy() {
        const starCount = 5000;
        const geometry = new THREE.BufferGeometry();
        const pos = [];
        for(let i=0; i<starCount; i++) {
            const r = 20 + Math.random()*80, theta = Math.random()*Math.PI*2, phi = Math.random()*Math.PI;
            pos.push(r*Math.sin(phi)*Math.cos(theta), r*Math.sin(phi)*Math.sin(theta), r*Math.cos(phi));
        }
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        const mat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.2, map: this.createStarTexture(), transparent: true, opacity: 0.8 });
        this.galaxyStars = new THREE.Points(geometry, mat);
        this.galaxyGroup.add(this.galaxyStars);
        this.galaxySunMesh = new THREE.Group();
        this.createGalaxySun(this.galaxySunStyle);
    }

    createStarTexture() {
        if(this.textures.star) return this.textures.star;
        const size = 64; const canvas = document.createElement('canvas'); canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext('2d'); const cx = 32, cy = 32;
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 32);
        grad.addColorStop(0, '#ffffff'); grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad; ctx.fillRect(0,0,size,size);
        this.textures.star = new THREE.CanvasTexture(canvas); return this.textures.star;
    }

    createGalaxySun(style) {
        if(this.galaxySunMesh.children.length>0) this.galaxySunMesh.remove(...this.galaxySunMesh.children);
        const sunGeo = new THREE.SphereGeometry(1.5, 32, 32);
        const sunMat = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
        const sun = new THREE.Mesh(sunGeo, sunMat);
        this.galaxySunMesh.add(sun);
        const halo = new THREE.Mesh(new THREE.SphereGeometry(2, 32, 32), new THREE.MeshBasicMaterial({ color: 0xff8800, transparent: true, opacity: 0.3 }));
        this.galaxySunMesh.add(halo);
        this.galaxyGroup.add(this.galaxySunMesh);
    }

    initMandala() {
        this.mandalaRings = [];
        const colors = [0xf59e0b, 0xfbbf24, 0xf97316, 0xfb923c, 0xef4444];
        for(let i=0; i<5; i++) {
            const r = 1.2 + i*0.8, segs = 6 + i*6;
            const mat = new THREE.MeshBasicMaterial({ color: colors[i], side: THREE.DoubleSide, transparent: true, opacity:0.4-i*0.05, blending: THREE.AdditiveBlending });
            const ring = new THREE.Mesh(new THREE.RingGeometry(r-0.05, r+0.05, segs), mat);
            ring.userData = { speed: (0.01+i*0.005)*(i%2===0?1:-1) };
            this.mandalaRings.push(ring); this.mandalaGroup.add(ring);
        }
        this.mandalaCenter = new THREE.Mesh(new THREE.CircleGeometry(0.3, 32), new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity:0.6 }));
        this.mandalaGroup.add(this.mandalaCenter);
    }

    initEnvironment() {
        this.sunLight = new THREE.DirectionalLight(0xfff5e1, 1.2);
        this.sunLight.position.set(50, 100, 50);
        this.scene.add(this.sunLight);
        this.ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(this.ambientLight);
    }

    render(analyserL, analyserR) {
        if(!this.initialized || !this.renderer || !this.active || document.hidden) {
            this._isRendering = false;
            return;
        }
        
        const now = performance.now();
        const delta = now - this.lastFrameRenderTime;
        
        // Throttling to target FPS
        if (delta < this.frameInterval) {
            state.animationId = requestAnimationFrame(() => this.render(analyserL, analyserR));
            return;
        }
        
        const dt = (now - this.lastFrameRenderTime) * 0.001;
        this.lastFrameRenderTime = now;
        this._isRendering = true;

        try {
            if(!analyserL && state.analyserLeft) analyserL = state.analyserLeft;
            let normBass = 0, normMids = 0, normHighs = 0;
            if(analyserL) {
                const data = new Uint8Array(analyserL.frequencyBinCount); analyserL.getByteFrequencyData(data);
                let b=0, m=0, h=0; 
                for(let i=0; i<10; i++) b+=data[i]; normBass = (b/10)/255;
                for(let i=10; i<100; i++) m+=data[i]; normMids = (m/90)/255;
                for(let i=100; i<300; i++) h+=data[i]; normHighs = (h/200)/255;
            }
            const multiplier = this.speedMultiplier || 1.0;
            const beatPulse = (Math.sin(now * Math.PI * 2 * (state.beatFrequency || 10)) * 0.5) + 0.5;
            const vFactor = this.vibrationEnabled ? 1.0 : 0.0;
            const vBeatPulse = beatPulse * vFactor, vNormBass = normBass * vFactor;

            // Update visible modes
            if(this.activeModes.has('sphere')) {
                this.sphere.rotation.y += 0.005 * multiplier; this.sphere.rotation.z += 0.006 * multiplier;
                this.core.rotation.y -= 0.015 * multiplier; this.sphere.scale.setScalar(1 + vNormBass*0.15);
            }
            if(this.activeModes.has('particles')) {
                const pos = this.particles.geometry.attributes.position.array;
                for(let i=2; i<pos.length; i+=3) { pos[i] += 0.02*multiplier; if(pos[i]>40) pos[i]=-40; }
                this.particles.geometry.attributes.position.needsUpdate = true;
            }
            if(this.activeModes.has('lava')) {
                this.lavaBlobs.forEach(blob => {
                    const c = blob.userData;
                    if(c.state==='rising') { blob.position.y += c.riseSpeed*multiplier; if(blob.position.y>c.floatMax) c.state='falling'; }
                    else { blob.position.y -= c.fallSpeed*multiplier; if(blob.position.y<c.floatMin) c.state='rising'; }
                });
            }
            if(this.activeModes.has('ocean')) {
                const pos = this.oceanWave.geometry.attributes.position.array;
                for(let i=0; i<pos.length; i+=3) {
                    const d = Math.sqrt(pos[i]*pos[i]+pos[i+1]*pos[i+1]);
                    pos[i+2] = Math.sin(d*0.2 - now*multiplier)*1.5 * (1+normBass);
                }
                this.oceanWave.geometry.attributes.position.needsUpdate = true;
            }
            if(this.activeModes.has('cyber') && this.cyberMaterial) {
                this.cyberMaterial.uniforms.uTime.value += dt * multiplier;
            }
            if(this.activeModes.has('matrix')) {
                this.renderCyber2D();
            }

            if(this.activeModes.has('box')) this.boxOuter.rotation.y += 0.01 * multiplier;
            if(this.activeModes.has('dragon')) this.dragonGroup.rotation.y += 0.005 * multiplier;
            if(this.activeModes.has('galaxy')) {
                this.galaxyGroup.rotation.y += 0.002 * multiplier;
                if(this.galaxySunMesh) {
                    this.galaxySunMesh.rotation.x += this.sunRotationSpeedX * multiplier;
                    this.galaxySunMesh.rotation.y += this.sunRotationSpeedY * multiplier;
                    this.galaxySunMesh.rotation.z += this.sunRotationSpeedZ * multiplier;
                }
            }
            if(this.activeModes.has('mandala')) {
                this.mandalaRings.forEach(r => r.rotation.z += r.userData.speed * multiplier);
            }

            this.renderer.render(this.scene, this.camera);
            state.animationId = requestAnimationFrame(() => this.render(analyserL, analyserR));
        } catch(e) { 
            console.error(e);
            this._isRendering = false;
        }
    }

    renderCyber2D() {
        // Logic for 2D Cyber Canvas (was called Matrix back then)
        if (!this.matrixCyberStreams) this.generateCyberStyle();
        const canvas = document.getElementById('cyberCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'rgba(0,0,0,0.1)'; ctx.fillRect(0,0,canvas.width, canvas.height);
        ctx.font = '20px monospace';
        this.matrixCyberStreams.forEach(s => {
            const char = s.chars[Math.floor(Math.random()*s.chars.length)];
            ctx.fillStyle = s.color || '#00ff41';
            ctx.fillText(char, s.x, s.y);
            s.y += s.speed;
            if(s.y > canvas.height) s.y = -20;
        });
    }

    generateCyberStyle() {
        const canvas = document.getElementById('cyberCanvas');
        if(!canvas) return;
        this.matrixCyberStreams = [];
        const cols = Math.floor(canvas.width / 20);
        for(let i=0; i<cols; i++) {
            this.matrixCyberStreams.push({
                x: i*20, y: Math.random()*canvas.height,
                speed: 2 + Math.random()*5,
                chars: "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉ".split(""),
                color: '#00ff41'
            });
        }
    }

    setGlobalSpeed(s) { this.speedMultiplier = s; }
    setGlobalBrightness(b) { this.brightnessMultiplier = b; }
    setColor(hex) { this.customColor = new THREE.Color(hex); }
    dispose() {
        this.active = false;
        this._isRendering = false;
        if(state.animationId) {
            cancelAnimationFrame(state.animationId);
            state.animationId = null;
        }
        if(this.renderer) {
            this.renderer.dispose();
            this.renderer.forceContextLoss();
            this.renderer.domElement = null;
        }
        // Dispose of groups
        const groups = [this.sphereGroup, this.particleGroup, this.wavesGroup, this.lavaGroup, this.fireplaceGroup, this.rainforestGroup, this.zenGardenGroup, this.oceanGroup, this.cyberGroup, this.boxGroup, this.dragonGroup, this.galaxyGroup, this.mandalaGroup];
        groups.forEach(group => {
            if (!group) return;
            group.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
                    else child.material.dispose();
                }
            });
        });
    }
}

export function initVisualizer() {
    if (els.canvas) {
        viz3D = new Visualizer3D(els.canvas);
        els.canvas.activeVisualizer = viz3D;
        resumeVisuals();
    }
}
export function getVisualizer() { return viz3D; }
export function pauseVisuals() { if(viz3D) viz3D.active = false; }
export function resumeVisuals() { 
    if(viz3D) { 
        viz3D.active = true; 
        if (!viz3D._isRendering) {
            viz3D.lastFrameRenderTime = performance.now();
            viz3D.render(); 
        }
    } 
}
export function toggleVisual(m) { if(viz3D) viz3D.toggleMode(m); }
export function setVisualSpeed(s) { if(viz3D) viz3D.setGlobalSpeed(s); }
export function setVisualColor(c) { if(viz3D) viz3D.setColor(c); }
export function setVisualBrightness(b) { if(viz3D) viz3D.setGlobalBrightness(b); }
