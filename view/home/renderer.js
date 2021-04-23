const $$ = (selector) => {
  if (
    selector.startsWith("#") &&
    selector.indexOf(",") === -1 &&
    selector.indexOf(" ") === -1
  ) {
    return document.querySelector(selector);
  } else {
    return document.querySelectorAll(selector);
  }
};

const attEvent = (element, eventType, callback) => {
  element.addEventListener(eventType, callback, false);
};

window.api.send("get-profiles");

window.api.receive("set-profiles", (data) => {
  const select = document.querySelector("#profileSelector");
  const options = select.querySelectorAll("option");
  options.forEach((option) => {
    if (option.value !== "-1") {
      option.remove();
    } else {
      option.selected = true;
    }
  });
  let lastSelectedProfile = getLocalStorage("lastSelectedProfile");

  data.forEach((profile) => {
    const option = document.createElement("option");
    if (profile == lastSelectedProfile) {
      options[0].selected = false;
      option.selected = true;
    }
    option.text = option.value = profile;
    select.append(option);
  });
});

window.api.receive("lambda-response", (data) => {
  $$("#status").innerText = "Lambda status: " + data.status;
  switch (document.querySelector("#responseType").value) {
    case "json":
      let parsedData;
      try {
        parsedData = syntaxHighlight(
          JSON.stringify(JSON.parse(data.response), null, "  ")
        );
      } catch (ex) {
        parsedData = data.response;
      }
      document.querySelector("#response").innerHTML = parsedData;
      break;
    default:
      document.querySelector("#response").innerText = data.response;
      break;
  }
});

document.querySelector("#invoke").addEventListener(
  "click",
  () => {
    $$("#status").innerText = "Invocando lambda...";
    const selectedFunction = $$(
      `[function-id="${$$("#selectedFunction").value}"]`
    );

    const formData = new FormData(document.querySelector("#mainForm"));
    const data = Object.fromEntries(formData.entries());
    const obj = {
      endpoint: $$("#endpoint").value,
      profile: document.querySelector("#profileSelector").value,
      region: selectedFunction[0].getAttribute("function-region"),
      functionName: selectedFunction[0].getAttribute("function-name"),
      invocationType: data["invocation-type"],
      payload: data["payload"],
    };
    window.api.send("invoke-lambda", obj);
  },
  false
);

var changeTimeout;

$$('[name="payload"], [name="invocation-type"], #responseType').forEach(
  (inputNode) => {
    let eventType = "keyup";
    if (inputNode.tagName.toUpperCase() === "SELECT") {
      eventType = "change";
    }
    inputNode.addEventListener(
      eventType,
      (e) => {
        clearTimeout(changeTimeout);

        ((functionId, data) =>
          (changeTimeout = setTimeout(() => {
            availableFunctions.update(functionId, {
              payload: data.payload,
              "invocation-type": data["invocation-type"],
              responseType: data.responseType,
            });
          }, 300)))(
          $$("#selectedFunction").value,
          Object.fromEntries(new FormData($$("#mainForm")).entries())
        );
      },
      false
    );
  }
);

attEvent($$("#functionNames"), "dblclick", (e) => {
  if (e.target.tagName.toUpperCase() === "A") {
    $$("#modalFunctionId").value = e.target.getAttribute("function-id");
    $$("#modalFunctionName").value = e.target.getAttribute("function-name");
    $$("#modalFunctionRegion").value = e.target.getAttribute("function-region");
    modal.open();
  }
});

attEvent($$("#functionNames"), "click", (e) => {
  if (e.target.tagName.toUpperCase() === "A") {
    availableFunctions.visibleParams(true);
    $$("#status").innerText = "Idle";
    document.querySelector("#mainForm").reset();
    $$("#selectedFunction").value = e.target.getAttribute("function-id");
    document
      .querySelectorAll("#functionNames a")
      .forEach((functionName) => functionName.classList.remove("active"));
    e.target.classList.add("active");

    const savedFunctions = getLocalStorage("savedFunctions");

    const functionData = savedFunctions[$$("#selectedFunction").value] || {};

    $$('[name="payload"]')[0].value = functionData.payload || "";
    $$('[name="invocation-type"]')[0].value =
      functionData["invocation-type"] || "RequestResponse";
    $$("#responseType").value = functionData.responseType || "json";
  }
});

attEvent($$("#newModal"), "click", () => {
  modal.open();
});

const modal = {
  close: () => {
    modal.reset();
    $$("#modal").classList.remove("show");
  },
  open: () => {
    $$("#deleteFunction").style.display =
      $$("#modalFunctionId").value === "" ? "none" : "";
    $$("#modal").classList.add("show");
  },
  reset: () => {
    $$("#modalFunctionId").value = "";
    $$("#modalFunctionName").value = "";
    $$("#modalFunctionRegion").value = "";
    $$("#modalFunctionName").style.borderColor = "";
    $$("#modalFunctionRegion").style.borderColor = "";
  },
};

attEvent($$("#closeModal"), "click", () => {
  modal.close();
});

attEvent($$("#deleteFunction"), "click", () => {
  if ($$("#modalFunctionId").value) {
    if (confirm("Are you sure?")) {
      availableFunctions.remove($$("#modalFunctionId").value);
      modal.close();
    }
  }
});

attEvent($$("#saveFunction"), "click", () => {
  let functionId =
    $$("#modalFunctionId").value ||
    "fn_" + Math.random().toString().split(".").pop();
  let functionName = $$("#modalFunctionName").value.trim();
  let functionRegion = $$("#modalFunctionRegion").value.trim();

  if (!functionName || !functionRegion) {
    if (!functionName) {
      $$("#modalFunctionName").style.borderColor = "red";
    } else {
      $$("#modalFunctionName").style.borderColor = "";
    }
    if (!functionRegion) {
      $$("#modalFunctionRegion").style.borderColor = "red";
    } else {
      $$("#modalFunctionRegion").style.borderColor = "";
    }
    return false;
  }

  availableFunctions.update(functionId, {
    functionName,
    functionRegion,
  });

  availableFunctions.render();

  modal.close();
});

attEvent($$("#profileSelector"), "change", () => {
  let selectedValue = $$("#profileSelector").value;
  setLocalStorage("lastSelectedProfile", selectedValue);
});

var endpointTimeout;

attEvent($$("#endpoint"), "keyup", () => {
  clearTimeout(endpointTimeout);

  endpointTimeout = setTimeout(() => {
    let lastEndpoint = $$("#endpoint").value;
    setLocalStorage("lastEndpoint", lastEndpoint);
  }, 500);
});

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

const setLocalStorage = (key, data) => {
  window.localStorage.setItem(key, JSON.stringify(data));
};

const getLocalStorage = (key) => {
  let data = window.localStorage.getItem(key);
  try {
    return JSON.parse(data);
  } catch (ex) {
    return data;
  }
};

const lsKey = "savedFunctions";

const availableFunctions = {
  render: () => {
    $$("#functionNames a, #functionNames div").forEach((element) => {
      element.remove();
    });
    const functions = getLocalStorage("savedFunctions") || {};
    const functionsKeys = Object.keys(functions);
    functionsKeys.forEach((key) => {
      const anchor = document.createElement("a");
      anchor.classList.add("nav-group-item");
      anchor.setAttribute("function-id", key);
      anchor.setAttribute("function-name", functions[key].functionName);
      anchor.setAttribute("function-region", functions[key].functionRegion);
      anchor.innerText = functions[key].functionName;
      $$("#functionNames").append(anchor);
    });
    if (functionsKeys.length === 0) {
      const div = document.createElement("div");
      div.style.paddingLeft = "8px";
      div.innerHTML = "Add a new function<br>with <b>[ + ]</b> button";
      attEvent(div.querySelector("b"), "click", () => {
        modal.open();
      });
      $$("#functionNames").append(div);
    }
  },
  update: (functionId, data) => {
    functionId = functionId.trim();
    const savedFunctions = getLocalStorage(lsKey) || {};

    if (functionId && functionId != "") {
      let currentFunction = savedFunctions[functionId];
      currentFunction = { ...currentFunction, ...data };
      savedFunctions[functionId] = currentFunction;
    }

    setLocalStorage(lsKey, savedFunctions);
  },
  remove: (functionId) => {
    const savedFunctions = getLocalStorage(lsKey) || {};
    delete savedFunctions[functionId];

    setLocalStorage(lsKey, savedFunctions);

    availableFunctions.visibleParams(false);
    availableFunctions.render();
  },
  clearParams: () => {
    $$("selectedFunction").value = "";
    $$('[name="payload"]').value = "";
    $$('[name="invocation-type"]').value = "RequestResponse";
    $$("#responseType").value = "json";

    $$("#response").innerHTML = "Press Invoke button";

    availableFunctions.visibleParams(false);
  },
  visibleParams: (flag) => {
    $$("#noSelectedFunction").style.display = flag === true ? "none" : "flex";
    $$("#withSelectedFunction").style.display =
      flag === true ? "block" : "none";
  },
};

$$("#endpoint").value = getLocalStorage("lastEndpoint");

availableFunctions.render();
availableFunctions.clearParams();
