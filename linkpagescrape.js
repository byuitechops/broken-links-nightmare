var Nightmare = require('nightmare');
var nightmare = new Nightmare({
    show: true
});
var dsv = require('d3-dsv')
var fs = require('fs')

var creds = require('./credentials.js')
//1. Go to the page with all the links. Sign in, use the url to navigate to the correct page.
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
        //3. If the selector button called "Load more" exists, click it
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
var urlPrefix = 'https://brightspace.com/d2l/home/';
var links = [];

function scrapePage(nightmare) {
    nightmare
        .evaluate(function (urlPrefix) {
            var link = urlPrefix + href;
            links.push({
                //take the urlPrefix,

            })

            //add every d2l-textblock element in the Links column after it individually
        })
}
scrapePage(nightmare)
nightmare
    .then(console.log('patience...'))
    .catch(console.log);

//6. Save everything to a file
function complete(nightmare) {
    nightmare
        .end()
        .then(function () {
            console.log('Your file has been saved!')
            var brokenLinks = (dsv.csvFormat(links))

            fileName = null;
            fs.writeFileSync(fileName, brokenLinks)
            console.log('Your file has been saved as ' + fileName);
        }).catch(function (Error) {
            console.log('The error was: ', Error);
        })
}
complete(nightmare)
