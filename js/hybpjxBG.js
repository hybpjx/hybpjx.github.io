(function () {
  "use strict";

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  function copyWithAttribution(event) {
    var selection = window.getSelection ? window.getSelection().toString() : "";
    if (!selection || selection.length < 80) return;

    var clipboardData = event.clipboardData || window.clipboardData;
    if (!clipboardData) return;

    event.preventDefault();

    var text = selection + "\n\n著作权归作者所有。\n商业转载请联系作者获得授权，非商业转载请注明出处。\n作者：zichliang（hybpjx/始識）\n链接：" + window.location.href + "\n";
    var html = selection + "<br><br>著作权归作者所有。<br>商业转载请联系作者获得授权，非商业转载请注明出处。<br>作者：zichliang（hybpjx/始識）<br>链接：" + window.location.href + "<br>";

    clipboardData.setData("text/plain", text);
    clipboardData.setData("text/html", html);
  }

  function initSearch() {
    var input = document.getElementById("search-input");
    var result = document.getElementById("search-result");
    if (!input || !result || typeof window.searchFunc !== "function") return;

    window.searchFunc("/search.xml", "search-input", "search-result");
  }

  function copyText(text) {
    function fallbackCopy() {
      var textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      try {
        document.execCommand("copy");
      } finally {
        document.body.removeChild(textarea);
      }
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).catch(function () {
        fallbackCopy();
      });
    }
    fallbackCopy();
    return Promise.resolve();
  }

  function buildCopyButton() {
    var button = document.createElement("button");
    button.type = "button";
    button.className = "code-copy-btn";
    button.setAttribute("aria-label", "复制代码");
    button.title = "复制代码";
    button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 9h10v12H7V7h2v2Zm-4 0h2v12h12v2H5V9Zm4-6h10v2H9v10H7V5c0-1.1.9-2 2-2Z"/></svg>';
    return button;
  }

  function initCodeCopy() {
    var blocks = document.querySelectorAll(".article-body figure.highlight, .article-body pre:not(.hljs)");
    blocks.forEach(function (block) {
      if (block.tagName === "PRE" && block.closest("figure.highlight")) return;
      if (block.querySelector(".code-copy-btn")) return;
      block.classList.add("code-copy-shell");
      var button = buildCopyButton();
      button.addEventListener("click", function () {
        var code = block.querySelector("code");
        var text = code ? code.innerText : block.innerText;
        copyText(text.replace(/\n+$/, "")).then(function () {
          button.classList.add("is-copied");
          button.setAttribute("aria-label", "已复制");
          setTimeout(function () {
            button.classList.remove("is-copied");
            button.setAttribute("aria-label", "复制代码");
          }, 1400);
        });
      });
      block.appendChild(button);
    });
  }

  function getAnchorOffset() {
    var header = document.querySelector(".site-header");
    var height = header ? header.getBoundingClientRect().height : 0;
    return height + 18;
  }

  function getHeadingText(heading) {
    var clone = heading.cloneNode(true);
    var headerLinks = clone.querySelectorAll(".headerlink");
    headerLinks.forEach(function (link) {
      link.parentNode.removeChild(link);
    });
    return clone.textContent.replace(/\s+/g, " ").trim();
  }

  function ensureHeadingId(heading, index) {
    if (heading.id) return heading.id;

    var base = getHeadingText(heading)
      .toLowerCase()
      .replace(/[^\w\u4e00-\u9fa5-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "heading";
    var id = base;
    var count = 1;

    while (document.getElementById(id)) {
      id = base + "-" + count;
      count += 1;
    }

    heading.id = id || ("heading-" + index);
    return heading.id;
  }

  function buildTocNumber(counters, level, baseLevel) {
    var depth = Math.max(level - baseLevel, 0);
    counters[depth] = (counters[depth] || 0) + 1;
    counters.length = depth + 1;
    return counters.join(".") + ".";
  }

  function rebuildArticleToc() {
    var article = document.querySelector(".article-body");
    var toc = document.querySelector(".article-toc");
    var tocBody = document.querySelector(".article-toc__body");
    if (!article || !toc || !tocBody) return false;

    var headings = article.querySelectorAll("h1, h2, h3, h4, h5, h6");
    tocBody.innerHTML = "";

    if (!headings.length) {
      toc.classList.add("is-empty");
      return false;
    }

    var list = document.createElement("ol");
    list.className = "toc";
    var counters = [];
    var baseLevel = Array.prototype.reduce.call(headings, function (min, heading) {
      var level = parseInt(heading.tagName.slice(1), 10);
      return Math.min(min, level);
    }, 6);

    headings.forEach(function (heading, index) {
      var level = parseInt(heading.tagName.slice(1), 10);
      var id = ensureHeadingId(heading, index);
      var text = getHeadingText(heading);
      if (!text) return;

      var item = document.createElement("li");
      item.className = "toc-item toc-level-" + level;

      var link = document.createElement("a");
      link.className = "toc-link";
      link.href = "#" + id;
      link.setAttribute("data-target-id", id);

      var number = document.createElement("span");
      number.className = "toc-number";
      number.textContent = buildTocNumber(counters, level, baseLevel);

      var label = document.createElement("span");
      label.className = "toc-text";
      label.textContent = text;

      link.appendChild(number);
      link.appendChild(label);
      item.appendChild(link);
      list.appendChild(item);
    });

    tocBody.appendChild(list);
    toc.classList.remove("is-empty");
    return true;
  }

  function scrollToHeading(heading) {
    var top = heading.getBoundingClientRect().top + window.pageYOffset - getAnchorOffset();
    window.scrollTo({
      top: Math.max(top, 0),
      behavior: "smooth"
    });
  }

  function initTocScrollOffset() {
    document.addEventListener("click", function (event) {
      var link = event.target.closest ? event.target.closest(".article-toc a[href^='#']") : null;
      if (!link) return;

      var id = link.getAttribute("data-target-id") || decodeURIComponent(link.getAttribute("href").slice(1));
      var heading = document.getElementById(id);
      if (!heading) return;

      event.preventDefault();
      scrollToHeading(heading);

      if (history.pushState) {
        history.pushState(null, "", "#" + id);
      } else {
        window.location.hash = id;
      }
    });
  }

  function rebuildArticleTocWhenReady() {
    var attempts = 0;
    var timer = setInterval(function () {
      attempts += 1;
      if (rebuildArticleToc() || attempts >= 20) {
        clearInterval(timer);
      }
    }, 150);
  }

  function hideLoading() {
    var loading = document.getElementById("Loadanimation");
    if (!loading || loading.classList.contains("is-loaded")) return;

    loading.classList.add("is-loaded");
    setTimeout(function () {
      if (loading && loading.parentNode) {
        loading.parentNode.removeChild(loading);
      }
    }, 650);
  }

  function initLoading() {
    if (document.readyState === "complete") {
      setTimeout(hideLoading, 180);
    } else {
      window.addEventListener("load", function () {
        setTimeout(hideLoading, 180);
      }, { once: true });
    }

    // 外链资源异常或播放器 CDN 慢时，避免 loading 长时间遮挡页面。
    setTimeout(hideLoading, 4500);
  }

  ready(function () {
    initLoading();
    // document.body.addEventListener("copy", copyWithAttribution);
    initSearch();
    initCodeCopy();
    initTocScrollOffset();
    rebuildArticleToc();
    window.addEventListener("hexo-blog-decrypt", function () {
      rebuildArticleTocWhenReady();
      setTimeout(initCodeCopy, 200);
    });
  });
}());
