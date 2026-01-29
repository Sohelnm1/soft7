import { redirect } from "next/navigation";

/**
 * /signup has no content – redirect to WhatsApp embedded signup.
 * This avoids 404 when something links to or prefetches /signup.
 */
export default function SignupPage() {
  redirect("/signup/whatsapp");
}
