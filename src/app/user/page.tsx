"use client";
import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { buildApiUrl, API_ENDPOINTS } from "../../utils/api";
import { showToast } from "../../utils/toast";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"mobile" | "otp">("mobile");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [sending, setSending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [verifying, setVerifying] = useState(false);
  const [mobileError, setMobileError] = useState("");
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [otpAttempts, setOtpAttempts] = useState(0);
  const MAX_OTP_ATTEMPTS = 3;
  const [wrongCycle, setWrongCycle] = useState(0);
  const MAX_WRONG_CYCLES = 3;

  React.useEffect(() => {
    if (step !== "otp") return;

    if (resendTimer === 0) {
      setCanResend(true);
      if (wrongCycle < MAX_WRONG_CYCLES) {
        setOtpAttempts(0);
      }
      return;
    }
    const interval = setTimeout(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(interval);
  }, [resendTimer, step, wrongCycle]);

  const validateIndianMobile = (number: string): boolean => {
    const indianMobileRegex = /^[6-9]\d{9}$/;
    return indianMobileRegex.test(number);
  };

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 10);
    setMobile(value);

    if (mobileError) {
      setMobileError("");
    }
  };

  const handleMobileKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && mobile.length === 10 && validateIndianMobile(mobile) && !sending) {
      e.preventDefault();
      handleSendOTP();
    }
  };

  const handleSendOTP = async () => {

    if (!mobile || mobile.length !== 10) {
      setMobileError("Please enter a valid 10-digit mobile number");
      return;
    }

    if (!validateIndianMobile(mobile)) {
      setMobileError("Please enter a valid Indian mobile number");
      return;
    }

    setSending(true);
    setMobileError("");

    try {

      const res = await fetch(buildApiUrl(API_ENDPOINTS.user.sendOtp), {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ phone: mobile })
      });

      const data = await res.json();

      if (data.status === 300) {
        showToast.error("OTP resend limit reached.");
        return;
      }

      if (!res.ok || data.status !== 200) {
        throw new Error(data.msg || "Failed to send OTP");
      }

      if (data.sessionId) {
        localStorage.setItem("sessionId", data.sessionId);
      }

      setOtp(["", "", "", ""]);
      setOtpError("");
      setOtpAttempts(0);

      setStep("otp");
      setResendTimer(60);
      setCanResend(false);

    } catch (error: any) {
      showToast.error(error.message || "Something went wrong");
    } finally {
      setSending(false);
    }
  };

  const handleEnterNewNumber = () => {
    setStep("mobile");
    setOtp(["", "", "", ""]);
    setResendTimer(60);
    setCanResend(false);
    setVerifying(false);
    setMobile("");
    setOtpError("");
    setOtpAttempts(0);
    setWrongCycle(0);
  };

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (otpError) setOtpError("");

    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (pastedData.length > 0) {
      const newOtp = [...otp];
      for (let i = 0; i < 4; i++) {
        newOtp[i] = pastedData[i] || "";
      }
      setOtp(newOtp);
      const nextIndex = Math.min(pastedData.length, 3);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    if (e.key === "Enter") {
      const enteredOtp = otp.join("");
      if (enteredOtp.length === 4 && !verifying) {
        e.preventDefault();
        handleVerifyOTP();
      }
    }
  };

  const handleVerifyOTP = async () => {
    const enteredOtp = otp.join("");
    if (!/^\d{4}$/.test(enteredOtp)) {
      showToast.error("Please enter a valid 4-digit OTP");
      return;
    }
    setVerifying(true);
    try {
      const sessionId = localStorage.getItem("sessionId") || "";
      const res = await fetch(buildApiUrl(API_ENDPOINTS.user.loginUser), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: mobile,
          otp: enteredOtp,
          sessionId,
        }),
      });
      const data = await res.json();
      if (data?.status === 200) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("userId", String(data.data.id));
        localStorage.setItem("userPhone", data.data.phone);
        window.dispatchEvent(new Event("storage"));
        router.push("/");
        return;
      }
      const nextAttempt = otpAttempts + 1;
      setOtpAttempts(nextAttempt);
      if (nextAttempt >= MAX_OTP_ATTEMPTS) {
        const nextCycle = wrongCycle + 1;
        setWrongCycle(nextCycle);
        setOtp(["", "", "", ""]);
        if (nextCycle < MAX_WRONG_CYCLES) {
          setOtpError("Multiple wrong OTPs entered. Please try again in a few minutes.");
          setResendTimer(60);
          setCanResend(false);
        } else {
          setOtpError("Maximum OTP attempts reached.");
          setCanResend(false);
          setResendTimer(0);
        }
      } else {
        setOtpError(`OTP invalid. ${MAX_OTP_ATTEMPTS - nextAttempt} attempts left.`);
      }
    } catch (error: any) {
      setOtpError("OTP entered is invalid. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="w-full pt-32 flex flex-col pt-40 items-center justify-center  px-6 py-12" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <div className="w-full max-w-sm text-center">
        <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: "var(--font-carlasans-bold)" }}>
          Login
        </h1>
        <p className="text-gray-600 mt-2   text-[15px]" style={{ fontFamily: "var(--font-outfit-light)" }}>
          Enter your fragrance world
        </p>
        {step === "otp" && (
          <button
            disabled={otpError === "Maximum OTP attempts reached."}
            onClick={() => {
              if (otpError === "Maximum OTP attempts reached.") return;
              setStep("mobile");
              setOtp(["", "", "", ""]);
              setResendTimer(60);
              setCanResend(false);
              setVerifying(false);
              setMobileError("");
            }}
            className={`flex items-center justify-center gap-2 mt-4 mb-3 transition ${otpError === "Maximum OTP attempts reached."
              ? "text-gray-400 cursor-not-allowed"
              : "text-[#CCAC6D] hover:text-[#b8955a]"
              }`}
          >
            <ArrowLeft size={18} />
            <span className="text-sm font-light">Change Number</span>
          </button>
        )}
        {step === "mobile" && (
          <div className="mt-10 space-y-6">
            <div className="text-left">
              <label className="block text-sm font-light text-black-500 mb-2">
                Mobile Number
              </label>
              <div className="flex">
                <span className="px-4 py-4 bg-[#F8F5F0] border border-r-0 border-black-500 rounded-l-xl text-gray-700 font-medium">
                  +91
                </span>
                <input
                  type="tel"
                  maxLength={10}
                  value={mobile}
                  onChange={handleMobileChange}
                  onKeyDown={handleMobileKeyDown}
                  placeholder="8X4XX 69XXX"
                  className={`w-full px-4 py-4 border rounded-r-xl outline-none transition text-lg bg-white ${mobileError ? "border-red-500" : "border-black-500"
                    }`}
                />
              </div>
              {mobileError && (
                <p className="text-red-500 text-sm mt-2 text-left">{mobileError}</p>
              )}
            </div>
            <button
              onClick={handleSendOTP}
              disabled={sending || mobile.length !== 10 || !validateIndianMobile(mobile)}
              className={`w-full py-4 rounded-xl text-white font-Normal text-[16px] shadow-md transition ${sending || mobile.length !== 10 || !validateIndianMobile(mobile)
                ? "bg-[#1A1A1A] cursor-not-allowed"
                : "bg-[#CCAC6D] hover:bg-[#b8955a] active:scale-95"
                }`}
            >
              {sending ? "Sending OTP..." : "CONTINUE"}
            </button>
          </div>
        )}
        {step === "otp" && (
          <div className="mt-5 space-y-6">
            <div className="bg-[#F8F5F0] rounded-2xl px-6 py-8 min-h-[180px]">
              <p className="text-gray-600 text-sm">
                We sent a 4-digit code to
              </p>
              <p className="text-lg font-semibold text-black-200">
                +91 {mobile.replace(/(\d{5})(\d{5})/, "$1 $2")}
              </p>
              <div className="flex justify-center gap-4 mt-4">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    disabled={
                      wrongCycle >= MAX_WRONG_CYCLES ||
                      (otpAttempts >= MAX_OTP_ATTEMPTS && resendTimer > 0)
                    }
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    className={`w-14 h-14 text-2xl font-bold text-center border-2 rounded-xl transition bg-white shadow-inner ${digit ? "border-gray-700" : "border-gray-500"} focus:border-[#CCAC6D] focus:ring-2 focus:ring-[#CCAC6D]/30`}
                  />
                ))}
              </div>
              {otpError && (
                <>
                  <div className="mt-4 flex items-center justify-center gap-2 bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                    <span className="text-red-500">⚠</span>
                    <span>{otpError}</span>
                  </div>

                  {otpError === "Maximum OTP attempts reached." && (
                    <button
                      onClick={handleEnterNewNumber}
                      className="mt-3 text-[#CCAC6D] font-medium hover:underline text-sm"
                    >
                      Enter new number
                    </button>
                  )}
                </>
              )}
              {wrongCycle < MAX_WRONG_CYCLES && otpError !== "Maximum OTP attempts reached." && (
                <p className="text-center text-sm mt-4 text-gray-600">

                  {canResend ? (
                    <button
                      onClick={handleSendOTP}
                      className="text-[#CCAC6D] font-medium hover:underline"
                    >
                      Resend OTP
                    </button>
                  ) : (
                    <>
                      Resend OTP in <span className="font-medium">{resendTimer}s</span>
                    </>
                  )}

                </p>
              )}
            </div>
            <button
              onClick={handleVerifyOTP}
              disabled={
                verifying ||
                otp.join("").length < 4 ||
                (otpAttempts >= MAX_OTP_ATTEMPTS && !canResend) ||
                wrongCycle >= MAX_WRONG_CYCLES
              }
              className={`w-full py-4 rounded-xl text-white font-semibold text-lg shadow-md transition ${verifying || otp.join("").length < 4 || otpAttempts >= MAX_OTP_ATTEMPTS
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-[#CCAC6D] hover:bg-[#b8955a] active:scale-95"
                }`}
            >
              {verifying ? "Verifying..." : "Verify & Login"}
            </button>
          </div>
        )}
      </div>
    </div >
  );

}