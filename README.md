# d2l-broken-links

## Description 
This program uses nightmare to open up a page in D2L that lists the broken links in D2L at BYU-Idaho. 
The user must have a valid cct, ol, or administrative account (username and password) to sign in to use this program. This is because the broken links page is only available to administrative accounts.

The user enters a date range that is entered into a custom date range field in d2l. The date range is applied and then the 'Load More' button is selected until it no longer exists.

The entire list found in D2L is then scraped and saved to a CSV file. The list is sorted based on online, campus, and reference courses.

## How to Install

Standard Install

1. Enter this command on the command line:
    ```bash
    npm install -g https://github.com/byuitechops/d2l-broken-links.git
    ```
1. To install dependancies, run:
    ```bash
    npm i
    ```
    Program depends on `nightmare.js`, `prompt`,  & `d3-dsv` modules, runs through `csv-to-table`.
    
## How to Use
Run the following command:
```bash
d2l-broken-links
```
The file will prompt for the following:
1. A cct, ol, or functional equivalent username and password for d2l
2. Beginning and ending date range for links you would like to view.


The "Linked From" title just means that the link that was broken was found on that specific page. The clicks is the number of clicks, the targetURL(to my understanding) is the broken link itself, and the Latest click is the most recent time that any one user clicked on the link.
