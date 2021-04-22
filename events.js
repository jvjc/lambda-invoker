const { ipcMain } = require("electron");
var AWS = require("aws-sdk");
const fs = require("fs");
const homedir = require("os").homedir();

const attachEvents = (win) => {
  /* ipcMain.on("toMain", (event, args) => {
    if (args)
      fs.readdir("/", (error, data) => {
        win.webContents.send("fromMain", data);
      });
  }); */

  ipcMain.on("get-profiles", (event, args) => {
    fs.readFile(`${homedir}/.aws/credentials`, (error, data) => {
      const availableProfiles = data
        .toString()
        .split("\n")
        .filter((line) => line.startsWith("[") && line.endsWith("]"))
        .map((profile) => profile.substring(1, profile.length - 1));
      win.webContents.send("set-profiles", availableProfiles);
    });
  });

  ipcMain.on("invoke-lambda", (event, args) => {
    const profile = args.profile || "default";
    const credentials = new AWS.SharedIniFileCredentials({
      profile,
    });
    const lambda = new AWS.Lambda({
      credentials,
      region: "us-west-2",
    });
    AWS.config.credentials = credentials;
    lambda.invoke(
      {
        FunctionName: "",
        Payload: "{}",
      },
      function (err, data) {
        if (err) {
          console.log(err, err.stack);
        } else {
          win.webContents.send("lambda-response", {
            status: data.StatusCode,
            response: data.Payload,
          });
        }
      }
    );
  });
};

module.exports = {
  attachEvents,
};
