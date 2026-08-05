const express = require('express');
const mineflayer = require('mineflayer');

// ==========================================================
// 1. خادم الويب الوهمي لإبقاء الخدمة نشطة على Render
// ==========================================================
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
            <head><title>Bot Status</title></head>
            <body style="background:#0f172a; color:#f8fafc; font-family:sans-serif; text-align:center; padding-top:50px;">
                <h1 style="color:#38bdf8;">dma9 Anti-AFK Bot Active</h1>
                <p>Status: Keep-Alive Server Operational 24/7</p>
            </body>
        </html>
    `);
});

app.get('/ping', (req, res) => res.status(200).send('PONG'));

app.listen(PORT, () => {
    console.log(`[WEB SERVER] Keep-alive server running on port ${PORT}`);
});

// ==========================================================
// 2. إعدادات خادم ماينكرافت والحساب
// ==========================================================
const config = {
    host: process.env.SERVER_HOST || 'node-de-free-01.tickhosting.com',
    port: parseInt(process.env.SERVER_PORT || '50589'),
    username: process.env.BOT_USERNAME || 'dma9',
    version: process.env.MC_VERSION || '1.20.4',
    auth: process.env.AUTH_TYPE || 'offline'
};

let bot = null;

function createBot() {
    console.log('[SYSTEM] Connecting to server...');
    bot = mineflayer.createBot(config);

    bot.once('spawn', () => {
        console.log(`[SUCCESS] Bot "${bot.username}" connected successfully.`);
        startSmartAntiAFK();
    });

    // ==========================================================
    // 3. محرك الحركة الذكي وتجاوز حماية Anti-AFK
    // ==========================================================
    function startSmartAntiAFK() {
        // حركات غير منتظمة بفترات زمنية عشوائية لتفادي أنظمة الكشف التلقائي
        function scheduleNextAction() {
            if (!bot || !bot.entity) return;

            const actions = ['jump', 'sneak', 'walkStep', 'lookAround', 'swingArm'];
            const chosenAction = actions[Math.floor(Math.random() * actions.length)];

            switch (chosenAction) {
                case 'jump':
                    bot.setControlState('jump', true);
                    setTimeout(() => bot.setControlState('jump', false), 350 + Math.random() * 200);
                    break;

                case 'sneak':
                    // الجلوس / الانحناء لمدات متغيرة
                    bot.setControlState('sneak', true);
                    setTimeout(() => bot.setControlState('sneak', false), 1000 + Math.random() * 1500);
                    break;

                case 'walkStep':
                    // خطوة صغيرة للأمام والخلف لتنشيط إحداثيات الموقع
                    const direction = Math.random() > 0.5 ? 'forward' : 'back';
                    bot.setControlState(direction, true);
                    setTimeout(() => {
                        bot.setControlState(direction, false);
                    }, 250 + Math.random() * 200);
                    break;

                case 'lookAround':
                    // التفات الرأس بزوايا بشرية واقعية
                    const randomYaw = (Math.random() * 360 - 180) * (Math.PI / 180);
                    const randomPitch = (Math.random() * 60 - 30) * (Math.PI / 180);
                    bot.look(randomYaw, randomPitch, true);
                    break;

                case 'swingArm':
                    // تحريك اليد (Left Click Action)
                    bot.swingArm('mainhand');
                    break;
            }

            // تحديد موعد الحركة القادمة بشكل عشوائي بين 12 إلى 35 ثانية
            const nextInterval = 12000 + Math.floor(Math.random() * 23000);
            setTimeout(scheduleNextAction, nextInterval);
        }

        scheduleNextAction();
    }

    // ==========================================================
    // 4. نظام إعادة الإحياء التلقائي وإعادة الاتصال
    // ==========================================================
    bot.on('death', () => {
        console.log('[PHYSICS] Bot died. Respawning...');
        setTimeout(() => {
            if (bot) bot.respawn();
        }, 2000);
    });

    bot.on('kicked', (reason) => {
        console.log(`[KICKED] Reason: ${reason}`);
    });

    bot.on('error', (err) => {
        console.log(`[ERROR] ${err.message}`);
    });

    bot.on('end', () => {
        console.log('[DISCONNECT] Reconnecting in 10 seconds...');
        bot.removeAllListeners();
        setTimeout(createBot, 10000);
    });
}

createBot();
