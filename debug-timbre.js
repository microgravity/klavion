const puppeteer = require('puppeteer');

async function debugTimbreIssue() {
    console.log('Starting Puppeteer debug session...');
    
    const browser = await puppeteer.launch({
        headless: false,
        devtools: true,
        args: ['--no-sandbox', '--disable-web-security']
    });
    
    const page = await browser.newPage();
    
    // コンソールメッセージをキャプチャ
    page.on('console', msg => {
        console.log('BROWSER:', msg.text());
    });
    
    // エラーをキャプチャ
    page.on('pageerror', err => {
        console.error('PAGE ERROR:', err.message);
    });
    
    try {
        console.log('Loading page...');
        await page.goto('http://localhost:8000', { waitUntil: 'networkidle0' });
        
        // ページが完全に読み込まれるまで待機
        await page.waitForSelector('#audio-timbre');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('=== DEBUGGING TIMBRE SELECTION ===');
        
        // 現在の音色設定を確認
        const currentTimbre = await page.evaluate(() => {
            return {
                selectValue: document.getElementById('audio-timbre').value,
                settingsValue: window.app?.settings?.audioTimbre,
                audioEngineTimbre: window.app?.audioEngine?.getCurrentTimbre?.()
            };
        });
        console.log('Current timbre states:', currentTimbre);
        
        // 音色を「なし」に変更
        console.log('Changing timbre to "none"...');
        await page.select('#audio-timbre', 'none');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 変更後の状態を確認
        const afterChange = await page.evaluate(() => {
            return {
                selectValue: document.getElementById('audio-timbre').value,
                settingsValue: window.app?.settings?.audioTimbre,
                audioEngineTimbre: window.app?.audioEngine?.getCurrentTimbre?.()
            };
        });
        console.log('After change to none:', afterChange);
        
        // キーを押してみて、音声生成の流れを追跡
        console.log('Simulating key press...');
        await page.evaluate(() => {
            // デバッグ用のログを追加
            const originalSynthesizeNote = window.app.synthesizeNote;
            window.app.synthesizeNote = function(frequency, velocity, midiNote, enableVisualization) {
                console.log('synthesizeNote called with:', {
                    frequency,
                    velocity, 
                    midiNote,
                    timbre: this.settings.audioTimbre
                });
                return originalSynthesizeNote.call(this, frequency, velocity, midiNote, enableVisualization);
            };
            
            const originalAudioEngineSynthesize = window.app.audioEngine.synthesizeNote;
            window.app.audioEngine.synthesizeNote = function(frequency, velocity, midiNote) {
                console.log('audioEngine.synthesizeNote called with:', {
                    frequency,
                    velocity,
                    midiNote,
                    currentTimbre: this.currentTimbre
                });
                return originalAudioEngineSynthesize.call(this, frequency, velocity, midiNote);
            };
            
            // Cキーをシミュレート
            window.app.playNote(60, 100, performance.now());
        });
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('=== TESTING OTHER TIMBRE ===');
        
        // 別の音色に変更してテスト
        await page.select('#audio-timbre', 'acoustic-piano');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const pianoState = await page.evaluate(() => {
            return {
                selectValue: document.getElementById('audio-timbre').value,
                settingsValue: window.app?.settings?.audioTimbre,
                audioEngineTimbre: window.app?.audioEngine?.getCurrentTimbre?.()
            };
        });
        console.log('After change to piano:', pianoState);
        
        await page.evaluate(() => {
            window.app.playNote(60, 100, performance.now());
        });
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        
    } catch (error) {
        console.error('Debug error:', error);
    }
    
    console.log('Debug session complete. Closing browser in 5 seconds...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    await browser.close();
}

debugTimbreIssue().catch(console.error);