const { ZodiacHoroscope2024 } = require('../../../models/index.js');

async function getHoroscope(zodiacSignId, gender) {
  try {
    const horoscope = await ZodiacHoroscope2024.findOne({
      where: {
        zodiac_sighn: zodiacSignId,
        gender: gender,
      },
    });

    return horoscope;
  } catch (e) {
    console.error(e);
    return null;
  }
}

module.exports = { getHoroscope };
