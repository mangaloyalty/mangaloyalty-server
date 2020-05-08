async function evaluatorAsync() {
  scrollTo(0, document.body.scrollHeight);
  const images = await getImagesAsync(document.querySelectorAll('img.reader-main-img'));
  const pageCount = images.length >= 2 ? images.length : getPageCount(document.querySelectorAll('.cp-pager-list a[data-page]'));
  const shouldContinue = images.length >= 2 ? false : getShouldContinue(document.querySelector('.cp-pager-list span a:last-of-type'), images);
  return {images, pageCount, shouldContinue};

  /**
   * @param {NodeListOf<HTMLImageElement>?} imageNodes
   * @return {Promise<string[]>}
   */
  function getImagesAsync(imageNodes) {
    if (!imageNodes || !imageNodes.length) throw new Error();
    const endTime = Date.now() + 30000;
    return Promise.all(Array.from(imageNodes).map((imageNode) => new Promise((resolve, reject) => {
      (function tick() {
        const image = validateStrict(imageNode && imageNode.src);
        if (!/\/loading\.(gif|jpg)$/.test(image)) resolve(image);
        else if (!imageNode || Date.now() >= endTime) reject(new Error());
        else setTimeout(tick, 10);
      })();
    })));
  }

  /**
   * @param {NodeListOf<HTMLAnchorElement>?} anchorNodes
   */
  function getPageCount(anchorNodes) {
    if (!anchorNodes || !anchorNodes.length) throw new Error();
    const pageData = Array.from(anchorNodes).map((anchorNode) => anchorNode.getAttribute('data-page'));
    const pageNumbers = pageData.filter((page) => page && /^[0-9]+$/.test(page)).map((page) => Number(page));
    const pageCount = pageNumbers.sort((a, b) => a < b ? 1 : -1)[0];
    if (!pageCount) throw new Error();
    return pageCount;
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
    setTimeout(() => confirmAdult(adultNode), 1000);
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
