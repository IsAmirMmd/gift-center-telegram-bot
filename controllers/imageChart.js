const fetch = require("node-fetch");

const createChart = async (data) => {
  const url = `https://image-charts.com/chart.js/2.8.0?bkg=white&c=`;
  const decodedData = encodeURIComponent(JSON.stringify(data));
  const response = await fetch(url + decodedData);
  const arrayBuffer = await response.arrayBuffer();
  const imageBuffer = Buffer.from(arrayBuffer);
  return imageBuffer;
};

module.exports = {
  createChart,
};
