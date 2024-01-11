const utils = require('./utils');

const parseLogLine = (logLine) => {
  if (!logLine.includes('host=') || logLine.includes('method=OPTIONS')) {
    return;
  }

  const logLineParts = logLine.split(' ');
  const logLineObject = {};

  logLineParts.forEach((part) => {
    const [key, value] = part.split('=');
    logLineObject[key] = value;
  });

  logLineObject.path = determineEndpoint(
    logLineObject.path,
    logLineObject.host
  );

  return logLineObject;
};

const determineEndpoint = (path, host) => {
  path = path.replace('"', '');
  const { url } = utils.parseUrl('https://' + host + path);

  const pathParts = url
    .replaceAll('https://' + host, '')
    .replaceAll('%22', '')
    .split('/');

  pathParts.splice(0, 1);

  const mutatedPathParts = pathParts.map((part) => {
    if (isId(part)) {
      return '{:id}';
    }

    try {
      const decodedDate = decodeURI(part);
      const dateTest = new Date(decodedDate);
      if (dateTest instanceof Date && !isNaN(dateTest)) {
        return '{:date}';
      }
    } catch (e) {
      return part;
    }
    return part;
  });

  return mutatedPathParts.join('/');
};

const isId = (str) => {
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;

  if (objectIdRegex.test(str)) {
    return true;
  }

  return !isNaN(str);
};

module.exports = {
  parseLogLine,
};
