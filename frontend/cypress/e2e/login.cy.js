// Comprehensively tests the login process for users
describe("Login functionality testing", () => {
  it("passes", () => {
    // Use a unique email so the test can run repeatedly
    const uniqueEmail = `test@gmail.com`;
    const goodPassword = "Abcd1234_";

    // Navigate to Register
    cy.visit("http://localhost:5173/");
    cy.contains("HomeWise").should("exist");
    cy.contains("Login").should("exist").click();

    // no email & no password
    cy.get('input[placeholder="Email"]').clear({ force: true });
    cy.get('input[placeholder="Password"]').clear({ force: true });
    cy.get('button[type="submit"], button:contains("Login")')
      .should("exist")
      .click();
    cy.contains("Email cannot be empty").should("be.visible");

    // Negative case: Email & wrong password
    cy.get('input[placeholder="Email"]')
      .clear({ force: true })
      .type(uniqueEmail);
    cy.get('input[placeholder="Password"]').clear({ force: true }).type(" ");
    cy.get('button[type="submit"], button:contains("Login")')
      .should("exist")
      .click();
    cy.contains("Incorrect email/password.").should("be.visible");

    // Email & no password
    cy.get('input[placeholder="Email"]')
      .clear({ force: true })
      .type(uniqueEmail);
    cy.get('input[placeholder="Password"]').clear({ force: true });
    cy.get('button[type="submit"], button:contains("Login")')
      .should("exist")
      .click();
    cy.contains("Password cannot be empty").should("be.visible");

    // only password, missing email
    cy.get('input[placeholder="Email"]').clear({ force: true });
    cy.get('input[placeholder="Password"]').invoke("val", goodPassword);
    cy.get('button[type="submit"], button:contains("Login")').click();
    cy.contains("Email cannot be empty").should("be.visible");

    // invalid email + wrong password
    cy.get('input[placeholder="Email"]')
      .clear({ force: true })
      .type("john.smith@");
    cy.get('input[placeholder="Password"]')
      .clear({ force: true })
      .type("randomPassword");
    cy.get('button[type="submit"], button:contains("Login")').click();
    // This replaces the broken `cy.contains('')...`
    cy.contains("Invalid email entered").should("be.visible");

    // log in correctly
    cy.get('input[placeholder="Email"]')
      .clear({ force: true })
      .type(uniqueEmail);
    cy.get('input[placeholder="Password"]')
      .clear({ force: true })
      .type(goodPassword);
    cy.get('button[type="submit"], button:contains("Login")').click();
    cy.contains("HomeWise").should("exist");

    cy.contains("HomeWise").should("exist");
    cy.url().should("include", "/dashboard");
  });
});
