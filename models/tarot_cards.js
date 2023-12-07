module.exports = (sequelize, DataTypes) => {
  const TarotCard = sequelize.define(
    'TarotCard',
    {
      card_number: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true 
      },
      category: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      subcategory: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      name_ru: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      name_en: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      img_url: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      yes_no: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      what_to_expect: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
    },
    {
      timestamps: false,
      tableName: 'tarot_cards',
    }
  );

  return TarotCard;
};
