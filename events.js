const { ipcMain } = require("electron");
var AWS = require("aws-sdk");
const fs = require("fs");
const homedir = require("os").homedir();

const attachEvents = (win) => {
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
    console.log(args);
    const profile = args.profile || "default";
    const credentials = new AWS.SharedIniFileCredentials({
      profile,
    });
    const lambdaConfig = {
      credentials,
      region: args.region || "us-west-2",
    };
    if (args.endpoint) {
      lambdaConfig.endpoint = args.endpoint;
    }
    const lambda = new AWS.Lambda(lambdaConfig);
    AWS.config.credentials = credentials;
    console.log(lambdaConfig);
    lambda.invoke(
      {
        FunctionName: args.functionName,
        Payload: args.payload,
      },
      function (err, data) {
        console.log(err, data);
        let response;
        let status;
        console.log(err, data);
        if (err) {
          status = err.statusCode || "Failed";
          response = err.message;
        } else {
          status = data.StatusCode;
          response = data.Payload;
        }
        win.webContents.send("lambda-response", {
          status,
          response,
        });
      }
    );
  });
};

module.exports = {
  attachEvents,
};
