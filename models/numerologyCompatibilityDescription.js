module.exports = (sequelize, DataTypes) => {
    const NumerologyCompatibilityDescription = sequelize.define(
      'NumerologyCompatibilityDescription',
      {
        number: {
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: false
        }
      },
      {
        timestamps: false,
        tableName: 'numerology_compatibility_descriptions'
      }
    );
  
    return NumerologyCompatibilityDescription;
  };
  