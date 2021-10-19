import Datastore from "nedb-promises";
export const datastore = Datastore.create("/tmp/database.db");
