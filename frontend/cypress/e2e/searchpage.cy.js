// Comprehensively tests the property search functionality for users
describe("Search Page functionality testing", () => {
  it("passes", () => {
    const uniqueEmail = `test@gmail.com`;
    const goodPassword = "Abcd1234_";

    // Logs the user into the test account
    cy.visit("http://localhost:5173/");
    cy.contains("HomeWise").should("exist");
    cy.contains("Login").should("exist").click();
    cy.get('input[placeholder="Email"]').type(uniqueEmail);
    cy.get('input[placeholder="Password"]').type(goodPassword);
    cy.contains("button", "Login").should("exist").click();

    // Search for the most expensive property in granville
    cy.get("#search_bar").clear().type("Granville");
    cy.contains("Search").click();
    cy.contains("Sort").click();
    cy.contains("Sort Listings").should("be.visible");
    cy.get("select").select("Price: Highest to Lowest");
    cy.contains("Apply").click();
    cy.contains("$1,466,135").should("exist");

    // Check pagination
    cy.get("#next").click();
    cy.get("#previous").click();

    // Filter results to exclude previous largest property
    cy.contains("Filters").click();
    cy.get('label:contains("Min")')
      .first()
      .parent()
      .find("select")
      .select("$300k");
    cy.get('label:contains("Max")')
      .first()
      .parent()
      .find("select")
      .select("$800k");
    cy.contains("Apply").click();

    // Sort by price ascending
    cy.contains("Sort").click();
    cy.contains("Sort Listings").should("be.visible");
    cy.get("select").select("Price: Highest to Lowest");
    cy.contains("Apply").click();

    // Check if the old largest still shows
    cy.contains("$1,466,135").should("not.exist");
  });
});
