/**
 * Jest設定ファイル - Klavion TDDリファクタリング用
 */

module.exports = {
  // テスト環境の設定
  testEnvironment: 'jsdom',
  
  // テストファイルのパターン
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js'
  ],
  
  // カバレッジの設定
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'src/**/*.js',
    'app.js',
    '!src/**/*.test.js',
    '!src/**/*.spec.js',
    '!node_modules/**'
  ],
  
  // カバレッジ閾値（TDD品質基準）
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },
  
  // モジュール解決
  moduleDirectories: ['node_modules', 'src'],
  
  // セットアップファイル
  setupFilesAfterEnv: ['<rootDir>/tests/setup/test-setup.js'],
  
  // ルートディレクトリを明示的に設定
  rootDir: '../../',
  
  // パフォーマンステストのタイムアウト
  testTimeout: 10000,
  
  // モック設定
  clearMocks: true,
  restoreMocks: true,
  
  // 詳細なエラーレポート
  verbose: true,
  
  // パフォーマンス監視 (開発時のみ)
  detectOpenHandles: false,
  detectLeaks: false,
  
  // テスト結果のフォーマット
  reporters: [
    'default',
    ['jest-html-reporters', {
      publicPath: './coverage/test-report',
      filename: 'test-report.html',
      expand: true
    }]
  ]
};