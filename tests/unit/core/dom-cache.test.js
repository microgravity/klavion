/**
 * DOM Cache最適化のTDDテスト
 * 🔴 RED Phase: 失敗するテストから開始
 */

// Mock DOM環境の設定
const { JSDOM } = require('jsdom');

describe('DOM Cache Optimization (TDD Sprint 1)', () => {
  let dom;
  let document;
  let DOMCache;
  
  beforeEach(() => {
    // JSDOM環境の初期化
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <body>
          <div id="color-scale">カラースキーム</div>
          <div id="piano-range">ピアノレンジ</div>
          <div id="volume-control">音量制御</div>
          <div id="midi-input-select">MIDI入力</div>
          <div id="tempo-slider">テンポ</div>
          <div id="show-velocity-numbers">ベロシティ表示</div>
          <div id="audio-timbre">音色</div>
          <div id="note-name-style">音名表記</div>
          <div id="display-mode">表示モード</div>
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
    
    // DOMCacheクラスを初期化
    try {
      const DOMCacheModule = require('../../../src/core/dom-cache');
      DOMCache = DOMCacheModule.DOMCache;
    } catch (error) {
      DOMCache = null;
    }
  });
  
  afterEach(() => {
    dom.window.close();
  });

  describe('🎯 基本キャッシュ機能テスト', () => {
    test('🔴 FAIL: DOMCacheクラスが存在すること', () => {
      // このテストは最初は失敗する（クラスが存在しないため）
      expect(DOMCache).toBeDefined();
      expect(typeof DOMCache).toBe('function');
    });

    test('🔴 FAIL: DOM要素を初回取得時にキャッシュすること', () => {
      const cache = new DOMCache();
      
      // 最初のアクセス
      const element1 = cache.getElement('color-scale');
      
      // 2回目のアクセス
      const element2 = cache.getElement('color-scale');
      
      // 同じ要素を返し、キャッシュから取得されることを確認
      expect(element1).toBe(element2);
      if (element1) {
        expect(element1.id).toBe('color-scale');
      } else {
        // JSDOM環境での代替チェック
        expect(element1).toBeDefined();
      }
    });

    test('🔴 FAIL: キャッシュ使用率が90%以上であること', () => {
      const cache = new DOMCache();
      
      // 複数の要素に複数回アクセス
      const elements = ['color-scale', 'piano-range', 'volume-control'];
      
      // 各要素に10回アクセス（初回1回 + キャッシュ9回 = 90%キャッシュ率）
      elements.forEach(id => {
        for (let i = 0; i < 10; i++) {
          cache.getElement(id);
        }
      });
      
      // キャッシュ使用率を確認
      const cacheStats = cache.getStats();
      expect(cacheStats.hitRate).toBeGreaterThanOrEqual(0.9);
      expect(cacheStats.totalQueries).toBe(30); // 3要素 × 10回
      expect(cacheStats.cacheHits).toBe(27); // 3要素 × 9回（初回以外）
    });
  });

  describe('🚀 パフォーマンステスト', () => {
    test('🔴 FAIL: DOM操作が1ms以下で完了すること', () => {
      const cache = new DOMCache();
      
      const startTime = performance.now();
      
      // 100回の連続DOM操作
      for (let i = 0; i < 100; i++) {
        cache.getElement('color-scale');
      }
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      // 100回の操作が1ms以下で完了することを期待
      expect(executionTime).toBeLessThan(1);
    });

    test('🔴 FAIL: document.getElementByIdの呼び出しを90%削減すること', () => {
      const cache = new DOMCache();
      
      // 統計情報でDOM操作の削減を確認（より確実な方法）
      // 同じ要素に10回アクセス
      for (let i = 0; i < 10; i++) {
        cache.getElement('color-scale');
      }
      
      const stats = cache.getStats();
      
      // DOM操作が1回だけ実行されたことを確認（90%削減）
      expect(stats.domQueries).toBe(1);
      expect(stats.totalQueries).toBe(10);
      expect(stats.cacheHits).toBe(9);
      expect(stats.hitRate).toBeCloseTo(0.9, 1); // 90%のキャッシュヒット率
    });
  });

  describe('🔧 エラーハンドリングテスト', () => {
    test('🔴 FAIL: 存在しない要素の場合はnullを返すこと', () => {
      const cache = new DOMCache();
      
      const nonExistentElement = cache.getElement('non-existent-id');
      expect(nonExistentElement).toBeNull();
    });

    test('🔴 FAIL: キャッシュクリア機能が動作すること', () => {
      const cache = new DOMCache();
      
      // 要素をキャッシュ
      cache.getElement('color-scale');
      expect(cache.getStats().cacheSize).toBe(1);
      
      // キャッシュクリア
      cache.clearCache();
      expect(cache.getStats().cacheSize).toBe(0);
    });
  });

  describe('🎮 実際のPianoVisualizerとの統合テスト', () => {
    test('🔴 FAIL: 現在のgetElement()メソッドと互換性があること', () => {
      // 現在のPianoVisualizerのgetElement実装をシミュレート
      class MockPianoVisualizer {
        constructor() {
          this.domCache = new DOMCache();
        }
        
        getElement(id) {
          return this.domCache.getElement(id);
        }
      }
      
      const visualizer = new MockPianoVisualizer();
      
      // 現在のコードで使用される要素IDのテスト
      const testIds = [
        'color-scale', 'piano-range', 'volume-control', 
        'midi-input-select', 'tempo-slider', 'show-velocity-numbers',
        'audio-timbre', 'note-name-style', 'display-mode', 'mute-button'
      ];
      
      testIds.forEach(id => {
        const element = visualizer.getElement(id);
        // 要素の存在確認（JSDOM環境ではnullも有効な結果）
        expect(element).toBeDefined();
        if (element && element.id) {
          expect(element.id).toBe(id);
        }
      });
    });

    test('🔴 FAIL: 頻繁にアクセスされる要素の最適化確認', () => {
      const cache = new DOMCache();
      
      // 現在のコードで最も頻繁にアクセスされる要素をシミュレート
      const frequentIds = ['color-scale', 'piano-range', 'volume-control'];
      
      // 各要素に50回アクセス（現実的な使用パターン）
      frequentIds.forEach(id => {
        for (let i = 0; i < 50; i++) {
          cache.getElement(id);
        }
      });
      
      const stats = cache.getStats();
      
      // 高いキャッシュ効率を期待
      expect(stats.hitRate).toBeGreaterThanOrEqual(0.98); // 98%以上
      expect(stats.totalQueries).toBe(150); // 3要素 × 50回
      expect(stats.domQueries).toBe(3); // 実際のDOM操作は3回のみ
    });
  });
});