import cron from "cron";
import https from "https";

const job = new cron.CronJob("*/14 * * * *", function () {
  https
    .get(process.env.API_URL, (res) => {
      if (res.statusCode === 200) console.log("Ping OK");
      else console.log("Ping failed", res.statusCode);
    })
    .on("error", (e) => console.error("Error pinging:", e));
});


export default job;