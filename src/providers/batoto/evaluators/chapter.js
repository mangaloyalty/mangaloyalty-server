function evaluator() {
  scrollTo(0, document.body.scrollHeight);
  const image = getImage(document.querySelector('.page-img'));
  const pageCount = getPageCount(document.querySelectorAll('.nav-page option'));
  const shouldContinue = getShouldContinue(document.querySelectorAll('.nav-page option'), pageCount);
  return {image, pageCount, shouldContinue};

  /**
   * @param {HTMLImageElement?} imageNode
   */
  function getImage(imageNode) {
    return validateStrict(imageNode && imageNode.src);
  }

  /**
   * @param {NodeListOf<HTMLOptionElement>?} optionNodes
   */
  function getPageCount(optionNodes) {
    if (!optionNodes || !optionNodes.length) throw new Error();
    const pageValues = Array.from(optionNodes).map((optionNode) => optionNode.value);
    const pageNumbers = pageValues.filter((page) => page && /^[0-9]+$/.test(page)).map((page) => Number(page));
    const pageCount = pageNumbers.sort((a, b) => a < b ? 1 : -1)[0];
    if (!pageCount) throw new Error();
    return pageCount;
  }

  /**
   * @param {NodeListOf<HTMLOptionElement>} optionNodes
   * @param {number} pageCount
   */
  function getShouldContinue(optionNodes, pageCount) {
    const optionNode = Array.from(optionNodes).find(x => x.selected);
    const pageNumber = optionNode ? Number(optionNode.value) : NaN;
    if (pageCount <= pageNumber) return false;
    return true;
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
