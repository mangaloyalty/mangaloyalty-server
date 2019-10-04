function evaluator() {
  const images = getImages(document.querySelectorAll('.chapter-page img'));
  const pageCount = getPageCount(images);
  const shouldContinue = false;
  return {images, pageCount, shouldContinue};

  /**
   * @param {NodeListOf<HTMLImageElement>?} imageNodes
   */
  function getImages(imageNodes) {
    if (!imageNodes || !imageNodes.length) throw new Error();
    return Array.from(imageNodes).map((imageNode) => validateStrict(imageNode.src));
  }

  /**
   * @param {string[]} images
   */
  function getPageCount(images) {
    if (!images.length) throw new Error();
    return images.length;
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
