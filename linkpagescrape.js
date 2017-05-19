var Nightmare = require('nightmare');
var nightmare = new Nightmare({
    show: true
});
var creds = require('./credentials.js')
//1. Go to the page with all the links
function startNightmare(nightmare) {
    nightmare
        .goto('https://byui.brightspace.com/d2l/login?noredirect=true')
        .type('#userName', creds.username)
        .type('#password', creds.password)
        .click('.d2l-button')
        .wait(3000)
        .goto('https://byui.brightspace.com/d2l/brokenLinks/6606')
        //2. Wait for page to load
        .wait(1000)
        //3. If the selector button exists, click it until it no longer exists
        .evaluate(function () {
            function clickLoad() {
                if ($('.d2l-loadmore-pager:visible').length) {
                    $('.d2l-loadmore-pager').click()
                    setTimeout(clickLoad, 500)
                }
            }
            clickLoad()
        })
}
startNightmare(nightmare)
//4. When it no longer exists, scrape the page of info
var urlPrefix = 'www.brightspace.com';

function scrapePage(nightmare) {
    nightmare
        .evaluate(function (urlPrefix) {
            //take the urlPrefix,
            //add every d2l-textblock element in the Links column after it
        })
}
scrapePage(nightmare)
//5. and download it to a CSV
function saveList(nightmare) {
    //code here
}
saveList(nightmare)
//6. Do all the things
nightmare
    .then(console.log('patience...'))
    .catch(console.log);
