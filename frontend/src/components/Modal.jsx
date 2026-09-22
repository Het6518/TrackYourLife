import { createPortal } from "react-dom";

// Renders its children directly onto <body>, completely outside the app's
// component tree. This is the standard fix for modals that need real
// position:fixed-to-the-viewport behavior: if ANY ancestor in the normal
// tree ever gets a `transform`, `filter`, `backdrop-filter`, `perspective`
// or `will-change` (even a harmless-looking animation end-state), it
// silently turns into a new containing block and every `position: fixed`
// descendant starts positioning itself against that ancestor's box instead
// of the viewport — exactly the "modal opens low on a tall page" bug. A
// portal makes that entire class of bug structurally impossible, since the
// modal is no longer a descendant of anything the app renders.
export default function Modal({ children }) {
  return createPortal(children, document.body);
}
