function evaluator() {
  const authors = find(document.querySelectorAll('.detail-set div.attr-item'), 'Authors:', getAuthors);
  const chapters = getChapters(document.querySelectorAll('.chapter-list a.chapt'));
  const genres = find(document.querySelectorAll('.detail-set div.attr-item'), 'Genres:', getGenres);
  const image = getImage(document.querySelector('.detail-set img'));
  const summary = getSummary(document.querySelector('.detail-set pre'));
  const title = getTitle(document.querySelector('.item-title a'));
  return {authors, chapters, genres, image, summary, title};
  
  /**
   * @template T
   * @param {NodeListOf<HTMLDivElement>?} containerNodes
   * @param {string} startsWith
   * @param {(containerNode: HTMLDivElement) => T} transform
   */
  function find(containerNodes, startsWith, transform) {
    if (!containerNodes || !containerNodes.length) throw new Error();
    return transform(Array.from(containerNodes)
      .map((containerNode) => ({containerNode, text: validateStrict(containerNode.textContent)}))
      .filter((data) => data.text.startsWith(startsWith))
      .map((data) => data.containerNode)[0] || undefined);
  }

  /**
   * @param {HTMLDivElement?} authorNode
   */
  function getAuthors(authorNode) {
    const match = (validate(authorNode && authorNode.textContent) || '').match(/:(.*)/);
    const authors = match && match[1].split(/\//).map(validate).filter(Boolean).map(String);
    if (!authors) throw new Error();
    return authors;
  }

  /**
   * @param {NodeListOf<HTMLAnchorElement>?} chapterNodes
   */
  function getChapters(chapterNodes) {
    if (!chapterNodes || !chapterNodes.length) throw new Error();
    return Array.from(chapterNodes).map((chapterNode) => {
      const title = validateStrict(chapterNode.textContent);
      const url = validateStrict(chapterNode.href);
      return {title, url};
    });
  }

  /**
   * @param {HTMLDivElement?} genreNode
   */
  function getGenres(genreNode) {
    const match = (validate(genreNode && genreNode.textContent) || '').match(/:(.*)/);
    const genres = match && match[1].split(/\//).map(validate).filter(Boolean).map(String);
    if (!genres) throw new Error();
    return genres;
  }

  /**
   * @param {HTMLImageElement?} imageNode
   */
  function getImage(imageNode) {
    return validateStrict(imageNode && imageNode.src);
  }

  /**
   * @param {HTMLPreElement?} summaryNode
   */
  function getSummary(summaryNode) {
    return validateStrict(summaryNode && summaryNode.textContent);
  }

  /**
   * @param {HTMLAnchorElement?} titleNode
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

if (typeof module !== 'undefined') {
  module.exports = {evaluator};
} else {
  console.log(evaluator());
}
