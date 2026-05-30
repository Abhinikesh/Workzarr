import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setCredentials } from '../store/slices/authSlice';
import { axiosInstance } from '../lib/axios';
import { connectSocket } from '../lib/socket';
import { toast } from 'sonner';
import { Loader2, ArrowRight, ShieldCheck, MapPin, CreditCard } from 'lucide-react';

const Login = () => {
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(30);
  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isAuthenticated = useSelector((s) => s.auth.isAuthenticated);
  const user = useSelector((s) => s.auth.user);

  const otpInputsRef = useRef([]);

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      if (user && !user.name) {
        navigate('/complete-profile', { replace: true });
      } else {
        navigate('/home', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  // Cooldown countdown timer
  useEffect(() => {
    let interval = null;
    if (otpSent && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [otpSent, timer]);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!/^[6-9]\d{9}$/.test(phone)) {
      toast.error('Please enter a valid 10-digit Indian phone number');
      return;
    }

    setLoading(true);
    try {
      await axiosInstance.post('/auth/send-otp', {
        phone,
        purpose: 'login',
      });
      setOtpSent(true);
      setTimer(30);
      toast.success('OTP sent successfully. Code is 123456 in development.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const otp = otpDigits.join('');
    if (otp.length !== 6) {
      toast.error('Please enter the 6-digit OTP code');
      return;
    }

    setLoading(true);
    try {
      const response = await axiosInstance.post('/auth/verify-otp', {
        phone,
        otp,
        purpose: 'login',
      });

      const { accessToken, refreshToken, user: userData } = response.data.data;

      // Store in Redux
      dispatch(setCredentials({ user: userData, accessToken, refreshToken }));

      // Initialize Socket connection
      connectSocket(accessToken);

      toast.success('Successfully authenticated!');

      // Redirect appropriately
      if (!userData.name) {
        navigate('/complete-profile', { replace: true });
      } else {
        navigate('/home', { replace: true });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = value.substring(value.length - 1);
    setOtpDigits(newDigits);

    // Auto-focus next input box
    if (value && index < 5) {
      otpInputsRef.current[index + 1].focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputsRef.current[index - 1].focus();
    }
  };

  const handleResendOtp = async () => {
    if (timer > 0) return;
    setLoading(true);
    try {
      await axiosInstance.post('/auth/send-otp', {
        phone,
        purpose: 'login',
      });
      setTimer(30);
      toast.success('OTP has been resent');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    toast.info('Google Sign-in coming soon');
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row text-[#1A1A1A]" style={{ backgroundColor: '#F8F8F8' }}>
      {/* Left Column: Brand Illustration & Value Prop */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-8 lg:p-16 relative overflow-hidden" style={{ backgroundColor: '#FFF0EB' }}>
        {/* Top Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-md" style={{ backgroundColor: '#FF4500' }}>
            <span className="text-white font-black text-lg">W</span>
          </div>
          <span className="text-xl font-extrabold tracking-tight" style={{ color: '#1A1A1A' }}>Workzarr</span>
        </div>

        {/* Middle content */}
        <div className="relative z-10 my-auto py-12 lg:py-0">
          <span className="font-extrabold uppercase tracking-wider text-[10px] mb-2 block" style={{ color: '#FF4500' }}>
            Bharat ka apna service hub
          </span>
          <h2 className="text-4xl lg:text-5xl font-black tracking-tight mb-4" style={{ color: '#1A1A1A', lineHeight: '1.15' }}>
            Your home services, <span style={{ color: '#FF4500' }}>simplified</span>
          </h2>
          <p className="text-sm font-semibold mb-10 max-w-md leading-relaxed" style={{ color: '#666666' }}>
            Get reliable, background-verified professionals for cleanings, repairs, installations, and beauty services directly to your doorstep.
          </p>

          <div className="space-y-5 max-w-sm">
            <div className="flex gap-4">
              <div className="w-11 h-11 rounded-xl border flex items-center justify-center shrink-0" style={{ backgroundColor: '#FFFFFF', borderColor: '#FFE0D6' }}>
                <ShieldCheck className="w-5.5 h-5.5" style={{ color: '#FF4500' }} />
              </div>
              <div>
                <h4 className="font-extrabold text-sm" style={{ color: '#1A1A1A' }}>Verified Professionals</h4>
                <p className="text-xs font-semibold mt-0.5" style={{ color: '#666666' }}>Background verified experts trained to deliver quality.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-11 h-11 rounded-xl border flex items-center justify-center shrink-0" style={{ backgroundColor: '#FFFFFF', borderColor: '#FFE0D6' }}>
                <MapPin className="w-5.5 h-5.5" style={{ color: '#FF4500' }} />
              </div>
              <div>
                <h4 className="font-extrabold text-sm" style={{ color: '#1A1A1A' }}>Real-time Tracking</h4>
                <p className="text-xs font-semibold mt-0.5" style={{ color: '#666666' }}>Track your partner's live status and ETA directly from the app.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-11 h-11 rounded-xl border flex items-center justify-center shrink-0" style={{ backgroundColor: '#FFFFFF', borderColor: '#FFE0D6' }}>
                <CreditCard className="w-5.5 h-5.5" style={{ color: '#FF4500' }} />
              </div>
              <div>
                <h4 className="font-extrabold text-sm" style={{ color: '#1A1A1A' }}>Secure Payments</h4>
                <p className="text-xs font-semibold mt-0.5" style={{ color: '#666666' }}>Pay securely online only after your service is completed successfully.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="relative z-10 text-xs font-bold" style={{ color: '#999999' }}>
          &copy; {new Date().getFullYear()} Workzarr. All rights reserved. Made for Bharat.
        </div>
      </div>

      {/* Right Column: Form Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16" style={{ backgroundColor: '#F8F8F8' }}>
        <div className="w-full max-w-md rounded-2xl p-8 lg:p-10 shadow-sm border" style={{ backgroundColor: '#FFFFFF', borderColor: '#EEEEEE' }}>
          <div className="mb-8">
            <span className="font-extrabold uppercase tracking-wider text-[10px] mb-1 block" style={{ color: '#FF4500' }}>
              User Login
            </span>
            <h1 className="text-3xl font-black tracking-tight" style={{ color: '#1A1A1A' }}>
              {otpSent ? 'Enter OTP' : 'Let\'s Get Started'}
            </h1>
            <p className="text-xs font-semibold mt-1.5" style={{ color: '#666666' }}>
              {otpSent ? `We've sent a 6-digit OTP code to +91 ${phone}` : 'Enter your mobile number to sign in or register'}
            </p>
          </div>

          {!otpSent ? (
            /* Phone Step */
            <form onSubmit={handleSendOtp} className="space-y-5">
              <div>
                <label htmlFor="phone" className="block text-[10px] font-bold uppercase tracking-wider mb-2.5" style={{ color: '#999999' }}>
                  Mobile Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none font-extrabold text-sm" style={{ color: '#666666' }}>
                    +91
                  </div>
                  <input
                    id="phone"
                    type="text"
                    inputMode="numeric"
                    pattern="[6-9][0-9]{9}"
                    maxLength="10"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 10-digit number"
                    required
                    className="w-full pl-14 pr-4 py-3.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all font-semibold"
                    style={{ backgroundColor: '#FFFFFF', borderColor: '#DDDDDD', color: '#1A1A1A', minHeight: '44px' }}
                  />
                </div>
                <p className="text-[10px] mt-2 font-semibold" style={{ color: '#999999' }}>
                  A 6-digit OTP code will be sent to verify your identity.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 text-white font-extrabold rounded-xl shadow-sm hover:shadow-md transition-all text-xs flex items-center justify-center gap-2 cursor-pointer"
                style={{ backgroundColor: '#FF4500' }}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Continue
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* OTP Step */
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div>
                <div className="flex justify-between items-baseline mb-3">
                  <label className="block text-[10px] font-bold uppercase tracking-wider" style={{ color: '#999999' }}>
                    OTP Verification Code
                  </label>
                  <button
                    type="button"
                    onClick={() => setOtpSent(false)}
                    className="text-xs font-extrabold hover:underline"
                    style={{ color: '#FF4500' }}
                  >
                    Change Number
                  </button>
                </div>

                <div className="flex justify-between gap-2.5">
                  {otpDigits.map((digit, index) => (
                    <input
                      key={index}
                      type="text"
                      inputMode="numeric"
                      maxLength="1"
                      value={digit}
                      ref={(el) => (otpInputsRef.current[index] = el)}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className="w-12 h-12 text-center text-lg font-extrabold border bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all text-[#1A1A1A]"
                      style={{ borderColor: '#DDDDDD' }}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 text-white font-extrabold rounded-xl shadow-sm hover:shadow-md transition-all text-xs flex items-center justify-center gap-2 cursor-pointer"
                style={{ backgroundColor: '#FF4500' }}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Continue'}
              </button>

              <div className="text-center pt-2">
                {timer > 0 ? (
                  <p className="text-xs font-bold" style={{ color: '#666666' }}>
                    Resend code in <span style={{ color: '#1A1A1A' }}>{timer}s</span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={loading}
                    className="text-xs font-extrabold hover:underline"
                    style={{ color: '#FF4500' }}
                  >
                    Resend OTP Code
                  </button>
                )}
              </div>
            </form>
          )}

          {/* Divider */}
          <div className="relative my-6 flex items-center justify-center">
            <div className="absolute inset-0 w-full border-t" style={{ borderColor: '#EEEEEE' }} />
            <span className="relative px-3 text-[10px] font-bold uppercase tracking-wider" style={{ backgroundColor: '#FFFFFF', color: '#999999' }}>
              Or Continue With
            </span>
          </div>

          {/* Standard Google OAuth Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full py-3 border rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-sm"
            style={{ backgroundColor: '#FFFFFF', borderColor: '#DDDDDD', color: '#1A1A1A' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8F8F8'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
