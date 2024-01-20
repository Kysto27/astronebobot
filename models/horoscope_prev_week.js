module.exports = (sequelize, DataTypes) => {
    const HoroscopePrevWeek = sequelize.define(
      'HoroscopePrevWeek',
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        zodiac_sign_id: {
          type: DataTypes.INTEGER,
          allowNull: false
        },
        date_range: {
          type: DataTypes.STRING,
          allowNull: false
        },
        business: {
          type: DataTypes.TEXT
        },
        common: {
          type: DataTypes.TEXT
        },
        love: {
          type: DataTypes.TEXT
        },
        health: {
          type: DataTypes.TEXT
        },
        beauty: {
          type: DataTypes.TEXT
        },
        created_at: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW
        }
      },
      {
        timestamps: false,
        tableName: 'horoscope_prev_week'
      }
    );
  
    return HoroscopePrevWeek;
  };
  