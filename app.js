class PianoVisualizer {
    constructor() {
        this.container = document.getElementById('three-container');
        this.pianoKeyboard = document.getElementById('pk');
        
        // Three.js setup
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.noteObjects = [];
        this.activeNoteSprites = new Map(); // Track active note sprites by MIDI note
        this.audioContext = null;
        this.midiAccess = null;
        this.backgroundPlane = null;
        this.audioDestination = null;
        
        // Piano key visual state tracking
        this.activeKeys = new Set(); // Track which keys are currently pressed
        
        // Performance optimization: DOM element caching and batch updates
        this.pianoKeyElements = new Map(); // Cache piano key elements by MIDI note
        this.pendingVisualUpdates = new Set(); // Track keys that need visual updates
        this.renderScheduled = false; // Flag to prevent multiple render scheduling
        
        // Performance optimization: Canvas and texture caching
        this.canvasPool = []; // Reusable canvas pool
        this.textureCache = new Map(); // Cache for text textures
        this.spritePool = []; // Reusable sprite pool
        this.maxPoolSize = 20; // Maximum cached objects
        this.lastNoteTime = 0; // Track last note activity for performance
        
        this.settings = {
            pianoRange: '3-octave',
            volume: 0.75,
            isMuted: false,
            colorScale: 'chromatic', // Will be overridden in initializeRetroColors()
            showVelocityNumbers: true,
            showSpectrumAnalyzer: false,
            displayMode: 'waveform',
            audioTimbre: 'acoustic-piano',
            noteNameStyle: 'japanese',
            customBaseColor: '#ffffff'
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
        
        this.midiData = null;
        this.midiPlayer = null;
        this.isPlaying = false;
        this.currentTime = 0;
        this.totalTime = 0;
        this.playbackRate = 1.0;
        this.animationFrameId = null;
        this.clock = null;
        
        
        
        // Check for mobile device and show warning if needed
        this.checkMobileDevice();
        
        this.init();
    }
    
    checkMobileDevice() {
        const deviceInfo = this.detectDeviceType();
        
        // Show warning for phones only (not tablets)
        if (deviceInfo.isMobile && !deviceInfo.isTablet) {
            this.showMobileWarning();
        }
    }
    
    detectDeviceType() {
        const userAgent = navigator.userAgent;
        const hasTouchPoints = navigator.maxTouchPoints > 0;
        const screenWidth = window.screen.width;
        
        // Check for mobile devices via user agent
        const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
        
        // Check for tablet devices
        const isTabletUA = /iPad|Android(?!.*Mobile)/i.test(userAgent);
        const isTabletSize = hasTouchPoints && screenWidth > 768 && screenWidth <= 1024;
        
        // Check for mobile via touch and screen size
        const isMobileSize = (hasTouchPoints && window.matchMedia("(max-width: 768px)").matches) || screenWidth <= 768;
        
        return {
            isMobile: isMobileUA || isMobileSize,
            isTablet: isTabletUA || isTabletSize
        };
    }
    
    showMobileWarning() {
        const warningElement = document.getElementById('mw');
        const continueBtn = document.getElementById('mcb');
        
        if (warningElement && continueBtn) {
            // Show the warning screen
            warningElement.style.display = 'flex';
            document.body.classList.add('mws');
            
            // Set up continue button event
            continueBtn.addEventListener('click', () => {
                warningElement.style.display = 'none';
                document.body.classList.remove('mws');
                
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
        // Initialize DOM cache first
        this.initializeDOM();
        
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
        this.setupWaveformDisplay();
        
        // Initialize with random retro palette after DOM is ready
        this.initializeRetroColors();
        
        this.startVisualization();
        
        window.addEventListener('resize', () => this.onWindowResize());
    }
    
    initializeDOM() {
        // DOM要素キャッシュを初期化（高頻度使用要素のみ）
        this.domCache = {
            // 再生制御系（高頻度使用）
            playMidi: document.getElementById('play-midi'),
            pauseMidi: document.getElementById('pause-midi'),
            stopMidi: document.getElementById('stop-midi'),
            
            // 進捗表示系（高頻度使用）
            progressFill: document.getElementById('progress-fill'),
            
            // 情報表示系（高頻度使用）
            midiInfo: document.getElementById('midi-info'),
            
            // 設定系（高頻度使用）
            midiInputSelect: document.getElementById('midi-input-select'),
            pianoRange: document.getElementById('piano-range')
        };
        
        // キャッシュが正常に初期化されたかチェック
        const missingElements = [];
        for (const [key, element] of Object.entries(this.domCache)) {
            if (!element) {
                missingElements.push(key);
            }
        }
        
        if (missingElements.length > 0) {
            console.warn('DOM要素キャッシュ初期化で一部の要素が見つかりません:', missingElements);
        }
    }
    
    initThreeJS() {
        // Check if THREE is available
        if (typeof THREE === 'undefined') {
            return;
        }
        
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        
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
                preserveDrawingBuffer: true
            });
            this.renderer.setSize(width, height);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            
            this.container.appendChild(this.renderer.domElement);
        } catch (error) {
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
            // Create AudioContext with optimized settings
            const audioContextOptions = {
                latencyHint: 'playback',
                sampleRate: 48000
            };
            // Add buffer size optimization if supported
            if ('AudioWorkletNode' in window) {
                audioContextOptions.bufferSize = 256; // Smaller buffer for lower latency
            }
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)(audioContextOptions);
            this.audioContextResumed = false;
            
            // Create audio destination
            this.audioDestination = this.audioContext.createMediaStreamDestination();
            
            // Create analyzer node for spectrum visualization
            this.analyserNode = this.audioContext.createAnalyser();
            this.analyserNode.fftSize = 512;
            this.analyserNode.smoothingTimeConstant = 0.8;
            
            // Create master gain node for stable analyzer connection
            this.masterGainNode = this.audioContext.createGain();
            this.masterGainNode.gain.value = 1.0;
            
            // Connect master gain to analyzer and destination (permanent connection)
            this.masterGainNode.connect(this.analyserNode);
            this.masterGainNode.connect(this.audioContext.destination);
            
            
            // Add user interaction listener to resume AudioContext
            this.setupAudioContextResume();
            
        } catch (error) {
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
                    
                    // Hide notice
                    const notice = document.getElementById('audio-context-notice');
                    if (notice) {
                        notice.style.display = 'none';
                    }
                } catch (error) {
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
                this.domCache.pianoRange.value = '88-key';
                this.createPianoKeyboard();
            }
            
            this.midiAccess.onstatechange = (event) => {
                const port = event.port;
                if (port.type === 'input') {
                    if (port.state === 'connected') {
                        
                        if (!this.hasMidiInput) {
                            this.hasMidiInput = true;
                            // Auto-enable 88-key mode
                            this.settings.pianoRange = '88-key';
                            this.domCache.pianoRange.value = '88-key';
                            this.createPianoKeyboard();
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
            
        } catch (error) {
        }
    }
    
    handleMIDIMessage(message) {
        const [command, note, velocity] = message.data;
        const timestamp = message.timeStamp || performance.now();
        
        // Check if MIDI input is selected (not computer keyboard)
        if (this.selectedInputDevice === 'keyboard') {
            // コンピューターキーボード選択時もペダル操作は処理する
            if (type === 'controlchange' && note === 64) {
                this.handleSustainPedal(velocity >= 64);
            }
            return; // ペダル以外のMIDI入力は無視
        }
        
        // Check if message is from selected device (only if we have multiple devices)
        if (this.midiInputs.size > 1) {
            const selectedInput = this.getSelectedMidiInput();
            if (!selectedInput) {
                return; // No valid MIDI device selected
            }
        } else {
        }
        
        // Log MIDI activity
        this.logMidiActivity(`CMD:${command} Note:${note} Vel:${velocity}`);
        
        // Handle with minimal latency using optimized dispatch
        const isNoteOn = command === 144 && velocity > 0;
        const isNoteOff = command === 128 || (command === 144 && velocity === 0);
        const isControlChange = (command & 0xF0) === 0xB0;
        const isProgramChange = (command & 0xF0) === 0xC0;
        
        if (isNoteOn) {
            // Note On
            const noteName = this.midiNoteToNoteName(note, velocity);
            this.logMidiActivity(`▶ ${noteName} (${note}) vel:${velocity}`);
            this.playNote(note, velocity, timestamp);
        } else if (isNoteOff) {
            // Note Off
            const noteName = this.midiNoteToNoteName(note);
            this.logMidiActivity(`⏹ ${noteName} (${note})`);
            this.stopNote(note, timestamp);
        } else if (isControlChange) {
            // Control Change
            this.logMidiActivity(`CC:${note} Val:${velocity}`);
            
            // Handle sustain pedal (CC 64)
            if (note === 64) {
                this.handleSustainPedal(velocity >= 64);
            }
        } else if (isProgramChange) {
            // Program Change
            this.logMidiActivity(`PC:${note}`);
        } else {
            // Other MIDI messages
            this.logMidiActivity(`Other: ${command}:${note}:${velocity}`);
        }
    }
    
    createPianoKeyboard() {
        // Clear existing keys and cache
        this.pianoKeyboard.innerHTML = '';
        this.pianoKeyElements.clear();
        this.pendingVisualUpdates.clear();
        
        const config = this.pianoConfigs[this.settings.pianoRange];
        const startNote = config.startNote;
        const endNote = config.endNote;
        
        // Calculate key size based on range
        const totalKeys = endNote - startNote + 1;
        const whiteKeyCount = this.countWhiteKeys(startNote, endNote);
        const containerWidth = this.pianoKeyboard.parentElement.clientWidth - 40; // Account for padding
        const is88KeyMode = this.settings.pianoRange === '88-key';
        
        const keyWidth = is88KeyMode 
            ? Math.max(8, containerWidth / 52) // 52 white keys in 88-key piano
            : Math.max(20, Math.min(40, containerWidth / whiteKeyCount));
        
        for (let midiNote = startNote; midiNote <= endNote; midiNote++) {
            const noteIndex = midiNote % 12;
            const key = this.keyLayout[noteIndex];
            const noteName = key.note;
            
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
                // ペダルが押されていない場合のみ視覚的にキーを離す
                if (!this.sustainPedalPressed) {
                    keyElement.classList.remove('pressed');
                }
            });
            
            keyElement.addEventListener('mouseleave', () => {
                this.stopNote(midiNote);
                // ペダルが押されていない場合のみ視覚的にキーを離す
                if (!this.sustainPedalPressed) {
                    keyElement.classList.remove('pressed');
                }
            });
            
            this.pianoKeyboard.appendChild(keyElement);
            
            // Cache the DOM element for performance
            this.pianoKeyElements.set(midiNote, keyElement);
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
    
    
    playNote(midiNote, velocity, timestamp = performance.now(), enableVisualization = true) {
        const frequency = this.midiNoteToFrequency(midiNote);
        const noteName = this.midiNoteToNoteName(midiNote, velocity);
        
        this.synthesizeNote(frequency, velocity, midiNote, enableVisualization);
        this.visualizeNoteThreeJS(noteName, midiNote, velocity, timestamp);
        
        // Update piano key visual state
        this.activeKeys.add(midiNote);
        this.scheduleKeyVisualUpdate(midiNote);
        
    }
    
    stopNote(midiNote, timestamp = performance.now(), enableVisualization = true) {
        // Mark visual note as inactive
        if (this.activeNoteSprites.has(midiNote)) {
            const sprite = this.activeNoteSprites.get(midiNote);
            if (sprite.userData) {
                sprite.userData.isActive = false;
                sprite.userData.movementPhase = 'falling';
                sprite.userData.noteOffTime = timestamp;
            }
            this.activeNoteSprites.delete(midiNote);
        }
        
        // Update piano key visual state immediately (before pedal check)
        this.activeKeys.delete(midiNote);
        this.scheduleKeyVisualUpdate(midiNote);
        
        // If sustain pedal is pressed, don't stop the audio immediately
        if (this.sustainPedalPressed) {
            this.sustainedNotes.add(midiNote);
            // Update visual state to show sustained note if needed
            this.scheduleKeyVisualUpdate();
            return;
        }
        
        // Stop the note immediately
        this.stopSustainedNote(midiNote);
        
    }
    
    
    // Schedule a visual update for batching (supports single note or all keys)
    scheduleKeyVisualUpdate(midiNote = null) {
        if (midiNote !== null) {
            this.pendingVisualUpdates.add(midiNote);
        } else {
            // Schedule all keys for visual update
            this.pianoKeyElements.forEach((_, note) => {
                this.pendingVisualUpdates.add(note);
            });
        }
        this.scheduleRender();
    }
    
    // Schedule a render using requestAnimationFrame for optimal performance
    scheduleRender() {
        if (this.renderScheduled) return;
        this.renderScheduled = true;
        requestAnimationFrame(() => {
            this.renderBatchedUpdates();
            this.renderScheduled = false;
        });
    }
    
    // Apply all pending visual updates in a single batch
    renderBatchedUpdates() {
        this.pendingVisualUpdates.forEach(midiNote => {
            const keyElement = this.pianoKeyElements.get(midiNote);
            if (keyElement) {
                const isActive = this.activeKeys.has(midiNote);
                const isSustained = this.sustainedNotes.has(midiNote);
                const shouldBePressed = isActive || (isSustained && this.sustainPedalPressed);
                
                keyElement.classList.toggle('pressed', shouldBePressed);
            }
        });
        this.pendingVisualUpdates.clear();
    }
    
    
    midiNoteToFrequency(midiNote) {
        return 440 * Math.pow(2, (midiNote - 69) / 12);
    }
    
    midiNoteToNoteName(midiNote, velocity = null) {
        const noteIndex = midiNote % 12;
        const noteNamesArray = this.noteNames[this.settings.noteNameStyle];
        
        let noteName = noteNamesArray[noteIndex];
        
        // Add velocity number if enabled and velocity is provided
        if (this.settings.showVelocityNumbers && velocity !== null) {
            noteName += `(${velocity})`;
        }
        
        return noteName;
    }
    
    handleSustainPedal(isPressed) {
        this.sustainPedalPressed = isPressed;
        
        // UIのペダル状態を更新
        this.updatePedalStatusDisplay(isPressed);
        
        if (isPressed) {
            this.logMidiActivity('🦶 Sustain ON');
        } else {
            this.logMidiActivity('🦶 Sustain OFF');
            
            // Stop all sustained notes
            this.sustainedNotes.forEach(midiNote => {
                this.stopSustainedNote(midiNote);
            });
            this.sustainedNotes.clear();
            
            // ペダルが離されたときに全ての鍵盤の視覚的状態を更新
            this.scheduleKeyVisualUpdate();
        }
    }
    
    updatePedalStatusDisplay(isPressed) {
        const sustainStatus = document.getElementById('sustain-status');
        const sustainPedal = document.getElementById('sustain-pedal');
        
        if (sustainStatus) {
            sustainStatus.textContent = isPressed ? 'ON' : 'OFF';
        }
        
        if (sustainPedal) {
            if (isPressed) {
                sustainPedal.classList.add('active');
            } else {
                sustainPedal.classList.remove('active');
            }
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
        
        // Update key state
        this.activeKeys.delete(midiNote);
        this.scheduleKeyVisualUpdate(midiNote);
    }
    
    
    
    synthesizeNote(frequency, velocity, midiNote = null, enableVisualization = true) {
        if (!this.audioContext) {
            return;
        }
        
        // Check AudioContext state
        if (this.audioContext.state === 'suspended') {
            return;
        }
        
        // Check if audio is muted
        if (this.settings.isMuted) {
            return;
        }
        
        
        // Apply both velocity and global volume settings
        const velocityVolume = (velocity / 127) * 0.3;
        const finalVolume = velocityVolume * this.settings.volume;
        
        // Create audio nodes based on selected timbre
        const timbre = this.settings.audioTimbre;
        const audioNodes = this.createTimbreNodes(frequency, finalVolume, timbre, midiNote, enableVisualization);
        
    }
    
    createTimbreNodes(frequency, volume, timbre, midiNote = null, enableVisualization = true) {
        // Use immediate audio context time for minimal latency
        const currentTime = this.audioContext.currentTime;
        const startTime = currentTime + 0.001; // Minimal 1ms delay to prevent click/pop
        const duration = this.getTimbreDuration(timbre);
        
        // Adjust duration for sustain pedal
        const actualDuration = this.sustainPedalPressed ? duration * 2 : duration;
        
        // Use unified timbre creation system
        const gainNode = this.createUnifiedTimbre(frequency, volume, startTime, actualDuration, timbre, enableVisualization);
        
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
    
    // Helper function to connect audio nodes
    connectAudioOutput(node, enableVisualization = true) {
        // Connect to master gain node (includes analyzer) or direct connection
        const target = enableVisualization && this.masterGainNode ? this.masterGainNode : this.audioContext.destination;
        node.connect(target);
    }
    
    // Helper function to convert hex color to rgba
    hexToRgba(hex, alpha = 1) {
        const h = hex.replace('#', '');
        if (h.length === 6) {
            const r = parseInt(h.substr(0, 2), 16);
            const g = parseInt(h.substr(2, 2), 16);
            const b = parseInt(h.substr(4, 2), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }
        return `rgba(255, 255, 255, ${alpha})`;
    }
    
    // Helper function to convert hex to normalized RGB values
    hexToRgbNormalized(hex) {
        const h = hex.replace('#', '');
        if (h.length === 6) {
            return {
                r: parseInt(h.substr(0, 2), 16) / 255,
                g: parseInt(h.substr(2, 2), 16) / 255,
                b: parseInt(h.substr(4, 2), 16) / 255
            };
        }
        return { r: 1, g: 1, b: 1 };
    }
    
    // Helper function to set canvas size with scaling
    setCanvasSize(canvas, size = 1.0) {
        const scaleFactor = Math.max(1.0, size * 1.5);
        canvas.width = Math.min(1024, 768 * scaleFactor);
        canvas.height = Math.min(768, 576 * scaleFactor);
    }
    
    // Helper function to calculate velocity factor
    getVelocityFactor(velocity) {
        return Math.max(0.6, velocity / 127);
    }
    
    // Canvas pool management for performance
    getCanvasFromPool(size = 1.0) {
        if (this.canvasPool.length > 0) {
            const canvas = this.canvasPool.pop();
            // Dynamically adjust canvas size based on expected text size
            this.setCanvasSize(canvas, size);
            return canvas;
        }
        
        // Create new canvas if pool is empty
        const canvas = document.createElement('canvas');
        this.setCanvasSize(canvas, size);
        return canvas;
    }
    
    returnCanvasToPool(canvas) {
        if (this.canvasPool.length < this.maxPoolSize) {
            // Clear canvas and return to pool
            const context = canvas.getContext('2d');
            context.clearRect(0, 0, canvas.width, canvas.height);
            this.canvasPool.push(canvas);
        }
    }
    
    // Sprite pool management for performance
    getSpriteFromPool() {
        if (this.spritePool.length > 0) {
            const sprite = this.spritePool.pop();
            sprite.visible = true;
            return sprite;
        }
        return null; // Will create new sprite if none available
    }
    
    returnSpriteToPool(sprite) {
        if (this.spritePool.length < this.maxPoolSize) {
            sprite.visible = false;
            sprite.material.map = null; // Clear texture reference
            sprite.position.set(0, 0, 0);
            sprite.scale.set(1, 1, 1);
            this.spritePool.push(sprite);
        }
    }
    // Optimized text rendering method
    renderTextToCanvas(canvas, context, noteName, midiNote, velocity, color, size) {
        
        const glowIntensity = 1.0;
        const fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
        
        // Prepare note name components
        const noteIndex = midiNote % 12;
        const noteNamesArray = this.noteNames[this.settings.noteNameStyle];
        
        let mainText = noteNamesArray[noteIndex];
        
        // Convert hex to rgba for canvas
        const textColor = this.hexToRgba(color || '#ffffff', 1);
        
        context.fillStyle = textColor;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        
        // Optimized font size calculations with safety limits to prevent cutoff
        const maxMainFont = Math.min(canvas.height * 0.35, !this.hasMidiInput ? 127 * size : 184 * size);
        const maxVelocityFont = Math.min(canvas.height * 0.2, !this.hasMidiInput ? 69 * size : 115 * size);
        const mainFontSize = maxMainFont; // Apply canvas-relative size limit
        const velocityFontSize = maxVelocityFont; // Apply canvas-relative size limit
        const lineHeight = 1.4;
        const canvasCenter = canvas.height / 2;
        
        let mainTextY = canvasCenter;
        if (this.settings.showVelocityNumbers && velocity !== null) {
            const totalHeight = mainFontSize + (velocityFontSize * lineHeight);
            // Ensure main text stays within canvas bounds
            const topMargin = Math.max(mainFontSize * 0.6, 20);
            mainTextY = Math.max(topMargin, canvasCenter - (totalHeight / 4));
        }
        
        // Draw main note name with optimized rendering
        context.font = `bold ${mainFontSize}px ${fontFamily}`;
        
        // Simplified glow effect for better performance
        if (glowIntensity > 0) {
            context.shadowColor = textColor.replace(', 1)', ', ' + (glowIntensity * 0.8) + ')');
            context.shadowBlur = 15 * glowIntensity;
            context.shadowOffsetX = 0;
            context.shadowOffsetY = 0;
        }
        
        // Single optimized text draw
        context.fillText(mainText, canvas.width / 2, mainTextY);
        
        // Draw velocity number if enabled
        if (this.settings.showVelocityNumbers && velocity !== null) {
            const velocityTextY = mainTextY + (mainFontSize * lineHeight * 0.7);
            // Ensure velocity text stays within canvas bounds
            const bottomMargin = Math.max(velocityFontSize * 0.6, 15);
            const finalVelocityY = Math.min(canvas.height - bottomMargin, velocityTextY);
            context.font = `bold ${velocityFontSize}px ${fontFamily}`;
            context.shadowBlur = 10 * glowIntensity;
            context.fillText(`${velocity}`, canvas.width / 2, finalVelocityY);
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
    
    // Unified timbre configuration
    getTimbreConfig(timbre) {
        const configs = {
            'acoustic-piano': {
                oscillators: [
                    { type: 'sine', frequency: 1, gain: 0.6 },
                    { type: 'sine', frequency: 2, gain: 0.3 },
                    { type: 'sine', frequency: 3, gain: 0.1 }
                ],
                filter: { type: 'lowpass', frequency: 2000, Q: 1 },
                envelope: { attack: 0.05, decay: null, sustain: null, release: true }
            },
            'electric-piano': {
                oscillators: [
                    { type: 'sine', frequency: 1, gain: 0.7 },
                    { type: 'triangle', frequency: 2, gain: 0.3 }
                ],
                filter: { type: 'bandpass', frequency: 1500, Q: 5 },
                envelope: { attack: 0.02, decay: null, sustain: null, release: true }
            },
            'harpsichord': {
                oscillators: [{ type: 'sawtooth', frequency: 1, gain: 1.0 }],
                filter: { type: 'highpass', frequency: 800, Q: 2 },
                envelope: { attack: 0, decay: null, sustain: null, release: true }
            },
            'organ': {
                oscillators: [
                    { type: 'sine', frequency: 1, gain: 0.5 },
                    { type: 'sine', frequency: 2, gain: 0.3 },
                    { type: 'sine', frequency: 4, gain: 0.2 }
                ],
                filter: { type: 'lowpass', frequency: 3000, Q: 1 },
                envelope: { attack: 0.1, decay: null, sustain: true, release: 0.1 }
            },
            'strings': {
                oscillators: [
                    { type: 'sawtooth', frequency: 1, gain: 0.6 },
                    { type: 'sawtooth', frequency: 2, gain: 0.4 }
                ],
                filter: { type: 'lowpass', frequency: 1200, Q: 3 },
                envelope: { attack: 0.3, decay: null, sustain: null, release: true }
            },
            'vibraphone': {
                oscillators: [
                    { type: 'sine', frequency: 1, gain: 0.7 },
                    { type: 'sine', frequency: 3.14, gain: 0.3 }
                ],
                filter: { type: 'lowpass', frequency: 2500, Q: 2 },
                envelope: { attack: 0.02, decay: null, sustain: null, release: true }
            },
            'music-box': {
                oscillators: [{ type: 'sine', frequency: 1, gain: 1.0 }],
                filter: { type: 'lowpass', frequency: 1500, Q: 3 },
                envelope: { attack: 0.01, decay: null, sustain: null, release: true }
            },
            'synthesizer': {
                oscillators: [
                    { type: 'square', frequency: 1, gain: 0.6 },
                    { type: 'sawtooth', frequency: 1.5, gain: 0.4 }
                ],
                filter: { type: 'lowpass', frequency: 1800, Q: 4 },
                envelope: { attack: 0.1, decay: null, sustain: null, release: true }
            },
            'bell': {
                oscillators: [
                    { type: 'sine', frequency: 1, gain: 0.5 },
                    { type: 'sine', frequency: 2.76, gain: 0.3 },
                    { type: 'sine', frequency: 5.12, gain: 0.2 }
                ],
                filter: { type: 'lowpass', frequency: 4000, Q: 1 },
                envelope: { attack: 0.01, decay: null, sustain: null, release: true }
            },
            'flute': {
                oscillators: [
                    { type: 'sine', frequency: 1, gain: 0.8 },
                    { type: 'sine', frequency: 2, gain: 0.2 }
                ],
                filter: { type: 'lowpass', frequency: 2200, Q: 2 },
                envelope: { attack: 0.1, decay: null, sustain: true, release: 0.2 }
            }
        };
        return configs[timbre] || configs['acoustic-piano'];
    }
    
    // Unified timbre creation function
    createUnifiedTimbre(frequency, volume, currentTime, duration, timbre, enableVisualization = true) {
        const config = this.getTimbreConfig(timbre);
        const oscillators = [];
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        // Create oscillators
        config.oscillators.forEach(oscConfig => {
            const osc = this.audioContext.createOscillator();
            const oscGain = this.audioContext.createGain();
            
            osc.type = oscConfig.type;
            osc.frequency.setValueAtTime(frequency * oscConfig.frequency, currentTime);
            oscGain.gain.setValueAtTime(volume * oscConfig.gain, currentTime);
            
            osc.connect(oscGain);
            oscGain.connect(gainNode);
            oscillators.push(osc);
        });
        
        // Configure filter
        filter.type = config.filter.type;
        filter.frequency.setValueAtTime(config.filter.frequency, currentTime);
        filter.Q.setValueAtTime(config.filter.Q, currentTime);
        
        // Configure envelope
        gainNode.gain.setValueAtTime(0, currentTime);
        if (config.envelope.attack > 0) {
            gainNode.gain.linearRampToValueAtTime(volume, currentTime + config.envelope.attack);
        } else {
            gainNode.gain.setValueAtTime(volume, currentTime);
        }
        
        if (config.envelope.sustain) {
            if (config.envelope.release) {
                gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + duration - config.envelope.release);
            }
        } else {
            gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + duration);
        }
        
        // Connect audio chain
        gainNode.connect(filter);
        this.connectAudioOutput(filter, enableVisualization);
        
        // Start and stop oscillators
        oscillators.forEach(osc => {
            osc.start(currentTime);
            osc.stop(currentTime + duration);
        });
        
        return gainNode;
    }

    
    visualizeNoteThreeJS(noteName, midiNote, velocity, timestamp) {
        // Fallback to DOM if THREE.js not available
        if (!this.scene || typeof THREE === 'undefined') {
            this.visualizeNoteFallback(noteName, midiNote, velocity);
            return;
        }
        
        // Update last note time for performance optimization
        this.lastNoteTime = performance.now();
        
        const color = this.getNoteColor(midiNote, velocity);
        const size = this.getNoteSizeMultiplier(velocity);
        
        // Check cache first for performance optimization (temporarily disabled for debugging)
        const cacheKey = `${noteName}-${velocity}-${this.settings.showVelocityNumbers}-${this.settings.noteNameStyle}-${color}`;
        let texture = null; // Temporarily disable cache to fix display issue
        // let texture = this.textureCache.get(cacheKey);
        
        if (!texture) {
            // Create dedicated canvas for this texture with dynamic sizing
            const canvas = this.getCanvasFromPool(size);
            const context = canvas.getContext('2d');
        
            // Render text to canvas
            this.renderTextToCanvas(canvas, context, noteName, midiNote, velocity, color, size);
            
            // Create texture and cache it
            texture = new THREE.CanvasTexture(canvas);
            texture.needsUpdate = true;
            
            // Cache texture for reuse (limit cache size)
            if (this.textureCache.size < 50) {
                this.textureCache.set(cacheKey, texture);
            }
        }
        
        // Try to get sprite from pool, otherwise create new
        let sprite = this.getSpriteFromPool();
        if (!sprite) {
            const spriteMaterial = new THREE.SpriteMaterial({ 
                map: texture, 
                transparent: true,
                alphaTest: 0.1
            });
            sprite = new THREE.Sprite(spriteMaterial);
        } else {
            // Reuse sprite material but update texture
            sprite.material.map = texture;
            sprite.material.needsUpdate = true;
        }
        
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
        const displaySize = size * 3;
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
        
        // Limit maximum note objects for performance (high-speed playing)
        if (this.noteObjects.length > 100) {
            const oldestSprite = this.noteObjects.shift();
            this.scene.remove(oldestSprite);
            this.returnSpriteToPool(oldestSprite);
        }
        
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
        
        // Debug: Log sprite creation and positioning (disabled for performance)
        
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
        
        const velocityFactor = this.getVelocityFactor(velocity);
        
        return {
            r: Math.min(1.0, baseColor.r * velocityFactor),
            g: Math.min(1.0, baseColor.g * velocityFactor),
            b: Math.min(1.0, baseColor.b * velocityFactor)
        };
    }
    
    getNoteSizeMultiplier(velocity) {
        const baseSize = 1.0;
        const velocityEffect = (velocity / 127) * 2.2;
        // Cap maximum size to prevent font cutoff at high velocities
        return Math.max(0.3, Math.min(3.0, baseSize + velocityEffect));
    }
    
    getNoteSizeClass(velocity) {
        const scaledVelocity = velocity;
        if (scaledVelocity > 100) return 'large';
        if (scaledVelocity > 60) return 'medium';
        return 'small';
    }
    
    getNoteFontSize(velocity) {
        const baseSize = 20;
        if (!this.hasMidiInput) {
            // When no MIDI device is connected, use font size for velocity 60 (PC keyboard)
            const defaultSize = baseSize + (60 / 127) * 30;
            return Math.max(defaultSize, 16);
        }
        const scaledSize = baseSize + (velocity / 127) * 30;
        return Math.max(scaledSize, 16);
    }
    
    resolvePalette(colorScale) {
        let palette = this.colorPalettes[colorScale];
        
        // If custom scale is selected and palette is empty, generate custom colors
        if (colorScale === 'custom' && (!palette || palette.length === 0)) {
            this.updateCustomColors();
            palette = this.colorPalettes.custom;
        }
        
        // Fallback to chromatic palette if current palette is undefined
        return palette || this.colorPalettes.chromatic || ['#ff0000', '#ff8000', '#ffff00', '#80ff00', '#00ff00', '#00ff80', '#00ffff', '#0080ff', '#0000ff', '#8000ff', '#ff00ff', '#ff0080'];
    }
    
    getNoteColor(midiNote, velocity) {
        // Early return for retro palettes
        if (this.settings.colorScale.startsWith('retro-')) {
            return this.getRandomRetroColor();
        }
        
        const noteIndex = midiNote % 12;
        const scale = this.scales[this.settings.colorScale] || this.scales.chromatic;
        const palette = this.resolvePalette(this.settings.colorScale);
        
        // Find note position in scale
        const scalePosition = scale.indexOf(noteIndex) !== -1 
            ? scale.indexOf(noteIndex)
            : this.findClosestNoteInScale(noteIndex, scale);
        
        const baseColor = palette[scalePosition] || '#ffffff';
        
        // Parse hex color using helper function
        const hex = baseColor.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        // Apply velocity and intensity
        const velocityFactor = this.getVelocityFactor(velocity);
        const finalR = Math.round(r * velocityFactor);
        const finalG = Math.round(g * velocityFactor);
        const finalB = Math.round(b * velocityFactor);
        const alpha = 0.8 + (velocity / 127) * 0.2;
        
        return `rgba(${finalR}, ${finalG}, ${finalB}, ${alpha})`;
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
        
        
        // Piano range selector
        const rangeSelector = this.domCache.pianoRange;
        rangeSelector.addEventListener('change', (e) => {
            this.settings.pianoRange = e.target.value;
            this.createPianoKeyboard();
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
            } else {
            }
        });
        
        // Velocity numbers toggle
        const velocityToggle = document.getElementById('show-velocity-numbers');
        velocityToggle.addEventListener('change', (e) => {
            this.settings.showVelocityNumbers = e.target.checked;
        });
        
        // Display mode selector (waveform/spectrum/none)
        const displayModeSelector = document.getElementById('display-mode');
        if (displayModeSelector) {
            displayModeSelector.addEventListener('change', (e) => {
                this.settings.displayMode = e.target.value;
                
                // Handle display mode changes
                if (this.spectrumCanvas) {
                    const displayModeConfigs = {
                        'waveform': { display: 'block', showAnalyzer: false },
                        'spectrum': { display: 'block', showAnalyzer: true },
                        'none': { display: 'none', showAnalyzer: false }
                    };
                    
                    const config = displayModeConfigs[e.target.value];
                    if (config) {
                        this.spectrumCanvas.style.display = config.display;
                        this.settings.showSpectrumAnalyzer = config.showAnalyzer;
                    }
                }
                
                // Clear canvases when mode changes
                if (e.target.value === 'none' || e.target.value === 'waveform') {
                    // Clear spectrum overlay canvas
                    if (this.spectrumContext && this.spectrumCanvas) {
                        this.spectrumContext.clearRect(0, 0, this.spectrumCanvas.width, this.spectrumCanvas.height);
                    }
                    
                    // Clear background waveform and redraw clean gradient when switching to none
                    if (e.target.value === 'none' && this.backgroundContext && this.backgroundCanvas) {
                        const ctx = this.backgroundContext;
                        const canvas = this.backgroundCanvas;
                        
                        // Clear canvas
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        
                        // Draw clean gradient background without waveform
                        const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
                        gradient.addColorStop(0, 'rgba(102, 126, 234, 0.2)');
                        gradient.addColorStop(0.5, 'rgba(118, 75, 162, 0.15)');
                        gradient.addColorStop(1, 'rgba(15, 15, 35, 0.1)');
                        
                        ctx.fillStyle = gradient;
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                        
                        // Force background texture update
                        if (this.backgroundPlane && this.backgroundPlane.material.map) {
                            this.backgroundPlane.material.map.needsUpdate = true;
                            this.backgroundPlane.material.needsUpdate = true;
                            
                            // Force renderer to update
                            if (this.renderer) {
                                this.renderer.resetState();
                            }
                        }
                    }
                }
            });
        }
        
        // Audio timbre selector
        const timbreSelector = document.getElementById('audio-timbre');
        timbreSelector.addEventListener('change', (e) => {
            this.settings.audioTimbre = e.target.value;
        });
        
        // Note name style selector
        const noteNameStyleSelector = document.getElementById('note-name-style');
        noteNameStyleSelector.addEventListener('change', (e) => {
            this.settings.noteNameStyle = e.target.value;
            this.updateKeyboardHelp();
        });
        
        // Base color picker
        const baseColorPicker = document.getElementById('base-color-picker');
        baseColorPicker.addEventListener('change', (e) => {
            this.settings.customBaseColor = e.target.value;
            if (this.settings.colorScale === 'custom') {
                this.updateCustomColors();
            }
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
                colorCodeInput.style.borderColor = '';
            } else {
                colorCodeInput.style.borderColor = '#ff4444';
            }
        });
        
        colorCodeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                applyColorButton.click();
            }
        });
        
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
            } else {
                // ファイルが選択されていない場合は再生位置コントロールを非表示
                this.midiData = null;
                this.hidePlaybackControls();
                this.domCache.playMidi.disabled = true;
                this.domCache.midiInfo.textContent = '';
            }
        });
        
        playBtn.addEventListener('click', () => this.playMidi());
        pauseBtn.addEventListener('click', () => this.pauseMidi());
        stopBtn.addEventListener('click', () => this.stopMidi());
        
        tempoSlider.addEventListener('input', (e) => {
            const percentage = parseInt(e.target.value);
            this.playbackRate = percentage / 100.0;
            tempoValue.textContent = `${percentage}%`;
        });
        // 再生位置コントロールのセットアップ
        this.setupPlaybackControls();
    }
    setupPlaybackControls() {
        const progressBar = document.getElementById('seekable-progress');
        const progressHandle = document.getElementById('progress-handle');
        let isDragging = false;
        let dragStartX = 0;
        let dragStartProgress = 0;
        // マウスダウンイベント（シーク開始）
        const startSeek = (e) => {
            if (!this.midiData) return;
            
            isDragging = true;
            const rect = progressBar.getBoundingClientRect();
            const x = (e.clientX || e.touches?.[0].clientX) - rect.left;
            dragStartX = x;
            dragStartProgress = (x / rect.width) * 100;
            
            progressBar.style.cursor = 'grabbing';
            e.preventDefault();
        };
        // マウス移動イベント（シーク中）
        const seekTo = (e) => {
            if (!isDragging || !this.midiData) return;
            
            const rect = progressBar.getBoundingClientRect();
            const x = (e.clientX || e.touches?.[0].clientX) - rect.left;
            const progress = Math.max(0, Math.min(100, (x / rect.width) * 100));
            
            // UIを即座に更新
            this.domCache.progressFill.style.width = `${progress}%`;
            
            // 時間表示を更新
            const newTime = (progress / 100) * this.totalTime;
            this.updateTimeDisplay(newTime, this.totalTime);
            
            e.preventDefault();
        };
        // マウスアップイベント（シーク終了）
        const endSeek = (e) => {
            if (!isDragging || !this.midiData) return;
            
            const rect = progressBar.getBoundingClientRect();
            const x = (e.clientX || e.changedTouches?.[0].clientX) - rect.left;
            const progress = Math.max(0, Math.min(100, (x / rect.width) * 100));
            const newTime = (progress / 100) * this.totalTime;
            
            // 再生位置を更新
            this.seekToTime(newTime);
            
            isDragging = false;
            progressBar.style.cursor = 'pointer';
            
            e.preventDefault();
        };
        // プログレスバークリックイベント
        progressBar.addEventListener('click', (e) => {
            if (!this.midiData || isDragging) return;
            
            const rect = progressBar.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const progress = (x / rect.width) * 100;
            const newTime = (progress / 100) * this.totalTime;
            
            this.seekToTime(newTime);
        });
        // マウスイベント
        progressHandle.addEventListener('mousedown', startSeek);
        progressBar.addEventListener('mousedown', startSeek);
        document.addEventListener('mousemove', seekTo);
        document.addEventListener('mouseup', endSeek);
        // タッチイベント（モバイル対応）
        progressHandle.addEventListener('touchstart', startSeek);
        progressBar.addEventListener('touchstart', startSeek);
        document.addEventListener('touchmove', seekTo);
        document.addEventListener('touchend', endSeek);
    }
    seekToTime(targetTime) {
        if (!this.midiData) return;
        
        this.currentTime = Math.max(0, Math.min(targetTime, this.totalTime));
        
        // 再生中の場合、再生を停止してから再開
        if (this.isPlaying) {
            // 既存のアニメーションフレームをキャンセル
            if (this.animationFrameId) {
                cancelAnimationFrame(this.animationFrameId);
                this.animationFrameId = null;
            }
            
            // 現在鳴っている音を停止
            const pressedKeys = this.pianoKeyboard.querySelectorAll('.piano-key.pressed');
            pressedKeys.forEach(key => key.classList.remove('pressed'));
            
            // Reset sustain pedal state when seeking
            this.handleSustainPedal(false);
            
            // 再生を再開
            this.startMidiPlayback();
        }
        
        // UIを更新
        const progress = this.totalTime > 0 ? (this.currentTime / this.totalTime) * 100 : 0;
        this.domCache.progressFill.style.width = `${progress}%`;
        this.updateTimeDisplay(this.currentTime, this.totalTime);
        this.updatePositionInfo(this.currentTime);
    }
    // 時間表示を更新
    updateTimeDisplay(currentTime, totalTime) {
        const formatTime = (seconds) => {
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        };
        document.getElementById('current-time').textContent = formatTime(currentTime);
        document.getElementById('total-time').textContent = formatTime(totalTime);
    }
    // 小節・拍位置を更新
    updatePositionInfo(currentTime) {
        if (!this.midiData) return;
        
        // 簡単な計算（4/4拍子、120BPMを仮定）
        const beatsPerSecond = 2; // 120BPM = 2 beats per second
        const totalBeats = Math.floor(currentTime * beatsPerSecond) + 1;
        const currentMeasure = Math.floor((totalBeats - 1) / 4) + 1;
        const currentBeat = ((totalBeats - 1) % 4) + 1;
        
        document.getElementById('current-measure').textContent = `小節: ${currentMeasure}`;
        document.getElementById('current-beat').textContent = `拍: ${currentBeat}`;
    }
    // 再生位置コントロールの表示/非表示
    showPlaybackControls() {
        const playbackControls = document.getElementById('pbc');
        if (playbackControls) {
            playbackControls.style.display = 'block';
        }
    }
    hidePlaybackControls() {
        const playbackControls = document.getElementById('pbc');
        if (playbackControls) {
            playbackControls.style.display = 'none';
        }
    }
    
    async loadMidiFile(file) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            this.midiData = this.parseMidi(arrayBuffer);
            
            this.domCache.playMidi.disabled = false;
            this.domCache.midiInfo.textContent = `Loaded: ${file.name}`;
            
            this.totalTime = this.calculateTotalTime();
            this.currentTime = 0;
            
            // 再生位置コントロールを表示し、初期値を設定
            this.showPlaybackControls();
            this.updateTimeDisplay(0, this.totalTime);
            this.updatePositionInfo(0);
            
        } catch (error) {
            this.domCache.midiInfo.textContent = 'Error loading file';
            this.hidePlaybackControls();
            this.domCache.playMidi.disabled = true;
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
                } else if ((status & 0xF0) === 0xB0) {
                    // Control Change (including sustain pedal CC64)
                    event.controller = readUInt8();
                    event.value = readUInt8();
                    event.type = 'controlChange';
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
        const midiEventLengths = {
            0x80: 2, 0x90: 2, 0xA0: 2, 0xB0: 2, 0xE0: 2,
            0xC0: 1, 0xD0: 1
        };
        return midiEventLengths[type] || 0;
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
        
        this.domCache.playMidi.disabled = true;
        this.domCache.pauseMidi.disabled = false;
        this.domCache.stopMidi.disabled = false;
        
        this.startMidiPlayback();
    }
    
    pauseMidi() {
        this.isPlaying = false;
        this.domCache.playMidi.disabled = false;
        this.domCache.pauseMidi.disabled = true;
        
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        // currentTimeは保持する（シーク位置をキープ）
        // 注意: currentTimeはplayLoop内で更新されているため、pauseした時点の位置が保持される
    }
    
    stopMidi() {
        this.isPlaying = false;
        this.currentTime = 0; // stopは完全に停止して最初に戻る
        
        this.domCache.playMidi.disabled = false;
        this.domCache.pauseMidi.disabled = true;
        this.domCache.stopMidi.disabled = true;
        this.domCache.progressFill.style.width = '0%';
        
        // 時間・位置表示を初期化
        this.updateTimeDisplay(0, this.totalTime);
        this.updatePositionInfo(0);
        
        // Clear all piano key highlights
        const pressedKeys = this.pianoKeyboard.querySelectorAll('.piano-key.pressed');
        pressedKeys.forEach(key => key.classList.remove('pressed'));
        
        // Reset sustain pedal state
        this.handleSustainPedal(false);
        
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }
    
    startMidiPlayback() {
        // 既存のanimationFrameが実行中の場合はキャンセル
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        const startTime = Date.now();
        const seekOffset = this.currentTime; // シーク位置を記録
        const ticksPerBeat = this.midiData.division;
        let microsecondsPerBeat = 500000;
        
        // まずすべてのイベントを収集（テンポ変更も含む）
        const allRawEvents = [];
        this.midiData.tracks.forEach((track, trackIndex) => {
            track.forEach(event => {
                allRawEvents.push({
                    ...event,
                    trackIndex,
                    tickTime: event.time
                });
            });
        });
        
        // tick時間順にソート
        allRawEvents.sort((a, b) => a.tickTime - b.tickTime);
        
        // テンポ変更を考慮して時間を計算
        const allEvents = [];
        let currentTempo = microsecondsPerBeat;
        let currentTickTime = 0;
        let currentRealTime = 0;
        
        allRawEvents.forEach(event => {
            // 経過tick時間を実時間に変換
            const tickDelta = event.tickTime - currentTickTime;
            const timeDelta = (tickDelta / ticksPerBeat) * (currentTempo / 1000000);
            currentRealTime += timeDelta;
            currentTickTime = event.tickTime;
            
            if (event.type === 'setTempo') {
                currentTempo = event.microsecondsPerBeat;
            } else if (event.type === 'noteOn' || event.type === 'noteOff' || event.type === 'controlChange') {
                allEvents.push({
                    ...event,
                    timeInSeconds: currentRealTime
                });
            }
        });
        
        // シーク位置に応じてeventIndexを調整
        let eventIndex = 0;
        while (eventIndex < allEvents.length && allEvents[eventIndex].timeInSeconds < seekOffset) {
            eventIndex++;
        }
        
        // デバッグログ: 初期状態
        if (allEvents.length > 0) {
            if (allEvents.length > 1) {
            }
        }
        
        let frameCount = 0;
        const playLoop = () => {
            frameCount++;
            if (!this.isPlaying) {
                return;
            }
            
            const elapsed = seekOffset + (Date.now() - startTime) / 1000 * this.playbackRate;
            this.currentTime = elapsed;
            
            // 最初の数フレームをログ出力（必要時のみ）
            // if (frameCount <= 5) {
            // }
            
            let eventsProcessed = 0;
            while (eventIndex < allEvents.length && allEvents[eventIndex].timeInSeconds <= elapsed) {
                const event = allEvents[eventIndex];
                eventsProcessed++;
                
                if (event.type === 'noteOn') {
                    // MIDI再生時は波形表示を無効化
                    this.playNote(event.note, event.velocity, performance.now(), false);
                } else if (event.type === 'noteOff') {
                    this.stopNote(event.note, performance.now(), false);
                } else if (event.type === 'controlChange') {
                    
                    // Handle sustain pedal (CC 64)
                    if (event.controller === 64) {
                        this.handleSustainPedal(event.value >= 64);
                    }
                }
                
                eventIndex++;
            }
            
            // デバッグログ: 各フレームの処理状況（eventsProcessed > 0の場合のみ）
            if (eventsProcessed > 0) {
            }
            
            const progress = this.totalTime > 0 ? (elapsed / this.totalTime) * 100 : 0;
            this.domCache.progressFill.style.width = `${Math.min(progress, 100)}%`;
            
            // 新しい時間・位置表示を更新
            this.updateTimeDisplay(elapsed, this.totalTime);
            this.updatePositionInfo(elapsed);
            
            if (elapsed >= this.totalTime || eventIndex >= allEvents.length) {
                this.stopMidi();
                return;
            }
            
            this.animationFrameId = requestAnimationFrame(playLoop);
            
            // 最初の数フレームでanimationFrameId設定をログ出力（必要時のみ）
            // if (frameCount <= 5) {
            // }
        };
        
        playLoop();
    }
    
    setupCollapsibleSections() {
        // Define which sections should be collapsed by default
        const defaultCollapsed = ['keyboard', 'recording'];
        
        // Initialize max-height for all collapsible content
        document.querySelectorAll('.cc').forEach(content => {
            const sectionName = content.getAttribute('data-section');
            if (defaultCollapsed.includes(sectionName)) {
                // Start collapsed
                content.classList.add('collapsed');
                content.style.maxHeight = '0';
                const header = document.querySelector(`h3[data-section="${sectionName}"]`);
                if (header) {
                    header.classList.add('collapsed');
                }
            } else {
                // Start expanded
                content.style.maxHeight = content.scrollHeight + 'px';
            }
        });
        
        // Add click listeners to section headers
        document.querySelectorAll('h3[data-section]').forEach(header => {
            header.addEventListener('click', (e) => {
                const sectionName = header.getAttribute('data-section');
                const content = document.querySelector(`.cc[data-section="${sectionName}"]`);
                const icon = header.querySelector('.ti');
                
                if (content.classList.contains('collapsed')) {
                    // Expand
                    content.classList.remove('collapsed');
                    // Use requestAnimationFrame for smoother animation
                    requestAnimationFrame(() => {
                        content.style.maxHeight = content.scrollHeight + 'px';
                    });
                    header.classList.remove('collapsed');
                } else {
                    // Collapse
                    content.classList.add('collapsed');
                    content.style.maxHeight = '0';
                    header.classList.add('collapsed');
                }
            });
        });
        
    }
    
    createCanvasBackground() {
        
        if (!this.scene || !this.camera) {
            return;
        }
        
        try {
            // Canvas要素を作成して直接描画
            const canvas = document.createElement('canvas');
            canvas.width = 512;
            canvas.height = 512;
            const ctx = canvas.getContext('2d');
            
            // Store canvas and context for waveform updates
            this.backgroundCanvas = canvas;
            this.backgroundContext = ctx;
            
            this.drawBackgroundWithWaveform();
            
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
            
            
        } catch (error) {
        }
    }
    
    drawBackgroundWithWaveform() {
        if (!this.backgroundContext) return;
        
        const ctx = this.backgroundContext;
        const canvas = this.backgroundCanvas;
        
        // Always clear canvas completely
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Always draw clean gradient background
        const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
        gradient.addColorStop(0, 'rgba(102, 126, 234, 0.2)');
        gradient.addColorStop(0.5, 'rgba(118, 75, 162, 0.15)');
        gradient.addColorStop(1, 'rgba(15, 15, 35, 0.1)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Note: Visualization (waveform/spectrum) is now handled by spectrum canvas only
        
        // Always force texture update to ensure clean background
        if (this.backgroundPlane && this.backgroundPlane.material.map) {
            this.backgroundPlane.material.map.needsUpdate = true;
            this.backgroundPlane.material.needsUpdate = true;
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
        
        // Convert hex to HSL using helper function
        const { r, g, b } = this.hexToRgbNormalized(baseColor);
        
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
        
        if (max === min) {
            h = s = 0; // achromatic
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            const hueCalculators = {
                [r]: () => (g - b) / d + (g < b ? 6 : 0),
                [g]: () => (b - r) / d + 2,
                [b]: () => (r - g) / d + 4
            };
            h = hueCalculators[max] ? hueCalculators[max]() : 0;
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
            return '#ffffff'; // Fallback color
        }
        
        const randomColorIndex = Math.floor(Math.random() * palette.length);
        const selectedColor = palette[randomColorIndex];
        
        // Throttled logging to avoid spam
        if (!this.lastColorLog || Date.now() - this.lastColorLog > 2000) {
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
        
        // Update HTML select box to reflect the selection
        const colorScaleSelector = document.getElementById('color-scale');
        if (colorScaleSelector) {
            colorScaleSelector.value = this.settings.colorScale;
            
            // Hide custom controls since we're using retro palette
            const customControls = document.getElementById('color-customization');
            if (customControls) {
                customControls.style.display = 'none';
            }
        } else {
        }
        
        // Test color selection
        const testColor = this.getRandomRetroColor();
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
            const noteElement = document.querySelector(`.mr .key:contains('${mapping.key}')`);
            if (noteElement && noteElement.nextElementSibling) {
                const noteName = this.midiNoteToNoteName(mapping.midiNote);
                noteElement.nextElementSibling.textContent = noteName;
            }
        });
        
        // Alternative approach: find by text content
        document.querySelectorAll('.mr').forEach(row => {
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
                    } else {
                        this.playMidi();
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
                this.logMidiActivity(`⏹ ${this.midiNoteToNoteName(midiNote)} (${midiNote})`);
            }
        });
    }
    
    highlightPianoKey(midiNote, pressed) {
        // Update key state and schedule batch update for better performance
        if (pressed) {
            this.activeKeys.add(midiNote);
        } else {
            this.activeKeys.delete(midiNote);
        }
        this.scheduleKeyVisualUpdate(midiNote);
    }
    
    visualizeNoteFallback(noteName, midiNote, velocity) {
        const noteElement = document.createElement('div');
        noteElement.className = 'nd';
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
        noteElement.style.animationDuration = `4s`;
        
        document.body.appendChild(noteElement);
        
        setTimeout(() => {
            if (noteElement.parentNode) {
                noteElement.parentNode.removeChild(noteElement);
            }
        }, 4000);
    }
    
    startVisualization() {
        if (!this.renderer || typeof THREE === 'undefined') {
            // Fallback: just animate background if THREE.js failed
            return;
        }
        
        
        let lastFrameTime = 0;
        const frameTimeLimit = 16.67; // ~60fps limit
        
        const animate = (currentTime) => {
            // Throttle frame rate for consistent performance
            if (currentTime - lastFrameTime < frameTimeLimit) {
                requestAnimationFrame(animate);
                return;
            }
            lastFrameTime = currentTime;
            
            // Skip rendering if no active sprites and no recent activity
            if (this.noteObjects.length === 0 && currentTime - this.lastNoteTime > 1000) {
                requestAnimationFrame(animate);
                return;
            }
            
            // Update note sprites with sustained note logic
            for (let i = this.noteObjects.length - 1; i >= 0; i--) {
                const sprite = this.noteObjects[i];
                const userData = sprite.userData;
                const velocityIntensity = userData.velocity / 127;
                const motionBlurFactor = 0.3;
                
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
                    
                    // Return sprite to pool instead of disposing
                    this.returnSpriteToPool(sprite);
                    this.noteObjects.splice(i, 1);
                }
            }
            
            // Always update background (function internally checks if waveform should be drawn)
            this.drawBackgroundWithWaveform();
            
            // Render the scene
            this.renderer.render(this.scene, this.camera);
            
            
            requestAnimationFrame(animate);
        };
        animate();
    }
    
    
    
    
    
    // Recording functionality removed
    
    
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
        const selectElement = this.domCache.midiInputSelect;
        
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
        const selectElement = this.domCache.midiInputSelect;
        
        selectElement.addEventListener('change', (e) => {
            const selectedValue = e.target.value;
            this.selectedInputDevice = selectedValue;
            
            
            // Setup MIDI message handlers based on selection
            this.setupMidiInputHandlers();
            
            // Log device change
            if (selectedValue === 'keyboard') {
                this.logMidiActivity('Input switched to: Computer Keyboard');
            } else {
                const selectedInput = this.midiInputs.get(selectedValue);
                if (selectedInput) {
                    this.logMidiActivity(`Input switched to: ${selectedInput.name}`);
                }
            }
        });
    }
    
    setupMidiInputHandlers() {
        
        // Clear all existing handlers
        let clearedCount = 0;
        for (const [id, input] of this.midiInputs) {
            input.onmidimessage = null;
            clearedCount++;
        }
        
        // Set up handler for selected device or all devices if single device
        if (this.selectedInputDevice !== 'keyboard') {
            if (this.midiInputs.size === 1) {
                // If only one device, set handler for that device regardless of selection
                const singleDevice = this.midiInputs.values().next().value;
                singleDevice.onmidimessage = (message) => this.handleMIDIMessage(message);
            } else {
                // Multiple devices - use selected device
                const selectedInput = this.midiInputs.get(this.selectedInputDevice);
                if (selectedInput) {
                    selectedInput.onmidimessage = (message) => this.handleMIDIMessage(message);
                } else {
                    // Fallback: set handlers for all devices
                    for (const [id, input] of this.midiInputs) {
                        input.onmidimessage = (message) => this.handleMIDIMessage(message);
                    }
                }
            }
        } else {
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
        });
        
        // Mute button
        muteButton.addEventListener('click', () => {
            this.settings.isMuted = !this.settings.isMuted;
            
            if (this.settings.isMuted) {
                muteButton.textContent = '🔇 Muted';
                muteButton.classList.add('muted');
            } else {
                muteButton.textContent = '🔊 Unmuted';
                muteButton.classList.remove('muted');
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
        
        
        for (const [id, input] of this.midiInputs) {
            const deviceName = input.name.toLowerCase();
            let score = 0;
            
            // Score based on piano-related keywords
            for (const keyword of pianoKeywords) {
                if (deviceName.includes(keyword)) {
                    score += 1;
                }
            }
            
            // Higher score for devices with explicit 88-key indicators
            if (deviceName.includes('88')) {
                score += 3;
            }
            
            // Prefer devices with "piano" or "keyboard" in name
            if (deviceName.includes('piano') || deviceName.includes('keyboard')) {
                score += 2;
            }
            
            
            if (score > highestScore) {
                bestDevice = { id, input };
                highestScore = score;
            }
        }
        
        // Auto-select the best device if found
        if (bestDevice && highestScore >= 1) {
            const oldDevice = this.selectedInputDevice;
            this.selectedInputDevice = bestDevice.id;
            this.domCache.midiInputSelect.value = bestDevice.id;
            
            this.logMidiActivity(`Auto-selected: ${bestDevice.input.name}`);
            
            // Force re-setup of MIDI handlers after auto-selection
        } else if (this.midiInputs.size > 0) {
            // If no piano-like device found, select the first available MIDI device
            const firstDevice = this.midiInputs.entries().next().value;
            const oldDevice = this.selectedInputDevice;
            this.selectedInputDevice = firstDevice[0];
            this.domCache.midiInputSelect.value = firstDevice[0];
            
            this.logMidiActivity(`Auto-selected: ${firstDevice[1].name}`);
            
            // Force re-setup of MIDI handlers after auto-selection
        } else {
        }
    }
    
    
    setupSNSShareButtons() {
        const twitterBtn = document.querySelector('.tb');
        const facebookBtn = document.querySelector('.fb');
        const lineBtn = document.querySelector('.line-btn');
        const copyBtn = document.querySelector('.copy-btn');
        
        if (!twitterBtn || !facebookBtn || !lineBtn || !copyBtn) {
            return;
        }
        
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
            window.open(facebookUrl, '_blank', 'width=626,height=436');
        });
        
        // LINE share
        lineBtn.addEventListener('click', () => {
            const lineUrl = `https://line.me/R/msg/text/?${encodeURIComponent(shareData.text + ' ' + shareData.url)}`;
            window.open(lineUrl, '_blank');
        });
        
        // Copy URL
        copyBtn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(shareData.url);
                copyBtn.classList.add('copied');
                copyBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>';
                setTimeout(() => {
                    copyBtn.classList.remove('copied');
                    copyBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>';
                }, 2000);
            } catch (err) {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = shareData.url;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                copyBtn.classList.add('copied');
                setTimeout(() => copyBtn.classList.remove('copied'), 2000);
            }
        });
        
    }
    
    setupWaveformDisplay() {
        
        this.spectrumCanvas = document.getElementById('sc');
        if (!this.spectrumCanvas) {
            return;
        }
        
        this.spectrumContext = this.spectrumCanvas.getContext('2d');
        
        // Set canvas size
        this.resizeSpectrumCanvas();
        
        // Set initial visibility based on display mode
        this.spectrumCanvas.style.display = this.settings.displayMode === 'none' ? 'none' : 'block';
        
        // Update showSpectrumAnalyzer based on display mode
        this.settings.showSpectrumAnalyzer = this.settings.displayMode === 'spectrum';
        
        // Start spectrum animation
        this.startSpectrumAnimation();
        
    }
    
    resizeSpectrumCanvas() {
        if (!this.spectrumCanvas || !this.container) return;
        
        const rect = this.container.getBoundingClientRect();
        this.spectrumCanvas.width = rect.width;
        this.spectrumCanvas.height = rect.height;
    }
    
    startSpectrumAnimation() {
        if (!this.analyserNode || !this.spectrumContext) return;
        
        const drawVisualization = () => {
            if (this.analyserNode && this.spectrumContext && this.settings.displayMode !== 'none') {
                if (this.settings.displayMode === 'spectrum') {
                    this.drawSpectrumBars();
                } else if (this.settings.displayMode === 'waveform') {
                    this.drawWaveformLine();
                }
            } else if (this.spectrumContext && this.spectrumCanvas) {
                // Clear spectrum canvas when disabled
                this.spectrumContext.clearRect(0, 0, this.spectrumCanvas.width, this.spectrumCanvas.height);
            }
            this.animationFrameId = requestAnimationFrame(drawVisualization);
        };
        
        drawVisualization();
    }
    
    drawWaveformLine() {
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
        
        // Draw waveform
        this.spectrumContext.beginPath();
        
        const sliceWidth = width / bufferLength;
        let x = 0;
        
        for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0;
            const y = v * height / 2;
            
            if (i === 0) {
                this.spectrumContext.moveTo(x, y);
            } else {
                this.spectrumContext.lineTo(x, y);
            }
            
            x += sliceWidth;
        }
        
        this.spectrumContext.stroke();
    }
    
    drawSpectrumBars() {
        if (!this.analyserNode || !this.spectrumContext || !this.spectrumCanvas) return;
        
        const bufferLength = this.analyserNode.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        this.analyserNode.getByteFrequencyData(dataArray);
        
        const width = this.spectrumCanvas.width;
        const height = this.spectrumCanvas.height;
        
        // Clear canvas
        this.spectrumContext.clearRect(0, 0, width, height);
        
        // Create main gradient for spectrum bars (same colors as waveform)
        const mainGradient = this.spectrumContext.createLinearGradient(0, 0, width, 0);
        mainGradient.addColorStop(0, '#ff6b6b');
        mainGradient.addColorStop(0.25, '#4ecdc4');
        mainGradient.addColorStop(0.5, '#45b7d1');
        mainGradient.addColorStop(0.75, '#96ceb4');
        mainGradient.addColorStop(1, '#feca57');
        
        // Set glow effect
        this.spectrumContext.shadowBlur = 10;
        this.spectrumContext.shadowColor = '#4ecdc4';
        
        // Draw spectrum bars
        const barWidth = width / bufferLength;
        
        for (let i = 0; i < bufferLength; i++) {
            const barHeight = (dataArray[i] / 255) * height * 0.8;
            const x = i * barWidth;
            const y = height - barHeight;
            
            // Use the main gradient for all bars
            this.spectrumContext.fillStyle = mainGradient;
            this.spectrumContext.fillRect(x, y, barWidth - 1, barHeight);
        }
        
        // Reset shadow
        this.spectrumContext.shadowBlur = 0;
    }
}
document.addEventListener('DOMContentLoaded', () => {
    const visualizer = new PianoVisualizer();
    
    // Setup SNS share buttons
    visualizer.setupSNSShareButtons();
});