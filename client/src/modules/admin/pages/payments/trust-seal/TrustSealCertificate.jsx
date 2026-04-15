// TrustSealCertificate.jsx
import { format } from "date-fns";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import trust from "@/assets/images/1.png"

const TrustSealCertificate = ({
  companyName,
  address,
  director,
  gstin,

  mobile,
  email,
  issueDate,
  expiryDate,
}) => {
  const certificateRef = useRef();

 const downloadCertificate = () => {
  const certificate = document.getElementById("certificate");
  html2canvas(certificate, { scale: 2 }).then((canvas) => {
    const pdf = new jsPDF("p", "mm", "a4");
    const imgData = canvas.toDataURL("image/png");

    const margin = 8; // 8mm margin
    const pageWidth = 210;
    const pageHeight = 297;
    const imgWidth = pageWidth - margin * 2;
    const imgHeight = pageHeight - margin * 2;

    pdf.addImage(imgData, "PNG", margin, margin, imgWidth, imgHeight);
    pdf.save("certificate.pdf");
  });
};

  const formattedIssueDate = format(new Date(issueDate), "do MMM yyyy");
  const formattedExpiryDate = format(new Date(expiryDate), "do MMM yyyy");

  return (
    <div style={{ position: "relative", backgroundColor: "rgb(255,255,255)",height:"600px",overflowY:"auto" }}>
      {/* Download Button */}
      <div style={{ position: "", left: "20px", top: "40px" }}>
         <Button
          onClick={downloadCertificate}
          variant="ghost"
          size="icon"
          className="bg-zinc-900 hover:bg-zinc-800 text-white rounded-md m-1 cursor-pointer"
        >
          <Download className="h-5 w-5" />
        </Button>
      </div>

      {/* Certificate Content */}
      <div
        ref={certificateRef}
        id="certificate"
        style={{
          border: "2px solid rgb(202, 138, 4)", // yellow-600
          borderRadius: "8px",
          padding: "24px",
          backgroundColor: "rgb(255,255,255)",
          maxWidth: "42rem",
          margin: "0 auto",
          boxShadow: "0 10px 15px rgba(0,0,0,0.1)",
          position: "relative",
        }}
      >
        <div
               className="flex justify-center"
              >
                <img src={trust} alt="Trust Seal" className="h-[80px] w-[80px]" />
              </div>

        <h1
          style={{
            textAlign: "center",
            fontSize: "1.5rem",
            fontWeight: "bold",
            color: "rgb(31,41,55)", // gray-800
            marginTop: "2rem",
          }}
        >
          CERTIFICATE OF TRUST
        </h1>

        <h2
          style={{
            textAlign: "center",
            fontSize: "1.25rem",
            fontWeight: "600",
            color: "rgb(31,41,55)",
            marginTop: "1rem",
          }}
        >
          {companyName}
        </h2>
        <p
          style={{
            textAlign: "center",
            color: "rgb(75,85,99)", // gray-600
          }}
        >
          {address.split(", ").slice(-2).join(", ")}
        </p>

        <p
          style={{
            textAlign: "center",
            color: "rgb(75,85,99)",
            marginTop: "1rem",
          }}
        >
          has been certified as a trusted member of Huntsworld
        </p>

        <hr
          style={{
            margin: "1rem 0",
            borderColor: "rgb(209,213,219)", // gray-300
          }}
        />

        <p style={{ color: "rgb(75,85,99)" }}>
          Following details of the company have been verified*
        </p>

        <ul style={{ marginTop: "1rem", listStyle: "none", padding: 0 }}>
          <li style={{ display: "flex", alignItems: "flex-start", marginBottom: "8px" }}>
            <span style={{ color: "rgb(34,197,94)", marginRight: "8px" }}>✓</span>
            <span>Director / Proprietor: {director}</span>
          </li>
          <li style={{ display: "flex", alignItems: "flex-start", marginBottom: "8px" }}>
            <span style={{ color: "rgb(34,197,94)", marginRight: "8px" }}>✓</span>
            <span>GSTIN: {gstin}</span>
          </li>
          <li style={{ display: "flex", alignItems: "flex-start", marginBottom: "8px" }}>
            <span style={{ color: "rgb(34,197,94)", marginRight: "8px" }}>✓</span>
            <span>Business Address: {address}</span>
          </li>
          <li style={{ display: "flex", alignItems: "flex-start", marginBottom: "8px" }}>
            <span style={{ color: "rgb(34,197,94)", marginRight: "8px" }}>✓</span>
            <span>Mobile Number: {mobile}</span>
          </li>
          <li style={{ display: "flex", alignItems: "flex-start", marginBottom: "8px" }}>
            <span style={{ color: "rgb(34,197,94)", marginRight: "8px" }}>✓</span>
            <span>Email Id: {email}</span>
          </li>
        </ul>

        <hr
          style={{
            margin: "1rem 0",
            borderColor: "rgb(209,213,219)",
          }}
        />

        <p
          style={{
            textAlign: "center",
            color: "rgb(75,85,99)",
          }}
        >
          Issue date: {formattedIssueDate} | Expiry date: {formattedExpiryDate}
        </p>

        <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
          <div
            style={{
              display: "inline-block",
              backgroundColor: "rgb(239,68,68)", // red-500
              color: "rgb(255,255,255)",
              fontWeight: "bold",
              padding: "8px",
              borderRadius: "4px",
            }}
          >
            Huntsworld
          </div>
          <p
            style={{
              fontSize: "0.75rem",
              color: "rgb(107,114,128)", // gray-500
              marginTop: "0.5rem",
            }}
          >
            Huntsworld Pvt Ltd. <br /> MG Road, Kottakuppam, Pondicherry, India - 607002
            <br /> Phone: 123-456-7890 | Email: contact@huntsworld.com
          </p>
        </div>
      </div>
    </div>
  );
};

export default TrustSealCertificate;
