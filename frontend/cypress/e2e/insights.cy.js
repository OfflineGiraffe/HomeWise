// Comprehensively tests the suburb insights page for users
describe("Suburb insights functionality testing", () => {
  it("passes", () => {
    // Tests the insights page on a user that is not logged in
    cy.visit("http://localhost:5173/");
    cy.contains("HomeWise").should("exist");
    cy.contains("Suburb Insights").should("exist").click();
    cy.contains("Granville - 2142").should("not.exist");
    cy.contains("Granville Public School").should("not.exist");
    cy.wait(500);
    cy.get('input[placeholder="Suburb or Postcode..."]').type("gran");
    cy.contains("Granville (2142)").should("exist").click();
    cy.get("#insight_search_button").click();
    cy.wait(2000);

    // Checks that the data is shown
    cy.contains("Granville - 2142").should("exist");
    cy.contains("Granville Public School").should("exist");

    // Logs the user into the test account
    cy.contains("Login").should("exist").click();
    cy.get('input[placeholder="Email"]').type("test@gmail.com");
    cy.get('input[placeholder="Password"]').type("Abcd1234_");
    cy.contains("button", "Login").should("exist").click();

    // Navigates to the insights page
    cy.contains("Suburb Insights").should("exist").click();
    cy.wait(500);

    // Checks that the data is pre-filled for logged in user
    cy.contains("Granville - 2142").should("exist");
    cy.contains("Granville Public School").should("exist");

    // Searchs a different suburb
    cy.get('input[placeholder="Suburb or Postcode..."]').type("blackto");
    cy.contains("Blacktown (2148)").should("exist").click();
    cy.get("#insight_search_button").click();
    cy.wait(2000);

    // Checks that different data is shown
    cy.contains("Blacktown - 2148").should("exist");
    cy.contains("Blacktown Boys High School").should("exist");
  });
});
