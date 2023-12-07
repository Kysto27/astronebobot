module.exports = (sequelize, DataTypes) => {
  const ZodiacSign = sequelize.define(
    'ZodiacSign',
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      emoji: {
        // Добавляем новое поле для эмодзи
        type: DataTypes.STRING,
        allowNull: true, // Можно установить false, если эмодзи обязательно для каждого знака
      },
    },
    {
      timestamps: false,
      tableName: 'zodiac_signs',
    }
  );

  return ZodiacSign;
};
