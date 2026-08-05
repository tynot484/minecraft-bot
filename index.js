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
let stuckCheckInterval = null;
let lastPosition = null;
let isUnsticking = false;
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
        console.log(`[ONLINE] Bot "${bot.username}" joined! Smart Jump & Unstuck Active.`);
        reconnectAttempts = 0;
        startRealisticBehavior();
        startStuckDetector();
    });

    // ==========================================================
    // 3. نظام كشف الانحشار والقفز المستمر مع تغيير الاتجاه
    // ==========================================================
    function startStuckDetector() {
        if (stuckCheckInterval) clearInterval(stuckCheckInterval);

        stuckCheckInterval = setInterval(() => {
            if (!bot || !bot.entity || isUnsticking) return;

            const currentPos = bot.entity.position;

            // إذا كان يحاول التقدم ولكن لم يتحرك مسافة كافية
            if (lastPosition && bot.controlState.forward) {
                const distanceMoved = currentPos.distanceTo(lastPosition);

                if (distanceMoved < 0.25) {
                    isUnsticking = true;
                    console.log('[UNSTUCK] Obstacle detected! Turning & Continuous Jumping...');

                    // 1. التفات بزاوية عشوائية لتفادي الجدار
                    const randomTurn = (Math.random() > 0.5 ? 1 : -1) * (Math.PI / 3);
                    const currentYaw = bot.entity.yaw;
                    bot.look(currentYaw + randomTurn, 0, true);

                    // 2. قفز وجري مستمر مع التقدم لمدة 1.5 ثانية
                    bot.setControlState('forward', true);
                    bot.setControlState('sprint', true);
                    bot.setControlState('jump', true);

                    setTimeout(() => {
                        if (bot) {
                            bot.setControlState('jump', false);
                            bot.setControlState('sprint', false);
                        }
                        isUnsticking = false;
                    }, 1500);
                }
            }

            lastPosition = currentPos.clone();
        }, 800);
    }

    // ==========================================================
    // 4. محرك الحركة الواقعية
    // ==========================================================
    function startRealisticBehavior() {
        if (afkInterval) clearInterval(afkInterval);

        afkInterval = setInterval(() => {
            if (!bot || !bot.entity || isUnsticking) return;

            clearControls();

            const behaviors = ['circle', 'follow', 'jumpLook', 'sneakAround'];
            const chosen = behaviors[Math.floor(Math.random() * behaviors.length)];

            switch (chosen) {
                case 'circle':
                    bot.setControlState('forward', true);
                    bot.setControlState('right', true);
                    if (Math.random() > 0.3) bot.setControlState('sprint', true);
                    setTimeout(clearControls, 2200);
                    break;

                case 'follow':
                    const player = bot.nearestEntity(e => e.type === 'player' && e.username !== bot.username);
                    if (player) {
                        bot.lookAt(player.position.offset(0, player.height, 0), true);
                        bot.setControlState('forward', true);
                        if (Math.random() > 0.5) bot.setControlState('jump', true);
                        setTimeout(clearControls, 2000);
                    } else {
                        bot.look((Math.random() * 360 - 180) * (Math.PI / 180), 0, true);
                        bot.setControlState('forward', true);
                        setTimeout(clearControls, 1200);
                    }
                    break;

                case 'jumpLook':
                    bot.look((Math.random() * 360 - 180) * (Math.PI / 180), 0, true);
                    bot.setControlState('forward', true);
                    bot.setControlState('jump', true);
                    bot.swingArm('mainhand');
                    setTimeout(clearControls, 800);
                    break;

                case 'sneakAround':
                    bot.setControlState('sneak', true);
                    bot.swingArm('mainhand');
                    setTimeout(clearControls, 1200);
                    break;
            }
        }, 3000);
    }

    // ==========================================================
    // 5. الأحداث وإعادة الاتصال الذكي
    // ==========================================================
    bot.on('death', () => {
        console.log('[DEATH] Respawning...');
        setTimeout(() => { if (bot) bot.respawn(); }, 1000);
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
    if (afkInterval) clearInterval(afkInterval);
    if (stuckCheckInterval) clearInterval(stuckCheckInterval);
    lastPosition = null;
    isUnsticking = false;
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
