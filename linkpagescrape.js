var Nightmare = require('nightmare');
var nightmare = new Nightmare({
    show: true
});
var dsv = require('d3-dsv')
var fs = require('fs')

var creds = JSON.parse(fs.readFileSync('./credentials.js', 'utf-8'))
//1. Go to the page with all the links. Sign in with 'cct_maeashley' acct, use the url to navigate to link page.
function startNightmare(nightmare) {
    nightmare
        .goto('https://byui.brightspace.com/d2l/login?noredirect=true')
        //this is where I need to prompt the user for their own credentials
        .type('#userName', creds.username)
        .type('#password', creds.password)
        .click('.d2l-button')
        .wait(3000)
        .goto('https://byui.brightspace.com/d2l/brokenLinks/6606')
        //2. Wait for page to load
        .wait(1000)

        //make the date ranges available (may need to prompt the user for input values)

        //3. If the selector button called "Load more" exists, click it
        .evaluate(function (callback) {
            function clickLoad() {
                if ($('.d2l-loadmore-pager:visible').length) {
                    $('.d2l-loadmore-pager').click()
                    setTimeout(clickLoad, 500)
                } else {
                    callback();
                }
            }
            clickLoad()
        })
        .then(function () {
            scrapePage(nightmare)
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

            //send an array of objects to SORT the data and decide the category of the information: Online, campus, reference, or other

            //then scrape the information and push all of the objects to the array
            var entire = $('.vui-table tbody tr').get();
            for (var i = 0; i < entire.length; i++) {
                var row = $(entire[i]).children().get();

                getItAll.push({
                    'Linked From': $(row[1]).text().trim(),
                    'Clicks': $(row[2]).text().trim(),
                    'Target URL': $(row[3]).text().trim(),
                    'Latest Click': $(row[4]).text().trim()

                    //add the base URL to the beginning of all the items in the list
                    var baseURL = 'https://byui.brightspace.com';
                    var broken = '.d2l-grid-cell .d2l-textblock:even';

                    function addBaseURL(getItAll, baseURL, broken) {
                        getItAll.forEach(function callback(baseURL, broken) {
                            var link = baseURL + broken;
                        }[, getItAll]);
                    }
                    for ('.vui-table tbody tr' in getItAll) {
                        if ('.vui-table tbody tr'.innerHTML like '*Online.2017*') {
                            //sort into online csv
                        } else if ('.vui-table tbody tr'.innerHTML like '*campus.*') {
                            //sort into campus CSV
                        } else if ('.vui-table tbody tr'.innerHTML like '*.reference*') {
                            //sort into reference csv
                        } else {
                            //sort into other csv
                        }
                    }
                });

            }


            return getItAll;
        }, 'd2l-textblock')
        //6. Save everything to a CSV


        .then(function (getItAll) {
            console.log(getItAll);
            //run the program at the beginning
            console.log('patience...');

            //take a fileName and save the csv there
            var fileName = 'brokenLinks-online.csv';
            var brokenLinks = (dsv.csvFormat(getItAll, ['Linked From', 'Clicks', 'Target URL', 'Latest Click']));
            fs.writeFileSync(fileName, brokenLinks);
            console.log('Your file has been saved as ' + fileName);

            //sorted data will be saved according to its category

            /*var fileName = 'brokenLinks-campus.csv';
            var brokenLinks = (dsv.csvFormat(getItAll, ['Linked From', 'Clicks', 'Target URL', 'Latest Click']));
            fs.writeFileSync(fileName, brokenLinks);
            console.log('Your file has been saved as ' + fileName);*/

            /*var fileName = 'brokenLinks-reference.csv';
            var brokenLinks = (dsv.csvFormat(getItAll, ['Linked From', 'Clicks', 'Target URL', 'Latest Click']));
            fs.writeFileSync(fileName, brokenLinks);
            console.log('Your file has been saved as ' + fileName);*/

            /*var fileName = 'brokenLinks-unknown.csv';
            var brokenLinks = (dsv.csvFormat(getItAll, ['Linked From', 'Clicks', 'Target URL', 'Latest Click']));
            fs.writeFileSync(fileName, brokenLinks);
            console.log('Your file has been saved as ' + fileName);*/

            return nightmare.end();
        }).catch(function (Error) {
            console.log('The error was: ', Error);
        })

    //create a function that retrieves username and password from the user
    promptInfo = {
        username: result.username,
        password: result.password
    }
}
