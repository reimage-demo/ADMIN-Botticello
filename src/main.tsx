import logoUrl from "./assets/botticello-logo.webp";
import React, { Component, type ReactNode, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ConvexReactClient,
  Authenticated,
  Unauthenticated,
  AuthLoading,
  useQuery,
  useMutation,
} from "convex/react";
import { ConvexAuthProvider, useAuthActions } from "@convex-dev/auth/react";
import { anyApi } from "convex/server";
import {
  LayoutDashboard,
  CalendarDays,
  ClipboardList,
  CarFront,
  LogOut,
  Plus,
  Search,
  X,
  CheckCircle2,
} from "lucide-react";
import "./styles.css";
const api = anyApi;
type RequestRow = {
  _id: string;
  kind: "estimate" | "appointment";
  name: string;
  email: string;
  phone: string;
  vehicle: string;
  duty: string;
  vehicleYear?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vin?: string;
  mileage?: string;
  issueArea?: string;
  issueType?: string;
  severity?: string;
  preferredContactMethod?: string;
  service: string;
  description: string;
  status: string;
  preferredDate?: string;
  preferredTime?: string;
  quoteMin?: number;
  quoteMax?: number;
  notes: { text: string; at: number }[];
  photoUrls: (string | null)[];
  createdAt: number;
};
type Vehicle = {
  _id?: string;
  year: number;
  make: string;
  model: string;
  price: number;
  mileage: number;
  description: string;
  status: string;
  photos: string[];
  photoUrls?: string[];
};
const statuses = [
  "new",
  "contacted",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
];
const pretty = (s: string) => s.replaceAll("_", " ");
const date = (n: number) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "America/New_York",
  }).format(n);
const dollars = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
function Brand() {
  return (
    <div className="brand">
      <img
        src={logoUrl}
        width="2170"
        height="725"
        alt="Botticello Auto Repair"
      />
      <small>SHOP MANAGEMENT</small>
    </div>
  );
}
function Login() {
  const { signIn } = useAuthActions();
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <div className="login">
      <section className="login-story">
        <Brand />
        <div>
          <h1>Manage the shop.</h1>
          <p>
            Your appointments, estimate requests, and vehicle listings. All in
            one place.
          </p>
        </div>
        <small>210 South Street · West Hartford, CT</small>
      </section>
      <section className="login-form">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            setBusy(true);
            setError("");
            try {
              await signIn("password", {
                email: String(data.get("email")).trim().toLowerCase(),
                password: String(data.get("password")),
                flow: "signIn",
              });
            } catch {
              setError("Unable to sign in. Check your email and password.");
            } finally {
              setBusy(false);
            }
          }}
        >
          <p className="eyebrow">BOTTICELLO ADMIN</p>
          <h2>Welcome back.</h2>
          <p className="muted">Sign in to manage the shop.</p>
          <label>
            Email address
            <input type="email" name="email" required autoComplete="username" />
          </label>
          <label>
            Password
            <input
              type="password"
              name="password"
              required
              autoComplete="current-password"
            />
          </label>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <button className="button" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
          <p className="hint">
            Staff access only. For login assistance, contact your website
            administrator.
          </p>
        </form>
      </section>
    </div>
  );
}
class Boundary extends Component<{ children: ReactNode }, { error: boolean }> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <div className="fallback">
        <h2>We couldn’t open the shop portal.</h2>
        <p>
          Your account may not have admin access, or the connection was
          interrupted.
        </p>
        <button onClick={() => location.reload()}>Try again</button>
        <SignOut />
      </div>
    ) : (
      this.props.children
    );
  }
}
function SignOut() {
  const { signOut } = useAuthActions();
  return (
    <button className="quiet" onClick={() => void signOut()}>
      <LogOut size={16} /> Sign out
    </button>
  );
}
function App() {
  const authorized = useQuery(api.admin.me);
  const rows = useQuery(api.requests.list) as RequestRow[] | undefined;
  const inventory = useQuery(api.inventory.list) as Vehicle[] | undefined;
  const [tab, setTab] = useState("Overview"),
    [search, setSearch] = useState(""),
    [filter, setFilter] = useState("all"),
    [selected, setSelected] = useState<RequestRow | null>(null),
    [vehicle, setVehicle] = useState<Vehicle | null>(null);
  if (!authorized || !rows || !inventory)
    return <div className="loading">Loading your shop…</div>;
  const fresh = rows.filter((r) => r.status === "new"),
    estimates = rows.filter((r) => r.kind === "estimate"),
    appointments = rows.filter((r) => r.kind === "appointment");
  const display = rows.filter(
    (r) =>
      (tab === "Estimates"
        ? r.kind === "estimate"
        : tab === "Appointments"
          ? r.kind === "appointment"
          : true) &&
      (filter === "all" || r.status === filter) &&
      `${r.name} ${r.vehicle} ${r.service} ${r.phone}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const nav = [
    ["Overview", LayoutDashboard],
    ["Appointments", CalendarDays],
    ["Estimates", ClipboardList],
    ["Vehicles", CarFront],
  ] as const;
  return (
    <div className="shell">
      <aside className="sidebar">
        <Brand />
        <p className="nav-label">WORKSPACE</p>
        <nav>
          {nav.map(([name, Icon]) => (
            <button
              key={name}
              className={tab === name ? "active" : ""}
              onClick={() => {
                setTab(name);
                setFilter("all");
                setSearch("");
              }}
            >
              <Icon size={18} />
              {name}
              {name === "Estimates" &&
                estimates.filter((r) => r.status === "new").length > 0 && (
                  <span className="count">
                    {estimates.filter((r) => r.status === "new").length}
                  </span>
                )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <p>
            WEST HARTFORD, CT
            <br />
            <span>Monday–Friday · 8 a.m.–5 p.m.</span>
          </p>
          <SignOut />
        </div>
      </aside>
      <div className="workspace">
        <header className="top">
          <span>
            Shop workspace <span className="slash">/</span> {tab}
          </span>
          <div className="top-actions">
            <span className="connected">
              <i /> Live updates
            </span>
            <SignOut />
          </div>
        </header>
        <main>
          <div className="page-title">
            <div>
              <p className="eyebrow">BOTTICELLO AUTO REPAIR</p>
              <h1>
                {tab === "Overview"
                  ? "Shop overview"
                  : tab === "Vehicles"
                    ? "Cars for sale."
                    : `${tab}.`}
              </h1>
              <p className="muted">
                {tab === "Overview"
                  ? "Review incoming requests and current vehicle listings."
                  : tab === "Vehicles"
                    ? "Create listings and control what customers see online."
                    : "Review requests, follow up, and keep work moving."}
              </p>
            </div>
            {tab === "Vehicles" && (
              <button
                className="button"
                onClick={() =>
                  setVehicle({
                    year: new Date().getFullYear(),
                    make: "",
                    model: "",
                    price: 0,
                    mileage: 0,
                    description: "",
                    status: "draft",
                    photos: [],
                  })
                }
              >
                <Plus size={16} /> Add vehicle
              </button>
            )}
          </div>
          {tab === "Overview" && (
            <>
              <div className="stats">
                <button
                  onClick={() => {
                    setFilter("new");
                    setTab("Estimates");
                  }}
                >
                  <span>NEW ESTIMATE REQUESTS</span>
                  <strong>
                    {estimates.filter((r) => r.status === "new").length}
                  </strong>
                  <small>Ready for your review</small>
                </button>
                <button onClick={() => setTab("Appointments")}>
                  <span>OPEN APPOINTMENTS</span>
                  <strong>
                    {
                      appointments.filter(
                        (r) => !["completed", "cancelled"].includes(r.status),
                      ).length
                    }
                  </strong>
                  <small>Requested and in progress</small>
                </button>
                <button onClick={() => setTab("Vehicles")}>
                  <span>VEHICLES FOR SALE</span>
                  <strong>
                    {inventory.filter((v) => v.status === "available").length}
                  </strong>
                  <small>Published on your website</small>
                </button>
              </div>
              <div className="attention">
                <div>
                  <h3>
                    {fresh.length
                      ? `${fresh.length} new request${fresh.length === 1 ? "" : "s"} to review.`
                      : "You’re all caught up."}
                  </h3>
                  <p>
                    {fresh.length
                      ? "Open a request below to review the details and plan your next step."
                      : "New online requests will appear here automatically."}
                  </p>
                </div>
              </div>
            </>
          )}
          {tab === "Vehicles" ? (
            <div className="vehicle-grid">
              {inventory.length ? (
                inventory.map((v) => (
                  <button
                    className="vehicle-card"
                    key={v._id}
                    onClick={() => setVehicle(v)}
                  >
                    {v.photoUrls?.[0] ? (
                      <img
                        src={v.photoUrls[0]}
                        alt={`${v.year} ${v.make} ${v.model}`}
                      />
                    ) : (
                      <div className="no-photo">
                        <CarFront size={42} />
                      </div>
                    )}
                    <div>
                      <span className={`badge ${v.status}`}>{v.status}</span>
                      <h3>
                        {v.year} {v.make} {v.model}
                      </h3>
                      <p>
                        {dollars(v.price)}{" "}
                        <span>· {v.mileage.toLocaleString()} mi</span>
                      </p>
                      <small>Edit listing</small>
                    </div>
                  </button>
                ))
              ) : (
                <Empty
                  title="No vehicle listings yet."
                  text="Add a vehicle, upload photos, and publish when it’s ready."
                />
              )}
            </div>
          ) : (
            <section className="panel">
              <div className="panel-head">
                <h2>
                  {tab === "Overview" ? "Recent requests" : `${tab} inbox`}
                </h2>
                <span>{display.length} requests</span>
              </div>
              <div className="tools">
                <label className="search">
                  <Search size={17} />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search name, vehicle, or service"
                    aria-label="Search requests"
                  />
                </label>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  aria-label="Filter status"
                >
                  <option value="all">All statuses</option>
                  {statuses.map((s) => (
                    <option key={s} value={s}>
                      {pretty(s)}
                    </option>
                  ))}
                </select>
              </div>
              {display.length ? (
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Customer / vehicle</th>
                        <th>Request</th>
                        <th>Status</th>
                        <th>Received</th>
                        <th>
                          <span className="sr-only">Open</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {display.map((r) => (
                        <tr key={r._id}>
                          <td>
                            <button
                              className="row-link"
                              onClick={() => setSelected(r)}
                            >
                              {r.name}
                              <small>{r.vehicle}</small>
                            </button>
                          </td>
                          <td>
                            {r.service}
                            <small>
                              {r.kind === "appointment"
                                ? `${r.preferredDate} · ${r.preferredTime}`
                                : "Estimate request"}
                            </small>
                          </td>
                          <td>
                            <span className={`badge ${r.status}`}>
                              {pretty(r.status)}
                            </span>
                          </td>
                          <td>{date(r.createdAt)}</td>
                          <td>
                            <button
                              className="icon-button"
                              onClick={() => setSelected(r)}
                              aria-label={`Open ${r.name}'s request`}
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Empty
                  title={
                    rows.length
                      ? "No requests match."
                      : "A fresh start for the shop."
                  }
                  text={
                    rows.length
                      ? "Try a different search or status."
                      : "Appointment and estimate requests from your website will appear here in real time."
                  }
                />
              )}
            </section>
          )}
        </main>
        <footer className="admin-footer">
          Botticello Auto Repair <span>Shop management</span>
        </footer>
      </div>
      {selected && (
        <RequestDetail
          key={selected._id}
          row={rows.find((r) => r._id === selected._id) ?? selected}
          close={() => setSelected(null)}
        />
      )}
      {vehicle && (
        <VehicleEditor
          key={vehicle._id ?? "new"}
          vehicle={vehicle}
          close={() => setVehicle(null)}
        />
      )}
    </div>
  );
}
function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className="empty">
      <CheckCircle2 size={30} />
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}
function Modal({
  title,
  children,
  close,
}: {
  title: string;
  children: ReactNode;
  close: () => void;
}) {
  const ref = React.useRef<HTMLDialogElement>(null);
  React.useEffect(() => {
    ref.current?.showModal();
    return () => ref.current?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      className="dialog"
    >
      <div className="modal-head">
        <h2>{title}</h2>
        <button
          className="icon-button"
          onClick={close}
          aria-label="Close dialog"
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
function RequestDetail({ row, close }: { row: RequestRow; close: () => void }) {
  const update = useMutation(api.requests.update),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [saved, setSaved] = useState(false);
  return (
    <Modal
      title={
        row.kind === "estimate" ? "Estimate request" : "Appointment request"
      }
      close={close}
    >
      <div className="detail">
        <p className="eyebrow">
          RECEIVED {date(row.createdAt)} · {row._id.slice(-8).toUpperCase()}
        </p>
        <h3>{row.name}</h3>
        <div className="contact-links">
          <a href={`tel:${row.phone.replace(/[^+\d]/g, "")}`}>{row.phone}</a>
          <a href={`mailto:${row.email}`}>{row.email}</a>
        </div>
        <dl>
          <dt>Vehicle</dt>
          <dd>
            {row.vehicle} · {row.duty} duty
          </dd>
          {row.vin && (
            <>
              <dt>VIN</dt>
              <dd>{row.vin}</dd>
            </>
          )}
          {row.mileage && (
            <>
              <dt>Mileage</dt>
              <dd>{Number(row.mileage).toLocaleString()} miles</dd>
            </>
          )}
          {row.issueArea && (
            <>
              <dt>Issue area</dt>
              <dd>{row.issueArea}</dd>
            </>
          )}
          {row.issueType && (
            <>
              <dt>Issue type</dt>
              <dd>{row.issueType}</dd>
            </>
          )}
          {row.severity && (
            <>
              <dt>Severity</dt>
              <dd>{row.severity}</dd>
            </>
          )}
          {row.preferredContactMethod && (
            <>
              <dt>Contact by</dt>
              <dd>{row.preferredContactMethod}</dd>
            </>
          )}
          <dt>Service</dt>
          <dd>{row.service}</dd>
          {row.preferredDate && (
            <>
              <dt>Requested visit</dt>
              <dd>
                {row.preferredDate} · {row.preferredTime} (Eastern)
              </dd>
            </>
          )}
          <dt>Customer details</dt>
          <dd className="pre-wrap">
            {row.description || "No additional details."}
          </dd>
        </dl>
        {row.photoUrls.length > 0 && (
          <div className="photos">
            {row.photoUrls.map(
              (url, i) =>
                url && (
                  <a key={url} href={url} target="_blank" rel="noreferrer">
                    <img src={url} alt={`Customer photo ${i + 1}`} />
                  </a>
                ),
            )}
          </div>
        )}
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            setSaved(false);
            const d = new FormData(e.currentTarget);
            try {
              await update({
                id: row._id,
                status: d.get("status"),
                note: d.get("note") || undefined,
                quoteMin:
                  d.get("quoteMin") !== "" && d.has("quoteMin")
                    ? Number(d.get("quoteMin"))
                    : undefined,
                quoteMax:
                  d.get("quoteMax") !== "" && d.has("quoteMax")
                    ? Number(d.get("quoteMax"))
                    : undefined,
              });
              (e.target as HTMLFormElement).elements.namedItem(
                "note",
              ) instanceof HTMLTextAreaElement &&
                ((
                  e.target as HTMLFormElement
                ).querySelector<HTMLTextAreaElement>("[name=note]")!.value =
                  "");
              setSaved(true);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Unable to save.");
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            Status
            <select name="status" defaultValue={row.status}>
              {statuses.map((s) => (
                <option value={s} key={s}>
                  {pretty(s)}
                </option>
              ))}
            </select>
          </label>
          {row.kind === "estimate" && (
            <div className="form-grid">
              <label>
                Estimate minimum ($)
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="quoteMin"
                  defaultValue={row.quoteMin}
                />
              </label>
              <label>
                Estimate maximum ($)
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="quoteMax"
                  defaultValue={row.quoteMax}
                />
              </label>
            </div>
          )}
          <label>
            Internal note
            <textarea
              name="note"
              maxLength={2000}
              placeholder="Add a follow-up, inspection detail, or next step."
            />
          </label>
          <p className="hint">
            Status updates and quotes are internal. Contact the customer to
            confirm appointments or share pricing.
          </p>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          {saved && (
            <p className="saved" role="status">
              Changes saved.
            </p>
          )}
          <button className="button" disabled={busy}>
            {busy ? "Saving…" : "Save changes"}
          </button>
        </form>
        {row.notes.length > 0 && (
          <div className="notes">
            <h4>Activity notes</h4>
            {[...row.notes].reverse().map((n, i) => (
              <article key={i}>
                <span>{date(n.at)}</span>
                <p>{n.text}</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
function VehicleEditor({
  vehicle,
  close,
}: {
  vehicle: Vehicle;
  close: () => void;
}) {
  const save = useMutation(api.inventory.save),
    uploadUrl = useMutation(api.inventory.uploadUrl),
    [photos, setPhotos] = useState(vehicle.photos),
    [urls, setUrls] = useState(vehicle.photoUrls ?? []),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function upload(files: File[]) {
    setError("");
    if (
      photos.length + files.length > 6 ||
      files.some(
        (f) =>
          f.size > 8 * 1024 * 1024 ||
          !["image/jpeg", "image/png", "image/webp"].includes(f.type),
      )
    ) {
      setError("Use up to six JPEG, PNG, or WebP photos under 8 MB.");
      return;
    }
    setBusy(true);
    try {
      for (const file of files) {
        const url = await uploadUrl({});
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });
        if (!response.ok) throw new Error("Photo upload failed.");
        const { storageId } = await response.json();
        setPhotos((p) => [...p, storageId]);
        setUrls((p) => [...p, URL.createObjectURL(file)]);
      }
    } catch {
      setError("A photo did not upload. Try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title={vehicle._id ? "Edit vehicle" : "Add a vehicle"} close={close}>
      <form
        className="detail"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          const d = new FormData(e.currentTarget);
          try {
            await save({
              id: vehicle._id,
              year: Number(d.get("year")),
              make: d.get("make"),
              model: d.get("model"),
              price: Number(d.get("price")),
              mileage: Number(d.get("mileage")),
              status: d.get("status"),
              description: d.get("description"),
              photos,
            });
            close();
          } catch (err) {
            setError(
              err instanceof Error ? err.message : "Unable to save vehicle.",
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="form-grid">
          <label>
            Year
            <input
              name="year"
              type="number"
              required
              min="1900"
              max={new Date().getFullYear() + 2}
              defaultValue={vehicle.year}
            />
          </label>
          <label>
            Make
            <input
              name="make"
              required
              maxLength={60}
              defaultValue={vehicle.make}
            />
          </label>
          <label>
            Model
            <input
              name="model"
              required
              maxLength={100}
              defaultValue={vehicle.model}
            />
          </label>
          <label>
            Status
            <select name="status" defaultValue={vehicle.status}>
              {["draft", "available", "sold", "archived"].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label>
            Price ($)
            <input
              name="price"
              type="number"
              min="0"
              step="0.01"
              required
              defaultValue={vehicle.price}
            />
            <small>Use 0 to show “Call for price”.</small>
          </label>
          <label>
            Mileage
            <input
              name="mileage"
              type="number"
              min="0"
              required
              defaultValue={vehicle.mileage}
            />
          </label>
        </div>
        <label>
          Description
          <textarea
            name="description"
            maxLength={6000}
            defaultValue={vehicle.description}
          />
        </label>
        <label>
          Photos
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            disabled={busy}
            onChange={(e) => {
              void upload([...(e.target.files ?? [])]);
              e.target.value = "";
            }}
          />
          <small>Up to six photos. First photo is the cover.</small>
        </label>
        <div className="photos">
          {photos.map((id, i) => (
            <div key={id}>
              <img src={urls[i]} alt={`Vehicle photo ${i + 1}`} />
              <button
                type="button"
                className="quiet"
                disabled={busy}
                onClick={() => {
                  setPhotos((p) => p.filter((_, j) => i !== j));
                  setUrls((p) => p.filter((_, j) => i !== j));
                }}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <p className="hint">
          Only vehicles marked “available” appear on the public website.
        </p>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button className="button" disabled={busy}>
          {busy ? "Working…" : "Save vehicle"}
        </button>
      </form>
    </Modal>
  );
}
const url = import.meta.env.VITE_CONVEX_URL;
createRoot(document.getElementById("root")!).render(
  url ? (
    <React.StrictMode>
      <ConvexAuthProvider client={new ConvexReactClient(url)}>
        <Boundary>
          <AuthLoading>
            <div className="loading">Connecting…</div>
          </AuthLoading>
          <Unauthenticated>
            <Login />
          </Unauthenticated>
          <Authenticated>
            <App />
          </Authenticated>
        </Boundary>
      </ConvexAuthProvider>
    </React.StrictMode>
  ) : (
    <div className="fallback">
      Configure VITE_CONVEX_URL to connect the shop portal.
    </div>
  ),
);
