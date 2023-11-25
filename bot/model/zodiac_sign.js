module.exports = (sequelize, DataTypes) => {
    const ZodiacSign = sequelize.define(
      'ZodiacSign',
      {
        name: {
          type: DataTypes.STRING,
          allowNull: false
        },
      },
      {
        timestamps: false,
        tableName: 'zodiac_signs'
      }
    );
  
    return ZodiacSign;
  };
  