var Nightmare = require('nightmare');
var nightmare = new Nightmare({
    show: true
});
var dsv = require('d3-dsv')
var fs = require('fs')

var creds = require('./credentials.js')
//1. Go to the page with all the links. Sign in with 'cct_maeashley' acct, use the url to navigate to link page.
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
startNightmare(nightmare);
//4. When it no longer exists, scrape the page of info
//take the table from the page and store it in an array
function scrapePage(nightmare) {
    nightmare
        .evaluate(function (selector) {
            //create an array to store all the things
            var getItAll = [];
            //go through each individual thing and push it to the array
            var entire = document.querySelectorAll('.vui-table tbody tr')
            for (var i = 0; i < entire; i++) {

                return document.querySelector('d2l-textblock').innerHTML;
                getItAll.push('d2l-textblock');

            }
        }, 'd2l-textblock')
        //6. Save everything to a CSV
        .then(function () {

            //run the program at the beginning
            console.log('patience...');

            //take a fileName and save the csv there
            fileName = '';
            /*I need to pass something into the dsv module. I'm not sure what.*/
            var brokenLinks = (dsv.csvFormat());
            fs.writeFileSync(fileName, brokenLinks);
            console.log('Your file has been saved as ' + fileName);


        }).catch(function (Error) {
            console.log('The error was: ', Error);
        })
}
scrapePage(nightmare);

function complete(nightmare) {
    nightmare
        .end();
}
complete(nightmare);
