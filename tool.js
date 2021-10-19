import { datastore } from "./db.js";

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
    if (doc.identifier.startsWith("7B0")) datastore.remove(doc);
  });
};

// deleteContent();
console.log(process.argv);

// getContent();
