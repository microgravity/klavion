/**
 * カラースキーム変更のデバッグテスト
 */

const puppeteer = require('puppeteer');

async function debugColorScheme() {
    console.log('🔍 カラースキーム変更デバッグテスト開始');
    
    const browser = await puppeteer.launch({ 
        headless: false,
        devtools: true,
        args: ['--disable-web-security']
    });
    
    const page = await browser.newPage();
    
    try {
        // ページのコンソールログとエラーをキャプチャ
        page.on('console', msg => {
            console.log(`[Page Console ${msg.type()}]:`, msg.text());
        });
        
        page.on('pageerror', error => {
            console.error('[Page Error]:', error.message);
        });
        
        await page.goto('http://localhost:8001', { waitUntil: 'networkidle2' });
        
        // モバイル警告があれば閉じる
        try {
            await page.waitForSelector('#mobile-continue-btn', { timeout: 3000 });
            await page.click('#mobile-continue-btn');
        } catch (e) {
            // 警告なし
        }
        
        // ページの読み込み完了まで少し待機
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // カラースキーム変更前の状態確認
        const beforeChange = await page.evaluate(() => {
            return {
                currentValue: document.getElementById('color-scale').value,
                settingsValue: window.visualizer ? window.visualizer.settings.colorScale : 'no-visualizer'
            };
        });
        
        console.log('変更前:', beforeChange);
        
        // ChangeイベントをリスナーでキャプチャするためのJavaScriptを注入
        await page.evaluate(() => {
            const selector = document.getElementById('color-scale');
            // 既存のリスナーの後に追加
            const originalHandler = selector.onchange;
            selector.addEventListener('change', (e) => {
                console.log('[DEBUG] Change event fired:', e.target.value);
                console.log('[DEBUG] Settings before:', window.visualizer?.settings?.colorScale);
                
                // 少し遅延してから設定値を確認
                setTimeout(() => {
                    console.log('[DEBUG] Settings after delay:', window.visualizer?.settings?.colorScale);
                }, 100);
            });
        });
        
        // カラースキームを変更
        console.log('🎨 カラースキームを "mono-blue" に変更中...');
        
        // プログラマティックに変更（イベント発火）
        await page.evaluate(() => {
            const selector = document.getElementById('color-scale');
            selector.value = 'mono-blue';
            const event = new Event('change', { bubbles: true });
            selector.dispatchEvent(event);
        });
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 変更後の状態確認
        const afterChange = await page.evaluate(() => {
            return {
                currentValue: document.getElementById('color-scale').value,
                settingsValue: window.visualizer ? window.visualizer.settings.colorScale : 'no-visualizer',
                visualizerExists: !!window.visualizer,
                settingsExists: !!(window.visualizer && window.visualizer.settings)
            };
        });
        
        console.log('変更後:', afterChange);
        
        // イベントリスナーが正しく設定されているか確認
        const hasEventListener = await page.evaluate(() => {
            const selector = document.getElementById('color-scale');
            // イベントリスナーの存在確認（完璧ではないが参考情報）
            return {
                hasChangeListener: !!selector.onchange || selector.getEventListeners?.('change')?.length > 0
            };
        });
        
        console.log('イベントリスナー確認:', hasEventListener);
        
        // 実際に音を出してカラーをテスト
        console.log('🎹 音を出してカラーテスト...');
        await page.focus('body');
        await page.keyboard.press('a');
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Three.jsシーンの確認
        const sceneInfo = await page.evaluate(() => {
            if (window.visualizer && window.visualizer.scene) {
                return {
                    childrenCount: window.visualizer.scene.children.length,
                    noteObjects: window.visualizer.scene.children.filter(child => 
                        child.userData && child.userData.isNote
                    ).length
                };
            }
            return { error: 'No scene found' };
        });
        
        console.log('Three.jsシーン情報:', sceneInfo);
        
        console.log('\n🔚 デバッグテスト完了。ブラウザは10秒後に閉じます...');
        await new Promise(resolve => setTimeout(resolve, 10000));
        
    } catch (error) {
        console.error('❌ デバッグテスト中にエラー:', error);
    } finally {
        await browser.close();
    }
}

debugColorScheme().catch(console.error);