/**
 * AudioEngine - 音声合成エンジン
 * TDD Sprint 3 Phase 2: app.jsから分離された独立モジュール
 */

export default class AudioEngine {
    constructor() {
        // プロパティ
        this.audioContext = null;
        this.isInitialized = false;
        this.currentTimbre = 'acoustic-piano';
        this.volume = 0.75;
        this.muted = false;
        this.activeNotes = new Map();
        this.activeOscillators = new Set();
        this.activeGainNodes = new Set();
        this.analyserNode = null;
        this.masterGainNode = null;
        this.audioDestination = null;
        
        // 音色定義
        this.timbres = [
            'acoustic-piano', 'electric-piano', 'organ', 'guitar', 'bass',
            'strings', 'brass', 'synth-lead', 'synth-pad'
        ];
    }

    /**
     * オーディオシステムを初期化
     */
    init() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        this.isInitialized = true;
    }

    /**
     * オーディオコンテキストを初期化
     */
    async initAudio() {
        try {
            const audioContextOptions = {
                latencyHint: 'playback',
                sampleRate: 48000
            };
            
            if ('AudioWorkletNode' in window) {
                audioContextOptions.bufferSize = 256;
            }
            
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)(audioContextOptions);
            this.audioDestination = this.audioContext.createMediaStreamDestination();
            
            this.analyserNode = this.audioContext.createAnalyser();
            this.analyserNode.fftSize = 512;
            this.analyserNode.smoothingTimeConstant = 0.8;
            
            this.masterGainNode = this.audioContext.createGain();
            this.masterGainNode.gain.value = this.volume;
            
            this.masterGainNode.connect(this.analyserNode);
            this.masterGainNode.connect(this.audioContext.destination);
            
            this.isInitialized = true;
        } catch (error) {
            console.error('[AudioEngine] 初期化失敗:', error);
            throw error;
        }
    }

    /**
     * 利用可能な音色一覧を取得
     */
    getAvailableTimbers() {
        return this.timbres;
    }

    /**
     * 現在の音色を取得
     */
    getCurrentTimbre() {
        return this.currentTimbre;
    }

    /**
     * 音色を設定
     */
    setTimbre(timbre) {
        if (this.timbres.includes(timbre)) {
            this.currentTimbre = timbre;
        }
    }

    /**
     * 音量を取得
     */
    getVolume() {
        return this.volume;
    }

    /**
     * 音量を設定
     */
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        if (this.masterGainNode) {
            this.masterGainNode.gain.value = this.volume;
        }
    }

    /**
     * ミュート状態を取得
     */
    isMuted() {
        return this.muted;
    }

    /**
     * ミュート状態を設定
     */
    setMuted(muted) {
        this.muted = muted;
    }

    /**
     * アクティブな音符一覧を取得
     */
    getActiveNotes() {
        return Array.from(this.activeNotes.values());
    }

    /**
     * リソース使用状況を取得
     */
    getResourceUsage() {
        return {
            activeOscillators: this.activeOscillators.size,
            activeGainNodes: this.activeGainNodes.size,
            activeNotes: this.activeNotes.size
        };
    }

    /**
     * 音符を合成
     * @param {number} frequency - 周波数
     * @param {number} velocity - ベロシティ（0-127）
     * @param {number} midiNote - MIDI音符番号
     * @returns {string|null} - 音符ID、またはnull
     */
    synthesizeNote(frequency, velocity, midiNote) {
        if (!this.audioContext || this.muted) return null;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        // 音色設定
        switch (this.currentTimbre) {
            case 'acoustic-piano':
            case 'electric-piano':
                oscillator.type = 'triangle'; 
                break;
            case 'organ':
                oscillator.type = 'square'; 
                break;
            case 'guitar':
            case 'bass':
            case 'strings':
            case 'brass':
                oscillator.type = 'sawtooth'; 
                break;
            case 'synth-lead':
            case 'synth-pad':
                oscillator.type = 'square'; 
                break;
            default:
                oscillator.type = 'sine';
        }
        
        const normalizedVelocity = velocity / 127;
        gainNode.gain.value = normalizedVelocity * this.volume;
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        oscillator.frequency.value = frequency;
        oscillator.start();
        
        const noteId = `${midiNote}-${Date.now()}`;
        this.activeNotes.set(noteId, { oscillator, gainNode, midiNote, frequency, velocity });
        this.activeOscillators.add(oscillator);
        this.activeGainNodes.add(gainNode);
        
        return noteId;
    }

    /**
     * 音符を停止
     * @param {string} noteId - 音符ID
     */
    stopNote(noteId) {
        const note = this.activeNotes.get(noteId);
        if (note) {
            note.oscillator.stop();
            this.activeOscillators.delete(note.oscillator);
            this.activeGainNodes.delete(note.gainNode);
            this.activeNotes.delete(noteId);
        }
    }

    /**
     * 全ての音符を停止
     */
    stopAllNotes() {
        for (const [noteId, note] of this.activeNotes) {
            try {
                note.oscillator.stop();
            } catch (e) {
                // オシレータが既に停止している場合のエラーを無視
            }
            this.activeOscillators.delete(note.oscillator);
            this.activeGainNodes.delete(note.gainNode);
        }
        this.activeNotes.clear();
    }

    /**
     * リソースを解放
     */
    destroy() {
        this.stopAllNotes();
        
        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close();
        }
        
        this.audioContext = null;
        this.analyserNode = null;
        this.masterGainNode = null;
        this.audioDestination = null;
        this.isInitialized = false;
    }
}