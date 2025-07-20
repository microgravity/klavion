/**
 * AudioEngine統合テスト - app.jsとの統合確認
 * 🔵 REFACTOR フェーズのテスト
 */

const puppeteer = require('puppeteer');

async function testAudioEngineIntegration() {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    
    try {
        console.log('🔵 AudioEngine統合テスト開始...');
        
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
        
        // AudioEngine統合状況をテスト
        const integrationTest = await page.evaluate(() => {
            const results = {
                visualizerExists: !!window.visualizer,
                audioEngineExists: !!window.visualizer?.audioEngine,
                audioEngineIsInstance: window.visualizer?.audioEngine?.constructor?.name === 'AudioEngine',
                audioContextExists: !!window.visualizer?.audioContext,
                analyserNodeExists: !!window.visualizer?.analyserNode,
                masterGainNodeExists: !!window.visualizer?.masterGainNode,
                audioInitialized: false,
                audioEngineInitialized: false
            };
            
            if (results.audioEngineExists) {
                results.audioEngineInitialized = window.visualizer.audioEngine.isInitialized;
                results.audioInitialized = !!window.visualizer.audioContext;
            }
            
            return results;
        });
        
        console.log('📊 AudioEngine統合状況:', integrationTest);
        
        // 基本チェック
        if (!integrationTest.audioEngineExists) {
            throw new Error('AudioEngine インスタンスが存在しません');
        }
        
        if (!integrationTest.audioEngineIsInstance) {
            throw new Error('audioEngine が AudioEngine クラスのインスタンスではありません');
        }
        
        // AudioEngine機能テスト
        const functionalTest = await page.evaluate(() => {
            const audioEngine = window.visualizer.audioEngine;
            const results = {
                hasGetAvailableTimbers: typeof audioEngine.getAvailableTimbers === 'function',
                hasSetTimbre: typeof audioEngine.setTimbre === 'function',
                hasSetVolume: typeof audioEngine.setVolume === 'function',
                hasSetMuted: typeof audioEngine.setMuted === 'function',
                hasSynthesizeNote: typeof audioEngine.synthesizeNote === 'function',
                availableTimbers: [],
                initialVolume: 0,
                initialMuted: false
            };
            
            if (results.hasGetAvailableTimbers) {
                results.availableTimbers = audioEngine.getAvailableTimbers();
            }
            
            if (results.hasSetVolume) {
                results.initialVolume = audioEngine.getVolume();
            }
            
            if (results.hasSetMuted) {
                results.initialMuted = audioEngine.isMuted();
            }
            
            return results;
        });
        
        console.log('🎵 AudioEngine機能テスト:', functionalTest);
        
        // 音色テスト
        const timbreTest = await page.evaluate(() => {
            const audioEngine = window.visualizer.audioEngine;
            const results = {
                originalTimbre: audioEngine.getCurrentTimbre(),
                timbreChangeSuccess: false,
                newTimbre: null
            };
            
            // 音色を変更
            audioEngine.setTimbre('electric-piano');
            results.newTimbre = audioEngine.getCurrentTimbre();
            results.timbreChangeSuccess = (results.newTimbre === 'electric-piano');
            
            return results;
        });
        
        console.log('🎹 音色変更テスト:', timbreTest);
        
        // 音量テスト
        const volumeTest = await page.evaluate(() => {
            const audioEngine = window.visualizer.audioEngine;
            const results = {
                originalVolume: audioEngine.getVolume(),
                volumeChangeSuccess: false,
                newVolume: 0
            };
            
            // 音量を変更
            audioEngine.setVolume(0.5);
            results.newVolume = audioEngine.getVolume();
            results.volumeChangeSuccess = (results.newVolume === 0.5);
            
            return results;
        });
        
        console.log('🔊 音量制御テスト:', volumeTest);
        
        // アプリケーション動作確認
        console.log('🎹 アプリケーション動作確認...');
        await page.keyboard.press('a'); // Middle C
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // アクティブノート確認
        const noteTest = await page.evaluate(() => {
            const audioEngine = window.visualizer.audioEngine;
            return {
                activeNotesCount: audioEngine.getActiveNotes().length,
                resourceUsage: audioEngine.getResourceUsage()
            };
        });
        
        console.log('🎼 音符再生テスト:', noteTest);
        
        const success = integrationTest.audioEngineExists && 
                       integrationTest.audioEngineIsInstance && 
                       functionalTest.hasGetAvailableTimbers && 
                       functionalTest.hasSetTimbre && 
                       functionalTest.hasSetVolume && 
                       functionalTest.hasSetMuted && 
                       timbreTest.timbreChangeSuccess && 
                       volumeTest.volumeChangeSuccess;
        
        return success;
        
    } catch (error) {
        console.error('❌ テスト中にエラーが発生:', error);
        return false;
    } finally {
        await browser.close();
    }
}

// テスト実行
testAudioEngineIntegration().then(success => {
    console.log('\n=== AudioEngine統合テスト結果 ===');
    console.log(success ? '✅ 統合テスト: 成功' : '❌ 統合テスト: 失敗');
    process.exit(success ? 0 : 1);
});