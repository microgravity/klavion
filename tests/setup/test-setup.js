/**
 * テスト環境セットアップ - Klavion TDD
 */

// Node.js環境での不足するAPIのポリフィル
global.TextEncoder = global.TextEncoder || require('util').TextEncoder;
global.TextDecoder = global.TextDecoder || require('util').TextDecoder;

// Performance API のポリフィル
global.performance = global.performance || {
  now: () => Date.now()
};

// DOM環境の拡張設定
beforeEach(() => {
  // テスト間でのグローバル状態リセット
  if (global.document) {
    // イベントリスナーのクリア
    const elements = global.document.querySelectorAll('*');
    elements.forEach(el => {
      if (el.cloneNode) {
        const newEl = el.cloneNode(true);
        if (el.parentNode) {
          el.parentNode.replaceChild(newEl, el);
        }
      }
    });
  }
});

// パフォーマンステスト用のヘルパー
global.measurePerformance = (fn, iterations = 100) => {
  const startTime = performance.now();
  
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  
  const endTime = performance.now();
  return {
    totalTime: endTime - startTime,
    averageTime: (endTime - startTime) / iterations,
    iterations
  };
};

// DOM要素作成ヘルパー
global.createTestElement = (id, tagName = 'div', attributes = {}) => {
  if (!global.document) {
    throw new Error('Document not available in test environment');
  }
  
  const element = global.document.createElement(tagName);
  element.id = id;
  
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
  
  return element;
};

// モックDOM要素群の作成
global.createKlavionTestDOM = () => {
  if (!global.document) {
    throw new Error('Document not available in test environment');
  }
  
  const testElements = [
    'color-scale', 'piano-range', 'volume-control', 'midi-input-select',
    'tempo-slider', 'show-velocity-numbers', 'audio-timbre', 'note-name-style',
    'display-mode', 'mute-button', 'fullscreen-btn', 'three-container',
    'piano-keyboard', 'spectrum-canvas', 'modal-close', 'modal-ok',
    'mobile-continue-btn', 'pwa-install-btn'
  ];
  
  const body = global.document.body;
  
  testElements.forEach(id => {
    if (!global.document.getElementById(id)) {
      const element = createTestElement(id);
      body.appendChild(element);
    }
  });
  
  return testElements;
};

// TDD フェーズ表示ヘルパー
global.logTDDPhase = (phase, message) => {
  const phases = {
    RED: '🔴',
    GREEN: '🟢', 
    REFACTOR: '🔵'
  };
  
  console.log(`${phases[phase]} ${phase}: ${message}`);
};

// Jest拡張マッチャー
expect.extend({
  toBeWithinPerformanceLimit(received, limit) {
    const pass = received <= limit;
    return {
      message: () => 
        pass 
          ? `Expected ${received}ms to be greater than ${limit}ms`
          : `Expected ${received}ms to be within ${limit}ms performance limit`,
      pass
    };
  },
  
  toHaveHighCacheHitRate(received, minRate = 0.9) {
    const pass = received >= minRate;
    return {
      message: () =>
        pass
          ? `Expected cache hit rate ${received} to be less than ${minRate}`
          : `Expected cache hit rate ${received} to be at least ${minRate}`,
      pass
    };
  }
});