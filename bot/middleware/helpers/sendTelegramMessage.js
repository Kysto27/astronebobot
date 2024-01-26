const fetch = require('node-fetch');

async function sendTelegramMessage(message, format, chatId) {
  const telegramBotToken = ''; // Замените на токен вашего бота
  const url = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: format, // HTML или Markdown
      }),
    });

    const responseData = await response.json();
    if (!response.ok) {
      throw new Error(`Error: ${responseData.description}`);
    }

    console.log('Message sent successfully');
  } catch (error) {
    console.error(`Failed to send message: ${error}`);
  }
}

module.exports = { sendTelegramMessage };
