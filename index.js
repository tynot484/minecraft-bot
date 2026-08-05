const express = require('express');
const mineflayer = require('mineflayer');

// ==========================================================
// 1. خادم الويب للإبقاء على الخدمة نشطة على Render
// ==========================================================
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => res.status(200).send('dma9 Bot 24/7 Online'));
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
let reconnectAttempts = 0;

function createBot() {
    cleanUp();
    console.log(`[CONNECTING] Connecting to ${config.host}:${config.port}...`);

    try {
        bot = mineflayer.createBot(config);
    } catch (err) {
        console.log(`[INIT ERROR] ${err.message}`);
        handleReconnect();
        return;
    }

    bot.once('spawn', () => {
        console.log(`[ONLINE] Bot "${bot.username}" joined successfully! Light Anti-AFK Active.`);
        reconnectAttempts = 0;
        startLightAntiAFK();
    });

    // ==========================================================
    // 3. نظام Anti-AFK خفيف لمنع ارتفاع البينج وطرد Vulcan
    // ==========================================================
    function startLightAntiAFK() {
        if (afkInterval) clearInterval(afkInterval);

        afkInterval = setInterval(() => {
            if (!bot || !bot.entity) return;

            // 1. التفات خفيف للرأس (لا يستهلك معالج)
            const yaw = (Math.random() * 360 - 180) * (Math.PI / 180);
            const pitch = (Math.random() * 40 - 20) * (Math.PI / 180);
            bot.look(yaw, pitch, true);

            // 2. تحريك اليد (Swing Arm)
            bot.swingArm('mainhand');

            // 3. قفزة خفيفة كل فترة عشوائية
            if (Math.random() > 0.5) {
                bot.setControlState('jump', true);
                setTimeout(() => {
                    if (bot) bot.setControlState('jump', false);
                }, 300);
            }
        }, 8000); // يعمل كل 8 ثوانٍ لتخفيف العبء تماماً على المعالج
    }

    // ==========================================================
    // 4. الأحداث وإعادة الاتصال
    // ==========================================================
    bot.on('death', () => {
        console.log('[DEATH] Respawning...');
        setTimeout(() => { if (bot) bot.respawn(); }, 2000);
    });

    bot.on('kicked', (reason) => {
        console.log(`[KICKED] Reason: ${JSON.stringify(reason)}`);
    });

    bot.on('error', (err) => console.log(`[ERROR] ${err.message}`));

    bot.on('end', () => {
        console.log('[DISCONNECT] Disconnected. Reconnecting...');
        handleReconnect();
    });
}

function cleanUp() {
    if (afkInterval) clearInterval(afkInterval);
    if (bot) {
        bot.removeAllListeners();
        bot = null;
    }
}

function handleReconnect() {
    cleanUp();
    reconnectAttempts++;
    const delay = Math.min(5000 * reconnectAttempts, 30000);
    console.log(`[RECONNECT] Waiting ${delay / 1000}s before reconnecting...`);
    setTimeout(createBot, delay);
}

createBot();
