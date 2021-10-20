const { datastore } = require("./src/db.js");
const { format } = require("date-fns");
const { kanboard } = require("./src/kanboard.js");
require("dotenv").config();
const { updateDescription } = require("./src/functions/updateDescription.js");

const noUpdate = process.argv.includes("--noUpdate");
const merge = process.argv.includes("--merge");
let except = process.argv.includes("--except")
  ? process.argv[process.argv.indexOf("--except") + 1]
  : process.env.DEFAULT_EXCEPT || false;

if (process.argv.includes("--dev")) {
  console.log();
  console.log({ noUpdate, merge, except });
  console.log();
}

if (except) console.log(`\x1b[35mBoard ${except} is excepted\x1b[0m`);
if (merge)
  console.log(`\x1b[35mBoards will be merged in the according task \x1b[0m`);
if (noUpdate) console.log(`\x1b[35mLocal database won't be updated\x1b[0m`);
console.log();

kanboard("getMyProjects").then(async (data) => {
  const projects = await datastore.find({});
  if (data instanceof Error) {
    console.error("\u001b[1;41m ERROR \u001b[0m\t" + data.message);
    if (data.code === "ENOTFOUND") {
      console.error(
        "\tIt seems that you're not connected to the internet right now."
      );
      console.error("\tPlease connect your device and retry.");
    }
    return;
  }
  for (const project of data?.result) {
    let p = projects.find((p) => p.id === project.id);
    let notexists = !p;

    if (!p && except !== project.id) {
      await datastore.insert({
        _id: project.id,
        ...project,
        last_modified_in_db: project.last_modified,
      });
    }
    if (
      parseInt(p?.last_modified, 10) < parseInt(project.last_modified, 10) &&
      except !== project.id
    ) {
      console.log(
        `\u001b[1;42m\u001b[30m UPDATED     \u001b[0m \t Board ${
          project.identifier || project.id + " (no identifier)"
        } has been updated recently : ${format(
          new Date(parseInt(project.last_modified, 10) * 1000),
          "Pp"
        )} instead of ${format(
          new Date(parseInt(p.last_modified_in_db, 10) * 1000),
          "Pp"
        )}`
      );

      console.log(
        `\t\t\u001b[1;32m What's new in ${
          project.identifier || project.id + " (no identifier)"
        }\u001b[0m  🎉`
      );

      let hasChanges = false;
      await kanboard("getProjectActivity", { project_id: project.id }).then(
        (data) => {
          data.result?.forEach(async (activity) => {
            if (activity.date_creation > p.last_modified_in_db) {
              console.log(
                `\t\t\t${format(
                  new Date(parseInt(activity.date_creation, 10) * 1000),
                  "Pp"
                )} : ${activity.event_name} - ${activity.task.title}`
              );
              if (merge) {
                if (/task_id=(\d+)/.test(project.description)) {
                  if (
                    activity.event_name !== "task.update" &&
                    activity.task.task_id !==
                      /task_id=(\d+)/.exec(project.description)[1]
                  ) {
                    hasChanges = true;
                  }
                  kanboard("createComment", {
                    task_id: /task_id=(\d+)/.exec(project.description)[1],
                    user_id: 5782,
                    content: activity.event_content,
                  }).then(
                    (comment) =>
                      comment.result &&
                      console.log(`\t\t\t\u001b[1;32mMERGED\u001b[0m`)
                  );
                } else
                  console.log(
                    `\t\t\t\u001b[1;31mMERGE ERROR\u001b[0m: no task_id in description of the board`
                  );
                console.log();
              }
            }
          });
        }
      );
      if (hasChanges && merge && except !== project.id) {
        if (/task_id=(\d+)/.test(project.description)) {
          await updateDescription(
            /task_id=(\d+)/.exec(project.description)[1],
            project.id
          );
        } else {
          console.log(
            `\t\t\t\u001b[1;31mMERGE ERROR\u001b[0m: no task_id in description of the board`
          );
          console.log();
        }
      }

      if (!noUpdate) {
        await datastore.update(
          { id: project.id },
          { ...project, last_modified_in_db: project.last_modified }
        );
        console.log(
          `\t\t\u001b[1;32m ${
            project.identifier || project.id + " (no identifier)"
          } has been updated locally\u001b[0m `
        );
      }

      console.log();
    } else {
      if (except !== project.id) {
        if (!notexists)
          console.log(
            `\u001b[1;41m NO UPDATE   \u001b[0m \t Board ${
              project.identifier || project.name + " (no identifier)"
            } is up to date`
          );
        else
          console.log(
            `\u001b[1;43m\u001b[30m ADDED IN DB \u001b[0m \tBoard ${
              project.identifier || project.id + " (no identifier)"
            } has been added to the database`
          );
      }
    }
  }
});
