import { useEffect, useState } from "react";

function Header() {
  const [currentTime, setCurrentTime] = useState(
    new Date()
  );

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

  const formattedDate =
    currentTime.toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  return (
    <header className="header">

      <div>
        <h1>
          {greeting}, Anmol
        </h1>

        <p>
          {formattedDate}
        </p>
      </div>

      <div className="profile">
        A
      </div>

    </header>
  );
}

export default Header;