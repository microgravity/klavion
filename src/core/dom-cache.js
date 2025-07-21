/**
 * DOM Cache クラス - TDD Green Phase実装
 * 🟢 GREEN: テストを通すための最小限の実装
 */

class DOMCache {
  constructor() {
    this.cache = new Map();
    this.stats = {
      totalQueries: 0,
      cacheHits: 0,
      domQueries: 0
    };
  }

  /**
   * DOM要素を取得（キャッシュ機能付き）
   * @param {string} id - 要素のID
   * @returns {Element|null} - DOM要素またはnull
   */
  getElement(id) {
    this.stats.totalQueries++;

    // キャッシュに存在する場合
    if (this.cache.has(id)) {
      this.stats.cacheHits++;
      return this.cache.get(id);
    }

    // DOM から要素を取得
    this.stats.domQueries++;
    const element = document.getElementById(id);
    
    // 結果をキャッシュ（nullでもキャッシュして再クエリを防ぐ）
    this.cache.set(id, element);
    
    return element;
  }

  /**
   * キャッシュ統計情報を取得
   * @returns {Object} - 統計情報
   */
  getStats() {
    return {
      totalQueries: this.stats.totalQueries,
      cacheHits: this.stats.cacheHits,
      domQueries: this.stats.domQueries,
      hitRate: this.stats.totalQueries > 0 ? this.stats.cacheHits / this.stats.totalQueries : 0,
      cacheSize: this.cache.size
    };
  }

  /**
   * キャッシュをクリア
   */
  clearCache() {
    this.cache.clear();
    this.stats = {
      totalQueries: 0,
      cacheHits: 0,
      domQueries: 0
    };
  }
}

// モジュールエクスポート
module.exports = { DOMCache };