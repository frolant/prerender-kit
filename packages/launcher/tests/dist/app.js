const content = document.title + ' passed successfully';
const menu = '<br/><a href="/">Main page</a><br/><a href="page.html">Other page</a>';

document.title = content;
document.getElementById('app').innerHTML = content + menu;
