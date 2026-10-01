const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function main() {
    const targetUrl = 'https://wa.me/556196406270';
    
    // 1. Gerar QR Code puro em altíssima resolução (1200x1200 PNG)
    const purePngPath = path.join(__dirname, 'assets', 'qrcode-whatsapp-lana-wolf.png');
    await QRCode.toFile(purePngPath, targetUrl, {
        width: 1200,
        margin: 2,
        errorCorrectionLevel: 'H',
        color: {
            dark: '#241715',
            light: '#ffffff'
        }
    });
    console.log('QR Code WhatsApp puro gerado em:', purePngPath);

    // 2. Gerar QR Code em SVG
    const qrSvg = await QRCode.toString(targetUrl, {
        type: 'svg',
        margin: 1,
        errorCorrectionLevel: 'H',
        color: {
            dark: '#241715',
            light: '#ffffff'
        }
    });

    // 3. Montar página HTML elegante para captura do Cartão Promocional (1080x1350 - Stories/Flyer/Bancada)
    const htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Lana Wolf Art WhatsApp QR Code</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,600;0,700;1,500;1,700&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            width: 1080px;
            height: 1350px;
            overflow: hidden;
            font-family: 'Outfit', sans-serif;
            background: linear-gradient(145deg, #1b1312 0%, #291c1a 45%, #180f0e 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            color: #ffffff;
        }
        /* Efeitos de iluminação de fundo */
        .glow-top {
            position: absolute;
            top: -120px;
            left: 50%;
            transform: translateX(-50%);
            width: 700px;
            height: 700px;
            background: radial-gradient(circle, rgba(37, 211, 102, 0.22) 0%, transparent 70%);
            pointer-events: none;
        }
        .glow-bottom {
            position: absolute;
            bottom: -150px;
            right: -100px;
            width: 600px;
            height: 600px;
            background: radial-gradient(circle, rgba(201, 130, 118, 0.25) 0%, transparent 70%);
            pointer-events: none;
        }
        .card-container {
            width: 920px;
            height: 1190px;
            background: rgba(36, 23, 21, 0.78);
            border: 2px solid rgba(201, 130, 118, 0.45);
            border-radius: 36px;
            box-shadow: 0 30px 80px rgba(0, 0, 0, 0.65), inset 0 1px 0 rgba(255, 255, 255, 0.15);
            backdrop-filter: blur(20px);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: space-between;
            padding: 55px 50px 45px;
            text-align: center;
            position: relative;
            z-index: 10;
        }
        /* Top badge */
        .pill-badge {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            background: linear-gradient(135deg, rgba(37, 211, 102, 0.2) 0%, rgba(201, 130, 118, 0.18) 100%);
            border: 1px solid rgba(37, 211, 102, 0.55);
            padding: 9px 24px;
            border-radius: 30px;
            font-size: 15px;
            font-weight: 700;
            letter-spacing: 2px;
            color: #4ade80;
            text-transform: uppercase;
        }
        /* Header titles */
        .brand-header {
            margin-top: 10px;
        }
        .brand-title {
            font-family: 'Playfair Display', serif;
            font-size: 58px;
            font-weight: 700;
            letter-spacing: 0.5px;
            color: #ffffff;
            line-height: 1.1;
        }
        .brand-title span {
            color: #C98276;
            font-style: italic;
        }
        .brand-subtitle {
            font-size: 20px;
            font-weight: 400;
            letter-spacing: 3px;
            color: #d1b8b2;
            text-transform: uppercase;
            margin-top: 8px;
        }
        /* QR Box */
        .qr-box-wrapper {
            background: #ffffff;
            padding: 26px;
            border-radius: 28px;
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4), 0 0 0 4px rgba(37, 211, 102, 0.4);
            display: flex;
            flex-direction: column;
            align-items: center;
            margin: 20px 0;
            position: relative;
        }
        .qr-svg-container {
            width: 360px;
            height: 360px;
        }
        .qr-svg-container svg {
            width: 100%;
            height: 100%;
            display: block;
        }
        .qr-inner-badge {
            margin-top: 14px;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: #25D366;
            color: #ffffff;
            padding: 8px 22px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 700;
            letter-spacing: 0.8px;
            text-transform: uppercase;
            box-shadow: 0 4px 15px rgba(37, 211, 102, 0.4);
        }
        /* Instructions & Category Badges */
        .scan-instruction {
            font-size: 26px;
            font-weight: 600;
            color: #ffffff;
            margin-bottom: 8px;
        }
        .scan-subinstruction {
            font-size: 17px;
            color: #b5a4a1;
            max-width: 600px;
            line-height: 1.5;
            margin-bottom: 20px;
        }
        .categories-chips {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            justify-content: center;
            max-width: 760px;
            margin-bottom: 20px;
        }
        .cat-chip {
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid rgba(201, 130, 118, 0.3);
            color: #f0e6e4;
            padding: 8px 18px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 500;
        }
        /* Footer Box */
        .card-footer {
            width: 100%;
            padding-top: 18px;
            border-top: 1px solid rgba(255, 255, 255, 0.12);
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .footer-phone {
            font-family: 'Outfit', sans-serif;
            font-size: 26px;
            font-weight: 700;
            color: #25D366;
            letter-spacing: 0.5px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .footer-info {
            text-align: right;
            font-size: 14px;
            color: #a89895;
            line-height: 1.4;
        }
        .footer-info strong {
            color: #ffffff;
        }
    </style>
</head>
<body>
    <div class="glow-top"></div>
    <div class="glow-bottom"></div>

    <div class="card-container">
        <!-- Badge Superior -->
        <div class="pill-badge">
            ✦ Atendimento Oficial & Agendamentos ✦
        </div>

        <!-- Marca -->
        <div class="brand-header">
            <h1 class="brand-title">Lana <span>Wolf</span> Art</h1>
            <p class="brand-subtitle">Studio de Estética • Cursos • Insumos</p>
        </div>

        <!-- Bloco do QR Code -->
        <div class="qr-box-wrapper">
            <div class="qr-svg-container">
                ${qrSvg}
            </div>
            <div class="qr-inner-badge">
                ★ Fale Diretamente no WhatsApp ★
            </div>
        </div>

        <!-- Chamada de Ação -->
        <div>
            <h2 class="scan-instruction">Aponte a câmera do seu celular para iniciar a conversa</h2>
            <p class="scan-subinstruction">
                Agendamento de horários, dúvidas técnicas sobre procedimentos, vagas em cursos presenciais e pedidos de insumos.
            </p>

            <div class="categories-chips">
                <span class="cat-chip">Extensão de Cílios</span>
                <span class="cat-chip">Micropigmentação Labial & Sobrancelhas</span>
                <span class="cat-chip">Cursos de Formação VIP</span>
                <span class="cat-chip">Lana Supply Pro (B2B)</span>
            </div>
        </div>

        <!-- Rodapé do Cartão -->
        <div class="card-footer">
            <div class="footer-phone">
                (61) 9640-6270
            </div>
            <div class="footer-info">
                <strong>Studio Lana Wolf Art</strong> • Parque 9, Luziânia - GO<br>
                Horários com Agendamento Prévio
            </div>
        </div>
    </div>
</body>
</html>`;

    const htmlPath = path.join(__dirname, 'assets', 'qrcode_whatsapp_temp.html');
    fs.writeFileSync(htmlPath, htmlContent, 'utf8');

    // 4. Tirar screenshot com Chrome Headless em 1080x1350
    const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    const cardPngPath = path.join(__dirname, 'assets', 'qrcode-whatsapp-lana-wolf-card.png');
    
    const cmd = `"${chromePath}" --headless --disable-gpu --window-size=1080,1350 --screenshot="${cardPngPath}" --hide-scrollbars "${htmlPath}"`;
    console.log('Executando Chrome headless para renderizar o cartão WhatsApp...');
    execSync(cmd);
    console.log('Cartão WhatsApp renderizado com sucesso em:', cardPngPath);

    // 5. Copiar para o diretório de artifacts do chat para visualização e download direto
    const artifactDir = 'C:\\Users\\Demian\\.gemini\\antigravity-ide\\brain\\9af81687-553e-4906-afb2-ce3ff8e3d6bd';
    const artifactCardPath = path.join(artifactDir, 'qrcode_whatsapp_lana_wolf_card.png');
    const artifactPurePath = path.join(artifactDir, 'qrcode_whatsapp_lana_wolf.png');

    fs.copyFileSync(cardPngPath, artifactCardPath);
    fs.copyFileSync(purePngPath, artifactPurePath);
    console.log('Imagens copiadas para artifacts do chat com sucesso.');

    // Limpar arquivo temporário HTML
    try { fs.unlinkSync(htmlPath); } catch(e) {}
}

main().catch(err => {
    console.error('Erro:', err);
    process.exit(1);
});
