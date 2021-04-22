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
      document.querySelector("#response").innerHTML = JSON.stringify(
        JSON.parse(data.response),
        null,
        "  "
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
