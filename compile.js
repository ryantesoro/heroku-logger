const fs = require('fs');
const util = require('./utils');
const logger = require('./logger');

const logDir = './logs';
const totalsDir = './totals';

try {
  fs.readdirSync(logDir);
} catch (e) {
  throw new Error('No logs found');
}

const folders = fs.readdirSync(logDir);
util.mkdir(totalsDir);

const totalSummary = {
  count: 0,
  err: 0,
  timeouts: 0,
  memExceeded: 0,
  'err%': 0,
};

const totalStats = {};
let allLogs = '';

for (const folder of folders) {
  const logFolders = fs.readdirSync(`${logDir}/${folder}`);
  for (const logFolder of logFolders) {
    const stats = require(`./logs/${folder}/${logFolder}/stats.json`);
    const summary = require(`./logs/${folder}/${logFolder}/summary.json`);

    try {
      const logs = fs.readFileSync(`./logs/${folder}/${logFolder}/errors.log`);
      allLogs += logs;
    } catch (e) {}

    for (const [key, value] of Object.entries(stats)) {
      if (!totalStats[key]) {
        totalStats[key] = value;
        totalStats[key]['avgResTime'] = (
          value.restime /
          (value.count - (value.err - value.timeouts))
        ).toFixed(2);
      } else {
        totalStats[key].count += value.count;
        totalStats[key].restime += value.restime;
        totalStats[key].err += value.err;
        totalStats[key].timeouts += value.timeouts;
        totalStats[key].memExceeded += value.memExceeded;
        totalStats[key]['err%'] = (
          ((totalStats[key].err - totalStats[key].timeouts) /
            totalStats[key].count) *
          100
        ).toFixed(2);
        totalStats[key]['avgResTime'] = (
          totalStats[key].restime /
          (totalStats[key].count -
            (totalStats[key].err - totalStats[key].timeouts))
        ).toFixed(2);
      }
    }

    totalSummary.count += summary.count;
    totalSummary.err += summary.err;
    totalSummary.timeouts += summary.timeouts;
    totalSummary.memExceeded += summary.memExceeded;
  }
}

totalSummary['err%'] = (
  ((totalSummary.err - totalSummary.timeouts) / totalSummary.count) *
  100
).toFixed(2);

util.writeFile(
  `${totalsDir}/total-summary.json`,
  JSON.stringify(totalSummary, null, 2)
);
util.writeFile(
  `${totalsDir}/total-stats.json`,
  JSON.stringify(totalStats, null, 2)
);

util.writeFile(`${totalsDir}/all-errors.log`, allLogs);

//sorted by timeouts
const sortedStats = Object.entries(totalStats)
  .sort((a, b) => {
    return b[1].timeouts - a[1].timeouts;
  })
  .reduce((acc, [key, value]) => {
    acc[key] = value;
    return acc;
  }, {});

logger({
  totalStats: {
    summary: totalSummary,
    stats: sortedStats,
  },
});
