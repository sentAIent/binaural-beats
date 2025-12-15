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
            this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
            this.renderer.setPixelRatio(window.devicePixelRatio);

            this.sphereGroup = new THREE.Group();
            this.particleGroup = new THREE.Group();
            this.scene.add(this.sphereGroup);
            this.scene.add(this.particleGroup);

            this.initSphere();
            this.initParticles();
            this.initWaves();
            this.camera.position.z = 5;
            window.addEventListener('resize', () => this.resize());
            this.resize();
            this.speedMultiplier = 1.0;
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
        const geometry = new THREE.IcosahedronGeometry(2, 2);
        const material = new THREE.MeshBasicMaterial({
            color: 0x2dd4bf, // Accent color
            wireframe: true,
            transparent: true,
            opacity: 0.5
        });
        this.sphere = new THREE.Mesh(geometry, material);

        // Inner glow
        const coreGeo = new THREE.IcosahedronGeometry(1.8, 1);
        const coreMat = new THREE.MeshBasicMaterial({
            color: 0x2dd4bf,
            transparent: true,
            opacity: 0.1,
            blending: THREE.AdditiveBlending
        });
        this.core = new THREE.Mesh(coreGeo, coreMat);

        this.sphereGroup.add(this.sphere);
        this.sphereGroup.add(this.core);
        this.sphereGroup.visible = false; // Hidden by default (Flow is default mode)
    }

    initParticles() {
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
            color: 0xa78bfa, // Purple/Theta
            size: 0.15, // Slightly larger for circles
            map: this.createCircleTexture(),
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.particles = new THREE.Points(geometry, material);
        this.particleGroup.add(this.particles);
        this.particleGroup.visible = true; // Default visible (Flow is default mode)
    }

    setMode(mode) {
        this.mode = mode;
        this.sphereGroup.visible = (mode === 'sphere');
        this.particleGroup.visible = (mode === 'particles');
        if (this.wavesGroup) this.wavesGroup.visible = (mode === 'waves');

        // Update label in UI
        const label = document.getElementById('visualLabel');
        if (label) {
            if (mode === 'sphere') label.textContent = "BIO-RESONANCE";
            else if (mode === 'particles') label.textContent = "NEURAL FLOW";
            else if (mode === 'waves') label.textContent = "FREQUENCY WAVES";
        }
    }

    initWaves() {
        this.wavesGroup = new THREE.Group();
        const geometry = new THREE.PlaneGeometry(30, 30, 64, 64);
        const material = new THREE.MeshBasicMaterial({
            color: 0x2dd4bf,
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

            // Bass (0-10)
            let bass = 0; for (let i = 0; i < 10; i++) bass += dataL[i];
            normBass = (bass / 10) / 255;

            // Mids (10-100)
            let mids = 0; for (let i = 10; i < 100; i++) mids += dataL[i];
            normMids = (mids / 90) / 255;

            // Highs (100+)
            let highs = 0; for (let i = 100; i < 300; i++) highs += dataL[i];
            normHighs = (highs / 200) / 255;
        }

        const multiplier = this.speedMultiplier || 1.0;

        // Animation Logic (Runs always)
        if (this.mode === 'sphere') {
            const scale = 1 + (normBass * 0.4);
            this.sphere.scale.setScalar(scale);
            this.core.scale.setScalar(scale * 0.9);

            // Sphere Speed: 8x faster per user request
            // Previous: 0.002 * multiplier
            // New: 0.016 * multiplier
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

            // Flow Speed: Exponential scaling for wider dynamic range
            // Min (0.1) stays slow, Max (40) is 8x faster than before
            // Use multiplier^1.5 to create gentle curve: slow at bottom, fast at top
            // At multiplier 0.1: 0.02 * 0.1^1.5 = 0.0006 (very slow)
            // At multiplier 1.0: 0.02 * 1.0 = 0.02 (normal)
            // At multiplier 40:  0.02 * 40^1.5 / 40 = 0.02 * 6.3 = 0.126 (8x faster)
            const scaledMultiplier = Math.pow(multiplier, 1.2);
            const flowSpeed = (0.015 * scaledMultiplier) + (bassKick * 0.1);

            const positions = this.particles.geometry.attributes.position.array;
            for (let i = 2; i < positions.length; i += 3) {
                positions[i] += flowSpeed;
                if (positions[i] > 10) positions[i] = -10;
            }
            this.particles.geometry.attributes.position.needsUpdate = true;
            this.particleGroup.rotation.z += (0.001 * scaledMultiplier) + (normMids * 0.005);

        } else if (this.mode === 'waves' && this.wavesMesh) {
            // Waves Animation
            const wavePositions = this.wavesMesh.geometry.attributes.position.array;
            const time = performance.now() * 0.001 * multiplier;

            for (let i = 0; i < wavePositions.length; i += 3) {
                const x = wavePositions[i];
                const y = wavePositions[i + 1]; // Actually flat plane logic
                // Calculate z (height) based on x, y and audio
                // Simple sine wave flowing
                // Improve with audio data if available
                let amp = 0.5 + (normBass * 2);
                const dist = Math.sqrt(x * x + (y * y)); // Radial?

                // Audio influence from dataL bins
                let audioOffset = 0;
                if (dataL && dataL.length > 0) {
                    // Map x to freq bin
                    const bin = Math.floor(Math.abs(x) * 5) % dataL.length;
                    audioOffset = dataL[bin] / 255;
                }

                // Z-index wave
                wavePositions[i + 2] = Math.sin(x * 0.5 + time) * Math.cos(y * 0.5 + time) * (1 + audioOffset) + (audioOffset * 2);
            }
            this.wavesMesh.geometry.attributes.position.needsUpdate = true;
            this.wavesMesh.rotation.z += 0.001 * multiplier;
        }

        this.renderer.render(this.scene, this.camera);
        state.animationId = requestAnimationFrame(() => this.render(analyserL, analyserR));
    }
}

let viz3D;

export function initVisualizer() {
    if (!viz3D && els.canvas) {
        viz3D = new Visualizer3D(els.canvas);
        viz3D.render(state.analyserLeft, state.analyserRight);
    }
}

export function getVisualizer() {
    return viz3D;
}
