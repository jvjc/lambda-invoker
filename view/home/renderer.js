window.api.send("get-profiles");

window.api.receive("set-profiles", (data) => {
  const select = document.querySelector("#profileSelector");
  const options = select.querySelectorAll("option");
  options.forEach((option) => {
    if (option.value !== "-1") {
      option.remove();
    }
  });
  data.forEach((profile) => {
    const option = document.createElement("option");
    option.text = option.value = profile;
    select.append(option);
  });
});

window.api.receive("lambda-response", (data) => {
  switch (document.querySelector("#responseType").value) {
    case "json":
      document.querySelector("#response").innerHTML = syntaxHighlight(
        JSON.stringify(JSON.parse(data.response), null, "  ")
      );
      break;
    default:
      document.querySelector("#response").innerText = data.response;
      break;
  }
  console.log(data);
});

document.querySelector("#invoke").addEventListener(
  "click",
  () => {
    const formData = new FormData(document.querySelector("#mainForm"));
    const obj = {
      profile: document.querySelector("#profileSelector").value,
      data: Object.fromEntries(formData.entries()),
    };
    window.api.send("invoke-lambda", obj);
  },
  false
);

// https://stackoverflow.com/questions/4810841/pretty-print-json-using-javascript
function syntaxHighlight(json) {
  if (typeof json != "string") {
    json = JSON.stringify(json, undefined, 2);
  }
  json = json
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return json.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    function (match) {
      var cls = "number";
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = "key";
        } else {
          cls = "string";
        }
      } else if (/true|false/.test(match)) {
        cls = "boolean";
      } else if (/null/.test(match)) {
        cls = "null";
      }
      return '<span class="' + cls + '">' + match + "</span>";
    }
  );
}
