const path = require('path');
const fs = require('fs');
const { LunarZodiacRecommendations, LunarDayAdvice } = require('../../../models/index.js');
const { sendTelegramMessage } = require('../helpers/sendTelegramMessage.js');

function formatDateToDDMMYYYY(date) {
  let day = date.getDate().toString();
  let month = (date.getMonth() + 1).toString();
  let year = date.getFullYear();

  // Добавляем ведущий ноль для дня и месяца, если это необходимо
  day = day.length < 2 ? '0' + day : day;
  month = month.length < 2 ? '0' + month : month;

  return `${day}.${month}.${year}`;
}

// Функция для формирования постов
async function createTelegramPosts() {
  // 1. Определяем текущую дату

  const today = new Date();
  const formattedToday = formatDateToDDMMYYYY(today);

  console.log(formattedToday);
  // 2. Считываем данные из JSON файла
  const filePath = path.join(__dirname, '../data/files/lunar_calendar_january_2024.json');

  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  //   console.log(data);

  const todayData = data[formattedToday];

  if (!todayData) {
    console.log('No data for today.');
    return;
  }

  // 3. Получаем данные из таблиц
  const lunarZodiacRecommendation = await LunarZodiacRecommendations.findOne({
    where: { zodiac_sign: todayData.moon_zodiac_sign },
  });
  const lunarDayAdvice1 = await LunarDayAdvice.findOne({
    where: { lunar_day: todayData.moonday_1 },
  });
  const lunarDayAdvice2 = await LunarDayAdvice.findOne({
    where: { lunar_day: todayData.moonday_2 },
  });

  // 4. Формируем посты для Telegram
  const post1 =
    `🌝 <b>Лунный календарь на ${today}</b>\n\n` +
    `${today} - это ${todayData.moonday_1}${
      todayData.moonday_2 ? ' и ' + todayData.moonday_2 : ''
    } лунные дни\n\n` +
    `🌔 ${todayData.moon_phase} находится в ${todayData.moon_zodiac_sign}\n\n` +
    `Восход ⬆️ ${todayData.moon_rise}\n` +
    `Закат ⬇️ ${todayData.moon_set}\n\n` +
    `<b>Рекомендации на ${todayData.moonday_1} лунный день:</b>\n\n` +
    `${
      lunarDayAdvice1
        ? lunarDayAdvice1.success_harmony + '\n' + lunarDayAdvice1.avoid
        : 'Нет данных'
    }` +
    (todayData.moonday_2
      ? `\n\n<b>Рекомендации на ${todayData.moonday_2} лунный день:</b>\n\n` +
        `${
          lunarDayAdvice2
            ? lunarDayAdvice2.success_harmony + '\n' + lunarDayAdvice2.avoid
            : 'Нет данных'
        }`
      : '');

  const post2 =
    `🌝<b>Лунный календарь на ${today}</b>\n\n` +
    `<b>Луна в ${todayData.moon_zodiac_sign} ♈️</b>\n\n` +
    `${lunarZodiacRecommendation ? lunarZodiacRecommendation.description : 'Нет данных'}`;

  // Отправка сообщений в Telegram (предполагается, что функция отправки уже настроена)
  sendTelegramMessage(post1, 'HTML', '-1002090026985');
  sendTelegramMessage(post2, 'HTML', '-1002090026985');
}

// Запуск функции
module.exports = createTelegramPosts;
