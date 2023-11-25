const { Markup } = require('telegraf');

function createZodiacSignsKeyboard() {
  return {
    inline_keyboard: [
      [
        Markup.button.callback('Овен', '1'),
        Markup.button.callback('Телец', '2'),
        Markup.button.callback('Близнецы', '3'),
      ],
      [
        Markup.button.callback('Рак', '4'),
        Markup.button.callback('Лев', '5'),
        Markup.button.callback('Дева', '6'),
      ],
      [
        Markup.button.callback('Весы', '7'),
        Markup.button.callback('Скорпион', '8'),
        Markup.button.callback('Стрелец', '9'),
      ],
      [
        Markup.button.callback('Козерог', '10'),
        Markup.button.callback('Водолей', '11'),
        Markup.button.callback('Рыбы', '12'),
      ],
    ],
  };
}

module.exports = { createZodiacSignsKeyboard };
