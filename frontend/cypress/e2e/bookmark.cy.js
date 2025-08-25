// Comprehensively tests the bookmark process for users
describe("Bookmark functionality testing", () => {
  it("passes", () => {
    // Logs the user into the test account
    cy.visit("http://localhost:5173/");
    cy.contains("HomeWise").should("exist");
    cy.contains("Login").should("exist").click();
    cy.get('input[placeholder="Email"]').type("test@gmail.com");
    cy.get('input[placeholder="Password"]').type("Abcd1234_");
    cy.contains("button", "Login").should("exist").click();

    // Bookmarks one property
    cy.get("#recommended_bookmark_icon").click();
    cy.contains("Saved Properties").should("exist").click();
    cy.contains("$").should("exist");

    // Clears the property note
    cy.get("#saved_note_icon").click();
    cy.contains("button", "Edit").should("exist").click();
    cy.get("textarea").clear();
    cy.contains("button", "Save").should("exist").click();
    cy.get("#note_close_button").click();
    cy.wait(1000);

    // Test editing but not saving
    cy.get("#saved_note_icon").click();
    cy.contains("button", "Edit").should("exist").click();
    cy.get("textarea").type("Example note");
    cy.get("#note_close_button").click();
    cy.get("#saved_note_icon").click();
    cy.contains("Example note").should("not.exist");
    cy.get("#note_close_button").click();

    // Test editing and saving
    cy.get("#saved_note_icon").click();
    cy.contains("button", "Edit").should("exist").click();
    cy.get("textarea").type("Example note");
    cy.contains("button", "Save").should("exist").click();
    cy.get("#note_close_button").click();
    cy.wait(1000);
    cy.get("#saved_note_icon").click();
    cy.contains("Example note").should("exist");
    cy.get("#note_close_button").click();

    // Remove bookmarked property
    cy.contains("button", "Remove").should("exist").click();
    cy.get("#saved_delete_confim").click();
    cy.contains("No Properties Saved").should("exist");
  });
});
