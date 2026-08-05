const express = require('express');
const mineflayer = require('mineflayer');

// ==========================================================
// 1. خادم الويب للإبقاء على الخدمة نشطة على Render
// ==========================================================
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => res.status(200).send('dma9 Ultra-Light Bot Online'));
app.get('/ping', (req, res) => res.status(200).send('PONG'));

app.listen(PORT, () => console.log(`[WEB SERVER] Running on port ${PORT}`));

// ==========================================================
// 2. إعدادات البوت
// ==========================================================
const config = {
    host: process.env.SERVER_HOST || 'node-de-free-01.tickhosting.com',
    port: parseInt(process.env.SERVER_PORT || '50589'),
    username: process.env.BOT_USERNAME || 'dma9',
    version: false,
    auth: process.env.AUTH_TYPE || 'offline'
};

let bot = null;
let afkInterval = null;

function createBot() {
    cleanUp();
    console.log(`[CONNECTING] Connecting to ${config.host}:${config.port}...`);

    try {
        bot = mineflayer.createBot(config);
    } catch (err) {
        console.log(`[INIT ERROR] ${err.message}`);
        setTimeout(createBot, 5000);
        return;
    }

    bot.once('spawn', () => {
        console.log(`[ONLINE] Bot "${bot.username}" joined! Ultra-Light Zero-Lag Active.`);
        
        // تعطيل محرك الفيزياء بالكامل لتسريع الاستجابة ومنع تجميد المعالج
        if (bot.physics) {
            bot.physicsEnabled = false;
        }

        startUltraLightAFK();
    });

    // ==========================================================
    // 3. حركة فائقة الخفة كل 15 ثانية (بدون مشي أو قفز)
    // ==========================================================
    function startUltraLightAFK() {
        if (afkInterval) clearInterval(afkInterval);

        afkInterval = setInterval(() => {
            if (!bot || !bot.entity) return;

            // التفات خفيف بالرأس مع تحريك اليد فقط
            const randomYaw = (Math.random() * 360 - 180) * (Math.PI / 180);
            bot.look(randomYaw, 0, true);
            bot.swingArm('mainhand');
        }, 15000);
    }

    // ==========================================================
    // 4. الأحداث وإعادة الاتصال السريعة
    // ==========================================================
    bot.on('kicked', (reason) => console.log(`[KICKED] ${JSON.stringify(reason)}`));
    bot.on('error', (err) => console.log(`[ERROR] ${err.message}`));
    bot.on('end', () => {
        console.log('[DISCONNECT] Reconnecting in 5s...');
        setTimeout(createBot, 5000);
    });
}

function cleanUp() {
    if (afkInterval) clearInterval(afkInterval);
    if (bot) {
        bot.removeAllListeners();
        bot = null;
    }
}

createBot();
