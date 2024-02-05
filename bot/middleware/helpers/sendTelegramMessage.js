const bot = require('../../connection/token.connection');

async function sendTelegramMessage(message, format, chatId) {
  try {
    if (format === 'HTML') {
      await bot.telegram.sendMessage(chatId, message, { parse_mode: 'HTML' });
    } else if (format === 'Markdown') {
      await bot.telegram.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    } else {
      await bot.telegram.sendMessage(chatId, message);
    }

    console.log('Message sent successfully');
  } catch (error) {
    console.error(`Failed to send message: ${error}`);
  }
}

module.exports = { sendTelegramMessage };
