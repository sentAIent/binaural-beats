import { state, els } from '../state.js';
import * as THREE from '../vendor/three.module.js';

export class Visualizer3D {
    constructor(canvas) {
        this.canvas = canvas;
        this.mode = 'particles'; // Default to Flow
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
            this.scene.add(this.sphereGroup);
            this.scene.add(this.particleGroup);
            this.scene.add(this.lavaGroup);

            this.initSphere();
            this.initParticles();
            this.initWaves();
            this.initLava();
            this.camera.position.z = 5;
            window.addEventListener('resize', () => this.resize());
            this.resize();
            this.speedMultiplier = 1.0;

            // Time Simulation
            this.lastTime = performance.now() * 0.001;
            this.simTime = 0; // Accumulated simulation time

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
        this.lavaGlow = new THREE.Mesh(glowGeometry, glowMaterial);
        this.lavaGlow.position.z = -5;
        this.lavaGroup.add(this.lavaGlow);

        this.lavaGroup.visible = false;
        console.log('[Visualizer] Physics-Enabled Lava Lamp v7 initialized');
    }


    setMode(mode) {
        // ... (unchanged)
        this.mode = mode;
        this.sphereGroup.visible = (mode === 'sphere');
        this.particleGroup.visible = (mode === 'particles');
        if (this.wavesGroup) this.wavesGroup.visible = (mode === 'waves');
        if (this.lavaGroup) this.lavaGroup.visible = (mode === 'lava');

        const label = document.getElementById('visualLabel');
        if (label) {
            if (mode === 'sphere') label.textContent = "BIO-RESONANCE";
            else if (mode === 'particles') label.textContent = "NEURAL FLOW";
            else if (mode === 'waves') label.textContent = "FREQUENCY WAVES";
            else if (mode === 'lava') label.textContent = "LAVA LAMP";
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
        // ... (unchanged)
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
        if (this.mode === 'sphere') {
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

        } else if (this.mode === 'particles') { // Flow
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

        } else if (this.mode === 'lava' && this.lavaBlobs) {
            // Updated Lava Animation: EASE-OUT, INCHING & 2-7s IDLE TIMING

            // 1. Calculate Global Speed Factor (Motion, Physics rate)
            // 1. Calculate Global Speed Factor (Motion, Physics rate)
            // Updated: Direct scaling without floor for better sync sensitivity
            const speedFactor = this.speedMultiplier * 0.04;

            // 2. Accumulate Simulation Time
            this.simTime += dt * speedFactor * 15.0;

            this.lavaBlobs.forEach((blob) => {
                const ud = blob.userData;

                // STATE MACHINE
                if (ud.state === 'heating') {
                    // Resting Steps: 2-7s duration relative to speedMultiplier
                    // New formula: Rate * SpeedMultiplier * DeltaTime
                    ud.temperature += ud.heatRate * this.speedMultiplier * dt;

                    // Inch forward effect: bob with noise
                    const shimmer = Math.sin(this.simTime * 0.5 + ud.driftPhase) * 0.1;
                    blob.position.y = ud.floatMin + shimmer;

                    if (ud.temperature >= 1.0) {
                        ud.temperature = 1.0;
                        ud.state = 'rising';
                    }

                } else if (ud.state === 'rising') {
                    // Smooth Rise with Ease-Out
                    const distToTop = ud.floatMax - blob.position.y;
                    const ease = Math.max(0.2, Math.min(1.0, distToTop * 0.3));

                    blob.position.y += ud.riseSpeed * speedFactor * 4.0 * ease;

                    if (blob.position.y >= ud.floatMax) {
                        blob.position.y = ud.floatMax;
                        ud.state = 'cooling';
                    }

                } else if (ud.state === 'cooling') {
                    // Resting Steps: 2-7s duration relative to speedMultiplier
                    ud.temperature -= ud.coolRate * this.speedMultiplier * dt;

                    // INCHING EFFECT using simTime
                    const sag = Math.abs(Math.sin(this.simTime * 0.3 + ud.driftPhase)) * (1.0 - ud.temperature) * 0.5;
                    blob.position.y = ud.floatMax - sag;

                    if (ud.temperature <= 0.0) {
                        ud.temperature = 0.0;
                        ud.state = 'falling';
                    }

                } else if (ud.state === 'falling') {
                    // Smooth Fall with Ease-Out
                    const distToBottom = blob.position.y - ud.floatMin;
                    const ease = Math.max(0.2, Math.min(1.0, distToBottom * 0.3));

                    blob.position.y -= ud.fallSpeed * speedFactor * 4.0 * ease;

                    if (blob.position.y <= ud.floatMin) {
                        blob.position.y = ud.floatMin;
                        ud.state = 'heating';
                    }
                }

                // VISUALS
                const bassKick = normBass * 0.1;

                // Scale Dynamics using simTime
                const tempScale = 0.8 + (ud.temperature * 0.4);
                const blobScale = tempScale + bassKick + (Math.sin(this.simTime * 0.2 + ud.wobblePhase) * 0.05);

                // STRETCH DYANMICS
                let stretchY = 1.0;

                // Heating/Rising
                if (ud.state === 'heating') stretchY = 1.0 + (ud.temperature * 0.1);
                if (ud.state === 'rising') stretchY = 1.15;

                // Cooling: SAG effect 
                if (ud.state === 'cooling') {
                    stretchY = 1.0 + ((1.0 - ud.temperature) * 0.2);
                }

                // Falling
                if (ud.state === 'falling') stretchY = 1.1;

                // Apply Stretch
                const stretchXZ = 1.0 / Math.sqrt(stretchY);
                blob.scale.set(blobScale * stretchXZ, blobScale * stretchY, blobScale * stretchXZ);

                // Opacity
                const baseOpacity = 0.3 + (ud.temperature * 0.5);
                blob.material.opacity = baseOpacity + (normMids * 0.15);

                // Drift
                ud.driftPhase += ud.driftSpeed * speedFactor * 0.1;
                blob.position.x += Math.sin(ud.driftPhase) * 0.02 * speedFactor;
                blob.position.z += Math.cos(ud.driftPhase * 1.3) * 0.02 * speedFactor;

                // Constrain X
                if (blob.position.x > 8) blob.position.x -= 0.05;
                if (blob.position.x < -8) blob.position.x += 0.05;
            });

            // Container rotation using simTime
            this.lavaGroup.rotation.y += 0.0002 * speedFactor;

            if (this.lavaGlow) {
                this.lavaGlow.material.opacity = 0.05 + (normBass * 0.05);
            }

        } else if (this.mode === 'waves' && this.wavesMesh) {
            // ... (unchanged)
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

        this.renderer.clear();
        this.renderer.render(this.scene, this.camera);
        state.animationId = requestAnimationFrame(() => this.render(analyserL, analyserR));
    }
}


let viz3D;

export function initVisualizer() {
    if (!viz3D && els.canvas) {
        viz3D = new Visualizer3D(els.canvas);
        // Render initial frame so Flow particles are visible on load
        viz3D.renderSingleFrame();
        // Don't auto-start render loop - visuals start paused
        // resumeVisuals() will start the render loop when user clicks play
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
        console.log('[Visualizer] Visuals paused');
    }
}

export function resumeVisuals() {
    if (viz3D && !state.animationId && visualsPaused) {
        viz3D.render(state.analyserLeft, state.analyserRight);
        visualsPaused = false;
        console.log('[Visualizer] Visuals resumed');
    }
}

export function isVisualsPaused() {
    return visualsPaused;
}
