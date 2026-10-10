// <head> 에서 가장 먼저 실행 (모듈 아님). 영어를 고른 방문자에게 한국어 원문이 잠깐 보이지 않도록
// 번역이 끝날 때까지 본문을 숨긴다. 스크립트가 실패해도 1.5초 뒤에는 무조건 보인다.
(function () {
  var locale = 'ko';
  try {
    locale = localStorage.getItem('norideck.locale') === 'en' ? 'en' : 'ko';
  } catch (e) {
    // 기본값
  }
  var root = document.documentElement;
  root.lang = locale;
  if (locale === 'en') {
    root.classList.add('i18n-pending');
    setTimeout(function () {
      root.classList.remove('i18n-pending');
    }, 1500);
  }
})();
