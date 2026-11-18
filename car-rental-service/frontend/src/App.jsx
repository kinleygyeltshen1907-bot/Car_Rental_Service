import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  CarFront, Search, Menu, X, UserRound, LayoutDashboard, CalendarDays,
  CreditCard, LogOut, Plus, Pencil, Trash2, Users, Gauge, CheckCircle2,
  Clock3, MapPin, Star, ArrowRight, ShieldCheck, Fuel, Settings2, Filter,
  FileText, Wallet, CircleDollarSign
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const api = axios.create({ baseURL: API });
api.interceptors.request.use(config => {
  const token = localStorage.getItem('crs_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
const money = n => `Nu. ${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const dateText = s => s ? new Date(`${String(s).slice(0,10)}T00:00:00`).toLocaleDateString() : '—';
const errorText = e => e.response?.data?.message || 'Something went wrong. Please try again.';
const blankCar = { name:'',brand:'',model:'',category:'SUV',registration_no:'',year:'2024',seats:5,fuel_type:'Petrol',transmission:'Automatic',price_per_day:'',image_url:'',description:'' };

export default function App() {
  const [user,setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('crs_user')); } catch { return null; }
  });
  const [page,setPage] = useState('home');
  const [cars,setCars] = useState([]);
  const [search,setSearch] = useState('');
  const [category,setCategory] = useState('');
  const [notice,setNotice] = useState('');
  const [busy,setBusy] = useState(false);
  const [authMode,setAuthMode] = useState('login');
  const [authOpen,setAuthOpen] = useState(false);
  const [selectedCar,setSelectedCar] = useState(null);
  const [mobileNav,setMobileNav] = useState(false);

  const flash = message => { setNotice(message); window.setTimeout(() => setNotice(''), 4200); };
  const loadCars = async () => {
    try { const {data} = await api.get('/cars', { params:{ search, category } }); setCars(data); }
    catch(e) { flash(errorText(e)); }
  };
  useEffect(() => { loadCars(); }, [search,category]);
  useEffect(() => {
    if (user?.role === 'admin' && page === 'dashboard') setPage('admin');
  }, [user]);

  const logout = () => {
    localStorage.removeItem('crs_token'); localStorage.removeItem('crs_user');
    setUser(null); setPage('home'); flash('You have been logged out.');
  };
  const onAuth = async payload => {
    setBusy(true);
    try {
      if (authMode === 'register') {
        await api.post('/auth/register', payload);
        flash('Account created. Please log in.');
        setAuthMode('login');
      } else {
        const {data} = await api.post('/auth/login', payload);
        localStorage.setItem('crs_token', data.token);
        localStorage.setItem('crs_user', JSON.stringify(data.user));
        setUser(data.user); setAuthOpen(false);
        setPage(data.user.role === 'admin' ? 'admin' : 'dashboard');
        flash(`Welcome, ${data.user.name}!`);
      }
    } catch(e) { flash(errorText(e)); }
    finally { setBusy(false); }
  };

  const openBooking = car => {
    if (!user) { setSelectedCar(car); setAuthOpen(true); setAuthMode('login'); return; }
    setSelectedCar(car); setPage('booking');
  };

  return <div className="app-shell">
    <header className="topbar">
      <button className="brand" onClick={() => setPage('home')}><span className="brand-icon"><CarFront size={25}/></span><span>CRS<span className="brand-dot">.</span><small>CAR RENTAL SERVICE</small></span></button>
      <nav className={mobileNav ? 'nav-links open' : 'nav-links'}>
        <button onClick={() => {setPage('home');setMobileNav(false)}} className={page==='home'?'active':''}>Home</button>
        <button onClick={() => {setPage('cars');setMobileNav(false)}} className={page==='cars'?'active':''}>Explore Cars</button>
        {user && <button onClick={() => {setPage(user.role==='admin'?'admin':'dashboard');setMobileNav(false)}}>Dashboard</button>}
      </nav>
      <div className="top-actions">
        {user ? <><span className="user-greeting">Hi, {user.name.split(' ')[0]}</span><button className="btn btn-dark btn-small" onClick={logout}><LogOut size={15}/> Logout</button></>
          : <><button className="btn btn-ghost btn-small" onClick={() => {setAuthMode('login');setAuthOpen(true)}}>Log in</button><button className="btn btn-primary btn-small" onClick={() => {setAuthMode('register');setAuthOpen(true)}}>Create account</button></>}
      </div>
      <button className="mobile-toggle" onClick={() => setMobileNav(!mobileNav)}>{mobileNav?<X/>:<Menu/>}</button>
    </header>

    {notice && <div className="toast"><CheckCircle2 size={17}/>{notice}<button onClick={()=>setNotice('')}><X size={15}/></button></div>}

    {page==='home' && <Home cars={cars.slice(0,3)} onExplore={()=>setPage('cars')} onBook={openBooking}/>}
    {page==='cars' && <CarsPage cars={cars} search={search} setSearch={setSearch} category={category} setCategory={setCategory} onBook={openBooking}/>}
    {page==='booking' && selectedCar && <BookingPage car={selectedCar} onBack={()=>setPage('cars')} onDone={msg=>{flash(msg);setPage('dashboard')}}/>}
    {page==='dashboard' && user && <CustomerDashboard user={user} flash={flash}/>}
    {page==='admin' && user?.role==='admin' && <AdminDashboard flash={flash}/>}
    {page==='admin' && user?.role!=='admin' && <Home cars={cars.slice(0,3)} onExplore={()=>setPage('cars')} onBook={openBooking}/>}
    <Footer/>
    {authOpen && <AuthModal mode={authMode} setMode={setAuthMode} onClose={()=>setAuthOpen(false)} onSubmit={onAuth} busy={busy}/>}
  </div>;
}

function Home({cars,onExplore,onBook}) {
  return <>
    <section className="hero">
      <div className="hero-overlay"></div>
      <div className="hero-content">
        <div className="eyebrow"><span></span> YOUR JOURNEY, OUR PRIORITY</div>
        <h1>Go further.<br/><em>Feel the freedom.</em></h1>
        <p>Find the right ride for every road. Explore our vehicles and make your next journey in Bhutan unforgettable.</p>
        <div className="hero-buttons"><button className="btn btn-primary btn-large" onClick={onExplore}>Explore vehicles <ArrowRight size={18}/></button><span className="hero-note"><ShieldCheck size={17}/> Simple. Reliable. Convenient.</span></div>
      </div>
      <div className="hero-bottom"><span>01 — DISCOVER YOUR NEXT DRIVE</span><span>THIMPHU · BHUTAN</span></div>
    </section>
    <section className="trust-strip">
      <div><CarFront/><span><b>Quality vehicles</b><small>Well-maintained fleet</small></span></div>
      <div><ShieldCheck/><span><b>Reliable service</b><small>Booking you can trust</small></span></div>
      <div><Wallet/><span><b>Clear pricing</b><small>No hidden daily rates</small></span></div>
      <div><MapPin/><span><b>Flexible locations</b><small>Pickup and drop-off</small></span></div>
    </section>
    <section className="section featured-section">
      <div className="section-heading"><div><div className="eyebrow dark-eyebrow">FIND YOUR RIDE</div><h2>Ready for the road.</h2><p>Choose a vehicle that fits your plans.</p></div><button className="text-link" onClick={onExplore}>View all vehicles <ArrowRight size={17}/></button></div>
      <div className="car-grid">{cars.map(car=><CarCard key={car.id} car={car} onBook={onBook}/>)}</div>
      {!cars.length && <p className="empty-state">No vehicles have been added yet. Please check back soon.</p>}
    </section>
    <section className="journey-band"><div><div className="eyebrow">HOW IT WORKS</div><h2>Your next journey,<br/>in three simple steps.</h2></div><div className="steps"><div><b>01</b><strong>Choose a car</strong><span>Browse our available vehicles.</span></div><div><b>02</b><strong>Book your dates</strong><span>Set your pickup and return details.</span></div><div><b>03</b><strong>Enjoy the journey</strong><span>Wait for confirmation and get moving.</span></div></div></section>
  </>;
}

function CarCard({car,onBook}) {
  return <article className="car-card">
    <div className="car-image"><img src={car.image_url || 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1000'} alt={car.name} onError={e=>e.currentTarget.src='https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1000'}/><span className="car-category">{car.category}</span></div>
    <div className="car-info"><div className="car-title-row"><div><h3>{car.name}</h3><span>{car.brand} · {car.year || '—'}</span></div><div className="price">{money(car.price_per_day)}<small>/ day</small></div></div>
      <div className="car-specs"><span><UserRound size={15}/> {car.seats} seats</span><span><Fuel size={15}/> {car.fuel_type}</span><span><Settings2 size={15}/> {car.transmission}</span></div>
      <button className="btn btn-outline full-width" onClick={()=>onBook(car)}>Book this vehicle <ArrowRight size={16}/></button>
    </div>
  </article>;
}

function CarsPage({cars,search,setSearch,category,setCategory,onBook}) {
  return <main className="page-wrap"><div className="page-title"><div className="eyebrow dark-eyebrow">OUR FLEET</div><h1>Find your perfect ride.</h1><p>Compare vehicles, explore your options and choose the right car for your journey.</p></div>
    <div className="filter-bar"><div className="search-field"><Search size={18}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by car name or brand..."/></div><div className="select-field"><Filter size={17}/><select value={category} onChange={e=>setCategory(e.target.value)}><option value="">All categories</option>{['SUV','Sedan','Hatchback','Van','Luxury'].map(c=><option key={c}>{c}</option>)}</select></div></div>
    <div className="results-line">{cars.length} vehicle{cars.length===1?'':'s'} available</div>
    <div className="car-grid">{cars.map(car=><CarCard key={car.id} car={car} onBook={onBook}/>)}</div>
    {!cars.length && <div className="empty-state">No matching vehicles found. Try another search or category.</div>}
  </main>;
}

function AuthModal({mode,setMode,onClose,onSubmit,busy}) {
  const [form,setForm]=useState({full_name:'',email:'',phone:'',password:''});
  const change=e=>setForm({...form,[e.target.name]:e.target.value});
  const submit=e=>{e.preventDefault();onSubmit(form)};
  return <div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&onClose()}><div className="modal auth-modal"><button className="modal-close" onClick={onClose}><X/></button><div className="modal-brand"><CarFront size={26}/></div><div className="eyebrow dark-eyebrow">{mode==='login'?'WELCOME BACK':'GET STARTED'}</div><h2>{mode==='login'?'Log in to CRS':'Create your account'}</h2><p>{mode==='login'?'Access your bookings and manage your journeys.':'Join us and book your next journey with confidence.'}</p>
    <form onSubmit={submit} className="form-stack">
      {mode==='register' && <><label>Full name<input name="full_name" value={form.full_name} onChange={change} required placeholder="Your full name"/></label><label>Phone number<input name="phone" value={form.phone} onChange={change} required placeholder="+975 ..."/></label></>}
      <label>Email address<input name="email" type="email" value={form.email} onChange={change} required placeholder="you@example.com"/></label>
      <label>Password<input name="password" type="password" value={form.password} onChange={change} required minLength="8" placeholder="At least 8 characters"/></label>
      <button className="btn btn-primary full-width btn-large" disabled={busy}>{busy?'Please wait...':mode==='login'?'Log in':'Create account'} <ArrowRight size={17}/></button>
    </form>
    <div className="auth-switch">{mode==='login'?"Don't have an account?":"Already registered?"} <button onClick={()=>setMode(mode==='login'?'register':'login')}>{mode==='login'?'Create account':'Log in'}</button></div>
  </div></div>;
}

function BookingPage({car,onBack,onDone}) {
  const [form,setForm]=useState({pickup_date:'',return_date:'',pickup_location:'',dropoff_location:'',payment_method:'cash'});
  const [busy,setBusy]=useState(false);
  const days=form.pickup_date&&form.return_date ? Math.max(0,Math.ceil((new Date(form.return_date)-new Date(form.pickup_date))/86400000)) : 0;
  const total=days*Number(car.price_per_day);
  const change=e=>setForm({...form,[e.target.name]:e.target.value});
  const submit=async e=>{e.preventDefault();setBusy(true);try{const {data}=await api.post('/bookings',{...form,vehicle_id:car.id});onDone(`${data.message} Estimated total: ${money(data.total_amount)}.`)}catch(e){alert(errorText(e))}finally{setBusy(false)}};
  return <main className="page-wrap narrow"><button className="back-link" onClick={onBack}>← Back to vehicles</button><div className="page-title"><div className="eyebrow dark-eyebrow">RESERVE YOUR VEHICLE</div><h1>Complete your booking.</h1><p>Provide your rental dates and pickup information.</p></div>
    <div className="booking-layout"><div className="panel"><div className="panel-heading"><h2>Rental details</h2><span>01 / 02</span></div><form className="form-stack" onSubmit={submit}>
      <div className="form-two"><label>Pickup date<input type="date" name="pickup_date" min={new Date().toISOString().slice(0,10)} value={form.pickup_date} onChange={change} required/></label><label>Return date<input type="date" name="return_date" min={form.pickup_date || new Date().toISOString().slice(0,10)} value={form.return_date} onChange={change} required/></label></div>
      <label>Pickup location<input name="pickup_location" value={form.pickup_location} onChange={change} placeholder="e.g. Thimphu town" required/></label>
      <label>Drop-off location<input name="dropoff_location" value={form.dropoff_location} onChange={change} placeholder="e.g. Paro Airport" required/></label>
      <label>Preferred payment method<select name="payment_method" value={form.payment_method} onChange={change}><option value="cash">Cash</option><option value="bank_transfer">Bank transfer</option><option value="online">Online (record only)</option></select></label>
      <p className="helper-text">Payment is recorded as pending. This demo does not charge a card or connect to a payment gateway.</p>
      <button className="btn btn-primary btn-large full-width" disabled={busy}>{busy?'Submitting...':'Submit booking request'} <ArrowRight size={17}/></button>
    </form></div><aside className="panel booking-summary"><img src={car.image_url} alt={car.name}/><div className="eyebrow dark-eyebrow">YOUR VEHICLE</div><h3>{car.name}</h3><p>{car.brand} · {car.category}</p><div className="summary-row"><span>Daily rate</span><b>{money(car.price_per_day)}</b></div><div className="summary-row"><span>Rental duration</span><b>{days} day(s)</b></div><div className="summary-total"><span>Estimated total</span><b>{money(total)}</b></div></aside></div>
  </main>;
}

function CustomerDashboard({user,flash}) {
  const [tab,setTab]=useState('overview'),[bookings,setBookings]=useState([]),[loading,setLoading]=useState(true);
  const load=async()=>{try{const {data}=await api.get('/bookings/mine');setBookings(data)}catch(e){flash(errorText(e))}finally{setLoading(false)}};
  useEffect(()=>{load()},[]);
  const cancel=async id=>{if(!confirm('Cancel this pending booking?'))return;try{await api.patch(`/bookings/${id}/cancel`);flash('Booking cancelled.');load()}catch(e){flash(errorText(e))}};
  const paid=bookings.filter(b=>b.payment_status==='paid').length;
  return <main className="dashboard-wrap"><aside className="side-nav"><div className="side-user"><div className="avatar">{user.name.slice(0,1).toUpperCase()}</div><b>{user.name}</b><small>Customer account</small></div>{[['overview','Overview',LayoutDashboard],['bookings','My bookings',CalendarDays],['payments','Payments',CreditCard]].map(([id,label,Icon])=><button key={id} className={tab===id?'selected':''} onClick={()=>setTab(id)}><Icon size={18}/>{label}</button>)}</aside>
    <section className="dashboard-main"><div className="dashboard-heading"><div><div className="eyebrow dark-eyebrow">CUSTOMER PORTAL</div><h1>{tab==='overview'?'Your dashboard':tab==='bookings'?'Your bookings':'Payment history'}</h1><p>Welcome back, {user.name}. Here is your rental activity.</p></div></div>
      {tab==='overview' && <><div className="stats-grid"><Stat icon={CalendarDays} label="Total bookings" value={bookings.length}/><Stat icon={Clock3} label="Pending" value={bookings.filter(b=>b.status==='pending').length}/><Stat icon={CheckCircle2} label="Confirmed" value={bookings.filter(b=>b.status==='confirmed').length}/><Stat icon={CreditCard} label="Paid payments" value={paid}/></div><div className="panel"><div className="panel-heading"><h2>Recent bookings</h2><button className="text-link" onClick={()=>setTab('bookings')}>View all <ArrowRight size={15}/></button></div><BookingTable bookings={bookings.slice(0,5)} onCancel={cancel}/></div></>}
      {tab==='bookings' && <div className="panel"><BookingTable bookings={bookings} onCancel={cancel}/></div>}
      {tab==='payments' && <div className="panel"><PaymentTable bookings={bookings}/></div>}
      {loading&&<p className="helper-text">Loading your information...</p>}
    </section>
  </main>;
}

function Stat({icon:Icon,label,value}) { return <div className="stat-card"><div className="stat-icon"><Icon size={20}/></div><span>{label}</span><b>{value}</b></div>; }
function Status({value}) { return <span className={`status status-${value}`}>{value}</span>; }
function BookingTable({bookings,onCancel}) {
  if(!bookings.length)return <div className="empty-state">No bookings yet. Explore vehicles to make your first reservation.</div>;
  return <div className="table-scroll"><table><thead><tr><th>Booking</th><th>Vehicle</th><th>Rental dates</th><th>Total</th><th>Status</th><th>Action</th></tr></thead><tbody>{bookings.map(b=><tr key={b.id}><td>#{b.id}</td><td>{b.vehicle_name}</td><td>{dateText(b.pickup_date)} – {dateText(b.return_date)}</td><td>{money(b.total_amount)}</td><td><Status value={b.status}/></td><td>{b.status==='pending'?<button className="table-action danger" onClick={()=>onCancel(b.id)}>Cancel</button>:'—'}</td></tr>)}</tbody></table></div>;
}
function PaymentTable({bookings}) {
  if(!bookings.length)return <div className="empty-state">No payment records yet.</div>;
  return <div className="table-scroll"><table><thead><tr><th>Booking</th><th>Vehicle</th><th>Amount</th><th>Method</th><th>Payment status</th></tr></thead><tbody>{bookings.map(b=><tr key={b.id}><td>#{b.id}</td><td>{b.vehicle_name}</td><td>{money(b.total_amount)}</td><td>{b.payment_method?.replace('_',' ')||'—'}</td><td><Status value={b.payment_status||'pending'}/></td></tr>)}</tbody></table></div>;
}

function AdminDashboard({flash}) {
  const [tab,setTab]=useState('overview'),[overview,setOverview]=useState(null),[cars,setCars]=useState([]),[bookings,setBookings]=useState([]),[customers,setCustomers]=useState([]),[payments,setPayments]=useState([]),[reports,setReports]=useState(null);
  const [carModal,setCarModal]=useState(false),[editing,setEditing]=useState(null),[carForm,setCarForm]=useState(blankCar);
  const load=async()=>{
    try{
      const [o,c,b,u,p,r]=await Promise.all([api.get('/admin/overview'),api.get('/cars/admin/all'),api.get('/bookings/admin/all'),api.get('/admin/customers'),api.get('/admin/payments'),api.get('/admin/reports')]);
      setOverview(o.data);setCars(c.data);setBookings(b.data);setCustomers(u.data);setPayments(p.data);setReports(r.data);
    }catch(e){flash(errorText(e))}
  };
  useEffect(()=>{load()},[]);
  const updateBooking=async(id,status)=>{try{await api.patch(`/bookings/admin/${id}/status`,{status});flash('Booking updated.');load()}catch(e){flash(errorText(e))}};
  const markPaid=async id=>{try{await api.patch(`/admin/payments/${id}/paid`);flash('Payment marked as paid.');load()}catch(e){flash(errorText(e))}};
  const openCar=car=>{setEditing(car?.id||null);setCarForm(car?{...car}:blankCar);setCarModal(true)};
  const saveCar=async e=>{e.preventDefault();try{if(editing)await api.put(`/cars/${editing}`,carForm);else await api.post('/cars',carForm);flash(editing?'Vehicle updated.':'Vehicle added.');setCarModal(false);load()}catch(e){flash(errorText(e))}};
  const retire=async id=>{if(!confirm('Retire this vehicle? Historical booking records will remain.'))return;try{await api.delete(`/cars/${id}`);flash('Vehicle retired.');load()}catch(e){flash(errorText(e))}};
  const tabs=[['overview','Overview',LayoutDashboard],['vehicles','Vehicles',CarFront],['bookings','Bookings',CalendarDays],['customers','Customers',Users],['payments','Payments',CreditCard],['reports','Reports',FileText]];
  return <main className="dashboard-wrap admin-layout"><aside className="side-nav"><div className="admin-mark"><ShieldCheck size={22}/><span><b>ADMIN PANEL</b><small>CRS MANAGEMENT</small></span></div>{tabs.map(([id,label,Icon])=><button key={id} className={tab===id?'selected':''} onClick={()=>setTab(id)}><Icon size={18}/>{label}</button>)}</aside>
    <section className="dashboard-main"><div className="dashboard-heading"><div><div className="eyebrow dark-eyebrow">SYSTEM ADMINISTRATION</div><h1>{tabs.find(t=>t[0]===tab)[1]}</h1><p>Manage your fleet, customers, reservations and payments.</p></div>{tab==='vehicles'&&<button className="btn btn-primary" onClick={()=>openCar(null)}><Plus size={17}/> Add vehicle</button>}</div>
      {tab==='overview'&&overview&&<><div className="stats-grid"><Stat icon={Users} label="Customers" value={overview.customers}/><Stat icon={CarFront} label="Total vehicles" value={overview.vehicles}/><Stat icon={CalendarDays} label="Bookings" value={overview.bookings}/><Stat icon={CircleDollarSign} label="Paid revenue" value={money(overview.revenue)}/></div><div className="stats-grid secondary-stats"><Stat icon={CheckCircle2} label="Available vehicles" value={overview.available}/><Stat icon={Clock3} label="Pending bookings" value={overview.pending}/></div><div className="panel"><div className="panel-heading"><h2>Latest reservations</h2><button className="text-link" onClick={()=>setTab('bookings')}>All bookings <ArrowRight size={15}/></button></div><div className="table-scroll"><table><thead><tr><th>Booking</th><th>Customer</th><th>Vehicle</th><th>Dates</th><th>Amount</th><th>Status</th></tr></thead><tbody>{overview.recent.map(b=><tr key={b.id}><td>#{b.id}</td><td>{b.customer_name}</td><td>{b.vehicle_name}</td><td>{dateText(b.pickup_date)} – {dateText(b.return_date)}</td><td>{money(b.total_amount)}</td><td><Status value={b.status}/></td></tr>)}</tbody></table></div></div></>}
      {tab==='vehicles'&&<div className="panel"><div className="table-scroll"><table><thead><tr><th>Vehicle</th><th>Registration</th><th>Category</th><th>Daily rate</th><th>Status</th><th>Actions</th></tr></thead><tbody>{cars.map(c=><tr key={c.id}><td><b>{c.name}</b><small className="cell-sub">{c.brand} {c.model}</small></td><td>{c.registration_no}</td><td>{c.category}</td><td>{money(c.price_per_day)}</td><td><Status value={c.status}/></td><td className="actions-cell"><button className="icon-action" onClick={()=>openCar(c)} title="Edit"><Pencil size={16}/></button><button className="icon-action danger" onClick={()=>retire(c.id)} title="Retire"><Trash2 size={16}/></button></td></tr>)}</tbody></table></div></div>}
      {tab==='bookings'&&<div className="panel"><div className="table-scroll"><table><thead><tr><th>ID</th><th>Customer</th><th>Vehicle</th><th>Dates</th><th>Total</th><th>Status</th><th>Update</th></tr></thead><tbody>{bookings.map(b=><tr key={b.id}><td>#{b.id}</td><td>{b.customer_name}<small className="cell-sub">{b.email}</small></td><td>{b.vehicle_name}</td><td>{dateText(b.pickup_date)} – {dateText(b.return_date)}</td><td>{money(b.total_amount)}</td><td><Status value={b.status}/></td><td><select className="compact-select" value={b.status} onChange={e=>updateBooking(b.id,e.target.value)}>{['pending','confirmed','cancelled','completed'].map(s=><option key={s}>{s}</option>)}</select></td></tr>)}</tbody></table></div></div>}
      {tab==='customers'&&<div className="panel"><div className="table-scroll"><table><thead><tr><th>Customer</th><th>Email</th><th>Phone</th><th>Joined</th><th>Bookings</th></tr></thead><tbody>{customers.map(c=><tr key={c.id}><td>{c.full_name}</td><td>{c.email}</td><td>{c.phone}</td><td>{dateText(c.created_at)}</td><td>{c.bookings}</td></tr>)}</tbody></table></div></div>}
      {tab==='payments'&&<div className="panel"><div className="table-scroll"><table><thead><tr><th>Payment</th><th>Booking</th><th>Customer</th><th>Amount</th><th>Method</th><th>Status</th><th>Action</th></tr></thead><tbody>{payments.map(p=><tr key={p.id}><td>#{p.id}</td><td>#{p.booking_id}</td><td>{p.customer_name}</td><td>{money(p.amount)}</td><td>{p.method.replace('_',' ')}</td><td><Status value={p.status}/></td><td>{p.status==='pending'?<button className="table-action" onClick={()=>markPaid(p.id)}>Mark paid</button>:'—'}</td></tr>)}</tbody></table></div></div>}
      {tab==='reports'&&reports&&<div className="report-grid"><div className="panel"><h2>Monthly paid revenue</h2>{reports.monthly.length?reports.monthly.map(m=><div className="report-row" key={m.month}><span>{m.month}</span><b>{money(m.revenue)}</b></div>):<p className="empty-state">No completed payment records yet.</p>}</div><div className="panel"><h2>Most rented vehicles</h2>{reports.popular.map((p,i)=><div className="report-row" key={p.name}><span>{i+1}. {p.name}</span><b>{p.rentals} rentals</b></div>)}</div></div>}
    </section>
    {carModal&&<div className="modal-backdrop"><div className="modal car-modal"><button className="modal-close" onClick={()=>setCarModal(false)}><X/></button><h2>{editing?'Update vehicle':'Add new vehicle'}</h2><p>Enter accurate vehicle information for customers.</p><form className="form-stack" onSubmit={saveCar}><div className="form-two">{[['name','Vehicle name'],['brand','Brand'],['model','Model'],['registration_no','Registration number'],['category','Category'],['year','Year'],['seats','Seats'],['fuel_type','Fuel type'],['transmission','Transmission'],['price_per_day','Price per day (Nu.)']].map(([key,label])=><label key={key}>{label}<input required={['name','brand','model','registration_no','price_per_day'].includes(key)} type={['year','seats','price_per_day'].includes(key)?'number':'text'} value={carForm[key]??''} onChange={e=>setCarForm({...carForm,[key]:e.target.value})}/></label>)}</div><label>Image URL<input value={carForm.image_url||''} onChange={e=>setCarForm({...carForm,image_url:e.target.value})}/></label><label>Description<textarea rows="3" value={carForm.description||''} onChange={e=>setCarForm({...carForm,description:e.target.value})}/></label>{editing&&<label>Status<select value={carForm.status} onChange={e=>setCarForm({...carForm,status:e.target.value})}><option>available</option><option>maintenance</option><option>inactive</option></select></label>}<button className="btn btn-primary btn-large full-width">{editing?'Save changes':'Add vehicle'}</button></form></div></div>}
  </main>;
}

function Footer(){return <footer className="footer"><div className="brand footer-brand"><span className="brand-icon"><CarFront size={23}/></span><span>CRS<span className="brand-dot">.</span><small>CAR RENTAL SERVICE</small></span></div><p>Your Journey, Our Priority.</p><span>© {new Date().getFullYear()} Car Rental Service · Bhutan</span></footer>}
