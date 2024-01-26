module.exports = (sequelize, DataTypes) => {
    const LunarZodiacRecommendations = sequelize.define(
        'LunarZodiacRecommendations',
        {
            zodiac_sign: {
                type: DataTypes.STRING,
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
            tableName: 'lunar_zodiac_recommendations'
        }
    );

    return LunarZodiacRecommendations;
};
