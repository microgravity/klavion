/**
 * DOM Cache統合テスト - 実際のアプリケーションでのパフォーマンス検証
 * 🔵 REFACTOR フェーズのテスト
 */

const puppeteer = require('puppeteer');

async function testDOMCacheIntegration() {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    
    try {
        console.log('🔵 DOM Cache統合テスト開始...');
        
        // ブラウザコンソールログをキャプチャ
        page.on('console', msg => {
            console.log('🌐 ブラウザ:', msg.text());
        });
        
        // ページを読み込み
        await page.goto('http://localhost:8001', { waitUntil: 'networkidle0' });
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // DOM Cacheの統合状況をテスト
        const integrationTest = await page.evaluate(() => {
            const results = {
                visualizerExists: !!window.visualizer,
                domCacheExists: !!window.visualizer?.domCache,
                domCacheIsInstance: window.visualizer?.domCache?.constructor?.name === 'DOMCache',
                getElementWorks: false,
                statsAvailable: false,
                initialStats: null
            };
            
            if (results.domCacheExists) {
                // getElement メソッドをテスト
                try {
                    const element = window.visualizer.getElement('color-scale');
                    results.getElementWorks = !!element;
                } catch (error) {
                    results.getElementError = error.message;
                }
                
                // 統計情報を取得
                try {
                    results.initialStats = window.visualizer.getDOMCacheStats();
                    results.statsAvailable = true;
                } catch (error) {
                    results.statsError = error.message;
                }
            }
            
            return results;
        });
        
        console.log('📊 DOM Cache統合状況:', integrationTest);
        
        if (!integrationTest.domCacheExists) {
            throw new Error('DOMCache インスタンスが存在しません');
        }
        
        if (!integrationTest.domCacheIsInstance) {
            throw new Error('domCache が DOMCache クラスのインスタンスではありません');
        }
        
        // DOM要素への複数回アクセスでキャッシュ効果をテスト
        const performanceTest = await page.evaluate(() => {
            const elements = ['color-scale', 'piano-range', 'volume-control', 'midi-input-select'];
            const iterations = 100;
            
            // 初期統計をリセット
            window.visualizer.domCache.clearCache();
            
            const startTime = performance.now();
            
            // 各要素に複数回アクセス
            for (let i = 0; i < iterations; i++) {
                elements.forEach(id => {
                    window.visualizer.getElement(id);
                });
            }
            
            const endTime = performance.now();
            const stats = window.visualizer.getDOMCacheStats();
            
            return {
                executionTime: endTime - startTime,
                totalQueries: stats.totalQueries,
                cacheHits: stats.cacheHits,
                domQueries: stats.domQueries,
                hitRate: stats.hitRate,
                cacheSize: stats.cacheSize,
                expectedQueries: elements.length * iterations,
                expectedDomQueries: elements.length // 初回のみ
            };
        });
        
        console.log('🚀 パフォーマンステスト結果:', performanceTest);
        
        // パフォーマンス検証
        const isPerformant = performanceTest.executionTime < 10; // 10ms以下
        const isEfficient = performanceTest.hitRate >= 0.9; // 90%以上のキャッシュヒット率
        const correctDomQueries = performanceTest.domQueries === performanceTest.expectedDomQueries;
        
        console.log('\n=== パフォーマンス評価 ===');
        console.log(`⏱️  実行時間: ${performanceTest.executionTime.toFixed(2)}ms ${isPerformant ? '✅' : '❌'}`);
        console.log(`🎯 キャッシュヒット率: ${(performanceTest.hitRate * 100).toFixed(1)}% ${isEfficient ? '✅' : '❌'}`);
        console.log(`🔍 DOM操作削減: ${performanceTest.domQueries}/${performanceTest.totalQueries} ${correctDomQueries ? '✅' : '❌'}`);
        console.log(`📦 キャッシュサイズ: ${performanceTest.cacheSize} 要素`);
        
        // 音を鳴らしてアプリケーション動作確認
        console.log('\n🎹 アプリケーション動作確認...');
        await page.keyboard.press('a'); // Middle C
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 最終統計
        const finalStats = await page.evaluate(() => {
            return window.visualizer.getDOMCacheStats();
        });
        
        console.log('📈 最終統計:', finalStats);
        
        const success = integrationTest.domCacheExists && 
                       integrationTest.getElementWorks && 
                       integrationTest.statsAvailable && 
                       isPerformant && 
                       isEfficient && 
                       correctDomQueries;
        
        return success;
        
    } catch (error) {
        console.error('❌ テスト中にエラーが発生:', error);
        return false;
    } finally {
        await browser.close();
    }
}

// テスト実行
testDOMCacheIntegration().then(success => {
    console.log('\n=== DOM Cache統合テスト結果 ===');
    console.log(success ? '✅ 統合テスト: 成功' : '❌ 統合テスト: 失敗');
    process.exit(success ? 0 : 1);
});