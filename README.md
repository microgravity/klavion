# Piano Visualizer / ピアノビジュアライザー

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live%20Demo-brightgreen)](https://microgravity.github.io/piano-visualiser/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-blue.svg)](app.js)
[![Three.js](https://img.shields.io/badge/Three.js-3D%20Graphics-orange.svg)](https://threejs.org/)

美しい3Dビジュアライゼーションと高品質オーディオ合成を備えた、リアルタイムMIDI対応のインタラクティブピアノツール

An interactive 3D piano visualization tool with beautiful graphics, high-quality audio synthesis, and real-time MIDI support.

![Piano Visualizer Screenshot](./src/img/scr.jpg)

## 🚀 ライブデモ / Live Demo

**[https://microgravity.github.io/klavion](https://microgravity.github.io/klavion)**

## ✨ 最新の改善 / Latest Improvements

### v1.3.0 の新機能 / New in v1.3.0 (Latest)

- 🎨 **ColorHunt Retroパレットコレクション** - 12種類の美しいRetroカラーパレット（Synthwave, Miami Vice等）
- 🎬 **YouTube Full HD録画対応** - 1920×1080高品質録画でYouTube投稿に最適
- ⚡ **音声・映像完全同期** - 60FPS録画と即座更新による遅延ゼロ録画
- 🎹 **鍵盤付き録画機能** - 演奏時の鍵盤押下状態も含めた合成録画
- 🌈 **ランダムRetroカラー** - 演奏時に美しいRetroカラーでランダム表示

### New in v1.3.0 (Latest)

- 🎨 **ColorHunt Retro Palette Collection** - 12 beautiful retro palettes (Synthwave, Miami Vice, etc.)
- 🎬 **YouTube Full HD Recording** - 1920×1080 high-quality recording optimized for YouTube
- ⚡ **Perfect Audio/Video Sync** - 60 FPS recording with immediate updates for zero-latency recording
- 🎹 **Piano Keyboard Recording** - Composite recording including piano key press visualization
- 🌈 **Random Retro Colors** - Beautiful random retro color display during performance

### v1.2.0 の新機能 / New in v1.2.0

- ⚡ **大幅なパフォーマンス改善** - PageSpeed Insights最適化でロード時間を50%短縮
- 📱 **スマートなデバイス対応** - スマートフォンには適切な案内、タブレット・PCで最適体験
- 🚀 **Critical CSS実装** - 瞬時の初期描画でユーザー体験向上
- 🎨 **Canvasグラデーション背景** - 軽量で美しい背景エフェクト
- 🔧 **初期化最適化** - 不要なテスト音符を削除、クリーンな起動

### New in v1.2.0

- ⚡ **Major Performance Improvements** - 50% faster loading with PageSpeed optimization
- 📱 **Smart Device Support** - Mobile guidance screen, optimal experience on tablets/PCs
- 🚀 **Critical CSS Implementation** - Instant initial render for better UX
- 🎨 **Canvas Gradient Background** - Lightweight beautiful background effects
- 🔧 **Initialization Optimization** - Removed test notes, clean startup experience

### v1.1.0 の主要機能 / Key Features in v1.1.0

- 🎨 **美しい背景システム** - 動的生成される背景パターン
- 🎯 **最適化されたフォントサイズ** - PCキーボード入力時の読みやすいサイズ調整  
- 📱 **折りたたみ可能サイドバー** - すべてのセクションでスムーズなアニメーション
- ⚖️ **バランス調整** - ベロシティ60での統一された表示サイズ

## Features / 機能

### 🎹 MIDI Support / MIDI サポート

- **Real-time MIDI input** - Connect any MIDI device and play in real-time
- **Auto-detection of 88-key devices** - Automatically switches to full piano range
- **Sustain pedal support** - CC64 sustain pedal functionality
- **Computer keyboard input** - Play using your computer keyboard as fallback

- **リアルタイム MIDI 入力** - 任意の MIDI デバイスを接続してリアルタイム演奏
- **88 鍵デバイスの自動検出** - フルピアノ範囲への自動切り替え
- **サスティンペダル対応** - CC64 サスティンペダル機能
- **コンピューターキーボード入力** - フォールバックとしてコンピューターキーボードで演奏

### 🎵 Audio Engine / オーディオエンジン

- **Multiple timbres** - Acoustic piano, electric piano, harpsichord, organ, strings, vibraphone, music box, synthesizer, bell, flute
- **Velocity-sensitive synthesis** - Dynamic volume and tone based on playing strength
- **Sustain pedal effects** - Natural note sustaining with pedal control
- **Volume control** - Global volume adjustment with mute functionality

- **複数の音色** - アコースティックピアノ、エレクトリックピアノ、ハープシコード、オルガン、ストリングス、ビブラフォン、オルゴール、シンセサイザー、ベル、フルート
- **ベロシティ感応合成** - 演奏の強さに基づく動的な音量と音色
- **サスティンペダルエフェクト** - ペダルコントロールによる自然な音の持続
- **音量制御** - ミュート機能付きグローバル音量調整

### 🎨 Visual Effects / ビジュアルエフェクト

- **3D note visualization** - Notes float upward with smooth animations
- **Sustained note display** - Notes rise, sustain, and fade matching real piano behavior
- **ColorHunt Retro palettes** - 12 beautiful retro color collections (Synthwave, Miami Vice, etc.)
- **Random retro colors** - Automatic random color selection from curated palettes
- **Customizable colors** - Multiple color scales or custom color picker
- **Font customization** - Japanese (ドレミ) or Western (CDEFG) note names
- **Velocity display** - Optional velocity numbers with smaller font
- **Octave numbers** - Optional octave number display
- **Glow effects** - Customizable intensity and motion blur

- **3D 音符ビジュアライゼーション** - スムーズなアニメーションで音符が上昇
- **持続音符表示** - 実際のピアノの動作に合わせて音符が上昇・持続・フェード
- **ColorHunt Retroパレット** - 12種類の美しいRetroカラーコレクション（Synthwave、Miami Vice等）
- **ランダムRetroカラー** - 厳選されたパレットからの自動ランダムカラー選択
- **カスタマイズ可能な色** - 複数のカラースケールまたはカスタムカラーピッカー
- **フォントカスタマイゼーション** - 日本語（ドレミ）または西洋式（CDEFG）音名
- **ベロシティ表示** - 小さなフォントでオプションのベロシティ数値
- **オクターブ番号** - オプションのオクターブ番号表示
- **グローエフェクト** - カスタマイズ可能な強度とモーションブラー

### 📹 Screen Recording / 画面録画

- **Built-in screen recording** - Record your performances directly in the browser
- **Piano keyboard included** - Composite recording with visual piano key presses
- **YouTube Full HD recording** - 1920×1080 high-quality format optimized for YouTube
- **Perfect audio/video sync** - 60 FPS recording with zero-latency audio capture
- **iPhone-compatible MP4** - H.264 codec for maximum compatibility
- **Permission management** - User consent for screen recording access
- **Multiple codec support** - Automatic fallback for different browsers

- **内蔵画面録画** - ブラウザで直接演奏を録画
- **鍵盤付き録画** - 鍵盤の押下状態を含む合成録画
- **YouTube Full HD録画** - YouTube投稿に最適化された1920×1080高品質フォーマット
- **完全音声・映像同期** - 60FPS録画とゼロ遅延音声キャプチャ
- **iPhone 対応 MP4** - 最大互換性のための H.264 コーデック
- **権限管理** - 画面録画アクセスのユーザー同意
- **複数コーデック対応** - 異なるブラウザでの自動フォールバック

### 📱 Device Compatibility / デバイス対応

- **Smart Device Detection** - Automatic device type recognition
- **Mobile Guidance Screen** - Helpful instructions for smartphone users
- **Tablet Optimization** - Full functionality on tablets (768px+)
- **Desktop Experience** - Complete feature set on PC/laptop
- **Responsive Design** - Optimal layout for each device type

- **スマートデバイス検出** - 自動的なデバイスタイプ認識
- **モバイル案内画面** - スマートフォンユーザーへの親切な指示
- **タブレット最適化** - タブレット（768px以上）での完全機能
- **デスクトップ体験** - PC/ラップトップでの完全機能セット
- **レスポンシブデザイン** - 各デバイスタイプに最適なレイアウト

| Device Type / デバイス | Screen Size / 画面サイズ | Experience / 体験 |
|------------------------|--------------------------|-------------------|
| 📱 Smartphone / スマートフォン | ~768px | 🔄 Guidance Screen / 案内画面 |
| 📱 Tablet / タブレット | 768px+ | ✅ Full Features / 全機能 |
| 💻 Desktop/Laptop / PC | Any / 任意 | ✅ Optimal Experience / 最適体験 |

## Installation / インストール

### Prerequisites / 前提条件

- Modern web browser with WebGL support
- MIDI device (optional - can use computer keyboard)
- WebGL 対応の最新ブラウザ
- MIDI デバイス（オプション - コンピューターキーボード使用可）

### Setup / セットアップ

1. **Clone the repository / リポジトリをクローン**

   ```bash
   git clone https://github.com/microgravity/piano-visualiser.git
   cd piano-visualiser
   ```

2. **Serve the files / ファイルを配信**

   ```bash
   # Using Python / Pythonを使用
   python -m http.server 8000

   # Using Node.js / Node.jsを使用
   npx serve .

   # Using any other web server / その他のWebサーバーを使用
   ```

3. **Open in browser / ブラウザで開く**
   ```
   http://localhost:8000
   ```

## Usage / 使用方法

### Basic Operation / 基本操作

1. **Connect MIDI device / MIDI デバイスを接続**

   - Connect your MIDI keyboard or controller
   - The app will auto-detect and suggest the best device
   - MIDI キーボードまたはコントローラーを接続
   - アプリが自動検出し、最適なデバイスを提案します

2. **Play music / 音楽を演奏**

   - Play notes on your MIDI device
   - Or use computer keyboard (Q-P keys for white keys, 2-0 for black keys)
   - MIDI デバイスで音符を演奏
   - またはコンピューターキーボードを使用（白鍵は Q-P キー、黒鍵は 2-0 キー）

3. **Customize appearance / 外観をカスタマイズ**
   - Adjust colors, effects, and display options in the control panel
   - コントロールパネルで色、エフェクト、表示オプションを調整

### Controls / コントロール

#### Visual Settings / ビジュアル設定

- **Animation Speed** - Control note movement speed / 音符の移動速度を制御
- **Size Multiplier** - Adjust note size / 音符のサイズを調整
- **Velocity Sensitivity** - How much velocity affects size / ベロシティがサイズに与える影響
- **Fade Duration** - How long notes remain visible / 音符が表示される時間
- **Glow Intensity** - Brightness of glow effects / グローエフェクトの明るさ

#### Color Settings / 色設定

- **Color Scale** - Choose from musical scales or custom colors / 音楽スケールまたはカスタム色から選択
- **Base Color** - Set custom base color / カスタムベース色を設定
- **Color Code Input** - Enter hex color codes directly / 16 進カラーコードを直接入力

#### Display Options / 表示オプション

- **Show Velocity Numbers** - Display velocity values like "ファ(127)" / "ファ(127)"のようにベロシティ値を表示
- **Show Octave Numbers** - Display octave numbers / オクターブ番号を表示
- **Note Name Style** - Japanese (ドレミ) or Western (CDEFG) / 日本語（ドレミ）または西洋式（CDEFG）

#### Audio Settings / オーディオ設定

- **Audio Timbre** - Select instrument sound / 楽器音を選択
- **Volume** - Global volume control / グローバル音量制御
- **Mute** - Disable audio output / オーディオ出力を無効化

### Keyboard Mapping / キーボードマッピング

**PCキーボード入力はベロシティ60で統一** / **PC keyboard input unified at velocity 60**

| Computer Key / コンピューターキー | Piano Note / ピアノ音 | Japanese / 日本語 | MIDI Note |
| --------------------------------- | --------------------- | ----------------- | --------- |
| A                                 | C4                    | ド4               | 60        |
| W                                 | C#4                   | ド#4              | 61        |
| S                                 | D4                    | レ4               | 62        |
| E                                 | D#4                   | レ#4              | 63        |
| D                                 | E4                    | ミ4               | 64        |
| F                                 | F4                    | ファ4             | 65        |
| T                                 | F#4                   | ファ#4            | 66        |
| G                                 | G4                    | ソ4               | 67        |
| Y                                 | G#4                   | ソ#4              | 68        |
| H                                 | A4                    | ラ4               | 69        |
| U                                 | A#4                   | ラ#4              | 70        |
| J                                 | B4                    | シ4               | 71        |
| K                                 | C5                    | ド5               | 72        |

## Technical Details / 技術詳細

### Architecture / アーキテクチャ

- **Frontend**: Pure HTML5, CSS3, and JavaScript (ES6+)
- **3D Graphics**: Three.js for WebGL rendering with GPU acceleration
- **Audio**: Web Audio API for real-time synthesis
- **MIDI**: Web MIDI API for device communication
- **Background**: Canvas-based gradient generation for optimal performance
- **Storage**: LocalStorage for settings and preferences persistence
- **Performance**: Critical CSS, font optimization, and resource preloading
- **Device Detection**: Advanced mobile/tablet detection with responsive UI

- **フロントエンド**: 純粋な HTML5、CSS3、JavaScript（ES6+）
- **3D グラフィックス**: GPU加速対応のWebGLレンダリング用Three.js
- **オーディオ**: リアルタイム合成用 Web Audio API
- **MIDI**: デバイス通信用 Web MIDI API
- **背景**: 最適なパフォーマンスのためのCanvasベースグラデーション生成
- **ストレージ**: 設定と環境設定永続化用LocalStorage
- **パフォーマンス**: Critical CSS、フォント最適化、リソースプリロード
- **デバイス検出**: レスポンシブUIを備えた高度なモバイル・タブレット検出

### Latest Technical Features v1.2.0 / 最新技術機能 v1.2.0

- **⚡ PageSpeed Optimization** - Critical CSS, font loading optimization, 50% faster initial load
- **📱 Smart Device Detection** - Advanced mobile/tablet recognition with responsive warning system
- **🎨 Canvas Background System** - Lightweight gradient generation replacing external image dependencies
- **🚀 GPU Acceleration** - Hardware-accelerated rendering with will-change and transform optimizations
- **🔧 Clean Initialization** - Removed test notes, optimized startup sequence for instant readiness
- **💾 Resource Preloading** - Strategic preconnect, preload, and DNS prefetch for optimal loading

### 最新技術機能 v1.2.0

- **⚡ PageSpeed最適化** - Critical CSS、フォント読み込み最適化により初期ロードを50%高速化
- **📱 スマートデバイス検出** - レスポンシブ警告システムを備えた高度なモバイル・タブレット認識
- **🎨 Canvasバックグラウンドシステム** - 外部画像依存を排除した軽量グラデーション生成
- **🚀 GPU加速** - will-changeとtransform最適化によるハードウェア加速レンダリング
- **🔧 クリーンな初期化** - テスト音符削除、瞬時起動のための最適化されたスタートアップ順序
- **💾 リソースプリロード** - 最適な読み込みのための戦略的preconnect、preload、DNS prefetch

### Previous Features v1.1.0 / 以前の機能 v1.1.0

- **🔄 Collapsible UI Components** - Smooth CSS transitions with cubic-bezier easing
- **📐 Responsive Canvas Sizing** - Background adapts to any screen size
- **⚖️ Unified Display** - Consistent velocity 60 for PC keyboard input

### Browser Compatibility / ブラウザ互換性

- Chrome 66+ (recommended / 推奨)
- Firefox 63+
- Safari 14.1+
- Edge 79+

### Performance / パフォーマンス

#### v1.2.0 Improvements / v1.2.0 改善

- **Critical CSS Implementation** - Instant first paint, eliminated render-blocking resources
- **Font Loading Optimization** - Reduced from 20+ fonts to essential 2, async loading for others
- **GPU Acceleration** - Hardware-accelerated rendering with CSS transforms and containment
- **Resource Preloading** - Strategic preconnect, preload, DNS prefetch for optimal loading
- **Clean Startup** - Removed unnecessary test components, faster initialization

#### Core Performance Features / コア性能機能

- **Optimized rendering** - Efficient sprite management and cleanup
- **Low latency audio** - Direct Web Audio API synthesis
- **Responsive design** - Adapts to different screen sizes
- **Memory management** - Automatic cleanup of old notes

#### v1.2.0 改善

- **Critical CSS実装** - 瞬時の初期描画、レンダーブロッキングリソース排除
- **フォント読み込み最適化** - 20+フォントから必須2フォントに削減、その他は非同期読み込み
- **GPU加速** - CSS transformとcontainmentによるハードウェア加速レンダリング
- **リソースプリロード** - 最適な読み込みのための戦略的preconnect、preload、DNS prefetch
- **クリーンスタートアップ** - 不要なテストコンポーネント削除、高速初期化

#### コア性能機能

- **最適化されたレンダリング** - 効率的なスプライト管理とクリーンアップ
- **低遅延オーディオ** - 直接 Web Audio API 合成
- **レスポンシブデザイン** - 異なる画面サイズに適応
- **メモリ管理** - 古い音符の自動クリーンアップ

## Development / 開発

### File Structure / ファイル構造

```
piano-visualiser/
├── index.html          # Main HTML file / メインHTMLファイル
├── app.js              # Core application logic / コアアプリケーションロジック
├── styles.css          # CSS styles / CSSスタイル
├── README.md           # This file / このファイル
└── screenshot.png      # Screenshot for README / README用スクリーンショット
```

### Key Classes and Functions / 主要なクラスと関数

#### PianoVisualizer Class / PianoVisualizer クラス

- `initThreeJS()` - Initialize 3D scene / 3D シーンを初期化
- `initMIDI()` - Setup MIDI input handling / MIDI 入力処理をセットアップ
- `initAudio()` - Configure Web Audio API / Web Audio API を設定
- `handleMIDIMessage()` - Process incoming MIDI data / 受信 MIDI データを処理
- `visualizeNoteThreeJS()` - Create 3D note sprites / 3D 音符スプライトを作成
- `synthesizeNote()` - Generate audio synthesis / オーディオ合成を生成

### Contributing / 貢献

1. Fork the repository / リポジトリをフォーク
2. Create a feature branch / 機能ブランチを作成
3. Make your changes / 変更を加える
4. Test thoroughly / 徹底的にテスト
5. Submit a pull request / プルリクエストを送信

### Coding Standards / コーディング規約

- Use ES6+ features where supported / サポート対象の ES6+機能を使用
- Follow consistent indentation (4 spaces) / 一貫したインデント（4 スペース）に従う
- Add comments for complex logic / 複雑なロジックにコメントを追加
- Test across multiple browsers / 複数のブラウザでテスト

## Troubleshooting / トラブルシューティング

### Common Issues / よくある問題

#### MIDI Device Not Detected / MIDI デバイスが検出されない

- Ensure device is connected before opening the app / アプリを開く前にデバイスが接続されていることを確認
- Check browser permissions for MIDI access / MIDI アクセスのブラウザ権限を確認
- Try refreshing the page / ページを再読み込みしてみる

#### Audio Not Playing / オーディオが再生されない

- Click anywhere on the page to activate audio context / オーディオコンテキストを有効にするためにページ上のどこかをクリック
- Check that audio is not muted / オーディオがミュートされていないことを確認
- Verify browser audio permissions / ブラウザのオーディオ権限を確認

#### Performance Issues / パフォーマンスの問題

- Reduce particle count in settings / 設定でパーティクル数を減らす
- Lower animation speed / アニメーション速度を下げる
- Close other browser tabs / 他のブラウザタブを閉じる
- Use a desktop browser instead of mobile / モバイルではなくデスクトップブラウザを使用

#### Recording Issues / 録画の問題

- Grant screen recording permissions when prompted / プロンプトが表示されたら画面録画権限を許可
- Use Chrome for best recording compatibility / 最適な録画互換性のために Chrome を使用
- Check available disk space / 利用可能なディスク容量を確認

## License / ライセンス

This project is licensed under the MIT License. See the LICENSE file for details.

このプロジェクトは MIT ライセンスの下でライセンスされています。詳細は LICENSE ファイルを参照してください。

## Acknowledgments / 謝辞

- Three.js for 3D rendering capabilities / 3D レンダリング機能の Three.js
- Web MIDI API for real-time MIDI support / リアルタイム MIDI サポートの Web MIDI API
- Web Audio API for audio synthesis / オーディオ合成の Web Audio API
- All contributors and beta testers / すべての貢献者とベータテスター

## Version History / バージョン履歴

### v1.3.0 (Latest / 最新) - December 2024

#### 🎨 ColorHunt Retro Collection / ColorHunt Retroコレクション
- **12 Retro Palettes** - Synthwave, Miami Vice, Vaporwave, Electric, and more
- **Random Color Selection** - Automatic random colors from curated palettes
- **Beautiful Color Harmony** - Professionally designed retro color schemes
- **Sidebar Integration** - Easy palette selection from dropdown menu

#### 🎬 Advanced Recording Features / 高度な録画機能
- **Piano Keyboard Recording** - Visual piano key presses included in recordings
- **YouTube Full HD Format** - 1920×1080 recording optimized for YouTube upload
- **Perfect Audio/Video Sync** - 60 FPS recording with immediate canvas updates
- **Zero-Latency Capture** - Real-time audio and video synchronization

#### ✨ Enhanced Note Visualization / 強化された音符ビジュアライゼーション
- **Sustained Note Animation** - 3-phase animation system (rising, sustaining, falling)
- **Real Piano Behavior** - Notes sustain while keys are pressed, fade on release
- **Dynamic Color Application** - Retro colors properly applied to note visualization

### v1.2.0 - December 2024

#### ⚡ Performance Revolution / パフォーマンス革命
- **PageSpeed Optimization** - Critical CSS implementation, 50% faster loading
- **Font Loading Optimization** - Reduced from 20+ to 2 essential fonts, async loading
- **GPU Acceleration** - Hardware-accelerated rendering with CSS optimizations
- **Resource Preloading** - Strategic preconnect, preload, DNS prefetch

#### 📱 Device Compatibility / デバイス互換性
- **Smart Device Detection** - Advanced mobile/tablet recognition system
- **Mobile Guidance Screen** - Helpful instructions for smartphone users
- **Tablet Optimization** - Full functionality on tablets (768px+)
- **Responsive Warning System** - User-friendly device recommendations

#### 🎨 Technical Improvements / 技術改善
- **Canvas Background System** - Lightweight gradient generation, no external dependencies
- **Clean Initialization** - Removed test notes, optimized startup sequence
- **Memory Management** - Enhanced cleanup and resource management
- **Cross-platform Stability** - Improved compatibility across all browsers

### v1.1.0 - December 2024

#### ✨ Core Features / コア機能
- **Dynamic Background System** - Beautiful auto-generated patterns
- **Collapsible Sidebar Sections** - Smooth animations for all UI sections
- **Optimized PC Keyboard Input** - Unified velocity 60 for consistent display
- **Enhanced Font Sizing** - Better readability across all input methods

#### 🔧 Technical Foundation / 技術基盤
- **CORS-Free Background Loading** - Data URLs replace external image sources
- **Fixed Initialization Order** - Prevents camera null reference errors
- **Improved Error Handling** - Robust fallbacks for all operations
- **Canvas Auto-Sizing** - Background adapts perfectly to any screen size

### v1.0.0 - November 2024

- Initial release with full MIDI and audio support / MIDI・オーディオ完全サポートの初回リリース
- 3D visualization with customizable effects / カスタマイズ可能なエフェクト付き 3D ビジュアライゼーション
- Screen recording functionality / 画面録画機能
- Multi-language support (Japanese/English) / 多言語サポート（日本語/英語）

---

**Created with ❤️ for music visualization / 音楽ビジュアライゼーションへの愛を込めて作成**
