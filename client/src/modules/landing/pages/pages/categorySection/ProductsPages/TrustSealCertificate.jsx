// TrustSealCertificate.jsx
import React from "react";
import { format } from "date-fns";
import { CheckCircle2 } from "lucide-react";
import trust from "@/assets/images/1.png";
import trustLogo from "@/assets/images/logo.png";

const TrustSealCertificate = (props) => {
  const {
    companyName = "Company Name",
    address = "Address not provided",
    director = "Not Specified",
    gstin = "N/A",
    mobile = "N/A",
    email = "N/A",
    issueDate = new Date(),
    expiryDate = new Date(),
  } = props;
  console.log("TrustSealCertificate All Props Received:", props);
  console.log("TrustSealCertificate - Specific Prop Check:", { email, hasEmail: !!email, isNA: email === "N/A" });
  
  const safeDate = (dateVal) => {
    try {
      const d = new Date(dateVal);
      return isNaN(d.getTime()) ? new Date() : d;
    } catch {
      return new Date();
    }
  };

  const formattedIssueDate = format(safeDate(issueDate), "do MMMM yyyy");
  const formattedExpiryDate = format(safeDate(expiryDate), "do MMMM yyyy");

  const floralPattern = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M0 0 Q 50 0 50 50 Q 0 50 0 0' fill='%23c5a059' opacity='0.15'/%3E%3Cpath d='M0 20 Q 30 20 30 50' stroke='%23c5a059' fill='none' stroke-width='0.5'/%3E%3C/svg%3E")`;

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      width: "100%",
    }}>
      <div
        style={{
          width: "100%",
          maxWidth: "210mm",
          aspectRatio: "1 / 1.414",
          backgroundColor: "#ffffff",
          position: "relative",
          padding: "5%",
          boxSizing: "border-box",
          boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.15)",
          borderRadius: "4px"
        }}
      >
        {/* Background Patterns */}
        <div style={{ position: "absolute", top: 0, left: 0, width: "25%", height: "25%", backgroundImage: floralPattern, backgroundSize: "cover" }}></div>
        <div style={{ position: "absolute", top: 0, right: 0, width: "25%", height: "25%", backgroundImage: floralPattern, backgroundSize: "cover", transform: "rotate(90deg)" }}></div>
        <div style={{ position: "absolute", bottom: 0, left: 0, width: "25%", height: "25%", backgroundImage: floralPattern, backgroundSize: "cover", transform: "rotate(270deg)" }}></div>
        <div style={{ position: "absolute", bottom: 0, right: 0, width: "25%", height: "25%", backgroundImage: floralPattern, backgroundSize: "cover", transform: "rotate(180deg)" }}></div>

        <div style={{
          border: "4px double #0c1f4d",
          height: "100%",
          width: "100%",
          padding: "4%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          position: "relative",
          zIndex: 1,
        }}>
          <div style={{ marginBottom: "2%" }}>
            <img src={trust} alt="Trust Seal" style={{ height: "auto", width: "80px", maxWidth: "15vw" }} />
          </div>

          <div style={{ textAlign: "center" }}>
            <h1 style={{ fontFamily: "serif", fontSize: "clamp(24px, 4vw, 48px)", color: "#846734", margin: 0, fontWeight: "400" }}>
              Certificate of Trust
            </h1>
            <div style={{ height: "1px", width: "40%", backgroundColor: "#c5a059", margin: "1% auto" }}></div>
            <p style={{ textTransform: "uppercase", letterSpacing: "2px", color: "#a1a1aa", fontSize: "clamp(8px, 1.2vw, 12px)", fontWeight: "600", margin: 0 }}>
              This document serves to certify that
            </p>
          </div>

          <div style={{ margin: "2% 0", textAlign: "center" }}>
            <h2 style={{ fontFamily: "serif", fontSize: "clamp(20px, 3.5vw, 40px)", fontWeight: "bold", color: "#0c1f4d", lineHeight: "1.1", margin: 0 }}>
              {companyName}
            </h2>
            <div style={{ height: "4px", width: "10%", backgroundColor: "#059669", margin: "1% auto 0" }}></div>
          </div>

          <p style={{ textAlign: "center", fontSize: "clamp(12px, 1.5vw, 18px)", fontStyle: "italic", color: "#52525b", maxWidth: "85%", marginBottom: "3%", fontFamily: "serif" }}>
            Has successfully completed the verification process and is recognized as a verified business within the
            <span style={{ fontWeight: "bold", fontStyle: "normal", color: "#18181b", display: "block" }}>Huntsworld Global Network.</span>
          </p>

          <div style={{ width: "100%", padding: "0 5%" }}>
            <div style={{ backgroundColor: "#fafafa", border: "1px solid #f4f4f5", padding: "3%", borderRadius: "4px" }}>
              <h4 style={{ fontSize: "clamp(8px, 1vw, 10px)", textTransform: "uppercase", color: "#a1a1aa", marginBottom: "2%", fontWeight: "bold", borderBottom: "1px solid #e4e4e7" }}>
                Verification Details
              </h4>
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "8px" }}>
                {[
                  { label: "Director", value: director },
                  { label: "GSTIN", value: gstin },
                  { label: "Address", value: address },
                  { label: "Contact", value: email }
                ].filter(item => item.value && item.value !== "N/A").map((item, idx) => (
                  <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                    <CheckCircle2 style={{ color: "#059669", height: "14px", width: "14px", marginTop: "2px" }} />
                    <div>
                      <span style={{ display: "block", fontSize: "clamp(7px, 0.9vw, 9px)", textTransform: "uppercase", color: "#a1a1aa", fontWeight: "bold" }}>{item.label}</span>
                      <span style={{ color: "#27272a", fontWeight: "500", fontSize: "clamp(10px, 1.2vw, 14px)" }}>{item.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ marginTop: "auto", width: "100%", padding: "0 5% 2%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "4%" }}>
              <div style={{ textAlign: "center", borderTop: "1px solid #e4e4e7", paddingTop: "5px", flex: 1 }}>
                <p style={{ fontSize: "clamp(7px, 1vw, 10px)", color: "#a1a1aa", fontWeight: "bold", margin: 0 }}>Issue Date</p>
                <p style={{ fontWeight: "bold", fontSize: "clamp(9px, 1.2vw, 12px)", margin: 0 }}>{formattedIssueDate}</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
                <div style={{ width: '60%', minWidth: '80px', height: 'auto', backgroundColor: '#0c1f4d', padding: '5px', borderRadius: '2px', marginBottom: '5px' }}>
                  <img src={trustLogo} alt="Logo" style={{ width: '100%', height: 'auto' }} />
                </div>
              </div>
              <div style={{ textAlign: "center", borderTop: "1px solid #e4e4e7", paddingTop: "5px", flex: 1 }}>
                <p style={{ fontSize: "clamp(7px, 1vw, 10px)", color: "#a1a1aa", fontWeight: "bold", margin: 0 }}>Expiry Date</p>
                <p style={{ fontWeight: "bold", fontSize: "clamp(9px, 1.2vw, 12px)", margin: 0 }}>{formattedExpiryDate}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrustSealCertificate;
