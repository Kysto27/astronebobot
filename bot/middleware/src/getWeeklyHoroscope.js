const cron = require('node-cron');
const axios = require('axios');
const xml2js = require('xml2js');
const { HoroscopePrevWeek, HoroscopeCurWeek } = require('../../../models/index.js');

async function fetchAndSaveHoroscope() {
  try {
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

    // Обработка данных для предыдущей недели
    await processHoroscopeData(
      'https://ignio.com/r/export/utf/xml/weekly/prev.xml',
      HoroscopePrevWeek,
      zodiacSigns
    );

    // Обработка данных для текущей недели
    await processHoroscopeData(
      'https://ignio.com/r/export/utf/xml/weekly/cur.xml',
      HoroscopeCurWeek,
      zodiacSigns
    );
  } catch (error) {
    console.error('Ошибка при получении или обработке данных гороскопа:', error);
  }
}

async function processHoroscopeData(url, Model, zodiacSigns) {
  const response = await axios.get(url);
  const parser = new xml2js.Parser();
  const result = await parser.parseStringPromise(response.data);
  const dateRange = result.horo.date[0].$.weekly;

  for (let i = 0; i < zodiacSigns.length; i++) {
    const signData = result.horo[zodiacSigns[i]][0];
    const zodiacSignId = i + 1;

    // Попытаться найти существующую запись
    let record = await Model.findOne({ where: { zodiac_sign_id: zodiacSignId } });

    if (record) {
      // Обновить существующую запись
      await record.update({
        date_range: dateRange,
        business: signData.business[0].trim(),
        common: signData.common[0].trim(),
        love: signData.love[0].trim(),
        health: signData.health[0].trim(),
        beauty: signData.beauty[0].trim(),
      });
    } else {
      // Создать новую запись
      await Model.create({
        zodiac_sign_id: zodiacSignId,
        date_range: dateRange,
        business: signData.business[0].trim(),
        common: signData.common[0].trim(),
        love: signData.love[0].trim(),
        health: signData.health[0].trim(),
        beauty: signData.beauty[0].trim(),
      });
    }
  }
}
const scheduleHoroscopeUpdates = () => {
  cron.schedule('45 14 * * 5', () => {
    console.log('Запуск задачи по сбору данных гороскопа');
    fetchAndSaveHoroscope();
  });
};

module.exports = scheduleHoroscopeUpdates;
