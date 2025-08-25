# HomeWise Property Website 

### A Smart Property Discovery and Evaluation Platform.

**Group:** H16A-APPLE

**Authors:** _Cedric Castelino, Geoffrey Mok, Dennis Pulickal, Daiana Chen, Gabriel Zeitoun and Rishi Wig_

**Frontend Architecture:** ReactJS, Vite, DaisyUI, HTML and TailwindCSS

**Backend Architecture:** TS, Express and MongoDB

**External APIs:** Google and OpenAI

## Testing

### Frontend Testing

The frontend utilises cypress to complete extensive testing of several of the websites user processes

#### **Setting Up Frontend Tests:**

1. Change to the frontend directory
2. run <code>npm install</code>
3. run <code>npx cypress open</code>
4. A new window will open with the cypress testing module, follow the prompts
5. When met with a cypress welcome page and 2 options of E2E testing or Component Testing, click E2E Testing
6. Choose Google Chrome as the browser of operation
7. In a new frontend directory terminal, start the website by running the command <code>docker-compose up --build</code> **OR:**
    - Opening the backend directory in another terminal and running <code>npm install</code>, <code>npm run build</code> and <code>npm run start</code>
    - Then opening the frontend directory in another terminal and running <code>npm run dev</code>
8. Once the website is running return to the cypress module and click on any of the shown file names
9. To run all frontend tests consecutively, click on the <code>allTests.cy.js</code> file
10. Clicking on each file will run those specified tests, providing a visual display of the tests being run and showcasing the outcome of the tests.
11. Once the test is complete, click on the _Specs_ icon on the left side of the screen to return to the main page

#### **Test Coverage:**
 
> #### All tests have been commented extensively, outlining the specific cases being tested.
>
>> These tests can be found in the **folder:** _frontend/cypress/e2e_

- Tests the register function, including any errors in user input in <code>register.cy.js</code>
- Tests the login function, including any errors in user input in <code>login.cy.js</code>
- Tests the property search functionality, including paginated results in <code>searchpage.cy.js</code>
- Tests the bookmark functionality, including saving a note and removing a bookmark in <code>bookmark.cy.js</code>
- Tests the compare functionality, including replacing a compared property <code>compare.cy.js</code>
- Tests the suburb insights page, including functionality while logged in/logged out in <code>insights.cy.js</code>
- Tests the profile page, including functionality to edit account information, password and preferences in <code>profile.cy.js</code>

> To test all the files mentioned above consecutively, run the <code>allTests.cy.js</code> file

### Backend Testing

All backend functions, including routing and auxillary helpers, were extensively tested in the development of the application. These were tested in isolation, with multiple feasible edgecases created for handling possible events. Unfortunately, the full depth of unit testing was not possible due to the technical headwinds of integration with third-party systems such as Google & OpenAI APIs and MongoDB. However, the frontend testing through cypress ensures that a variety of backend functions perform according to expectations.
# HomeWise
