/**
 * Central locator store. Single nested `Selectors` const, per-feature groups.
 * Locator strings — Playwright's `page.locator()` auto-detects role/CSS/XPath/text.
 * Dynamic locators expose arrow-function factories (`xyz: (arg: string) => '…'`).
 */
export const Selectors = {
  /*** Sign-in Selectors ***/
  signIn: {
    emailInput: 'role=textbox[name="Email"]',
    // Find the password input via the visibility-toggle's sibling structure so the
    // locator survives the toggle flipping `type` between password/text.
    passwordInput: '//button[contains(@class,"mantine-PasswordInput-visibilityToggle")]/ancestor::*[contains(@class,"mantine-PasswordInput-root")]//input',
    submitButton: 'form button[type="submit"]',
    passwordToggle: '.mantine-PasswordInput-visibilityToggle',

    forgotPasswordLink: 'role=link[name="Forgot password?"]',
    signUpLink: '//p[contains(normalize-space(.),"Don\'t have an account")]//a[normalize-space()="Sign up"]',
    continueWithEmailLink: 'role=link[name="Continue with Email"]',
    continueWithGoogleButton: 'role=button[name="Continue with Google"]',

    invalidEmailError: 'text=Invalid email',
    // App returns either the credential error or the per-IP rate-limit notice —
    // both prove the user is NOT signed in. text= engine lands on smallest match.
    loginRejectedError: 'text=/Invalid email or password|Too many requests/',
    welcomeMessage: 'text=Welcome to Demo SaaS',
  },

  /*** Create-organization page (post-sign-in onboarding) ***/
  createOrganization: {
    nameInput: 'role=textbox[name="Name"]',
    importExampleTicketsCheckbox: 'role=checkbox[name="Import example tickets"]',
    createButton: 'role=button[name="Create"]',
    nameMinLengthError: 'text=String must contain at least 3 character(s)',
    successToast: 'text=/Successfully created /',
    openDashboardButton: 'role=link[name="Open dashboard"]',
  },

  /*** Tickets list dashboard (/<slug>/tickets) ***/
  ticketsList: {
    // Stable data-testids exposed by the app for tests.
    searchInput: '[data-testid="ticket-name-search"]',
    statusFilter: '[data-testid="ticket-status-select"]',
    statusBadgeAny: '[data-testid="ticket-status"]',
    newTicketLink: 'role=link[name="New"]',
    headerActiveTab: 'header [role="tab"][aria-selected="true"]',
    adminRoleLabel: 'main >> text=Admin',
    // The "Tickets" / "Settings" header tabs (Mantine tab role) — scoped to
    // the document-level header so they don't collide with the sidebar's
    // "Tickets" NavLink which has no role=tab.
    headerTicketsTab: 'header [role="tab"]:has-text("Tickets")',
    headerSettingsTab: 'header [role="tab"]:has-text("Settings")',
    // Sidebar NavLinks (rendered as Mantine NavLink anchors).
    sideNavTickets: 'nav .mantine-NavLink-body:has-text("Tickets")',
    sideNavOrganizationSettings: 'nav .mantine-NavLink-body:has-text("Organization settings")',
    sideNavManageAccount: 'nav .mantine-NavLink-body:has-text("Manage account")',
    sideNavSignOut: 'nav .mantine-NavLink-body:has-text("Sign out")',
    // The title paragraph itself has cursor:pointer and opens the detail
    // dialog when clicked — Playwright clicks dispatch via the parent row.
    ticketRowByTitle: (title: string) =>
      `//main//p[normalize-space()=${cssQuote(title)}]`,
    // Status badge in a ticket row (also used inside the detail dialog).
    ticketRowStatusByText: (status: string) =>
      `[data-testid="ticket-status"]:has-text("${status}")`,
    // Status options rendered in the Mantine Select popdown above the table.
    // The Select renders them inside the page (not in a portal listbox), so
    // anchor by visible parent.
    statusFilterOption: (value: string) =>
      `.mantine-Select-option:has-text("${value}")`,
  },

  /*** Ticket detail (modal opened by row click, or page at /tickets/<id>) ***/
  ticketDetail: {
    // Generic role anchors used by the open/close + status-menu flows.
    dialog: 'role=dialog',
    dialogCss: '[role="dialog"]',
    statusListbox: 'role=listbox',
    // Mantine Combobox primitive used by the dialog's status select; the page
    // status filter uses Mantine Select so options live under different
    // class names. Scope to Combobox to dodge the offscreen Select options.
    comboboxOption: '.mantine-Combobox-option',
    comboboxOptionByText: (value: string) =>
      `.mantine-Combobox-option:has-text("${value}")`,
    addCommentTextbox: '[role="dialog"] >> role=textbox[name="Add a comment..."]',
    // Mantine Select renders as a <button> styled like an input, inside the
    // dialog header. Status text is the button's textContent (e.g. "In Progress").
    statusButton: '[role="dialog"] button.mantine-Input-input',
    // The dialog's status options are nested under a role=listbox; the main
    // page also has a "loose" set of Select options always in the DOM, so
    // scope to listbox to avoid the offscreen duplicates.
    statusOptionByValue: (value: string) =>
      `[role="listbox"] [role="option"]:has-text("${value}")`,
    // The body description is rendered as a textarea (read-only-ish).
    descriptionTextbox: '[role="dialog"] textarea',
    idLabel: '[role="dialog"] >> text=/^ID: /',
    // Could be <input> or <textarea> — match either by role.
    addCommentInput: '[role="dialog"] >> role=textbox[name="Add a comment..."]',
    sendCommentButton: '[role="dialog"] button:has-text("Send")',
    // The dialog has exactly one ActionIcon — the close (X) at the top-right.
    closeDialogButton: '[role="dialog"] button.mantine-ActionIcon-root',
    titleByText: (title: string) =>
      `//*[@role="dialog"]//p[normalize-space()=${cssQuote(title)}]`,
    reportedByText: '[role="dialog"] >> text=/Reported by/',
    createdText: '[role="dialog"] >> text=/^Created/',
    // `text=` matches partial strings, so "Comments" would also catch
    // "No comments yet"; use exact-match.
    commentsHeading: '[role="dialog"] >> text="Comments"',
    noCommentsState: '[role="dialog"] >> text=No comments yet',
  },

  /*** New-ticket form (/<slug>/tickets/new) — anonymous customer surface ***/
  newTicket: {
    reportedByInput: 'role=textbox[name="Reported by (email)"]',
    yourNameInput: 'role=textbox[name="Your name"]',
    titleInput: 'role=textbox[name="Title"]',
    descriptionInput: 'role=textbox[name="Description"]',
    submitButton: 'role=button[name="Submit"]',
    pageHeading: 'text=Submit new ticket',
    invalidEmailError: 'text=Invalid email',
    requiredLengthError: 'text=String must contain at least 1 character(s)',
    successToast: 'text=Successfully created new ticket',
    detailIdLabel: 'text=/^ID: /',
  },

  /*** Organization settings (/<slug>/settings) ***/
  organizationSettings: {
    pageHeading: 'text=Organization members',
    addMemberButton: 'role=button[name="Add member"]',
    memberRowByEmail: (email: string) =>
      `//*[normalize-space()=${cssQuote(email)}]`,
    // Inside the "Add new member" dialog. The dialog has a stable header
    // labelled "Add new member"; nested inputs anchored by name attribute.
    addMemberDialog: 'role=dialog[name="Add new member"]',
    dialogEmailInput: '[role="dialog"] input[name="email"]',
    // Role combobox is the only Mantine select inside the dialog.
    dialogRoleInput: '[role="dialog"] input[placeholder="Select role"]',
    dialogSubmitButton: '[role="dialog"] button:has-text("Add member")',
    dialogCloseButton: '[role="dialog"] header button',
    dialogInvalidEmailError: '[role="dialog"] >> text=Invalid email',
    roleOptionAdmin: 'role=option[name="Admin"]',
    roleOptionMember: 'role=option[name="Member"]',
  },

  /*** Manage account (/manage-account) ***/
  manageAccount: {
    // The sidebar also reads "Manage account" — scope the heading lookup to
    // the main content paragraph (Mantine Text rendered as <p>).
    pageHeading: 'main p:has-text("Manage account")',
    userDetailsTab: 'role=tab[name="User details"]',
    securityTab: 'role=tab[name="Security"]',
    firstNameInput: 'role=textbox[name="First name"]',
    lastNameInput: 'role=textbox[name="Last name"]',
    saveButton: 'role=button[name="Save"]',
    // Security panel anchors. `text=` substring matching is too loose
    // ("Sessions" also catches "Sign out from other sessions") — use
    // exact-text strings, scoped to the tabpanel.
    sessionsHeading: '[role="tabpanel"] >> text="Sessions"',
    currentSessionMarker: '[role="tabpanel"] >> text="Current"',
    passwordHeading: '//*[@role="tabpanel"]//p[normalize-space()="Password"]',
    currentPasswordInput: 'role=textbox[name="Current password"]',
    newPasswordInput: 'role=textbox[name="New password"]',
    signOutOtherSessionsCheckbox: 'role=checkbox[name="Sign out from other sessions"]',
    changePasswordButton: 'role=button[name="Change password"]',
  },

  /*** Top-level shared navigation (header + sidebar) ***/
  postLoginNav: {
    // Stable data-testid hooks exposed by the app.
    userMenuTrigger: '[data-testid="user-settings"]',
    orgSwitcherTrigger: 'header [data-testid="organization-picker"]',
    orgNameLabel: '[data-testid="organization-name"]',
    // Menu items (rendered after click).
    userMenuManageAccount: 'role=menuitem[name="Manage account"]',
    userMenuSignOut: 'role=menuitem[name="Sign out"]',
    orgSwitcherCreateOption: 'role=menuitem[name="Create organization"]',
    // Marketing root that anon users land on (also where sign-out redirects).
    homeHeading: 'text=Example SaaS app for automation testing',
    // Anon header always has the sign-in/sign-up call-to-action.
    anonHeaderSignInLink: 'header a[href="/sign-in"]',
    anonHeaderSignUpLink: 'header a[href="/sign-up"]',
  },
} as const;

/**
 * Quote a value for embedding in an XPath literal. Single-quotes by default;
 * double-quotes if the value contains single quotes. Test inputs we generate
 * never contain both — keep this simple.
 */
function cssQuote(value: string): string {
  return value.includes("'") ? `"${value}"` : `'${value}'`;
}
