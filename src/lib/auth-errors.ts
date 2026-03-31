import { CredentialsSignin } from "next-auth";

/** Thrown when credentials are valid but the email address is not verified yet. */
export class EmailNotVerifiedError extends CredentialsSignin {
  code = "email_not_verified";
}
