#! /usr/bin/env node

/*eslint-env node*/
/*eslint no-console:0*/
/*global $, document, window*/

//constants to change
var beginSemester = '9/11/17'

//required files and modules
var Nightmare = require('nightmare');
var nightmare = new Nightmare({
    show: true,
    alwaysOnTop: false
});
var moment = require('moment')
var csvToTable = require('csv-to-table')
var dsv = require('d3-dsv')
var fs = require('fs')
var prompt = require('prompt')

//selectors for the nightmare thing to happen
var selectors = {
    usersName: '#userName',
    usersPassword: '#password',
    login: '.d2l-button',
    dropdown: '[name="predefinedDates"] option:nth-child(3)',
    dropdownItem: '[name="predefinedDates"]',
    startField: '#startDate',
    endField: '#endDate',
    apply: '#optionsForm > div:nth-of-type(1) button',
    loadMoreVisible: '.d2l-loadmore-pager:visible',
    loadMoreClick: '.d2l-loadmore-pager',
    rowGuts: 'table[is="d2l-table"] > tbody > tr'
}

//prompt messages for the user
var credentials = [
    {
        name: 'username',
        description: 'Please enter your username',
        required: true,
        message: "I need a username to login with. try again."
    },
    {
        name: 'password',
        description: 'Please enter your password',
        hidden: true,
        replace: '*',
        required: true
    },
    {
        name: 'startDate',
        description: 'Start date for the date range, m/d/yy',
        default: moment(beginSemester, "MM/DD/YY").format("M/D/YY")
    },
    {
        name: 'endDate',
        description: 'End date for the date range,  m/d/yy',
        default: moment().format("M/D/YY")
    }
];

function sortData(links, promptInfo) {
    //filtering drawers
    var startDateYear = promptInfo.startDate.get('year').toString()
    var drawers = [{
            name: "not-campus",
            search: /Campus/i,
            invertMatch: true
    }, {
            name: "online" + startDateYear,
            //add the year abstractly through a variable created by promptInfo
            search: new RegExp('Online\.' + startDateYear, 'i')

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

//Go to the page with all the links. Sign in with user's creds and use the url to navigate to page with broken links

function startNightmare(nightmare, promptInfo, selectors) {
    nightmare
        .viewport(1000, 700)
        .goto('https://byui.brightspace.com/d2l/login?noredirect=true')
        //prompt the user for their own credentials
        .type(selectors.usersName, promptInfo.username)
        .type(selectors.usersPassword, promptInfo.password)
        .click(selectors.login)
        .wait(3000)
        .goto('https://byui.brightspace.com/d2l/brokenLinks/6606')
        //Wait for page to load
        .wait(1000)

        .evaluate(function (selectors) {
            //changes the value on the date select tag to the option we want
            document.querySelector(selectors.dropdown).selected = 'selected';
            //calls the onchange function for the select tag
            document.querySelector(selectors.dropdownItem).onchange();
            //        D2L.O("__g1", 47)();
        }, selectors)
        .wait(1000)
        //take the input from the user and type it into a custom date range.
        .evaluate(function (startDate, endDate, selectors) {
            document.querySelector(selectors.startField).value = startDate;
            document.querySelector(selectors.endField).value = endDate;

        }, promptInfo.startDate.format('M/D/YYYY'), promptInfo.endDate.format('M/D/YYYY'), selectors)
        .type(selectors.endField, ' ')
        .wait(2000)
        //click the apply button
        .click(selectors.apply)
        //If the selector button called "Load more" exists, click it
        .evaluate(function (selectors, callback) {
            function clickLoad() {
                if ($(selectors.loadMoreVisible).length) {
                    $(selectors.loadMoreClick).click()
                    setTimeout(clickLoad, 500)
                } else {
                    callback();
                }
            }
            clickLoad()
        }, selectors)

        .then(function () {
            scrapePage(nightmare, promptInfo)
        }).catch(function (err) {
            console.error(err)
        })
}
//When it no longer exists, scrape the page of info
function scrapePage(nightmare, promptInfo) {
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
            var fileCabinet = sortData(getItAll, promptInfo),
                columns = ['linkedFrom', 'Clicks', 'targetURL', 'latestClick'],
                drawerName, fileName, brokenLinks;
            //makes a csv of all of the data unsorted    
            fileCabinet.all = getItAll;

            for (drawerName in fileCabinet) {
                //take a fileName and save the csv there
                fileName = 'brokenLinks_' + drawerName + '_' + promptInfo.startDate.format("MM-DD-YYYY") + '_' + promptInfo.endDate.format("MM-DD-YYYY");
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


//retrieve username and password from the user
prompt.get(credentials, function (err, result) {
    if (err) {
        console.log(err);
        return;
    }

    //check if user input dates are valid dates 
    result.startDate = moment(result.startDate, "M-D-YY");
    result.endDate = moment(result.endDate, "M-D-YY");
    result.datesAreValid = result.startDate.isValid() && result.startDate.isValid();

    //if date is invalid, exit the program, else continue

    if (result.datesAreValid) {
        //login and begin nightmare
        console.log('Signing in...')
        startNightmare(nightmare, result, selectors)
    } else {
        console.log('\nOne or both of your dates did not folow the format "M/D/YY"')
        return;
    }

});

//run prompt
prompt.start();
