require('dotenv').config();
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');
const { LunarZodiacRecommendations, LunarDayAdvice } = require('../../../models/index.js');
const { sendTelegramMessage } = require('../helpers/sendTelegramMessage.js');

function formatDateToDDMMYYYY(date) {
  let day = date.getDate().toString();
  let month = (date.getMonth() + 1).toString();
  let year = date.getFullYear();
  day = day.length < 2 ? '0' + day : day;
  month = month.length < 2 ? '0' + month : month;

  return `${day}.${month}.${year}`;
}

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

function getTomorrow() {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1); // Добавляем один день к текущей дате
  return tomorrow;
}

function formatMoonPhase(moonPhase, moonPhaseStartTime) {
  const specialPhases = ['Новолуние', '1-я лунная четверть', 'Полнолуние', '3-я лунная четверть'];
  const emojis = {
    Новолуние: '🌑 Новолуние',
    '1-я лунная четверть': '🌓 1-я лунная четверть',
    Полнолуние: '🌕 Полнолуние',
    '3-я лунная четверть': '🌗 3-я лунная четверть',
    'Юная растущая Луна': '🌒 Юная растущая Луна',
    'Молодая растущая Луна': '🌒 Молодая растущая Луна',
    'Взрослая убывающая Луна': '🌖 Взрослая убывающая Луна',
    'Старая убывающая Луна': '🌖 Старая убывающая Луна',
  };

  if (specialPhases.includes(moonPhase) && moonPhaseStartTime) {
    return `${emojis[moonPhase]}, начало в ${moonPhaseStartTime}`;
  } else {
    return emojis[moonPhase] || moonPhase;
  }
}

function formatZodiacSignWithEmoji(zodiacSign) {
  const zodiacEmojis = {
    Овен: '♈️',
    Телец: '♉️',
    Близнецы: '♊️',
    Рак: '♋️',
    Лев: '♌️',
    Дева: '♍️',
    Весы: '♎️',
    Скорпион: '♏️',
    Стрелец: '♐️',
    Козерог: '♑️',
    Водолей: '♒️',
    Рыбы: '♓️',
  };

  return `${zodiacSign} ${zodiacEmojis[zodiacSign] || ''}`;
}

async function getLunarDayAdvice(lunarDay) {
  if (!lunarDay) return { formattedHarmonyText: '', formattedAvoidText: '' };
  try {
    const advice = await LunarDayAdvice.findOne({
      where: { lunar_day: lunarDay },
    });

    return {
      formattedHarmonyText: advice ? advice.success_harmony.replace(/<br>/g, '\n') : 'Нет данных',
      formattedAvoidText: advice ? advice.avoid.replace(/<br>/g, '\n') : 'Нет данных',
    };
  } catch (error) {
    console.error(`Ошибка при получении совета для лунного дня ${lunarDay}:`, error);
    return { formattedHarmonyText: 'Ошибка при загрузке данных', formattedAvoidText: '' };
  }
}

// Функция для формирования постов
async function createTelegramPosts() {
  try {
    const tomorrow = getTomorrow();
    const formattedTomorrow = formatDateToDDMMYYYY(tomorrow);
    const formattedFullDate = formatDateToFullDate(tomorrow); // Используем завтрашнюю дату для форматирования полной даты

    const filePath = path.join(__dirname, '../data/files/lunar_calendar_2024.json');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const tomorrowData = data[formattedTomorrow];

    if (!tomorrowData) {
      console.log('No data for tomorrow.');
      return;
    }

    if (!tomorrowData) {
      console.log('No data for today.');
      return;
    }

    const lunarDays = [
      tomorrowData.moonday_1,
      tomorrowData.moonday_2,
      tomorrowData.moonday_3,
    ].filter(Boolean);

    let lunarDaysStr = '';
    lunarDays.forEach((day, index) => {
      if (index === 0 && lunarDays.length === 1) {
        lunarDaysStr += `${day}-й лунный день с 00:00 до 24:00\n`;
      } else if (index === 0) {
        lunarDaysStr += `${day}-й лунный день с 00:00 до ${tomorrowData.moonday_change_time}\n`;
      } else {
        const startTime = index === 1 ? tomorrowData.moonday_change_time : '00:00';
        const endTime = index === lunarDays.length - 1 ? '24:00' : tomorrowData.moonday_change_time;
        lunarDaysStr += `${day}-й лунный день с ${startTime} до ${endTime}\n`;
      }
    });

    const moonPhaseFormatted = formatMoonPhase(
      tomorrowData.moon_phase,
      tomorrowData.moon_phase_start_time
    );
    const zodiacSignFormatted = formatZodiacSignWithEmoji(tomorrowData.moon_zodiac_sign);

    const lunarZodiacRecommendation = await LunarZodiacRecommendations.findOne({
      where: { zodiac_sign: tomorrowData.moon_zodiac_sign },
    });

    const advice1 = await getLunarDayAdvice(tomorrowData.moonday_1);
    const advice2 = await getLunarDayAdvice(tomorrowData.moonday_2);
    const advice3 = await getLunarDayAdvice(tomorrowData.moonday_3);

    const post1 =
      `🌝 <b>Лунный календарь на ${formattedFullDate}</b>\n\n` +
      `${formattedFullDate} - это:\n\n${lunarDaysStr}\n${moonPhaseFormatted}\n\n` +
      `Луна находится в знаке зодиака - ${zodiacSignFormatted}\n\n` +
      `⬆️Восход: ${tomorrowData.moon_rise}  ⬇️Закат: ${tomorrowData.moon_set}\n\n` +
      `<b>Рекомендации на ${tomorrowData.moonday_1} лунный день:</b>\n\n` +
      `<b><i>Что благоприятно сегодня</i></b> ✅\n` +
      `${advice1.formattedHarmonyText}\n\n` +
      `<b><i>Чего стоит избегать</i></b> ❌\n` +
      `${advice1.formattedAvoidText}\n\n` +
      (tomorrowData.moonday_2
        ? `<b>Рекомендации на ${tomorrowData.moonday_2} лунный день:</b>\n\n` +
          `<b><i>Что благоприятно сегодня</i></b> ✅\n` +
          `${advice2.formattedHarmonyText}\n\n` +
          `<b><i>Чего стоит избегать</i></b> ❌\n` +
          `${advice2.formattedAvoidText}\n\n`
        : '') +
      (tomorrowData.moonday_3
        ? `<b>Рекомендации на ${tomorrowData.moonday_3} лунный день:</b>\n\n` +
          `<b><i>Что благоприятно сегодня</i></b> ✅\n` +
          `${advice3.formattedHarmonyText}\n\n` +
          `<b><i>Чего стоит избегать</i></b> ❌\n` +
          `${advice3.formattedAvoidText}\n\n`
        : '');

    // const post2 =
    //   `🌝<b>Лунный календарь на ${today}</b>\n\n` +
    //   `<b>Луна в ${todayData.moon_zodiac_sign} ♈️</b>\n\n` +
    //   `${lunarZodiacRecommendation ? lunarZodiacRecommendation.description : 'Нет данных'}`;

    // console.log(post1);
    const groupId = process.env.LUNAR_CALEND_GROUP_CHATID;
    sendTelegramMessage(post1, 'HTML', groupId);
    // sendTelegramMessage(post2, 'HTML', groupId);
  } catch (error) {
    console.error('Ошибка при создании поста:', error);
  }
}

const scheduleLunarDayPost = () => {
  cron.schedule('30 20 * * *', () => {
    // console.log('Запуск функции createTelegramPosts() каждый день в 19:00');
    createTelegramPosts().catch((error) =>
      console.error('Ошибка при запуске createTelegramPosts:', error)
    );
  });
};

module.exports = scheduleLunarDayPost;
