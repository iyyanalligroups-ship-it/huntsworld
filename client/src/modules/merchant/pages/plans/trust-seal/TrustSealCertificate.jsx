import React, { useRef, useState } from "react";
import { format } from "date-fns";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";
import { ShieldCheck, CheckCircle2 } from "lucide-react";
import trust from "@/assets/images/1.png";
import trustLogo from "@/assets/images/logo.png";

const TrustSealCertificate = ({
  companyName = "Company Name",
  address = "Address not provided",
  director = "Not Specified",
  gstin = "N/A",
  mobile = "N/A",
  email = "N/A",
  issueDate = new Date(),
  expiryDate = new Date(),
}) => {
  const certificateRef = useRef(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadCertificate = async () => {
    if (!certificateRef.current) return;

    try {
      setIsDownloading(true);
      
      const element = certificateRef.current;
      
      // We use a slight delay to ensure everything is rendered
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true, 
        logging: false,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Certificate_${companyName.replace(/\s+/g, "_")}.pdf`);
    } catch (error) {
      console.error("Download failed:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  const formattedIssueDate = format(new Date(issueDate), "do MMMM yyyy");
  const formattedExpiryDate = format(new Date(expiryDate), "do MMMM yyyy");

  // Floral pattern using standard hex colors
  const floralPattern = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M0 0 Q 50 0 50 50 Q 0 50 0 0' fill='%23c5a059' opacity='0.15'/%3E%3Cpath d='M0 20 Q 30 20 30 50' stroke='%23c5a059' fill='none' stroke-width='0.5'/%3E%3C/svg%3E")`;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", backgroundColor: "#f4f4f5", padding: "24px", minHeight: "100vh" }}>
      
      {/* Action Bar - Kept separate from the capture area */}
      <div id="download-button-container" style={{ width: "100%", maxWidth: "210mm", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h3 style={{ color: "#71717a", fontWeight: "500", display: "flex", alignItems: "center", gap: "8px" }}>
          <ShieldCheck style={{ height: "20px", width: "20px", color: "#10b981" }} />
          Certificate Preview
        </h3>
        <Button
          onClick={downloadCertificate}
          disabled={isDownloading}
          style={{ backgroundColor: "#18181b", color: "#ffffff" }}
        >
          {isDownloading ? "Generating..." : "Download PDF"}
        </Button>
      </div>

      {/* Main Certificate Container - EXPLICIT HEX COLORS ONLY */}
      <div
        ref={certificateRef}
        style={{
          width: "210mm",
          height: "297mm",
          backgroundColor: "#ffffff",
          position: "relative",
          padding: "15mm",
          boxSizing: "border-box",
          overflow: "hidden",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)"
        }}
      >
        {/* Floral Corners */}
        <div style={{ position: "absolute", top: 0, left: 0, width: "180px", height: "180px", backgroundImage: floralPattern, backgroundSize: "cover" }}></div>
        <div style={{ position: "absolute", top: 0, right: 0, width: "180px", height: "180px", backgroundImage: floralPattern, backgroundSize: "cover", transform: "rotate(90deg)" }}></div>
        <div style={{ position: "absolute", bottom: 0, left: 0, width: "180px", height: "180px", backgroundImage: floralPattern, backgroundSize: "cover", transform: "rotate(270deg)" }}></div>
        <div style={{ position: "absolute", bottom: 0, right: 0, width: "180px", height: "180px", backgroundImage: floralPattern, backgroundSize: "cover", transform: "rotate(180deg)" }}></div>

        {/* Decorative Border Frame */}
        <div style={{
          border: "8px double #0c1f4d",
          height: "100%",
          width: "100%",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          position: "relative",
          zIndex: 1,
          backgroundColor: "transparent"
        }}>
          
          <div style={{ marginTop: "16px", marginBottom: "16px" }}>
            <img src={trust} alt="Trust Seal" style={{ height: "110px", width: "110px", objectFit: "contain" }} />
          </div>

          <div style={{ textAlign: "center" }}>
            <h1 style={{ 
              fontFamily: "serif",
              fontSize: "56px", 
              color: "#846734",
              margin: 0,
              fontWeight: "400"
            }}>
              Certificate of Trust
            </h1>
            <div style={{ height: "1px", width: "250px", backgroundColor: "#c5a059", margin: "12px auto" }}></div>
            <p style={{ textTransform: "uppercase", letterSpacing: "4px", color: "#a1a1aa", fontSize: "12px", fontWeight: "600", margin: 0 }}>
              This document serves to certify that
            </p>
          </div>

          <div style={{ margin: "16px 0", textAlign: "center" }}>
            <h2 style={{ 
              fontFamily: "serif",
              fontSize: "45px", 
              fontWeight: "bold", 
              color: "#0c1f4d",
              lineHeight: "1.1",
              margin: 0
            }}>
              {companyName}
            </h2>
            <div style={{ height: "4px", width: "64px", backgroundColor: "#059669", margin: "12px auto 0" }}></div>
          </div>

          <p style={{ textAlign: "center", fontSize: "18px", fontStyle: "italic", color: "#52525b", maxWidth: "80%", marginBottom: "24px", fontFamily: "serif" }}>
            Has successfully completed the verification process and is hereby recognized as a verified and reliable business entity within the 
            <span style={{ fontWeight: "bold", fontStyle: "normal", color: "#18181b", display: "block", marginTop: "4px" }}>Huntsworld Global Network.</span>
          </p>

          {/* Verification Details Table */}
          <div style={{ width: "100%", padding: "0 40px" }}>
            <div style={{ backgroundColor: "#fafafa", border: "1px solid #f4f4f5", padding: "20px", borderRadius: "4px" }}>
               <h4 style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "2px", color: "#a1a1aa", marginBottom: "16px", fontWeight: "bold", borderBottom: "1px solid #e4e4e7", paddingBottom: "8px", marginTop: 0 }}>
                 Verification Details
               </h4>
               
               <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "12px" }}>
                  {[
                    { label: "Director", value: director },
                    { label: "GSTIN", value: gstin },
                    { label: "Registered Address", value: address },
                    { label: "Contact Info", value: email }
                  ].filter(item => item.value && item.value !== "N/A").map((item, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                      <CheckCircle2 style={{ color: "#059669", height: "18px", width: "18px", marginTop: "2px" }} />
                      <div>
                        <span style={{ display: "block", fontSize: "10px", textTransform: "uppercase", color: "#a1a1aa", fontWeight: "bold" }}>{item.label}</span>
                        <span style={{ color: "#27272a", fontWeight: "500" }}>{item.value}</span>
                      </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>

          {/* Footer Section */}
          <div style={{ marginTop: "auto", marginBottom: "8px", width: "100%", padding: "0 40px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "24px" }}>
               <div style={{ textAlign: "center", borderTop: "2px solid #e4e4e7", paddingTop: "12px", flex: 1 }}>
                  <p style={{ fontSize: "11px", textTransform: "uppercase", color: "#a1a1aa", fontWeight: "bold", margin: "0 0 4px 0" }}>Issue Date</p>
                  <p style={{ fontWeight: "bold", color: "#18181b", margin: 0 }}>{formattedIssueDate}</p>
               </div>
               
               {/* Fixed Footer Logo Area - NO TAILWIND CLASSES */}
               <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, padding: "0 10px" }}>
                 <div 
                   style={{ 
                     width: '150px', 
                     height: '50px', 
                     backgroundColor: '#0c1f4d', 
                     display: 'flex', 
                     alignItems: 'center', 
                     justifyContent: 'center',
                     borderRadius: '2px',
                     marginBottom: '8px'
                   }}
                 >
                   <img src={trustLogo} alt="Logo" style={{ height: '30px', width: '120px', objectFit: 'contain' }} />
                 </div>
                 <p style={{ fontSize: "8px", color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "0px", textAlign: "center", maxWidth: "180px", lineHeight: "1.2", margin: 0 }}>
                   This is a system generated certificate and no physical signature is required.
                 </p>
               </div>

               <div style={{ textAlign: "center", borderTop: "2px solid #e4e4e7", paddingTop: "12px", flex: 1 }}>
                  <p style={{ fontSize: "11px", textTransform: "uppercase", color: "#a1a1aa", fontWeight: "bold", margin: "0 0 4px 0" }}>Expiry Date</p>
                  <p style={{ fontWeight: "bold", color: "#18181b", margin: 0 }}>{formattedExpiryDate}</p>
               </div>
            </div>

            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: "10px", color: "#a1a1aa", textTransform: "uppercase", lineHeight: "1.5", margin: 0 }}>
                Huntsworld Pvt Ltd. | MG Road, Kottakuppam, Pondicherry, India - 607002
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default TrustSealCertificate;