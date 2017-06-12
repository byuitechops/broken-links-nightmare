var Nightmare = require('nightmare');
var nightmare = new Nightmare({
    show: true
});
var dsv = require('d3-dsv')
var fs = require('fs')
var prompt = require('prompt')
var credentials = [
    {
        name: 'username',
        description: 'Please enter your username'
    },
    {
        name: 'password',
        description: 'Please enter your password',
        hidden: true,
        replace: '*'
    },
    {
        name: 'startDate',
        description: 'Type a beginning date for the date range using the format "m/d/yyyy"'
    },
    {
        name: 'endDate',
        description: 'Type an end date for the date range using the format "m/d/yyyy"'
    }
];

//1. Go to the page with all the links. Sign in use the url to navigate to link page.
function startNightmare(nightmare) {
    nightmare
        .viewport(1200, 900)
        .goto('https://byui.brightspace.com/d2l/login?noredirect=true')
        //this is where I need to prompt the user for their own creds
        .type('#userName', promptInfo.username)
        .type('#password', promptInfo.password)
        .click('.d2l-button')
        .wait(3000)
        .goto('https://byui.brightspace.com/d2l/brokenLinks/6606')
        //2. Wait for page to load
        .wait(1000)

        //make the date ranges available (may need to prompt the user for input values)
        /* .select('div.d2l-select-container select.vui-input.d2l-select option:nth-child(3)', '2')*/
        .evaluate(function () {

            document.querySelector('div.d2l-select-container select.vui-input.d2l-select option:nth-child(3)').selected = 'selected';
            D2L.O("__g1", 47)();
        })
        .wait(1000)
        .evaluate(function (dateInfo) {
            document.getElementById('startDate').value = dateInfo.startDate;
            document.getElementById('endDate').value = dateInfo.endDate;

        }, dateInfo)
        .type('#endDate', ' ')
        .wait(2000)
        .click('#optionsForm div:nth-of-type(1) > a')
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
                    /*var baseURL = 'https://byui.brightspace.com';
var broken = '.d2l-grid-cell .d2l-textblock:even';

function addBaseURL(getItAll, baseURL, broken) {
    getItAll.map();
    getItAll.reduce();
    //still working on this logic, probably something like a .map>.reduce
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
}*/
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

            //sorted data should be saved according to its category

            return nightmare.end();
        }).catch(function (Error) {
            console.log('The error was: ', Error);
        })

}

//retrieve username and password from the user
var promptInfo = {};
var dateInfo = {};

prompt.start();


prompt.get(credentials, function (err, result) {
    if (err) {
        console.log(err);
    }

    promptInfo = {
        username: result.username,
        password: result.password
    }
    dateInfo = {
        startDate: result.startDate,
        endDate: result.endDate
    }
    console.log('Thanks, checking credentials...')
    startNightmare(nightmare)

});
