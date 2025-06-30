# Piano Visualizer / ピアノビジュアライザー

An interactive 3D piano visualization tool that displays musical notes with customizable effects and real-time MIDI support.

MIDIをリアルタイムでサポートし、カスタマイズ可能なエフェクトで音符を表示するインタラクティブな3Dピアノビジュアライゼーションツール。

![Piano Visualizer Screenshot](screenshot.png)

## Features / 機能

### 🎹 MIDI Support / MIDI サポート
- **Real-time MIDI input** - Connect any MIDI device and play in real-time
- **Auto-detection of 88-key devices** - Automatically switches to full piano range
- **Sustain pedal support** - CC64 sustain pedal functionality
- **Computer keyboard input** - Play using your computer keyboard as fallback

- **リアルタイムMIDI入力** - 任意のMIDIデバイスを接続してリアルタイム演奏
- **88鍵デバイスの自動検出** - フルピアノ範囲への自動切り替え
- **サスティンペダル対応** - CC64サスティンペダル機能
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
- **Customizable colors** - Multiple color scales or custom color picker
- **Font customization** - Japanese (ドレミ) or Western (CDEFG) note names
- **Velocity display** - Optional velocity numbers with smaller font
- **Octave numbers** - Optional octave number display
- **Glow effects** - Customizable intensity and motion blur

- **3D音符ビジュアライゼーション** - スムーズなアニメーションで音符が上昇
- **カスタマイズ可能な色** - 複数のカラースケールまたはカスタムカラーピッカー
- **フォントカスタマイゼーション** - 日本語（ドレミ）または西洋式（CDEFG）音名
- **ベロシティ表示** - 小さなフォントでオプションのベロシティ数値
- **オクターブ番号** - オプションのオクターブ番号表示
- **グローエフェクト** - カスタマイズ可能な強度とモーションブラー

### 📹 Screen Recording / 画面録画
- **Built-in screen recording** - Record your performances directly in the browser
- **iPhone-compatible MP4** - H.264 codec for maximum compatibility
- **Permission management** - User consent for screen recording access
- **Multiple codec support** - Automatic fallback for different browsers

- **内蔵画面録画** - ブラウザで直接演奏を録画
- **iPhone対応MP4** - 最大互換性のためのH.264コーデック
- **権限管理** - 画面録画アクセスのユーザー同意
- **複数コーデック対応** - 異なるブラウザでの自動フォールバック

## Installation / インストール

### Prerequisites / 前提条件
- Modern web browser with WebGL support
- MIDI device (optional - can use computer keyboard)
- WebGL対応の最新ブラウザ
- MIDIデバイス（オプション - コンピューターキーボード使用可）

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

1. **Connect MIDI device / MIDIデバイスを接続**
   - Connect your MIDI keyboard or controller
   - The app will auto-detect and suggest the best device
   - MIDIキーボードまたはコントローラーを接続
   - アプリが自動検出し、最適なデバイスを提案します

2. **Play music / 音楽を演奏**
   - Play notes on your MIDI device
   - Or use computer keyboard (Q-P keys for white keys, 2-0 for black keys)
   - MIDIデバイスで音符を演奏
   - またはコンピューターキーボードを使用（白鍵はQ-Pキー、黒鍵は2-0キー）

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
- **Color Code Input** - Enter hex color codes directly / 16進カラーコードを直接入力

#### Display Options / 表示オプション
- **Show Velocity Numbers** - Display velocity values like "ファ(127)" / "ファ(127)"のようにベロシティ値を表示
- **Show Octave Numbers** - Display octave numbers / オクターブ番号を表示
- **Note Name Style** - Japanese (ドレミ) or Western (CDEFG) / 日本語（ドレミ）または西洋式（CDEFG）

#### Audio Settings / オーディオ設定
- **Audio Timbre** - Select instrument sound / 楽器音を選択
- **Volume** - Global volume control / グローバル音量制御
- **Mute** - Disable audio output / オーディオ出力を無効化

### Keyboard Mapping / キーボードマッピング

| Computer Key / コンピューターキー | Piano Note / ピアノ音 | MIDI Note |
|-----------------------------------|----------------------|-----------|
| Q | C4 | 60 |
| 2 | C#4 | 61 |
| W | D4 | 62 |
| 3 | D#4 | 63 |
| E | E4 | 64 |
| R | F4 | 65 |
| 5 | F#4 | 66 |
| T | G4 | 67 |
| 6 | G#4 | 68 |
| Y | A4 | 69 |
| 7 | A#4 | 70 |
| U | B4 | 71 |
| I | C5 | 72 |

## Technical Details / 技術詳細

### Architecture / アーキテクチャ
- **Frontend**: Pure HTML5, CSS3, and JavaScript (ES6+)
- **3D Graphics**: Three.js for WebGL rendering
- **Audio**: Web Audio API for real-time synthesis
- **MIDI**: Web MIDI API for device communication

- **フロントエンド**: 純粋なHTML5、CSS3、JavaScript（ES6+）
- **3Dグラフィックス**: WebGLレンダリング用Three.js
- **オーディオ**: リアルタイム合成用Web Audio API
- **MIDI**: デバイス通信用Web MIDI API

### Browser Compatibility / ブラウザ互換性
- Chrome 66+ (recommended / 推奨)
- Firefox 63+
- Safari 14.1+
- Edge 79+

### Performance / パフォーマンス
- **Optimized rendering** - Efficient sprite management and cleanup
- **Low latency audio** - Direct Web Audio API synthesis
- **Responsive design** - Adapts to different screen sizes
- **Memory management** - Automatic cleanup of old notes

- **最適化されたレンダリング** - 効率的なスプライト管理とクリーンアップ
- **低遅延オーディオ** - 直接Web Audio API合成
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

#### PianoVisualizer Class / PianoVisualizerクラス
- `initThreeJS()` - Initialize 3D scene / 3Dシーンを初期化
- `initMIDI()` - Setup MIDI input handling / MIDI入力処理をセットアップ
- `initAudio()` - Configure Web Audio API / Web Audio APIを設定
- `handleMIDIMessage()` - Process incoming MIDI data / 受信MIDIデータを処理
- `visualizeNoteThreeJS()` - Create 3D note sprites / 3D音符スプライトを作成
- `synthesizeNote()` - Generate audio synthesis / オーディオ合成を生成

### Contributing / 貢献

1. Fork the repository / リポジトリをフォーク
2. Create a feature branch / 機能ブランチを作成
3. Make your changes / 変更を加える
4. Test thoroughly / 徹底的にテスト
5. Submit a pull request / プルリクエストを送信

### Coding Standards / コーディング規約
- Use ES6+ features where supported / サポート対象のES6+機能を使用
- Follow consistent indentation (4 spaces) / 一貫したインデント（4スペース）に従う
- Add comments for complex logic / 複雑なロジックにコメントを追加
- Test across multiple browsers / 複数のブラウザでテスト

## Troubleshooting / トラブルシューティング

### Common Issues / よくある問題

#### MIDI Device Not Detected / MIDIデバイスが検出されない
- Ensure device is connected before opening the app / アプリを開く前にデバイスが接続されていることを確認
- Check browser permissions for MIDI access / MIDIアクセスのブラウザ権限を確認
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
- Use Chrome for best recording compatibility / 最適な録画互換性のためにChromeを使用
- Check available disk space / 利用可能なディスク容量を確認

## License / ライセンス

This project is licensed under the MIT License. See the LICENSE file for details.

このプロジェクトはMITライセンスの下でライセンスされています。詳細はLICENSEファイルを参照してください。

## Acknowledgments / 謝辞

- Three.js for 3D rendering capabilities / 3Dレンダリング機能のThree.js
- Web MIDI API for real-time MIDI support / リアルタイムMIDIサポートのWeb MIDI API
- Web Audio API for audio synthesis / オーディオ合成のWeb Audio API
- All contributors and beta testers / すべての貢献者とベータテスター

## Version History / バージョン履歴

### v1.0.0 (Latest / 最新)
- Initial release with full MIDI and audio support / MIDI・オーディオ完全サポートの初回リリース
- 3D visualization with customizable effects / カスタマイズ可能なエフェクト付き3Dビジュアライゼーション
- Screen recording functionality / 画面録画機能
- Multi-language support (Japanese/English) / 多言語サポート（日本語/英語）

---

**Created with ❤️ for music visualization / 音楽ビジュアライゼーションへの愛を込めて作成**