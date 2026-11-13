import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import {
  getReports,
  getAnalytics,
  setUserDisabled,
} from "../services/adminService";
import "../styles/Admin.css";

function Admin() {
  const navigate = useNavigate();

  const [reports, setReports] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("connectly_token");

  const loadData = async () => {
    try {
      setError("");
      const [reportData, analyticsData] = await Promise.all([
        getReports(token),
        getAnalytics(token),
      ]);
      setReports(reportData.reports);
      setAnalytics(analyticsData.analytics);
    } catch (err) {
      const status = err.response?.status;
      if (status === 401) {
        navigate("/login");
        return;
      }
      if (status === 403) {
        setError("You do not have admin access.");
      } else {
        setError(err.response?.data?.message || "Could not load admin data.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggle = async (report) => {
    const disable = !report.reported_is_disabled;
    const label = disable ? "Disable" : "Enable";

    if (!window.confirm(`${label} ${report.reported_name}?`)) return;

    try {
      await setUserDisabled(token, report.reported_id, disable);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Could not update user.");
    }
  };

  if (loading) return <main className="admin-page"><p>Loading...</p></main>;

  return (
    <main className="admin-page">
      <header className="admin-header">
        <button className="admin-back" onClick={() => navigate("/")}>
          <ArrowLeft size={18} />
          Back
        </button>
        <h1>Admin</h1>
      </header>

      {error && <p className="admin-error">{error}</p>}

      {!error.includes("admin access") && (
        <>
          <section className="admin-card">
            <h2>Wait-time analytics</h2>
            {analytics.length === 0 ? (
              <p>No finished searches yet.</p>
            ) : (
              <div className="admin-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Gender</th>
                      <th>Searches</th>
                      <th>Matched</th>
                      <th>Cancelled</th>
                      <th>Disconnected</th>
                      <th>Match rate %</th>
                      <th>Avg wait (s)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.map((row) => (
                      <tr key={row.gender}>
                        <td>{row.gender}</td>
                        <td>{row.searches}</td>
                        <td>{row.matched}</td>
                        <td>{row.cancelled}</td>
                        <td>{row.disconnected}</td>
                        <td>{row.match_rate_pct}</td>
                        <td>{row.avg_wait_sec}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="admin-card">
            <h2>Reports (latest 100)</h2>
            {reports.length === 0 ? (
              <p>No reports yet.</p>
            ) : (
              <div className="admin-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>When</th>
                      <th>Reason</th>
                      <th>Reported user</th>
                      <th>Reported by</th>
                      <th>Total against</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((r) => (
                      <tr key={r.id}>
                        <td>{new Date(r.created_at).toLocaleString()}</td>
                        <td>{r.reason}</td>
                        <td>
                          {r.reported_name}
                          <br />
                          <small>{r.reported_email}</small>
                        </td>
                        <td>{r.reporter_name}</td>
                        <td>{r.reports_against}</td>
                        <td>
                          <button
                            className={
                              r.reported_is_disabled
                                ? "admin-btn"
                                : "admin-btn danger"
                            }
                            onClick={() => handleToggle(r)}
                          >
                            {r.reported_is_disabled ? "Enable" : "Disable"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}

export default Admin;