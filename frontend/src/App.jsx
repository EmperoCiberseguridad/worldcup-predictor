import { useEffect, useState } from "react";


function App() {
  const [matches, setMatches] = useState([]);

  useEffect(() => {
  fetch("http://127.0.0.1:8000/matches/")
    .then(res => res.json())
    .then(data => {
      setMatches(data);
      setLoading(false);
    })
    .catch(err => {
      console.error("Error cargando partidos:", err);
      setLoading(false);
    });
}, []);

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>World Cup Predictor</h1>

      {matches.length === 0 ? (
        <p>Cargando partidos...</p>
      ) : (
        matches.map((m) => (
          <div key={m.id} style={{ marginBottom: "10px" }}>
            <strong>{m.home_team}</strong> vs <strong>{m.away_team}</strong>
            <div>
              {m.home_score ?? "-"} - {m.away_score ?? "-"}
            </div>
            <small>{m.date} | {m.group}</small>
          </div>
        ))
      )}
    </div>
  );
}

export default App;