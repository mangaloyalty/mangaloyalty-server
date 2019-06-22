function evaluator() {
  return (() => {
    const containerNodes = document.querySelectorAll('.manga-list-1-list li, .manga-list-4-list li');
    if (!containerNodes || !containerNodes.length) throw new Error();
    return Array.from(containerNodes).map(extract);
  })();

  /**
   * @param {Element} containerNode
   */
  function extract(containerNode) {
    const image = getImage(containerNode.querySelector('img'));
    const title = getTitle(containerNode.querySelector('p:first-of-type a'));
    const url = getUrl(containerNode.querySelector('p:first-of-type a'));
    return {image, title, url};
  }
  
  /**
   * @param {HTMLImageElement?} imageNode
   */
  function getImage(imageNode) {
    return validateStrict(imageNode && imageNode.src);
  }

  /**
   * @param {HTMLAnchorElement?} titleNode
   */
  function getTitle(titleNode) {
    return validateStrict(titleNode && titleNode.textContent);
  }

  /**
   * @param {HTMLAnchorElement?} urlNode
   */
  function getUrl(urlNode) {
    return validateStrict(urlNode && urlNode.href);
  }

  /**
   * @param {string?} value 
   */
  function validate(value) {
    return value && value.trim().replace(/\s+/g, ' ') || undefined;
  }

  /**
   * @param {string?} value
   */
  function validateStrict(value) {
    const result = validate(value);
    if (!result) throw new Error();
    return result;
  }
}

if (typeof module !== 'undefined') {
  module.exports = {evaluator};
} else {
  console.log(evaluator());
}
