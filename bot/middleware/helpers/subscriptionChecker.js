// async function checkUserSubscription(telegram, userId, channel) {
//   try {
//     const member = await telegram.getChatMember(channel, userId);
//     return (
//       member &&
//       (member.status === 'member' ||
//         member.status === 'administrator' ||
//         member.status === 'creator')
//     );
//   } catch (error) {
//     console.error('Ошибка при проверке подписки:', error);
//     return false;
//   }
// }
async function checkUserSubscription(ctx, channel) {
  try {
    const userId = ctx.from.id;
    const member = await ctx.telegram.getChatMember(channel, userId);
    return (
      member &&
      (member.status === 'member' ||
        member.status === 'administrator' ||
        member.status === 'creator')
    );
  } catch (error) {
    console.error('Ошибка при проверке подписки:', error);
    return false;
  }
}

module.exports = checkUserSubscription;
