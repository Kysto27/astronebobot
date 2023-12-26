function getZodiacSignInGenitive(sign) {
  const zodiacSignsInGenitive = {
    'Овен': 'Овна',
    'Телец': 'Тельца',
    'Близнецы': 'Близнецов',
    'Рак': 'Рака',
    'Лев': 'Льва',
    'Дева': 'Девы',
    'Весы': 'Весов',
    'Скорпион': 'Скорпиона',
    'Стрелец': 'Стрельца',
    'Козерог': 'Козерога',
    'Водолей': 'Водолея',
    'Рыбы': 'Рыб'
  };

  return zodiacSignsInGenitive[sign] || sign;
}

module.exports = { getZodiacSignInGenitive };