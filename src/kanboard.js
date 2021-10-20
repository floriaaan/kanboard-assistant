const fetch = require("cross-fetch");
require("dotenv").config();

const url = process.env.API_URL;

const headers = {
  "Content-Type": "application/json",
  Accept: "application/json",
  Authorization: process.env.BASIC_AUTH,
};

const kanboard = async (method, params) => {
  const body = JSON.stringify({
    jsonrpc: "2.0",
    method,
    params,
    id: 1,
  });
  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body,
    });
    return await response.json();
  } catch (err) {
    return Promise.resolve(err);
  }
};

module.exports = {kanboard};
