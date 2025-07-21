/**
 * レガシーコード削除前のベースライン動作確認テスト
 * 削除後の動作と比較するための基準を確立
 */

const puppeteer = require('puppeteer');

async function testPreDeletionBaseline() {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    
    try {
        console.log('🧪 レガシーコード削除前ベースラインテスト開始...');
        
        // ブラウザコンソールログをキャプチャ
        page.on('console', msg => {
            console.log('🌐 ブラウザ:', msg.text());
        });
        
        // エラーログをキャプチャ
        page.on('pageerror', error => {
            console.log('🚨 ページエラー:', error.message);
        });
        
        // ページを読み込み
        await page.goto('http://localhost:8001', { waitUntil: 'networkidle0' });
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // 基本機能の動作確認
        const baselineTest = await page.evaluate(() => {
            const results = {
                // 基本システム
                visualizerExists: !!window.visualizer,
                audioEngineExists: !!window.visualizer?.audioEngine,
                audioContextExists: !!window.visualizer?.audioContext,
                
                // AudioEngine機能
                audioEngineInitialized: window.visualizer?.audioEngine?.isInitialized,
                availableTimbers: window.visualizer?.audioEngine?.getAvailableTimbers?.() || [],
                currentTimbre: window.visualizer?.audioEngine?.getCurrentTimbre?.(),
                currentVolume: window.visualizer?.audioEngine?.getVolume?.(),
                isMuted: window.visualizer?.audioEngine?.isMuted?.(),
                
                // レガシーメソッドの存在確認（削除対象）
                legacyMethods: {
                    createAcousticPiano: typeof window.visualizer?.createAcousticPiano === 'function',
                    createElectricPiano: typeof window.visualizer?.createElectricPiano === 'function',
                    createOrgan: typeof window.visualizer?.createOrgan === 'function',
                    createStrings: typeof window.visualizer?.createStrings === 'function',
                    createSynthesizer: typeof window.visualizer?.createSynthesizer === 'function',
                    createBell: typeof window.visualizer?.createBell === 'function',
                    createFlute: typeof window.visualizer?.createFlute === 'function'
                },
                
                // DOM Cache機能
                domCacheExists: !!window.visualizer?.domCache,
                domCacheStats: window.visualizer?.getDOMCacheStats?.() || {}
            };
            
            return results;
        });
        
        console.log('📊 削除前ベースライン状況:', baselineTest);
        
        // 音色変更テスト
        const timbreTest = await page.evaluate(() => {
            const audioEngine = window.visualizer.audioEngine;
            const results = {
                originalTimbre: audioEngine.getCurrentTimbre(),
                timbreList: audioEngine.getAvailableTimbers(),
                timbreChanges: []
            };
            
            // 複数の音色をテスト
            const testTimbres = ['electric-piano', 'organ', 'strings'];
            testTimbres.forEach(timbre => {
                audioEngine.setTimbre(timbre);
                results.timbreChanges.push({
                    requested: timbre,
                    actual: audioEngine.getCurrentTimbre(),
                    success: audioEngine.getCurrentTimbre() === timbre
                });
            });
            
            return results;
        });
        
        console.log('🎹 音色変更テスト:', timbreTest);
        
        // 音量制御テスト
        const volumeTest = await page.evaluate(() => {
            const audioEngine = window.visualizer.audioEngine;
            const results = {
                originalVolume: audioEngine.getVolume(),
                volumeChanges: []
            };
            
            // 複数の音量をテスト
            const testVolumes = [0.3, 0.7, 1.0];
            testVolumes.forEach(volume => {
                audioEngine.setVolume(volume);
                results.volumeChanges.push({
                    requested: volume,
                    actual: audioEngine.getVolume(),
                    success: Math.abs(audioEngine.getVolume() - volume) < 0.01
                });
            });
            
            return results;
        });
        
        console.log('🔊 音量制御テスト:', volumeTest);
        
        // 音符再生テスト
        console.log('🎼 音符再生テスト...');
        await page.keyboard.press('a'); // Middle C
        await new Promise(resolve => setTimeout(resolve, 500));
        await page.keyboard.press('s'); // D
        await new Promise(resolve => setTimeout(resolve, 500));
        await page.keyboard.press('d'); // E
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // リソース使用状況確認
        const resourceTest = await page.evaluate(() => {
            return window.visualizer.audioEngine.getResourceUsage();
        });
        
        console.log('📈 リソース使用状況:', resourceTest);
        
        // ファイルサイズ確認（Node.js側で実行）
        const fs = require('fs');
        const stats = fs.statSync('./app.js');
        const fileSizeKB = Math.round(stats.size / 1024);
        
        console.log('📁 現在のファイルサイズ:', fileSizeKB + 'KB');
        
        // 成功判定
        const success = baselineTest.visualizerExists && 
                       baselineTest.audioEngineExists && 
                       baselineTest.audioEngineInitialized && 
                       timbreTest.timbreChanges.every(t => t.success) &&
                       volumeTest.volumeChanges.every(v => v.success);
        
        // ベースライン情報をファイルに保存
        const baselineData = {
            timestamp: new Date().toISOString(),
            fileSizeKB: fileSizeKB,
            baselineTest: baselineTest,
            timbreTest: timbreTest,
            volumeTest: volumeTest,
            resourceTest: resourceTest
        };
        
        fs.writeFileSync('./baseline-before-deletion.json', JSON.stringify(baselineData, null, 2));
        console.log('💾 ベースライン情報を baseline-before-deletion.json に保存しました');
        
        return success;
        
    } catch (error) {
        console.error('❌ テスト中にエラーが発生:', error);
        return false;
    } finally {
        await browser.close();
    }
}

// テスト実行
testPreDeletionBaseline().then(success => {
    console.log('\n=== レガシーコード削除前ベースライン確認結果 ===');
    console.log(success ? '✅ ベースライン確認: 成功' : '❌ ベースライン確認: 失敗');
    process.exit(success ? 0 : 1);
});