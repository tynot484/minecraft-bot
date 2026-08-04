const mineflayer = require('mineflayer');

const bot = mineflayer.createBot({
  host: 'node-de-free-01.tickhosting.com',
  port: 50589,
  username: 'ServerGuardian',
  version: false
});

bot.on('spawn', () => {
  console.log('تم تشغيل البوت بنجاح وحراسة السيرفر نشطة!');
  
  // نظام منع الطرد (القفز وتحريك الرأس كل دقيقة)
  setInterval(() => {
    bot.setControlState('jump', true);
    setTimeout(() => {
      bot.setControlState('jump', false);
    }, 500);
    
    const yaw = bot.entity.yaw + 1;
    bot.look(yaw, bot.entity.pitch);
  }, 60000);
});

bot.on('end', () => {
  console.log('انقطع الاتصال، جاري إعادة المحاولة...');
  setTimeout(() => process.exit(1), 10000);
});

bot.on('error', (err) => {
  console.log('حدث خطأ:', err);
});
