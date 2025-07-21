/**
 * AudioEngine モジュール分離のTDDテスト
 * 🔴 RED Phase: 失敗するテストから開始
 * 
 * 目標：30KB削減、音色・音声合成機能の独立モジュール化
 */

const { JSDOM } = require('jsdom');

describe('TDD Sprint 2 Phase 1: AudioEngine分離', () => {
  let dom;
  let document;
  let AudioEngine;
  
  beforeEach(() => {
    // JSDOM環境の初期化
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <body>
          <div id="volume-control">音量制御</div>
          <div id="audio-timbre">音色</div>
          <div id="mute-button">ミュート</div>
        </body>
      </html>
    `, {
      url: 'http://localhost:8001',
      pretendToBeVisual: true,
      resources: 'usable'
    });
    document = dom.window.document;
    global.document = document;
    global.window = dom.window;
    
    // AudioContext のモック
    global.AudioContext = class {
      constructor() {
        this.destination = { connect: jest.fn() };
        this.currentTime = 0;
        this.state = 'running';
      }
      createOscillator() {
        return {
          connect: jest.fn(),
          start: jest.fn(),
          stop: jest.fn(),
          frequency: { value: 440 },
          type: 'sine'
        };
      }
      createGain() {
        return {
          connect: jest.fn(),
          gain: { value: 1 }
        };
      }
      resume() { return Promise.resolve(); }
      close() { return Promise.resolve(); }
    };
    
    // AudioEngineクラスを取得試行
    try {
      const AudioEngineModule = require('../../../src/modules/audio-engine');
      AudioEngine = AudioEngineModule.AudioEngine;
    } catch (error) {
      AudioEngine = null;
    }
  });
  
  afterEach(() => {
    dom.window.close();
  });

  describe('🎯 基本AudioEngine機能テスト', () => {
    test('🔴 FAIL: AudioEngineクラスが存在すること', () => {
      // このテストは最初は失敗する（クラスが存在しないため）
      expect(AudioEngine).toBeDefined();
      expect(typeof AudioEngine).toBe('function');
    });

    test('🔴 FAIL: AudioEngine基本初期化ができること', () => {
      const engine = new AudioEngine();
      
      expect(engine).toBeDefined();
      expect(engine.audioContext).toBeDefined();
      expect(engine.isInitialized).toBe(false); // 初期化前
    });

    test('🔴 FAIL: 音色設定機能が動作すること', () => {
      const engine = new AudioEngine();
      
      // 音色の種類を確認
      expect(engine.getAvailableTimbers()).toEqual([
        'acoustic-piano',
        'electric-piano', 
        'organ',
        'guitar',
        'bass',
        'strings',
        'brass',
        'synth-lead',
        'synth-pad'
      ]);
      
      // 音色変更
      engine.setTimbre('electric-piano');
      expect(engine.getCurrentTimbre()).toBe('electric-piano');
    });
  });

  describe('🚀 音声合成パフォーマンステスト', () => {
    test('🔴 FAIL: 音声合成が1ms以下で完了すること', () => {
      const engine = new AudioEngine();
      
      const startTime = performance.now();
      
      // 音声合成テスト
      engine.synthesizeNote(440, 127, 60); // A4, max velocity
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      expect(executionTime).toBeLessThan(1);
    });

    test('🔴 FAIL: 複数ノートの同時再生ができること', () => {
      const engine = new AudioEngine();
      
      // 和音の同時再生
      const chord = [60, 64, 67]; // C major
      const startTime = performance.now();
      
      chord.forEach(note => {
        engine.synthesizeNote(440 * Math.pow(2, (note - 69) / 12), 100, note);
      });
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      expect(executionTime).toBeLessThan(5); // 5ms以下
      expect(engine.getActiveNotes().length).toBe(3);
    });
  });

  describe('🔧 音量・ミュート制御テスト', () => {
    test('🔴 FAIL: 音量制御が動作すること', () => {
      const engine = new AudioEngine();
      
      // 初期音量
      expect(engine.getVolume()).toBe(0.75); // デフォルト値
      
      // 音量変更
      engine.setVolume(0.5);
      expect(engine.getVolume()).toBe(0.5);
      
      // 範囲チェック
      engine.setVolume(1.5); // 上限超過
      expect(engine.getVolume()).toBe(1.0);
      
      engine.setVolume(-0.1); // 下限超過
      expect(engine.getVolume()).toBe(0.0);
    });

    test('🔴 FAIL: ミュート機能が動作すること', () => {
      const engine = new AudioEngine();
      
      // 初期状態：非ミュート
      expect(engine.isMuted()).toBe(false);
      
      // ミュート
      engine.setMuted(true);
      expect(engine.isMuted()).toBe(true);
      
      // ミュート解除
      engine.setMuted(false);
      expect(engine.isMuted()).toBe(false);
    });
  });

  describe('🎮 PianoVisualizerとの統合テスト', () => {
    test('🔴 FAIL: PianoVisualizerからの分離が成功すること', () => {
      // 現在のPianoVisualizerのaudio関連メソッドの代替
      const engine = new AudioEngine();
      
      // 必要なメソッドが存在することを確認
      expect(typeof engine.initAudio).toBe('function');
      expect(typeof engine.synthesizeNote).toBe('function');
      expect(typeof engine.stopNote).toBe('function');
      expect(typeof engine.setVolume).toBe('function');
      expect(typeof engine.setMuted).toBe('function');
      expect(typeof engine.setTimbre).toBe('function');
    });

    test('🔴 FAIL: ファイルサイズが30KB削減されること', () => {
      // メタテスト：分離後のファイルサイズを確認
      const fs = require('fs');
      
      try {
        const audioEngineSize = fs.statSync('./src/modules/audio-engine.js').size;
        const originalSize = fs.statSync('./app.js').size;
        
        // AudioEngineが適切なサイズであることを確認
        expect(audioEngineSize).toBeGreaterThan(5000);  // 5KB以上
        expect(audioEngineSize).toBeLessThan(35000);    // 35KB以下
        
        // 元ファイルから30KB以上削減されていることを確認
        const expectedReduction = 30000; // 30KB
        expect(originalSize).toBeGreaterThan(audioEngineSize + expectedReduction);
      } catch (error) {
        // ファイルが存在しない場合は失敗
        expect(error).toBeUndefined();
      }
    });
  });

  describe('🔄 リソース管理テスト', () => {
    test('🔴 FAIL: AudioContextのリソース管理ができること', () => {
      const engine = new AudioEngine();
      
      // 初期化
      engine.init();
      expect(engine.isInitialized).toBe(true);
      
      // リソース使用状況
      const resources = engine.getResourceUsage();
      expect(resources.activeOscillators).toBe(0);
      expect(resources.activeGainNodes).toBe(0);
      
      // クリーンアップ
      engine.destroy();
      expect(engine.isInitialized).toBe(false);
    });

    test('🔴 FAIL: メモリリークが発生しないこと', () => {
      const engine = new AudioEngine();
      
      // 大量の音符を再生・停止
      for (let i = 0; i < 100; i++) {
        const noteId = engine.synthesizeNote(440, 100, 60);
        engine.stopNote(noteId);
      }
      
      // リソースがクリーンアップされていることを確認
      const resources = engine.getResourceUsage();
      expect(resources.activeOscillators).toBe(0);
      expect(resources.activeGainNodes).toBe(0);
    });
  });
});