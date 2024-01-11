const util = require('./utils');
const readline = require('readline');
const { heroku_app_names } = require('./config');
const { parseLogLine } = require('./log-parser');
const logger = require('./logger');

const allStats = {};

const startLogging = async (appName) => {
  let stats, summary;

  const dirName = await util.createLogDir(appName);

  stats = {};
  summary = {
    count: 0,
    err: 0,
    timeouts: 0,
    memExceeded: 0,
    'err%': 0,
  };

  const logStream = await util.getLogStream(appName);

  const rl = readline.createInterface({
    input: logStream,
  });

  console.log(`Log stream started for ${appName}`);

  rl.on('line', (line) => {
    const logObj = parseLogLine(line);
    if (logObj) {
      if (
        !stats[logObj.path] ||
        (stats[logObj.path] && stats[logObj.path].method !== logObj.method)
      ) {
        stats[logObj.path] = {
          method: logObj.method,
          count: 0,
          err: 0,
          timeouts: 0,
          restime: 0,
          memExceeded: 0,
        };
      }

      stats[logObj.path].count++;
      summary.count++;

      if (logObj.status >= 400) {
        stats[logObj.path].err++;
        summary.err++;
        summary['err%'] = `${((summary.err / summary.count) * 100).toFixed(
          2
        )}%`;
        util.appendToFile(`${dirName}/errors.log`, '\n' + line);
      } else {
        stats[logObj.path].restime += parseInt(logObj.service, 10);
      }

      if (logObj.code === 'H12') {
        stats[logObj.path].timeouts++;
        summary.timeouts++;
      } else if (logObj.code === 'R14') {
        stats[logObj.path].memExceeded++;
        summary.memExceeded++;
      }

      allStats[appName] = {
        summary,
        stats,
      };

      logger(allStats);

      util.writeFile(
        `${dirName}/summary.json`,
        JSON.stringify(summary, null, 2)
      );
      util.writeFile(`${dirName}/stats.json`, JSON.stringify(stats, null, 2));
    }
  });

  rl.on('close', () => {
    console.log(`Log stream closed for ${appName}`);
  });

  rl.on('SIGINT', () => {
    console.log(`SIGINT ${appName}`);
    logStream.destroy();
    rl.close();
  });

  rl.on('error', (error) => {
    console.error(`Error in readline interface for ${appName}`, error);
  });
};

for (const appName of heroku_app_names) {
  startLogging(appName);
}
