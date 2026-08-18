import { NextRequest, NextResponse } from "next/server";
import { getPublicPrescriptionForParent } from "@/actions/portal";
import { format } from "date-fns";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const searchParams = request.nextUrl.searchParams;
  const patientId = searchParams.get("patientId");

  if (!patientId) {
    return new NextResponse("Patient verification parameter missing", { status: 400 });
  }

  const prescription = await getPublicPrescriptionForParent(id, patientId);

  if (!prescription) {
    return new NextResponse("Prescription record not found or access denied", { status: 404 });
  }

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <title>Medical Prescription Report - ${prescription.patientName}</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
            color: #1e293b; 
            line-height: 1.5; 
            padding: 36px; 
            max-width: 820px; 
            margin: 0 auto; 
            background: #ffffff;
          }
          .header-box { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            border-bottom: 2px solid #2563eb; 
            padding-bottom: 16px; 
            margin-bottom: 24px; 
          }
          .clinic-title { 
            color: #1e3a8a; 
            font-size: 24px; 
            font-weight: 700; 
            margin: 0; 
          }
          .clinic-sub { 
            color: #64748b; 
            font-size: 13px; 
            margin-top: 4px; 
          }
          .badge-read { 
            background: #eff6ff; 
            color: #1d4ed8; 
            border: 1px solid #bfdbfe; 
            padding: 4px 10px; 
            border-radius: 9999px; 
            font-size: 12px; 
            font-weight: 600; 
          }
          .patient-card { 
            background: #f8fafc; 
            padding: 18px; 
            border-radius: 8px; 
            margin-bottom: 24px; 
            border: 1px solid #e2e8f0; 
            display: grid; 
            grid-template-columns: repeat(2, 1fr); 
            gap: 12px; 
            font-size: 14px; 
          }
          .patient-card div strong { 
            color: #475569; 
            display: inline-block; 
            min-width: 110px; 
          }
          .section { 
            margin-bottom: 24px; 
          }
          h2 { 
            color: #0f172a; 
            font-size: 16px; 
            font-weight: 600; 
            margin-bottom: 10px; 
            border-bottom: 1px solid #f1f5f9; 
            padding-bottom: 6px; 
            text-transform: uppercase; 
            letter-spacing: 0.5px; 
          }
          table { 
            border-collapse: collapse; 
            margin-bottom: 16px; 
            width: 100%; 
            font-size: 14px; 
          }
          th, td { 
            border: 1px solid #e2e8f0; 
            padding: 10px 14px; 
            text-align: left; 
          }
          th { 
            background: #f1f5f9; 
            font-weight: 600; 
            color: #334155; 
          }
          .tag { 
            display: inline-block; 
            background: #f0fdf4; 
            color: #166534; 
            border: 1px solid #bbf7d0; 
            padding: 3px 8px; 
            border-radius: 4px; 
            font-size: 12px; 
            margin-right: 6px; 
            margin-bottom: 6px; 
          }
          .notes-box { 
            background: #fdfefe; 
            border: 1px solid #e2e8f0; 
            border-left: 4px solid #2563eb; 
            padding: 14px; 
            border-radius: 4px; 
            font-size: 14px; 
            color: #334155; 
            white-space: pre-wrap; 
          }
          .footer { 
            margin-top: 40px; 
            font-size: 12px; 
            color: #94a3b8; 
            text-align: center; 
            border-top: 1px solid #e2e8f0; 
            padding-top: 16px; 
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header-box">
          <div>
            <h1 class="clinic-title">Medical Prescription & Report</h1>
            <div class="clinic-sub">Attending Doctor: Dr. ${prescription.doctorName || 'Clinic Doctor'}</div>
          </div>
          <div class="badge-read">Official Patient Copy (Read-Only)</div>
        </div>

        <div class="patient-card">
          <div><strong>Patient Name:</strong> ${prescription.patientName}</div>
          <div><strong>Report Date:</strong> ${prescription.dateString}</div>
          <div><strong>Age / Gender:</strong> ${prescription.patientAge} yrs • ${prescription.patientGender}</div>
          <div><strong>Contact Phone:</strong> ${prescription.patientPhone || 'N/A'}</div>
        </div>

        <div class="section">
          <h2>Clinical Visit Summary</h2>
          <p style="margin: 0; font-size: 14px; color: #334155;">${prescription.summary || 'Clinical record digitized successfully.'}</p>
        </div>

        <div class="section">
          <h2>Prescribed Medications</h2>
          ${
            prescription.medicines && prescription.medicines.length > 0
              ? `
            <table>
              <thead>
                <tr>
                  <th style="width: 35%;">Medication Name</th>
                  <th style="width: 30%;">Dosage</th>
                  <th style="width: 35%;">Frequency & Timing</th>
                </tr>
              </thead>
              <tbody>
                ${prescription.medicines
                  .map(
                    (m: any) => `
                  <tr>
                    <td><strong>${m.name}</strong></td>
                    <td>${m.dosage || 'As advised'}</td>
                    <td>${m.frequency || 'As directed'}</td>
                  </tr>
                `
                  )
                  .join('')}
              </tbody>
            </table>
          `
              : '<p style="font-size: 14px; color: #64748b;">No specific medications listed for this visit.</p>'
          }
        </div>

        ${
          prescription.findings && prescription.findings.length > 0
            ? `
          <div class="section">
            <h2>Important Findings & Instructions</h2>
            <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #334155;">
              ${prescription.findings.map((f: string) => `<li style="margin-bottom: 6px;">${f}</li>`).join('')}
            </ul>
          </div>
        `
            : ''
        }

        ${
          prescription.notes
            ? `
          <div class="section">
            <h2>Doctor's Notes</h2>
            <div class="notes-box">${prescription.notes}</div>
          </div>
        `
            : ''
        }

        <div class="footer">
          <p style="margin: 0 0 4px 0;">This document is a digitized summary for parent and patient informational reference.</p>
          <p style="margin: 0;">Generated securely via Clinic Patient & Parent Portal on ${format(new Date(), 'PPP')}</p>
        </div>
      </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html",
      "Content-Disposition": `inline; filename="prescription-report-${prescription.patientName.replace(/\s+/g, '_')}-${id}.html"`,
    },
  });
}
