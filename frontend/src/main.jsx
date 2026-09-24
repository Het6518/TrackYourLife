import React, { useEffect, useState } from "react"; // hooks 
import { createRoot } from "react-dom/client"; // to create the root of the app now here is where we will render the app
import { authApi } from "./api/client";
import AuthPage from "./pages/AuthPage"; // auth page 
import DashboardPage from "./pages/DashboardPage"; // dashboard
import ExplorePage from "./pages/ExplorePage"; // explore
import FriendsPage from "./pages/FriendsPage"; // friends
import MapPage from "./pages/MapPage"; // user location map
import PublicProfilePage from "./pages/PublicProfilePage"; // public profile
import VisionBoardPage from "./pages/VisionBoardPage"; // vision board
import MusicPlayer from "./components/MusicPlayer";
import WeatherFX from "./components/WeatherFX";
import { getBrowserLocation } from "./utils/geolocation";
import { applyPersonalization, applyTheme, effectTheme } from "./utils/weather";
import "./styles.css"; // will move to tailwind later

function parseLocation() {
  const path = window.location.pathname.replace(/^\//, ""); //window.location.pathname gives the path of the url and we are removing the first / from it
  if (path === "explore") return { page: "explore" };
  if (path === "map") return { page: "map" };
  if (path === "board") return { page: "board" };
  if (path === "friends") return { page: "friends" };
  if (path && path !== "dashboard") return { page: "profile", username: path }; // if the path is not empty and not dashboard then it is a profile page and we are returning the username as well /het
  return { page: "dashboard" };
}
// use react router bro 
        // <Route
        //   path="/dashboard"
        //   element={<DashboardPage />}
        // />

function App() {
  const [route, setRoute] = useState(parseLocation()); // to set the route based on the url and we are using useState hook to set the route and we are using parseLocation function to get the route from the url
  const [token, setToken] = useState(localStorage.getItem("track_token") || "");  // token in localstorage 
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));
  const [revealed, setRevealed] = useState(false);

  const theme = effectTheme(user?.theme_effect);

  // Apply the chosen effect theme, then re-assert the user's own
  // background/accent overrides on top of it — otherwise a later effect
  // change would silently clobber whatever they picked.
  useEffect(() => {
    applyTheme(theme);
    applyPersonalization(user);
  }, [theme.key, user?.theme_background_url, user?.theme_accent_color]);
// Imagine the user refreshes the page.

// They have a token:

// track_token = abc123

// The app needs to ask the backend:

// "Is this token still valid? Who is this user?"

// While that request is happening, you don't want to immediately show the login page.

// So:

// loading = true
  useEffect(() => {
    function handlePop() {
      setRoute(parseLocation());
    }
    window.addEventListener("popstate", handlePop); // when the user clicks the back button, we want to update the route based on the url and we are using parseLocation function to get the route from the url
    return () => window.removeEventListener("popstate", handlePop); //popstate event is fired when the active history entry changes. This can happen due to the user clicking the back or forward button, or calling history.back(), history.forward(), or history.go() in JavaScript. We are removing the event listener when the component unmounts to avoid memory leaks.
  }, []);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    authApi.me(token) // hitting an endpoint to get the user data based on the token and if the token is valid then we will get the user data and if the token is not valid then we will get an error and we will remove the token from local storage and set the token to empty string and set the user to null
      .then((me) => {
        setUser(me);
      })
      .catch(() => {
        localStorage.removeItem("track_token");
        setToken("");
      })
      .finally(() => setLoading(false));
  }, [token]);

  function navigate(page, username) {
    const path = page === "explore" ? "/explore" : page === "map" ? "/map" : page === "board" ? "/board" : page === "friends" ? "/friends" : page === "profile" ? `/${username}` : "/dashboard";
    window.history.pushState({}, "", path);
    setRoute({ page, username });
  } // navigate function is used to navigate to different pages and we are using window.history.pushState to change the url without reloading the page and we are using setRoute to update the route based on the url

  // Opt-in only: the user explicitly taps "Share my location" on the Map
  // tab. Never called automatically — location isn't required to use the
  // app. Silently does nothing if the permission is denied or unavailable.
  function shareLocation() {
    return getBrowserLocation()
      .then(({ lat, lng }) => authApi.updateLocation(lat, lng, token))
      .then((updatedUser) => updatedUser && setUser(updatedUser));
  }

  function onAuth(data) {
    localStorage.setItem("track_token", data.token);
    setToken(data.token);
    setUser(data.user);
    navigate("dashboard");
  }

  async function logout() { // async because until logout is complete we don't want to remove the token from local storage and set the user to null
    await authApi.logout(token).catch(() => null);
    localStorage.removeItem("track_token");
    setToken("");
    setUser(null); // see these are both the hook functions 
    navigate("dashboard");
  }

  useEffect(() => {
    if (!loading) {
      const id = requestAnimationFrame(() => setRevealed(true));
      return () => cancelAnimationFrame(id);
    }
  }, [loading]);

  if (loading) return <main className="loading"><div className="loading-orb" />Loading...</main>;
  const stageClass = `app-stage ${revealed ? "revealed" : ""}`;
  const baseOverlays = <WeatherFX mode={theme.fx} />;
  if (!token || !user) return <><div className={stageClass}><AuthPage onAuth={onAuth} /></div>{baseOverlays}</>;
  const overlays = <>{baseOverlays}<MusicPlayer token={token} /></>;
  const shell = { user, token, onLogout: logout, onUserChange: setUser, theme, shareLocation };
  if (route.page === "explore") return <><div className={stageClass}><ExplorePage navigate={navigate} {...shell} /></div>{overlays}</>;
  if (route.page === "map") return <><div className={stageClass}><MapPage navigate={navigate} {...shell} /></div>{overlays}</>;
  if (route.page === "board") return <><div className={stageClass}><VisionBoardPage navigate={navigate} {...shell} /></div>{overlays}</>;
  if (route.page === "friends") return <><div className={stageClass}><FriendsPage navigate={navigate} {...shell} /></div>{overlays}</>;
  if (route.page === "profile") return <><div className={stageClass}><PublicProfilePage username={route.username} navigate={navigate} {...shell} /></div>{overlays}</>;
  return <><div className={stageClass}><DashboardPage token={token} user={user} onLogout={logout} onUserChange={setUser} navigate={navigate} theme={theme} /></div>{overlays}</>;
}

createRoot(document.getElementById("root")).render(<App />);
