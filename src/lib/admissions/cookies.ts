// The guardian's admission cookies, named here so the proxy can see them without loading the session code.

/** The resume token of the application on this device. */
export const SESSION_COOKIE = 'mq_admission';
/** Find my application: a signed grant to one application. */
export const GRANT_COOKIE = 'mq_admission_grant';
/** The office's test pass. */
export const TEST_PASS_COOKIE = 'mq_admission_test';

/** A visitor with any of these sees their own pre-admission page; everyone else gets the cached one. */
export const PERSONAL_ADMISSION_COOKIES = [SESSION_COOKIE, GRANT_COOKIE, TEST_PASS_COOKIE];
