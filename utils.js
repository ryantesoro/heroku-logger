const axios = require('axios');
const config = require('./config');
const fs = require('fs');

const getLogStream = async (appName) => {
  try {
    const logplex_url = await getLogSession(appName);

    const { url, params } = parseUrl(logplex_url);

    params.tail = true;

    const options = {
      method: 'GET',
      url: url,
      params,
      responseType: 'stream',
      headers: {
        Authorization: `Bearer ${config.heroku_api_key}`,
      },
    };

    const logStream = await axios(options);

    return logStream.data;
  } catch (e) {
    console.error(e.data);
    throw e;
  }
};

const getLogSession = async (appName) => {
  const logSessionURL = `https://api.heroku.com/apps/${appName}/log-sessions`;
  const apiKey = config.heroku_api_key;

  const options = {
    method: 'POST',
    url: logSessionURL,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/vnd.heroku+json; version=3',
    },
  };
  const response = await axios(options);

  return response.data.logplex_url;
};

const parseUrl = (urlString) => {
  const parsedUrl = new URL(urlString);
  const url = parsedUrl.origin + parsedUrl.pathname;
  const params = Object.fromEntries(parsedUrl.searchParams.entries());

  return {
    url,
    params,
  };
};

const createLogDir = async (appName) => {
  const dateMillisec = new Date().getTime();
  const basePath = `./logs/${appName}`;
  const dirName = `${basePath}/${dateMillisec}`;

  await mkdir(dirName);

  return dirName;
};

const mkdir = (dirName) => {
  return new Promise((resolve, reject) => {
    try {
      fs.mkdirSync(dirName, { recursive: true });
      resolve(true);
    } catch (e) {
      console.error(e);
      reject(e);
    }
  });
};

const writeFile = (fileName, fileContent) => {
  fs.writeFile(fileName, fileContent, (err) => {
    if (err) {
      console.error('Error creating file:', err);
    }
  });
};

const readFile = (fileName) => {
  fs.readFile(fileName, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading file:', err);
    } else {
      console.log(`File "${fileName}" read successfully.`);
      return JSON.parse(data);
    }
  });
};

const appendToFile = (fileName, content) => {
  fs.appendFile(fileName, content, (err) => {
    if (err) {
      console.error(`Error appending to file: ${err}`);
    }
  });
};

module.exports = {
  getLogStream,
  parseUrl,
  writeFile,
  readFile,
  appendToFile,
  createLogDir,
  mkdir,
};
