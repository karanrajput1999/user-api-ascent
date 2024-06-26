const cron = require("node-cron");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const cronJob = cron.schedule(
  // "*/20 * * * * *", // 20 seconds
  "0 */2 * * *", // 2 hours
  async () => {
    const sessions = await prisma.session.findMany({});
    const inactiveTimeLimit = 20; // in seconds
    const currentUTC = new Date(); // Get the current UTC time

    sessions.forEach(async (session) => {
      const lastActiveTime = new Date(session.lastActive);
      const timeDifference =
        (currentUTC.getTime() - lastActiveTime.getTime()) / 1000; // Converts milliseconds to seconds

      if (timeDifference > inactiveTimeLimit) {
        const inActiveUser = await prisma.user.findFirst({
          where: {
            id: session.userId,
          },
        });

        // logout the user
        await prisma.user.update({
          where: {
            id: inActiveUser.id,
          },
          data: {
            isActive: 0,
          },
        });
      }
    });
  },
  {
    scheduled: true,
    timezone: "Etc/UTC",
  }
);

module.exports = cronJob;
