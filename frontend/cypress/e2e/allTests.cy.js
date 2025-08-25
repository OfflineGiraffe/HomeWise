// Comprehensively tests the HomeWise
describe("runs all frontend tests", () => {
  it("Register passes", () => {
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

  it("Login passes", () => {
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

  it("Search page passes", () => {
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

  it("Bookmark passes", () => {
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

  it("Compare passes", () => {
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

  it("Insights passes", () => {
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

  it("Profile passes", () => {
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
