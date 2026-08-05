const express = require('express');
const mineflayer = require('mineflayer');

// ==========================================================
// 1. سيرفر الويب لإبقاء الخدمة حية
// ==========================================================
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => res.status(200).send('dma9 Bot 24/7 Online'));
app.get('/ping', (req, res) => res.status(200).send('PONG'));

app.listen(PORT, () => {
    console.log(`[WEB SERVER] Keep-alive server running on port ${PORT}`);
});

// ==========================================================
// 2. إعدادات الخادم والحساب
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
    // تنظيف الجلسة القديمة والذاكرة لمنع Over Memory
    cleanUp();

    console.log(`[CONNECTING] Attempting to connect to ${config.host}:${config.port}...`);

    try {
        bot = mineflayer.createBot(config);
    } catch (err) {
        console.log(`[INIT ERROR] ${err.message}`);
        handleReconnect();
        return;
    }

    bot.once('spawn', () => {
        console.log(`[ONLINE] Bot "${bot.username}" joined successfully!`);
        reconnectAttempts = 0; // إعادة ضبط عداد المحاولات عند النجاح
        startRealisticBehavior();
    });

    // ==========================================================
    // 3. الحركة الذكية والواقعية
    // ==========================================================
    function startRealisticBehavior() {
        if (afkInterval) clearInterval(afkInterval);

        afkInterval = setInterval(() => {
            if (!bot || !bot.entity) return;

            clearControls();

            const behaviors = ['circle', 'follow', 'jumpLook', 'sneakAround'];
            const chosen = behaviors[Math.floor(Math.random() * behaviors.length)];

            switch (chosen) {
                case 'circle':
                    bot.setControlState('forward', true);
                    bot.setControlState('right', true);
                    setTimeout(clearControls, 1500);
                    break;

                case 'follow':
                    const player = bot.nearestEntity(e => e.type === 'player' && e.username !== bot.username);
                    if (player) {
                        bot.lookAt(player.position.offset(0, player.height, 0), true);
                        bot.setControlState('forward', true);
                        setTimeout(clearControls, 1500);
                    } else {
                        bot.look((Math.random() * 360 - 180) * (Math.PI / 180), 0, true);
                        setTimeout(clearControls, 1000);
                    }
                    break;

                case 'jumpLook':
                    bot.look((Math.random() * 360 - 180) * (Math.PI / 180), 0, true);
                    bot.setControlState('jump', true);
                    bot.swingArm('mainhand');
                    setTimeout(clearControls, 500);
                    break;

                case 'sneakAround':
                    bot.setControlState('sneak', true);
                    bot.swingArm('mainhand');
                    setTimeout(clearControls, 1000);
                    break;
            }
        }, 3000);
    }

    // ==========================================================
    // 4. معالجة الأحداث والأخطاء
    // ==========================================================
    bot.on('death', () => {
        console.log('[DEATH] Respawning...');
        setTimeout(() => { if (bot) bot.respawn(); }, 1000);
    });

    bot.on('kicked', (reason) => console.log(`[KICKED] ${JSON.stringify(reason)}`));
    bot.on('error', (err) => console.log(`[ERROR] ${err.message}`));
    bot.on('end', () => {
        console.log('[DISCONNECT] Connection closed.');
        handleReconnect();
    });
}

function clearControls() {
    if (!bot) return;
    ['forward', 'back', 'left', 'right', 'jump', 'sneak', 'sprint'].forEach(s => bot.setControlState(s, false));
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

    // زيادة زمن الانتظار تدريجياً لمنع إغلاق Render (من 5 ثوانٍ حتى 30 ثانية كحد أقصى)
    const delay = Math.min(5000 * reconnectAttempts, 30000);
    console.log(`[RECONNECT] Reconnecting in ${delay / 1000} seconds (Attempt ${reconnectAttempts})...`);
    
    setTimeout(createBot, delay);
}

createBot();
