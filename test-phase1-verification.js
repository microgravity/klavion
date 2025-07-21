/**
 * フェーズ1削除後の動作確認テスト
 * 統合AudioEngineの機能確認
 */

const puppeteer = require('puppeteer');

async function testPhase1Verification() {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    
    try {
        console.log('✂️ フェーズ1削除後動作確認テスト開始...');
        
        // ページを読み込み
        await page.goto('http://localhost:8001', { waitUntil: 'networkidle0' });
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // 統合AudioEngineの動作確認
        const functionalTest = await page.evaluate(() => {
            const results = {
                // 基本システム
                visualizerExists: !!window.visualizer,
                audioEngineExists: !!window.visualizer?.audioEngine,
                audioContextExists: !!window.visualizer?.audioContext,
                
                // AudioEngine機能テスト
                hasGetAvailableTimbers: typeof window.visualizer?.audioEngine?.getAvailableTimbers === 'function',
                hasSetTimbre: typeof window.visualizer?.audioEngine?.setTimbre === 'function',
                hasSetVolume: typeof window.visualizer?.audioEngine?.setVolume === 'function',
                hasSynthesizeNote: typeof window.visualizer?.audioEngine?.synthesizeNote === 'function',
                
                // 統合AudioEngineの実際の値
                availableTimbers: [],
                currentTimbre: null,
                currentVolume: null,
                isMuted: null,
                isInitialized: null
            };
            
            if (results.audioEngineExists) {
                const ae = window.visualizer.audioEngine;
                results.availableTimbers = ae.getAvailableTimbers?.() || [];
                results.currentTimbre = ae.getCurrentTimbre?.();
                results.currentVolume = ae.getVolume?.();
                results.isMuted = ae.isMuted?.();
                results.isInitialized = ae.isInitialized;
            }
            
            return results;
        });
        
        console.log('📊 統合AudioEngine機能テスト:', functionalTest);
        
        // 音色変更テスト
        const timbreTest = await page.evaluate(() => {
            const ae = window.visualizer.audioEngine;
            const results = {
                originalTimbre: ae.getCurrentTimbre(),
                changeResults: []
            };
            
            // 複数の音色をテスト
            const testTimbres = ['electric-piano', 'organ', 'strings'];
            testTimbres.forEach(timbre => {
                ae.setTimbre(timbre);
                results.changeResults.push({
                    requested: timbre,
                    actual: ae.getCurrentTimbre(),
                    success: ae.getCurrentTimbre() === timbre
                });
            });
            
            return results;
        });
        
        console.log('🎹 音色変更テスト:', timbreTest);
        
        // 音量制御テスト
        const volumeTest = await page.evaluate(() => {
            const ae = window.visualizer.audioEngine;
            const results = {
                originalVolume: ae.getVolume(),
                volumeChanges: []
            };
            
            const testVolumes = [0.3, 0.8, 1.0];
            testVolumes.forEach(volume => {
                ae.setVolume(volume);
                results.volumeChanges.push({
                    requested: volume,
                    actual: ae.getVolume(),
                    success: Math.abs(ae.getVolume() - volume) < 0.01
                });
            });
            
            return results;
        });
        
        console.log('🔊 音量制御テスト:', volumeTest);
        
        // 音符再生テスト
        console.log('🎼 音符再生テスト...');
        await page.keyboard.press('a'); // Middle C
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // リソース状況確認
        const resourceTest = await page.evaluate(() => {
            return window.visualizer.audioEngine.getResourceUsage();
        });
        
        console.log('📈 リソース使用状況:', resourceTest);
        
        // ファイルサイズ確認
        const fs = require('fs');
        const stats = fs.statSync('./app.js');
        const fileSizeKB = Math.round(stats.size / 1024);
        
        console.log('📁 削減後のファイルサイズ:', fileSizeKB + 'KB');
        
        // ベースラインとの比較
        try {
            const baseline = JSON.parse(fs.readFileSync('./baseline-before-deletion.json', 'utf8'));
            const reduction = baseline.fileSizeKB - fileSizeKB;
            console.log('📉 サイズ削減効果:', reduction + 'KB削減');
        } catch (error) {
            console.log('⚠️ ベースライン比較ファイルが見つかりません');
        }
        
        // 成功判定
        const success = functionalTest.visualizerExists && 
                       functionalTest.audioEngineExists &&
                       functionalTest.hasGetAvailableTimbers &&
                       functionalTest.hasSetTimbre &&
                       functionalTest.hasSetVolume &&
                       functionalTest.hasSynthesizeNote &&
                       timbreTest.changeResults.every(t => t.success) &&
                       volumeTest.volumeChanges.every(v => v.success);
        
        return success;
        
    } catch (error) {
        console.error('❌ テスト中にエラーが発生:', error);
        return false;
    } finally {
        await browser.close();
    }
}

// テスト実行
testPhase1Verification().then(success => {
    console.log('\n=== フェーズ1削除後動作確認結果 ===');
    console.log(success ? '✅ フェーズ1動作確認: 成功' : '❌ フェーズ1動作確認: 失敗');
    process.exit(success ? 0 : 1);
});