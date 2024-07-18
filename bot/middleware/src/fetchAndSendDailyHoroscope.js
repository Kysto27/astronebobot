const cron = require('node-cron');
const axios = require('axios');
const xml2js = require('xml2js');
const { sendTelegramMessage } = require('../helpers/sendTelegramMessage.js');

const zodiacSigns = [
  'aries',
  'taurus',
  'gemini',
  'cancer',
  'leo',
  'virgo',
  'libra',
  'scorpio',
  'sagittarius',
  'capricorn',
  'aquarius',
  'pisces',
];

const zodiacSignsEmoji = {
  aries: '🐏 ОВЕН',
  taurus: '🐂 ТЕЛЕЦ',
  gemini: '👯 БЛИЗНЕЦЫ',
  cancer: '🦀 РАК',
  leo: '🦁 ЛЕВ',
  virgo: '👩‍🌾 ДЕВА',
  libra: '⚖️ ВЕСЫ',
  scorpio: '🦂 СКОРПИОН',
  sagittarius: '🏹 СТРЕЛЕЦ',
  capricorn: '🐐 КОЗЕРОГ',
  aquarius: '🌊 ВОДОЛЕЙ',
  pisces: '🐟 РЫБЫ',
};

async function fetchAndSendDailyHoroscope() {
  try {
    const response = await axios.get('https://ignio.com/r/export/utf/xml/daily/com.xml');
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(response.data);
    const today = new Date().toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      weekday: 'long',
    });
    let messageText = `<b>🌟 ГОРОСКОП НА ${today.toUpperCase()}</b>\n\n`;

    zodiacSigns.forEach((sign) => {
      const signData = result.horo[sign][0].today[0].trim();
      messageText += `<b>${zodiacSignsEmoji[sign]}</b>\n${signData}\n\n`;
    });

    // Тестовый канал
    // channelId = -1002006293037

    // Небесный прогноз
    channelId = -1001916023417;

    sendTelegramMessage(messageText, 'HTML', channelId);
  } catch (error) {
    console.error('Ошибка при получении или отправке гороскопа:', error);
  }
}

const scheduleDailyHoroscopeToChannel = () => {
  cron.schedule('07 07 * * *', () => {
    fetchAndSendDailyHoroscope();
  });
};

module.exports = scheduleDailyHoroscopeToChannel;
