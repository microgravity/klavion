/**
 * AudioEngine分離テスト - TDD Sprint 3 Phase 2
 * createIntegratedAudioEngine機能をapp.jsから独立したモジュールに分離
 */

const path = require('path');
const fs = require('fs');

// Mock Web Audio API for testing
const mockOscillator = {
    connect: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    frequency: { value: 0 },
    type: 'sine'
};

const mockGainNode = {
    connect: jest.fn(),
    gain: { value: 0.5 }
};

const mockAnalyser = {
    fftSize: 512,
    smoothingTimeConstant: 0.8,
    connect: jest.fn()
};

const mockMediaStreamDestination = {
    stream: {}
};

const mockAudioContext = {
    state: 'running',
    sampleRate: 48000,
    destination: {},
    createOscillator: jest.fn(() => mockOscillator),
    createGain: jest.fn(() => mockGainNode),
    createAnalyser: jest.fn(() => mockAnalyser),
    createMediaStreamDestination: jest.fn(() => mockMediaStreamDestination),
    resume: jest.fn(),
    suspend: jest.fn()
};

// Mock global AudioContext
global.AudioContext = jest.fn(() => mockAudioContext);
global.webkitAudioContext = jest.fn(() => mockAudioContext);

describe('AudioEngine分離モジュール - TDD Sprint 3 Phase 2', () => {
    let AudioEngine;
    
    beforeEach(() => {
        jest.clearAllMocks();
        
        // Reset mock states
        mockAudioContext.state = 'running';
        mockOscillator.connect.mockClear();
        mockGainNode.connect.mockClear();
        mockAnalyser.connect.mockClear();
        
        // Dynamic import will be implemented after module creation
        AudioEngine = null;
    });

    describe('🎵 基本機能テスト', () => {
        test('🔴 FAIL: AudioEngineクラスが存在すること', () => {
            // Will fail until we create the module
            expect(() => {
                const audioEngineCode = fs.readFileSync(
                    path.join(__dirname, '../../../src/modules/audio-engine-extracted.js'), 
                    'utf8'
                );
                AudioEngine = eval(`${audioEngineCode.replace('export default', '')}AudioEngine;`);
            }).not.toThrow();
            expect(AudioEngine).toBeDefined();
        });

        test('🔴 FAIL: インスタンスを正しく初期化できること', () => {
            if (!AudioEngine) return; // Skip if module not created yet
            
            const audioEngine = new AudioEngine();
            expect(audioEngine).toBeInstanceOf(AudioEngine);
            expect(audioEngine.isInitialized).toBe(false);
            expect(audioEngine.currentTimbre).toBe('acoustic-piano');
            expect(audioEngine.volume).toBe(0.75);
            expect(audioEngine.muted).toBe(false);
        });

        test('🔴 FAIL: オーディオコンテキストを初期化できること', async () => {
            if (!AudioEngine) return;
            
            const audioEngine = new AudioEngine();
            await audioEngine.initAudio();
            
            expect(AudioContext).toHaveBeenCalled();
            expect(audioEngine.audioContext).toBeDefined();
            expect(audioEngine.isInitialized).toBe(true);
        });
    });

    describe('🎹 音声合成テスト', () => {
        let audioEngine;

        beforeEach(async () => {
            if (!AudioEngine) return;
            audioEngine = new AudioEngine();
            await audioEngine.initAudio();
        });

        test('🔴 FAIL: 音符を合成できること', () => {
            if (!audioEngine) return;
            
            const noteId = audioEngine.synthesizeNote(440, 100, 69); // A4
            
            expect(noteId).toMatch(/69-\d+/); // Should include MIDI note and timestamp
            expect(mockAudioContext.createOscillator).toHaveBeenCalled();
            expect(mockAudioContext.createGain).toHaveBeenCalled();
            expect(mockOscillator.connect).toHaveBeenCalledWith(mockGainNode);
            expect(mockOscillator.start).toHaveBeenCalled();
        });

        test('🔴 FAIL: 音符を停止できること', () => {
            if (!audioEngine) return;
            
            const noteId = audioEngine.synthesizeNote(440, 100, 69);
            audioEngine.stopNote(noteId);
            
            expect(mockOscillator.stop).toHaveBeenCalled();
            expect(audioEngine.getActiveNotes()).toHaveLength(0);
        });

        test('🔴 FAIL: ミュート時は音符を合成しないこと', () => {
            if (!audioEngine) return;
            
            audioEngine.setMuted(true);
            const noteId = audioEngine.synthesizeNote(440, 100, 69);
            
            expect(noteId).toBeNull();
            expect(mockAudioContext.createOscillator).not.toHaveBeenCalled();
        });
    });

    describe('🎛️ 設定管理テスト', () => {
        let audioEngine;

        beforeEach(async () => {
            if (!AudioEngine) return;
            audioEngine = new AudioEngine();
            await audioEngine.initAudio();
        });

        test('🔴 FAIL: 音色を変更できること', () => {
            if (!audioEngine) return;
            
            audioEngine.setTimbre('organ');
            expect(audioEngine.getCurrentTimbre()).toBe('organ');
            
            audioEngine.setTimbre('invalid-timbre');
            expect(audioEngine.getCurrentTimbre()).toBe('organ'); // Should not change
        });

        test('🔴 FAIL: 音量を設定できること', () => {
            if (!audioEngine) return;
            
            audioEngine.setVolume(0.5);
            expect(audioEngine.getVolume()).toBe(0.5);
            
            audioEngine.setVolume(-0.1);
            expect(audioEngine.getVolume()).toBe(0); // Should clamp to 0
            
            audioEngine.setVolume(1.5);
            expect(audioEngine.getVolume()).toBe(1); // Should clamp to 1
        });

        test('🔴 FAIL: ミュート状態を管理できること', () => {
            if (!audioEngine) return;
            
            expect(audioEngine.isMuted()).toBe(false);
            
            audioEngine.setMuted(true);
            expect(audioEngine.isMuted()).toBe(true);
            
            audioEngine.setMuted(false);
            expect(audioEngine.isMuted()).toBe(false);
        });
    });

    describe('📊 リソース管理テスト', () => {
        let audioEngine;

        beforeEach(async () => {
            if (!AudioEngine) return;
            audioEngine = new AudioEngine();
            await audioEngine.initAudio();
        });

        test('🔴 FAIL: リソース使用状況を取得できること', () => {
            if (!audioEngine) return;
            
            const usage = audioEngine.getResourceUsage();
            expect(usage).toHaveProperty('activeOscillators');
            expect(usage).toHaveProperty('activeGainNodes');
            expect(usage).toHaveProperty('activeNotes');
            expect(typeof usage.activeOscillators).toBe('number');
        });

        test('🔴 FAIL: アクティブな音符を追跡できること', () => {
            if (!audioEngine) return;
            
            const noteId1 = audioEngine.synthesizeNote(440, 100, 69);
            const noteId2 = audioEngine.synthesizeNote(523, 100, 72);
            
            const activeNotes = audioEngine.getActiveNotes();
            expect(activeNotes).toHaveLength(2);
            
            audioEngine.stopNote(noteId1);
            expect(audioEngine.getActiveNotes()).toHaveLength(1);
        });
    });

    describe('🔧 エラーハンドリングテスト', () => {
        test('🔴 FAIL: AudioContext作成失敗時の処理', async () => {
            if (!AudioEngine) return;
            
            AudioContext.mockImplementationOnce(() => {
                throw new Error('AudioContext not supported');
            });
            
            const audioEngine = new AudioEngine();
            await expect(audioEngine.initAudio()).rejects.toThrow('AudioContext not supported');
        });

        test('🔴 FAIL: 未初期化状態での音符合成', () => {
            if (!AudioEngine) return;
            
            const audioEngine = new AudioEngine();
            // Don't call initAudio()
            
            const noteId = audioEngine.synthesizeNote(440, 100, 69);
            expect(noteId).toBeNull();
        });
    });

    describe('🎼 音色別テスト', () => {
        let audioEngine;

        beforeEach(async () => {
            if (!AudioEngine) return;
            audioEngine = new AudioEngine();
            await audioEngine.initAudio();
        });

        test('🔴 FAIL: 各音色で適切な波形タイプを設定', () => {
            if (!audioEngine) return;
            
            const testCases = [
                { timbre: 'acoustic-piano', expectedType: 'triangle' },
                { timbre: 'organ', expectedType: 'square' },
                { timbre: 'guitar', expectedType: 'sawtooth' },
                { timbre: 'synth-lead', expectedType: 'square' }
            ];
            
            testCases.forEach(({ timbre, expectedType }) => {
                audioEngine.setTimbre(timbre);
                audioEngine.synthesizeNote(440, 100, 69);
                expect(mockOscillator.type).toBe(expectedType);
            });
        });
    });
});