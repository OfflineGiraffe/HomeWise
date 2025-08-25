// Comprehensively tests the register process for new users
describe("register functionality testing", () => {
  it("passes", () => {
    // Navigate to register
    cy.visit("http://localhost:5173/");
    cy.contains("HomeWise").should("exist");
    cy.contains("Login").should("exist").click();
    cy.contains("Register").should("exist").click();

    // Test empty inputs on first page
    cy.contains("Next Page").should("exist").click();
    cy.contains("Input fields cannot be empty").should("exist");
    cy.get('input[placeholder="Last Name"]').type("Smith");
    cy.get('input[placeholder="Email"]').type("john.smith@gmail.com");
    cy.get('input[placeholder="Password"]').type("Abcd1234_");
    cy.get('input[placeholder="Confirm Password"]').type("Abcd1234_");
    cy.contains("Next Page").should("exist").click();

    // Test first name cannot have numbers
    cy.get('input[placeholder="First Name"]').type("Jack34");
    cy.contains("Next Page").should("exist").click();
    cy.contains("Name must contain only letters").should("exist");
    cy.get('input[placeholder="First Name"]').clear();
    cy.get('input[placeholder="First Name"]').type("Jack");

    // Test first name cannot have numbers
    cy.get('input[placeholder="Last Name"]').clear();
    cy.get('input[placeholder="Last Name"]').type("Smith34");
    cy.contains("Next Page").should("exist").click();
    cy.contains("Name must contain only letters").should("exist");
    cy.get('input[placeholder="Last Name"]').clear();
    cy.get('input[placeholder="Last Name"]').type("Smith");

    // Test email validity
    cy.get('input[placeholder="Email"]').clear();
    cy.get('input[placeholder="Email"]').type("jack");
    cy.contains("Next Page").should("exist").click();
    cy.contains("Invalid email entered").should("exist");
    cy.get('input[placeholder="Email"]').clear();
    cy.get('input[placeholder="Email"]').type("john.smith@gmail.com");

    // Test password length
    cy.get('input[placeholder="Password"]').clear();
    cy.get('input[placeholder="Password"]').type("abc");
    cy.get('input[placeholder="Confirm Password"]').clear();
    cy.get('input[placeholder="Confirm Password"]').type("abc");
    cy.contains("Next Page").should("exist").click();
    cy.contains("Invalid Password").should("exist");

    // Test password matching error checks
    cy.get('input[placeholder="Password"]').clear();
    cy.get('input[placeholder="Password"]').type("Abcd1234_");
    cy.get('input[placeholder="Confirm Password"]').clear();
    cy.get('input[placeholder="Confirm Password"]').type("Abcd1234");
    cy.contains("Next Page").should("exist").click();
    cy.contains("Passwords must match").should("exist");
    cy.get('input[placeholder="Confirm Password"]').clear();
    cy.get('input[placeholder="Confirm Password"]').type("Abcd1234_");
    cy.contains("Next Page").should("exist").click();

    // Register second page

    // Tests invalid suburb input
    cy.get('input[placeholder="Select Suburb"]').type("gran");
    cy.contains("button", "Register").should("exist").click();
    cy.get('input[placeholder="Lowest"]').type("1000000");
    cy.get('input[placeholder="Highest"]').type("2000000");
    cy.contains("button", "Register").should("exist").click();
    cy.contains("Invalid suburb selected").should("exist");
    cy.get('input[placeholder="Select Suburb"]').clear();
    cy.get('input[placeholder="Select Suburb"]').type("gran");
    cy.contains("Granville (2142)").should("exist").click();

    // Test price range error checks
    cy.get('input[placeholder="Highest"]').clear();
    cy.get('input[placeholder="Highest"]').type("900000");
    cy.contains("button", "Register").should("exist").click();
    cy.contains("Invalid price range").should("exist");
    cy.get('input[placeholder="Highest"]').clear();
    cy.get('input[placeholder="Highest"]').type("2000000");
    cy.contains("button", "Register").should("exist").click();
    cy.contains("HomeWise").should("exist");
    cy.url().should("include", "/dashboard");

    // Test user is logged in
    cy.get('a[href="/profile"] svg').click();

    // Deletes user account after test
    cy.contains("Delete Account").should("exist").click();
    cy.get("#delete_account_confirm").click();
    cy.contains("HomeWise").should("exist");
    cy.url().should("include", "/dashboard");
  });
});
