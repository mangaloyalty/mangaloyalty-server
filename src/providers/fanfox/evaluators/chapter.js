async function evaluatorAsync() {
  const images = await getImagesAsync(document.querySelector('img.reader-main-img'));
  const pageCount = getPageCount(document.querySelectorAll('.cp-pager-list a[data-page]'));
  const shouldContinue = getShouldContinue(document.querySelector('.cp-pager-list a:last-of-type'), images);
  return {images, pageCount, shouldContinue};

  /**
   * @param {HTMLImageElement?} imageNode
   * @return {Promise<string[]>}
   */
  function getImagesAsync(imageNode) {
    return new Promise((resolve, reject) => {
      const image = validateStrict(imageNode && imageNode.src);
      if (!/\/loading\.gif$/.test(image)) resolve([image]);
      else if (!imageNode) reject();
      else imageNode.addEventListener('load', () => resolve([validateStrict(imageNode && imageNode.src)]));
    });
  }

  /**
   * @param {NodeListOf<HTMLAnchorElement>?} anchorNodes
   */
  function getPageCount(anchorNodes) {
    if (!anchorNodes || !anchorNodes.length) throw new Error();
    const pageData = Array.from(anchorNodes).map((anchorNode) => anchorNode.getAttribute('data-page'));
    const pageNumbers = pageData.filter((page) => page && /^[0-9]+$/.test(page)).map((page) => Number(page));
    if (!pageNumbers.length) throw new Error();
    return pageNumbers.sort((a, b) => a < b ? 1 : -1)[0];
  }

  /**
   * @param {HTMLAnchorElement?} anchorNode
   * @param {string[]} images
   */
  function getShouldContinue(anchorNode, images) {
    const anchorText = validateStrict(anchorNode && anchorNode.textContent);
    const shouldContinue = Boolean(images.length) && anchorText === '>';
    if (shouldContinue && anchorNode) anchorNode.click();
    return shouldContinue;
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

function shouldWaitAdultEvaluator() {
  return confirmAdult(document.querySelector('a#checkAdult'));

  /**
   * @param {HTMLAnchorElement?} adultNode
   */
  function confirmAdult(adultNode) {
    if (!adultNode) return false;
    adultNode.click();
    return true;
  }
}

if (typeof module !== 'undefined') {
  module.exports = {evaluatorAsync, shouldWaitAdultEvaluator};
} else if (shouldWaitAdultEvaluator()) {
  console.log('Waiting for navigation');
} else {
  evaluatorAsync().then(console.log.bind(console));
}
