const express = require('express');
const mineflayer = require('mineflayer');

// ==========================================================
// 1. موقع الويب الوهمي لمنع إغلاق Render (Web Service Keep-Alive)
// ==========================================================
const app = express();
const PORT = process.env.3000 || 3000;

app.get('/', (req, res) => {
    res.send(`
        <html>
            <head><title>Minecraft Bot Status</title></head>
            <body style="background:#0f172a; color:#fff; font-family:sans-serif; text-align:center; padding-top:50px;">
                <h1 style="color:#38bdf8;">Minecraft AdminBot is Online!</h1>
                <p>Status: Keep-Alive Server is Active 24/7 on Render.</p>
            </body>
        </html>
    `);
});

app.get('/ping', (req, res) => res.status(200).send('PONG'));

app.listen(PORT, () => {
    console.log(`[WEB SERVER] Running on port ${PORT}`);
});

// ==========================================================
// 2. إعدادات خادم ماينكرافت والحساب
// ==========================================================
const config = {
    host: process.env.node-de-free-01.tickhosting.com || 'YOUR_SERVER_IP', // ضع IP سيرفرك هنا
    port: parseInt(process.env.50589 || '25565'),
    username: process.env.dma9 || 'AdminBot',
    version: process.env.1.21.11 || '1.20.4',
    auth: process.env.offline || 'offline'
};

let bot = null;
let activeEvent = { isRunning: false, answer: null, type: null, timeout: null };
const userCooldowns = new Map();

// قائمة الكلمات لفعاليات الكتابة
const wordsList = ['DIAMOND', 'NETHERITE', 'SURVIVAL', 'MINECRAFT', 'PROTECTION', 'VICTORY'];

function createBot() {
    console.log('[SYSTEM] Connecting to Minecraft server...');
    bot = mineflayer.createBot(config);

    // عند دخول البوت للعبة
    bot.once('spawn', () => {
        console.log(`[SUCCESS] Bot "${bot.username}" joined the server!`);
        bot.chat('Hello everyone! AdminBot is now online to help and run events!');

        startAntiAFK();
        startAutoEvents();
    });

    // ==========================================================
    // 3. نظام حماية ومحاكاة الحركة البشرية (Anti-Detection / Anti-AFK)
    // ==========================================================
    function startAntiAFK() {
        // حركات عشوائية بأوقات متغيرة لتفادي كشف البوت
        setInterval(() => {
            if (!bot || !bot.entity) return;

            const actions = ['jump', 'sneak', 'lookAround', 'lookAtPlayer'];
            const randomAction = actions[Math.floor(Math.random() * actions.length)];

            if (randomAction === 'jump') {
                bot.setControlState('jump', true);
                setTimeout(() => bot.setControlState('jump', false), 400 + Math.random() * 300);
            } 
            else if (randomAction === 'sneak') {
                bot.setControlState('sneak', true);
                setTimeout(() => bot.setControlState('sneak', false), 800 + Math.random() * 600);
            } 
            else if (randomAction === 'lookAround') {
                const randomYaw = Math.random() * Math.PI * 2;
                const randomPitch = (Math.random() - 0.5) * (Math.PI / 2);
                bot.look(randomYaw, randomPitch, true);
            } 
            else if (randomAction === 'lookAtPlayer') {
                const player = bot.nearestEntity(e => e.type === 'player' && e.username !== bot.username);
                if (player) {
                    bot.lookAt(player.position.offset(0, player.height, 0));
                }
            }
        }, 30000 + Math.random() * 20000); // تتنفذ كل 30 إلى 50 ثانية بشكل عشوائي
    }

    // إعادة الإحياء التلقائي عند الموت
    bot.on('death', () => {
        setTimeout(() => {
            bot.respawn();
            bot.chat('I am back!');
        }, 2000);
    });

    // ==========================================================
    // 4. نظام الفعاليات والأسئلة التلقائية والجوائز
    // ==========================================================
    function startAutoEvents() {
        // فعالية كل 12 دقيقة
        setInterval(() => {
            if (activeEvent.isRunning) return;

            activeEvent.isRunning = true;
            const eventType = Math.floor(Math.random() * 2); // 0: Math, 1: Typing

            if (eventType === 0) {
                const n1 = Math.floor(Math.random() * 50) + 10;
                const n2 = Math.floor(Math.random() * 50) + 10;
                activeEvent.answer = (n1 + n2).toString();
                bot.chat(`[EVENT] Math Challenge! What is ${n1} + ${n2}? Fast answer wins $50,000 or a Crate Key!`);
            } else {
                const chosenWord = wordsList[Math.floor(Math.random() * wordsList.length)];
                activeEvent.answer = chosenWord;
                bot.chat(`[EVENT] Speed Test! Type this word fast: "${chosenWord}" to win!`);
            }

            // وقت إضافي للفعالية (40 ثانية)
            activeEvent.timeout = setTimeout(() => {
                if (activeEvent.isRunning) {
                    bot.chat(`[EVENT] Time is up! Nobody answered correctly. Answer was: ${activeEvent.answer}`);
                    resetEvent();
                }
            }, 40000);

        }, 12 * 60 * 1000);
    }

    function resetEvent() {
        activeEvent.isRunning = false;
        activeEvent.answer = null;
        if (activeEvent.timeout) clearTimeout(activeEvent.timeout);
    }

    // ==========================================================
    // 5. إدارة الدردشة، تصحيح الأخطاء، والتحقق من الفائزين
    // ==========================================================
    bot.on('chat', (username, message) => {
        if (username === bot.username) return;

        const cleanMessage = message.trim();
        const lowerMsg = cleanMessage.toLowerCase();

        // فحص الفائز بالفعالية
        if (activeEvent.isRunning && activeEvent.answer) {
            if (cleanMessage.toUpperCase() === activeEvent.answer.toUpperCase()) {
                bot.chat(`[EVENT] Winner! ${username} got it right!`);
                
                // إعطاء الجوائز تلقائياً باستخدام أوامر OP
                const rewardType = Math.random() > 0.5 ? 'money' : 'key';
                
                if (rewardType === 'money') {
                    bot.chat(`/eco give ${username} 50000`);
                    bot.chat(`[REWARD] Given $50,000 to ${username}!`);
                } else {
                    bot.chat(`/crate key give ${username} common 1`);
                    bot.chat(`[REWARD] Given 1x Crate Key to ${username}!`);
                }

                resetEvent();
                return;
            }
        }

        // منع السبام: استجابة واحدة لكل لاعب كل 4 ثوانٍ
        const now = Date.now();
        const lastMsgTime = userCooldowns.get(username) || 0;
        if (now - lastMsgTime < 4000) return;
        userCooldowns.set(username, now);

        // تصحيح الأخطاء الشائعة في الأوامر (بلغة إنجليزية سهلة)
        if (lowerMsg === 'spwn' || lowerMsg === 'spwan') {
            bot.chat(`Hey ${username}, did you mean /spawn? Type "/spawn" to go to spawn!`);
        } else if (lowerMsg === 'shopp' || lowerMsg === 'sop') {
            bot.chat(`Hey ${username}, did you mean /shop? Type "/shop" to open market!`);
        } else if (lowerMsg === 'rtpp' || lowerMsg === 'wildd') {
            bot.chat(`Hey ${username}, did you mean /rtp? Type "/rtp" to teleport to wild!`);
        } else if (lowerMsg === 'balence' || lowerMsg === 'balanc') {
            bot.chat(`Hey ${username}, type "/bal" to check your money balance!`);
        } else if (lowerMsg.includes('how to get money')) {
            bot.chat(`${username}, you can get money by /jobs or selling items in /shop!`);
        } else if (lowerMsg === 'hi adminbot' || lowerMsg === 'hello adminbot') {
            bot.chat(`Hello ${username}! Nice to see you! Type /help if you need info.`);
        }
    });

    // ==========================================================
    // 6. التعامل مع الانقطاع وإعادة الاتصال التلقائي
    // ==========================================================
    bot.on('kicked', (reason) => console.log(`[KICKED] Reason: ${reason}`));
    bot.on('error', (err) => console.log(`[ERROR] ${err.message}`));
    
    bot.on('end', () => {
        console.log('[DISCONNECT] Reconnecting in 10 seconds...');
        setTimeout(createBot, 10000);
    });
}

// بدء التشغيل
createBot();
