const logger = (allStats) => {
  process.stdout.write('\x1Bc');
  for (const appName of Object.keys(allStats)) {
    const { stats, summary } = allStats[appName];

    const tableData = Object.keys(stats).map((key) => {
      const { method, count, err, restime, timeouts, memExceeded } = stats[key];
      const errorPercentage = ((err / count) * 100).toFixed(2);
      const averageResponseTime = (restime / (count - err)).toFixed(2);

      return {
        method,
        endpoint: key,
        count,
        err,
        timeouts,
        memExceeded,
        'err%': errorPercentage ? `${errorPercentage}%` : '0.00%',
        respTime: isNaN(averageResponseTime) ? '-' : `${averageResponseTime}ms`,
      };
    });

    console.log(appName);
    console.table([summary]);
    console.table(tableData);
  }
};

module.exports = logger;
