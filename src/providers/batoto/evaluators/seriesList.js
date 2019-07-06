function evaluator() {
  return (() => {
    const hasMorePages = getHasMorePages(document.querySelector('.pager li:last-of-type'));
    const items = Array.from(document.querySelectorAll('#series-list div.no-flag')).map(extract);
    return {hasMorePages, items};
  })();
  
  /**
   * @param {Element} containerNode
   */
  function extract(containerNode) {
    const image = getImage(containerNode.querySelector('img'));
    const title = getTitle(containerNode.querySelector('a.item-title'));
    const url = getUrl(containerNode.querySelector('a.item-title'));
    return {image, title, url};
  }

  /**
   * @param {HTMLLIElement?} liItem
   */
  function getHasMorePages(liItem) {
    const hasMorePages = !/disabled/.test(validateStrict(liItem && liItem.className));
    return hasMorePages;
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
