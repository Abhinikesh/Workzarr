import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setCredentials } from '../store/slices/authSlice';
import { axiosInstance } from '../lib/axios';
import { connectSocket } from '../lib/socket';
import { toast } from 'sonner';
import { Phone, ArrowRight, Loader2 } from 'lucide-react';

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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-100 p-8 shadow-sm">
        {/* Branding header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            <span className="text-white font-bold text-xl">W</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Join as a Service Provider</h1>
          <p className="text-slate-500 text-sm mt-1">Earn money by offering your skills locally</p>
        </div>

        {!otpSent ? (
          /* Phone form */
          <form onSubmit={handleSendOtp} className="space-y-6">
            <div>
              <label htmlFor="phone" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Mobile Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 font-semibold text-sm">
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
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all font-medium"
                />
              </div>
              <p className="text-xs text-slate-400 mt-1.5">Enter your WhatsApp linked mobile number starting with 6-9.</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white font-semibold rounded-lg shadow-sm transition-all text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Send OTP
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* OTP Form */
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div>
              <div className="flex justify-between items-baseline mb-2">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Verification Code
                </label>
                <button
                  type="button"
                  onClick={() => setOtpSent(false)}
                  className="text-xs text-orange-600 hover:underline font-medium"
                >
                  Change number
                </button>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Sent 6-digit OTP to <span className="font-semibold text-slate-800">+91 {phone}</span>
              </p>

              {/* 6 digits */}
              <div className="flex justify-between gap-2">
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
                    className="w-12 h-12 text-center text-lg font-bold border border-slate-200 bg-slate-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all"
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white font-semibold rounded-lg shadow-sm transition-all text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify & Setup Profile'}
            </button>

            <div className="text-center pt-2">
              {timer > 0 ? (
                <p className="text-xs text-slate-400">
                  Resend OTP in <span className="font-semibold text-slate-600">{timer}s</span>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading}
                  className="text-xs font-semibold text-orange-600 hover:text-orange-700 hover:underline"
                >
                  Resend OTP
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
