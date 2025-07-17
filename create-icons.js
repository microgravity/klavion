// PWAアイコン生成スクリプト
const fs = require('fs');
const path = require('path');

// SVGアイコンを生成
const createSVGIcon = (size) => {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
        <defs>
            <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#0f0f23;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#1a1a2e;stop-opacity:1" />
            </linearGradient>
        </defs>
        <rect width="${size}" height="${size}" fill="url(#bg)" rx="${size * 0.1}"/>
        <text x="50%" y="60%" text-anchor="middle" font-size="${size * 0.5}" fill="white">🎹</text>
    </svg>`;
};

// 必要なサイズ
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// iconsディレクトリが存在しない場合は作成
const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
}

// 各サイズのSVGアイコンを生成
sizes.forEach(size => {
    const svg = createSVGIcon(size);
    const fileName = `icon-${size}x${size}.svg`;
    const filePath = path.join(iconsDir, fileName);
    
    fs.writeFileSync(filePath, svg);
    console.log(`Created: ${fileName}`);
});

console.log('PWA icons created successfully!');
console.log('Note: For better compatibility, convert SVG to PNG using online tools or image software.');