/**
 * 音名表示機能の修復テスト
 * 音名が画面に正しく表示されるかを確認
 */

const puppeteer = require('puppeteer');

async function testNoteNameDisplay() {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    
    try {
        console.log('🔍 音名表示機能テスト開始...');
        
        // ブラウザコンソールログをキャプチャ（ページ読み込み前に設定）
        page.on('console', msg => {
            console.log('🌐 ブラウザ:', msg.text());
        });
        
        // ページを読み込み
        await page.goto('http://localhost:8001', { waitUntil: 'networkidle0' });
        
        // 3D環境の初期化を待機
        await page.waitForSelector('#three-container canvas', { timeout: 10000 });
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 初期化状況をチェック
        const debugInfo = await page.evaluate(() => {
            return {
                visualizerExists: !!window.visualizer,
                sceneExists: !!window.visualizer?.scene,
                textureCache: window.visualizer?.textureCache?.size || 0,
                noteNames: !!window.visualizer?.noteNames,
                noteNameStyle: window.visualizer?.settings?.noteNameStyle,
                threeJSAvailable: typeof THREE !== 'undefined',
                initialized: window.visualizer?.initialized,
                containerExists: !!window.visualizer?.container
            };
        });
        
        console.log('📊 初期化状況:', debugInfo);
        
        // マウスクリックで音を鳴らす（音名表示を確認）
        const pianoKey = await page.$('.piano-key[data-note="60"]'); // Middle C
        if (pianoKey) {
            console.log('🎹 ピアノキー（Middle C）をクリック...');
            await pianoKey.click();
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // キーボードで音を鳴らす
        console.log('⌨️  キーボードでAキーを押下...');
        await page.keyboard.press('a'); // Middle C
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 3Dシーン内のスプライト（音名表示）を確認
        const spriteInfo = await page.evaluate(() => {
            if (!window.visualizer?.scene) {
                return { error: 'Scene not found' };
            }
            
            const sprites = [];
            window.visualizer.scene.traverse((object) => {
                if (object.type === 'Sprite') {
                    sprites.push({
                        visible: object.visible,
                        position: {
                            x: object.position.x,
                            y: object.position.y,
                            z: object.position.z
                        },
                        scale: {
                            x: object.scale.x,
                            y: object.scale.y,
                            z: object.scale.z
                        },
                        hasTexture: !!object.material?.map
                    });
                }
            });
            
            return {
                totalSprites: sprites.length,
                visibleSprites: sprites.filter(s => s.visible).length,
                spritesWithTexture: sprites.filter(s => s.hasTexture).length,
                textureCache: window.visualizer.textureCache?.size || 0,
                spritePool: window.visualizer.spritePool?.length || 0
            };
        });
        
        console.log('🎭 スプライト情報:', spriteInfo);
        
        // テクスチャキャッシュの状況確認
        const cacheInfo = await page.evaluate(() => {
            if (!window.visualizer?.textureCache) {
                return { error: 'Texture cache not found' };
            }
            
            const cache = window.visualizer.textureCache;
            const keys = Array.from(cache.keys());
            
            return {
                cacheSize: cache.size,
                sampleKeys: keys.slice(0, 3), // 最初の3つのキー
                allKeys: keys
            };
        });
        
        console.log('🗄️  テクスチャキャッシュ:', cacheInfo);
        
        // 音名表示設定の確認
        const noteNameSettings = await page.evaluate(() => {
            return {
                noteNameStyle: window.visualizer?.settings?.noteNameStyle,
                showVelocityNumbers: window.visualizer?.settings?.showVelocityNumbers,
                availableNoteNames: window.visualizer?.noteNames
            };
        });
        
        console.log('⚙️  音名表示設定:', noteNameSettings);
        
        // 結果判定
        const isFixed = spriteInfo.visibleSprites > 0 && spriteInfo.spritesWithTexture > 0;
        
        if (isFixed) {
            console.log('✅ 音名表示機能が正常に動作しています！');
            console.log(`   - 表示可能なスプライト: ${spriteInfo.visibleSprites}個`);
            console.log(`   - テクスチャ付きスプライト: ${spriteInfo.spritesWithTexture}個`);
        } else {
            console.log('❌ 音名表示に問題があります');
            console.log('   問題の詳細:');
            if (spriteInfo.totalSprites === 0) {
                console.log('   - スプライトが作成されていません');
            }
            if (spriteInfo.visibleSprites === 0) {
                console.log('   - スプライトが非表示状態です');
            }
            if (spriteInfo.spritesWithTexture === 0) {
                console.log('   - スプライトにテクスチャが適用されていません');
            }
        }
        
        return isFixed;
        
    } catch (error) {
        console.error('❌ テスト中にエラーが発生:', error);
        return false;
    } finally {
        await browser.close();
    }
}

// テスト実行
testNoteNameDisplay().then(success => {
    console.log('\n=== テスト結果 ===');
    console.log(success ? '✅ 音名表示修復テスト: 成功' : '❌ 音名表示修復テスト: 失敗');
    process.exit(success ? 0 : 1);
});