import fetch from "node-fetch";
import { datastore } from "./db.js";
import { format } from "date-fns";
import dotenv from 'dotenv'
dotenv.config()


const url = process.env.API_URL;

const headers = {
  "Content-Type": "application/json",
  Accept: "application/json",
  Authorization: process.env.BASIC_AUTH,
};

const fetchData = async (method, params) => {
  const body = JSON.stringify({
    jsonrpc: "2.0",
    method,
    params,
    id: 1,
  });
  const response = await fetch(url, {
    method: "POST",
    headers,
    body,
  });
  return await response.json();
};

fetchData("getMyProjects").then(async (data) => {
  const projects = await datastore.find({});
  for (const project of data?.result) {
    let p = projects.find((p) => p.id === project.id);
    let notexists = !p;
    if (!p) {
      await datastore.insert({
        _id: project.id,
        ...project,
        last_modified_in_db: project.last_modified,
      });
    }
    if (parseInt(p?.last_modified, 10) < parseInt(project.last_modified, 10)) {
      console.log(
        `\u001b[1;42m\u001b[30m UPDATED     \u001b[0m \t Project ${
          project.identifier || project.id + " (no identifier)"
        } has been updated recently : ${format(
          new Date(parseInt(project.last_modified, 10) * 1000),
          "Pp"
        )} instead of ${format(
          new Date(parseInt(p.last_modified_in_db, 10) * 1000),
          "Pp"
        )}`
      );
      // await datastore.update(
      //   { id: project.id },
      //   { ...project, last_modified_in_db: project.last_modified }
      // );
      console.log(
        `\t\t\u001b[1;32m What's new in ${
          project.identifier || project.id + " (no identifier)"
        }\u001b[0m  🎉`
      );
      await fetchData("getProjectActivity", { project_id: project.id }).then(
        (data) => {
          data.result?.forEach(async (activity) => {
            if (activity.date_creation > p.last_modified_in_db) {
              console.log(
                `\t\t\t${format(
                  new Date(parseInt(activity.date_creation, 10) * 1000),
                  "Pp"
                )} : ${activity.event_name} - ${activity.task.title}`
              );
            }
          });
        }
      );
      console.log();
    } else {
      if (!notexists)
        console.log(
          `\u001b[1;41m NO UPDATE   \u001b[0m \t Project ${
            project.identifier || project.id + " (no identifier)"
          } is up to date`
        );
      else
        console.log(
          `\u001b[1;43m\u001b[30m ADDED IN DB \u001b[0m \tProject ${
            project.identifier || project.id + " (no identifier)"
          } has been added to the database`
        );
    }
  }
});
