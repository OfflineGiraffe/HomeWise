// Comprehensively tests the profile page for users
describe("Profile functionality testing", () => {
  it("passes", () => {
    // Logs the user into the test account
    cy.visit("http://localhost:5173/");
    cy.contains("HomeWise").should("exist");
    cy.contains("Login").should("exist").click();
    cy.get('input[placeholder="Email"]').type("test@gmail.com");
    cy.get('input[placeholder="Password"]').type("Abcd1234_");
    cy.contains("button", "Login").should("exist").click();

    // Navigate to the profile page
    cy.get('a[href="/profile"] svg').click();
    cy.wait(1500);
    cy.contains("Test Profile").should("exist");

    // Edit Account Information Testing

    // Test no password inputted
    cy.contains("button", "Edit Account Info").should("exist").click();
    cy.contains("button", "Confirm").should("exist").click();
    cy.contains("Input fields cannot be empty").should("exist");

    // Test wrong password inputted
    cy.get('input[placeholder="Confirm Password"]').type("Abcd1234");
    cy.contains("button", "Confirm").should("exist").click();
    cy.contains("Incorrect Password Entered").should("exist");

    // Test changing the users first and last name
    cy.get('input[placeholder="Confirm Password"]').clear();
    cy.get('input[placeholder="Confirm Password"]').type("Abcd1234_");
    cy.get('input[placeholder="First Name"]').clear();
    cy.get('input[placeholder="First Name"]').type("Jack");
    cy.get('input[placeholder="Last Name"]').clear();
    cy.get('input[placeholder="Last Name"]').type("Smith");
    cy.contains("button", "Confirm").should("exist").click();
    cy.contains("Jack Smith").should("exist");

    // Reset the account name
    cy.contains("button", "Edit Account Info").should("exist").click();
    cy.get('input[placeholder="Confirm Password"]').type("Abcd1234_");
    cy.get('input[placeholder="First Name"]').clear();
    cy.get('input[placeholder="First Name"]').type("Test");
    cy.get('input[placeholder="Last Name"]').clear();
    cy.get('input[placeholder="Last Name"]').type("Profile");
    cy.contains("button", "Confirm").should("exist").click();

    // Test invalid email change
    cy.contains("button", "Edit Account Info").should("exist").click();
    cy.get('input[placeholder="Confirm Password"]').type("Abcd1234_");
    cy.get('input[placeholder="Email"]').clear();
    cy.get('input[placeholder="Email"]').type("jack");
    cy.contains("button", "Confirm").should("exist").click();
    cy.contains("Invalid email entered").should("exist");

    // Test email change
    cy.get('input[placeholder="Email"]').clear();
    cy.get('input[placeholder="Email"]').type("jack.test@gmail.com");
    cy.contains("button", "Confirm").should("exist").click();
    cy.get("#logout_user").click();

    // Login with new email
    cy.contains("Login").should("exist").click();
    cy.get('input[placeholder="Email"]').type("jack.test@gmail.com");
    cy.get('input[placeholder="Password"]').type("Abcd1234_");
    cy.contains("button", "Login").should("exist").click();

    // Reset the email on test account
    cy.get('a[href="/profile"] svg').click();
    cy.wait(1500);
    cy.contains("button", "Edit Account Info").should("exist").click();
    cy.get('input[placeholder="Confirm Password"]').type("Abcd1234_");
    cy.get('input[placeholder="Email"]').clear();
    cy.get('input[placeholder="Email"]').type("test@gmail.com");
    cy.contains("button", "Confirm").should("exist").click();

    // Edit Account Password Testing

    // Test wrong current password
    cy.contains("button", "Edit Account Info").should("exist").click();
    cy.contains("Change Password").should("exist").click();
    cy.get('input[placeholder="Current Password"]').type("Abcd1234");
    cy.get('input[placeholder="New Password"]').type("Test1234_");
    cy.get('input[placeholder="Confirm New Password"]').type("Test1234_");
    cy.get("#change_password_confirm").click();
    cy.contains("Incorrect Current Password Entered").should("exist");

    // Test invalid new password
    cy.get('input[placeholder="Current Password"]').clear();
    cy.get('input[placeholder="Current Password"]').type("Abcd1234_");
    cy.get('input[placeholder="Confirm New Password"]').type("_");
    cy.get("#change_password_confirm").click();
    cy.contains("Passwords must match").should("exist");

    // Change user password
    cy.get('input[placeholder="Confirm New Password"]').clear();
    cy.get('input[placeholder="Confirm New Password"]').type("Test1234_");
    cy.get("#change_password_confirm").click();

    // Login with new password
    cy.get("#logout_user").click();
    cy.contains("Login").should("exist").click();
    cy.get('input[placeholder="Email"]').type("test@gmail.com");
    cy.get('input[placeholder="Password"]').type("Test1234_");
    cy.contains("button", "Login").should("exist").click();

    // Reset the password on test account
    cy.get('a[href="/profile"] svg').click();
    cy.wait(1500);
    cy.contains("button", "Edit Account Info").should("exist").click();
    cy.contains("Change Password").should("exist").click();
    cy.get('input[placeholder="Current Password"]').type("Test1234_");
    cy.get('input[placeholder="New Password"]').type("Abcd1234_");
    cy.get('input[placeholder="Confirm New Password"]').type("Abcd1234_");
    cy.get("#change_password_confirm").click();

    // Edit Account Preferences Testing

    // Test invalid suburb
    cy.contains("button", "Edit Preferences").should("exist").click();
    cy.get('input[placeholder="Select Suburb"]').clear();
    cy.get('input[placeholder="Select Suburb"]').type("Gran");
    cy.get("#change_preferences_confirm").click();
    cy.contains("Invalid suburb selected").should("exist");
    cy.get('input[placeholder="Select Suburb"]').clear();
    cy.get('input[placeholder="Select Suburb"]').type("Blacktow");
    cy.contains("Blacktown (2148)").should("exist").click();

    // Test invalid price range
    cy.get('input[placeholder="Lowest"]').clear();
    cy.get('input[placeholder="Lowest"]').type("3000000");
    cy.get("#change_preferences_confirm").click();
    cy.contains("Invalid price range").should("exist");

    // Test changing user preferences
    cy.get('input[placeholder="Lowest"]').clear();
    cy.get('input[placeholder="Lowest"]').type("1000000");
    cy.get("#change_preferences_confirm").click();
    cy.contains("Blacktown").should("exist");
    cy.contains("$1M").should("exist");

    // Reset the preferences on test account
    cy.contains("button", "Edit Preferences").should("exist").click();
    cy.get('input[placeholder="Select Suburb"]').clear();
    cy.get('input[placeholder="Select Suburb"]').type("Granvil");
    cy.contains("Granville (2142)").should("exist").click();
    cy.get('input[placeholder="Lowest"]').clear();
    cy.get('input[placeholder="Lowest"]').type("500000");
    cy.get("#change_preferences_confirm").click();
  });
});
