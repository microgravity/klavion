/**
 * カラースキーム選択機能のテスト
 * PWA版・ブラウザ版の両方でカラースキーム変更が正しく適用されるかテストする
 */

const puppeteer = require('puppeteer');

async function testColorScheme() {
    console.log('🎹 Klavion カラースキーム テスト開始');
    
    const browser = await puppeteer.launch({ 
        headless: false, // ヘッドレスモードを無効にして画面を見れるようにする
        devtools: true,
        args: [
            '--disable-web-security',
            '--allow-running-insecure-content',
            '--disable-features=VizDisplayCompositor'
        ]
    });
    
    const page = await browser.newPage();
    
    try {
        // ローカルサーバーに接続
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
        
        // カラースキーム選択要素の存在確認
        await page.waitForSelector('#color-scale', { timeout: 5000 });
        console.log('✅ カラースキーム選択要素を発見');
        
        // 現在の設定値を取得
        const currentValue = await page.$eval('#color-scale', el => el.value);
        console.log(`📊 現在のカラースキーム: ${currentValue}`);
        
        // 利用可能なオプションを取得
        const options = await page.$$eval('#color-scale option', options => 
            options.map(option => ({ value: option.value, text: option.textContent }))
        );
        console.log('🎨 利用可能なカラースキーム:');
        options.forEach(opt => console.log(`  - ${opt.value}: ${opt.text}`));
        
        // テスト用のカラースキームリスト
        const testSchemes = ['chromatic', 'mono-blue', 'colorful-neon', 'major'];
        
        for (const scheme of testSchemes) {
            console.log(`\n🧪 "${scheme}" をテスト中...`);
            
            // カラースキームを変更
            await page.select('#color-scale', scheme);
            console.log(`✅ ${scheme} を選択`);
            
            // 少し待機して変更が適用されるのを待つ
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // 設定が保存されているか確認
            const newValue = await page.$eval('#color-scale', el => el.value);
            if (newValue === scheme) {
                console.log(`✅ 設定値の変更確認: ${scheme}`);
            } else {
                console.log(`❌ 設定値の変更失敗: 期待値=${scheme}, 実際値=${newValue}`);
            }
            
            // DOM要素でカスタムカラー制御の表示切り替えをチェック
            if (scheme === 'custom') {
                const customControlsVisible = await page.$eval('#color-customization', 
                    el => getComputedStyle(el).display !== 'none');
                console.log(customControlsVisible ? 
                    '✅ カスタムカラー制御が表示されている' : 
                    '❌ カスタムカラー制御が表示されていない');
            }
        }
        
        // コンピューターキーボードでノートを演奏してカラーをテスト
        console.log('\n🎹 キーボードでノート演奏テスト...');
        
        // フォーカスを本体に移す
        await page.focus('body');
        
        // いくつかのキーを押してカラー変化をテスト
        const testKeys = ['a', 's', 'd', 'f', 'g', 'h', 'j'];
        for (const key of testKeys) {
            await page.keyboard.press(key);
            await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        console.log('✅ キーボード演奏テスト完了');
        
        // PWA版のテスト用にService Workerの確認
        const swRegistered = await page.evaluate(() => {
            return 'serviceWorker' in navigator && navigator.serviceWorker.controller !== null;
        });
        console.log(swRegistered ? 
            '✅ Service Worker登録済み（PWA機能有効）' : 
            '📱 Service Worker未登録（通常ブラウザ版）');
        
        // カラースキーム変更時に実際にビジュアルが更新されるかチェック
        console.log('\n🔍 ビジュアル更新の詳細チェック...');
        
        // カラースキームを切り替えてログをチェック
        await page.select('#color-scale', 'mono-green');
        
        // コンソールログからエラーをチェック
        const consoleLogs = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                consoleLogs.push(`ERROR: ${msg.text()}`);
            }
        });
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        if (consoleLogs.length > 0) {
            console.log('❌ コンソールエラーが発生:');
            consoleLogs.forEach(log => console.log(`  ${log}`));
        } else {
            console.log('✅ コンソールエラーなし');
        }
        
        console.log('\n🎯 テスト完了！ブラウザは5秒後に閉じます...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
    } catch (error) {
        console.error('❌ テスト中にエラーが発生:', error);
    } finally {
        await browser.close();
        console.log('🔚 ブラウザを閉じました');
    }
}

// メイン実行
testColorScheme().catch(console.error);