/**
 * AudioEngine - 音声合成・音色管理モジュール
 * 🟢 GREEN: テストを通すための最小実装
 * 
 * 目標：30KB削減、音色・音声合成機能の独立モジュール化
 */

class AudioEngine {
    constructor() {
        // AudioContextの初期化
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            this.audioContext = null;
        }
        
        this.isInitialized = false;
        this.currentTimbre = 'acoustic-piano';
        this.volume = 0.75;
        this.muted = false;
        
        // アクティブなノート管理
        this.activeNotes = new Map();
        this.activeOscillators = new Set();
        this.activeGainNodes = new Set();
        
        // 音色定義
        this.timbres = [
            'acoustic-piano',
            'electric-piano', 
            'organ',
            'guitar',
            'bass',
            'strings',
            'brass',
            'synth-lead',
            'synth-pad'
        ];
    }
    
    /**
     * 音声システムの初期化
     */
    init() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        this.isInitialized = true;
    }
    
    /**
     * 完全な音声システムの初期化（PianoVisualizer互換）
     */
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
            
            // Create audio destination
            this.audioDestination = this.audioContext.createMediaStreamDestination();
            
            // Create analyzer node for spectrum visualization
            this.analyserNode = this.audioContext.createAnalyser();
            this.analyserNode.fftSize = 512;
            this.analyserNode.smoothingTimeConstant = 0.8;
            
            // Create master gain node for stable analyzer connection
            this.masterGainNode = this.audioContext.createGain();
            this.masterGainNode.gain.value = this.volume;
            
            // Connect master gain to analyzer and destination (permanent connection)
            this.masterGainNode.connect(this.analyserNode);
            this.masterGainNode.connect(this.audioContext.destination);
            
            this.isInitialized = true;
            
        } catch (error) {
            console.error('[AudioEngine] 初期化失敗:', error);
            throw error;
        }
    }
    
    /**
     * 利用可能な音色リストを取得
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
     * 音符の合成・再生
     */
    synthesizeNote(frequency, velocity, midiNote) {
        if (!this.audioContext || this.muted) {
            return null;
        }
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        // 音色に応じた波形設定
        this.configureOscillatorForTimbre(oscillator, this.currentTimbre);
        
        // 音量設定
        const normalizedVelocity = velocity / 127;
        gainNode.gain.value = normalizedVelocity * this.volume;
        
        // 接続
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // 周波数設定
        oscillator.frequency.value = frequency;
        
        // 再生開始
        oscillator.start();
        
        // アクティブなノートとして記録
        const noteId = `${midiNote}-${Date.now()}`;
        this.activeNotes.set(noteId, {
            oscillator,
            gainNode,
            midiNote,
            frequency,
            velocity
        });
        
        this.activeOscillators.add(oscillator);
        this.activeGainNodes.add(gainNode);
        
        return noteId;
    }
    
    /**
     * 音色に応じたオシレーター設定
     */
    configureOscillatorForTimbre(oscillator, timbre) {
        switch (timbre) {
            case 'acoustic-piano':
            case 'electric-piano':
                oscillator.type = 'triangle';
                break;
            case 'organ':
                oscillator.type = 'square';
                break;
            case 'guitar':
            case 'bass':
                oscillator.type = 'sawtooth';
                break;
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
    }
    
    /**
     * 音符の停止
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
     * アクティブなノートリストを取得
     */
    getActiveNotes() {
        return Array.from(this.activeNotes.values());
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
     * リソースの解放
     */
    destroy() {
        // 全てのアクティブノートを停止
        for (const [noteId] of this.activeNotes) {
            this.stopNote(noteId);
        }
        
        // AudioContextを閉じる
        if (this.audioContext) {
            this.audioContext.close();
        }
        
        this.isInitialized = false;
    }
    
    // PianoVisualizerとの互換性のためのメソッド
    async initAudio() {
        this.init();
    }
}

// モジュールエクスポート
module.exports = { AudioEngine };