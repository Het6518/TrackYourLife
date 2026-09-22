import { signatureFor } from "../utils/signature";

// A personal "Hello, {username}" in a calligraphy style picked
// deterministically from the username (see utils/signature.js), so it reads
// as that person's own handwriting rather than a random font each visit.
// Static — no entrance animation.
export default function SignatureGreeting({ username }) {
  const style = signatureFor(username);

  return (
    <div className="signature-greeting">
      <span
        className="signature-text"
        style={{ fontFamily: style.family, "--sig-scale": style.size, "--tilt": `${style.tilt}deg` }}
      >
        Hello, {username}
      </span>
    </div>
  );
}
