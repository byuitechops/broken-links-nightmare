#! /usr/bin/env node

/*eslint-env node*/
/*eslint no-console:0*/
/*global $, document, window*/

var Nightmare = require('nightmare');
var nightmare = new Nightmare({
    show: true,
    /* openDevTools: {
     mode: 'detach'
 },*/
    alwaysOnTop: false
});
var csvToTable = require('csv-to-table')
var dsv = require('d3-dsv')
var fs = require('fs')
var prompt = require('prompt')

//selectors for the nightmare thing to happen
var usersName = '#userName',
    usersPassword = '#password';
var login = '.d2l-button';
var select = '[name="predefinedDates"] option:nth-child(3)';
var dropdownItem = '[name="predefinedDates"]';
var startField = '#startDate';
var endField = '#endDate';
var apply = '#optionsForm > div:nth-of-type(1) button';
var loadMoreVisible = '.d2l-loadmore-pager:visible';
var loadMoreClick = '.d2l-loadmore-pager';
var rowGuts = 'table[is="d2l-table"] > tbody > tr';

//prompt messages for the user
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
    //filtering drawers
    var drawers = [{
            name: "not-campus",
            search: /Campus/i,
            invertMatch: true
    }, {
            name: "online",
            search: /Online\.2017/i

    }, {
            name: "reference",
            search: /Online\.Reference/i

    }, {
            name: "campus",
            search: /Campus/i
        }
        , {
            name: "templates",
            search: /Web%20Files/i

    }, {
            name: "calendar",
            search: /\/calendar\//

    }, {
            name: "sso",
            search: /SSO/

    }];

    //check if each individual link matches its search property and if it does, push it to its respective drawer.
    var sortedLinks = links.reduce(function (fileCabinet, link) {
        for (var i = 0; i < drawers.length; i++) {
            var isMatch = link.linkedFrom.match(drawers[i].search) !== null;
            /*will check if we want to keep that category at all*/
            if (drawers[i].invertMatch) {
                isMatch = !isMatch;
            }
            /*check the regex for search*/
            if (isMatch) {
                if (!fileCabinet[drawers[i].name]) {
                    fileCabinet[drawers[i].name] = [];
                }
                //add the link to it
                fileCabinet[drawers[i].name].push(link);
                //item found
                //no longer needed when 'other' drawer in fileCabinet, now it will duplicate wherever it matches which could be in two drawers
                //i = drawers.length;
            }
        }
        return fileCabinet;
    }, {});

    return sortedLinks;
}

function fixDate(dateString) {
    return dateString.replace(/\//g, '-')
}

//Go to the page with all the links. Sign in with user's creds and use the url to navigate to page with broken links

function startNightmare(nightmare) {
    nightmare
        .viewport(1000, 700)
        .goto('https://byui.brightspace.com/d2l/login?noredirect=true')
        //prompt the user for their own credentials
        .type(usersName, promptInfo.username)
        .type(usersPassword, promptInfo.password)
        .click(login)
        .wait(3000)
        .goto('https://byui.brightspace.com/d2l/brokenLinks/6606')
        //Wait for page to load
        .wait(1000)

        .evaluate(function (select, dropdownItem) {
            //changes the value on the date select tag to the option we want
            document.querySelector(select).selected = 'selected';
            //calls the onchange function for the select tag
            document.querySelector(dropdownItem).onchange();
            //        D2L.O("__g1", 47)();
        }, select, dropdownItem)
        .wait(1000)
        //take the input from the user and type it into a custom date range.
        .evaluate(function (dateInfo, startField, endField) {
            document.querySelector(startField).value = dateInfo.startDate;
            document.querySelector(endField).value = dateInfo.endDate;

        }, dateInfo, startField, endField)
        .type(endField, ' ')
        .wait(2000)
        //click the apply button
        .click(apply)
        //If the selector button called "Load more" exists, click it
        .evaluate(function (loadMoreVisible, loadMoreClick, callback) {
            function clickLoad() {
                if ($(loadMoreVisible).length) {
                    $(loadMoreClick).click()
                    setTimeout(clickLoad, 500)
                } else {
                    callback();
                }
            }
            clickLoad()
        }, loadMoreVisible, loadMoreClick)

        .then(function () {
            scrapePage(nightmare)
        }).catch(function (err) {
            console.error(err)
        })
}
//When it no longer exists, scrape the page of info
//take the table from the page and store it in an array
function scrapePage(nightmare) {
    nightmare
        .evaluate(function (rowGuts) {
            function removeSpaces(url) {
                return url.trim().replace(/ /g, "%20");
            }
            //create an array to store guts of the table
            var getItAll = [];

            //then scrape the information and push all of the objects to the array
            var entire = $(rowGuts).get();
            for (var i = 0; i < entire.length; i++) {
                var row = $(entire[i]).children().get();
                //add the base URL to the beginning of each of the items in the list
                var baseURL = window.location.origin; //'https://byui.brightspace.com', could also be used for pathway.

                getItAll.push({
                    'linkedFrom': removeSpaces(baseURL + $(row[1]).text().trim()),
                    'Clicks': $(row[2]).text().trim(),
                    'targetURL': removeSpaces(baseURL + $(row[3]).text().trim()),
                    'latestClick': $(row[4]).text().trim()
                });
            }

            return getItAll;

        }, rowGuts)
        //Save everything to a CSV
        .end()
        .then(function (getItAll) {
            //used to print test data://fs.writeFileSync('testData.json', JSON.stringify(getItAll, null, 4))
            //fileCabinet stores the data (an array)from the function sortData.
            var fileCabinet = sortData(getItAll),
                columns = ['linkedFrom', 'Clicks', 'targetURL', 'latestClick'],
                drawerName, fileName, brokenLinks;
            //makes a csv of all of the data unsorted    
            fileCabinet.all = getItAll;

            for (drawerName in fileCabinet) {
                //take a fileName and save the csv there
                fileName = 'brokenLinks_' + drawerName + '_' + fixDate(dateInfo.startDate) + '_' + fixDate(dateInfo.endDate);
                brokenLinks = (dsv.csvFormat(fileCabinet[drawerName], columns));
                fs.writeFileSync(fileName + '.csv', brokenLinks);
                csvToTable.fromArray(fileCabinet[drawerName], columns, false, true, fileName);
                console.log('Success! Check your local directory for the CSVs.');
            }

            //sorted data should be saved according to its category(online, campus, reference or other)

        }).catch(function (Error) {
            console.log('The error was: ', Error);
        })

}

var promptInfo = {};
var dateInfo = {};

prompt.start();


//retrieve username and password from the user
prompt.get(credentials, function (err, result) {
    if (err) {
        console.log(err);
    }

    promptInfo = {
        username: result.username,
        password: result.password
    }
    //should I try to use momentjs?
    if (result.endDate == "") {
        var today = new Date();
        var day = today.getDate();
        var month = today.getMonth() + 1;
        var year = today.getFullYear();


        var defaultDate = month + '/' + day + '/' + year;
        result.endDate = defaultDate;

    } else if (result.startDate == "") {
        //result.startDate == 'defaultDate'; is this what I want??
        return;
    }
    //if they look back and realize the date is incorrect, exit the program, else continue
    if (result.correctDate == 'N') {
        return;
    } else {
        dateInfo = {
            startDate: result.startDate,
            endDate: result.endDate,
            correctDate: result.correctDate
        }
        //login and begin nightmare
        console.log('Thanks, checking credentials...')
        startNightmare(nightmare)
    }

});
