import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setCredentials } from '../store/slices/authSlice';
import { axiosInstance } from '../lib/axios';
import { connectSocket } from '../lib/socket';
import { toast } from 'sonner';
import { Loader2, ArrowRight, ShieldCheck, DollarSign, Target } from 'lucide-react';

const Login = () => {
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(30);
  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isAuthenticated = useSelector((s) => s.auth.isAuthenticated);
  const provider = useSelector((s) => s.auth.provider);

  const otpInputsRef = useRef([]);

  useEffect(() => {
    if (isAuthenticated) {
      if (!provider) {
        navigate('/onboarding', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, provider, navigate]);

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

      // Now attempt to load the provider professional profile
      let providerProfile = null;
      try {
        const profileRes = await axiosInstance.get('/providers/me/profile', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        providerProfile = profileRes.data.data.provider;
      } catch (profileErr) {
        // 404/403 means profile is not created yet
      }

      // Store in Redux
      dispatch(
        setCredentials({
          user: userData,
          provider: providerProfile,
          accessToken,
          refreshToken,
        })
      );

      // Connect Socket
      connectSocket(accessToken);

      toast.success('Authenticated successfully!');

      if (!providerProfile) {
        navigate('/onboarding', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
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

  return (
    <div className="min-h-screen flex flex-col lg:flex-row text-[#1A1A1A]" style={{ backgroundColor: '#F8F8F8' }}>
      {/* Left Column: Brand Illustration & Professional Value Prop */}
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
            Workzarr for Professionals
          </span>
          <h2 className="text-4xl lg:text-5xl font-black tracking-tight mb-4" style={{ color: '#1A1A1A', lineHeight: '1.15' }}>
            Join as a <span style={{ color: '#FF4500' }}>Service Partner</span>
          </h2>
          <p className="text-sm font-semibold mb-10 max-w-md leading-relaxed" style={{ color: '#666666' }}>
            Grow your service business. Get verified, set your pricing, and connect directly with thousands of families in your local region.
          </p>

          <div className="space-y-5 max-w-sm">
            <div className="flex gap-4">
              <div className="w-11 h-11 rounded-xl border flex items-center justify-center shrink-0" style={{ backgroundColor: '#FFFFFF', borderColor: '#FFE0D6' }}>
                <DollarSign className="w-5.5 h-5.5" style={{ color: '#FF4500' }} />
              </div>
              <div>
                <h4 className="font-extrabold text-sm" style={{ color: '#1A1A1A' }}>Set Your Pricing</h4>
                <p className="text-xs font-semibold mt-0.5" style={{ color: '#666666' }}>Take full control of your rates and availability with custom service packages.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-11 h-11 rounded-xl border flex items-center justify-center shrink-0" style={{ backgroundColor: '#FFFFFF', borderColor: '#FFE0D6' }}>
                <ShieldCheck className="w-5.5 h-5.5" style={{ color: '#FF4500' }} />
              </div>
              <div>
                <h4 className="font-extrabold text-sm" style={{ color: '#1A1A1A' }}>Verified Badge</h4>
                <p className="text-xs font-semibold mt-0.5" style={{ color: '#666666' }}>Unlock consumer trust and stand out in search results with verified status.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-11 h-11 rounded-xl border flex items-center justify-center shrink-0" style={{ backgroundColor: '#FFFFFF', borderColor: '#FFE0D6' }}>
                <Target className="w-5.5 h-5.5" style={{ color: '#FF4500' }} />
              </div>
              <div>
                <h4 className="font-extrabold text-sm" style={{ color: '#1A1A1A' }}>Direct Local Matching</h4>
                <p className="text-xs font-semibold mt-0.5" style={{ color: '#666666' }}>Receive booking invitations in your area directly onto your smartphone.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="relative z-10 text-xs font-bold" style={{ color: '#999999' }}>
          &copy; {new Date().getFullYear()} Workzarr Professional. Bharat Service Hub Partner.
        </div>
      </div>

      {/* Right Column: Form Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16" style={{ backgroundColor: '#F8F8F8' }}>
        <div className="w-full max-w-md rounded-2xl p-8 lg:p-10 shadow-sm border" style={{ backgroundColor: '#FFFFFF', borderColor: '#EEEEEE' }}>
          <div className="mb-8">
            <span className="font-extrabold uppercase tracking-wider text-[10px] mb-1 block" style={{ color: '#FF4500' }}>
              Partner Portal
            </span>
            <h1 className="text-3xl font-black tracking-tight" style={{ color: '#1A1A1A' }}>
              {otpSent ? 'Verify OTP' : 'Partner Sign In'}
            </h1>
            <p className="text-xs font-semibold mt-1.5" style={{ color: '#666666' }}>
              {otpSent ? `We've sent a 6-digit OTP code to +91 ${phone}` : 'Enter your mobile number to check incoming bookings and setup profile'}
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
                  Please enter your WhatsApp active mobile number starting with 6-9.
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
                    Verification Code
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
        </div>
      </div>
    </div>
  );
};

export default Login;
