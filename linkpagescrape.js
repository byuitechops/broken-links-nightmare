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
        description: "You're sure the date values you typed are correct? Y/N: "
    }
];

function sortData(links) {
    //created this array of objects to better modularize the sort function
    var drawers = [{
        name: "online",
        search: /Online\.2017/i
    }, {
        name: "sso",
        search: /SSO/
    }, {
        name: "templates",
        search: /Web%20Files/i
    }, {
        name: "reference",
        search: /Online\.Reference/i
    }, {
        name: "campus",
        search: /Campus/i
    }, {
        name: "other",
        search: ""
    }];

    //check if each individual link matches its search property and if it does, push it to its respective drawer.
    var sortedLinks = links.reduce(function (fileCabinet, link) {
        for (var i = 0; i < drawers.length; i++) {
            if (link.linkedFrom.match(drawers[i].search) !== null) {
                if (!fileCabinet[drawers[i].name]) {
                    fileCabinet[drawers[i].name] = [];
                }
                //add the link to it
                fileCabinet[drawers[i].name].push(link);
                //item found
                i = drawers.length;
            }
        }
        return fileCabinet;
    }, {});

    return sortedLinks;
};

function fixDate(dateString) {
    return dateString.replace(/\//g, '-')
}

//Go to the page with all the links. Sign in with user's creds and use the url to navigate to page with broken links

function startNightmare(nightmare) {
    nightmare
        .viewport(1000, 700)
        .goto('https://byui.brightspace.com/d2l/login?noredirect=true')
        //prompt the user for their own credentials
        .type('#userName', promptInfo.username)
        .type('#password', promptInfo.password)
        .click('.d2l-button')
        .wait(3000)
        .goto('https://byui.brightspace.com/d2l/brokenLinks/6606')
        //Wait for page to load
        .wait(1000)


        .evaluate(function () {
            //changes the value on the date select tag to the option we want
            document.querySelector('[name="predefinedDates"] option:nth-child(3)').selected = 'selected';
            //calls the onchange function for the select tag
            document.querySelector('[name="predefinedDates"]').onchange();
            //        D2L.O("__g1", 47)();
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
                var baseURL = window.location.origin; //'https://byui.brightspace.com', could also be used for pathway.

                getItAll.push({
                    'linkedFrom': baseURL + $(row[1]).text().trim(),
                    'Clicks': $(row[2]).text().trim(),
                    'targetURL': baseURL + $(row[3]).text().trim(),
                    'latestClick': $(row[4]).text().trim()
                });
            }

            return getItAll;

        }, 'd2l-textblock')
        //Save everything to a CSV
        .end()
        .then(function (getItAll) {
            //used to print test data:
            //fs.writeFileSync('testData.json', JSON.stringify(getItAll, null, 4))

            //fileCabinet stores the data (an array)from the function sortData.
            var fileCabinet = sortData(getItAll),
                drawerName, fileName, brokenLinks;
            for (drawerName in fileCabinet) {
                //take a fileName and save the csv there
                fileName = 'brokenLinks_' + drawerName + '_' + fixDate(dateInfo.startDate) + '_' + fixDate(dateInfo.endDate) + '.csv';
                brokenLinks = (dsv.csvFormat(fileCabinet[drawerName], ['linkedFrom', 'Clicks', 'targetURL', 'latestClick']));
                fs.writeFileSync(fileName, brokenLinks);
                console.log('Your file has been saved as ' + fileName);
            }

            //sorted data should be saved according to its category(online, campus, reference or other)

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

    } else if (result.startDate == "") {
        return;
    }
    //if they look back and realize the date is incorrect, exit the program, else continue
    if (result.correctDate == 'N') {
        return;
    } else {
        console.log('Thanks, checking credentials...')
        startNightmare(nightmare)
    }

});
