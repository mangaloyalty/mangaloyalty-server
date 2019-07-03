function evaluator() {
  const authors = getAuthors(document.querySelectorAll('.detail-info a[href*=\'/search/author/\']'));
  const chapters = getChapters(document.querySelectorAll('.detail-main #chapterlist .detail-main-list a'));
  const genres = getGenres(document.querySelectorAll('.detail-info a[href*=\'/directory/\']'));
  const image = getImage(document.querySelector('.detail-info img'));
  const summary = getSummary(document.querySelector('.detail-info p.detail-info-right-content'));
  const title = getTitle(document.querySelector('.detail-info span.detail-info-right-title-font'));
  return {authors, chapters, genres, image, summary, title};

  /**
   * @param {NodeListOf<HTMLAnchorElement>?} authorNodes
   */
  function getAuthors(authorNodes) {
    if (!authorNodes) throw new Error();
    return Array.from(authorNodes).map((authorNode) => validateStrict(authorNode.textContent));
  }

  /**
   * @param {NodeListOf<HTMLAnchorElement>?} chapterNodes
   */
  function getChapters(chapterNodes) {
    if (!chapterNodes) throw new Error();
    return Array.from(chapterNodes).map((chapterNode) => {
      const titleNode = chapterNode.querySelector('.title3');
      const title = validateStrict(titleNode && titleNode.textContent);
      const url = validateStrict(chapterNode.href);
      return {title, url};
    });
  }

  /**
   * @param {NodeListOf<HTMLAnchorElement>?} genreNodes
   */
  function getGenres(genreNodes) {
    if (!genreNodes) throw new Error();
    return Array.from(genreNodes).map((genreNode) => validateStrict(genreNode.textContent));
  }

  /**
   * @param {HTMLImageElement?} imageNode
   */
  function getImage(imageNode) {
    return validateStrict(imageNode && imageNode.src);
  }

  /**
   * @param {HTMLParagraphElement?} summaryNode
   */
  function getSummary(summaryNode) {
    const anchorNode = summaryNode && summaryNode.querySelector('a');
    if (anchorNode) anchorNode.click();
    return validate(summaryNode && summaryNode.textContent);
  }

  /**
   * @param {HTMLSpanElement?} titleNode
   */
  function getTitle(titleNode) {
    return validateStrict(titleNode && titleNode.textContent);
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
  module.exports = {evaluator, shouldWaitAdultEvaluator};
} else if (shouldWaitAdultEvaluator()) {
  console.log('Waiting for navigation');
} else {
  console.log(evaluator());
}
