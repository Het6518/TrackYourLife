import { averageScore, scoreLevel } from "../utils/date";

function lastSevenDays(days) {
  const byDate = new Map(days.map((day) => [day.date, day]));
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const iso = date.toISOString().slice(0, 10);
    return byDate.get(iso) || { date: iso };
  });
}

export default function PublicUserCard({ user, days, onOpen }) {
  const week = lastSevenDays(days);
  const logged = week.filter((day) => day.id).length;
  const avg = averageScore(days);
  const initials = user.username.slice(0, 2).toUpperCase();

  return (
    <button className="public-card" onClick={() => onOpen(user.username)}>
      <div className="public-card-head">
        <span className="avatar dark">{initials}</span>
        <span>
          <strong>{user.username}</strong>
          <small>{days[0] ? "Logged recently" : "No public logs yet"}</small>
        </span>
      </div>
      <div className="week-strip">
        {week.map((day) => (
          <span key={day.date} className={`week-cell level-${scoreLevel(day.score)}`} />
        ))}
      </div>
      <div className="public-card-foot">
        <span>{logged} of last 7 days</span>
        <b>{avg} avg</b>
      </div>
    </button>
  );
}
