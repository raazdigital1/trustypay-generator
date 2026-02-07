import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface PaystubRequest {
  employer: {
    companyName: string;
    addressLine1: string;
    city: string;
    state: string;
    zipCode: string;
    ein?: string;
    phone?: string;
    email?: string;
  };
  employee: {
    firstName: string;
    lastName: string;
    addressLine1: string;
    city: string;
    state: string;
    zipCode: string;
    ssnLastFour?: string;
    employeeId?: string;
  };
  earnings: {
    isHourly: boolean;
    regularHours: number;
    hourlyRate: number;
    salaryAmount: number;
    overtimeHours: number;
    overtimeRate: number;
    bonus: number;
    commission: number;
    tips: number;
    otherEarnings: number;
  };
  deductions: {
    federalTax: number;
    stateTax: number;
    socialSecurity: number;
    medicare: number;
    retirement401k: number;
    healthInsurance: number;
    otherDeductions: number;
  };
  payPeriod: {
    frequency: string;
    periodStart: string;
    periodEnd: string;
    payDate: string;
  };
  ytd: {
    grossPay: number;
    federalTax: number;
    stateTax: number;
    socialSecurity: number;
    medicare: number;
    netPay: number;
  };
  stateCode: string;
  includeYTD: boolean;
  templateId: string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function frequencyLabel(freq: string): string {
  const map: Record<string, string> = {
    weekly: "Weekly",
    bi_weekly: "Bi-Weekly",
    semi_monthly: "Semi-Monthly",
    monthly: "Monthly",
  };
  return map[freq] || freq;
}

// Simple PDF builder that creates a valid PDF document without external dependencies
function buildPdf(data: PaystubRequest): Uint8Array {
  const regularPay = data.earnings.isHourly
    ? data.earnings.regularHours * data.earnings.hourlyRate
    : data.earnings.salaryAmount;
  const overtimePay = data.earnings.overtimeHours * data.earnings.overtimeRate;
  const grossPay =
    regularPay +
    overtimePay +
    data.earnings.bonus +
    data.earnings.commission +
    data.earnings.tips +
    data.earnings.otherEarnings;
  const totalDeductions =
    data.deductions.federalTax +
    data.deductions.stateTax +
    data.deductions.socialSecurity +
    data.deductions.medicare +
    data.deductions.retirement401k +
    data.deductions.healthInsurance +
    data.deductions.otherDeductions;
  const netPay = grossPay - totalDeductions;

  // PDF construction using raw PDF syntax
  const objects: string[] = [];
  const offsets: number[] = [];

  // Helper to add PDF object
  let objCount = 0;
  function addObj(content: string): number {
    objCount++;
    objects.push(`${objCount} 0 obj\n${content}\nendobj\n`);
    return objCount;
  }

  // Object 1: Catalog
  addObj("<< /Type /Catalog /Pages 2 0 R >>");

  // Object 2: Pages
  addObj("<< /Type /Pages /Kids [3 0 R] /Count 1 >>");

  // Build the content stream
  const lines: string[] = [];
  const pageWidth = 612; // Letter size
  const pageHeight = 792;
  const margin = 50;
  const contentWidth = pageWidth - 2 * margin;
  let y = pageHeight - margin;

  function addText(
    text: string,
    x: number,
    yPos: number,
    fontSize: number = 10,
    bold: boolean = false
  ) {
    const font = bold ? "/F2" : "/F1";
    // Escape special PDF characters
    const escaped = text
      .replace(/\\/g, "\\\\")
      .replace(/\(/g, "\\(")
      .replace(/\)/g, "\\)");
    lines.push(`BT ${font} ${fontSize} Tf ${x} ${yPos} Td (${escaped}) Tj ET`);
  }

  function addLine(x1: number, y1: number, x2: number, y2: number, width: number = 0.5) {
    lines.push(`${width} w ${x1} ${y1} m ${x2} ${y2} l S`);
  }

  function addRect(x: number, yPos: number, w: number, h: number, r: number, g: number, b: number) {
    lines.push(`${r} ${g} ${b} rg ${x} ${yPos} ${w} ${h} re f`);
    lines.push("0 0 0 rg"); // Reset to black
  }

  // --- HEADER BACKGROUND ---
  addRect(margin, pageHeight - margin - 60, contentWidth, 60, 0.15, 0.25, 0.45);

  // --- HEADER TEXT (white) ---
  lines.push("1 1 1 rg");
  addText(data.employer.companyName || "Company Name", margin + 15, pageHeight - margin - 25, 16, true);
  addText(
    `${data.employer.addressLine1 || ""}, ${data.employer.city || ""}, ${data.employer.state || ""} ${data.employer.zipCode || ""}`,
    margin + 15,
    pageHeight - margin - 42,
    9
  );
  if (data.employer.ein) {
    addText(`EIN: ${data.employer.ein}`, margin + 15, pageHeight - margin - 54, 8);
  }

  // Right side header
  addText("EARNINGS STATEMENT", pageWidth - margin - 165, pageHeight - margin - 25, 12, true);
  addText(
    `Pay Date: ${formatDate(data.payPeriod.payDate)}`,
    pageWidth - margin - 140,
    pageHeight - margin - 42,
    9
  );
  lines.push("0 0 0 rg"); // Reset to black

  y = pageHeight - margin - 80;

  // --- EMPLOYEE & PAY PERIOD INFO ---
  addText("EMPLOYEE", margin, y, 9, true);
  addText("PAY PERIOD", pageWidth / 2 + 20, y, 9, true);
  y -= 4;
  addLine(margin, y, pageWidth - margin, y, 0.5);
  y -= 14;

  addText(
    `${data.employee.firstName || "First"} ${data.employee.lastName || "Last"}`,
    margin,
    y,
    10,
    true
  );
  addText(
    `${formatDate(data.payPeriod.periodStart)} - ${formatDate(data.payPeriod.periodEnd)}`,
    pageWidth / 2 + 20,
    y,
    10
  );
  y -= 14;

  addText(data.employee.addressLine1 || "", margin, y, 9);
  addText(`Frequency: ${frequencyLabel(data.payPeriod.frequency)}`, pageWidth / 2 + 20, y, 9);
  y -= 14;

  addText(
    `${data.employee.city || ""}, ${data.employee.state || ""} ${data.employee.zipCode || ""}`,
    margin,
    y,
    9
  );
  if (data.employee.employeeId) {
    addText(`Employee ID: ${data.employee.employeeId}`, pageWidth / 2 + 20, y, 9);
  }
  y -= 14;

  if (data.employee.ssnLastFour) {
    addText(`SSN: XXX-XX-${data.employee.ssnLastFour}`, margin, y, 9);
    y -= 14;
  }

  y -= 10;

  // --- EARNINGS TABLE ---
  addRect(margin, y - 2, contentWidth, 16, 0.93, 0.93, 0.93);
  addText("EARNINGS", margin + 5, y + 2, 9, true);
  addText("HOURS/UNITS", margin + 200, y + 2, 9, true);
  addText("RATE", margin + 300, y + 2, 9, true);
  addText("CURRENT", pageWidth - margin - 70, y + 2, 9, true);
  y -= 18;

  // Regular Pay
  if (data.earnings.isHourly) {
    addText("Regular Pay", margin + 5, y, 9);
    addText(data.earnings.regularHours.toString(), margin + 200, y, 9);
    addText(formatCurrency(data.earnings.hourlyRate), margin + 300, y, 9);
  } else {
    addText("Salary", margin + 5, y, 9);
    addText("-", margin + 200, y, 9);
    addText("-", margin + 300, y, 9);
  }
  addText(formatCurrency(regularPay), pageWidth - margin - 70, y, 9);
  y -= 14;

  // Overtime
  if (data.earnings.overtimeHours > 0) {
    addText("Overtime Pay", margin + 5, y, 9);
    addText(data.earnings.overtimeHours.toString(), margin + 200, y, 9);
    addText(formatCurrency(data.earnings.overtimeRate), margin + 300, y, 9);
    addText(formatCurrency(overtimePay), pageWidth - margin - 70, y, 9);
    y -= 14;
  }

  // Additional earnings
  const additionalEarnings = [
    { label: "Bonus", amount: data.earnings.bonus },
    { label: "Commission", amount: data.earnings.commission },
    { label: "Tips", amount: data.earnings.tips },
    { label: "Other Earnings", amount: data.earnings.otherEarnings },
  ];

  for (const item of additionalEarnings) {
    if (item.amount > 0) {
      addText(item.label, margin + 5, y, 9);
      addText("-", margin + 200, y, 9);
      addText("-", margin + 300, y, 9);
      addText(formatCurrency(item.amount), pageWidth - margin - 70, y, 9);
      y -= 14;
    }
  }

  // Gross Pay total
  addLine(margin, y + 4, pageWidth - margin, y + 4, 0.5);
  y -= 2;
  addText("GROSS PAY", margin + 5, y, 10, true);
  addText(formatCurrency(grossPay), pageWidth - margin - 70, y, 10, true);
  y -= 20;

  // --- DEDUCTIONS TABLE ---
  addRect(margin, y - 2, contentWidth, 16, 0.93, 0.93, 0.93);
  addText("DEDUCTIONS", margin + 5, y + 2, 9, true);
  addText("CURRENT", pageWidth - margin - 70, y + 2, 9, true);
  y -= 18;

  const deductionItems = [
    { label: "Federal Income Tax", amount: data.deductions.federalTax },
    { label: `State Income Tax (${data.stateCode})`, amount: data.deductions.stateTax },
    { label: "Social Security (OASDI)", amount: data.deductions.socialSecurity },
    { label: "Medicare", amount: data.deductions.medicare },
    { label: "401(k) Contribution", amount: data.deductions.retirement401k },
    { label: "Health Insurance", amount: data.deductions.healthInsurance },
    { label: "Other Deductions", amount: data.deductions.otherDeductions },
  ];

  for (const item of deductionItems) {
    if (item.amount > 0) {
      addText(item.label, margin + 5, y, 9);
      addText(`-${formatCurrency(item.amount)}`, pageWidth - margin - 70, y, 9);
      y -= 14;
    }
  }

  // Total Deductions
  addLine(margin, y + 4, pageWidth - margin, y + 4, 0.5);
  y -= 2;
  addText("TOTAL DEDUCTIONS", margin + 5, y, 10, true);
  addText(`-${formatCurrency(totalDeductions)}`, pageWidth - margin - 70, y, 10, true);
  y -= 25;

  // --- NET PAY BOX ---
  addRect(margin, y - 8, contentWidth, 32, 0.15, 0.25, 0.45);
  lines.push("1 1 1 rg");
  addText("NET PAY", margin + 15, y + 4, 14, true);
  addText(formatCurrency(netPay), pageWidth - margin - 120, y + 4, 16, true);
  lines.push("0 0 0 rg");
  y -= 40;

  // --- YTD Section ---
  if (data.includeYTD) {
    y -= 5;
    addRect(margin, y - 2, contentWidth, 16, 0.93, 0.93, 0.93);
    addText("YEAR-TO-DATE TOTALS", margin + 5, y + 2, 9, true);
    y -= 18;

    const ytdItems = [
      { label: "YTD Gross Pay", amount: data.ytd.grossPay },
      { label: "YTD Federal Tax", amount: data.ytd.federalTax },
      { label: "YTD State Tax", amount: data.ytd.stateTax },
      { label: "YTD Social Security", amount: data.ytd.socialSecurity },
      { label: "YTD Medicare", amount: data.ytd.medicare },
      { label: "YTD Net Pay", amount: data.ytd.netPay },
    ];

    for (const item of ytdItems) {
      if (item.amount > 0) {
        addText(item.label, margin + 5, y, 9);
        addText(formatCurrency(item.amount), pageWidth - margin - 70, y, 9);
        y -= 14;
      }
    }
  }

  // --- FOOTER ---
  y = margin + 20;
  addLine(margin, y + 10, pageWidth - margin, y + 10, 0.3);
  lines.push("0.5 0.5 0.5 rg");
  addText("This document was generated by PaystubPro", margin, y - 4, 7);
  addText(
    `Generated on ${new Date().toLocaleDateString("en-US")}`,
    pageWidth - margin - 150,
    y - 4,
    7
  );
  lines.push("0 0 0 rg");

  if (data.employer.phone || data.employer.email) {
    const contactParts = [];
    if (data.employer.phone) contactParts.push(`Phone: ${data.employer.phone}`);
    if (data.employer.email) contactParts.push(`Email: ${data.employer.email}`);
    addText(contactParts.join("  |  "), margin, y - 16, 7);
  }

  // Build content stream
  const contentStream = lines.join("\n");
  const streamBytes = new TextEncoder().encode(contentStream);

  // Object 4: Content stream
  addObj(
    `<< /Length ${streamBytes.length} >>\nstream\n${contentStream}\nendstream`
  );

  // Object 5: Font Helvetica (regular)
  addObj(
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>"
  );

  // Object 6: Font Helvetica-Bold
  addObj(
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>"
  );

  // Object 3: Page (references fonts and stream)
  // We need to insert this at position 2 (0-indexed), but since we already added obj 3 position...
  // Actually let's rebuild. The objects array has: [catalog, pages, stream, font1, font2]
  // We need page as obj 3, so let's restructure.

  // Clear and rebuild properly
  objects.length = 0;
  objCount = 0;

  // 1: Catalog
  addObj("<< /Type /Catalog /Pages 2 0 R >>");
  // 2: Pages
  addObj(
    `<< /Type /Pages /Kids [3 0 R] /Count 1 /MediaBox [0 0 ${pageWidth} ${pageHeight}] >>`
  );
  // 3: Page
  addObj(
    `<< /Type /Page /Parent 2 0 R /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>`
  );
  // 4: Content Stream
  addObj(
    `<< /Length ${streamBytes.length} >>\nstream\n${contentStream}\nendstream`
  );
  // 5: Font Regular
  addObj(
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>"
  );
  // 6: Font Bold
  addObj(
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>"
  );

  // Build final PDF
  let pdf = "%PDF-1.4\n";
  for (let i = 0; i < objects.length; i++) {
    offsets[i] = pdf.length;
    pdf += objects[i];
  }

  // Cross-reference table
  const xrefOffset = pdf.length;
  pdf += "xref\n";
  pdf += `0 ${objCount + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 0; i < objCount; i++) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }

  // Trailer
  pdf += "trailer\n";
  pdf += `<< /Size ${objCount + 1} /Root 1 0 R >>\n`;
  pdf += "startxref\n";
  pdf += `${xrefOffset}\n`;
  pdf += "%%EOF";

  return new TextEncoder().encode(pdf);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data: PaystubRequest = await req.json();

    // Validate required fields
    if (!data.employer?.companyName || !data.employee?.firstName) {
      return new Response(
        JSON.stringify({ error: "Missing required paystub data" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const pdfBytes = buildPdf(data);

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="paystub_${data.employee.firstName}_${data.employee.lastName}.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate PDF", details: String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
