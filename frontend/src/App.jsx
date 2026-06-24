import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API = "http://127.0.0.1:8000";

// Resultado real del partido a partir del marcador (misma logica que el backend).
function getResult(match) {
  if (match.home_score == null || match.away_score == null) return null;
  if (match.home_score > match.away_score) return "home";
  if (match.home_score < match.away_score) return "away";
  return "draw";
}

function App() {
  const [matches, setMatches] = useState([]);
  const [picks, setPicks] = useState({});      // { [match_id]: "home" | "draw" | "away" }
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // "all" | "pending" | "played" | group name

  // Carga inicial: partidos + predicciones guardadas
  useEffect(() => {
    Promise.all([
      fetch(`${API}/matches/`).then((r) => r.json()),
      fetch(`${API}/predictions/`)
        .then((r) => (r.ok ? r.json() : []))
        .catch(() => []),
    ])
      .then(([matchData, predData]) => {
        setMatches(matchData);
        const map = {};
        predData.forEach((p) => {
          map[p.match_id] = p.prediction;
        });
        setPicks(map);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error cargando datos:", err);
        setLoading(false);
      });
  }, []);

  // Enviar / actualizar un pronostico
  function makePick(matchId, prediction) {
    setPicks((prev) => ({ ...prev, [matchId]: prediction })); // optimista

    fetch(`${API}/predictions/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ match_id: matchId, prediction }),
    }).catch((err) => console.error("Error guardando prediccion:", err));
  }

  // Borrar la prediccion de un solo partido (reintentar)
  function retryPick(matchId) {
    setPicks((prev) => {
      const next = { ...prev };
      delete next[matchId];
      return next;
    });

    fetch(`${API}/predictions/${matchId}`, { method: "DELETE" }).catch((err) =>
      console.error("Error reiniciando prediccion:", err)
    );
  }

  // Borrar todas las predicciones y empezar de cero
  function resetAll() {
    const ok = window.confirm(
      "Esto borra todos tus pronosticos y empieza de cero. Continuar?"
    );
    if (!ok) return;

    setPicks({}); // limpia la UI de inmediato

    fetch(`${API}/predictions/`, { method: "DELETE" }).catch((err) =>
      console.error("Error borrando predicciones:", err)
    );
  }

  // Estadisticas calculadas en el cliente (instantaneo)
  const stats = useMemo(() => {
    let correct = 0,
      wrong = 0,
      pending = 0;

    Object.entries(picks).forEach(([matchId, pick]) => {
      const match = matches.find((m) => String(m.id) === String(matchId));
      if (!match) return;
      const result = getResult(match);
      if (result === null) pending += 1;
      else if (result === pick) correct += 1;
      else wrong += 1;
    });

    const played = correct + wrong;
    const accuracy = played > 0 ? Math.round((correct / played) * 100) : 0;
    return { correct, wrong, pending, played, accuracy };
  }, [picks, matches]);

  // Grupos disponibles para los filtros
  const groups = useMemo(() => {
    const set = new Set(matches.map((m) => m.group).filter(Boolean));
    return [...set].sort();
  }, [matches]);

  // Partidos filtrados
  const visibleMatches = useMemo(() => {
    return matches.filter((m) => {
      if (filter === "all") return true;
      if (filter === "pending") return getResult(m) === null;
      if (filter === "played") return getResult(m) !== null;
      return m.group === filter;
    });
  }, [matches, filter]);

  return (
    <div className="wc-app">
      {/* ---------- Header ---------- */}
      <header className="wc-header">
        <div>
          <h1 className="wc-title">
            World Cup <span className="wc-title-accent">2026</span>
            <span className="wc-subtitle">Predictor · Fase de grupos</span>
          </h1>
        </div>

        <div className="wc-form">
          <div className="wc-form-top">
            <div>
              <span className="wc-accuracy-num">{stats.accuracy}%</span>
              <span className="wc-accuracy-label"> precision</span>
            </div>
            <span className="wc-record">
              <b>{stats.correct}</b> aciertos de <b>{stats.played}</b> jugados
            </span>
          </div>
          <div className="wc-meter">
            <div className="wc-meter-fill" style={{ width: `${stats.accuracy}%` }} />
          </div>

          {Object.keys(picks).length > 0 && (
            <button className="wc-reset" onClick={resetAll}>
              Borrar todo y empezar de cero
            </button>
          )}
        </div>
      </header>

      {/* ---------- Stat chips ---------- */}
      <section className="wc-stats">
        <div className="wc-stat is-played">
          <div className="wc-stat-value">{stats.played}</div>
          <div className="wc-stat-label">Jugados</div>
        </div>
        <div className="wc-stat is-correct">
          <div className="wc-stat-value">{stats.correct}</div>
          <div className="wc-stat-label">Aciertos</div>
        </div>
        <div className="wc-stat is-wrong">
          <div className="wc-stat-value">{stats.wrong}</div>
          <div className="wc-stat-label">Errores</div>
        </div>
        <div className="wc-stat is-pending">
          <div className="wc-stat-value">{stats.pending}</div>
          <div className="wc-stat-label">Pendientes</div>
        </div>
      </section>

      {/* ---------- Filters ---------- */}
      <nav className="wc-filters">
        <button
          className={`wc-chip ${filter === "all" ? "is-active" : ""}`}
          onClick={() => setFilter("all")}
        >
          Todos
        </button>
        <button
          className={`wc-chip ${filter === "pending" ? "is-active" : ""}`}
          onClick={() => setFilter("pending")}
        >
          Pendientes
        </button>
        <button
          className={`wc-chip ${filter === "played" ? "is-active" : ""}`}
          onClick={() => setFilter("played")}
        >
          Jugados
        </button>
        {groups.map((g) => (
          <button
            key={g}
            className={`wc-chip ${filter === g ? "is-active" : ""}`}
            onClick={() => setFilter(g)}
          >
            {g}
          </button>
        ))}
      </nav>

      {/* ---------- Match grid ---------- */}
      {loading ? (
        <div className="wc-loading">Cargando partidos...</div>
      ) : visibleMatches.length === 0 ? (
        <div className="wc-empty">No hay partidos en este filtro.</div>
      ) : (
        <div className="wc-grid">
          {visibleMatches.map((m) => {
            const result = getResult(m);
            const pick = picks[m.id];
            const finished = result !== null;
            // El marcador y el veredicto solo se revelan cuando el usuario ya eligio.
            const revealed = finished && Boolean(pick);
            const verdict = revealed ? (pick === result ? "correct" : "wrong") : null;

            return (
              <article
                key={m.id}
                className={`wc-card ${verdict ? `is-${verdict}` : ""}`}
              >
                <div className="wc-card-head">
                  <span className="wc-group">{m.group || m.stage || "Grupo"}</span>
                  <span className="wc-date">{m.date}</span>
                </div>

                <div className="wc-matchup">
                  <span className="wc-team home">{m.home_team}</span>
                  {revealed ? (
                    <span className="wc-score">
                      {m.home_score} - {m.away_score}
                    </span>
                  ) : (
                    <span className="wc-vs">VS</span>
                  )}
                  <span className="wc-team away">{m.away_team}</span>
                </div>

                <div className="wc-picks">
                  <button
                    className={`wc-pick ${pick === "home" ? "is-selected" : ""}`}
                    onClick={() => makePick(m.id, "home")}
                    disabled={revealed}
                  >
                    {m.home_team}
                    <span className="wc-pick-caption">Gana local</span>
                  </button>
                  <button
                    className={`wc-pick ${pick === "draw" ? "is-selected" : ""}`}
                    onClick={() => makePick(m.id, "draw")}
                    disabled={revealed}
                  >
                    Empate
                    <span className="wc-pick-caption">X</span>
                  </button>
                  <button
                    className={`wc-pick ${pick === "away" ? "is-selected" : ""}`}
                    onClick={() => makePick(m.id, "away")}
                    disabled={revealed}
                  >
                    {m.away_team}
                    <span className="wc-pick-caption">Gana visita</span>
                  </button>
                </div>

                {verdict === "correct" && (
                  <div className="wc-verdict correct">
                    <span className="wc-verdict-icon">✓</span> Acertaste tu pronostico
                  </div>
                )}
                {verdict === "wrong" && (
                  <div className="wc-verdict wrong">
                    <span className="wc-verdict-icon">✕</span> Fallaste - gano{" "}
                    {result === "home"
                      ? m.home_team
                      : result === "away"
                      ? m.away_team
                      : "el empate"}
                  </div>
                )}

                {pick && (
                  <button
                    className="wc-retry"
                    onClick={() => retryPick(m.id)}
                  >
                    ↺ Reintentar
                  </button>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default App;