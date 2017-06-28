# broken-links-nightmare
This program uses nightmare to open up a page in D2L that lists the broken links in D2L at BYU-Idaho. 

The user enters a date range that is entered into a custom date range field in d2l. The date range is applied and then the 'Load More' button is selected until it no longer exists.

The entire list found in D2L is then scraped and saved to a CSV file. The list is sorted based on online, campus, and reference courses.
## Instructions
To install this program, copy the following:`npm install -g https://github.com/byuitechops/broken-links-nightmare.git`. Type this into your command line to install the program. 
In order to use this file, run the 'linkpagescrape.js' file from the command line using `node linkpagescrape`. The file will prompt for the following:
1. A cct, ol, or functional equivalent username and password for d2l
2. Beginning and ending date range for links you would like to view.
3. Keep in mind that the start date is required, and if you do not enter a start date, the program will give you the option to restart later on, or you can just restart it yourself. The end date is  optional with a default of today's date. If you don't type the dates in the correct format the program you'll have the option to start over, which will require you to run the command again.

## General Information
The purpose of this program is to get a report of broken links that are listed in d2l. The objective is to have the links available to fix, and later delete from the `https://byui.brightspace.com/d2l/brokenLinks/6606` page, so that the numbers there are valid representations.
The user must have a valid cct, ol, or administrative account (username and password) to sign in to use this program. This is because the broken links page is only available to administrative accounts.
With the csv-to-table library now in place, the csv's that are saved now are also transferred onto an HTML page that will save in the user's directory. Once this page is open, the user can decide which tables he or she would like to view. In the "Linked From" and a "Target URL" columns, most of the links on this page are clickable.

Program depends on `nightmare.js`, `prompt`, `yargs` & `d3-dsv` modules, but should be able to run on any machine if the package.json is updated.
