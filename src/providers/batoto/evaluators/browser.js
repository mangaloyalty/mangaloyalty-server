function evaluator() {
  return (() => {
    const isVerification = Boolean(document.querySelector('.cf-browser-verification'));
    return {isVerification};
  })();
}

if (typeof module !== 'undefined') {
  module.exports = {evaluator};
} else {
  console.log(evaluator());
}
