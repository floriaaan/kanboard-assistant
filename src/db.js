const Datastore = require("nedb-promises");

module.exports = { datastore: Datastore.create("/tmp/database.db") };
