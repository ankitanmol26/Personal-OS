import { useEffect, useState } from "react";
import { Settings, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Header() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  const hour = currentTime.getHours();

  let greeting;

  if (hour < 12) {
    greeting = "Good morning";
  } else if (hour < 17) {
    greeting = "Good afternoon";
  } else {
    greeting = "Good evening";
  }

  const formattedDate = currentTime.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <header className="header">
      <div className="header-greeting">
        <h1>
          {greeting}{user && user.name ? `, ${user.name}` : ""}
        </h1>
        <p>
          {formattedDate}
        </p>
      </div>

      <div className="header-actions">
        <button className="icon-button" aria-label="Settings" onClick={() => navigate('/profile')}>
          <Settings size={18} />
        </button>
        <button className="icon-button" aria-label="Logout" onClick={logout} title="Logout">
          <LogOut size={18} />
        </button>
        {user && user.avatarUrl ? (
          <img src={user.avatarUrl} alt="Avatar" className="profile avatar-img" />
        ) : (
          <div className="profile" onClick={() => navigate('/profile')} style={{cursor: 'pointer'}}>
            {user && user.name ? user.name.charAt(0).toUpperCase() : "U"}
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;