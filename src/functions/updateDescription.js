const { kanboard } = require("../kanboard.js");

const updateDescription = async (taskId, projectId) => {
  const taskToEdit = await kanboard("getTask", {
    task_id: taskId,
  });
  let description = taskToEdit.result.description;

  let tasksMap = new Map();
  const columnsInBoard = await kanboard("getColumns", {
    project_id: projectId,
  });
  columnsInBoard.result.forEach((column) => {
    tasksMap.set(column.id, { title: column.title, tasks: [] });
  });

  const tasksInBoard = await kanboard("getAllTasks", { project_id: projectId });
  tasksInBoard.result.forEach((task) => {
    let column = tasksMap.get(task.column_id);
    column.tasks.push({
      task_id: task.id,
      title: task.title,
      description: task.description,
      data_modification: task.date_modification,
      url: task.url,
    });
    tasksMap.set(task.column_id, column);
  });
  let markdown = "";
  let format = "list";
  switch (format) {
    case "array":
      let markdownInArray = [];
      tasksMap.forEach((column) => {
        markdownInArray[0] =
          (markdownInArray?.[0] || "") + " | " + column.title;
        markdownInArray[1] = (markdownInArray?.[1] || "") + " | " + " --- ";
        column.tasks.forEach((task, i) => {
          markdownInArray[i + 2] =
            (markdownInArray?.[i + 2] || "") +
            " | " +
            `[${task.title}](${task.url})`;
        });
      });
      console.log(markdownInArray);
      markdownInArray.forEach((line) => {
        markdown += line + "\n";
      });
      console.log(markdown);

      break;

    case "list":
      tasksMap.forEach((column) => {
        markdown += `## ${column.title}\n`;
        column.tasks.forEach((task) => {
          markdown += `* [${task.title}](${task.url})${
            task.description ? " - a une description 📝" : ""
          }\n`;
        });
        markdown += "\n";
      });
      break;

    default:
      break;
  }

  if (description.includes("### BOTSTART")) {
    const start = description.indexOf("### BOTSTART");
    const end = description.indexOf("### BOTEND");

    var a = description.substring(0, start);
    var b = description.substring(end);

    description = a + "### BOTSTART\n\n" + markdown + b;
  } else {
    description = "### BOTSTART\n" + markdown + "\n### BOTEND" + description;
  }

  return await kanboard("updateTask", {
    id: taskId,
    description,
  }).then((data) => {
    if (data.result) {
      console.log("updated task" + taskId);
    } else {
      console.error("error");
    }
  });
};

module.exports = {updateDescription};