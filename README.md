# d2l-broken-links
This program uses nightmare to open up a page in D2L that lists the broken links in D2L at BYU-Idaho. 

The user enters a date range that is entered into a custom date range field in d2l. The date range is applied and then the 'Load More' button is selected until it no longer exists.

The entire list found in D2L is then scraped and saved to a CSV file. The list is sorted based on online, campus, and reference courses.
## Instructions
To install this program, copy the following:`npm install -g https://github.com/byuitechops/d2l-broken-links.git`. Copy this into your command line to install the program. 

In order to use this file, run the file from the command line by typing `d2l-broken-links`. The file will prompt for the following:
1. A cct, ol, or functional equivalent username and password for d2l
2. Beginning and ending date range for links you would like to view.

## General Information
The purpose of this program is to get a report of broken links that are listed in d2l. 
The user must have a valid cct, ol, or administrative account (username and password) to sign in to use this program. This is because the broken links page is only available to administrative accounts.

The "Linked From" title just means that the link that was broken was found on that specific page. The clicks is the number of clicks, the targetURL(to my understanding) is the broken link itself, and the Latest click is the most recent time that any one user clicked on the link.

Program depends on `nightmare.js`, `prompt`,  & `d3-dsv` modules, runs through `csv-to-table`.
