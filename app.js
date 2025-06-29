class PianoVisualizer {
    constructor() {
        this.container = document.getElementById('three-container');
        this.pianoKeyboard = document.getElementById('piano-keyboard');
        
        // Three.js setup
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.noteObjects = [];
        this.particleSystem = null;
        this.audioContext = null;
        this.midiAccess = null;
        this.isRecording = false;
        this.mediaRecorder = null;
        this.recordedChunks = [];
        
        this.settings = {
            animationSpeed: 1.0,
            sizeMultiplier: 1.0,
            velocitySensitivity: 1.5,
            fadeDuration: 3.0,
            colorIntensity: 1.0,
            particleCount: 200,
            motionBlur: 0.3,
            glowIntensity: 1.0,
            fontFamily: 'Noto Sans JP',
            pianoRange: '3-octave',
            volume: 0.7,
            isMuted: false
        };
        
        // Piano configuration
        this.pianoConfigs = {
            '3-octave': { startNote: 48, endNote: 83, startOctave: 3, octaves: 3 }, // C3-B5
            '5-octave': { startNote: 36, endNote: 96, startOctave: 2, octaves: 5 }, // C2-C7
            '88-key': { startNote: 21, endNote: 108, startOctave: 0, octaves: 8 }   // A0-C8
        };
        
        
        this.hasMidiInput = false;
        this.midiActivityLog = [];
        this.midiDevices = [];
        this.midiInputs = new Map(); // Store MIDI input devices
        this.selectedInputDevice = 'keyboard'; // Default to computer keyboard
        
        this.noteNames = [
            'ド', 'ド#', 'レ', 'レ#', 'ミ', 'ファ', 'ファ#', 'ソ', 'ソ#', 'ラ', 'ラ#', 'シ'
        ];
        
        this.keyLayout = [
            { note: 'C', type: 'white' },
            { note: 'C#', type: 'black' },
            { note: 'D', type: 'white' },
            { note: 'D#', type: 'black' },
            { note: 'E', type: 'white' },
            { note: 'F', type: 'white' },
            { note: 'F#', type: 'black' },
            { note: 'G', type: 'white' },
            { note: 'G#', type: 'black' },
            { note: 'A', type: 'white' },
            { note: 'A#', type: 'black' },
            { note: 'B', type: 'white' }
        ];
        
        this.keyboardMapping = {
            'KeyA': 60,  // C4 (Middle C)
            'KeyW': 61,  // C#4
            'KeyS': 62,  // D4
            'KeyE': 63,  // D#4
            'KeyD': 64,  // E4
            'KeyF': 65,  // F4
            'KeyT': 66,  // F#4
            'KeyG': 67,  // G4
            'KeyY': 68,  // G#4
            'KeyH': 69,  // A4
            'KeyU': 70,  // A#4
            'KeyJ': 71,  // B4
            'KeyK': 72,  // C5
            'KeyO': 73,  // C#5
            'KeyL': 74,  // D5
            'KeyP': 75,  // D#5
            'Semicolon': 76,  // E5
            'Quote': 77,  // F5
            'BracketRight': 78,  // F#5
            'Backslash': 79   // G5
        };
        
        this.activeKeys = new Set();
        
        this.midiData = null;
        this.midiPlayer = null;
        this.isPlaying = false;
        this.currentTime = 0;
        this.totalTime = 0;
        this.playbackRate = 1.0;
        this.animationFrameId = null;
        this.clock = null;
        
        
        this.init();
    }
    
    async init() {
        await this.initAudio();
        await this.initMIDI();
        this.initThreeJS();
        this.createPianoKeyboard();
        this.setupEventListeners();
        this.setupKeyboardListeners();
        this.setupMidiControls();
        this.setupMidiDeviceSelection();
        this.setupAudioControls();
        this.startVisualization();
        
        window.addEventListener('resize', () => this.onWindowResize());
    }
    
    initThreeJS() {
        // Check if THREE is available
        if (typeof THREE === 'undefined') {
            console.error('THREE.js not loaded. Using DOM visualization.');
            return;
        }
        
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0d1421);
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        this.camera.position.set(0, 0, 10);
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true, 
            alpha: true,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        this.container.appendChild(this.renderer.domElement);
        
        // Clock for timing
        this.clock = new THREE.Clock();
        
        // Add ambient lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
        this.scene.add(ambientLight);
        
        // Add directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 7.5);
        directionalLight.castShadow = true;
        directionalLight.shadow.camera.near = 0.1;
        directionalLight.shadow.camera.far = 50;
        directionalLight.shadow.camera.left = -10;
        directionalLight.shadow.camera.right = 10;
        directionalLight.shadow.camera.top = 10;
        directionalLight.shadow.camera.bottom = -10;
        this.scene.add(directionalLight);
        
        // Create particle system for background effects
        this.createParticleSystem();
    }
    
    createParticleSystem() {
        const particleCount = this.settings.particleCount;
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 50;     // x
            positions[i + 1] = (Math.random() - 0.5) * 30; // y
            positions[i + 2] = (Math.random() - 0.5) * 20; // z
            
            const color = new THREE.Color().setHSL(Math.random(), 0.3, 0.5);
            colors[i] = color.r;
            colors[i + 1] = color.g;
            colors[i + 2] = color.b;
        }
        
        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const particleMaterial = new THREE.PointsMaterial({
            size: 0.1,
            vertexColors: true,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });
        
        this.particleSystem = new THREE.Points(particles, particleMaterial);
        this.scene.add(this.particleSystem);
    }
    
    updateParticleSystem() {
        if (this.particleSystem && this.scene) {
            // Remove old particle system
            this.scene.remove(this.particleSystem);
            this.particleSystem.geometry.dispose();
            this.particleSystem.material.dispose();
            
            // Create new one with updated count
            this.createParticleSystem();
        }
    }
    
    onWindowResize() {
        if (!this.camera || !this.renderer) return;
        
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setSize(width, height);
    }
    
    async initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            console.error('Audio context initialization failed:', error);
        }
    }
    
    async initMIDI() {
        try {
            this.midiAccess = await navigator.requestMIDIAccess({ sysex: false });
            
            // Check if any MIDI inputs are available
            let hasInputs = false;
            this.midiDevices = [];
            this.midiInputs.clear();
            
            for (let input of this.midiAccess.inputs.values()) {
                console.log(`🎹 MIDI Input connected: ${input.name}`, {
                    id: input.id,
                    manufacturer: input.manufacturer,
                    name: input.name,
                    state: input.state,
                    type: input.type
                });
                this.midiDevices.push(input.name);
                this.midiInputs.set(input.id, input);
                hasInputs = true;
            }
            
            this.updateMidiDeviceList();
            this.autoSelectMidiDevice();
            this.setupMidiInputHandlers();
            this.updateMidiStatus();
            
            if (hasInputs) {
                this.hasMidiInput = true;
                // Auto-enable 88-key mode when MIDI detected
                this.settings.pianoRange = '88-key';
                document.getElementById('piano-range').value = '88-key';
                this.recreatePianoKeyboard();
                console.log('MIDI input detected - enabled 88-key mode');
            }
            
            this.midiAccess.onstatechange = (event) => {
                const port = event.port;
                if (port.type === 'input') {
                    if (port.state === 'connected') {
                        console.log(`MIDI Input connected: ${port.name}`);
                        
                        if (!this.hasMidiInput) {
                            this.hasMidiInput = true;
                            // Auto-enable 88-key mode
                            this.settings.pianoRange = '88-key';
                            document.getElementById('piano-range').value = '88-key';
                            this.recreatePianoKeyboard();
                            console.log('MIDI input detected - enabled 88-key mode');
                        }
                        
                        // Update device list
                        if (!this.midiDevices.includes(port.name)) {
                            this.midiDevices.push(port.name);
                        }
                        this.midiInputs.set(port.id, port);
                        this.updateMidiDeviceList();
                        this.autoSelectMidiDevice();
                        this.setupMidiInputHandlers();
                        this.updateMidiStatus();
                    } else if (port.state === 'disconnected') {
                        console.log(`MIDI Input disconnected: ${port.name}`);
                        
                        // Check if any inputs are still connected
                        let stillHasInputs = false;
                        for (let input of this.midiAccess.inputs.values()) {
                            if (input.state === 'connected') {
                                stillHasInputs = true;
                                break;
                            }
                        }
                        this.hasMidiInput = stillHasInputs;
                        
                        // Remove device from list
                        this.midiDevices = this.midiDevices.filter(name => name !== port.name);
                        this.midiInputs.delete(port.id);
                        this.updateMidiDeviceList();
                        this.setupMidiInputHandlers();
                        this.updateMidiStatus();
                    }
                }
            };
            
            console.log('MIDI initialized successfully');
        } catch (error) {
            console.log('MIDI not available or permission denied:', error);
        }
    }
    
    handleMIDIMessage(message) {
        // Debug: Always log raw MIDI input to console
        const [command, note, velocity] = message.data;
        const timestamp = message.timeStamp || performance.now();
        console.log(`🎹 MIDI Input Debug:`, {
            command: command,
            commandHex: `0x${command.toString(16).toUpperCase()}`,
            note: note,
            velocity: velocity,
            timestamp: timestamp,
            selectedDevice: this.selectedInputDevice,
            rawData: Array.from(message.data)
        });
        
        // Check if MIDI input is selected (not computer keyboard)
        if (this.selectedInputDevice === 'keyboard') {
            console.log(`⚠️ MIDI input ignored - Computer keyboard selected`);
            return; // Ignore MIDI messages when keyboard is selected
        }
        
        // Check if message is from selected device (only if we have multiple devices)
        if (this.midiInputs.size > 1) {
            const selectedInput = this.getSelectedMidiInput();
            if (!selectedInput) {
                console.log(`⚠️ MIDI input ignored - No valid device selected`);
                return; // No valid MIDI device selected
            }
        } else {
            console.log(`✅ MIDI input accepted - Single device mode`);
        }
        
        // Log MIDI activity
        this.logMidiActivity(`CMD:${command} Note:${note} Vel:${velocity}`);
        
        // Handle with minimal latency
        if (command === 144 && velocity > 0) {
            // Note On
            const noteName = this.midiNoteToNoteName(note);
            console.log(`🎵 Note ON: ${noteName} (MIDI:${note}) velocity:${velocity}`);
            this.logMidiActivity(`▶ ${noteName} (${note}) vel:${velocity}`);
            this.playNote(note, velocity, timestamp);
            this.highlightPianoKey(note, true); // Highlight the key
        } else if (command === 128 || (command === 144 && velocity === 0)) {
            // Note Off
            const noteName = this.midiNoteToNoteName(note);
            console.log(`🎵 Note OFF: ${noteName} (MIDI:${note})`);
            this.logMidiActivity(`⏹ ${noteName} (${note})`);
            this.stopNote(note, timestamp);
            this.highlightPianoKey(note, false); // Remove highlight
        } else if ((command & 0xF0) === 0xB0) {
            // Control Change
            console.log(`🎛️ Control Change: CC${note} = ${velocity}`);
            this.logMidiActivity(`CC:${note} Val:${velocity}`);
        } else if ((command & 0xF0) === 0xC0) {
            // Program Change
            console.log(`🎹 Program Change: PC${note}`);
            this.logMidiActivity(`PC:${note}`);
        } else {
            // Other MIDI messages
            console.log(`🎼 Other MIDI: Command:${command} Data1:${note} Data2:${velocity}`);
            this.logMidiActivity(`Other: ${command}:${note}:${velocity}`);
        }
    }
    
    createPianoKeyboard() {
        // Clear existing keys
        this.pianoKeyboard.innerHTML = '';
        
        const config = this.pianoConfigs[this.settings.pianoRange];
        const startNote = config.startNote;
        const endNote = config.endNote;
        
        // Calculate key size based on range
        const totalKeys = endNote - startNote + 1;
        const whiteKeyCount = this.countWhiteKeys(startNote, endNote);
        const containerWidth = this.pianoKeyboard.parentElement.clientWidth - 40; // Account for padding
        let keyWidth;
        
        if (this.settings.pianoRange === '88-key') {
            keyWidth = Math.max(8, containerWidth / 52); // 52 white keys in 88-key piano
        } else {
            keyWidth = Math.max(20, Math.min(40, containerWidth / whiteKeyCount));
        }
        
        for (let midiNote = startNote; midiNote <= endNote; midiNote++) {
            const noteIndex = midiNote % 12;
            const octave = Math.floor(midiNote / 12) - 1;
            const key = this.keyLayout[noteIndex];
            const noteName = `${key.note}${octave}`;
            
            const keyElement = document.createElement('div');
            keyElement.className = `piano-key ${key.type}`;
            keyElement.dataset.note = midiNote;
            keyElement.dataset.noteName = noteName;
            if (key.type === 'white') {
                keyElement.style.width = `${keyWidth}px`;
                keyElement.style.height = '80px';
            } else {
                keyElement.style.width = `${keyWidth * 0.6}px`;
                keyElement.style.height = '50px';
                keyElement.style.marginLeft = `${-keyWidth * 0.3}px`;
                keyElement.style.marginRight = `${-keyWidth * 0.3}px`;
                keyElement.style.zIndex = '2';
            }
            
            keyElement.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.playNote(midiNote, 100, performance.now());
                keyElement.classList.add('pressed');
            });
            
            keyElement.addEventListener('mouseup', () => {
                this.stopNote(midiNote);
                keyElement.classList.remove('pressed');
            });
            
            keyElement.addEventListener('mouseleave', () => {
                this.stopNote(midiNote);
                keyElement.classList.remove('pressed');
            });
            
            this.pianoKeyboard.appendChild(keyElement);
        }
        
        // Update keyboard container size
        if (this.settings.pianoRange === '88-key') {
            this.pianoKeyboard.style.overflowX = 'auto';
            this.pianoKeyboard.style.minWidth = `${whiteKeyCount * keyWidth}px`;
            this.pianoKeyboard.style.paddingBottom = '10px'; // Space for scrollbar
        } else {
            this.pianoKeyboard.style.overflowX = 'visible';
            this.pianoKeyboard.style.minWidth = 'auto';
            this.pianoKeyboard.style.paddingBottom = '0';
        }
    }
    
    countWhiteKeys(startNote, endNote) {
        let count = 0;
        for (let note = startNote; note <= endNote; note++) {
            const noteIndex = note % 12;
            if ([0, 2, 4, 5, 7, 9, 11].includes(noteIndex)) { // White keys
                count++;
            }
        }
        return count;
    }
    
    recreatePianoKeyboard() {
        this.createPianoKeyboard();
    }
    
    playNote(midiNote, velocity, timestamp = performance.now()) {
        const frequency = this.midiNoteToFrequency(midiNote);
        const noteName = this.midiNoteToNoteName(midiNote);
        
        this.synthesizeNote(frequency, velocity);
        this.visualizeNoteThreeJS(noteName, midiNote, velocity, timestamp);
        
    }
    
    stopNote(midiNote, timestamp = performance.now()) {
        // Note stopping logic would go here for sustained notes
        // For now, just ensure the piano key highlight is removed
        this.highlightPianoKey(midiNote, false);
    }
    
    midiNoteToFrequency(midiNote) {
        return 440 * Math.pow(2, (midiNote - 69) / 12);
    }
    
    midiNoteToNoteName(midiNote) {
        const noteIndex = midiNote % 12;
        const octave = Math.floor(midiNote / 12) - 1;
        return `${this.noteNames[noteIndex]}${octave}`;
    }
    
    synthesizeNote(frequency, velocity) {
        if (!this.audioContext) return;
        
        // Check if audio is muted
        if (this.settings.isMuted) {
            console.log(`🔇 Audio synthesis skipped - muted`);
            return;
        }
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        
        // Apply both velocity and global volume settings
        const velocityVolume = (velocity / 127) * 0.3;
        const finalVolume = velocityVolume * this.settings.volume;
        
        gainNode.gain.setValueAtTime(finalVolume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 1);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 1);
        
        console.log(`🎵 Synthesized note: ${frequency.toFixed(1)}Hz, velocity:${velocity}, volume:${finalVolume.toFixed(3)}`);
    }
    
    visualizeNoteThreeJS(noteName, midiNote, velocity, timestamp) {
        // Fallback to DOM if THREE.js not available
        if (!this.scene || typeof THREE === 'undefined') {
            this.visualizeNoteFallback(noteName, midiNote, velocity);
            return;
        }
        
        const color = this.getNoteColorThreeJS(midiNote, velocity);
        const size = this.getNoteSizeMultiplier(velocity);
        
        // Create text sprite with larger canvas for better quality
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 512;
        canvas.height = 256;
        
        // Enhanced text rendering with glow effect
        const glowIntensity = this.settings.glowIntensity;
        const fontFamily = this.settings.fontFamily;
        context.fillStyle = `rgba(${color.r * 255}, ${color.g * 255}, ${color.b * 255}, 1)`;
        context.font = `bold ${80 * size}px ${fontFamily}, Arial, sans-serif`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        
        // Add glow effect
        if (glowIntensity > 0) {
            context.shadowColor = `rgba(${color.r * 255}, ${color.g * 255}, ${color.b * 255}, ${glowIntensity})`;
            context.shadowBlur = 20 * glowIntensity;
            context.shadowOffsetX = 0;
            context.shadowOffsetY = 0;
            
            // Multiple glow layers for intensity
            for (let i = 0; i < 3; i++) {
                context.fillText(noteName, 256, 128);
            }
        }
        
        // Main text
        context.shadowBlur = 5;
        context.shadowColor = 'rgba(0, 0, 0, 0.5)';
        context.shadowOffsetX = 2;
        context.shadowOffsetY = 2;
        context.fillText(noteName, 256, 128);
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        
        const spriteMaterial = new THREE.SpriteMaterial({ 
            map: texture, 
            transparent: true,
            alphaTest: 0.1
        });
        const sprite = new THREE.Sprite(spriteMaterial);
        
        // Position based on piano key
        const keyElement = this.pianoKeyboard.querySelector(`[data-note="${midiNote}"]`);
        let x = 0;
        
        if (keyElement) {
            const keyRect = keyElement.getBoundingClientRect();
            const containerRect = this.container.getBoundingClientRect();
            const relativeX = (keyRect.left + keyRect.width / 2 - containerRect.left) / containerRect.width;
            x = (relativeX - 0.5) * 20; // Map to 3D space
        } else {
            x = (Math.random() - 0.5) * 15;
        }
        
        sprite.position.set(x, -10, 0); // Start from bottom of screen
        const displaySize = size * (2 + this.settings.sizeMultiplier);
        sprite.scale.set(displaySize, displaySize * 0.7, 1);
        
        // Animation properties with velocity-based duration
        const velocityDurationMultiplier = 1 + (velocity / 127) * 0.5; // Faster notes last slightly longer
        sprite.userData = {
            startTime: timestamp,
            duration: this.settings.fadeDuration * 1000 * velocityDurationMultiplier,
            startY: -10,
            endY: 10, // Go to top of screen
            velocity: velocity,
            originalScale: size,
            displaySize: displaySize
        };
        
        this.scene.add(sprite);
        this.noteObjects.push(sprite);
        
        // Clean up old notes
        if (this.noteObjects.length > 50) {
            const oldSprite = this.noteObjects.shift();
            this.scene.remove(oldSprite);
            if (oldSprite.material.map) {
                oldSprite.material.map.dispose();
            }
            oldSprite.material.dispose();
        }
    }
    
    getNoteColorThreeJS(midiNote, velocity) {
        const modernColors = [
            { r: 1.0, g: 0.71, b: 0.76 }, // Light Pink
            { r: 1.0, g: 0.85, b: 0.73 }, // Peach
            { r: 1.0, g: 0.94, b: 0.60 }, // Light Yellow
            { r: 0.80, g: 1.0, b: 0.80 }, // Light Green
            { r: 0.68, g: 0.85, b: 0.90 }, // Light Blue
            { r: 0.87, g: 0.63, b: 0.87 }, // Plum
            { r: 1.0, g: 0.75, b: 0.80 }, // Pink
            { r: 1.0, g: 0.89, b: 0.71 }, // Moccasin
            { r: 0.94, g: 0.97, b: 1.0 }, // Alice Blue
            { r: 0.90, g: 0.90, b: 0.98 }, // Lavender
            { r: 0.69, g: 0.93, b: 0.93 }, // Pale Turquoise
            { r: 1.0, g: 0.94, b: 0.96 }  // Lavender Blush
        ];
        
        const colorIndex = (midiNote - 21) % modernColors.length;
        const baseColor = modernColors[colorIndex];
        
        const velocityFactor = Math.max(0.6, velocity / 127);
        const intensityFactor = this.settings.colorIntensity;
        
        return {
            r: Math.min(1.0, baseColor.r * velocityFactor * intensityFactor),
            g: Math.min(1.0, baseColor.g * velocityFactor * intensityFactor),
            b: Math.min(1.0, baseColor.b * velocityFactor * intensityFactor)
        };
    }
    
    getNoteSizeMultiplier(velocity) {
        const baseSize = this.settings.sizeMultiplier;
        const velocityEffect = (velocity / 127) * this.settings.velocitySensitivity;
        return Math.max(0.3, baseSize + velocityEffect);
    }
    
    getNoteSizeClass(velocity) {
        const scaledVelocity = velocity * this.settings.sizeMultiplier;
        if (scaledVelocity > 100) return 'large';
        if (scaledVelocity > 60) return 'medium';
        return 'small';
    }
    
    getNoteFontSize(velocity) {
        const baseSize = 20;
        const scaledSize = baseSize + (velocity / 127) * 30 * this.settings.sizeMultiplier;
        return Math.max(scaledSize, 16);
    }
    
    getNoteColor(midiNote, velocity) {
        const modernColors = [
            { r: 255, g: 182, b: 193 }, // Light Pink
            { r: 255, g: 218, b: 185 }, // Peach
            { r: 255, g: 239, b: 153 }, // Light Yellow
            { r: 204, g: 255, b: 204 }, // Light Green
            { r: 173, g: 216, b: 230 }, // Light Blue
            { r: 221, g: 160, b: 221 }, // Plum
            { r: 255, g: 192, b: 203 }, // Pink
            { r: 255, g: 228, b: 181 }, // Moccasin
            { r: 240, g: 248, b: 255 }, // Alice Blue
            { r: 230, g: 230, b: 250 }, // Lavender
            { r: 175, g: 238, b: 238 }, // Pale Turquoise
            { r: 255, g: 240, b: 245 }  // Lavender Blush
        ];
        
        const colorIndex = (midiNote - 21) % modernColors.length;
        const baseColor = modernColors[colorIndex];
        
        const velocityFactor = Math.max(0.6, velocity / 127);
        const intensityFactor = this.settings.colorIntensity;
        
        const r = Math.min(255, baseColor.r * velocityFactor * intensityFactor);
        const g = Math.min(255, baseColor.g * velocityFactor * intensityFactor);
        const b = Math.min(255, baseColor.b * velocityFactor * intensityFactor);
        
        const alpha = 0.8 + (velocity / 127) * 0.2;
        
        return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${alpha})`;
    }
    
    setupEventListeners() {
        const controls = {
            'animation-speed': { setting: 'animationSpeed', display: 'speed-value' },
            'size-multiplier': { setting: 'sizeMultiplier', display: 'size-value' },
            'velocity-sensitivity': { setting: 'velocitySensitivity', display: 'velocity-value' },
            'fade-duration': { setting: 'fadeDuration', display: 'fade-value' },
            'color-intensity': { setting: 'colorIntensity', display: 'color-value' },
            'particle-count': { setting: 'particleCount', display: 'particle-value' },
            'motion-blur': { setting: 'motionBlur', display: 'blur-value' },
            'glow-intensity': { setting: 'glowIntensity', display: 'glow-value' }
        };
        
        Object.entries(controls).forEach(([id, config]) => {
            const slider = document.getElementById(id);
            const display = document.getElementById(config.display);
            
            slider.addEventListener('input', (e) => {
                this.settings[config.setting] = parseFloat(e.target.value);
                display.textContent = e.target.value;
                
                // Special handling for particle count
                if (config.setting === 'particleCount') {
                    this.updateParticleSystem();
                }
            });
        });
        
        // Font family selector
        const fontSelector = document.getElementById('font-family');
        fontSelector.addEventListener('change', (e) => {
            this.settings.fontFamily = e.target.value;
        });
        
        // Piano range selector
        const rangeSelector = document.getElementById('piano-range');
        rangeSelector.addEventListener('change', (e) => {
            this.settings.pianoRange = e.target.value;
            this.recreatePianoKeyboard();
        });
        
        document.getElementById('start-recording').addEventListener('click', () => this.startRecording());
        document.getElementById('stop-recording').addEventListener('click', () => this.stopRecording());
        document.getElementById('download-recording').addEventListener('click', () => this.downloadRecording());
    }
    
    setupMidiControls() {
        const loadMidiBtn = document.getElementById('load-midi');
        const midiFileInput = document.getElementById('midi-file-input');
        const playBtn = document.getElementById('play-midi');
        const pauseBtn = document.getElementById('pause-midi');
        const stopBtn = document.getElementById('stop-midi');
        const tempoSlider = document.getElementById('tempo-slider');
        const tempoValue = document.getElementById('tempo-value');
        
        loadMidiBtn.addEventListener('click', () => {
            midiFileInput.click();
        });
        
        midiFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.loadMidiFile(file);
            }
        });
        
        playBtn.addEventListener('click', () => this.playMidi());
        pauseBtn.addEventListener('click', () => this.pauseMidi());
        stopBtn.addEventListener('click', () => this.stopMidi());
        
        tempoSlider.addEventListener('input', (e) => {
            this.playbackRate = parseFloat(e.target.value);
            tempoValue.textContent = `${e.target.value}x`;
        });
    }
    
    async loadMidiFile(file) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            this.midiData = this.parseMidi(arrayBuffer);
            
            document.getElementById('play-midi').disabled = false;
            document.getElementById('midi-info').textContent = `Loaded: ${file.name}`;
            
            this.totalTime = this.calculateTotalTime();
            console.log('MIDI file loaded successfully', this.midiData);
        } catch (error) {
            console.error('Error loading MIDI file:', error);
            document.getElementById('midi-info').textContent = 'Error loading file';
        }
    }
    
    parseMidi(arrayBuffer) {
        const view = new DataView(arrayBuffer);
        let offset = 0;
        
        const readString = (length) => {
            const str = Array.from(new Uint8Array(arrayBuffer, offset, length))
                .map(b => String.fromCharCode(b)).join('');
            offset += length;
            return str;
        };
        
        const readUInt32 = () => {
            const value = view.getUint32(offset, false);
            offset += 4;
            return value;
        };
        
        const readUInt16 = () => {
            const value = view.getUint16(offset, false);
            offset += 2;
            return value;
        };
        
        const readUInt8 = () => {
            const value = view.getUint8(offset);
            offset += 1;
            return value;
        };
        
        const readVariableLength = () => {
            let value = 0;
            let byte;
            do {
                byte = readUInt8();
                value = (value << 7) | (byte & 0x7F);
            } while (byte & 0x80);
            return value;
        };
        
        if (readString(4) !== 'MThd') {
            throw new Error('Invalid MIDI file');
        }
        
        const headerLength = readUInt32();
        const format = readUInt16();
        const trackCount = readUInt16();
        const division = readUInt16();
        
        const tracks = [];
        
        for (let i = 0; i < trackCount; i++) {
            if (readString(4) !== 'MTrk') {
                throw new Error('Invalid track header');
            }
            
            const trackLength = readUInt32();
            const trackEnd = offset + trackLength;
            const events = [];
            let runningStatus = 0;
            let time = 0;
            
            while (offset < trackEnd) {
                const deltaTime = readVariableLength();
                time += deltaTime;
                
                let status = readUInt8();
                
                if (status < 0x80) {
                    offset--;
                    status = runningStatus;
                } else {
                    runningStatus = status;
                }
                
                const event = { time, status };
                
                if ((status & 0xF0) === 0x90 || (status & 0xF0) === 0x80) {
                    event.note = readUInt8();
                    event.velocity = readUInt8();
                    event.type = (status & 0xF0) === 0x90 && event.velocity > 0 ? 'noteOn' : 'noteOff';
                    event.channel = status & 0x0F;
                } else if (status === 0xFF) {
                    const metaType = readUInt8();
                    const length = readVariableLength();
                    const data = new Uint8Array(arrayBuffer, offset, length);
                    offset += length;
                    
                    if (metaType === 0x2F) {
                        event.type = 'endOfTrack';
                    } else if (metaType === 0x51) {
                        const microsecondsPerBeat = (data[0] << 16) | (data[1] << 8) | data[2];
                        event.type = 'setTempo';
                        event.microsecondsPerBeat = microsecondsPerBeat;
                    }
                } else {
                    const length = this.getMidiEventLength(status);
                    if (length > 0) {
                        offset += length;
                    }
                }
                
                events.push(event);
            }
            
            tracks.push(events);
        }
        
        return { format, division, tracks };
    }
    
    getMidiEventLength(status) {
        const type = status & 0xF0;
        switch (type) {
            case 0x80: case 0x90: case 0xA0: case 0xB0: case 0xE0: return 2;
            case 0xC0: case 0xD0: return 1;
            default: return 0;
        }
    }
    
    calculateTotalTime() {
        if (!this.midiData) return 0;
        
        let maxTime = 0;
        const ticksPerBeat = this.midiData.division;
        let microsecondsPerBeat = 500000;
        
        this.midiData.tracks.forEach(track => {
            let currentTime = 0;
            track.forEach(event => {
                if (event.type === 'setTempo') {
                    microsecondsPerBeat = event.microsecondsPerBeat;
                }
                currentTime = event.time;
            });
            
            const timeInSeconds = (currentTime / ticksPerBeat) * (microsecondsPerBeat / 1000000);
            maxTime = Math.max(maxTime, timeInSeconds);
        });
        
        return maxTime;
    }
    
    playMidi() {
        if (!this.midiData || this.isPlaying) return;
        
        this.isPlaying = true;
        this.currentTime = 0;
        
        document.getElementById('play-midi').disabled = true;
        document.getElementById('pause-midi').disabled = false;
        document.getElementById('stop-midi').disabled = false;
        
        this.startMidiPlayback();
    }
    
    pauseMidi() {
        this.isPlaying = false;
        document.getElementById('play-midi').disabled = false;
        document.getElementById('pause-midi').disabled = true;
        
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
    }
    
    stopMidi() {
        this.isPlaying = false;
        this.currentTime = 0;
        
        document.getElementById('play-midi').disabled = false;
        document.getElementById('pause-midi').disabled = true;
        document.getElementById('stop-midi').disabled = true;
        document.getElementById('progress-fill').style.width = '0%';
        
        // Clear all piano key highlights
        const pressedKeys = this.pianoKeyboard.querySelectorAll('.piano-key.pressed');
        pressedKeys.forEach(key => key.classList.remove('pressed'));
        
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
    }
    
    startMidiPlayback() {
        const startTime = Date.now();
        const ticksPerBeat = this.midiData.division;
        let microsecondsPerBeat = 500000;
        
        const allEvents = [];
        this.midiData.tracks.forEach((track, trackIndex) => {
            track.forEach(event => {
                if (event.type === 'noteOn' || event.type === 'noteOff') {
                    const timeInSeconds = (event.time / ticksPerBeat) * (microsecondsPerBeat / 1000000);
                    allEvents.push({
                        ...event,
                        timeInSeconds,
                        trackIndex
                    });
                } else if (event.type === 'setTempo') {
                    microsecondsPerBeat = event.microsecondsPerBeat;
                }
            });
        });
        
        allEvents.sort((a, b) => a.timeInSeconds - b.timeInSeconds);
        
        let eventIndex = 0;
        
        const playLoop = () => {
            if (!this.isPlaying) return;
            
            const elapsed = (Date.now() - startTime) / 1000 * this.playbackRate;
            this.currentTime = elapsed;
            
            while (eventIndex < allEvents.length && allEvents[eventIndex].timeInSeconds <= elapsed) {
                const event = allEvents[eventIndex];
                
                if (event.type === 'noteOn') {
                    // Use current time for immediate visualization
                    this.playNote(event.note, event.velocity, performance.now());
                    this.highlightPianoKey(event.note, true);
                } else if (event.type === 'noteOff') {
                    this.stopNote(event.note, performance.now());
                    this.highlightPianoKey(event.note, false);
                }
                
                eventIndex++;
            }
            
            const progress = this.totalTime > 0 ? (elapsed / this.totalTime) * 100 : 0;
            document.getElementById('progress-fill').style.width = `${Math.min(progress, 100)}%`;
            
            if (elapsed >= this.totalTime || eventIndex >= allEvents.length) {
                this.stopMidi();
                return;
            }
            
            this.animationFrameId = requestAnimationFrame(playLoop);
        };
        
        playLoop();
    }
    
    setupKeyboardListeners() {
        document.addEventListener('keydown', (e) => {
            // Only handle keyboard input when computer keyboard is selected
            if (this.selectedInputDevice !== 'keyboard') return;
            
            if (this.activeKeys.has(e.code)) return;
            
            const midiNote = this.keyboardMapping[e.code];
            if (midiNote) {
                e.preventDefault();
                this.activeKeys.add(e.code);
                this.playNote(midiNote, 100, performance.now());
                this.highlightPianoKey(midiNote, true);
                this.logMidiActivity(`▶ ${this.midiNoteToNoteName(midiNote)} (${midiNote}) vel:100`);
            }
        });
        
        document.addEventListener('keyup', (e) => {
            // Only handle keyboard input when computer keyboard is selected
            if (this.selectedInputDevice !== 'keyboard') return;
            
            const midiNote = this.keyboardMapping[e.code];
            if (midiNote) {
                e.preventDefault();
                this.activeKeys.delete(e.code);
                this.stopNote(midiNote);
                this.highlightPianoKey(midiNote, false);
                this.logMidiActivity(`⏹ ${this.midiNoteToNoteName(midiNote)} (${midiNote})`);
            }
        });
    }
    
    highlightPianoKey(midiNote, pressed) {
        const keyElement = this.pianoKeyboard.querySelector(`[data-note="${midiNote}"]`);
        if (keyElement) {
            if (pressed) {
                keyElement.classList.add('pressed');
            } else {
                keyElement.classList.remove('pressed');
            }
        }
    }
    
    visualizeNoteFallback(noteName, midiNote, velocity) {
        const noteElement = document.createElement('div');
        noteElement.className = 'note-display';
        noteElement.textContent = noteName;
        
        const size = this.getNoteSizeClass(velocity);
        noteElement.classList.add(size);
        
        const color = this.getNoteColor(midiNote, velocity);
        noteElement.style.color = color;
        noteElement.style.fontSize = `${this.getNoteFontSize(velocity)}px`;
        
        const pianoRect = this.pianoKeyboard.getBoundingClientRect();
        const keyElement = this.pianoKeyboard.querySelector(`[data-note="${midiNote}"]`);
        
        let x, y;
        if (keyElement) {
            const keyRect = keyElement.getBoundingClientRect();
            x = keyRect.left + keyRect.width / 2 - 25;
            y = keyRect.top - 20;
        } else {
            x = pianoRect.left + Math.random() * pianoRect.width - 50;
            y = pianoRect.top - 20;
        }
        
        noteElement.style.left = `${x}px`;
        noteElement.style.top = `${y}px`;
        noteElement.style.animationDuration = `${(this.settings.fadeDuration + 1) / this.settings.animationSpeed}s`;
        
        document.body.appendChild(noteElement);
        
        setTimeout(() => {
            if (noteElement.parentNode) {
                noteElement.parentNode.removeChild(noteElement);
            }
        }, ((this.settings.fadeDuration + 1) / this.settings.animationSpeed) * 1000);
    }
    
    startVisualization() {
        if (!this.renderer || typeof THREE === 'undefined') {
            // Fallback: just animate background if THREE.js failed
            console.log('Using fallback visualization');
            return;
        }
        
        const animate = () => {
            const currentTime = performance.now();
            
            // Update particle system
            if (this.particleSystem) {
                const rotationSpeed = 0.001 * this.settings.animationSpeed;
                this.particleSystem.rotation.y += rotationSpeed;
                this.particleSystem.rotation.x += rotationSpeed * 0.5;
                
                // Update particle opacity based on motion blur setting
                this.particleSystem.material.opacity = 0.6 * (1 - this.settings.motionBlur * 0.5);
            }
            
            // Update note sprites
            for (let i = this.noteObjects.length - 1; i >= 0; i--) {
                const sprite = this.noteObjects[i];
                const userData = sprite.userData;
                const elapsed = currentTime - userData.startTime;
                const progress = elapsed / userData.duration;
                
                if (progress >= 1.0) {
                    // Remove completed animation
                    this.scene.remove(sprite);
                    if (sprite.material.map) {
                        sprite.material.map.dispose();
                    }
                    sprite.material.dispose();
                    this.noteObjects.splice(i, 1);
                } else {
                    // Update animation with smooth easing and motion blur
                    const easeOut = 1 - Math.pow(1 - progress, 2.5);
                    
                    // Position animation (flying upward across full screen)
                    const totalDistance = userData.endY - userData.startY;
                    sprite.position.y = userData.startY + easeOut * totalDistance;
                    
                    // Add motion blur effect
                    const motionBlurFactor = this.settings.motionBlur;
                    sprite.position.z = Math.sin(progress * Math.PI) * (2 + motionBlurFactor * 3);
                    
                    // Scale animation with velocity-based bounce
                    const velocityIntensity = userData.velocity / 127;
                    const bounceIntensity = 0.1 + velocityIntensity * 0.3;
                    const bounceScale = 1 + Math.sin(progress * Math.PI * 2) * bounceIntensity;
                    const scale = userData.originalScale * bounceScale;
                    sprite.scale.set(userData.displaySize * bounceScale, userData.displaySize * 0.7 * bounceScale, 1);
                    
                    // Velocity-based opacity animation
                    const fadeSpeed = 4 + velocityIntensity * 4; // Stronger notes fade differently
                    if (progress < 0.15) {
                        sprite.material.opacity = progress * fadeSpeed;
                    } else if (progress > 0.85) {
                        sprite.material.opacity = (1 - progress) * fadeSpeed;
                    } else {
                        sprite.material.opacity = Math.min(1, 0.7 + velocityIntensity * 0.3);
                    }
                    
                    // Add rotation based on velocity and motion blur
                    const rotationIntensity = motionBlurFactor * velocityIntensity;
                    sprite.material.rotation = Math.sin(progress * Math.PI * 3) * rotationIntensity * 0.2;
                }
            }
            
            this.renderer.render(this.scene, this.camera);
            requestAnimationFrame(animate);
        };
        animate();
    }
    
    async startRecording() {
        try {
            const stream = this.renderer.domElement.captureStream(30);
            
            // Try different codecs based on browser support
            let options = { mimeType: 'video/webm;codecs=vp9' };
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                options = { mimeType: 'video/webm;codecs=vp8' };
                if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                    options = { mimeType: 'video/webm' };
                }
            }
            
            this.mediaRecorder = new MediaRecorder(stream, options);
            
            this.recordedChunks = [];
            
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.recordedChunks.push(event.data);
                }
            };
            
            this.mediaRecorder.onstop = () => {
                document.getElementById('download-recording').disabled = false;
            };
            
            this.mediaRecorder.start();
            this.isRecording = true;
            
            document.getElementById('start-recording').disabled = true;
            document.getElementById('stop-recording').disabled = false;
            
        } catch (error) {
            console.error('Failed to start recording:', error);
        }
    }
    
    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
            
            document.getElementById('start-recording').disabled = false;
            document.getElementById('stop-recording').disabled = true;
        }
    }
    
    downloadRecording() {
        if (this.recordedChunks.length === 0) return;
        
        const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `piano-recording-${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
        document.getElementById('download-recording').disabled = true;
    }
    
    updateMidiStatus() {
        const midiDevicesElement = document.getElementById('midi-devices');
        if (this.midiDevices.length > 0) {
            midiDevicesElement.textContent = `Connected: ${this.midiDevices.join(', ')}`;
        } else {
            midiDevicesElement.textContent = 'No MIDI devices connected';
        }
    }
    
    logMidiActivity(message) {
        const activityElement = document.getElementById('midi-activity');
        const timestamp = new Date().toLocaleTimeString();
        
        // Add new activity log entry
        this.midiActivityLog.unshift(`[${timestamp}] ${message}`);
        
        // Keep only the last 10 entries
        if (this.midiActivityLog.length > 10) {
            this.midiActivityLog = this.midiActivityLog.slice(0, 10);
        }
        
        // Update the display
        activityElement.textContent = this.midiActivityLog.join('\n');
        activityElement.scrollTop = 0; // Scroll to top to show newest entries
    }
    
    updateMidiDeviceList() {
        const selectElement = document.getElementById('midi-input-select');
        
        // Clear existing options except computer keyboard
        while (selectElement.children.length > 1) {
            selectElement.removeChild(selectElement.lastChild);
        }
        
        // Add MIDI devices to select
        for (const [id, input] of this.midiInputs) {
            const option = document.createElement('option');
            option.value = id;
            option.textContent = input.name;
            selectElement.appendChild(option);
        }
    }
    
    setupMidiDeviceSelection() {
        const selectElement = document.getElementById('midi-input-select');
        
        selectElement.addEventListener('change', (e) => {
            const selectedValue = e.target.value;
            this.selectedInputDevice = selectedValue;
            
            // Debug device selection
            console.log(`🔄 Device Selection Changed:`, {
                selectedValue: selectedValue,
                isKeyboard: selectedValue === 'keyboard',
                availableDevices: Array.from(this.midiInputs.keys()),
                deviceNames: Array.from(this.midiInputs.values()).map(d => d.name)
            });
            
            // Setup MIDI message handlers based on selection
            this.setupMidiInputHandlers();
            
            // Log device change
            if (selectedValue === 'keyboard') {
                console.log(`⌨️ Input switched to: Computer Keyboard`);
                this.logMidiActivity('Input switched to: Computer Keyboard');
            } else {
                const selectedInput = this.midiInputs.get(selectedValue);
                if (selectedInput) {
                    console.log(`🎹 Input switched to: ${selectedInput.name}`);
                    this.logMidiActivity(`Input switched to: ${selectedInput.name}`);
                }
            }
        });
    }
    
    setupMidiInputHandlers() {
        console.log(`🔧 Setting up MIDI input handlers for device: ${this.selectedInputDevice}`);
        console.log(`📊 Available devices:`, Array.from(this.midiInputs.keys()));
        
        // Clear all existing handlers
        let clearedCount = 0;
        for (const [id, input] of this.midiInputs) {
            input.onmidimessage = null;
            clearedCount++;
        }
        console.log(`🧹 Cleared ${clearedCount} existing MIDI handlers`);
        
        // Set up handler for selected device or all devices if single device
        if (this.selectedInputDevice !== 'keyboard') {
            if (this.midiInputs.size === 1) {
                // If only one device, set handler for that device regardless of selection
                const singleDevice = this.midiInputs.values().next().value;
                singleDevice.onmidimessage = (message) => this.handleMIDIMessage(message);
                console.log(`✅ Single device mode - MIDI handler set for: ${singleDevice.name}`);
            } else {
                // Multiple devices - use selected device
                const selectedInput = this.midiInputs.get(this.selectedInputDevice);
                if (selectedInput) {
                    selectedInput.onmidimessage = (message) => this.handleMIDIMessage(message);
                    console.log(`✅ MIDI handler set for selected device: ${selectedInput.name} (ID: ${this.selectedInputDevice})`);
                } else {
                    console.log(`❌ Failed to find selected MIDI device: ${this.selectedInputDevice}`);
                    // Fallback: set handlers for all devices
                    for (const [id, input] of this.midiInputs) {
                        input.onmidimessage = (message) => this.handleMIDIMessage(message);
                        console.log(`🔄 Fallback: Set handler for ${input.name}`);
                    }
                }
            }
        } else {
            console.log(`⌨️ Computer keyboard mode - MIDI handlers disabled`);
        }
    }
    
    getSelectedMidiInput() {
        if (this.selectedInputDevice === 'keyboard') {
            return null;
        }
        return this.midiInputs.get(this.selectedInputDevice);
    }
    
    setupAudioControls() {
        const volumeSlider = document.getElementById('volume-control');
        const volumeValue = document.getElementById('volume-value');
        const muteButton = document.getElementById('mute-button');
        
        // Volume slider
        volumeSlider.addEventListener('input', (e) => {
            this.settings.volume = parseFloat(e.target.value);
            volumeValue.textContent = e.target.value;
            console.log(`🔊 Volume changed: ${this.settings.volume}`);
        });
        
        // Mute button
        muteButton.addEventListener('click', () => {
            this.settings.isMuted = !this.settings.isMuted;
            
            if (this.settings.isMuted) {
                muteButton.textContent = '🔇 Muted';
                muteButton.classList.add('muted');
                console.log(`🔇 Audio muted`);
            } else {
                muteButton.textContent = '🔊 Unmuted';
                muteButton.classList.remove('muted');
                console.log(`🔊 Audio unmuted`);
            }
        });
    }
    
    autoSelectMidiDevice() {
        // If already using a MIDI device (not keyboard), don't change
        if (this.selectedInputDevice !== 'keyboard') {
            return;
        }
        
        // Look for 88-key piano keywords in device names
        const pianoKeywords = [
            'piano', 'keyboard', 'stage', 'digital piano', 'electric piano',
            'clavinova', 'rd-', 'fp-', 'p-', 'ca-', 'es-', 'cp-', 'ydp-',
            'kawai', 'yamaha', 'roland', 'korg', 'casio', 'nord',
            '88', 'weighted', 'hammer'
        ];
        
        let bestDevice = null;
        let highestScore = 0;
        
        console.log('🔍 Searching for 88-key MIDI device...');
        
        for (const [id, input] of this.midiInputs) {
            const deviceName = input.name.toLowerCase();
            let score = 0;
            
            // Score based on piano-related keywords
            for (const keyword of pianoKeywords) {
                if (deviceName.includes(keyword)) {
                    score += 1;
                    console.log(`  ✓ "${input.name}" matches keyword: "${keyword}"`);
                }
            }
            
            // Higher score for devices with explicit 88-key indicators
            if (deviceName.includes('88')) {
                score += 3;
                console.log(`  ⭐ "${input.name}" has 88-key indicator (+3 points)`);
            }
            
            // Prefer devices with "piano" or "keyboard" in name
            if (deviceName.includes('piano') || deviceName.includes('keyboard')) {
                score += 2;
                console.log(`  🎹 "${input.name}" is identified as piano/keyboard (+2 points)`);
            }
            
            console.log(`  📊 "${input.name}" total score: ${score}`);
            
            if (score > highestScore) {
                bestDevice = { id, input };
                highestScore = score;
            }
        }
        
        // Auto-select the best device if found
        if (bestDevice && highestScore >= 1) {
            const oldDevice = this.selectedInputDevice;
            this.selectedInputDevice = bestDevice.id;
            document.getElementById('midi-input-select').value = bestDevice.id;
            
            console.log(`🎹 Auto-selected MIDI device: "${bestDevice.input.name}" (score: ${highestScore})`);
            console.log(`🔄 Device changed from "${oldDevice}" to "${bestDevice.id}"`);
            this.logMidiActivity(`Auto-selected: ${bestDevice.input.name}`);
            
            // Force re-setup of MIDI handlers after auto-selection
            console.log('🔧 Re-setting up MIDI handlers after auto-selection...');
        } else if (this.midiInputs.size > 0) {
            // If no piano-like device found, select the first available MIDI device
            const firstDevice = this.midiInputs.entries().next().value;
            const oldDevice = this.selectedInputDevice;
            this.selectedInputDevice = firstDevice[0];
            document.getElementById('midi-input-select').value = firstDevice[0];
            
            console.log(`🎛️ Auto-selected first MIDI device: "${firstDevice[1].name}"`);
            console.log(`🔄 Device changed from "${oldDevice}" to "${firstDevice[0]}"`);
            this.logMidiActivity(`Auto-selected: ${firstDevice[1].name}`);
            
            // Force re-setup of MIDI handlers after auto-selection
            console.log('🔧 Re-setting up MIDI handlers after auto-selection...');
        } else {
            console.log('⌨️ No MIDI devices available, using computer keyboard');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new PianoVisualizer();
});