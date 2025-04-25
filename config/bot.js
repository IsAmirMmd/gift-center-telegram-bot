require("dotenv").config();
module.exports = {
  TOKEN:
    process.env.DEVELOPMENT == "true" ? process.env.DTOKEN : process.env.TOKEN,
  isDevelop: process.env.DEDEVELOPMENT,
  channel_id: "@mdskabdfs2u3hrkfsddbsadefjhnmdmf",
  cred: {
    host: process.env.MYSQL_HOST,
    username: process.env.MYSQL_USERNAME,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    dialect: process.env.MYSQL_DIALECT,
  },
  authData : process.env.AUTH_DATA,
};
