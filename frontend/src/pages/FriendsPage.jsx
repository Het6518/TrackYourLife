import { useEffect, useState } from "react";
import { Check, Search, UserMinus, UserPlus, UserX } from "lucide-react";
import Avatar from "../components/Avatar";
import Pagination, { paginate } from "../components/Pagination";
import Shell from "../components/Shell";
import { friendsApi } from "../api/client";

const FRIENDS_PAGE_SIZE = 10;

export default function FriendsPage({ navigate, ...shell }) {
  const [friends, setFriends] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [friendsPage, setFriendsPage] = useState(1);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const { pageItems: friendPageItems, pageCount: friendPageCount, safePage: friendSafePage } = paginate(friends, friendsPage, FRIENDS_PAGE_SIZE);

  function loadAll() {
    friendsApi.list(shell.token).then(setFriends).catch(() => setFriends([]));
    friendsApi.requests(shell.token)
      .then(({ incoming, outgoing }) => {
        setIncoming(incoming);
        setOutgoing(outgoing);
      })
      .catch(() => {});
  }

  useEffect(loadAll, [shell.token]);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setResults([]);
      return;
    }
    const timeout = setTimeout(() => {
      friendsApi.search(term, shell.token).then(setResults).catch(() => setResults([]));
    }, 250);
    return () => clearTimeout(timeout);
  }, [query, shell.token]);

  async function send(username) {
    setError("");
    setBusy(username);
    try {
      await friendsApi.send(username, shell.token);
      setResults((list) => list.map((r) => (r.username === username ? { ...r, relationship: "pending_outgoing" } : r)));
      loadAll();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  async function respond(id, action) {
    await friendsApi[action](id, shell.token).catch((err) => setError(err.message));
    loadAll();
  }

  async function remove(username) {
    await friendsApi.remove(username, shell.token).catch((err) => setError(err.message));
    loadAll();
  }

  return (
    <Shell active="friends" navigate={navigate} {...shell}>
      <div className="stat-row">
        <div className="stat-row-side">
          <span className="stat-pill"><b>{friends.length}</b>friends</span>
          <span className="stat-pill"><b>{incoming.length}</b>requests</span>
        </div>
        <p className="eyebrow">Your people</p>
        <div className="stat-row-side" />
      </div>

      {error && <p className="error">{error}</p>}

      <section className="panel friends-search-panel">
        <h2>Find people</h2>
        <div className="search-bar">
          <Search size={18} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by username" />
        </div>
        {results.length > 0 && (
          <div className="friends-grid">
            {results.map((person) => (
              <div key={person.id} className="friend-row">
                <button type="button" className="friend-row-identity" onClick={() => navigate("profile", person.username)}>
                  <Avatar user={person} />
                  <span>{person.username}</span>
                </button>
                {person.relationship === "none" && (
                  <button type="button" className="soft-button" disabled={busy === person.username} onClick={() => send(person.username)}>
                    <UserPlus size={14} /> Add
                  </button>
                )}
                {person.relationship === "pending_outgoing" && <span className="friend-status">Request sent</span>}
                {person.relationship === "pending_incoming" && <span className="friend-status">They asked you — check requests</span>}
                {person.relationship === "friends" && <span className="friend-status">Friends</span>}
              </div>
            ))}
          </div>
        )}
        {query.trim().length >= 2 && !results.length && <p className="empty-state">No one found.</p>}
      </section>

      {incoming.length > 0 && (
        <section className="panel">
          <h2>Requests waiting on you</h2>
          <div className="friends-grid">
            {incoming.map((req) => (
              <div key={req.id} className="friend-row">
                <button type="button" className="friend-row-identity" onClick={() => navigate("profile", req.user.username)}>
                  <Avatar user={req.user} />
                  <span>{req.user.username}</span>
                </button>
                <div className="friend-row-actions">
                  <button type="button" className="primary small" onClick={() => respond(req.id, "accept")}><Check size={14} /> Accept</button>
                  <button type="button" className="soft-button" onClick={() => respond(req.id, "decline")}><UserX size={14} /> Decline</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {outgoing.length > 0 && (
        <section className="panel">
          <h2>Waiting on them</h2>
          <div className="friends-grid">
            {outgoing.map((req) => (
              <div key={req.id} className="friend-row">
                <button type="button" className="friend-row-identity" onClick={() => navigate("profile", req.user.username)}>
                  <Avatar user={req.user} />
                  <span>{req.user.username}</span>
                </button>
                <span className="friend-status">Pending</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="panel">
        <h2>Your friends</h2>
        {friends.length > 0 ? (
          <>
            <div className="friends-grid">
              {friendPageItems.map((friend) => (
                <div key={friend.id} className="friend-row">
                  <button type="button" className="friend-row-identity" onClick={() => navigate("profile", friend.username)}>
                    <Avatar user={friend} />
                    <span>{friend.username}</span>
                  </button>
                  <button type="button" className="friend-row-remove" onClick={() => remove(friend.username)} aria-label="Remove friend"><UserMinus size={15} /></button>
                </div>
              ))}
            </div>
            <Pagination page={friendSafePage} pageCount={friendPageCount} onChange={setFriendsPage} />
          </>
        ) : (
          <p className="empty-state">No friends yet — search above to send your first request.</p>
        )}
      </section>
    </Shell>
  );
}
