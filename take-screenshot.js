const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    console.log('📸 現在のUIスクリーンショット取得開始...');
    
    const browser = await puppeteer.launch({ 
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    try {
        console.log('🌐 本番サイトにアクセス中...');
        await page.goto('https://microgravity.github.io/klavion', { 
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
                await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 1000)));
            }
        } catch (e) {
            console.log('📱 モバイル警告なし（PC表示）');
        }

        // UIが完全に読み込まれるまで待機
        await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 3000)));

        // カラースキームを美しいものに変更
        console.log('🎨 カラースキームを設定中...');
        const colorSelect = await page.$('#color-scale');
        if (colorSelect) {
            await colorSelect.select('retro-synthwave');
            await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 1000)));
        }

        // 音色を設定
        const timbreSelect = await page.$('#audio-timbre');
        if (timbreSelect) {
            await timbreSelect.select('electric-piano');
            await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 500)));
        }

        // いくつかのキーを押してビジュアルを表示
        console.log('🎹 演奏デモ実行中...');
        const keys = ['a', 's', 'd', 'f', 'g'];
        for (let i = 0; i < keys.length; i++) {
            await page.keyboard.press(keys[i]);
            await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 200)));
        }

        // ビジュアルエフェクトが表示されるまで少し待機
        await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 2000)));

        // スクリーンショット撮影
        console.log('📸 スクリーンショット撮影中...');
        await page.screenshot({
            path: './src/img/scr-new.jpg',
            type: 'jpeg',
            quality: 90,
            fullPage: false
        });

        console.log('✅ スクリーンショット保存完了: ./src/img/scr-new.jpg');

        // 既存のスクリーンショットをバックアップ
        if (fs.existsSync('./src/img/scr.jpg')) {
            fs.renameSync('./src/img/scr.jpg', './src/img/scr-backup.jpg');
            console.log('📁 既存スクリーンショットをバックアップ');
        }

        // 新しいスクリーンショットをリネーム
        fs.renameSync('./src/img/scr-new.jpg', './src/img/scr.jpg');
        console.log('🔄 新しいスクリーンショットを適用');

        console.log('🎉 スクリーンショット更新完了！');

    } catch (error) {
        console.error('❌ エラー:', error.message);
    } finally {
        await browser.close();
        console.log('🔚 ブラウザを閉じました');
    }

    console.log('\n=== スクリーンショット更新結果 ===');
    console.log('✅ 現在のUIスクリーンショット取得: 成功');
    console.log('📁 保存先: ./src/img/scr.jpg');
    console.log('🔄 README.mdで使用中のパスも自動対応済み');

    process.exit(0);
})();