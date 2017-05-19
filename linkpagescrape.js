var Nightmare = require('nightmare');
var nightmare = new Nightmare({
    show: true
});
var creds = require('./credentials.js')
//1. Go to the page with all the links
nightmare
    .goto('https://byui.brightspace.com/d2l/login?noredirect=true')
    .type('#userName', creds.username)
    .type('#password', creds.password)
    .click('.d2l-button')
    .wait(3000)
    .goto('https://byui.brightspace.com/d2l/brokenLinks/6606')
    //2. Wait 
    .wait(1000)
    //3. If the selector button exists, click it
    .evaluate(function () {
        function clickLoad() {
            if ($('.d2l-loadmore-pager:visible').length) {
                $('.d2l-loadmore-pager').click()
                setTimeout(clickLoad, 500)
            }
        }
        clickLoad()
    })
    //4. When it no longer exists, scrape the page of links 
    .evaluate(function ('.d2l-loadmore-pager') {
        return document.querySelector(selector).innerText;
    }, selector)

    //5. and download it to a CSV
    .then(console.log)
contents.savePage('fullPath', 'saveType', callback) {
        if (error) {
            console.log('There was an error')
        } else if (!error) {
            console.log('Saved page successfully, find your file at: ', fullPath)
        }
    }
    //5. Do the things
    .then(console.log)
    .catch(console.log);
