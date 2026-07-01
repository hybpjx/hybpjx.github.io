/* exported searchFunc */
window.searchFunc = function (path, searchId, contentId) {
  if (window.__hybpjxSearchInited) return;
  window.__hybpjxSearchInited = true;

  function stripHtml(html) {
    html = html.replace(/<style([\s\S]*?)<\/style>/gi, "");
    html = html.replace(/<script([\s\S]*?)<\/script>/gi, "");
    html = html.replace(/<figure([\s\S]*?)<\/figure>/gi, "");
    html = html.replace(/<\/div>/ig, "\n");
    html = html.replace(/<\/li>/ig, "\n");
    html = html.replace(/<li>/ig, "  *  ");
    html = html.replace(/<\/ul>/ig, "\n");
    html = html.replace(/<\/p>/ig, "\n");
    html = html.replace(/<br\s*[\/]?>/gi, "\n");
    return html.replace(/<[^>]+>/ig, "");
  }

  function getAllCombinations(words) {
    var result = [];
    for (var i = 0; i < words.length; i++) {
      for (var j = i + 1; j <= words.length; j++) {
        result.push(words.slice(i, j).join(" "));
      }
    }
    return result;
  }

  fetch(path)
    .then(function (response) { return response.text(); })
    .then(function (text) {
      var xmlResponse = new DOMParser().parseFromString(text, "text/xml");
      var datas = Array.prototype.slice.call(xmlResponse.querySelectorAll("entry")).map(function (entry) {
        var link = entry.querySelector("link");
        return {
          title: entry.querySelector("title") ? entry.querySelector("title").textContent : "",
          content: entry.querySelector("content") ? entry.querySelector("content").textContent : "",
          url: link ? link.getAttribute("href") : "#"
        };
      });

      var input = document.getElementById(searchId);
      var resultBox = document.getElementById(contentId);
      if (!input || !resultBox) return;

      input.addEventListener("input", function () {
        var value = this.value.trim().toLowerCase();
        resultBox.innerHTML = "";
        if (!value) return;

        var keywords = getAllCombinations(value.split(/\s+/)).sort(function (a, b) {
          return b.split(" ").length - a.split(" ").length;
        });
        var resultList = [];

        datas.forEach(function (data) {
          var title = (data.title || "Untitled").trim();
          var content = stripHtml((data.content || "").trim());
          var titleLower = title.toLowerCase();
          var contentLower = content.toLowerCase();
          var matches = 0;
          var firstOccur = -1;

          keywords.forEach(function (keyword) {
            var indexTitle = titleLower.indexOf(keyword);
            var indexContent = contentLower.indexOf(keyword);
            if (indexTitle >= 0 || indexContent >= 0) {
              matches += 1;
              if (firstOccur < 0) firstOccur = Math.max(indexContent, 0);
            }
          });

          if (matches <= 0) return;

          var item = "<li><a href=\"" + data.url + "\" class=\"search-result-title\">" + title + "</a>";
          if (firstOccur >= 0) {
            var start = Math.max(0, firstOccur - 20);
            var end = Math.min(content.length, firstOccur + 80);
            var matchContent = content.substring(start, end);
            var reg = new RegExp(keywords.join("|"), "gi");
            matchContent = matchContent.replace(reg, function (keyword) {
              return "<em class=\"search-keyword\">" + keyword + "</em>";
            });
            item += "<p class=\"search-result\">" + matchContent + "...</p>";
          }
          item += "</li>";
          resultList.push({ rank: matches, str: item });
        });

        if (!resultList.length) {
          resultBox.innerHTML = "<p class=\"search-empty\">没有找到匹配内容。</p>";
          return;
        }

        resultList.sort(function (a, b) {
          return b.rank - a.rank;
        });
        resultBox.innerHTML = "<ul class=\"search-result-list\">" + resultList.map(function (item) {
          return item.str;
        }).join("") + "</ul>";
      });
    });
};
