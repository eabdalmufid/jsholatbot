const monk = require("monk");
require("dotenv").config();

// Connection URL
var url = process.env.MONGO_URI || "";
try {
  if (url == "") throw console.log("Cek konfigurasi database, var url belum diisi");
} catch (e) {
  return;
}
var db = monk(url);

module.exports = db;