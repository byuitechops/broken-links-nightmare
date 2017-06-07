# broken-links-nightmare
This program uses nightmare to open up a page in D2L that lists the broken links in D2L at BYU-Idaho. 

The entire list found in D2L is then scraped and saved to a CSV file.
## Instructions
In order to use this file, run the 'linkpagescrape.js' file from the command line using `node linkpagescrape.js`. The file will not run without a `credentials.json` file with an empty object containing a username (of ol, cct or a functional equivalent administrative capacity) and a corresponding password. 
Program also depends on `nightmare.js` & `d3-dsv` modules.
