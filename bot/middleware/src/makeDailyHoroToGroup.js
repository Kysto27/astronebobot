const bot = require('../../connection/token.connection');
const cron = require('node-cron');
require('dotenv').config();
function formatDateToFullDate(date) {
  const day = date.getDate();
  const monthNames = [
    'января',
    'февраля',
    'марта',
    'апреля',
    'мая',
    'июня',
    'июля',
    'августа',
    'сентября',
    'октября',
    'ноября',
    'декабря',
  ];
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();

  return `${day} ${month} ${year} года`;
}

async function sendDailyHoroscopeMessage() {
  const groupId = process.env.LUNAR_CALEND_GROUP_CHATID;
  const today = new Date();
  const formattedDate = formatDateToFullDate(today);
  const message = `Гороскоп на ${formattedDate} для всех знаков зодиака`;
  const chatId = groupId;
  try {
    await bot.telegram.sendMessage(chatId, message, {
      reply_markup: {
        inline_keyboard: [[{ text: 'Читать гороскоп', url: 'https://t.me/+H1FxQg4jV69lMGMy' }]],
      },
    });
    console.log('Сообщение успешно отправлено');
  } catch (error) {
    console.error('Ошибка при отправке сообщения:', error);
  }
}

// Вызов функции для отправки сообщения
module.exports = sendDailyHoroscopeMessage;

const scheduledDailyHoroscopeMessage = () => {
  cron.schedule('0 8 * * *', () => {
    // console.log('Запуск функции createTelegramPosts() каждый день в 19:00');
    sendDailyHoroscopeMessage().catch((error) =>
      console.error('Ошибка при запуске createTelegramPosts:', error)
    );
  });
};

module.exports = scheduledDailyHoroscopeMessage;
