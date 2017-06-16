# broken-links-nightmare
This program uses nightmare to open up a page in D2L that lists the broken links in D2L at BYU-Idaho. 

The user enters a date range that is entered into a custom date range field in d2l. The date range is applied and then the 'Load More' button is selected until it no longer exists.

The entire list found in D2L is then scraped and saved to a CSV file.
{Coming soon: list will be sorted based on campus and online courses.}
## Instructions
To install this program, copy the command on this line to clone the repository by typing `git clone https://github.com/byuitechops/broken-links-nightmare.git` and after it is done cloning type `npm install` to install the program. 
In order to use this file, run the 'linkpagescrape.js' file from the command line using `node linkpagescrape`. The file will prompt for the following:
1. A cct, ol, or functional equivalent username and password for d2l
2. Beginning and ending date range for links you would like to view.
3. Keep in mind that the start date is required, and if you do not enter a start date, the program will restart. The end date is  optional with a default of today's date. If you don't type the dates in the correct format the program you'll have the option to start over.
  
Program depends on `nightmare.js`, `prompt` & `d3-dsv` modules, but should be able to run on any machine.
