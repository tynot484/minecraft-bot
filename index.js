const express = require('express');
const mineflayer = require('mineflayer');

// ==========================================================
// 1. خادم الويب الوهمي لمنع إغلاق الخدمة على Render
// ==========================================================
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('dma9 24/7 Active Bot with Realistic Human Behavior');
});

app.get('/ping', (req, res) => res.status(200).send('PONG'));

app.listen(PORT, () => {
    console.log(`[WEB SERVER] Running on port ${PORT}`);
});

// ==========================================================
// 2. إعدادات الخادم والحساب
// ==========================================================
const config = {
    host: process.env.SERVER_HOST || 'node-de-free-01.tickhosting.com',
    port: parseInt(process.env.SERVER_PORT || '50589'),
    username: process.env.BOT_USERNAME || 'dma9',
    version: false, // التعرف التلقائي على إصدار ماينكرافت
    auth: process.env.AUTH_TYPE || 'offline'
};

let bot = null;
let isReconnecting = false;
let afkInterval = null;
const RECONNECT_DELAY = 3000; // إعادة الاتصال خلال 3 ثوانٍ

function createBot() {
    isReconnecting = false;
    console.log(`[CONNECTING] Connecting to ${config.host}:${config.port}...`);

    bot = mineflayer.createBot(config);

    bot.once('spawn', () => {
        console.log(`[ONLINE] Bot "${bot.username}" joined! Realistic movement active.`);
        startRealisticBehavior();
    });

    // ==========================================================
    // 3. نظام الحركة الواقعية (دائرة، تتبع، قفز، تفاعل)
    // ==========================================================
    function clearControls() {
        if (!bot) return;
        const states = ['forward', 'back', 'left', 'right', 'jump', 'sneak', 'sprint'];
        states.forEach(state => bot.setControlState(state, false));
    }

    function startRealisticBehavior() {
        if (afkInterval) clearInterval(afkInterval);

        // تنفيـذ حركة كل 2.5 إلى 4 ثوانٍ لضمان عدم التوقف
        afkInterval = setInterval(() => {
            if (!bot || !bot.entity) return;

            clearControls();

            const behaviors = ['circle', 'follow', 'jumpLook', 'sneakAround', 'swingStep'];
            const chosen = behaviors[Math.floor(Math.random() * behaviors.length)];

            switch (chosen) {
                case 'circle':
                    // المشي أو الركض في شكل دائري
                    bot.setControlState('forward', true);
                    bot.setControlState('right', true);
                    if (Math.random() > 0.4) bot.setControlState('sprint', true);

                    setTimeout(() => clearControls(), 2000 + Math.random() * 1000);
                    break;

                case 'follow':
                    // البحث عن أقرب لاعب ومتابعته
                    const playerFilter = e => e.type === 'player' && e.username !== bot.username && e.position.distanceTo(bot.entity.position) < 20;
                    const targetPlayer = bot.nearestEntity(playerFilter);

                    if (targetPlayer) {
                        bot.lookAt(targetPlayer.position.offset(0, targetPlayer.height, 0), true);
                        bot.setControlState('forward', true);
                        if (Math.random() > 0.5) bot.setControlState('jump', true);

                        setTimeout(() => clearControls(), 2000 + Math.random() * 1000);
                    } else {
                        // إذا لم يوجد لاعب، يلتفت ويمشي خطوتين
                        bot.look((Math.random() * 360 - 180) * (Math.PI / 180), 0, true);
                        bot.setControlState('forward', true);
                        setTimeout(() => clearControls(), 1500);
                    }
                    break;

                case 'jumpLook':
                    // قفز مع التفات الرأس بمرونة كشخص حقيقي
                    const yaw = (Math.random() * 360 - 180) * (Math.PI / 180);
                    const pitch = (Math.random() * 60 - 30) * (Math.PI / 180);
                    bot.look(yaw, pitch, true);
                    bot.setControlState('jump', true);
                    bot.swingArm('mainhand');

                    setTimeout(() => clearControls(), 600);
                    break;

                case 'sneakAround':
                    // الانحناء (Shift) وتحريك اليد
                    bot.setControlState('sneak', true);
                    bot.swingArm('mainhand');
                    setTimeout(() => clearControls(), 1000 + Math.random() * 800);
                    break;

                case 'swingStep':
                    // الرجوع للخلف وضربه في الهواء
                    bot.swingArm('mainhand');
                    bot.setControlState('back', true);
                    setTimeout(() => clearControls(), 700);
                    break;
            }
        }, 2500 + Math.random() * 1500);
    }

    // ==========================================================
    // 4. معالجة السقوط والانقطاع والموت
    // ==========================================================
    bot.on('death', () => {
        console.log('[DEATH] Bot died. Respawning in 1s...');
        setTimeout(() => {
            if (bot) bot.respawn();
        }, 1000);
    });

    bot.on('kicked', (reason) => {
        console.log(`[KICKED] Reason: ${JSON.stringify(reason)}`);
    });

    bot.on('error', (err) => {
        console.log(`[ERROR] ${err.message}`);
    });

    bot.on('end', (reason) => {
        if (afkInterval) clearInterval(afkInterval);
        console.log(`[DISCONNECT] Reason: ${reason}`);
        reconnect();
    });
}

function reconnect() {
    if (isReconnecting) return;
    isReconnecting = true;

    if (afkInterval) clearInterval(afkInterval);
    if (bot) {
        bot.removeAllListeners();
        bot = null;
    }

    console.log(`[RECONNECTING] Retrying connection in ${RECONNECT_DELAY / 1000} seconds...`);
    setTimeout(createBot, RECONNECT_DELAY);
}

// بدء التشغيل
createBot();
