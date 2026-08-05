const express = require('express');
const mineflayer = require('mineflayer');

// ==========================================================
// 1. موقع الويب الوهمي لمنع إغلاق Render (Web Service Keep-Alive)
// ==========================================================
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send(`
        <html>
            <head><title>Minecraft Bot Status</title></head>
            <body style="background:#0f172a; color:#fff; font-family:sans-serif; text-align:center; padding-top:50px;">
                <h1 style="color:#38bdf8;">dma9 Bot is Online!</h1>
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
    host: process.env.SERVER_HOST || 'node-de-free-01.tickhosting.com',
    port: parseInt(process.env.SERVER_PORT || '50589'),
    username: process.env.BOT_USERNAME || 'dma9',
    version: process.env.MC_VERSION || '1.21.11',
    auth: process.env.AUTH_TYPE || 'offline'
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
        bot.chat('3aslama el nas el kol! dma9 ma3akum, jit bash n3awankum w n3amlu el jaw bel fa3aliyat!');

        startAntiAFK();
        startAutoEvents();
    });

    // ==========================================================
    // 3. نظام حماية ومحاكاة الحركة البشرية (Anti-Detection / Anti-AFK)
    // ==========================================================
    function startAntiAFK() {
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
        }, 30000 + Math.random() * 20000);
    }

    // إعادة الإحياء التلقائي عند الموت
    bot.on('death', () => {
        setTimeout(() => {
            bot.respawn();
            bot.chat('rja3tlkom ya jma3a! manish msallem!');
        }, 2000);
    });

    // ==========================================================
    // 4. نظام الفعاليات والأسئلة التلقائية والجوائز
    // ==========================================================
    function startAutoEvents() {
        setInterval(() => {
            if (activeEvent.isRunning) return;

            activeEvent.isRunning = true;
            const eventType = Math.floor(Math.random() * 2);

            if (eventType === 0) {
                const n1 = Math.floor(Math.random() * 50) + 10;
                const n2 = Math.floor(Math.random() * 50) + 10;
                activeEvent.answer = (n1 + n2).toString();
                bot.chat(`[EVENT] 7sebha fisa3! 9dash tetla3 ${n1} + ${n2}? Asra3 wa7ed yjawb yerba7 $50,000 wala mefta7 Crate!`);
            } else {
                const chosenWord = wordsList[Math.floor(Math.random() * wordsList.length)];
                activeEvent.answer = chosenWord;
                bot.chat(`[EVENT] Ta7addi el sor3a! Ekteb el kelma hedhi fisa3 bash terba7: "${chosenWord}"`);
            }

            activeEvent.timeout = setTimeout(() => {
                if (activeEvent.isRunning) {
                    bot.chat(`[EVENT] Wfa el wa9t w ma jawab 7ad sa7! El ijaba heya: ${activeEvent.answer}`);
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
                bot.chat(`[EVENT] Ya3tik el sa7a ya ${username}! Jebtha sa7i7a!`);
                
                const rewardType = Math.random() > 0.5 ? 'money' : 'key';
                
                if (rewardType === 'money') {
                    bot.chat(`/eco give ${username} 50000`);
                    bot.chat(`[REWARD] Sabitlek $50,000 ya ${username}! Mabrouk 3lik!`);
                } else {
                    bot.chat(`/crate key give ${username} common 1`);
                    bot.chat(`[REWARD] 3titek mefta7 Crate ya ${username}! Mabrouk 3lik!`);
                }

                resetEvent();
                return;
            }
        }

        // منع السبام
        const now = Date.now();
        const lastMsgTime = userCooldowns.get(username) || 0;
        if (now - lastMsgTime < 4000) return;
        userCooldowns.set(username, now);

        // تصحيح الأخطاء والتفاعل بالتونسي (Tounsi Franco/Arabizi)
        if (lowerMsg === 'spwn' || lowerMsg === 'spwan') {
            bot.chat(`Ya ${username} thabet rou7ek, t9asd /spawn? Ekteb "/spawn" w tawa tmshi lel spawn!`);
        } else if (lowerMsg === 'shopp' || lowerMsg === 'sop') {
            bot.chat(`Ya ${username} t7eb t7el el market? Ekteb "/shop" bash teshri w tbi3!`);
        } else if (lowerMsg === 'rtpp' || lowerMsg === 'wildd') {
            bot.chat(`Ya ${username} t7eb t5roj lel barriya? Ekteb "/rtp" w tawa ttir l blasa b3ida!`);
        } else if (lowerMsg === 'balence' || lowerMsg === 'balanc') {
            bot.chat(`Ya ${username} ekteb "/bal" bash tshouf flousek 9dash!`);
        } else if (lowerMsg.includes('how to get money') || lowerMsg.includes('kifash njib flous')) {
            bot.chat(`${username}, tnedjem tdabel el flous 3an 7saab /jobs wala tbi3 sel3tek fi /shop!`);
        } else if (lowerMsg === 'hi dma9' || lowerMsg === 'hello dma9' || lowerMsg === '3aslama dma9') {
            bot.chat(`Ya3ishek ya ${username}! Mar7ba bik, kan t7a9 ay 7aja es2el fi el chat!`);
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
