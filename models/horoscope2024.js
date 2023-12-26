module.exports = (sequelize, DataTypes) => {
    const ZodiacHoroscope2024 = sequelize.define(
      'ZodiacHoroscope2024',
      {
        zodiac_sighn: {
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true
        },
        gender: {
          type: DataTypes.STRING,
          allowNull: false,
          primaryKey: true
        },
        general: {
          type: DataTypes.TEXT,
          allowNull: false
        },
        love: {
          type: DataTypes.TEXT,
          allowNull: false
        },
        finance: {
          type: DataTypes.TEXT,
          allowNull: false
        },
        health: {
          type: DataTypes.TEXT,
          allowNull: false
        }
      },
      {
        timestamps: false,
        tableName: 'zodiac_horoscope_2024'
      }
    );
  
    return ZodiacHoroscope2024;
};
