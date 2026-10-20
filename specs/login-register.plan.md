# NexaShop Login and Register Test Plan

## Application Overview

Covers /login and /register UI plus /api/auth/login and /api/auth/register behavior. Environment: TEST_MODE=true, RATE_LIMIT_ENABLED=false. Seed accounts (README): superadmin@nexashop.test / SuperAdmin@123; admin1@nexashop.test, admin2@nexashop.test / Admin@123; customer1..10@nexashop.test, banned@, unverified@, lockout@, empty@ (all @nexashop.test) / Customer@123. Test IDs login: login-page, login-form, login-email-input, login-password-input, login-remember-checkbox, login-forgot-password-link, login-submit-btn, login-google-btn, login-register-link, login-error, login-resend-verification-link, login-session-expired, login-reset-success, login-verified-success. Register: register-page, register-form, register-name-input, register-email-input, register-password-input, register-confirm-password-input, register-terms-checkbox, register-submit-btn, register-error, register-login-link, password-strength, password-strength-label, password-rule-0..4, register-verify-notice, register-verify-message, register-resend-link. Header: user-menu-button, logout-button. Forms use noValidate, so errors are custom (no browser tooltips). Lockout is 5 failures, 15 minutes; reset with POST /api/test/unlock {email}. Tests that create users must use unique emails (e.g. timestamp). Always start from a fresh browser context (logged out, cookie banner pre-dismissed by fixtures). Lockout tests must call /api/test/unlock first and after.

## Test Scenarios

### 1. Login - Positive

**Seed:** `tests/seed.spec.ts`

#### 1.1. Login page renders all elements

**File:** `tests/login/login-ui.spec.ts`

**Steps:**
  1. Navigate to /login
    - expect: login-page, login-form visible; heading 'Welcome back'
    - expect: Email, Password inputs, Remember me checkbox (checked by default), Forgot password link, Log in button, Continue with Google button, Sign up link visible
    - expect: Password input has type=password

#### 1.2. Customer logs in successfully

**File:** `tests/login/login-customer.spec.ts`

**Steps:**
  1. Go to /login, fill customer1@nexashop.test / Customer@123, click login-submit-btn
    - expect: Toast 'Welcome back!' appears
    - expect: URL becomes / (home)
    - expect: Header shows user-menu-button, no Log in/Sign up buttons
    - expect: user-menu-email shows customer1@nexashop.test after opening menu
    - expect: Cookies set for session

#### 1.3. Admin and Super Admin login and admin access

**File:** `tests/login/login-admin.spec.ts`

**Steps:**
  1. Login as admin1@nexashop.test / Admin@123, wait for URL /
    - expect: Redirected to / (observed: admins are NOT redirected to /admin)
    - expect: user-menu-admin link present in the menu
  2. Click user-menu-admin / navigate to /admin
    - expect: Admin dashboard loads at /admin
  3. Repeat with superadmin@nexashop.test / SuperAdmin@123
    - expect: Same behavior; /admin accessible

#### 1.4. Customer cannot access admin area

**File:** `tests/login/login-role-guard.spec.ts`

**Steps:**
  1. Login as customer1, then navigate to /admin
    - expect: URL stays /admin but page shows '403 Access denied - You do not have permission to view this page.' with Go home link
    - expect: user-menu-admin link absent from menu

#### 1.5. Logout

**File:** `tests/login/logout.spec.ts`

**Steps:**
  1. Login as customer1, click user-menu-button then logout-button
    - expect: Session ended; header shows Log in / Sign up
    - expect: Navigating to /account redirects to /login?redirect=%2Faccount

#### 1.6. Redirect back after login

**File:** `tests/login/login-redirect.spec.ts`

**Steps:**
  1. As guest, open /account
    - expect: Redirected to /login?redirect=%2Faccount
  2. Login as customer1
    - expect: Lands on /account

#### 1.7. Open-redirect protection

**File:** `tests/login/login-open-redirect.spec.ts`

**Steps:**
  1. Open /login?redirect=//evil.com then /login?redirect=https://evil.com and login as customer1
    - expect: After login URL is / on the same origin, never an external site

#### 1.8. Email is case-insensitive and trimmed

**File:** `tests/login/login-email-normalization.spec.ts`

**Steps:**
  1. Login with '  CUSTOMER1@NEXASHOP.TEST  ' and Customer@123
    - expect: Login succeeds (schema trims and lowercases)

#### 1.9. Remember me checkbox toggles and login works unchecked

**File:** `tests/login/login-remember-me.spec.ts`

**Steps:**
  1. Verify login-remember-checkbox is checked by default; uncheck it; login as customer2
    - expect: Login succeeds; request body contains rememberMe=false
    - expect: Session cookie lifetime is shorter/session-only compared with checked case (verify via cookie expiry)

#### 1.10. Unverified user can log in under TEST_MODE

**File:** `tests/login/login-unverified-testmode.spec.ts`

**Steps:**
  1. Login as unverified@nexashop.test / Customer@123 with TEST_MODE=true
    - expect: Login succeeds and redirects to / (verification skipped). Observed in exploration.
    - expect: With TEST_MODE=false (separate run) expect 403 'Please verify your email address before logging in' and login-resend-verification-link visible linking to /verify-email?email=...

#### 1.11. Logged-in user visiting /login is redirected home

**File:** `tests/login/login-already-authenticated.spec.ts`

**Steps:**
  1. Login, then goto /login
    - expect: Redirected to /

#### 1.12. Guest cart merges on login

**File:** `tests/login/login-cart-merge.spec.ts`

**Steps:**
  1. As guest add a product to cart, then login as empty@nexashop.test
    - expect: Cart badge reflects the guest item after login; toast 'Welcome back!'

#### 1.13. Banner messages from query params

**File:** `tests/login/login-query-banners.spec.ts`

**Steps:**
  1. Open /login?reason=session_expired, /login?reset=success, /login?verified=1
    - expect: login-session-expired, login-reset-success, login-verified-success banners show texts 'Your session has expired. Please log in again.', 'Password reset successful. Please log in with your new password.', 'Email verified! You can now log in.'

### 2. Login - Negative and Edge

**Seed:** `tests/seed.spec.ts`

#### 2.1. Empty form submit

**File:** `tests/login/login-empty.spec.ts`

**Steps:**
  1. Click login-submit-btn with both fields empty
    - expect: 'Email is required' and 'Password is required' shown inline; no network request; URL unchanged

#### 2.2. Empty password only

**File:** `tests/login/login-empty-password.spec.ts`

**Steps:**
  1. Enter valid email, leave password empty, submit
    - expect: Only 'Password is required' shown

#### 2.3. Empty email only

**File:** `tests/login/login-empty-email.spec.ts`

**Steps:**
  1. Enter password only, submit
    - expect: Only 'Email is required' shown

#### 2.4. Invalid email formats

**File:** `tests/login/login-invalid-email.spec.ts`

**Steps:**
  1. Try 'abc', 'abc@', '@example.com', 'a b@example.com', 'abc@example' with password x
    - expect: Each shows 'Please enter a valid email address'; no API call

#### 2.5. Email longer than 254 chars

**File:** `tests/login/login-long-email.spec.ts`

**Steps:**
  1. Enter 250-char local part + @example.com
    - expect: Error 'Email must be at most 254 characters' (or invalid email message)

#### 2.6. Wrong password

**File:** `tests/login/login-wrong-password.spec.ts`

**Steps:**
  1. Login as customer3@nexashop.test with 'Wrong@123'
    - expect: login-error shows 'Invalid email or password. 4 attempt(s) remaining before your account is locked.' (count depends on prior failures; a success resets counter)
    - expect: Stays on /login, password field retained, no session

#### 2.7. Unknown email

**File:** `tests/login/login-unknown-email.spec.ts`

**Steps:**
  1. Login as nobody@nexashop.test / Wrong@123
    - expect: login-error shows exactly 'Invalid email or password' (no remaining-attempts text, no user enumeration)

#### 2.8. Password is case-sensitive

**File:** `tests/login/login-case-password.spec.ts`

**Steps:**
  1. Login customer4 with 'customer@123'
    - expect: Invalid email or password error

#### 2.9. Account lockout after 5 failed attempts

**File:** `tests/login/login-lockout.spec.ts`

**Steps:**
  1. POST /api/test/unlock for lockout@nexashop.test. Submit wrong password 5 times via UI
    - expect: Attempt messages show 4,3,2,1 attempt(s) remaining
    - expect: 5th attempt shows 'Account locked due to too many failed login attempts. Try again in 15 minute(s).' (HTTP 403 ACCOUNT_LOCKED)
  2. Login with the CORRECT password Customer@123
    - expect: Still blocked with the locked message; no session
  3. POST /api/test/unlock then login with correct password
    - expect: Login succeeds

#### 2.10. Successful login resets failed counter

**File:** `tests/login/login-counter-reset.spec.ts`

**Steps:**
  1. Unlock customer5; fail twice; login correctly; logout; fail once
    - expect: Message after the final failure says 4 attempts remaining

#### 2.11. Banned user

**File:** `tests/login/login-banned.spec.ts`

**Steps:**
  1. Login as banned@nexashop.test / Customer@123
    - expect: login-error shows 'Your account has been suspended: Violation of terms of service' (403 ACCOUNT_BANNED); no session

#### 2.12. Banned user with wrong password

**File:** `tests/login/login-banned-wrong-password.spec.ts`

**Steps:**
  1. Login banned@ with wrong password
    - expect: Observed from code: suspended message returned before password check (info disclosure). Record actual message.

#### 2.13. SQL injection style input in login

**File:** `tests/login/login-sqli.spec.ts`

**Steps:**
  1. Email "' OR '1'='1" and password "' OR '1'='1"
    - expect: Email invalid format error; no login
  2. Email valid-format "a'--@example.com"/ password "' OR 1=1 --" for customer1
    - expect: Invalid email or password; app remains functional

#### 2.14. XSS payload in login fields

**File:** `tests/login/login-xss.spec.ts`

**Steps:**
  1. Email '<script>alert(1)</script>@x.com', password '<img src=x onerror=alert(1)>'
    - expect: No dialog fires; errors rendered as text

#### 2.15. Very long password

**File:** `tests/login/login-long-password.spec.ts`

**Steps:**
  1. Submit 10,000 character password for customer1
    - expect: Graceful 401 or validation error, no 500, no hang

#### 2.16. Double submit protection

**File:** `tests/login/login-double-submit.spec.ts`

**Steps:**
  1. Enter valid creds and double-click submit
    - expect: Button shows loading state/disabled; only one session created; single navigation

#### 2.17. Keyboard submit with Enter

**File:** `tests/login/login-enter-key.spec.ts`

**Steps:**
  1. Fill fields and press Enter in password field
    - expect: Form submits and logs in

#### 2.18. Server error handling

**File:** `tests/login/login-server-error.spec.ts`

**Steps:**
  1. Route /api/auth/login to return 500 and then abort; submit valid creds
    - expect: login-error shows a generic message; button re-enabled; no crash

#### 2.19. Rate limit response (when enabled)

**File:** `tests/login/login-rate-limit.spec.ts`

**Steps:**
  1. With RATE_LIMIT_ENABLED=true send 21 login POSTs in 60s
    - expect: 21st returns 429; skip test if rate limiting disabled

#### 2.20. GET on login API

**File:** `tests/login/login-api-get.spec.ts`

**Steps:**
  1. GET /api/auth/login
    - expect: 400 'Use POST to log in'

#### 2.21. API validation payloads

**File:** `tests/login/login-api-validation.spec.ts`

**Steps:**
  1. POST {} / {email:'abc',password:'x'} / malformed JSON
    - expect: 400 with errors {email:'Email is required',password:'Password is required'} ; 400 {email:'Please enter a valid email address'}; malformed JSON returns 400

#### 2.22. Google OAuth button when not configured

**File:** `tests/login/login-google.spec.ts`

**Steps:**
  1. Click login-google-btn
    - expect: Redirect back to /login?error=google_not_configured with message 'Google sign-in is not configured on this server.' (or Google flow if configured)
  2. Open /login?error=account_banned and /login?error=oauth_failed
    - expect: login-error shows 'Your account has been suspended.' / 'Google sign-in failed. Please try again.'

### 3. Login - Navigation

**Seed:** `tests/seed.spec.ts`

#### 3.1. Forgot password link

**File:** `tests/login/login-nav-forgot.spec.ts`

**Steps:**
  1. Click login-forgot-password-link
    - expect: URL /forgot-password and forgot form is displayed

#### 3.2. Link to register

**File:** `tests/login/login-nav-register.spec.ts`

**Steps:**
  1. Click login-register-link
    - expect: URL /register
  2. Open /login?redirect=%2Fcart and click Sign up
    - expect: URL /register?redirect=%2Fcart

#### 3.3. Header Log in button carries redirect

**File:** `tests/login/login-nav-header.spec.ts`

**Steps:**
  1. From / click header 'Log in'
    - expect: URL /login?redirect=%2F

### 4. Register - Positive

**Seed:** `tests/seed.spec.ts`

#### 4.1. Register page renders all elements

**File:** `tests/register/register-ui.spec.ts`

**Steps:**
  1. Open /register
    - expect: Heading 'Create your account'; name, email, password, confirm inputs; password-strength indicator; terms checkbox unchecked; submit; login link visible
    - expect: Name input has maxlength=60

#### 4.2. Valid registration (TEST_MODE)

**File:** `tests/register/register-valid.spec.ts`

**Steps:**
  1. Fill name 'Test User', unique email, 'Passw0rd!' for password and confirm, check terms, submit
    - expect: Toast 'Account created successfully!', redirect to /, user logged in (user-menu-button visible)
    - expect: Welcome notification created (notification badge 1)

#### 4.3. Registration with redirect param

**File:** `tests/register/register-redirect.spec.ts`

**Steps:**
  1. Open /register?redirect=%2Fcart and register
    - expect: Lands on /cart

#### 4.4. Registered user can log in again

**File:** `tests/register/register-then-login.spec.ts`

**Steps:**
  1. Register, logout, login with the same credentials
    - expect: Login succeeds

#### 4.5. Email is stored lowercase and trimmed

**File:** `tests/register/register-email-normalization.spec.ts`

**Steps:**
  1. Register with '  New.User@Example.COM  ', then login with 'new.user@example.com'
    - expect: Registration and login succeed; user-menu-email shows lowercase

#### 4.6. Boundary-valid name values

**File:** `tests/register/register-name-boundaries.spec.ts`

**Steps:**
  1. Register separately with 2-char name 'Al', 50-char name, and "Mary-Jane O'Neil Jr."
    - expect: All succeed

#### 4.7. Boundary-valid password values

**File:** `tests/register/register-password-boundaries.spec.ts`

**Steps:**
  1. Register with exactly 8-char 'Passw0r!' and with 128-char valid password
    - expect: Both succeed

#### 4.8. Password strength indicator and rules checklist

**File:** `tests/register/register-strength-indicator.spec.ts`

**Steps:**
  1. Type 'aaaaaaaa'
    - expect: password-strength-label 'Weak'; only length and lowercase rules met (data-met=true)
  2. Type 'Passw0rd!'
    - expect: Label 'Good'; all 5 password-rule-N items data-met=true
  3. Type 'Passw0rd!Passw0rd!'
    - expect: Label 'Strong' (12+ chars bonus)

#### 4.9. Verification notice when TEST_MODE=false

**File:** `tests/register/register-verification-notice.spec.ts`

**Steps:**
  1. Run only with TEST_MODE=false: register new user
    - expect: register-verify-notice shows 'Check your email' with address in register-verify-message; register-resend-link goes to /verify-email?email=...; user not logged in; email visible via GET /api/test/emails

### 5. Register - Negative and Validation

**Seed:** `tests/seed.spec.ts`

#### 5.1. Empty form submit

**File:** `tests/register/register-empty.spec.ts`

**Steps:**
  1. Click register-submit-btn with all fields empty
    - expect: Inline errors: 'Name must be at least 2 characters' (observed; arguably should say 'Name is required'), 'Email is required', 'Password is required', 'Please confirm your password', 'You must accept the terms and conditions'; no navigation

#### 5.2. Each required field missing individually

**File:** `tests/register/register-required-each.spec.ts`

**Steps:**
  1. Fill everything validly but leave one field empty/unchecked in turn (name, email, password, confirm, terms)
    - expect: Only the omitted field shows its error

#### 5.3. Name too short

**File:** `tests/register/register-name-short.spec.ts`

**Steps:**
  1. Name 'A'
    - expect: 'Name must be at least 2 characters'

#### 5.4. Name too long

**File:** `tests/register/register-name-long.spec.ts`

**Steps:**
  1. Name of 51 chars (and 60 chars, the input maxlength)
    - expect: 'Name must be at most 50 characters' (BUG: input allows 60 but server limit is 50)
  2. Type 70 chars
    - expect: Input truncates at 60

#### 5.5. Name with invalid characters

**File:** `tests/register/register-name-chars.spec.ts`

**Steps:**
  1. Try 'John123', 'John@Doe', 'J0hn', '!!'
    - expect: 'Name may only contain letters, spaces, apostrophes, periods and hyphens'

#### 5.6. Whitespace-only name

**File:** `tests/register/register-name-whitespace.spec.ts`

**Steps:**
  1. Name '     '
    - expect: Name error shown after trimming; account not created

#### 5.7. Name leading/trailing whitespace is trimmed

**File:** `tests/register/register-name-trim.spec.ts`

**Steps:**
  1. Register with name '   Jane Doe   '
    - expect: Succeeds; user-menu-name shows 'Jane Doe'

#### 5.8. Invalid email formats

**File:** `tests/register/register-email-invalid.spec.ts`

**Steps:**
  1. Try 'bad@', 'bad', '@x.com', 'a@b', 'a b@x.com', 'a@@x.com'
    - expect: 'Please enter a valid email address' for each

#### 5.9. Email too long

**File:** `tests/register/register-email-long.spec.ts`

**Steps:**
  1. Enter email over 254 chars
    - expect: 'Email must be at most 254 characters'

#### 5.10. Duplicate email

**File:** `tests/register/register-duplicate.spec.ts`

**Steps:**
  1. Register with customer1@nexashop.test and valid other fields
    - expect: Inline 'Email already exists' under email plus register-error 'Email already exists' (HTTP 409 CONFLICT); no session; stay on /register

#### 5.11. Duplicate email differing by case/whitespace

**File:** `tests/register/register-duplicate-case.spec.ts`

**Steps:**
  1. Register with ' CUSTOMER1@NEXASHOP.TEST '
    - expect: 409 'Email already exists'

#### 5.12. Duplicate of a just-registered email

**File:** `tests/register/register-duplicate-new.spec.ts`

**Steps:**
  1. Register a new unique email, logout, register same email again
    - expect: 'Email already exists'

#### 5.13. Password too short (7 chars)

**File:** `tests/register/register-pw-short.spec.ts`

**Steps:**
  1. Password and confirm 'Pass0rd'
    - expect: 'Password must be at least 8 characters'

#### 5.14. Password missing uppercase

**File:** `tests/register/register-pw-no-upper.spec.ts`

**Steps:**
  1. 'passw0rd!'
    - expect: 'Password must contain at least one uppercase letter'

#### 5.15. Password missing lowercase

**File:** `tests/register/register-pw-no-lower.spec.ts`

**Steps:**
  1. 'PASSW0RD!'
    - expect: 'Password must contain at least one lowercase letter' (note: lowercase is an extra rule beyond the spec)

#### 5.16. Password missing number

**File:** `tests/register/register-pw-no-number.spec.ts`

**Steps:**
  1. 'Password!'
    - expect: 'Password must contain at least one number'

#### 5.17. Password missing special character

**File:** `tests/register/register-pw-no-special.spec.ts`

**Steps:**
  1. 'Passw0rd1'
    - expect: 'Password must contain at least one special character'

#### 5.18. Password over 128 chars

**File:** `tests/register/register-pw-too-long.spec.ts`

**Steps:**
  1. 129-char otherwise valid password
    - expect: 'Password must be at most 128 characters'

#### 5.19. Password with only spaces / all-lowercase simple

**File:** `tests/register/register-pw-weak.spec.ts`

**Steps:**
  1. '        ' and 'aaaaaaaa'
    - expect: Appropriate first-failing-rule error; label Weak

#### 5.20. Confirm password mismatch

**File:** `tests/register/register-confirm-mismatch.spec.ts`

**Steps:**
  1. Password 'Passw0rd!', confirm 'Passw0rd?'
    - expect: 'Passwords do not match' under confirm field
  2. Confirm differing only by case
    - expect: Same mismatch error

#### 5.21. Terms not accepted

**File:** `tests/register/register-terms.spec.ts`

**Steps:**
  1. Fill all valid, leave terms unchecked, submit
    - expect: 'You must accept the terms and conditions'; no account created
  2. Check then uncheck then submit
    - expect: Error shown again

#### 5.22. HTML tags in name are stripped

**File:** `tests/register/register-html-name.spec.ts`

**Steps:**
  1. Register with name 'John <b>Doe</b>'
    - expect: Observed: accepted and sanitized to 'John Doe' (tags stripped); verify user-menu-name has no markup

#### 5.23. XSS script payload in name

**File:** `tests/register/register-xss.spec.ts`

**Steps:**
  1. Name '<script>alert(1)</script>'
    - expect: Rejected: name validation error (tags stripped leaving 'alert(1)' invalid chars) via API; no dialog; no account

#### 5.24. XSS in email field

**File:** `tests/register/register-xss-email.spec.ts`

**Steps:**
  1. Email '<img src=x onerror=alert(1)>@x.com'
    - expect: Invalid email error; no dialog

#### 5.25. SQL injection style input

**File:** `tests/register/register-sqli.spec.ts`

**Steps:**
  1. Name "Robert'); DROP TABLE users;--"
    - expect: Name chars error; subsequent login of customer1 still works (tables intact)
  2. Email "a'--@example.com" or "x@y.com' OR '1'='1"
    - expect: Invalid email error or safely handled; no 500

#### 5.26. Unicode and emoji in name

**File:** `tests/register/register-unicode-name.spec.ts`

**Steps:**
  1. Names 'José Álvarez' and 'Zoë' (valid, letters), then 'John 😀'
    - expect: Accented letters accepted; emoji rejected with chars error

#### 5.27. Passwords are not exposed

**File:** `tests/register/register-password-masked.spec.ts`

**Steps:**
  1. Inspect password and confirm inputs, and successful register response
    - expect: type=password; response does not contain passwordHash

#### 5.28. Double submit creates only one account

**File:** `tests/register/register-double-submit.spec.ts`

**Steps:**
  1. Double-click submit with valid data
    - expect: Button loading/disabled; one account; second attempt (if any) shows duplicate error, no 500

#### 5.29. Error clearing on correction

**File:** `tests/register/register-error-recovery.spec.ts`

**Steps:**
  1. Trigger duplicate email error, change email to a unique one, submit
    - expect: Prior errors cleared, registration succeeds

#### 5.30. API validation responses

**File:** `tests/register/register-api.spec.ts`

**Steps:**
  1. POST /api/auth/register with {}
    - expect: 400 {success:false, errors:{name:'Name is required',email:'Email is required',password:'Password is required',confirmPassword:'Please confirm your password',acceptTerms:'You must accept the terms and conditions'}}
  2. POST valid body twice
    - expect: 201 then 409 {errors:{email:'Email already exists'}}
  3. POST with acceptTerms as string 'true'
    - expect: 400 acceptTerms error (strict literal true)

#### 5.31. Rate limit on register (when enabled)

**File:** `tests/register/register-rate-limit.spec.ts`

**Steps:**
  1. With RATE_LIMIT_ENABLED=true send 11 register POSTs in 60s
    - expect: 11th returns 429; skip if disabled

### 6. Register - Navigation

**Seed:** `tests/seed.spec.ts`

#### 6.1. Link to login

**File:** `tests/register/register-nav-login.spec.ts`

**Steps:**
  1. Click register-login-link
    - expect: URL /login with login form

#### 6.2. Header Sign up button

**File:** `tests/register/register-nav-header.spec.ts`

**Steps:**
  1. From / click 'Sign up'
    - expect: URL /register

#### 6.3. Logged-in user visiting /register

**File:** `tests/register/register-already-authenticated.spec.ts`

**Steps:**
  1. Login then goto /register
    - expect: Record behavior (expected redirect to /)
