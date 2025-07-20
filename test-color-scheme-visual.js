/**
 * カラースキーム選択機能の視覚的テスト
 * 実際にカラー変更が適用されているかを詳細にテストする
 */

const puppeteer = require('puppeteer');

async function testColorSchemeVisual() {
    console.log('🎨 Klavion カラースキーム視覚テスト開始');
    
    const browser = await puppeteer.launch({ 
        headless: false,
        devtools: true,
        args: [
            '--disable-web-security',
            '--allow-running-insecure-content',
            '--disable-features=VizDisplayCompositor'
        ]
    });
    
    const page = await browser.newPage();
    
    try {
        await page.goto('http://localhost:8001', { waitUntil: 'networkidle2' });
        console.log('✅ ページ読み込み完了');
        
        // モバイル警告モーダルがあれば閉じる
        try {
            await page.waitForSelector('#mobile-continue-btn', { timeout: 3000 });
            await page.click('#mobile-continue-btn');
            console.log('✅ モバイル警告を閉じました');
        } catch (e) {
            console.log('📱 モバイル警告なし（PC表示）');
        }
        
        // コンソールログのキャプチャ
        const colorLogs = [];
        page.on('console', msg => {
            if (msg.text().includes('[Color]')) {
                colorLogs.push(msg.text());
            }
        });
        
        await page.waitForSelector('#color-scale', { timeout: 5000 });
        
        // カラースキーム変更のテスト
        const testSchemes = [
            { scheme: 'mono-blue', expected: 'Blue Mono' },
            { scheme: 'colorful-neon', expected: 'Neon' },
            { scheme: 'major', expected: 'Major Scale' },
            { scheme: 'chromatic', expected: 'Chromatic' }
        ];
        
        for (const test of testSchemes) {
            console.log(`\n🎨 "${test.scheme}" (${test.expected}) をテスト中...`);
            
            // カラースキーム変更
            await page.select('#color-scale', test.scheme);
            
            // 少し待機
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // フォーカスして音を出す
            await page.focus('body');
            
            // キーを押してノートを演奏（カラー変化の確認）
            console.log('🎹 ノート演奏でカラー確認中...');
            const testKeys = ['a', 's', 'd'];
            for (const key of testKeys) {
                await page.keyboard.down(key);
                await new Promise(resolve => setTimeout(resolve, 300));
                await page.keyboard.up(key);
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            // Three.jsオブジェクトの数を確認
            const objectCount = await page.evaluate(() => {
                if (window.visualizer && window.visualizer.scene) {
                    return window.visualizer.scene.children.length;
                }
                return 0;
            });
            
            console.log(`✅ Three.jsシーンオブジェクト数: ${objectCount}`);
            
            // カラースキーム設定の確認
            const currentScheme = await page.evaluate(() => {
                if (window.visualizer && window.visualizer.settings) {
                    return window.visualizer.settings.colorScale;
                }
                return null;
            });
            
            if (currentScheme === test.scheme) {
                console.log(`✅ 設定反映確認: ${test.scheme}`);
            } else {
                console.log(`❌ 設定反映失敗: 期待=${test.scheme}, 実際=${currentScheme}`);
            }
            
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // カスタムカラーのテスト
        console.log('\n🎨 カスタムカラーをテスト中...');
        await page.select('#color-scale', 'custom');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // カスタムカラー制御が表示されているか確認
        const customControlsVisible = await page.$eval('#color-customization', 
            el => getComputedStyle(el).display !== 'none');
        
        if (customControlsVisible) {
            console.log('✅ カスタムカラー制御が表示されている');
            
            // カラーピッカーの色を変更
            await page.click('#base-color-picker');
            await page.evaluate(() => {
                const picker = document.getElementById('base-color-picker');
                picker.value = '#ff6b35'; // オレンジ色
                picker.dispatchEvent(new Event('change', { bubbles: true }));
            });
            
            // 色コード入力欄での変更
            await page.focus('#color-code-input');
            await page.keyboard.selectAll();
            await page.keyboard.type('#ff6b35');
            await page.click('#apply-color-code');
            
            console.log('✅ カスタムカラー設定完了');
            
            // カスタムカラーでノート演奏
            await page.focus('body');
            await page.keyboard.press('a');
            await new Promise(resolve => setTimeout(resolve, 500));
            
        } else {
            console.log('❌ カスタムカラー制御が表示されていない');
        }
        
        // ログの確認
        console.log('\n📋 カラー変更ログ:');
        colorLogs.forEach(log => console.log(`  ${log}`));
        
        // 最終確認
        const finalScheme = await page.evaluate(() => {
            if (window.visualizer && window.visualizer.settings) {
                return {
                    colorScale: window.visualizer.settings.colorScale,
                    customBaseColor: window.visualizer.settings.customBaseColor
                };
            }
            return null;
        });
        
        console.log('\n🎯 最終設定状態:');
        console.log(`  カラースキーム: ${finalScheme?.colorScale || 'unknown'}`);
        console.log(`  カスタムベースカラー: ${finalScheme?.customBaseColor || 'unknown'}`);
        
        console.log('\n✅ 視覚テスト完了！ブラウザは3秒後に閉じます...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
    } catch (error) {
        console.error('❌ テスト中にエラーが発生:', error);
    } finally {
        await browser.close();
        console.log('🔚 ブラウザを閉じました');
    }
}

// メイン実行
testColorSchemeVisual().catch(console.error);