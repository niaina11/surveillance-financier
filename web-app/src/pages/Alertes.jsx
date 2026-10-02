import React, { useEffect, useState } from "react";

export default function Alertes() {
  const [alertes, setAlerts] = useState([]);
  const [filter, setFilter] = useState("TOUS");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const niveaux = [
    "TOUS",
    "CRITIQUE",
    "ÉLEVÉ",
    "MOYENNE",
  ];

  const filtered =
    filter === "TOUS"
      ? alertes
      : alertes.filter((a) => a.statut === filter);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Session expirée. Veuillez vous reconnecter.");
      }

      const response = await fetch(
        "http://localhost:3000/api/admin/alertes",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      console.log("Réponse alertes :", result);

      if (!response.ok || result.success === false) {
        throw new Error(
          result.message || "Erreur lors de la récupération des alertes"
        );
      }

      // Si ton helper success retourne { success, message, data }
      setAlerts(result.data || []);

    } catch (err) {
      console.error("Erreur alertes :", err);
      setError(err.message);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  return (
    <div className="p-6">

      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Alertes
      </h1>

      {/* Erreur */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600">
          {error}
        </div>
      )}

      {/* Chargement */}
      {loading && (
        <p className="text-gray-500 mb-4">
          Chargement des alertes...
        </p>
      )}

      {/* Filtres */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {niveaux.map((n) => (
          <button
            key={n}
            onClick={() => setFilter(n)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${filter === n
                ? "bg-[#0033A0] text-white"
                : "bg-white text-gray-600 border hover:bg-gray-50"
              }`}
          >
            {n}
          </button>
        ))}
      </div>

      {/* Alertes */}
      <div className="space-y-3">

        {!loading && filtered.length === 0 && (
          <div className="bg-white rounded-xl p-6 text-center text-gray-500">
            Aucune alerte trouvée.
          </div>
        )}

        {filtered.map((a) => (
          <div
            key={a.id_alerte}
            className="bg-white rounded-xl p-4 shadow-sm border"
          >
            <div className="flex justify-between items-start">

              <div>
                {/* Type */}
                <span className="text-sm font-bold text-gray-800">
                  {a.type_alerte?.replace(/_/g, " ")}
                </span>

                {/* Message */}
                <p className="text-gray-600 mt-1">
                  {a.message}
                </p>

                {/* Agence + date */}
                <p className="text-xs text-gray-400 mt-2">
                  {a.agence?.nom || "Agence inconnue"}
                  {" — "}
                  {a.date_creation
                    ? new Date(a.date_creation).toLocaleString("fr-FR")
                    : ""}
                </p>
              </div>

              {/* Statut */}
              <span
                className={`text-xs px-2 py-1 rounded-full font-bold ${a.statut === "CRITIQUE"
                    ? "bg-red-50 text-red-500"
                    : "bg-blue-50 text-blue-500"
                  }`}
              >
                {a.statut}
              </span>

            </div>
          </div>
        ))}

      </div>
    </div>
  );
}