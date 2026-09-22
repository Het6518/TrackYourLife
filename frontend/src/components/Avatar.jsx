export default function Avatar({ user, className = "" }) {
  const initials = user?.username?.slice(0, 2).toUpperCase() || "TY";

  return (
    <span className={`avatar ${className}`.trim()}>
      {user?.avatar_url ? <img src={user.avatar_url} alt={`${user.username}'s avatar`} /> : initials}
    </span>
  );
}
