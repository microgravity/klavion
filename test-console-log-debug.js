const puppeteer = require('puppeteer');

(async () => {
    console.log('🔍 Console.log残存デバッグテスト開始...');
    
    const browser = await puppeteer.launch({ 
        headless: false, 
        devtools: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // コンソールログを全てキャプチャ
    const consoleLogs = [];
    page.on('console', msg => {
        consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
        console.log(`🌐 [${msg.type()}]:`, msg.text());
    });

    try {
        console.log('📱 本番サイトにアクセス中...');
        await page.goto('http://localhost:8002', { 
            waitUntil: 'networkidle0',
            timeout: 30000 
        });

        console.log('✅ ページ読み込み完了');

        // モバイル警告を閉じる
        try {
            const closeButton = await page.$('.mobile-warning .close-button');
            if (closeButton) {
                await closeButton.click();
                console.log('✅ モバイル警告を閉じました');
            }
        } catch (e) {
            console.log('📱 モバイル警告なし（PC表示）');
        }

        // 初期化待機
        await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 3000)));

        console.log('🎹 アプリケーション操作テスト...');
        
        // キーボードでノートを演奏
        await page.keyboard.press('a'); // C4
        await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 500)));
        await page.keyboard.press('s'); // D4
        await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 500)));
        await page.keyboard.press('d'); // E4
        await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 500)));

        // カラースキーム変更テスト
        const colorSelect = await page.$('#color-scale');
        if (colorSelect) {
            await colorSelect.select('mono-blue');
            console.log('🎨 カラースキーム変更実行');
            await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 1000)));
        }

        // 音色変更テスト
        const timbreSelect = await page.$('#audio-timbre');
        if (timbreSelect) {
            await timbreSelect.select('electric');
            console.log('🎵 音色変更実行');
            await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 1000)));
        }

        // Service Worker関連のログ確認
        console.log('🔧 Service Worker状況確認...');
        const swRegistered = await page.evaluate(() => {
            return navigator.serviceWorker.controller !== null;
        });
        console.log(`📋 Service Worker登録状況: ${swRegistered ? '登録済み' : '未登録'}`);

        // 最終的なコンソールログ確認
        await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 2000)));

        console.log('\n📊 コンソールログ分析結果:');
        console.log(`📝 総ログ数: ${consoleLogs.length}`);
        
        if (consoleLogs.length === 0) {
            console.log('✅ コンソールログは完全にクリーンです！');
        } else {
            console.log('❌ 以下のログが検出されました:');
            consoleLogs.forEach((log, index) => {
                console.log(`  ${index + 1}. ${log}`);
            });

            // ログの種類別分析
            const logTypes = {};
            consoleLogs.forEach(log => {
                const type = log.split(']')[0].replace('[', '');
                logTypes[type] = (logTypes[type] || 0) + 1;
            });

            console.log('\n📈 ログ種類別統計:');
            Object.entries(logTypes).forEach(([type, count]) => {
                console.log(`  ${type}: ${count}個`);
            });

            // 削除対象ログの特定
            const consoleLogMessages = consoleLogs.filter(log => 
                log.includes('[Init]') || 
                log.includes('[ThreeJS]') || 
                log.includes('[Color]') || 
                log.includes('[SW]')
            );

            if (consoleLogMessages.length > 0) {
                console.log('\n🎯 削除対象のログ:');
                consoleLogMessages.forEach((log, index) => {
                    console.log(`  ${index + 1}. ${log}`);
                });
            }
        }

        // ネットワークリソース確認
        console.log('\n🌐 読み込まれたリソース確認...');
        const resources = await page.evaluate(() => {
            const entries = performance.getEntriesByType('resource');
            return entries.map(entry => ({
                name: entry.name,
                size: entry.transferSize,
                type: entry.initiatorType
            })).filter(r => r.name.includes('klavion') || r.name.includes('app.js') || r.name.includes('sw.js'));
        });

        resources.forEach(resource => {
            console.log(`📦 ${resource.name} (${resource.size}B) [${resource.type}]`);
        });

        console.log('\n🔚 テスト完了。ブラウザは10秒後に閉じます...');
        await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 10000)));

    } catch (error) {
        console.error('❌ テストエラー:', error.message);
    } finally {
        await browser.close();
        console.log('🔚 ブラウザを閉じました');
    }

    // 結果サマリー
    const success = consoleLogs.length === 0;
    console.log('\n=== Console.logデバッグテスト結果 ===');
    console.log(success ? '✅ コンソールログ削除: 成功' : '❌ コンソールログ削除: 未完了');
    
    if (!success) {
        console.log('\n📋 次のアクション:');
        console.log('1. 検出されたログの発生源を特定');
        console.log('2. 該当ファイルからログ文を削除');
        console.log('3. 再テスト・デプロイ実行');
    }

    process.exit(success ? 0 : 1);
})();