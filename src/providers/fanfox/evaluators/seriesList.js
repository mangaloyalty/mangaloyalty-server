function evaluator() {
  return (() => {
    const hasMorePages = getHasMorePages(document.querySelector('.pager-list a:last-of-type'));
    const items = Array.from(document.querySelectorAll('.manga-list-1-list li, .manga-list-4-list li')).map(extract);
    return {hasMorePages, items};
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
   * @param {HTMLAnchorElement?} anchorNode
   */
  function getHasMorePages(anchorNode) {
    const anchorHref = validate(anchorNode && anchorNode.href);
    const hasMorePages = Boolean(anchorHref && !anchorHref.startsWith('javascript'));
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
