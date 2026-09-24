import { useState } from "react";
import { X } from "lucide-react";
import Modal from "./Modal";

// `viewable` turns the avatar into an Instagram-style profile photo: click
// it to open the photo full-size in a lightbox. Off by default so it doesn't
// interfere with avatars that already have their own click behavior (e.g.
// the top bar's account menu button).
export default function Avatar({ user, className = "", viewable = false }) {
  const [open, setOpen] = useState(false);
  const initials = user?.username?.slice(0, 2).toUpperCase() || "TY";
  const hasPhoto = Boolean(user?.avatar_url);
  const clickable = viewable && hasPhoto;

  return (
    <>
      <span
        className={`avatar ${className} ${clickable ? "clickable" : ""}`.trim()}
        onClick={clickable ? () => setOpen(true) : undefined}
        role={clickable ? "button" : undefined}
        tabIndex={clickable ? 0 : undefined}
        onKeyDown={clickable ? (event) => (event.key === "Enter" || event.key === " ") && setOpen(true) : undefined}
        aria-label={clickable ? `View ${user.username}'s profile photo` : undefined}
      >
        {hasPhoto ? <img src={user.avatar_url} alt={`${user.username}'s avatar`} /> : initials}
      </span>

      {open && (
        <Modal>
          <div className="avatar-viewer-backdrop" onClick={() => setOpen(false)}>
            <button type="button" className="avatar-viewer-close" onClick={() => setOpen(false)} aria-label="Close">
              <X size={22} />
            </button>
            <img
              className="avatar-viewer-photo"
              src={user.avatar_url}
              alt={`${user.username}'s profile photo`}
              onClick={(event) => event.stopPropagation()}
            />
          </div>
        </Modal>
      )}
    </>
  );
}
