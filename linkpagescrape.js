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
        description: 'Type a start date for the date range using the format "m/d/yyyy"'
    },
    {
        name: 'endDate',
        description: 'Type an end date for the date range using the format "m/d/yyyy"'
    },
    {
        name: 'correctDate',
        description: "You're sure the values you typed are correct? Y/N: "
    }
];

//Go to the page with all the links. Sign in with user's creds and use the url to navigate to page with broken links.
function startNightmare(nightmare) {
    nightmare
        .viewport(1200, 900)
        .goto('https://byui.brightspace.com/d2l/login?noredirect=true')
        //prompt the user for their own credentials
        .type('#userName', promptInfo.username)
        .type('#password', promptInfo.password)
        .click('.d2l-button')
        .wait(3000)
        .goto('https://byui.brightspace.com/d2l/brokenLinks/6606')
        //Wait for page to load
        .wait(1000)


        /* .select('div.d2l-select-container select.vui-input.d2l-select option:nth-child(3)', '2')*/
        .evaluate(function () {

            document.querySelector('div.d2l-select-container select.vui-input.d2l-select option:nth-child(3)').selected = 'selected';
            D2L.O("__g1", 47)();
        })
        .wait(1000)
        //take the input from the user and type it into a custom date range.
        .evaluate(function (dateInfo) {
            document.getElementById('startDate').value = dateInfo.startDate;
            document.getElementById('endDate').value = dateInfo.endDate;

        }, dateInfo)
        .type('#endDate', ' ')
        .wait(2000)
        .click('#optionsForm div:nth-of-type(1) > a')
        //If the selector button called "Load more" exists, click it
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
//When it no longer exists, scrape the page of info
//take the table from the page and store it in an array
function scrapePage(nightmare) {
    nightmare
        .evaluate(function (selector) {
            //create an array to store all the things
            var getItAll = [];

            //then scrape the information and push all of the objects to the array
            var entire = $('.vui-table tbody tr').get();
            for (var i = 0; i < entire.length; i++) {
                var row = $(entire[i]).children().get();
                //add the base URL to the beginning of all the items in the list
                var baseURL = 'https://byui.brightspace.com';

                getItAll.push({
                    'Linked From': $(row[1]).text().trim(),
                    'Clicks': $(row[2]).text().trim(),
                    'Target URL': $(row[3]).text().trim(),
                    'Latest Click': $(row[4]).text().trim()
                });
            }
            var everything = getItAll.map(function (currentObject) {

                currentObject["Linked From"] = baseURL + currentObject["Linked From"];
                currentObject["Target URL"] = baseURL + currentObject["Target URL"];
                return currentObject;
            })
            //send an object to SORT the data and decide the category of the data: Online, campus, reference, or other
            everything.reduce(function (total, currentObject) {
                if (currentObject["Linked From"].includes('Online.2017')) {
                    //if the property of the object doesn't exist, create it.
                    if (!total[currentObject]) {
                        total[currentObject].online = ;
                    }
                    //if it does exist, add the current object to it.
                    else {
                        total += total[currentObject];
                    }
                } else if (currentObject["Linked From"].includes('*Campus*')) {
                    //sort to campus
                } else if (currentObject["Linked From"].includes('*Online.Reference*')) {
                    //sort to online reference
                } else {
                    //sort to other
                }

            }, {});
            return everything;
        }, 'd2l-textblock')
        //Save everything to a CSV


        .then(function (getItAll) {

            //take a fileName and save the csv there
            var fileName = 'brokenLinks-online.csv';
            var brokenLinks = (dsv.csvFormat(getItAll, ['Linked From', 'Clicks', 'Target URL', 'Latest Click']));
            fs.writeFileSync(fileName, brokenLinks);
            console.log('Your file has been saved as ' + fileName);

            //sorted data should be saved according to its category(online, campous, reference or other)

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
        endDate: result.endDate,
        correctDate: result.correctDate
    }
    if (result.endDate == "") {
        var today = new Date();
        var day = today.getDate();
        var month = today.getMonth() + 1;
        var year = today.getFullYear();


        var defaultDate = month + '/' + day + '/' + year;
        result.endDate = today;

    }
    //if they look back and realize the date is incorrect, exit the program, else continue
    if (result.correctDate == 'N') {
        return;
    } else {
        console.log('Thanks, checking credentials...')
        startNightmare(nightmare)
    }

});
