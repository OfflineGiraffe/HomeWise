// Comprehensively tests the bookmark process for users
describe("Compare functionality testing", () => {
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

    // Compare one property
    cy.contains(".card", "151 South Street")
      .find("#recommended_compare_icon")
      .click();
    cy.contains("Compare").should("exist").click();
    cy.contains("151 South Street, Granville").should("exist");
    cy.contains("Click a compare icon to add another property.").should(
      "exist",
    );

    // go back to dashboard
    cy.contains("Dashboard").click();

    // compare another property
    cy.contains(".card", "61 William Street")
      .find("#recommended_compare_icon")
      .click();
    cy.contains("Compare").should("exist").click();
    cy.contains("61 William Street, Granville").should("exist");

    // go back to dashbaord
    cy.contains("Dashboard").click();

    // compare and replace another property
    cy.contains(".card", "162 South Street")
      .find("#recommended_compare_icon")
      .click();
    cy.get(".fixed.inset-0").find("button#replacement_id").first().click();

    cy.contains("Compare").should("exist").click();
    cy.contains("162 South Street").should("exist");

    // remove both properties
    cy.contains("Remove").click();
    cy.contains("Remove").click();

    cy.contains("Click a compare icon to add another property").should("exist");
    cy.contains("Click a compare icon to add a property.").should("exist");
  });
});
