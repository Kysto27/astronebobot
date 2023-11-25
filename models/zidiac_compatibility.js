module.exports = (sequelize, DataTypes) => {
    const ZodiacCompatibility = sequelize.define(
      'ZodiacCompatibility',
      {
        woman_zodiac_sign: {
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true
        },
        man_zodiac_sign: {
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true
        },
        compatibility_percent: {
          type: DataTypes.FLOAT,
          allowNull: false
        },
        compatibility_description: {
          type: DataTypes.TEXT,
          allowNull: false
        }
      },
      {
        timestamps: false,
        tableName: 'zodiac_compatibility'
      }
    );
  
    return ZodiacCompatibility;
  };
  