import { datastore } from "./db.js";
import { kanboard } from "./kanboard.js";

const getContent = async () => {
  const docs = await datastore.find({});
  docs.forEach((doc) => {
    console.log(
      doc.identifier +
        ": " +
        new Date(parseInt(doc.last_modified, 10) * 1000).toISOString()
    );
  });
};

const deleteContent = async () => {
  const docs = await datastore.find({});
  docs.forEach((doc) => {
    if (doc.id.startsWith("1577")) datastore.remove(doc);
  });
};

// deleteContent();
// getContent();

