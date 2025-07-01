class PianoVisualizer {
    constructor() {
        this.container = document.getElementById('three-container');
        this.pianoKeyboard = document.getElementById('piano-keyboard');
        
        // Three.js setup
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.noteObjects = [];
        this.activeNoteSprites = new Map(); // Track active note sprites by MIDI note
        this.particleSystem = null;
        this.audioContext = null;
        this.midiAccess = null;
        this.isRecording = false;
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.backgroundPlane = null;
        
        // Canvas recording properties
        this.recordingCanvas = null;
        this.recordingContext = null;
        this.audioDestination = null;
        this.combinedStream = null;
        
        // Piano key visual state tracking
        this.activeKeys = new Set(); // Track which keys are currently pressed
        
        // Spectrum analyzer properties
        this.analyserNode = null;
        this.spectrumCanvas = null;
        this.spectrumContext = null;
        this.animationFrameId = null;
        
        this.settings = {
            animationSpeed: 1.0,
            sizeMultiplier: 1.0,
            velocitySensitivity: 2.2,
            fadeDuration: 3.0,
            colorIntensity: 1.0,
            motionBlur: 0.3,
            glowIntensity: 1.0,
            fontFamily: 'M PLUS 1p',
            pianoRange: '3-octave',
            volume: 0.75,
            isMuted: false,
            colorScale: 'chromatic', // Will be overridden in initializeRetroColors()
            showOctaveNumbers: false,
            showVelocityNumbers: true,
            audioTimbre: 'acoustic-piano',
            noteNameStyle: 'japanese',
            customBaseColor: '#ffffff',
            showSpectrumAnalyzer: true
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
        
        // MIDI pedal state
        this.sustainPedalPressed = false;
        this.sustainedNotes = new Set(); // Track sustained notes
        this.activeAudioNodes = new Map(); // Track active audio nodes for sustain
        
        // Screen recording settings
        this.screenRecordingEnabled = true;
        this.screenRecordingStream = null;
        this.screenRecordingPermissionAsked = false;
        
        this.noteNames = {
            japanese: ['ド', 'ド#', 'レ', 'レ#', 'ミ', 'ファ', 'ファ#', 'ソ', 'ソ#', 'ラ', 'ラ#', 'シ'],
            western: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
        };
        
        // Scale definitions (note indices in chromatic scale)
        this.scales = {
            chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
            major: [0, 2, 4, 5, 7, 9, 11],
            minor: [0, 2, 3, 5, 7, 8, 10],
            pentatonic: [0, 2, 4, 7, 9],
            blues: [0, 3, 5, 6, 7, 10],
            dorian: [0, 2, 3, 5, 7, 9, 10],
            mixolydian: [0, 2, 4, 5, 7, 9, 10]
        };
        
        // Modern color palettes for each scale
        this.colorPalettes = {
            chromatic: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43', '#10ac84', '#ee5253'],
            major: ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe', '#43e97b'],
            minor: ['#667db6', '#0082c8', '#8360c3', '#2ebf91', '#8fd3f4', '#96deda', '#b8e6b8'],
            pentatonic: ['#fa709a', '#fee140', '#a8edea', '#fed6e3', '#d299c2'],
            blues: ['#667eea', '#764ba2', '#667db6', '#0082c8', '#8360c3', '#2ebf91'],
            dorian: ['#ff9a9e', '#fecfef', '#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe'],
            mixolydian: ['#fce38a', '#f38181', '#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe'],
            custom: [], // Will be generated dynamically
            
            // ColorHunt Retro Palettes Collection
            'retro-sunset': ['#FF6B35', '#F7931E', '#FFD23F', '#06FFA5'],
            'retro-neon': ['#FF0080', '#FF8C00', '#FFFF00', '#00FF80'],
            'retro-pastel': ['#FFB3D1', '#FFD1DC', '#E6E6FA', '#B8E6B8'],
            'retro-synthwave': ['#FF006E', '#FB5607', '#FFBE0B', '#8338EC'],
            'retro-miami': ['#FF1744', '#FF9100', '#FFEA00', '#00E676'],
            'retro-vintage': ['#D2691E', '#CD853F', '#F4A460', '#FFE4B5'],
            'retro-arcade': ['#FF4081', '#FF8A65', '#FFC107', '#4CAF50'],
            'retro-vaporwave': ['#FF6EC7', '#FFB347', '#FFFF99', '#98FB98'],
            'retro-warm': ['#FF5722', '#FF8A50', '#FFC107', '#CDDC39'],
            'retro-cool': ['#E91E63', '#9C27B0', '#3F51B5', '#00BCD4'],
            'retro-earth': ['#8D6E63', '#A1887F', '#BCAAA4', '#D7CCC8'],
            'retro-electric': ['#E3F2FD', '#81C784', '#FFB74D', '#F06292']
        };
        
        // Store available retro palettes for random selection
        this.retroPalettes = [
            'retro-sunset', 'retro-neon', 'retro-pastel', 'retro-synthwave',
            'retro-miami', 'retro-vintage', 'retro-arcade', 'retro-vaporwave',
            'retro-warm', 'retro-cool', 'retro-earth', 'retro-electric'
        ];
        
        // Note: Color scale will be initialized after DOM is ready
        
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
        
        
        this.lastDebugTime = 0; // For debug logging
        
        // Check for mobile device and show warning if needed
        this.checkMobileDevice();
        
        this.loadSettings();
        this.init();
    }
    
    loadSettings() {
        try {
            // Load screen recording settings from localStorage
            const savedEnabled = localStorage.getItem('screenRecordingEnabled');
            const savedAsked = localStorage.getItem('screenRecordingPermissionAsked');
            
            if (savedEnabled !== null) {
                this.screenRecordingEnabled = JSON.parse(savedEnabled);
                console.log(`📁 Loaded screen recording setting: ${this.screenRecordingEnabled ? 'enabled' : 'disabled'}`);
            }
            
            if (savedAsked !== null) {
                this.screenRecordingPermissionAsked = JSON.parse(savedAsked);
                console.log(`📁 Permission previously asked: ${this.screenRecordingPermissionAsked}`);
            }
            
        } catch (error) {
            console.warn('⚠️ Failed to load settings from localStorage:', error);
            // Use defaults if loading fails
            this.screenRecordingEnabled = true;
            this.screenRecordingPermissionAsked = false;
        }
    }
    
    saveSettings() {
        try {
            localStorage.setItem('screenRecordingEnabled', JSON.stringify(this.screenRecordingEnabled));
            localStorage.setItem('screenRecordingPermissionAsked', JSON.stringify(this.screenRecordingPermissionAsked));
            console.log(`💾 Settings saved to localStorage`);
        } catch (error) {
            console.warn('⚠️ Failed to save settings to localStorage:', error);
        }
    }
    
    checkMobileDevice() {
        // Enhanced mobile detection
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                         (navigator.maxTouchPoints > 0 && window.matchMedia("(max-width: 768px)").matches) ||
                         window.screen.width <= 768;
        
        const isTablet = /iPad|Android(?!.*Mobile)/i.test(navigator.userAgent) ||
                        (navigator.maxTouchPoints > 0 && window.screen.width > 768 && window.screen.width <= 1024);
        
        // Show warning for phones only (not tablets)
        if (isMobile && !isTablet) {
            console.log('📱 Mobile device detected, showing compatibility warning');
            this.showMobileWarning();
        } else if (isTablet) {
            console.log('📱 Tablet device detected, proceeding normally');
        } else {
            console.log('💻 Desktop device detected, proceeding normally');
        }
    }
    
    showMobileWarning() {
        const warningElement = document.getElementById('mobile-warning');
        const continueBtn = document.getElementById('mobile-continue-btn');
        
        if (warningElement && continueBtn) {
            // Show the warning screen
            warningElement.style.display = 'flex';
            document.body.classList.add('mobile-warning-shown');
            
            // Set up continue button event
            continueBtn.addEventListener('click', () => {
                warningElement.style.display = 'none';
                document.body.classList.remove('mobile-warning-shown');
                console.log('📱 User chose to continue on mobile device');
                
                // Store preference in localStorage
                localStorage.setItem('mobileWarningDismissed', 'true');
            });
            
            // Check if user previously dismissed the warning
            const dismissed = localStorage.getItem('mobileWarningDismissed');
            if (dismissed === 'true') {
                // Auto-hide if previously dismissed
                setTimeout(() => {
                    continueBtn.click();
                }, 100);
            }
        }
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
        this.setupCollapsibleSections();
        this.updateCustomColors(); // Initialize custom colors
        this.setupScreenRecording();
        
        // Initialize with random retro palette after DOM is ready
        this.initializeRetroColors();
        
        // Initialize spectrum analyzer
        this.initSpectrumAnalyzer();
        
        this.startVisualization();
        
        window.addEventListener('resize', () => this.onWindowResize());
    }
    
    initThreeJS() {
        console.log(`🔧 initThreeJS called: THREE=${typeof THREE}, container=${!!this.container}`);
        // Check if THREE is available
        if (typeof THREE === 'undefined') {
            console.error('❌ THREE.js not loaded. Using DOM visualization.');
            return;
        }
        
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        console.log(`📐 Container dimensions: ${width}x${height}`);
        
        // Scene
        this.scene = new THREE.Scene();
        
        // Set default background color (background image will be applied later)
        this.scene.background = new THREE.Color(0x0d1421);
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        this.camera.position.set(0, 0, 10);
        
        // Renderer
        try {
            this.renderer = new THREE.WebGLRenderer({ 
                antialias: true, 
                alpha: true,
                powerPreference: "high-performance",
                preserveDrawingBuffer: true // Required for canvas recording
            });
            this.renderer.setSize(width, height);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            
            this.container.appendChild(this.renderer.domElement);
            console.log(`✅ WebGL renderer created successfully: ${width}x${height}`);
        } catch (error) {
            console.error('❌ Failed to create WebGL renderer:', error);
            this.renderer = null;
            return;
        }
        
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
        
        // Initialize canvas background after scene setup
        this.createCanvasBackground();
        
        console.log('✅ Three.js scene initialized with canvas background');
    }
    
    
    
    onWindowResize() {
        if (!this.camera || !this.renderer) return;
        
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setSize(width, height);
        
        // Resize spectrum canvas
        this.resizeSpectrumCanvas();
    }
    
    async initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
                latencyHint: 'interactive', // Low latency for real-time performance
                sampleRate: 44100          // Standard sample rate
            });
            this.audioContextResumed = false;
            
            // Create audio destination for recording
            this.audioDestination = this.audioContext.createMediaStreamDestination();
            
            // Create analyser node for spectrum analyzer
            this.analyserNode = this.audioContext.createAnalyser();
            this.analyserNode.fftSize = 512; // FFT size (frequency bins will be fftSize/2)
            this.analyserNode.smoothingTimeConstant = 0.8;
            
            // Add user interaction listener to resume AudioContext
            this.setupAudioContextResume();
            
            console.log('🎵 AudioContext created with recording destination, waiting for user interaction to start');
        } catch (error) {
            console.error('Audio context initialization failed:', error);
        }
    }
    
    setupAudioContextResume() {
        // Show audio context notice if needed
        const showNoticeIfNeeded = () => {
            if (this.audioContext && this.audioContext.state === 'suspended') {
                const notice = document.getElementById('audio-context-notice');
                if (notice) {
                    notice.style.display = 'block';
                    // Auto-hide after 5 seconds
                    setTimeout(() => {
                        if (notice.style.display === 'block') {
                            notice.style.display = 'none';
                        }
                    }, 5000);
                }
            }
        };
        
        const resumeAudioContext = async () => {
            if (this.audioContext && this.audioContext.state === 'suspended') {
                try {
                    await this.audioContext.resume();
                    this.audioContextResumed = true;
                    console.log('🎵 AudioContext resumed after user interaction');
                    
                    // Hide notice
                    const notice = document.getElementById('audio-context-notice');
                    if (notice) {
                        notice.style.display = 'none';
                    }
                } catch (error) {
                    console.error('Failed to resume AudioContext:', error);
                }
            } else if (this.audioContext && this.audioContext.state === 'running') {
                this.audioContextResumed = true;
            }
            
            // Remove listeners after first successful resume
            if (this.audioContextResumed) {
                document.removeEventListener('click', resumeAudioContext);
                document.removeEventListener('keydown', resumeAudioContext);
                document.removeEventListener('touchstart', resumeAudioContext);
            }
        };
        
        // Show notice after a short delay
        setTimeout(showNoticeIfNeeded, 1000);
        
        // Listen for user interactions
        document.addEventListener('click', resumeAudioContext, { once: true });
        document.addEventListener('keydown', resumeAudioContext, { once: true });
        document.addEventListener('touchstart', resumeAudioContext, { once: true });
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
            const noteName = this.midiNoteToNoteName(note, velocity);
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
            
            // Handle sustain pedal (CC 64)
            if (note === 64) {
                this.handleSustainPedal(velocity >= 64);
            }
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
                keyElement.style.height = '140px'; // Increased from 80px
            } else {
                keyElement.style.width = `${keyWidth * 0.6}px`;
                keyElement.style.height = '90px'; // Increased from 50px
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
        const noteName = this.midiNoteToNoteName(midiNote, velocity);
        
        this.synthesizeNote(frequency, velocity, midiNote);
        this.visualizeNoteThreeJS(noteName, midiNote, velocity, timestamp);
        
        // Update piano key visual state
        this.activeKeys.add(midiNote);
        this.updatePianoKeyVisual(midiNote, true);
        
        // Immediately update recording canvas if recording for better sync
        if (this.isRecording) {
            console.log(`⚡ Immediate sync: Note ${midiNote} pressed, updating recording canvas`);
        }
        this.updateRecordingCanvasImmediate();
    }
    
    stopNote(midiNote, timestamp = performance.now()) {
        // Mark visual note as inactive
        if (this.activeNoteSprites.has(midiNote)) {
            const sprite = this.activeNoteSprites.get(midiNote);
            if (sprite.userData) {
                sprite.userData.isActive = false;
                sprite.userData.movementPhase = 'falling';
                sprite.userData.noteOffTime = timestamp;
                console.log(`🎵 Note ${this.midiNoteToNoteName(midiNote)} marked for visual fade`);
            }
            this.activeNoteSprites.delete(midiNote);
        }
        
        // If sustain pedal is pressed, don't stop the audio immediately
        if (this.sustainPedalPressed) {
            this.sustainedNotes.add(midiNote);
            console.log(`🦶 Note ${this.midiNoteToNoteName(midiNote)} sustained by pedal`);
            return;
        }
        
        // Stop the note immediately
        this.stopSustainedNote(midiNote);
        
        // Update piano key visual state
        this.activeKeys.delete(midiNote);
        this.updatePianoKeyVisual(midiNote, false);
        
        // Immediately update recording canvas if recording for better sync
        this.updateRecordingCanvasImmediate();
    }
    
    updatePianoKeyVisual(midiNote, isPressed) {
        const keyElement = document.querySelector(`[data-note="${midiNote}"]`);
        if (keyElement) {
            if (isPressed) {
                keyElement.classList.add('pressed');
            } else {
                keyElement.classList.remove('pressed');
            }
        }
    }
    
    midiNoteToFrequency(midiNote) {
        return 440 * Math.pow(2, (midiNote - 69) / 12);
    }
    
    midiNoteToNoteName(midiNote, velocity = null) {
        const noteIndex = midiNote % 12;
        const octave = Math.floor(midiNote / 12) - 1;
        const noteNamesArray = this.noteNames[this.settings.noteNameStyle];
        
        let noteName = noteNamesArray[noteIndex];
        
        // Add velocity number if enabled and velocity is provided
        if (this.settings.showVelocityNumbers && velocity !== null) {
            noteName += `(${velocity})`;
        }
        
        // Add octave number if enabled
        if (this.settings.showOctaveNumbers) {
            // Insert octave before velocity if both are shown
            if (this.settings.showVelocityNumbers && velocity !== null) {
                noteName = noteNamesArray[noteIndex] + octave + `(${velocity})`;
            } else {
                noteName += octave;
            }
        }
        
        return noteName;
    }
    
    handleSustainPedal(isPressed) {
        this.sustainPedalPressed = isPressed;
        
        if (isPressed) {
            console.log('🦶 Sustain pedal pressed - notes will sustain');
            this.logMidiActivity('🦶 Sustain ON');
        } else {
            console.log('🦶 Sustain pedal released - stopping sustained notes');
            this.logMidiActivity('🦶 Sustain OFF');
            
            // Stop all sustained notes
            this.sustainedNotes.forEach(midiNote => {
                this.stopSustainedNote(midiNote);
            });
            this.sustainedNotes.clear();
        }
    }
    
    stopSustainedNote(midiNote) {
        // Stop the audio nodes for this note
        const audioNodeInfo = this.activeAudioNodes.get(midiNote);
        if (audioNodeInfo) {
            const { gainNode, stopTime } = audioNodeInfo;
            const currentTime = this.audioContext.currentTime;
            
            // Fade out the sustained note
            gainNode.gain.cancelScheduledValues(currentTime);
            gainNode.gain.setValueAtTime(gainNode.gain.value, currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.3);
            
            // Remove from active nodes after fade out
            setTimeout(() => {
                this.activeAudioNodes.delete(midiNote);
            }, 350);
        }
        
        // Remove piano key highlight
        this.highlightPianoKey(midiNote, false);
    }
    
    synthesizeNote(frequency, velocity, midiNote = null) {
        if (!this.audioContext) {
            console.log('🔇 Audio synthesis skipped - no AudioContext');
            return;
        }
        
        // Check AudioContext state
        if (this.audioContext.state === 'suspended') {
            console.log('🔇 Audio synthesis skipped - AudioContext suspended (waiting for user interaction)');
            return;
        }
        
        // Check if audio is muted (but allow during recording)
        if (this.settings.isMuted && !this.isRecording) {
            console.log(`🔇 Audio synthesis skipped - muted`);
            return;
        }
        
        // Always play audio during recording
        if (this.isRecording) {
            console.log(`🎬 Recording mode: Audio synthesis enabled`);
        }
        
        // Apply both velocity and global volume settings
        const velocityVolume = (velocity / 127) * 0.3;
        const finalVolume = velocityVolume * this.settings.volume;
        
        // Create audio nodes based on selected timbre
        const timbre = this.settings.audioTimbre;
        const audioNodes = this.createTimbreNodes(frequency, finalVolume, timbre, midiNote);
        
        console.log(`🎵 Synthesized ${timbre}: ${frequency.toFixed(1)}Hz, velocity:${velocity}, volume:${finalVolume.toFixed(3)} ${midiNote ? `(MIDI:${midiNote})` : ''}`);
    }
    
    createTimbreNodes(frequency, volume, timbre, midiNote = null) {
        // Use immediate audio context time for minimal latency
        const currentTime = this.audioContext.currentTime;
        const startTime = currentTime + 0.001; // Minimal 1ms delay to prevent click/pop
        const duration = this.getTimbreDuration(timbre);
        
        // Adjust duration for sustain pedal
        const actualDuration = this.sustainPedalPressed ? duration * 2 : duration;
        
        let gainNode;
        switch (timbre) {
            case 'acoustic-piano':
                gainNode = this.createAcousticPiano(frequency, volume, startTime, actualDuration);
                break;
            case 'electric-piano':
                gainNode = this.createElectricPiano(frequency, volume, startTime, actualDuration);
                break;
            case 'harpsichord':
                gainNode = this.createHarpsichord(frequency, volume, startTime, actualDuration);
                break;
            case 'organ':
                gainNode = this.createOrgan(frequency, volume, startTime, actualDuration);
                break;
            case 'strings':
                gainNode = this.createStrings(frequency, volume, startTime, actualDuration);
                break;
            case 'vibraphone':
                gainNode = this.createVibraphone(frequency, volume, startTime, actualDuration);
                break;
            case 'music-box':
                gainNode = this.createMusicBox(frequency, volume, startTime, actualDuration);
                break;
            case 'synthesizer':
                gainNode = this.createSynthesizer(frequency, volume, startTime, actualDuration);
                break;
            case 'bell':
                gainNode = this.createBell(frequency, volume, startTime, actualDuration);
                break;
            case 'flute':
                gainNode = this.createFlute(frequency, volume, startTime, actualDuration);
                break;
            default:
                gainNode = this.createAcousticPiano(frequency, volume, startTime, actualDuration);
                break;
        }
        
        // Track active audio nodes for sustain pedal
        if (midiNote && gainNode) {
            this.activeAudioNodes.set(midiNote, {
                gainNode: gainNode,
                stopTime: currentTime + actualDuration,
                timbre: timbre
            });
            
            // Add to sustained notes if pedal is pressed
            if (this.sustainPedalPressed) {
                this.sustainedNotes.add(midiNote);
            }
        }
        
        return gainNode;
    }
    
    // Helper function to connect audio nodes to both speakers and recording destination
    connectAudioOutput(node) {
        // Always connect to speakers
        node.connect(this.audioContext.destination);
        
        // Also connect to recording destination if it exists
        if (this.audioDestination) {
            node.connect(this.audioDestination);
        }
        
        // Connect to analyzer node for spectrum analyzer
        if (this.analyserNode) {
            node.connect(this.analyserNode);
        }
    }
    
    getTimbreDuration(timbre) {
        const durations = {
            'acoustic-piano': 2.5,
            'electric-piano': 2.0,
            'harpsichord': 1.5,
            'organ': 3.0,
            'strings': 4.0,
            'vibraphone': 3.5,
            'music-box': 2.0,
            'synthesizer': 1.5,
            'bell': 4.0,
            'flute': 2.5
        };
        return durations[timbre] || 2.0;
    }
    
    createAcousticPiano(frequency, volume, currentTime, duration) {
        // Acoustic piano with multiple harmonics
        const osc1 = this.audioContext.createOscillator();
        const osc2 = this.audioContext.createOscillator();
        const osc3 = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(frequency, currentTime);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(frequency * 2, currentTime);
        osc3.type = 'sine';
        osc3.frequency.setValueAtTime(frequency * 3, currentTime);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, currentTime);
        filter.Q.setValueAtTime(1, currentTime);
        
        gainNode.gain.setValueAtTime(0, currentTime);
        gainNode.gain.linearRampToValueAtTime(volume, currentTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + duration);
        
        osc1.connect(gainNode);
        osc2.connect(gainNode);
        osc3.connect(gainNode);
        gainNode.connect(filter);
        this.connectAudioOutput(filter);
        
        osc1.start(currentTime);
        osc2.start(currentTime);
        osc3.start(currentTime);
        osc1.stop(currentTime + duration);
        osc2.stop(currentTime + duration);
        osc3.stop(currentTime + duration);
        
        return gainNode;
    }
    
    createElectricPiano(frequency, volume, currentTime, duration) {
        const osc1 = this.audioContext.createOscillator();
        const osc2 = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(frequency, currentTime);
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(frequency * 2, currentTime);
        
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1500, currentTime);
        filter.Q.setValueAtTime(5, currentTime);
        
        gainNode.gain.setValueAtTime(0, currentTime);
        gainNode.gain.linearRampToValueAtTime(volume, currentTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + duration);
        
        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(filter);
        this.connectAudioOutput(filter);
        
        osc1.start(currentTime);
        osc2.start(currentTime);
        osc1.stop(currentTime + duration);
        osc2.stop(currentTime + duration);
        
        return gainNode;
    }
    
    createHarpsichord(frequency, volume, currentTime, duration) {
        const osc = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(frequency, currentTime);
        
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(800, currentTime);
        filter.Q.setValueAtTime(2, currentTime);
        
        gainNode.gain.setValueAtTime(volume, currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + duration);
        
        osc.connect(filter);
        filter.connect(gainNode);
        this.connectAudioOutput(gainNode);
        
        osc.start(currentTime);
        osc.stop(currentTime + duration);
        
        return gainNode;
    }
    
    createOrgan(frequency, volume, currentTime, duration) {
        const osc1 = this.audioContext.createOscillator();
        const osc2 = this.audioContext.createOscillator();
        const osc3 = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(frequency, currentTime);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(frequency * 2, currentTime);
        osc3.type = 'sine';
        osc3.frequency.setValueAtTime(frequency / 2, currentTime);
        
        gainNode.gain.setValueAtTime(0, currentTime);
        gainNode.gain.linearRampToValueAtTime(volume, currentTime + 0.1);
        gainNode.gain.linearRampToValueAtTime(0.01, currentTime + duration);
        
        osc1.connect(gainNode);
        osc2.connect(gainNode);
        osc3.connect(gainNode);
        this.connectAudioOutput(gainNode);
        
        osc1.start(currentTime);
        osc2.start(currentTime);
        osc3.start(currentTime);
        osc1.stop(currentTime + duration);
        osc2.stop(currentTime + duration);
        osc3.stop(currentTime + duration);
        
        return gainNode;
    }
    
    createStrings(frequency, volume, currentTime, duration) {
        const osc = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(frequency, currentTime);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1200, currentTime);
        filter.Q.setValueAtTime(1, currentTime);
        
        gainNode.gain.setValueAtTime(0, currentTime);
        gainNode.gain.linearRampToValueAtTime(volume, currentTime + 0.3);
        gainNode.gain.linearRampToValueAtTime(0.01, currentTime + duration);
        
        osc.connect(filter);
        filter.connect(gainNode);
        this.connectAudioOutput(gainNode);
        
        osc.start(currentTime);
        osc.stop(currentTime + duration);
        
        return gainNode;
    }
    
    createVibraphone(frequency, volume, currentTime, duration) {
        const osc1 = this.audioContext.createOscillator();
        const osc2 = this.audioContext.createOscillator();
        const lfo = this.audioContext.createOscillator();
        const lfoGain = this.audioContext.createGain();
        const gainNode = this.audioContext.createGain();
        
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(frequency, currentTime);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(frequency * 4, currentTime);
        
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(5, currentTime);
        lfoGain.gain.setValueAtTime(0.1, currentTime);
        
        gainNode.gain.setValueAtTime(0, currentTime);
        gainNode.gain.linearRampToValueAtTime(volume, currentTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + duration);
        
        lfo.connect(lfoGain);
        lfoGain.connect(gainNode.gain);
        
        osc1.connect(gainNode);
        osc2.connect(gainNode);
        this.connectAudioOutput(gainNode);
        
        osc1.start(currentTime);
        osc2.start(currentTime);
        lfo.start(currentTime);
        osc1.stop(currentTime + duration);
        osc2.stop(currentTime + duration);
        lfo.stop(currentTime + duration);
        
        return gainNode;
    }
    
    createMusicBox(frequency, volume, currentTime, duration) {
        const osc = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(frequency * 2, currentTime);
        
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(3000, currentTime);
        filter.Q.setValueAtTime(10, currentTime);
        
        gainNode.gain.setValueAtTime(volume, currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + duration);
        
        osc.connect(filter);
        filter.connect(gainNode);
        this.connectAudioOutput(gainNode);
        
        osc.start(currentTime);
        osc.stop(currentTime + duration);
        
        return gainNode;
    }
    
    createSynthesizer(frequency, volume, currentTime, duration) {
        const osc1 = this.audioContext.createOscillator();
        const osc2 = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        osc1.type = 'square';
        osc1.frequency.setValueAtTime(frequency, currentTime);
        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(frequency + 2, currentTime);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, currentTime);
        filter.Q.setValueAtTime(5, currentTime);
        
        gainNode.gain.setValueAtTime(volume, currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + duration);
        
        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(filter);
        this.connectAudioOutput(filter);
        
        osc1.start(currentTime);
        osc2.start(currentTime);
        osc1.stop(currentTime + duration);
        osc2.stop(currentTime + duration);
        
        return gainNode;
    }
    
    createBell(frequency, volume, currentTime, duration) {
        const osc1 = this.audioContext.createOscillator();
        const osc2 = this.audioContext.createOscillator();
        const osc3 = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(frequency, currentTime);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(frequency * 2.4, currentTime);
        osc3.type = 'sine';
        osc3.frequency.setValueAtTime(frequency * 3.8, currentTime);
        
        gainNode.gain.setValueAtTime(0, currentTime);
        gainNode.gain.linearRampToValueAtTime(volume, currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + duration);
        
        osc1.connect(gainNode);
        osc2.connect(gainNode);
        osc3.connect(gainNode);
        this.connectAudioOutput(gainNode);
        
        osc1.start(currentTime);
        osc2.start(currentTime);
        osc3.start(currentTime);
        osc1.stop(currentTime + duration);
        osc2.stop(currentTime + duration);
        osc3.stop(currentTime + duration);
        
        return gainNode;
    }
    
    createFlute(frequency, volume, currentTime, duration) {
        const osc = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(frequency, currentTime);
        
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1000, currentTime);
        filter.Q.setValueAtTime(2, currentTime);
        
        gainNode.gain.setValueAtTime(0, currentTime);
        gainNode.gain.linearRampToValueAtTime(volume, currentTime + 0.2);
        gainNode.gain.linearRampToValueAtTime(volume * 0.8, currentTime + duration * 0.7);
        gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + duration);
        
        osc.connect(filter);
        filter.connect(gainNode);
        this.connectAudioOutput(gainNode);
        
        osc.start(currentTime);
        osc.stop(currentTime + duration);
        
        return gainNode;
    }
    
    visualizeNoteThreeJS(noteName, midiNote, velocity, timestamp) {
        // Fallback to DOM if THREE.js not available
        if (!this.scene || typeof THREE === 'undefined') {
            console.log(`⚠️ Three.js fallback: scene=${!!this.scene}, THREE=${typeof THREE}`);
            this.visualizeNoteFallback(noteName, midiNote, velocity);
            return;
        }
        
        console.log(`🎵 visualizeNoteThreeJS called: ${noteName}, MIDI:${midiNote}, vel:${velocity}`);
        
        const color = this.getNoteColor(midiNote, velocity);
        const size = this.getNoteSizeMultiplier(velocity);
        
        // Create text sprite with larger canvas for better quality
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        // Increase canvas size to accommodate velocity text without clipping
        canvas.width = 512;
        canvas.height = this.settings.showVelocityNumbers && velocity !== null ? 384 : 256; // 1.5x height for velocity display
        
        // Enhanced text rendering with glow effect
        const glowIntensity = this.settings.glowIntensity;
        const fontFamily = this.settings.fontFamily;
        
        // Prepare note name components
        const noteIndex = midiNote % 12;
        const octave = Math.floor(midiNote / 12) - 1;
        const noteNamesArray = this.noteNames[this.settings.noteNameStyle];
        
        let mainText = noteNamesArray[noteIndex];
        if (this.settings.showOctaveNumbers) {
            mainText += octave;
        }
        
        // Get note color using the color palette system
        const noteColorHex = this.getNoteColor(midiNote, velocity);
        console.log(`🎨 Note color for MIDI ${midiNote}: ${noteColorHex} (colorScale: ${this.settings.colorScale})`);
        
        // Convert hex to rgba for canvas
        let textColor = 'rgba(255, 255, 255, 1)'; // Fallback
        if (noteColorHex) {
            const hex = noteColorHex.replace('#', '');
            if (hex.length === 6) {
                const r = parseInt(hex.substr(0, 2), 16);
                const g = parseInt(hex.substr(2, 2), 16);
                const b = parseInt(hex.substr(4, 2), 16);
                textColor = `rgba(${r}, ${g}, ${b}, 1)`;
                console.log(`🎨 Converted to RGBA: ${textColor}`);
            }
        }
        context.fillStyle = textColor;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        
        // Calculate line positions based on font size, line-height, and canvas size
        const mainFontSize = !this.hasMidiInput ? 55 * size : 80 * size;
        const velocityFontSize = !this.hasMidiInput ? 30 * size : 50 * size;
        const lineHeight = !this.hasMidiInput ? 1.6 : 2.0; // Tighter spacing for PC keyboard input
        const canvasCenter = canvas.height / 2; // Dynamic center based on canvas height
        
        let mainTextY = canvasCenter; // Default center position
        if (this.settings.showVelocityNumbers && velocity !== null) {
            // Adjust main text position to accommodate velocity text below
            const totalHeight = mainFontSize + (velocityFontSize * lineHeight);
            mainTextY = canvasCenter - (totalHeight / 4); // Move up to center both lines
        }
        
        // Draw main note name
        context.font = `bold ${mainFontSize}px ${fontFamily}, Arial, sans-serif`;
        
        // Add glow effect for main text (using same color as text)
        if (glowIntensity > 0) {
            const glowColor = textColor.replace('rgba(', '').replace(')', '').replace(', 1', ', ' + glowIntensity);
            context.shadowColor = 'rgba(' + glowColor + ')';
            context.shadowBlur = 20 * glowIntensity;
            context.shadowOffsetX = 0;
            context.shadowOffsetY = 0;
            
            // Multiple glow layers for intensity
            for (let i = 0; i < 3; i++) {
                context.fillText(mainText, canvas.width / 2, mainTextY);
            }
        }
        
        // Main text
        context.shadowBlur = 5;
        context.shadowColor = 'rgba(0, 0, 0, 0.5)';
        context.shadowOffsetX = 2;
        context.shadowOffsetY = 2;
        context.fillText(mainText, canvas.width / 2, mainTextY);
        
        // Draw velocity number with smaller font if enabled
        if (this.settings.showVelocityNumbers && velocity !== null) {
            // Calculate velocity text position with tighter line spacing
            const velocityTextY = mainTextY + (mainFontSize * lineHeight * 0.55); // Tighter spacing from main text
            
            context.font = `bold ${velocityFontSize}px ${fontFamily}, Arial, sans-serif`;
            const velocityText = `${velocity}`; // Remove brackets around velocity
            
            // Add glow effect for velocity text (using same color as main text)
            if (glowIntensity > 0) {
                const glowColor = textColor.replace('rgba(', '').replace(')', '').replace(', 1', ', ' + glowIntensity);
                context.shadowColor = 'rgba(' + glowColor + ')';
                context.shadowBlur = 15 * glowIntensity;
                
                for (let i = 0; i < 2; i++) {
                    context.fillText(velocityText, canvas.width / 2, velocityTextY);
                }
            }
            
            // Velocity text with tighter line spacing
            context.shadowBlur = 3;
            context.fillText(velocityText, canvas.width / 2, velocityTextY);
        }
        
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
        
        // Enhanced animation properties for sustained notes
        sprite.userData = {
            startTime: timestamp,
            midiNote: midiNote,
            startY: -10,
            endY: 10, // Go to top of screen
            velocity: velocity,
            originalScale: size,
            displaySize: displaySize,
            isActive: true, // Track if note is still being played
            sustainStartTime: timestamp, // When the sustained phase started
            movementPhase: 'rising' // 'rising', 'sustained', 'falling'
        };
        
        this.scene.add(sprite);
        this.noteObjects.push(sprite);
        
        // Track active note sprite
        if (this.activeNoteSprites.has(midiNote)) {
            // If there's already an active note, mark the old one for fading
            const oldSprite = this.activeNoteSprites.get(midiNote);
            if (oldSprite.userData) {
                oldSprite.userData.isActive = false;
                oldSprite.userData.movementPhase = 'falling';
            }
        }
        this.activeNoteSprites.set(midiNote, sprite);
        
        // Debug: Log sprite creation and positioning
        console.log(`🎨 Sprite created: ${mainText}, position: (${x.toFixed(2)}, ${sprite.position.y}, ${sprite.position.z}), scale: ${displaySize.toFixed(2)}`);
        console.log(`📊 Scene stats: ${this.noteObjects.length} sprites, camera pos: (${this.camera.position.x}, ${this.camera.position.y}, ${this.camera.position.z})`);
        
        // Clean up old notes (less aggressive cleanup since notes last longer now)
        if (this.noteObjects.length > 100) {
            const oldSprite = this.noteObjects.shift();
            this.scene.remove(oldSprite);
            if (oldSprite.material.map) {
                oldSprite.material.map.dispose();
            }
            oldSprite.material.dispose();
            
            // Also clean up from activeNoteSprites if it exists there
            for (const [midiNote, sprite] of this.activeNoteSprites.entries()) {
                if (sprite === oldSprite) {
                    this.activeNoteSprites.delete(midiNote);
                    break;
                }
            }
        }
    }
    
    getNoteColorThreeJS(midiNote, velocity) {
        // Use retro colors if retro palette is selected
        if (this.settings.colorScale.startsWith('retro-')) {
            const retroHex = this.getRandomRetroColor();
            console.log(`🎨 Three.js using retro color: ${retroHex} from ${this.settings.colorScale}`);
            return this.hexToRgb(retroHex);
        }
        
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
        if (!this.hasMidiInput) {
            // When no MIDI device is connected, use font size for velocity 60 (PC keyboard)
            const defaultSize = baseSize + (60 / 127) * 30 * this.settings.sizeMultiplier;
            return Math.max(defaultSize, 16);
        }
        const scaledSize = baseSize + (velocity / 127) * 30 * this.settings.sizeMultiplier;
        return Math.max(scaledSize, 16);
    }
    
    getNoteColor(midiNote, velocity) {
        // Special handling for retro palettes - use random color selection
        if (this.settings.colorScale.startsWith('retro-')) {
            const retroColor = this.getRandomRetroColor();
            console.log(`🎨 Using retro color: ${retroColor} from ${this.settings.colorScale}`);
            return retroColor;
        }
        
        const noteIndex = midiNote % 12;
        const scale = this.scales[this.settings.colorScale] || this.scales.chromatic;
        let palette = this.colorPalettes[this.settings.colorScale];
        
        // If custom scale is selected and palette is empty, generate custom colors
        if (this.settings.colorScale === 'custom' && (!palette || palette.length === 0)) {
            this.updateCustomColors();
            palette = this.colorPalettes.custom;
        }
        
        // Fallback to chromatic palette if current palette is undefined
        if (!palette) {
            palette = this.colorPalettes.chromatic || ['#ff0000', '#ff8000', '#ffff00', '#80ff00', '#00ff00', '#00ff80', '#00ffff', '#0080ff', '#0000ff', '#8000ff', '#ff00ff', '#ff0080'];
        }
        
        // Find note position in scale
        let scalePosition = scale.indexOf(noteIndex);
        if (scalePosition === -1) {
            // If note not in scale, use closest note
            scalePosition = this.findClosestNoteInScale(noteIndex, scale);
        }
        
        const baseColor = palette[scalePosition] || '#ffffff';
        
        // Create gradient based on octave (higher octave = lighter)
        const octave = Math.floor(midiNote / 12) - 1;
        const octaveRange = 8; // A0 to C8
        const normalizedOctave = Math.max(0, Math.min(1, octave / octaveRange));
        
        // Parse hex color
        const hex = baseColor.replace('#', '');
        let r = parseInt(hex.substr(0, 2), 16);
        let g = parseInt(hex.substr(2, 2), 16);
        let b = parseInt(hex.substr(4, 2), 16);
        
        // Apply octave gradient (lighter for higher octaves)
        const gradientFactor = 0.3 + (normalizedOctave * 0.7);
        r = Math.round(r + (255 - r) * (1 - gradientFactor));
        g = Math.round(g + (255 - g) * (1 - gradientFactor));
        b = Math.round(b + (255 - b) * (1 - gradientFactor));
        
        // Apply velocity and intensity
        const velocityFactor = Math.max(0.6, velocity / 127);
        const intensityFactor = this.settings.colorIntensity;
        
        r = Math.round(r * velocityFactor * intensityFactor);
        g = Math.round(g * velocityFactor * intensityFactor);
        b = Math.round(b * velocityFactor * intensityFactor);
        
        const alpha = 0.8 + (velocity / 127) * 0.2;
        
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    
    findClosestNoteInScale(noteIndex, scale) {
        let closestDistance = 12;
        let closestIndex = 0;
        
        for (let i = 0; i < scale.length; i++) {
            const distance = Math.abs(noteIndex - scale[i]);
            if (distance < closestDistance) {
                closestDistance = distance;
                closestIndex = i;
            }
        }
        
        return closestIndex;
    }
    
    setupEventListeners() {
        const controls = {
            'animation-speed': { setting: 'animationSpeed', display: 'speed-value' },
            'size-multiplier': { setting: 'sizeMultiplier', display: 'size-value' },
            'velocity-sensitivity': { setting: 'velocitySensitivity', display: 'velocity-value' },
            'fade-duration': { setting: 'fadeDuration', display: 'fade-value' },
            'color-intensity': { setting: 'colorIntensity', display: 'color-value' },
            'motion-blur': { setting: 'motionBlur', display: 'blur-value' },
            'glow-intensity': { setting: 'glowIntensity', display: 'glow-value' }
        };
        
        Object.entries(controls).forEach(([id, config]) => {
            const slider = document.getElementById(id);
            const display = document.getElementById(config.display);
            
            slider.addEventListener('input', (e) => {
                this.settings[config.setting] = parseFloat(e.target.value);
                display.textContent = e.target.value;
                
                // Fluid background updates removed for debugging
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
        
        // Color scale selector
        const colorScaleSelector = document.getElementById('color-scale');
        colorScaleSelector.addEventListener('change', (e) => {
            this.settings.colorScale = e.target.value;
            
            // Show/hide custom color controls
            const customControls = document.getElementById('color-customization');
            if (e.target.value === 'custom') {
                customControls.style.display = 'block';
                this.updateCustomColors();
            } else {
                customControls.style.display = 'none';
            }
            
            // Special handling for retro palettes
            if (e.target.value.startsWith('retro-')) {
                console.log(`🎨 ColorHunt Retro palette selected: ${e.target.value}`);
                console.log(`🌈 Colors: ${this.colorPalettes[e.target.value].join(', ')}`);
            } else {
                console.log(`🎨 Color scale changed to: ${e.target.value}`);
            }
        });
        
        // Velocity numbers toggle
        const velocityToggle = document.getElementById('show-velocity-numbers');
        velocityToggle.addEventListener('change', (e) => {
            this.settings.showVelocityNumbers = e.target.checked;
            console.log(`🎯 Velocity numbers: ${e.target.checked ? 'shown' : 'hidden'}`);
        });
        
        // Octave numbers toggle
        const octaveToggle = document.getElementById('show-octave-numbers');
        octaveToggle.addEventListener('change', (e) => {
            this.settings.showOctaveNumbers = e.target.checked;
            console.log(`🔢 Octave numbers: ${e.target.checked ? 'shown' : 'hidden'}`);
        });
        
        // Spectrum analyzer toggle
        const spectrumToggle = document.getElementById('show-spectrum-analyzer');
        spectrumToggle.addEventListener('change', (e) => {
            this.settings.showSpectrumAnalyzer = e.target.checked;
            if (this.spectrumCanvas) {
                this.spectrumCanvas.style.display = e.target.checked ? 'block' : 'none';
            }
            console.log(`🌊 Waveform display: ${e.target.checked ? 'shown' : 'hidden'}`);
        });
        
        // Audio timbre selector
        const timbreSelector = document.getElementById('audio-timbre');
        timbreSelector.addEventListener('change', (e) => {
            this.settings.audioTimbre = e.target.value;
            console.log(`🎵 Audio timbre changed to: ${e.target.value}`);
        });
        
        // Note name style selector
        const noteNameStyleSelector = document.getElementById('note-name-style');
        noteNameStyleSelector.addEventListener('change', (e) => {
            this.settings.noteNameStyle = e.target.value;
            this.updateKeyboardHelp();
            console.log(`🎶 Note name style changed to: ${e.target.value}`);
        });
        
        // Base color picker
        const baseColorPicker = document.getElementById('base-color-picker');
        baseColorPicker.addEventListener('change', (e) => {
            this.settings.customBaseColor = e.target.value;
            if (this.settings.colorScale === 'custom') {
                this.updateCustomColors();
            }
            console.log(`🎨 Base color changed to: ${e.target.value}`);
        });
        
        // Color code input
        const colorCodeInput = document.getElementById('color-code-input');
        const applyColorButton = document.getElementById('apply-color-code');
        
        applyColorButton.addEventListener('click', () => {
            const colorCode = colorCodeInput.value.trim();
            if (/^#[0-9A-Fa-f]{6}$/.test(colorCode)) {
                this.settings.customBaseColor = colorCode;
                baseColorPicker.value = colorCode;
                if (this.settings.colorScale === 'custom') {
                    this.updateCustomColors();
                }
                console.log(`🎨 Color code applied: ${colorCode}`);
                colorCodeInput.style.borderColor = '';
            } else {
                console.warn(`❌ Invalid color code: ${colorCode}`);
                colorCodeInput.style.borderColor = '#ff4444';
            }
        });
        
        colorCodeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                applyColorButton.click();
            }
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
            const percentage = parseInt(e.target.value);
            this.playbackRate = percentage / 100.0;
            tempoValue.textContent = `${percentage}%`;
            console.log(`🎼 MIDI tempo changed to: ${percentage}% (${this.playbackRate.toFixed(2)}x)`);
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
    
    setupCollapsibleSections() {
        // Load saved panel states from localStorage
        const savedPanelStates = this.loadPanelStates();
        
        // Initialize max-height for all collapsible content
        document.querySelectorAll('.collapsible-content').forEach(content => {
            const sectionName = content.getAttribute('data-section');
            const isCollapsed = savedPanelStates[sectionName] !== undefined 
                ? savedPanelStates[sectionName] 
                : true; // Default to collapsed if no saved state
            
            if (isCollapsed) {
                // Start collapsed
                content.classList.add('collapsed');
                content.style.maxHeight = '0';
                const header = document.querySelector(`h3[data-section="${sectionName}"]`);
                if (header) {
                    header.classList.add('collapsed');
                }
            } else {
                // Start expanded
                content.classList.remove('collapsed');
                content.style.maxHeight = content.scrollHeight + 'px';
                const header = document.querySelector(`h3[data-section="${sectionName}"]`);
                if (header) {
                    header.classList.remove('collapsed');
                }
            }
        });
        
        // Add click listeners to section headers
        document.querySelectorAll('h3[data-section]').forEach(header => {
            header.addEventListener('click', (e) => {
                const sectionName = header.getAttribute('data-section');
                const content = document.querySelector(`.collapsible-content[data-section="${sectionName}"]`);
                const icon = header.querySelector('.toggle-icon');
                
                if (content.classList.contains('collapsed')) {
                    // Expand
                    content.classList.remove('collapsed');
                    // Use requestAnimationFrame for smoother animation
                    requestAnimationFrame(() => {
                        content.style.maxHeight = content.scrollHeight + 'px';
                    });
                    header.classList.remove('collapsed');
                    this.savePanelState(sectionName, false); // Save expanded state
                    console.log(`📂 Expanded section: ${sectionName}`);
                } else {
                    // Collapse
                    content.classList.add('collapsed');
                    content.style.maxHeight = '0';
                    header.classList.add('collapsed');
                    this.savePanelState(sectionName, true); // Save collapsed state
                    console.log(`📁 Collapsed section: ${sectionName}`);
                }
            });
        });
        
        console.log('✅ Collapsible sections initialized with saved states');
    }
    
    loadPanelStates() {
        try {
            const saved = localStorage.getItem('pianoVisualizer_panelStates');
            return saved ? JSON.parse(saved) : {};
        } catch (error) {
            console.warn('⚠️ Failed to load panel states from localStorage:', error);
            return {};
        }
    }
    
    savePanelState(sectionName, isCollapsed) {
        try {
            const savedStates = this.loadPanelStates();
            savedStates[sectionName] = isCollapsed;
            localStorage.setItem('pianoVisualizer_panelStates', JSON.stringify(savedStates));
            console.log(`💾 Saved panel state: ${sectionName} = ${isCollapsed ? 'collapsed' : 'expanded'}`);
        } catch (error) {
            console.warn('⚠️ Failed to save panel state to localStorage:', error);
        }
    }
    
    createCanvasBackground() {
        console.log('🎨 Creating canvas gradient background...');
        
        if (!this.scene || !this.camera) {
            console.warn('⚠️ Scene or camera not ready for background');
            return;
        }
        
        try {
            // Canvas要素を作成して直接描画
            const canvas = document.createElement('canvas');
            canvas.width = 512;
            canvas.height = 512;
            const ctx = canvas.getContext('2d');
            
            // 美しい放射状グラデーション描画
            const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
            gradient.addColorStop(0, 'rgba(102, 126, 234, 0.2)');
            gradient.addColorStop(0.5, 'rgba(118, 75, 162, 0.15)');
            gradient.addColorStop(1, 'rgba(15, 15, 35, 0.1)');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 512, 512);
            
            // Canvas要素からテクスチャを作成
            const texture = new THREE.CanvasTexture(canvas);
            texture.wrapS = THREE.ClampToEdgeWrapping;
            texture.wrapT = THREE.ClampToEdgeWrapping;
            
            // ビューポート全体をカバーするプレーンサイズを計算
            const distance = 30;
            const fov = this.camera.fov * (Math.PI / 180);
            const planeHeight = 2 * Math.tan(fov / 2) * distance;
            const planeWidth = planeHeight * this.camera.aspect;
            
            const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
            const material = new THREE.MeshBasicMaterial({ 
                map: texture, 
                transparent: true, 
                opacity: 0.3,
                side: THREE.DoubleSide
            });
            
            const backgroundPlane = new THREE.Mesh(geometry, material);
            backgroundPlane.position.z = -20;
            this.scene.add(backgroundPlane);
            
            this.backgroundPlane = backgroundPlane;
            
            console.log('✅ Canvas gradient background created successfully');
            
        } catch (error) {
            console.error('❌ Error creating canvas background:', error);
        }
    }
    
    generateCustomColors(baseColor, count = 12) {
        // Special handling for white color - generate rainbow colors
        if (baseColor === '#ffffff' || baseColor.toLowerCase() === '#ffffff') {
            const colors = [];
            for (let i = 0; i < count; i++) {
                const hue = i / count; // Evenly distributed hues
                const saturation = 0.8; // High saturation for vibrant colors
                const lightness = 0.6; // Medium lightness for good visibility
                
                colors.push(this.hslToHex(hue, saturation, lightness));
            }
            return colors;
        }
        
        // Convert hex to HSL
        const hex = baseColor.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16) / 255;
        const g = parseInt(hex.substr(2, 2), 16) / 255;
        const b = parseInt(hex.substr(4, 2), 16) / 255;
        
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
        
        if (max === min) {
            h = s = 0; // achromatic
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        
        // Generate colors with different hues and lightness
        const colors = [];
        for (let i = 0; i < count; i++) {
            const hue = (h + (i / count)) % 1;
            const lightness = 0.4 + (i / count) * 0.4; // Vary lightness from 0.4 to 0.8
            const saturation = Math.max(0.6, s); // Maintain good saturation
            
            colors.push(this.hslToHex(hue, saturation, lightness));
        }
        
        return colors;
    }
    
    getRandomRetroPalette() {
        const randomIndex = Math.floor(Math.random() * this.retroPalettes.length);
        return this.retroPalettes[randomIndex];
    }
    
    getRandomRetroColor() {
        // Use current selected retro palette, or random if none selected
        let selectedPalette = this.settings.colorScale;
        if (!selectedPalette || !selectedPalette.startsWith('retro-')) {
            selectedPalette = this.getRandomRetroPalette();
        }
        
        const palette = this.colorPalettes[selectedPalette];
        if (!palette || palette.length === 0) {
            console.warn(`No palette found for ${selectedPalette}, using default`);
            return '#ffffff'; // Fallback color
        }
        
        const randomColorIndex = Math.floor(Math.random() * palette.length);
        const selectedColor = palette[randomColorIndex];
        
        // Throttled logging to avoid spam
        if (!this.lastColorLog || Date.now() - this.lastColorLog > 2000) {
            console.log(`🎨 Selected color ${selectedColor} (index ${randomColorIndex}) from ${selectedPalette} palette:`, palette);
            this.lastColorLog = Date.now();
        }
        
        return selectedColor;
    }
    
    hexToRgb(hex) {
        // Convert hex color to RGB object for Three.js
        const cleanHex = hex.replace('#', '');
        const r = parseInt(cleanHex.substr(0, 2), 16) / 255;
        const g = parseInt(cleanHex.substr(2, 2), 16) / 255;
        const b = parseInt(cleanHex.substr(4, 2), 16) / 255;
        return { r, g, b };
    }
    
    initializeRetroColors() {
        // Set random retro palette as default
        this.settings.colorScale = this.getRandomRetroPalette();
        console.log(`🎨 Initialized with random retro palette: ${this.settings.colorScale}`);
        console.log(`🌈 Palette colors:`, this.colorPalettes[this.settings.colorScale]);
        
        // Update HTML select box to reflect the selection
        const colorScaleSelector = document.getElementById('color-scale');
        if (colorScaleSelector) {
            colorScaleSelector.value = this.settings.colorScale;
            console.log(`🎛️ Updated color scale selector to: ${this.settings.colorScale}`);
            
            // Hide custom controls since we're using retro palette
            const customControls = document.getElementById('color-customization');
            if (customControls) {
                customControls.style.display = 'none';
            }
        } else {
            console.warn(`⚠️ Color scale selector not found in DOM`);
        }
        
        // Test color selection
        const testColor = this.getRandomRetroColor();
        console.log(`🧪 Test color selection: ${testColor}`);
    }
    
    hslToHex(h, s, l) {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };
        
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        const r = hue2rgb(p, q, h + 1/3);
        const g = hue2rgb(p, q, h);
        const b = hue2rgb(p, q, h - 1/3);
        
        const toHex = (c) => {
            const hex = Math.round(c * 255).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };
        
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }
    
    updateCustomColors() {
        const baseColor = this.settings.customBaseColor;
        const scaleLength = this.scales[this.settings.colorScale] ? this.scales[this.settings.colorScale].length : 12;
        this.colorPalettes.custom = this.generateCustomColors(baseColor, scaleLength);
        console.log(`🎨 Generated ${scaleLength} custom colors from base: ${baseColor}`);
    }
    
    updateKeyboardHelp() {
        const keyMappings = [
            { key: 'A', midiNote: 60 }, // C4
            { key: 'W', midiNote: 61 }, // C#4
            { key: 'S', midiNote: 62 }, // D4
            { key: 'E', midiNote: 63 }, // D#4
            { key: 'D', midiNote: 64 }, // E4
            { key: 'F', midiNote: 65 }, // F4
            { key: 'T', midiNote: 66 }, // F#4
            { key: 'G', midiNote: 67 }, // G4
            { key: 'Y', midiNote: 68 }, // G#4
            { key: 'H', midiNote: 69 }, // A4
            { key: 'U', midiNote: 70 }, // A#4
            { key: 'J', midiNote: 71 }, // B4
            { key: 'K', midiNote: 72 }, // C5
            { key: 'O', midiNote: 73 }, // C#5
            { key: 'L', midiNote: 74 }, // D5
            { key: 'P', midiNote: 75 }, // D#5
            { key: ';', midiNote: 76 }, // E5
            { key: "'", midiNote: 77 }, // F5
            { key: ']', midiNote: 78 }, // F#5
            { key: '\\', midiNote: 79 } // G5
        ];
        
        // Update all note displays in keyboard help
        keyMappings.forEach(mapping => {
            const noteElement = document.querySelector(`.mapping-row .key:contains('${mapping.key}')`);
            if (noteElement && noteElement.nextElementSibling) {
                const noteName = this.midiNoteToNoteName(mapping.midiNote);
                noteElement.nextElementSibling.textContent = noteName;
            }
        });
        
        // Alternative approach: find by text content
        document.querySelectorAll('.mapping-row').forEach(row => {
            const keySpan = row.querySelector('.key');
            const noteSpan = row.querySelector('.note');
            if (keySpan && noteSpan) {
                const keyText = keySpan.textContent.trim();
                const mapping = keyMappings.find(m => m.key === keyText);
                if (mapping) {
                    noteSpan.textContent = this.midiNoteToNoteName(mapping.midiNote);
                }
            }
        });
    }
    
    setupKeyboardListeners() {
        document.addEventListener('keydown', (e) => {
            // Handle spacebar for MIDI play/pause (works regardless of input device)
            if (e.code === 'Space') {
                e.preventDefault();
                if (this.midiData) { // Only if MIDI file is loaded
                    if (this.isPlaying) {
                        this.pauseMidi();
                        console.log('⏸️ MIDI paused via spacebar');
                    } else {
                        this.playMidi();
                        console.log('▶️ MIDI playing via spacebar');
                    }
                }
                return; // Don't process as piano key
            }
            
            // Only handle keyboard input when computer keyboard is selected
            if (this.selectedInputDevice !== 'keyboard') return;
            
            if (this.activeKeys.has(e.code)) return;
            
            const midiNote = this.keyboardMapping[e.code];
            if (midiNote) {
                e.preventDefault();
                this.activeKeys.add(e.code);
                this.playNote(midiNote, 60, performance.now());
                this.highlightPianoKey(midiNote, true);
                this.logMidiActivity(`▶ ${this.midiNoteToNoteName(midiNote, 60)} (${midiNote}) vel:60`);
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
        console.log(`🚀 startVisualization called: renderer=${!!this.renderer}, THREE=${typeof THREE}, scene=${!!this.scene}`);
        if (!this.renderer || typeof THREE === 'undefined') {
            // Fallback: just animate background if THREE.js failed
            console.log('⚠️ Using fallback visualization - THREE.js or renderer not available');
            return;
        }
        
        console.log('✅ Starting Three.js animation loop');
        
        const animate = () => {
            const currentTime = performance.now();
            
            // Fluid background animation removed for debugging
            
            // Debug: Log sprite count every 2 seconds
            if (Math.floor(currentTime / 2000) > this.lastDebugTime) {
                this.lastDebugTime = Math.floor(currentTime / 2000);
                console.log(`🎵 Animation loop running - Active sprites: ${this.noteObjects.length}`);
            }
            
            // Update note sprites with sustained note logic
            for (let i = this.noteObjects.length - 1; i >= 0; i--) {
                const sprite = this.noteObjects[i];
                const userData = sprite.userData;
                const velocityIntensity = userData.velocity / 127;
                const motionBlurFactor = this.settings.motionBlur;
                
                let shouldRemove = false;
                
                if (userData.movementPhase === 'rising') {
                    // Rising phase: 0.5 seconds to reach sustain position
                    const risingDuration = 500; // 0.5 seconds
                    const elapsed = currentTime - userData.startTime;
                    const progress = Math.min(1, elapsed / risingDuration);
                    
                    if (progress >= 1.0) {
                        // Transition to sustained phase
                        userData.movementPhase = userData.isActive ? 'sustained' : 'falling';
                        userData.sustainStartTime = currentTime;
                        sprite.position.y = 2; // Sustain position
                    } else {
                        // Animate upward with smooth easing
                        const easeOut = 1 - Math.pow(1 - progress, 2);
                        sprite.position.y = userData.startY + easeOut * (2 - userData.startY); // Rise to y=2
                        
                        // Fade in
                        sprite.material.opacity = Math.min(1, progress * 3);
                    }
                } else if (userData.movementPhase === 'sustained') {
                    // Sustained phase: gentle floating animation
                    sprite.position.y = 2; // Stay at sustain position
                    
                    // Gentle floating effect
                    const floatTime = (currentTime - userData.sustainStartTime) / 1000;
                    const floatOffset = Math.sin(floatTime * 2) * 0.2; // Gentle up/down
                    sprite.position.y += floatOffset;
                    
                    // Gentle pulsing
                    const pulseScale = 1 + Math.sin(floatTime * 1.5) * 0.05;
                    sprite.scale.set(
                        userData.displaySize * pulseScale, 
                        userData.displaySize * 0.7 * pulseScale, 
                        1
                    );
                    
                    // Stable opacity with slight breathing effect
                    const breathingOpacity = 0.8 + Math.sin(floatTime) * 0.1;
                    sprite.material.opacity = Math.min(1, breathingOpacity + velocityIntensity * 0.2);
                    
                    // Check if note should start falling
                    if (!userData.isActive) {
                        userData.movementPhase = 'falling';
                        userData.fallStartTime = currentTime;
                    }
                } else if (userData.movementPhase === 'falling') {
                    // Falling phase: fade out and move upward to disappear
                    const fallDuration = 1000; // 1 second to fade out
                    const elapsed = currentTime - (userData.noteOffTime || userData.fallStartTime || currentTime);
                    const progress = Math.min(1, elapsed / fallDuration);
                    
                    if (progress >= 1.0) {
                        shouldRemove = true;
                    } else {
                        // Continue moving upward while fading
                        const easeIn = Math.pow(progress, 1.5);
                        sprite.position.y = 2 + easeIn * 8; // Move from sustain position to top
                        
                        // Fade out
                        sprite.material.opacity = (1 - progress) * (0.8 + velocityIntensity * 0.2);
                        
                        // Slight scale reduction
                        const fadeScale = 1 - progress * 0.2;
                        sprite.scale.set(
                            userData.displaySize * fadeScale, 
                            userData.displaySize * 0.7 * fadeScale, 
                            1
                        );
                    }
                }
                
                // Add motion blur and rotation effects for all phases
                sprite.position.z = Math.sin((currentTime - userData.startTime) / 1000 * Math.PI) * (1 + motionBlurFactor * 2);
                const rotationIntensity = motionBlurFactor * velocityIntensity * 0.1;
                sprite.material.rotation = Math.sin((currentTime - userData.startTime) / 1000 * Math.PI * 2) * rotationIntensity;
                
                // Remove sprite if needed
                if (shouldRemove) {
                    this.scene.remove(sprite);
                    if (sprite.material.map) {
                        sprite.material.map.dispose();
                    }
                    sprite.material.dispose();
                    this.noteObjects.splice(i, 1);
                }
            }
            
            // Render the scene
            this.renderer.render(this.scene, this.camera);
            
            // Copy canvas for recording immediately after render for better sync
            this.copyCanvasForRecording();
            
            requestAnimationFrame(animate);
        };
        animate();
    }
    
    updateRecordingCanvasImmediate() {
        // Quick update of just the piano area for immediate sync
        if (!this.isRecording || !this.recordingContext || !this.recordingLayout) {
            return;
        }
        
        try {
            const layout = this.recordingLayout;
            
            // Clear only the piano area and redraw it immediately
            this.recordingContext.fillStyle = '#2a2a2a';
            this.recordingContext.fillRect(0, layout.visualizationHeight, layout.width, layout.pianoHeight);
            
            // Redraw piano keyboard with current key states
            this.drawPianoKeyboardToCanvas(0, layout.visualizationHeight, layout.width, layout.pianoHeight);
            
        } catch (error) {
            console.warn('Immediate recording update error:', error);
        }
    }
    
    copyCanvasForRecording() {
        // Only copy if recording with composite canvas
        if (!this.isRecording || !this.recordingContext || !this.renderer) {
            return;
        }
        
        try {
            const sourceCanvas = this.renderer.domElement;
            
            // Clear the recording canvas
            this.recordingContext.clearRect(0, 0, this.recordingCanvas.width, this.recordingCanvas.height);
            
            // Use stored layout info for consistent scaling
            const layout = this.recordingLayout;
            if (!layout) {
                console.warn('⚠️ Recording layout not initialized');
                return;
            }
            
            // Scale and copy Three.js canvas to top portion (maintaining aspect ratio)
            const sourceWidth = sourceCanvas.width || sourceCanvas.clientWidth;
            const sourceHeight = sourceCanvas.height || sourceCanvas.clientHeight;
            
            // Calculate scaling to fit visualization area while maintaining aspect ratio
            const scaleX = layout.width / sourceWidth;
            const scaleY = layout.visualizationHeight / sourceHeight;
            const scale = Math.min(scaleX, scaleY);
            
            const scaledWidth = sourceWidth * scale;
            const scaledHeight = sourceHeight * scale;
            const offsetX = (layout.width - scaledWidth) / 2;
            const offsetY = (layout.visualizationHeight - scaledHeight) / 2;
            
            // Draw scaled Three.js canvas centered in visualization area
            this.recordingContext.drawImage(
                sourceCanvas, 
                offsetX, offsetY, 
                scaledWidth, scaledHeight
            );
            
            // Draw piano keyboard in bottom portion
            this.drawPianoKeyboardToCanvas(0, layout.visualizationHeight, layout.width, layout.pianoHeight);
            
            // Add recording indicator
            this.recordingContext.fillStyle = 'rgba(255, 0, 0, 0.9)';
            this.recordingContext.fillRect(10, 10, 20, 20);
            this.recordingContext.fillStyle = 'white';
            this.recordingContext.font = 'bold 12px Arial';
            this.recordingContext.fillText('REC', 35, 25);
            
        } catch (error) {
            console.warn('Canvas recording error:', error);
        }
    }
    
    drawPianoKeyboardToCanvas(x, y, width, height) {
        const ctx = this.recordingContext;
        const config = this.pianoConfigs[this.settings.pianoRange];
        const startNote = config.startNote;
        const endNote = config.endNote;
        
        // Debug: Log piano drawing info (throttled)
        const pressedKeysCount = this.activeKeys.size;
        if (pressedKeysCount > 0 && !this.lastPianoLog || Date.now() - this.lastPianoLog > 1000) {
            console.log(`🎹 Drawing piano with ${pressedKeysCount} pressed keys`);
            this.lastPianoLog = Date.now();
        }
        
        // Calculate key dimensions
        const whiteKeyCount = this.countWhiteKeys(startNote, endNote);
        const whiteKeyWidth = width / whiteKeyCount;
        const whiteKeyHeight = height - 20; // Leave some margin
        const blackKeyWidth = whiteKeyWidth * 0.6;
        const blackKeyHeight = whiteKeyHeight * 0.6;
        
        // Draw background
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(x, y, width, height);
        
        // Draw white keys first
        let whiteKeyIndex = 0;
        for (let midiNote = startNote; midiNote <= endNote; midiNote++) {
            const noteIndex = midiNote % 12;
            const isWhiteKey = [0, 2, 4, 5, 7, 9, 11].includes(noteIndex);
            
            if (isWhiteKey) {
                const keyX = x + whiteKeyIndex * whiteKeyWidth;
                const isPressed = this.activeKeys.has(midiNote);
                
                // Key background
                ctx.fillStyle = isPressed ? '#4f46e5' : '#ffffff';
                ctx.fillRect(keyX + 2, y + 10, whiteKeyWidth - 4, whiteKeyHeight);
                
                // Key border
                ctx.strokeStyle = '#333333';
                ctx.lineWidth = 1;
                ctx.strokeRect(keyX + 2, y + 10, whiteKeyWidth - 4, whiteKeyHeight);
                
                // Key pressed effect
                if (isPressed) {
                    ctx.fillStyle = 'rgba(79, 70, 229, 0.3)';
                    ctx.fillRect(keyX + 2, y + 10, whiteKeyWidth - 4, whiteKeyHeight);
                }
                
                whiteKeyIndex++;
            }
        }
        
        // Draw black keys on top
        whiteKeyIndex = 0;
        for (let midiNote = startNote; midiNote <= endNote; midiNote++) {
            const noteIndex = midiNote % 12;
            const isWhiteKey = [0, 2, 4, 5, 7, 9, 11].includes(noteIndex);
            const isBlackKey = [1, 3, 6, 8, 10].includes(noteIndex);
            
            if (isWhiteKey) {
                whiteKeyIndex++;
            } else if (isBlackKey) {
                const prevWhiteKeyX = x + (whiteKeyIndex - 1) * whiteKeyWidth;
                const keyX = prevWhiteKeyX + whiteKeyWidth - (blackKeyWidth / 2);
                const isPressed = this.activeKeys.has(midiNote);
                
                // Key background
                ctx.fillStyle = isPressed ? '#8b5cf6' : '#1a1a1a';
                ctx.fillRect(keyX, y + 10, blackKeyWidth, blackKeyHeight);
                
                // Key border
                ctx.strokeStyle = '#666666';
                ctx.lineWidth = 1;
                ctx.strokeRect(keyX, y + 10, blackKeyWidth, blackKeyHeight);
                
                // Key pressed effect
                if (isPressed) {
                    ctx.fillStyle = 'rgba(139, 92, 246, 0.5)';
                    ctx.fillRect(keyX, y + 10, blackKeyWidth, blackKeyHeight);
                }
            }
        }
        
        // Add piano label
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Piano Keyboard', x + width / 2, y + height - 5);
    }
    
    async startRecording() {
        try {
            // Check if screen recording is enabled
            if (!this.screenRecordingEnabled) {
                alert('❌ 画面録画が無効になっています。\nチェックボックスをONにしてから録画してください。');
                return;
            }
            
            console.log('🎬 Starting canvas-only recording with audio...');
            
            // Check if Three.js canvas is available
            if (!this.renderer || !this.renderer.domElement) {
                alert('❌ Three.jsキャンバスが見つかりません。しばらく待ってから再試行してください。');
                return;
            }
            
            // Get the Three.js canvas
            const sourceCanvas = this.renderer.domElement;
            
            console.log(`📐 Source canvas: ${sourceCanvas.width}x${sourceCanvas.height}`);
            console.log(`📐 Source canvas client: ${sourceCanvas.clientWidth}x${sourceCanvas.clientHeight}`);
            
            // Always create composite canvas with piano keyboard for recording
            console.log('🎹 Creating composite canvas with piano keyboard for recording...');
            
            // YouTube recommended sizes: 1920x1080 (Full HD)
            const YOUTUBE_WIDTH = 1920;
            const YOUTUBE_HEIGHT = 1080;
            const PIANO_HEIGHT = 160; // Increase piano height for better visibility
            const VISUALIZATION_HEIGHT = YOUTUBE_HEIGHT - PIANO_HEIGHT;
            
            this.recordingCanvas = document.createElement('canvas');
            this.recordingCanvas.width = YOUTUBE_WIDTH;
            this.recordingCanvas.height = YOUTUBE_HEIGHT;
            this.recordingContext = this.recordingCanvas.getContext('2d');
            
            // Store layout info for consistent scaling
            this.recordingLayout = {
                width: YOUTUBE_WIDTH,
                height: YOUTUBE_HEIGHT,
                visualizationHeight: VISUALIZATION_HEIGHT,
                pianoHeight: PIANO_HEIGHT
            };
            
            console.log(`📐 Recording canvas: ${YOUTUBE_WIDTH}x${YOUTUBE_HEIGHT} (YouTube Full HD)`);
            console.log(`📐 Layout: Visualization ${VISUALIZATION_HEIGHT}px + Piano ${PIANO_HEIGHT}px`);
            
            // Get video stream from composite canvas with higher framerate for better sync
            const videoStream = this.recordingCanvas.captureStream(60); // 60 FPS for better sync
            console.log('✅ Composite canvas capture setup complete (60 FPS)');
            
            // Get audio stream from our audio destination
            let combinedStream;
            if (this.audioDestination && this.audioDestination.stream) {
                // Combine video and audio streams
                combinedStream = new MediaStream([
                    ...videoStream.getVideoTracks(),
                    ...this.audioDestination.stream.getAudioTracks()
                ]);
                console.log('✅ Combined video and audio streams');
            } else {
                // Video only if audio destination not available
                combinedStream = videoStream;
                console.log('⚠️ Audio destination not available, using video only');
            }
            
            // Try iPhone-compatible codecs first (H.264 MP4)
            const codecOptions = [
                { mimeType: 'video/mp4;codecs=avc1.42E01E', name: 'H.264 Baseline (iPhone最適)' },
                { mimeType: 'video/mp4;codecs=avc1.4D401E', name: 'H.264 Main (iPhone対応)' },
                { mimeType: 'video/mp4;codecs=h264', name: 'H.264 汎用' },
                { mimeType: 'video/mp4', name: 'MP4コンテナ' },
                { mimeType: 'video/webm;codecs=vp9', name: 'WebM VP9 (フォールバック)' },
                { mimeType: 'video/webm;codecs=vp8', name: 'WebM VP8 (フォールバック)' },
                { mimeType: 'video/webm', name: 'WebM (フォールバック)' }
            ];
            
            let options = null;
            for (const codec of codecOptions) {
                if (MediaRecorder.isTypeSupported(codec.mimeType)) {
                    options = { 
                        mimeType: codec.mimeType,
                        videoBitsPerSecond: 8000000, // 8 Mbps for high quality 1080p
                        audioBitsPerSecond: 128000   // 128 kbps for good audio quality
                    };
                    console.log(`✅ Selected codec: ${codec.name} (${codec.mimeType})`);
                    console.log(`📊 Quality: Video 8Mbps, Audio 128kbps`);
                    break;
                }
            }
            
            if (!options) {
                console.warn('⚠️ No supported video codecs found, using default');
                options = {};
            }
            
            this.mediaRecorder = new MediaRecorder(combinedStream, options);
            this.combinedStream = combinedStream;
            this.recordedChunks = [];
            
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.recordedChunks.push(event.data);
                    console.log(`📹 Recorded chunk: ${event.data.size} bytes`);
                }
            };
            
            this.mediaRecorder.onstop = () => {
                console.log('🛑 Recording stopped');
                document.getElementById('download-recording').disabled = false;
                
                // Clean up streams
                if (this.combinedStream) {
                    this.combinedStream.getTracks().forEach(track => track.stop());
                }
                
                // Clean up recording canvas
                this.recordingCanvas = null;
                this.recordingContext = null;
                this.combinedStream = null;
            };
            
            // Start the canvas copying process only if using fallback
            if (this.recordingCanvas) {
                this.startCanvasCopyLoop();
            }
            
            this.mediaRecorder.start();
            this.isRecording = true;
            
            document.getElementById('start-recording').disabled = true;
            document.getElementById('stop-recording').disabled = false;
            
            console.log('🔴 Canvas recording started successfully');
            
        } catch (error) {
            console.error('Failed to start recording:', error);
            alert('録画を開始できませんでした: ' + error.message);
        }
    }
    
    startCanvasCopyLoop() {
        // This function is now deprecated - canvas copying happens in main animation loop
        console.log('Canvas copying is now handled in the main animation loop');
    }
    
    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            console.log('🛑 Stopping canvas recording...');
            this.mediaRecorder.stop();
            this.isRecording = false;
            
            document.getElementById('start-recording').disabled = false;
            document.getElementById('stop-recording').disabled = true;
            
            console.log('📹 Canvas recording stopped, audio synthesis reverted to normal mode');
        }
    }
    
    downloadRecording() {
        if (this.recordedChunks.length === 0) return;
        
        // Determine the appropriate MIME type and extension based on what was recorded
        let mimeType = 'video/mp4';
        let extension = 'mp4';
        
        // Check if the recorded data is MP4 compatible
        if (this.mediaRecorder && this.mediaRecorder.mimeType) {
            const recordedMimeType = this.mediaRecorder.mimeType;
            console.log(`📹 Recorded with MIME type: ${recordedMimeType}`);
            
            if (recordedMimeType.includes('mp4')) {
                mimeType = 'video/mp4';
                extension = 'mp4';
            } else if (recordedMimeType.includes('webm')) {
                mimeType = 'video/webm';
                extension = 'webm';
            }
        }
        
        const blob = new Blob(this.recordedChunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const filename = `piano-recording-${timestamp}.${extension}`;
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
        document.getElementById('download-recording').disabled = true;
        
        console.log(`💾 Downloaded: ${filename} (${mimeType})`);
        
        // Show user-friendly message
        if (extension === 'mp4') {
            alert(`📱 MP4動画をダウンロードしました！\niPhoneのカメラロールでも再生できます。\nファイル名: ${filename}`);
        } else {
            alert(`📹 ${extension.toUpperCase()}動画をダウンロードしました。\nファイル名: ${filename}`);
        }
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
    
    async setupScreenRecording() {
        const enableCheckbox = document.getElementById('screen-recording-enabled');
        
        // Set checkbox state based on saved settings
        enableCheckbox.checked = this.screenRecordingEnabled;
        
        // Setup checkbox event listener
        enableCheckbox.addEventListener('change', (e) => {
            this.screenRecordingEnabled = e.target.checked;
            console.log(`🎬 Screen recording ${this.screenRecordingEnabled ? 'enabled' : 'disabled'}`);
            
            if (!this.screenRecordingEnabled && this.screenRecordingStream) {
                // Stop existing stream if disabled
                this.screenRecordingStream.getTracks().forEach(track => track.stop());
                this.screenRecordingStream = null;
                console.log('🛑 Screen recording stream stopped');
            }
            
            // Save settings when user changes checkbox
            this.saveSettings();
        });
        
        // Setup reset button
        const resetButton = document.getElementById('reset-recording-settings');
        resetButton.addEventListener('click', () => {
            this.resetRecordingSettings();
        });
        
        // Show permission dialog only if enabled and not previously asked
        if (this.screenRecordingEnabled && !this.screenRecordingPermissionAsked) {
            setTimeout(() => {
                this.requestScreenRecordingPermission();
            }, 1000); // Wait 1 second after load
        } else if (this.screenRecordingPermissionAsked) {
            console.log('📁 Screen recording permission previously configured, skipping dialog');
        }
    }
    
    async requestScreenRecordingPermission() {
        if (!this.screenRecordingEnabled) return;
        
        const userConfirmed = confirm(
            '🎬 画面録画機能を使用しますか？\n\n' +
            '「OK」を選択すると：\n' +
            '• ピアノ演奏を音付きでMP4録画できます\n' +
            '• iPhoneでも再生可能な形式で保存されます\n' +
            '• 録画時の権限確認をスキップできます\n' +
            '• この設定は記憶され、次回以降は聞かれません\n\n' +
            '「キャンセル」を選択すると：\n' +
            '• 録画機能は無効になります\n' +
            '• 後でチェックボックスから有効にできます\n' +
            '• この設定も記憶されます'
        );
        
        // Mark that permission has been asked
        this.screenRecordingPermissionAsked = true;
        
        if (userConfirmed) {
            try {
                console.log('🎬 Requesting screen recording permission...');
                
                // Request permission and keep the stream for later use
                this.screenRecordingStream = await navigator.mediaDevices.getDisplayMedia({
                    video: {
                        mediaSource: 'screen',
                        width: { ideal: 1920 },
                        height: { ideal: 1080 },
                        frameRate: { ideal: 30 }
                    },
                    audio: {
                        echoCancellation: false,
                        noiseSuppression: false,
                        sampleRate: 44100
                    }
                });
                
                console.log('✅ Screen recording permission granted');
                alert('✅ 画面録画の許可を取得しました！\n録画ボタンを押すとすぐに録画を開始できます。\n\n※この設定は記憶され、次回以降は自動で有効になります。');
                
                // Stop the stream for now - we'll create a new one when recording starts
                this.screenRecordingStream.getTracks().forEach(track => track.stop());
                this.screenRecordingStream = null;
                
                // Keep recording enabled
                this.screenRecordingEnabled = true;
                document.getElementById('screen-recording-enabled').checked = true;
                
            } catch (error) {
                console.log('❌ Screen recording permission denied:', error);
                this.screenRecordingEnabled = false;
                document.getElementById('screen-recording-enabled').checked = false;
                alert('❌ 画面録画の許可が拒否されました。\n録画機能を無効にしました。\n\n※この設定は記憶され、次回以降はダイアログは表示されません。');
            }
        } else {
            this.screenRecordingEnabled = false;
            document.getElementById('screen-recording-enabled').checked = false;
            console.log('👤 User declined screen recording permission');
            alert('📝 録画機能を無効にしました。\n後でチェックボックスから有効にできます。\n\n※この設定は記憶され、次回以降はダイアログは表示されません。');
        }
        
        // Save the settings after user decision
        this.saveSettings();
    }
    
    initSpectrumAnalyzer() {
        this.spectrumCanvas = document.getElementById('spectrum-canvas');
        if (!this.spectrumCanvas) {
            console.error('❌ Spectrum canvas not found');
            return;
        }
        
        this.spectrumContext = this.spectrumCanvas.getContext('2d');
        
        // Set canvas size
        this.resizeSpectrumCanvas();
        
        // Start spectrum animation
        this.startSpectrumAnimation();
        
        console.log('🌊 Waveform display initialized');
    }
    
    resizeSpectrumCanvas() {
        if (!this.spectrumCanvas || !this.container) return;
        
        const rect = this.container.getBoundingClientRect();
        this.spectrumCanvas.width = rect.width;
        this.spectrumCanvas.height = rect.height;
    }
    
    startSpectrumAnimation() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        
        const drawSpectrum = () => {
            if (this.settings.showSpectrumAnalyzer && this.analyserNode && this.spectrumContext) {
                this.drawWaveform();
            }
            this.animationFrameId = requestAnimationFrame(drawSpectrum);
        };
        
        drawSpectrum();
    }
    
    drawWaveform() {
        if (!this.analyserNode || !this.spectrumContext || !this.spectrumCanvas) return;
        
        const bufferLength = this.analyserNode.fftSize;
        const dataArray = new Uint8Array(bufferLength);
        this.analyserNode.getByteTimeDomainData(dataArray);
        
        const width = this.spectrumCanvas.width;
        const height = this.spectrumCanvas.height;
        
        // Clear canvas
        this.spectrumContext.clearRect(0, 0, width, height);
        
        // Create gradient for waveform
        const gradient = this.spectrumContext.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, '#ff6b6b');
        gradient.addColorStop(0.25, '#4ecdc4');
        gradient.addColorStop(0.5, '#45b7d1');
        gradient.addColorStop(0.75, '#96ceb4');
        gradient.addColorStop(1, '#feca57');
        
        // Set line style
        this.spectrumContext.lineWidth = 3;
        this.spectrumContext.strokeStyle = gradient;
        this.spectrumContext.shadowBlur = 15;
        this.spectrumContext.shadowColor = '#4ecdc4';
        
        // Begin drawing waveform
        this.spectrumContext.beginPath();
        
        const sliceWidth = width / bufferLength;
        let x = 0;
        
        for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0; // Convert to 0-2 range
            const y = v * height / 2; // Scale to canvas height
            
            if (i === 0) {
                this.spectrumContext.moveTo(x, y);
            } else {
                this.spectrumContext.lineTo(x, y);
            }
            
            x += sliceWidth;
        }
        
        this.spectrumContext.stroke();
        
        // Draw a second waveform with different opacity for depth
        this.spectrumContext.globalAlpha = 0.5;
        this.spectrumContext.lineWidth = 1;
        this.spectrumContext.shadowBlur = 8;
        this.spectrumContext.beginPath();
        
        x = 0;
        for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0;
            const y = height - (v * height / 2); // Inverted waveform
            
            if (i === 0) {
                this.spectrumContext.moveTo(x, y);
            } else {
                this.spectrumContext.lineTo(x, y);
            }
            
            x += sliceWidth;
        }
        
        this.spectrumContext.stroke();
        this.spectrumContext.globalAlpha = 1.0; // Reset alpha
    }
    
    setupSNSShareButtons() {
        const twitterBtn = document.querySelector('.twitter-btn');
        const facebookBtn = document.querySelector('.facebook-btn');
        const lineBtn = document.querySelector('.line-btn');
        const copyBtn = document.querySelector('.copy-btn');
        
        const shareData = {
            title: 'Piano Visualizer - Interactive 3D Piano with MIDI Support',
            text: '🎹 美しい3Dビジュアライゼーション付きピアノ演奏ツール！MIDIサポート、ColorHunt Retroパレット、Full HD録画機能搭載。',
            url: window.location.href
        };
        
        // Twitter share
        twitterBtn.addEventListener('click', () => {
            const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareData.text)}&url=${encodeURIComponent(shareData.url)}&hashtags=PianoVisualizer,MIDI,3D,音楽,ピアノ`;
            window.open(twitterUrl, '_blank', 'width=550,height=420');
        });
        
        // Facebook share
        facebookBtn.addEventListener('click', () => {
            const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareData.url)}`;
            window.open(facebookUrl, '_blank', 'width=580,height=296');
        });
        
        // LINE share
        lineBtn.addEventListener('click', () => {
            const lineUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareData.url)}&text=${encodeURIComponent(shareData.text)}`;
            window.open(lineUrl, '_blank', 'width=500,height=500');
        });
        
        // URL copy
        copyBtn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(shareData.url);
                
                // Visual feedback
                copyBtn.classList.add('copied');
                const originalSVG = copyBtn.innerHTML;
                copyBtn.innerHTML = `
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                `;
                
                setTimeout(() => {
                    copyBtn.classList.remove('copied');
                    copyBtn.innerHTML = originalSVG;
                }, 2000);
                
                console.log('✅ URL copied to clipboard');
            } catch (err) {
                console.error('❌ Failed to copy URL:', err);
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = shareData.url;
                document.body.appendChild(textArea);
                textArea.select();
                try {
                    document.execCommand('copy');
                    console.log('✅ URL copied using fallback method');
                } catch (fallbackErr) {
                    console.error('❌ Fallback copy also failed:', fallbackErr);
                    alert('URLのコピーに失敗しました。手動でコピーしてください：\n' + shareData.url);
                }
                document.body.removeChild(textArea);
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const visualizer = new PianoVisualizer();
    
    // Setup SNS share buttons
    visualizer.setupSNSShareButtons();
});