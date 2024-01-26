module.exports = (sequelize, DataTypes) => {
  const LunarDayAdvice = sequelize.define(
    'LunarDayAdvice',
    {
      lunar_day: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      success_harmony: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      avoid: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
    },
    {
      timestamps: false,
      tableName: 'lunar_day_advice',
    }
  );

  return LunarDayAdvice;
};
