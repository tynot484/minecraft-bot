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
let moveInterval = null;
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
        console.log(`[ONLINE] Bot "${bot.username}" joined! Balanced Smart Movement Active.`);
        reconnectAttempts = 0;
        startBalancedMovement();
    });

    // ==========================================================
    // 3. محرك الحركة المتوازن (تنقل حقيقي + قفز آلي + بينج منخفض)
    // ==========================================================
    function startBalancedMovement() {
        if (moveInterval) clearInterval(moveInterval);

        moveInterval = setInterval(() => {
            if (!bot || !bot.entity) return;

            clearControls();

            // 1. تغيير الاتجاه بشكل عشوائي للتحرك في مجالات مختلفة
            const randomYaw = (Math.random() * 360 - 180) * (Math.PI / 180);
            bot.look(randomYaw, 0, true);

            const actions = ['walkForward', 'circleWalk', 'sneakStep', 'jumpTurn'];
            const chosen = actions[Math.floor(Math.random() * actions.length)];

            switch (chosen) {
                case 'walkForward':
                    // مشي للأمام مع قفزة آلية لتجاوز البلوكات
                    bot.setControlState('forward', true);
                    if (Math.random() > 0.4) bot.setControlState('sprint', true);

                    // قفزة أثناء المشي لتخطي الارتفاعات والعوائق
                    setTimeout(() => {
                        if (bot) {
                            bot.setControlState('jump', true);
                            setTimeout(() => { if (bot) bot.setControlState('jump', false); }, 300);
                        }
                    }, 500);

                    setTimeout(clearControls, 2000);
                    break;

                case 'circleWalk':
                    // مشي زاوي دائر يغير موقعه
                    bot.setControlState('forward', true);
                    bot.setControlState(Math.random() > 0.5 ? 'right' : 'left', true);
                    setTimeout(clearControls, 1800);
                    break;

                case 'sneakStep':
                    // انحناء (Shift) ومشي قصير مع ضرب اليد
                    bot.setControlState('sneak', true);
                    bot.setControlState('forward', true);
                    bot.swingArm('mainhand');
                    setTimeout(clearControls, 1200);
                    break;

                case 'jumpTurn':
                    // قفزة وتصويب في اتجاه آخر
                    bot.setControlState('jump', true);
                    bot.swingArm('mainhand');
                    setTimeout(clearControls, 400);
                    break;
            }
        }, 5000 + Math.random() * 2000); // حركة كل 5 إلى 7 ثوانٍ
    }

    // ==========================================================
    // 4. الأحداث وإعادة الاتصال
    // ==========================================================
    bot.on('death', () => {
        console.log('[DEATH] Respawning...');
        setTimeout(() => { if (bot) bot.respawn(); }, 1500);
    });

    bot.on('kicked', (reason) => console.log(`[KICKED] ${JSON.stringify(reason)}`));
    bot.on('error', (err) => console.log(`[ERROR] ${err.message}`));
    bot.on('end', () => {
        console.log('[DISCONNECT] Reconnecting...');
        handleReconnect();
    });
}

function clearControls() {
    if (!bot) return;
    ['forward', 'back', 'left', 'right', 'jump', 'sneak', 'sprint'].forEach(s => bot.setControlState(s, false));
}

function cleanUp() {
    if (moveInterval) clearInterval(moveInterval);
    if (bot) {
        bot.removeAllListeners();
        bot = null;
    }
}

function handleReconnect() {
    cleanUp();
    reconnectAttempts++;
    const delay = Math.min(4000 * reconnectAttempts, 30000);
    console.log(`[RECONNECT] Waiting ${delay / 1000}s...`);
    setTimeout(createBot, delay);
}

createBot();
