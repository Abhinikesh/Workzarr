import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

// ── Service Data ────────────────────────────────────────────
const CATEGORIES = [
  { icon: '⚡', label: 'Electrician', slug: 'electrician', bg: '#FFF0EB' },
  { icon: '🔧', label: 'Plumber', slug: 'plumber', bg: '#EBF5FF' },
  { icon: '❄️', label: 'AC Repair', slug: 'ac-repair', bg: '#E6FCFF' },
  { icon: '🪚', label: 'Carpenter', slug: 'carpenter', bg: '#FFFBE6' },
  { icon: '🧹', label: 'Cleaner', slug: 'cleaner', bg: '#E6FFFA' },
  { icon: '🎨', label: 'Painter', slug: 'painter', bg: '#FFF0F5' },
  { icon: '📚', label: 'Tutor', slug: 'tutor', bg: '#F0F0FF' },
  { icon: '🔩', label: 'Mechanic', slug: 'mechanic', bg: '#F1F5F9' },
  { icon: '🏥', label: 'Home Nurse', slug: 'home-nurse', bg: '#FFF0F0' },
  { icon: '💻', label: 'Computer Repair', slug: 'computer-repair', bg: '#F5F0FF' },
];

const TRUST_POINTS = [
  {
    icon: '🛡️',
    title: 'Verified Professionals',
    desc: 'Every provider undergoes identity confirmation and background checks before joining our network.'
  },
  {
    icon: '⚡',
    title: 'Instant Booking',
    desc: 'Book any service in under 2 minutes. Pick your preferred time slot and get a confirmed pro.'
  },
  {
    icon: '🔒',
    title: 'Pay After Service',
    desc: 'Your payment is held safely. Only pay when you are completely satisfied with the completed work.'
  },
  {
    icon: '⭐',
    title: '5-Star Quality Standards',
    desc: 'Browse real user reviews and ratings. We maintain strict quality checks to ensure excellent services.'
  }
];

const STEPS = [
  { num: '1', title: 'Choose a service', desc: 'Select from our wide range of services and tell us what you need fixed or done.' },
  { num: '2', title: 'Pick your time', desc: 'Choose a convenient date and time slot. We will instantly assign a top-rated pro.' },
  { num: '3', title: 'Relax & pay after', desc: 'Our professional arrives on time and finishes the job. Pay securely only after it is completed.' }
];

const CITIES = ['Bengaluru', 'Mumbai', 'Delhi NCR', 'Hyderabad', 'Pune', 'Chennai', 'Kolkata'];

const TESTIMONIALS = [
  {
    name: 'Priya Sharma',
    city: 'Bengaluru',
    rating: 5,
    text: 'I booked an electrician on Workzarr and he arrived within 40 minutes. Extremely professional, clean service, and direct upfront pricing. Exceptional experience.'
  },
  {
    name: 'Amit Patel',
    city: 'Mumbai',
    rating: 5,
    text: 'Getting our AC serviced used to be a massive chore. The Workzarr technician was highly trained, wore a mask, cleaned up everything, and did a perfect job.'
  },
  {
    name: 'Anjali Reddy',
    city: 'Hyderabad',
    rating: 5,
    text: 'Highly recommend this app. Clear booking tracking, verified professionals, and secure pay-after-service model. A game changer in local home services!'
  }
];

export default function Landing() {
  const [city, setCity] = useState('Bengaluru');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [filteredCategories, setFilteredCategories] = useState([]);
  
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((s) => s.auth);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.trim().length > 0) {
      const filtered = CATEGORIES.filter(c =>
        c.label.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredCategories(filtered);
    } else {
      setFilteredCategories([]);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const target = searchQuery.trim();
    if (target) {
      if (isAuthenticated) {
        navigate(`/search?q=${encodeURIComponent(target)}`);
      } else {
        navigate(`/login?redirectTo=/search?q=${encodeURIComponent(target)}`);
      }
    }
  };

  const handleSelectCategory = (catLabel) => {
    if (isAuthenticated) {
      navigate(`/search?q=${encodeURIComponent(catLabel)}`);
    } else {
      navigate(`/login?redirectTo=/search?q=${encodeURIComponent(catLabel)}`);
    }
  };

  return (
    <div style={{ backgroundColor: '#FFFFFF', color: '#1A1A1A', fontFamily: 'Inter, sans-serif', minHeight: '100vh', overflowX: 'hidden' }}>
      
      {/* ── STICKY TOP HEADER ───────────────────────────────── */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #EEEEEE',
        boxShadow: scrolled ? '0 4px 20px rgba(0, 0, 0, 0.03)' : 'none',
        transition: 'all 0.2s ease',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 72 }}>
          
          {/* Logo & Location */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10,
                backgroundColor: '#FF4500',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(255, 69, 0, 0.25)',
              }}>
                <span style={{ color: '#FFFFFF', fontWeight: 900, fontSize: 18 }}>W</span>
              </div>
              <span style={{ fontWeight: 900, fontSize: 22, color: '#1A1A1A', letterSpacing: '-0.8px' }}>
                Workzarr
              </span>
            </Link>

            {/* City Selector */}
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setShowCityDropdown(!showCityDropdown)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  backgroundColor: '#F8F8F8', border: '1px solid #EEEEEE',
                  borderRadius: 10, padding: '8px 14px', fontSize: 13, fontWeight: 700,
                  color: '#333333', cursor: 'pointer', transition: 'all 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#EEEEEE'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#F8F8F8'}
              >
                📍 {city} <span style={{ fontSize: 10, color: '#666666' }}>▼</span>
              </button>

              {showCityDropdown && (
                <div style={{
                  position: 'absolute', top: 44, left: 0,
                  backgroundColor: '#FFFFFF', border: '1px solid #EEEEEE',
                  borderRadius: 12, boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
                  padding: '8px 0', minWidth: 160, zIndex: 1001,
                }}>
                  {CITIES.map(c => (
                    <button
                      key={c}
                      onClick={() => { setCity(c); setShowCityDropdown(false); }}
                      style={{
                        width: '100%', padding: '10px 18px', border: 'none',
                        textAlign: 'left', background: 'none', fontSize: 13,
                        fontWeight: 600, color: c === city ? '#FF4500' : '#333333',
                        cursor: 'pointer', display: 'block', transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FFF0EB'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <Link 
              to="/provider/register" 
              style={{
                color: '#666666', textDecoration: 'none', fontSize: 13,
                fontWeight: 700, transition: 'color 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#FF4500'}
              onMouseLeave={e => e.currentTarget.style.color = '#666666'}
            >
              Register as Partner
            </Link>
            
            <div style={{ width: 1, height: 16, backgroundColor: '#EEEEEE' }} />

            {isAuthenticated ? (
              <Link 
                to="/home" 
                style={{
                  backgroundColor: '#FF4500', color: '#FFFFFF', textDecoration: 'none',
                  fontSize: 13, fontWeight: 800, padding: '10px 20px', borderRadius: 10,
                  boxShadow: '0 4px 14px rgba(255, 69, 0, 0.2)', transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#E03D00'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#FF4500'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                Go to Dashboard →
              </Link>
            ) : (
              <>
                <Link 
                  to="/login" 
                  style={{
                    color: '#1A1A1A', textDecoration: 'none', fontSize: 13,
                    fontWeight: 700, transition: 'color 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = '#FF4500'}
                  onMouseLeave={e => e.currentTarget.style.color = '#1A1A1A'}
                >
                  Sign In
                </Link>
                <Link 
                  to="/register" 
                  style={{
                    backgroundColor: '#FF4500', color: '#FFFFFF', textDecoration: 'none',
                    fontSize: 13, fontWeight: 800, padding: '10px 20px', borderRadius: 10,
                    boxShadow: '0 4px 14px rgba(255, 69, 0, 0.2)', transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#E03D00'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#FF4500'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── HERO SECTION ── */}
      <section style={{
        paddingTop: 140, paddingBottom: 64,
        backgroundColor: '#FFFFFF',
        position: 'relative',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 48, flexWrap: 'wrap' }}>
            
            {/* Left Copy */}
            <div style={{ flex: '1 1 50%', minWidth: 320 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                backgroundColor: '#FFF0EB', border: '1px solid #FFE0D6',
                borderRadius: 99, padding: '6px 14px', marginBottom: 20,
              }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#FF4500', uppercase: 'true', letterSpacing: 0.5 }}>
                  Bharat Service Hub Partner
                </span>
              </div>
              
              <h1 style={{
                fontSize: 'clamp(36px, 4.5vw, 54px)', fontWeight: 900,
                color: '#1A1A1A', lineHeight: 1.15, letterSpacing: '-1.5px',
                marginBottom: 16,
              }}>
                Home services,<br />
                <span style={{ color: '#FF4500' }}>on demand.</span>
              </h1>
              
              <p style={{
                fontSize: 16, color: '#666666', lineHeight: 1.6,
                maxWidth: 480, marginBottom: 36, fontWeight: 500,
              }}>
                Book certified, background-verified local specialists for electrical, plumbing, AC servicing, cleaning, painting & more in <strong style={{ color: '#1A1A1A' }}>{city}</strong>.
              </p>

              {/* SEARCH BOX */}
              <form onSubmit={handleSearchSubmit} style={{ position: 'relative', maxWidth: 540 }}>
                <div style={{
                  display: 'flex', alignItems: 'center',
                  backgroundColor: '#FFFFFF', border: '1.5px solid #EEEEEE',
                  borderRadius: 14, padding: '4px 6px',
                  boxShadow: '0 4px 24px rgba(0, 0, 0, 0.05)',
                }}>
                  {/* Icon */}
                  <span style={{ fontSize: 18, color: '#999999', paddingLeft: 12, paddingRight: 6 }}>🔍</span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder="Search for services... (e.g. AC service, Plumber, Painter)"
                    style={{
                      flex: 1, border: 'none', outline: 'none',
                      fontSize: 14, fontWeight: 600, color: '#1A1A1A',
                      padding: '12px 6px', boxSizing: 'border-box',
                    }}
                  />
                  <button 
                    type="submit"
                    style={{
                      backgroundColor: '#FF4500', color: '#FFFFFF',
                      border: 'none', borderRadius: 10, padding: '12px 24px',
                      fontSize: 13, fontWeight: 800, cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#E03D00'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = '#FF4500'}
                  >
                    Search
                  </button>
                </div>

                {/* Auto-suggest dropdown */}
                {filteredCategories.length > 0 && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0,
                    backgroundColor: '#FFFFFF', border: '1px solid #EEEEEE',
                    borderRadius: 12, boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
                    marginTop: 8, padding: '6px 0', zIndex: 99,
                  }}>
                    {filteredCategories.map(c => (
                      <button
                        type="button"
                        key={c.slug}
                        onClick={() => { setSearchQuery(c.label); handleSelectCategory(c.label); }}
                        style={{
                          width: '100%', padding: '12px 18px', border: 'none',
                          textAlign: 'left', background: 'none', fontSize: 13,
                          fontWeight: 600, color: '#1A1A1A', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: 10,
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FFF0EB'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <span style={{ fontSize: 16 }}>{c.icon}</span> {c.label}
                      </button>
                    ))}
                  </div>
                )}
              </form>
              
              {/* Quick tags */}
              <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#999999', uppercase: 'true' }}>Trending:</span>
                {['AC Repair', 'Cleaner', 'Electrician'].map(cat => (
                  <button
                    type="button"
                    key={cat}
                    onClick={() => handleSelectCategory(cat)}
                    style={{
                      background: '#F8F8F8', border: '1px solid #EEEEEE',
                      borderRadius: 8, padding: '4px 10px', fontSize: 11,
                      fontWeight: 700, color: '#666666', cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#FF4500'; e.currentTarget.style.color = '#FF4500'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#EEEEEE'; e.currentTarget.style.color = '#666666'; }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Right graphic panel (Mock UI) */}
            <div style={{ flex: '1 1 40%', minWidth: 320, display: 'flex', justifyContent: 'center' }}>
              <div style={{
                backgroundColor: '#F8F8F8', border: '1px solid #EEEEEE',
                borderRadius: 24, padding: '24px 20px', width: '100%', maxWidth: 380,
                boxShadow: '0 4px 30px rgba(0, 0, 0, 0.02)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#FF4500' }} />
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#666666' }}>Active Bookings</span>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#999999' }}>Real-time</span>
                </div>

                {/* Simulated service card */}
                <div style={{
                  backgroundColor: '#FFFFFF', border: '1px solid #EEEEEE',
                  borderRadius: 16, padding: '16px', marginBottom: 12,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 24 }}>❄️</span>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 13, color: '#1A1A1A' }}>AC Service & Repair</div>
                        <div style={{ fontSize: 11, color: '#666666', fontWeight: 600 }}>ID: #WZ-8392</div>
                      </div>
                    </div>
                    <span style={{
                      backgroundColor: '#FFF0EB', color: '#FF4500',
                      fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 20,
                    }}>Assigned</span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderTop: '1px solid #F8F8F8', paddingTop: 10 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', backgroundColor: '#FF4500',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontSize: 12, fontWeight: 900
                    }}>R</div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 12, color: '#1A1A1A' }}>Rakesh Kumar</div>
                      <div style={{ fontSize: 10, color: '#999999', fontWeight: 700 }}>⭐ 4.9 · 120+ Completed Gigs</div>
                    </div>
                  </div>
                </div>

                {/* Value proposition badges */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, backgroundColor: '#FFFFFF', borderRadius: 12, padding: '10px 14px', border: '1px solid #EEEEEE' }}>
                    <span style={{ fontSize: 18 }}>🛡️</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#333333' }}>100% Upfront Pricing · No Hidden Fees</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, backgroundColor: '#FFFFFF', borderRadius: 12, padding: '10px 14px', border: '1px solid #EEEEEE' }}>
                    <span style={{ fontSize: 18 }}>🔒</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#333333' }}>Pay Securely Only After Service</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── SERVICE CATEGORIES GRID ── */}
      <section id="services" style={{ padding: '80px 24px', backgroundColor: '#F8F8F8' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 36px)', fontWeight: 900, color: '#1A1A1A', letterSpacing: '-0.8px', marginBottom: 12 }}>
              What do you need help with?
            </h2>
            <p style={{ fontSize: 15, color: '#666666', fontWeight: 500, maxW: 480, margin: '0 auto' }}>
              Select a service category to browse top verified specialists active in {city}.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: 16,
          }}>
            {CATEGORIES.map(cat => (
              <div
                key={cat.slug}
                onClick={() => handleSelectCategory(cat.label)}
                style={{
                  backgroundColor: '#FFFFFF', border: '1px solid #EEEEEE',
                  borderRadius: 16, padding: '24px 16px', display: 'flex',
                  flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'all 0.2s ease',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = '#FF4500';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 69, 0, 0.06)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = '#EEEEEE';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.02)';
                }}
              >
                <div style={{
                  width: 54, height: 54, borderRadius: 14,
                  backgroundColor: cat.bg, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: 26, marginBottom: 16,
                }}>
                  {cat.icon}
                </div>
                <span style={{ fontWeight: 800, fontSize: 13, color: '#1A1A1A', textAlign: 'center', lineHeight: 1.3 }}>
                  {cat.label}
                </span>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── WHY CHOOSE US ── */}
      <section style={{ padding: '80px 24px', backgroundColor: '#FFFFFF' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 36px)', fontWeight: 900, color: '#1A1A1A', letterSpacing: '-0.8px', marginBottom: 12 }}>
              Why book through Workzarr?
            </h2>
            <p style={{ fontSize: 15, color: '#666666', fontWeight: 500 }}>
              Setting new benchmarks in safety, efficiency, and professional quality.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 24,
          }}>
            {TRUST_POINTS.map((tp, idx) => (
              <div 
                key={idx}
                style={{
                  backgroundColor: '#FFFFFF', border: '1px solid #EEEEEE',
                  borderRadius: 20, padding: '32px 24px',
                }}
              >
                <div style={{
                  width: 50, height: 50, borderRadius: 12,
                  backgroundColor: '#FFF0EB', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, marginBottom: 20,
                }}>
                  {tp.icon}
                </div>
                <h3 style={{ fontWeight: 800, fontSize: 16, color: '#1A1A1A', marginBottom: 8 }}>
                  {tp.title}
                </h3>
                <p style={{ fontSize: 13, color: '#666666', fontWeight: 500, lineHeight: 1.6, margin: 0 }}>
                  {tp.desc}
                </p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: '80px 24px', backgroundColor: '#F8F8F8', borderTop: '1px solid #EEEEEE' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 36px)', fontWeight: 900, color: '#1A1A1A', letterSpacing: '-0.8px', marginBottom: 12 }}>
              Simple 3-Step Doorstep Services
            </h2>
            <p style={{ fontSize: 15, color: '#666666', fontWeight: 500 }}>
              Convenient booking and execution, simplified for you.
            </p>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 40,
            flexWrap: 'wrap',
          }}>
            {STEPS.map(s => (
              <div key={s.num} style={{ flex: '1 1 30%', minWidth: 260, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <div style={{
                  width: 54, height: 54, borderRadius: '50%',
                  backgroundColor: '#FF4500', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  color: '#FFFFFF', fontWeight: 900, fontSize: 18,
                  marginBottom: 20, boxShadow: '0 4px 14px rgba(255, 69, 0, 0.25)'
                }}>
                  {s.num}
                </div>
                <h3 style={{ fontWeight: 800, fontSize: 16, color: '#1A1A1A', marginBottom: 8 }}>
                  {s.title}
                </h3>
                <p style={{ fontSize: 13, color: '#666666', fontWeight: 500, lineHeight: 1.6, maxW: 240 }}>
                  {s.desc}
                </p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── TESTIMONIALS SECTION ── */}
      <section style={{ padding: '80px 24px', backgroundColor: '#FFFFFF' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 36px)', fontWeight: 900, color: '#1A1A1A', letterSpacing: '-0.8px', marginBottom: 12 }}>
              What our customers say
            </h2>
            <p style={{ fontSize: 15, color: '#666666', fontWeight: 500 }}>
              Trusted by families across Indian metropolitan cities.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 24,
          }}>
            {TESTIMONIALS.map((t, idx) => (
              <div 
                key={idx}
                style={{
                  backgroundColor: '#FFFFFF', border: '1px solid #EEEEEE',
                  borderRadius: 20, padding: '28px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.01)',
                }}
              >
                <div style={{ display: 'flex', gap: 2, marginBottom: 12 }}>
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <span key={i} style={{ color: '#FF4500', fontSize: 16 }}>★</span>
                  ))}
                </div>
                <p style={{ fontSize: 13.5, color: '#333333', fontWeight: 500, lineHeight: 1.6, marginBottom: 20, fontStyle: 'italic' }}>
                  "{t.text}"
                </p>
                <div style={{ borderTop: '1px solid #EEEEEE', paddingTop: 14 }}>
                  <div style={{ fontWeight: 800, fontSize: 13, color: '#1A1A1A' }}>{t.name}</div>
                  <div style={{ fontSize: 11, color: '#666666', fontWeight: 700, marginTop: 2 }}>Homeowner · {t.city}</div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── JOIN CTA SECTION ── */}
      <section style={{ padding: '80px 24px', backgroundColor: '#FFF0EB', borderTop: '1px solid #FFE0D6', borderBottom: '1px solid #FFE0D6' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 900, color: '#1A1A1A', letterSpacing: '-1px', marginBottom: 14 }}>
            Earn reliable income with us
          </h2>
          <p style={{ fontSize: 15, color: '#666666', fontWeight: 600, maxW: 520, margin: '0 auto 36px', lineHeight: 1.6 }}>
            Are you an electrician, plumber, AC specialist, tutor, painter, or cleaner? Join 1,000+ service partners earning up to ₹50,000+ per month on Workzarr.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link 
              to="/provider/register" 
              style={{
                backgroundColor: '#FF4500', color: '#FFFFFF', textDecoration: 'none',
                fontSize: 14, fontWeight: 800, padding: '14px 32px', borderRadius: 12,
                boxShadow: '0 4px 14px rgba(255, 69, 0, 0.25)', transition: 'all 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#E03D00'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = '#FF4500'}
            >
              Join as Partner 💼
            </Link>
            <Link 
              to="/provider/login" 
              style={{
                backgroundColor: '#FFFFFF', color: '#1A1A1A', textDecoration: 'none',
                fontSize: 14, fontWeight: 800, padding: '14px 32px', borderRadius: 12,
                border: '1.5px solid #EEEEEE', transition: 'all 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F8F8F8'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = '#FFFFFF'}
            >
              Partner Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ backgroundColor: '#1A1A1A', color: '#888888', padding: '64px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 40, marginBottom: 48 }}>
            
            <div style={{ flex: '1 1 300px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#FF4500', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: '#FFFFFF', fontWeight: 900, fontSize: 16 }}>W</span>
                </div>
                <span style={{ fontWeight: 900, fontSize: 18, color: '#FFFFFF' }}>Workzarr</span>
              </div>
              <p style={{ fontSize: 12, lineHeight: 1.6, color: '#888888', margin: 0 }}>
                Workzarr is an on-demand marketplace connecting families with certified and background-verified local service professionals.
              </p>
            </div>

            <div>
              <h4 style={{ color: '#FFFFFF', fontWeight: 800, fontSize: 13, uppercase: 'true', marginBottom: 16, letterSpacing: 0.5 }}>For Customers</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <li><Link to="/login" style={{ color: '#888888', textDecoration: 'none', fontSize: 12 }} onMouseEnter={e => e.target.style.color = '#FFFFFF'} onMouseLeave={e => e.target.style.color = '#888888'}>Book a Service</Link></li>
                <li><Link to="/register" style={{ color: '#888888', textDecoration: 'none', fontSize: 12 }} onMouseEnter={e => e.target.style.color = '#FFFFFF'} onMouseLeave={e => e.target.style.color = '#888888'}>Create Account</Link></li>
                <li><Link to="/login" style={{ color: '#888888', textDecoration: 'none', fontSize: 12 }} onMouseEnter={e => e.target.style.color = '#FFFFFF'} onMouseLeave={e => e.target.style.color = '#888888'}>Reviews & Quality</Link></li>
              </ul>
            </div>

            <div>
              <h4 style={{ color: '#FFFFFF', fontWeight: 800, fontSize: 13, uppercase: 'true', marginBottom: 16, letterSpacing: 0.5 }}>For Partners</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <li><Link to="/provider/register" style={{ color: '#888888', textDecoration: 'none', fontSize: 12 }} onMouseEnter={e => e.target.style.color = '#FFFFFF'} onMouseLeave={e => e.target.style.color = '#888888'}>Become a Service Partner</Link></li>
                <li><Link to="/provider/login" style={{ color: '#888888', textDecoration: 'none', fontSize: 12 }} onMouseEnter={e => e.target.style.color = '#FFFFFF'} onMouseLeave={e => e.target.style.color = '#888888'}>Partner Login</Link></li>
                <li><a href="#" style={{ color: '#888888', textDecoration: 'none', fontSize: 12 }} onMouseEnter={e => e.target.style.color = '#FFFFFF'} onMouseLeave={e => e.target.style.color = '#888888'}>Quality Standards</a></li>
              </ul>
            </div>
            
          </div>

          <div style={{ borderTop: '1px solid #333333', paddingTop: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <span style={{ fontSize: 11 }}>© {new Date().getFullYear()} Workzarr. All rights reserved. Powered by Bharat Service Hub.</span>
            <span style={{ fontSize: 11 }}>Made in India with ❤️</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
