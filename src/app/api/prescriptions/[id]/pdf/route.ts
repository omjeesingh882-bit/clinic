import { NextRequest, NextResponse } from "next/server";
import { getPrescriptionById } from "@/actions/prescriptions";
import { format } from "date-fns";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  const prescription = await getPrescriptionById(id);
  
  if (!prescription) {
    return new NextResponse("Prescription not found", { status: 404 });
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>ClinicOCR Prescription Report</title>
        <style>
          body { font-family: 'Inter', sans-serif; color: #1e293b; line-height: 1.5; padding: 40px; max-width: 800px; margin: 0 auto; }
          h1 { color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 5px; }
          .header { margin-bottom: 30px; }
          .patient-info { background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 30px; border: 1px solid #e2e8f0; }
          .section { margin-bottom: 30px; }
          h2 { color: #334155; font-size: 1.25rem; margin-bottom: 15px; border-bottom: 1px solid #f1f5f9; padding-bottom: 5px; }
          table { border-collapse: collapse; margin-bottom: 20px; width: 100%; }
          th, td { border: 1px solid #e2e8f0; padding: 12px; text-align: left; }
          th { background: #f8fafc; font-weight: 600; color: #475569; }
          .tag { display: inline-block; background: #e0f2fe; color: #0284c7; padding: 4px 8px; border-radius: 4px; font-size: 12px; margin-right: 8px; margin-bottom: 8px; }
          .footer { margin-top: 50px; font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px; }
          .monospace { font-family: monospace; background: #f1f5f9; padding: 15px; border-radius: 6px; white-space: pre-wrap; font-size: 13px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>ClinicOCR Prescription Report</h1>
          <p style="color: #64748b; margin-top: 0;">Generated on ${format(new Date(), "PPp")}</p>
        </div>
        
        <div class="patient-info">
          <table style="border: none; margin: 0; padding: 0;">
            <tr>
              <td style="border: none; padding: 4px 0;"><strong>Patient:</strong> ${prescription.patient?.name || 'Unknown'}</td>
              <td style="border: none; padding: 4px 0;"><strong>Prescription Date:</strong> ${prescription.date ? format(new Date(prescription.date), "PPP") : 'Unknown'}</td>
            </tr>
          </table>
        </div>

        <div class="section">
          <h2>AI Summary</h2>
          <p>${prescription.summary || 'No summary available.'}</p>
        </div>

        <div class="section">
          <h2>Medicines</h2>
          ${prescription.medicines && prescription.medicines.length > 0 ? `
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Dosage</th>
                  <th>Frequency</th>
                </tr>
              </thead>
              <tbody>
                ${prescription.medicines.map((m: any) => `
                  <tr>
                    <td><strong>${m.name}</strong></td>
                    <td>${m.dosage}</td>
                    <td>${m.frequency}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : '<p>No medicines listed.</p>'}
        </div>

        <div class="section">
          <h2>Corrected Text</h2>
          <div class="monospace">${prescription.correctedText || 'No text available.'}</div>
        </div>

        <div class="section">
          <h2>Doctor Notes</h2>
          <p>${prescription.notes || 'No notes.'}</p>
        </div>

        <div class="section">
          <h2>Important Findings</h2>
          <ul>
            ${prescription.findings?.map((f: string) => `<li>${f}</li>`).join('') || '<li>None</li>'}
          </ul>
        </div>
        
        <div class="footer">
          ClinicOCR - Medical AI Assistant
        </div>
      </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html",
      "Content-Disposition": `attachment; filename="prescription-report-${id}.html"`,
    },
  });
}
