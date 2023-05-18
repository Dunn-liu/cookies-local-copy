//写入到目标tab
function writeLocalStore(needWriteTab, needWriteItems) {
  for (let prop in needWriteItems) {
    chrome.scripting
      .executeScript({
        target: { tabId: needWriteTab.id },
        args: [prop, needWriteItems[prop]],
        func: (prop, value) => {
          localStorage.setItem(prop, value);
          return prop;
        },
      })
      .then((result) => {
        console.log(prop + "写入成功！", result);
      });
  }
}
(function () {
  var main = {
    init() {
      this.bind();
    },
    bind() {
      let checkBoxDom = document.getElementById("toggler-checkbox");
      let checkBoxDom1 = document.getElementById("toggler-checkbox1");
      let isChecked = window.localStorage.getItem("isChecked");
      let isCopyLocal = window.localStorage.getItem("isCopyLocal");
      var url = document.getElementById("url");
      var btn = document.getElementById("btn");
      var message = document.querySelector(".message");
      let needWriteTab;
      if (isChecked == 2) {
        checkBoxDom.checked = false;
      }
      if (isCopyLocal == 1) {
        checkBoxDom1.checked = true;
      }
      if (window.localStorage.getItem("url")) {
        url.value = window.localStorage.getItem("url");
      }
      checkBoxDom.addEventListener("change", function (e) {
        if (e.target.checked) {
          window.localStorage.setItem("isChecked", 1);
        } else {
          window.localStorage.setItem("isChecked", 2);
        }
      });
      checkBoxDom1.addEventListener("change", function (e) {
        if (e.target.checked) {
          window.localStorage.setItem("isCopyLocal", 1);
        } else {
          window.localStorage.setItem("isCopyLocal", 2);
        }
      });
      url.addEventListener("change", function (e) {
        if (e.target.value) {
          window.localStorage.setItem("url", e.target.value);
        }
      });
      function showMessage(text, className) {
        message.innerHTML = text;
        message.classList.add(className);
        message.classList.add("active");
        setTimeout(() => {
          hideMessage(className);
        }, 2000);
      }
      function hideMessage(className) {
        message.classList.remove("active");
        setTimeout(() => {
          message.classList.remove(className);
        }, 500);
      }
      let reg =
        /(((^https?:(?:\/\/)?)(?:[-:&=\+\$,\w]+@)?[A-Za-z0-9.-]+(?::\d+)?|(?:www.|[-:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&%@.\w_]*)#?(?:[\w]*))?)$/;
      if (!btn) return;
      btn.addEventListener("click", function () {
        if (!url.value) {
          showMessage("请输入完整地址！", "error");
          return;
        }
        if (!reg.test(url.value)) {
          showMessage("请输入正确的url！", "error");
          return;
        }
        //找出需要复制localStorage的目标tab
        if (checkBoxDom1.checked) {
          chrome.tabs.query({}, function (tabs) {
            //tabsisanarrayofTabobjects
            for (let tab of tabs) {
              if (tab && tab.url && tab.url.includes(url.value)) {
                needWriteTab = tab;
                break;
              }
            }
            //没有就创建新的窗口
            if (!needWriteTab) {
              needWriteTab = chrome.tabs.create({
                url: url.value,
                active: false,
              });
            }
            for (let tab of tabs) {
              if (tab && tab.url && tab.url.includes(url.value)) {
                needWriteTab = tab;
                break;
              }
            }
          });
        }
        chrome.tabs.query(
          { active: true, currentWindow: true },
          function (tabs) {
            let tab = tabs[0];
            if (checkBoxDom1.checked) {
              //获取当前窗口的localStorage数据并写入到目标tab
              chrome.scripting
                .executeScript({
                  target: { tabId: tab.id },
                  func: () => {
                    return JSON.parse(JSON.stringify(localStorage));
                  },
                })
                .then((res) => {
                  writeLocalStore(needWriteTab, res[0].result);
                });
            }
            //设置目标域名下的cookies
            chrome.cookies.getAll({ url: tab.url }, function (cookies) {
              cookies.forEach(function (cookie) {
                chrome.cookies.set({
                  url: url.value,
                  name: cookie.name,
                  value: cookie.value,
                });
              });
              if (checkBoxDom.checked) {
                chrome.tabs.create({ url: url.value });
              } else {
                showMessage("复制成功！", "success");
              }
            });
          }
        );
      });
    },
  };
  main.init();
})();
