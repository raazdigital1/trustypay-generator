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

function fmt(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

function fmtDate(dateStr: string): string {
  if (!dateStr) return "";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function fmtDateShort(dateStr: string): string {
  if (!dateStr) return "";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
}

function freqLabel(freq: string): string {
  const map: Record<string, string> = {
    weekly: "Weekly",
    bi_weekly: "Bi-Weekly",
    semi_monthly: "Semi-Monthly",
    monthly: "Monthly",
  };
  return map[freq] || freq;
}

// Approximate width of Helvetica text at given font size (rough but good enough for PDF alignment)
function textWidth(text: string, fontSize: number): number {
  // Helvetica average char width is ~0.52 of font size
  let width = 0;
  for (const ch of text) {
    if (ch === ' ') width += 0.28;
    else if (ch >= '0' && ch <= '9') width += 0.56;
    else if (ch === ch.toUpperCase() && ch !== ch.toLowerCase()) width += 0.72;
    else if (ch === '$' || ch === '.' || ch === ',') width += 0.28;
    else if (ch === '-' || ch === '(' || ch === ')') width += 0.33;
    else width += 0.52;
  }
  return width * fontSize;
}

function escPdf(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function buildPdf(data: PaystubRequest, watermark: boolean = false): Uint8Array {
  const regularPay = data.earnings.isHourly
    ? data.earnings.regularHours * data.earnings.hourlyRate
    : data.earnings.salaryAmount;
  const overtimePay = data.earnings.overtimeHours * data.earnings.overtimeRate;
  const grossPay =
    regularPay + overtimePay + data.earnings.bonus + data.earnings.commission + data.earnings.tips + data.earnings.otherEarnings;
  const totalDeductions =
    data.deductions.federalTax + data.deductions.stateTax + data.deductions.socialSecurity +
    data.deductions.medicare + data.deductions.retirement401k + data.deductions.healthInsurance + data.deductions.otherDeductions;
  const netPay = grossPay - totalDeductions;

  const PW = 612; // Letter width
  const PH = 792; // Letter height
  const ML = 40;  // Margin left
  const MR = 40;  // Margin right
  const CW = PW - ML - MR; // Content width
  const COL_MID = ML + CW / 2 + 10; // Midpoint for two-column layouts

  const lines: string[] = [];
  let y = PH;

  // ── Drawing helpers ──

  function setColor(r: number, g: number, b: number) {
    lines.push(`${r} ${g} ${b} rg`);
  }

  function setStrokeColor(r: number, g: number, b: number) {
    lines.push(`${r} ${g} ${b} RG`);
  }

  function rect(x: number, yy: number, w: number, h: number) {
    lines.push(`${x} ${yy} ${w} ${h} re f`);
  }

  function strokeRect(x: number, yy: number, w: number, h: number, lw: number = 0.5) {
    lines.push(`${lw} w ${x} ${yy} ${w} ${h} re S`);
  }

  function line(x1: number, y1: number, x2: number, y2: number, lw: number = 0.5) {
    lines.push(`${lw} w ${x1} ${y1} m ${x2} ${y2} l S`);
  }

  function text(str: string, x: number, yy: number, size: number = 9, bold: boolean = false) {
    const font = bold ? "/F2" : "/F1";
    lines.push(`BT ${font} ${size} Tf ${x} ${yy} Td (${escPdf(str)}) Tj ET`);
  }

  function textRight(str: string, xRight: number, yy: number, size: number = 9, bold: boolean = false) {
    const w = textWidth(str, size);
    text(str, xRight - w, yy, size, bold);
  }

  function textCenter(str: string, xCenter: number, yy: number, size: number = 9, bold: boolean = false) {
    const w = textWidth(str, size);
    text(str, xCenter - w / 2, yy, size, bold);
  }

  // ─────────────────────────────────────────
  // HEADER BAR — dark navy gradient-style bar
  // ─────────────────────────────────────────
  const headerH = 70;
  const headerY = PH - headerH;
  setColor(0.098, 0.161, 0.318); // Deep navy #19294F
  rect(0, headerY, PW, headerH);

  // Accent stripe at bottom of header
  setColor(0.204, 0.541, 0.376); // Green accent #348B60
  rect(0, headerY, PW, 3);

  // Company name — white
  setColor(1, 1, 1);
  text(data.employer.companyName.toUpperCase(), ML + 10, headerY + 42, 18, true);

  // Company address — light gray
  setColor(0.82, 0.84, 0.87);
  const addrLine = [data.employer.addressLine1, data.employer.city, data.employer.state, data.employer.zipCode]
    .filter(Boolean).join(", ");
  text(addrLine, ML + 10, headerY + 24, 8);

  // EIN / Phone / Email on same line
  const contactParts: string[] = [];
  if (data.employer.ein) contactParts.push(`EIN: ${data.employer.ein}`);
  if (data.employer.phone) contactParts.push(`Tel: ${data.employer.phone}`);
  if (data.employer.email) contactParts.push(data.employer.email);
  if (contactParts.length > 0) {
    text(contactParts.join("   |   "), ML + 10, headerY + 10, 7);
  }

  // Right side — "EARNINGS STATEMENT" label
  setColor(1, 1, 1);
  textRight("EARNINGS STATEMENT", PW - MR - 10, headerY + 42, 11, true);

  // Pay date badge
  setColor(0.82, 0.84, 0.87);
  textRight(`Pay Date: ${fmtDate(data.payPeriod.payDate)}`, PW - MR - 10, headerY + 26, 8);
  textRight(`Period: ${fmtDateShort(data.payPeriod.periodStart)} - ${fmtDateShort(data.payPeriod.periodEnd)}`, PW - MR - 10, headerY + 14, 8);

  // Reset color
  setColor(0, 0, 0);
  y = headerY - 18;

  // ─────────────────────────────────────────
  // EMPLOYEE INFO + PAY PERIOD INFO — two columns
  // ─────────────────────────────────────────
  const infoBoxY = y - 72;
  const infoBoxH = 68;
  const halfW = (CW - 16) / 2;

  // Left box
  setColor(0.965, 0.969, 0.976); // very light gray bg
  rect(ML, infoBoxY, halfW, infoBoxH);
  setStrokeColor(0.85, 0.87, 0.90);
  strokeRect(ML, infoBoxY, halfW, infoBoxH, 0.5);

  // Right box
  rect(ML + halfW + 16, infoBoxY, halfW, infoBoxH);
  strokeRect(ML + halfW + 16, infoBoxY, halfW, infoBoxH, 0.5);

  setColor(0, 0, 0);
  // Section labels
  setColor(0.35, 0.39, 0.45);
  text("EMPLOYEE INFORMATION", ML + 10, infoBoxY + infoBoxH - 14, 7, true);
  text("PAY PERIOD DETAILS", ML + halfW + 26, infoBoxY + infoBoxH - 14, 7, true);
  setColor(0, 0, 0);

  // Employee details
  const empName = `${data.employee.firstName} ${data.employee.lastName}`;
  text(empName, ML + 10, infoBoxY + infoBoxH - 28, 10, true);
  text(data.employee.addressLine1 || "", ML + 10, infoBoxY + infoBoxH - 40, 8);
  text(`${data.employee.city || ""}, ${data.employee.state || ""} ${data.employee.zipCode || ""}`, ML + 10, infoBoxY + infoBoxH - 51, 8);
  if (data.employee.ssnLastFour) {
    text(`SSN: XXX-XX-${data.employee.ssnLastFour}`, ML + 10, infoBoxY + infoBoxH - 62, 8);
  }

  // Pay period details
  const ppX = ML + halfW + 26;
  text(`Frequency:`, ppX, infoBoxY + infoBoxH - 28, 8, true);
  text(freqLabel(data.payPeriod.frequency), ppX + 55, infoBoxY + infoBoxH - 28, 8);
  text(`Pay Date:`, ppX, infoBoxY + infoBoxH - 40, 8, true);
  text(fmtDate(data.payPeriod.payDate), ppX + 55, infoBoxY + infoBoxH - 40, 8);
  if (data.employee.employeeId) {
    text(`Employee ID:`, ppX, infoBoxY + infoBoxH - 52, 8, true);
    text(data.employee.employeeId, ppX + 65, infoBoxY + infoBoxH - 52, 8);
  }
  text(`State:`, ppX, infoBoxY + infoBoxH - 62, 8, true);
  text(data.stateCode || data.employer.state, ppX + 55, infoBoxY + infoBoxH - 62, 8);

  y = infoBoxY - 20;

  // ─────────────────────────────────────────
  // EARNINGS TABLE
  // ─────────────────────────────────────────
  const tableRowH = 18;
  const colDesc = ML;
  const colHours = ML + 220;
  const colRate = ML + 310;
  const colAmount = PW - MR;

  // Table header
  setColor(0.098, 0.161, 0.318);
  rect(ML, y - tableRowH + 4, CW, tableRowH);
  setColor(1, 1, 1);
  text("EARNINGS DESCRIPTION", colDesc + 8, y - 8, 8, true);
  text("HOURS", colHours, y - 8, 8, true);
  text("RATE", colRate, y - 8, 8, true);
  textRight("AMOUNT", colAmount - 8, y - 8, 8, true);
  setColor(0, 0, 0);
  y -= tableRowH;

  // Earnings rows
  interface EarningsRow { label: string; hours: string; rate: string; amount: number }
  const earningsRows: EarningsRow[] = [];

  if (data.earnings.isHourly) {
    earningsRows.push({
      label: "Regular Pay",
      hours: data.earnings.regularHours.toFixed(2),
      rate: fmt(data.earnings.hourlyRate),
      amount: regularPay,
    });
    if (data.earnings.overtimeHours > 0) {
      earningsRows.push({
        label: "Overtime Pay (1.5x)",
        hours: data.earnings.overtimeHours.toFixed(2),
        rate: fmt(data.earnings.overtimeRate),
        amount: overtimePay,
      });
    }
  } else {
    earningsRows.push({
      label: "Salary",
      hours: "—",
      rate: "—",
      amount: regularPay,
    });
  }

  if (data.earnings.bonus > 0) earningsRows.push({ label: "Bonus", hours: "—", rate: "—", amount: data.earnings.bonus });
  if (data.earnings.commission > 0) earningsRows.push({ label: "Commission", hours: "—", rate: "—", amount: data.earnings.commission });
  if (data.earnings.tips > 0) earningsRows.push({ label: "Tips", hours: "—", rate: "—", amount: data.earnings.tips });
  if (data.earnings.otherEarnings > 0) earningsRows.push({ label: "Other Earnings", hours: "—", rate: "—", amount: data.earnings.otherEarnings });

  earningsRows.forEach((row, i) => {
    if (i % 2 === 0) {
      setColor(0.973, 0.976, 0.984);
      rect(ML, y - tableRowH + 4, CW, tableRowH);
    }
    setColor(0.15, 0.18, 0.25);
    text(row.label, colDesc + 8, y - 9, 9);
    textCenter(row.hours, colHours + 25, y - 9, 9);
    textCenter(row.rate, colRate + 30, y - 9, 9);
    textRight(fmt(row.amount), colAmount - 8, y - 9, 9);
    y -= tableRowH;
  });

  // Gross pay total row
  setColor(0.93, 0.95, 0.97);
  rect(ML, y - tableRowH + 4, CW, tableRowH);
  setColor(0.098, 0.161, 0.318);
  text("GROSS PAY", colDesc + 8, y - 9, 10, true);
  textRight(fmt(grossPay), colAmount - 8, y - 9, 10, true);
  setColor(0, 0, 0);
  y -= tableRowH + 14;

  // ─────────────────────────────────────────
  // DEDUCTIONS TABLE
  // ─────────────────────────────────────────
  const dedColDesc = ML;
  const dedColCurrent = ML + CW * 0.55;
  const dedColYTD = PW - MR;

  // Table header
  setColor(0.098, 0.161, 0.318);
  rect(ML, y - tableRowH + 4, CW, tableRowH);
  setColor(1, 1, 1);
  text("DEDUCTIONS", dedColDesc + 8, y - 8, 8, true);
  textRight("CURRENT", dedColCurrent, y - 8, 8, true);
  if (data.includeYTD) {
    textRight("YTD", dedColYTD - 8, y - 8, 8, true);
  }
  setColor(0, 0, 0);
  y -= tableRowH;

  interface DeductionRow { label: string; current: number; ytd: number }
  const deductionRows: DeductionRow[] = [];

  if (data.deductions.federalTax > 0) deductionRows.push({ label: "Federal Income Tax", current: data.deductions.federalTax, ytd: data.ytd.federalTax });
  if (data.deductions.stateTax > 0) deductionRows.push({ label: `State Income Tax (${data.stateCode})`, current: data.deductions.stateTax, ytd: data.ytd.stateTax });
  if (data.deductions.socialSecurity > 0) deductionRows.push({ label: "Social Security (OASDI)", current: data.deductions.socialSecurity, ytd: data.ytd.socialSecurity });
  if (data.deductions.medicare > 0) deductionRows.push({ label: "Medicare", current: data.deductions.medicare, ytd: data.ytd.medicare });
  if (data.deductions.retirement401k > 0) deductionRows.push({ label: "401(k) Contribution", current: data.deductions.retirement401k, ytd: 0 });
  if (data.deductions.healthInsurance > 0) deductionRows.push({ label: "Health Insurance", current: data.deductions.healthInsurance, ytd: 0 });
  if (data.deductions.otherDeductions > 0) deductionRows.push({ label: "Other Deductions", current: data.deductions.otherDeductions, ytd: 0 });

  deductionRows.forEach((row, i) => {
    if (i % 2 === 0) {
      setColor(0.973, 0.976, 0.984);
      rect(ML, y - tableRowH + 4, CW, tableRowH);
    }
    setColor(0.15, 0.18, 0.25);
    text(row.label, dedColDesc + 8, y - 9, 9);
    textRight(fmt(row.current), dedColCurrent, y - 9, 9);
    if (data.includeYTD && row.ytd > 0) {
      textRight(fmt(row.ytd), dedColYTD - 8, y - 9, 9);
    }
    y -= tableRowH;
  });

  // Total deductions row
  setColor(0.93, 0.95, 0.97);
  rect(ML, y - tableRowH + 4, CW, tableRowH);
  setColor(0.098, 0.161, 0.318);
  text("TOTAL DEDUCTIONS", dedColDesc + 8, y - 9, 10, true);
  textRight(fmt(totalDeductions), dedColCurrent, y - 9, 10, true);
  setColor(0, 0, 0);
  y -= tableRowH + 14;

  // ─────────────────────────────────────────
  // NET PAY HIGHLIGHT BOX
  // ─────────────────────────────────────────
  const netBoxH = 44;
  const netBoxY = y - netBoxH + 4;

  // Shadow effect (slightly offset darker rect)
  setColor(0.85, 0.87, 0.90);
  rect(ML + 2, netBoxY - 2, CW, netBoxH);

  // Main box
  setColor(0.098, 0.161, 0.318);
  rect(ML, netBoxY, CW, netBoxH);

  // Green accent bar on left
  setColor(0.204, 0.541, 0.376);
  rect(ML, netBoxY, 5, netBoxH);

  // NET PAY text
  setColor(0.82, 0.84, 0.87);
  text("NET PAY", ML + 20, netBoxY + 27, 10, true);
  setColor(1, 1, 1);
  text("Amount deposited to your account", ML + 20, netBoxY + 12, 7);

  // Large net pay amount
  setColor(1, 1, 1);
  textRight(fmt(netPay), PW - MR - 15, netBoxY + 20, 22, true);
  setColor(0, 0, 0);
  y = netBoxY - 18;

  // ─────────────────────────────────────────
  // YTD SUMMARY (if enabled)
  // ─────────────────────────────────────────
  if (data.includeYTD && y > 140) {
    setColor(0.35, 0.39, 0.45);
    text("YEAR-TO-DATE SUMMARY", ML, y, 8, true);
    setColor(0, 0, 0);
    y -= 4;
    setStrokeColor(0.85, 0.87, 0.90);
    line(ML, y, PW - MR, y, 0.5);
    y -= 16;

    const ytdItems = [
      { label: "YTD Gross Pay", value: data.ytd.grossPay },
      { label: "YTD Federal Tax", value: data.ytd.federalTax },
      { label: "YTD State Tax", value: data.ytd.stateTax },
      { label: "YTD Social Security", value: data.ytd.socialSecurity },
      { label: "YTD Medicare", value: data.ytd.medicare },
      { label: "YTD Net Pay", value: data.ytd.netPay },
    ].filter(item => item.value > 0);

    // Render in 3-column layout
    const ytdColW = CW / 3;
    ytdItems.forEach((item, i) => {
      const col = i % 3;
      const xBase = ML + col * ytdColW;
      if (col === 0 && i > 0) y -= 16;
      setColor(0.45, 0.49, 0.55);
      text(item.label, xBase + 8, y, 7);
      setColor(0.1, 0.12, 0.18);
      text(fmt(item.value), xBase + 100, y, 8, true);
    });
    setColor(0, 0, 0);
    y -= 20;
  }

  // ─────────────────────────────────────────
  // FOOTER
  // ─────────────────────────────────────────
  const footerY = 42;

  // Footer separator
  setStrokeColor(0.85, 0.87, 0.90);
  line(ML, footerY + 18, PW - MR, footerY + 18, 0.5);

  // Accent bar at very bottom
  setColor(0.098, 0.161, 0.318);
  rect(0, 0, PW, 4);
  setColor(0.204, 0.541, 0.376);
  rect(0, 4, PW / 3, 2);

  setColor(0.55, 0.58, 0.62);
  text("This is a computer-generated earnings statement.", ML, footerY + 4, 7);
  text(`Generated on ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`, ML, footerY - 6, 6.5);
  textRight("PayStub Wizard  |  www.paystubwizard.com", PW - MR, footerY + 4, 7);
  setColor(0, 0, 0);

  // ─────────────────────────────────────────
  // WATERMARK (if requested)
  // ─────────────────────────────────────────
  if (watermark) {
    // Save graphics state
    lines.push("q");
    // Semi-transparent gray
    lines.push("0.85 0.85 0.85 rg");
    // Rotate 45 degrees, scale up, and position diagonally across page
    const angle = 45 * Math.PI / 180;
    const cos = Math.cos(angle).toFixed(4);
    const sin = Math.sin(angle).toFixed(4);
    // Position at center of page
    lines.push(`${cos} ${sin} -${sin} ${cos} ${PW / 2 - 140} ${PH / 2 - 60} cm`);
    lines.push(`BT /F2 72 Tf 0 0 Td (SAMPLE) Tj ET`);
    lines.push("Q");
    // Second watermark line
    lines.push("q");
    lines.push("0.85 0.85 0.85 rg");
    lines.push(`${cos} ${sin} -${sin} ${cos} ${PW / 2 - 180} ${PH / 2 - 180} cm`);
    lines.push(`BT /F2 36 Tf 0 0 Td (FOR PREVIEW ONLY) Tj ET`);
    lines.push("Q");
  }

  // ─────────────────────────────────────────
  // BUILD PDF FILE
  // ─────────────────────────────────────────
  const contentStream = lines.join("\n");
  const streamBytes = new TextEncoder().encode(contentStream);

  const objects: string[] = [];
  const offsets: number[] = [];
  let objCount = 0;

  function addObj(content: string): number {
    objCount++;
    objects.push(`${objCount} 0 obj\n${content}\nendobj\n`);
    return objCount;
  }

  // 1: Catalog
  addObj("<< /Type /Catalog /Pages 2 0 R >>");
  // 2: Pages
  addObj(`<< /Type /Pages /Kids [3 0 R] /Count 1 /MediaBox [0 0 ${PW} ${PH}] >>`);
  // 3: Page
  addObj(`<< /Type /Page /Parent 2 0 R /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>`);
  // 4: Content Stream
  addObj(`<< /Length ${streamBytes.length} >>\nstream\n${contentStream}\nendstream`);
  // 5: Font Regular
  addObj("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
  // 6: Font Bold
  addObj("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");

  let pdf = "%PDF-1.4\n";
  for (let i = 0; i < objects.length; i++) {
    offsets[i] = pdf.length;
    pdf += objects[i];
  }

  const xrefOffset = pdf.length;
  pdf += "xref\n";
  pdf += `0 ${objCount + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 0; i < objCount; i++) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }

  pdf += "trailer\n";
  pdf += `<< /Size ${objCount + 1} /Root 1 0 R >>\n`;
  pdf += "startxref\n";
  pdf += `${xrefOffset}\n`;
  pdf += "%%EOF";

  return new TextEncoder().encode(pdf);
}

function buildSvg(data: PaystubRequest, watermark: boolean = false): string {
  const regularPay = data.earnings.isHourly
    ? data.earnings.regularHours * data.earnings.hourlyRate
    : data.earnings.salaryAmount;
  const overtimePay = data.earnings.overtimeHours * data.earnings.overtimeRate;
  const grossPay =
    regularPay + overtimePay + data.earnings.bonus + data.earnings.commission + data.earnings.tips + data.earnings.otherEarnings;
  const totalDeductions =
    data.deductions.federalTax + data.deductions.stateTax + data.deductions.socialSecurity +
    data.deductions.medicare + data.deductions.retirement401k + data.deductions.healthInsurance + data.deductions.otherDeductions;
  const netPay = grossPay - totalDeductions;

  const W = 816; // 8.5in * 96dpi
  const H = 1056; // 11in * 96dpi
  const ML = 50;
  const MR = 50;
  const CW = W - ML - MR;

  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  let y = 0;
  const parts: string[] = [];
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`);
  parts.push(`<rect width="${W}" height="${H}" fill="white"/>`);

  // Header bar
  const headerH = 90;
  parts.push(`<rect x="0" y="0" width="${W}" height="${headerH}" fill="#19294F"/>`);
  parts.push(`<rect x="0" y="${headerH - 3}" width="${W}" height="3" fill="#348B60"/>`);
  parts.push(`<text x="${ML + 10}" y="38" fill="white" font-family="Helvetica,Arial,sans-serif" font-size="22" font-weight="bold">${esc(data.employer.companyName.toUpperCase())}</text>`);
  const addrLine = [data.employer.addressLine1, data.employer.city, data.employer.state, data.employer.zipCode].filter(Boolean).join(", ");
  parts.push(`<text x="${ML + 10}" y="58" fill="#D1D5DB" font-family="Helvetica,Arial,sans-serif" font-size="10">${esc(addrLine)}</text>`);
  const contactParts: string[] = [];
  if (data.employer.ein) contactParts.push(`EIN: ${data.employer.ein}`);
  if (data.employer.phone) contactParts.push(`Tel: ${data.employer.phone}`);
  if (data.employer.email) contactParts.push(data.employer.email);
  if (contactParts.length > 0) {
    parts.push(`<text x="${ML + 10}" y="73" fill="#D1D5DB" font-family="Helvetica,Arial,sans-serif" font-size="9">${esc(contactParts.join("   |   "))}</text>`);
  }
  parts.push(`<text x="${W - MR - 10}" y="38" fill="white" font-family="Helvetica,Arial,sans-serif" font-size="14" font-weight="bold" text-anchor="end">EARNINGS STATEMENT</text>`);
  parts.push(`<text x="${W - MR - 10}" y="56" fill="#D1D5DB" font-family="Helvetica,Arial,sans-serif" font-size="10" text-anchor="end">Pay Date: ${esc(fmtDate(data.payPeriod.payDate))}</text>`);
  parts.push(`<text x="${W - MR - 10}" y="72" fill="#D1D5DB" font-family="Helvetica,Arial,sans-serif" font-size="10" text-anchor="end">Period: ${esc(fmtDateShort(data.payPeriod.periodStart))} - ${esc(fmtDateShort(data.payPeriod.periodEnd))}</text>`);

  y = headerH + 20;

  // Employee info box
  const halfW = (CW - 16) / 2;
  const boxH = 85;
  parts.push(`<rect x="${ML}" y="${y}" width="${halfW}" height="${boxH}" fill="#F7F8FA" stroke="#DADDE3" stroke-width="1" rx="4"/>`);
  parts.push(`<rect x="${ML + halfW + 16}" y="${y}" width="${halfW}" height="${boxH}" fill="#F7F8FA" stroke="#DADDE3" stroke-width="1" rx="4"/>`);
  parts.push(`<text x="${ML + 12}" y="${y + 18}" fill="#5A636F" font-family="Helvetica,Arial,sans-serif" font-size="9" font-weight="bold">EMPLOYEE INFORMATION</text>`);
  const empName = `${data.employee.firstName} ${data.employee.lastName}`;
  parts.push(`<text x="${ML + 12}" y="${y + 36}" fill="#000" font-family="Helvetica,Arial,sans-serif" font-size="13" font-weight="bold">${esc(empName)}</text>`);
  parts.push(`<text x="${ML + 12}" y="${y + 52}" fill="#333" font-family="Helvetica,Arial,sans-serif" font-size="10">${esc(data.employee.addressLine1 || "")}</text>`);
  parts.push(`<text x="${ML + 12}" y="${y + 66}" fill="#333" font-family="Helvetica,Arial,sans-serif" font-size="10">${esc(`${data.employee.city || ""}, ${data.employee.state || ""} ${data.employee.zipCode || ""}`)}</text>`);
  if (data.employee.ssnLastFour) {
    parts.push(`<text x="${ML + 12}" y="${y + 80}" fill="#333" font-family="Helvetica,Arial,sans-serif" font-size="10">SSN: XXX-XX-${esc(data.employee.ssnLastFour)}</text>`);
  }

  const ppX = ML + halfW + 28;
  parts.push(`<text x="${ppX}" y="${y + 18}" fill="#5A636F" font-family="Helvetica,Arial,sans-serif" font-size="9" font-weight="bold">PAY PERIOD DETAILS</text>`);
  parts.push(`<text x="${ppX}" y="${y + 36}" fill="#000" font-family="Helvetica,Arial,sans-serif" font-size="10"><tspan font-weight="bold">Frequency: </tspan>${esc(freqLabel(data.payPeriod.frequency))}</text>`);
  parts.push(`<text x="${ppX}" y="${y + 52}" fill="#000" font-family="Helvetica,Arial,sans-serif" font-size="10"><tspan font-weight="bold">Pay Date: </tspan>${esc(fmtDate(data.payPeriod.payDate))}</text>`);
  if (data.employee.employeeId) {
    parts.push(`<text x="${ppX}" y="${y + 66}" fill="#000" font-family="Helvetica,Arial,sans-serif" font-size="10"><tspan font-weight="bold">Employee ID: </tspan>${esc(data.employee.employeeId)}</text>`);
  }
  parts.push(`<text x="${ppX}" y="${y + 80}" fill="#000" font-family="Helvetica,Arial,sans-serif" font-size="10"><tspan font-weight="bold">State: </tspan>${esc(data.stateCode || data.employer.state)}</text>`);

  y += boxH + 24;

  // Earnings table
  const rowH = 24;
  // Header row
  parts.push(`<rect x="${ML}" y="${y}" width="${CW}" height="${rowH}" fill="#19294F"/>`);
  parts.push(`<text x="${ML + 10}" y="${y + 16}" fill="white" font-family="Helvetica,Arial,sans-serif" font-size="10" font-weight="bold">EARNINGS DESCRIPTION</text>`);
  parts.push(`<text x="${ML + 280}" y="${y + 16}" fill="white" font-family="Helvetica,Arial,sans-serif" font-size="10" font-weight="bold">HOURS</text>`);
  parts.push(`<text x="${ML + 390}" y="${y + 16}" fill="white" font-family="Helvetica,Arial,sans-serif" font-size="10" font-weight="bold">RATE</text>`);
  parts.push(`<text x="${W - MR - 10}" y="${y + 16}" fill="white" font-family="Helvetica,Arial,sans-serif" font-size="10" font-weight="bold" text-anchor="end">AMOUNT</text>`);
  y += rowH;

  interface ERow { label: string; hours: string; rate: string; amount: number }
  const eRows: ERow[] = [];
  if (data.earnings.isHourly) {
    eRows.push({ label: "Regular Pay", hours: data.earnings.regularHours.toFixed(2), rate: fmt(data.earnings.hourlyRate), amount: regularPay });
    if (data.earnings.overtimeHours > 0) {
      eRows.push({ label: "Overtime Pay (1.5x)", hours: data.earnings.overtimeHours.toFixed(2), rate: fmt(data.earnings.overtimeRate), amount: overtimePay });
    }
  } else {
    eRows.push({ label: "Salary", hours: "—", rate: "—", amount: regularPay });
  }
  if (data.earnings.bonus > 0) eRows.push({ label: "Bonus", hours: "—", rate: "—", amount: data.earnings.bonus });
  if (data.earnings.commission > 0) eRows.push({ label: "Commission", hours: "—", rate: "—", amount: data.earnings.commission });
  if (data.earnings.tips > 0) eRows.push({ label: "Tips", hours: "—", rate: "—", amount: data.earnings.tips });
  if (data.earnings.otherEarnings > 0) eRows.push({ label: "Other Earnings", hours: "—", rate: "—", amount: data.earnings.otherEarnings });

  eRows.forEach((row, i) => {
    if (i % 2 === 0) parts.push(`<rect x="${ML}" y="${y}" width="${CW}" height="${rowH}" fill="#F8F9FC"/>`);
    parts.push(`<text x="${ML + 10}" y="${y + 16}" fill="#262F3D" font-family="Helvetica,Arial,sans-serif" font-size="11">${esc(row.label)}</text>`);
    parts.push(`<text x="${ML + 300}" y="${y + 16}" fill="#262F3D" font-family="Helvetica,Arial,sans-serif" font-size="11" text-anchor="middle">${esc(row.hours)}</text>`);
    parts.push(`<text x="${ML + 410}" y="${y + 16}" fill="#262F3D" font-family="Helvetica,Arial,sans-serif" font-size="11" text-anchor="middle">${esc(row.rate)}</text>`);
    parts.push(`<text x="${W - MR - 10}" y="${y + 16}" fill="#262F3D" font-family="Helvetica,Arial,sans-serif" font-size="11" text-anchor="end">${esc(fmt(row.amount))}</text>`);
    y += rowH;
  });

  // Gross pay row
  parts.push(`<rect x="${ML}" y="${y}" width="${CW}" height="${rowH}" fill="#ECEEF2"/>`);
  parts.push(`<text x="${ML + 10}" y="${y + 16}" fill="#19294F" font-family="Helvetica,Arial,sans-serif" font-size="12" font-weight="bold">GROSS PAY</text>`);
  parts.push(`<text x="${W - MR - 10}" y="${y + 16}" fill="#19294F" font-family="Helvetica,Arial,sans-serif" font-size="12" font-weight="bold" text-anchor="end">${esc(fmt(grossPay))}</text>`);
  y += rowH + 16;

  // Deductions table
  parts.push(`<rect x="${ML}" y="${y}" width="${CW}" height="${rowH}" fill="#19294F"/>`);
  parts.push(`<text x="${ML + 10}" y="${y + 16}" fill="white" font-family="Helvetica,Arial,sans-serif" font-size="10" font-weight="bold">DEDUCTIONS</text>`);
  parts.push(`<text x="${ML + CW * 0.55}" y="${y + 16}" fill="white" font-family="Helvetica,Arial,sans-serif" font-size="10" font-weight="bold" text-anchor="end">CURRENT</text>`);
  if (data.includeYTD) {
    parts.push(`<text x="${W - MR - 10}" y="${y + 16}" fill="white" font-family="Helvetica,Arial,sans-serif" font-size="10" font-weight="bold" text-anchor="end">YTD</text>`);
  }
  y += rowH;

  interface DRow { label: string; current: number; ytd: number }
  const dRows: DRow[] = [];
  if (data.deductions.federalTax > 0) dRows.push({ label: "Federal Income Tax", current: data.deductions.federalTax, ytd: data.ytd.federalTax });
  if (data.deductions.stateTax > 0) dRows.push({ label: `State Income Tax (${data.stateCode})`, current: data.deductions.stateTax, ytd: data.ytd.stateTax });
  if (data.deductions.socialSecurity > 0) dRows.push({ label: "Social Security (OASDI)", current: data.deductions.socialSecurity, ytd: data.ytd.socialSecurity });
  if (data.deductions.medicare > 0) dRows.push({ label: "Medicare", current: data.deductions.medicare, ytd: data.ytd.medicare });
  if (data.deductions.retirement401k > 0) dRows.push({ label: "401(k) Contribution", current: data.deductions.retirement401k, ytd: 0 });
  if (data.deductions.healthInsurance > 0) dRows.push({ label: "Health Insurance", current: data.deductions.healthInsurance, ytd: 0 });
  if (data.deductions.otherDeductions > 0) dRows.push({ label: "Other Deductions", current: data.deductions.otherDeductions, ytd: 0 });

  dRows.forEach((row, i) => {
    if (i % 2 === 0) parts.push(`<rect x="${ML}" y="${y}" width="${CW}" height="${rowH}" fill="#F8F9FC"/>`);
    parts.push(`<text x="${ML + 10}" y="${y + 16}" fill="#262F3D" font-family="Helvetica,Arial,sans-serif" font-size="11">${esc(row.label)}</text>`);
    parts.push(`<text x="${ML + CW * 0.55}" y="${y + 16}" fill="#262F3D" font-family="Helvetica,Arial,sans-serif" font-size="11" text-anchor="end">${esc(fmt(row.current))}</text>`);
    if (data.includeYTD && row.ytd > 0) {
      parts.push(`<text x="${W - MR - 10}" y="${y + 16}" fill="#262F3D" font-family="Helvetica,Arial,sans-serif" font-size="11" text-anchor="end">${esc(fmt(row.ytd))}</text>`);
    }
    y += rowH;
  });

  // Total deductions
  parts.push(`<rect x="${ML}" y="${y}" width="${CW}" height="${rowH}" fill="#ECEEF2"/>`);
  parts.push(`<text x="${ML + 10}" y="${y + 16}" fill="#19294F" font-family="Helvetica,Arial,sans-serif" font-size="12" font-weight="bold">TOTAL DEDUCTIONS</text>`);
  parts.push(`<text x="${ML + CW * 0.55}" y="${y + 16}" fill="#19294F" font-family="Helvetica,Arial,sans-serif" font-size="12" font-weight="bold" text-anchor="end">${esc(fmt(totalDeductions))}</text>`);
  y += rowH + 16;

  // Net pay box
  const netBoxH = 56;
  parts.push(`<rect x="${ML}" y="${y}" width="${CW}" height="${netBoxH}" fill="#19294F" rx="4"/>`);
  parts.push(`<rect x="${ML}" y="${y}" width="5" height="${netBoxH}" fill="#348B60" rx="2"/>`);
  parts.push(`<text x="${ML + 22}" y="${y + 24}" fill="#D1D5DB" font-family="Helvetica,Arial,sans-serif" font-size="12" font-weight="bold">NET PAY</text>`);
  parts.push(`<text x="${ML + 22}" y="${y + 42}" fill="white" font-family="Helvetica,Arial,sans-serif" font-size="9">Amount deposited to your account</text>`);
  parts.push(`<text x="${W - MR - 16}" y="${y + 36}" fill="white" font-family="Helvetica,Arial,sans-serif" font-size="26" font-weight="bold" text-anchor="end">${esc(fmt(netPay))}</text>`);
  y += netBoxH + 20;

  // YTD Summary
  if (data.includeYTD) {
    parts.push(`<text x="${ML}" y="${y}" fill="#5A636F" font-family="Helvetica,Arial,sans-serif" font-size="10" font-weight="bold">YEAR-TO-DATE SUMMARY</text>`);
    y += 6;
    parts.push(`<line x1="${ML}" y1="${y}" x2="${W - MR}" y2="${y}" stroke="#DADDE3" stroke-width="1"/>`);
    y += 18;
    const ytdItems = [
      { label: "YTD Gross Pay", value: data.ytd.grossPay },
      { label: "YTD Federal Tax", value: data.ytd.federalTax },
      { label: "YTD State Tax", value: data.ytd.stateTax },
      { label: "YTD Social Security", value: data.ytd.socialSecurity },
      { label: "YTD Medicare", value: data.ytd.medicare },
      { label: "YTD Net Pay", value: data.ytd.netPay },
    ].filter(item => item.value > 0);
    const colW = CW / 3;
    ytdItems.forEach((item, i) => {
      const col = i % 3;
      const xBase = ML + col * colW;
      if (col === 0 && i > 0) y += 20;
      parts.push(`<text x="${xBase + 8}" y="${y}" fill="#737983" font-family="Helvetica,Arial,sans-serif" font-size="9">${esc(item.label)}</text>`);
      parts.push(`<text x="${xBase + 130}" y="${y}" fill="#1A1E28" font-family="Helvetica,Arial,sans-serif" font-size="10" font-weight="bold">${esc(fmt(item.value))}</text>`);
    });
    y += 24;
  }

  // Footer
  const footerY = H - 40;
  parts.push(`<line x1="${ML}" y1="${footerY}" x2="${W - MR}" y2="${footerY}" stroke="#DADDE3" stroke-width="1"/>`);
  parts.push(`<rect x="0" y="${H - 6}" width="${W}" height="6" fill="#19294F"/>`);
  parts.push(`<rect x="0" y="${H - 8}" width="${W / 3}" height="2" fill="#348B60"/>`);
  parts.push(`<text x="${ML}" y="${footerY + 16}" fill="#8C9198" font-family="Helvetica,Arial,sans-serif" font-size="8">This is a computer-generated earnings statement.</text>`);
  parts.push(`<text x="${W - MR}" y="${footerY + 16}" fill="#8C9198" font-family="Helvetica,Arial,sans-serif" font-size="8" text-anchor="end">PayStub Wizard</text>`);

  // Watermark overlay
  if (watermark) {
    parts.push(`<g opacity="0.15" transform="rotate(-45, ${W / 2}, ${H / 2})">`);
    parts.push(`<text x="${W / 2}" y="${H / 2}" fill="#000" font-family="Helvetica,Arial,sans-serif" font-size="90" font-weight="bold" text-anchor="middle" dominant-baseline="middle">SAMPLE</text>`);
    parts.push(`<text x="${W / 2}" y="${H / 2 + 80}" fill="#000" font-family="Helvetica,Arial,sans-serif" font-size="36" font-weight="bold" text-anchor="middle" dominant-baseline="middle">FOR PREVIEW ONLY</text>`);
    parts.push(`</g>`);
  }

  parts.push("</svg>");
  return parts.join("\n");
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

    const data = await req.json();
    const format = data.format || "pdf";
    const watermark = data.watermark === true;

    if (!data.employer?.companyName || !data.employee?.firstName) {
      return new Response(
        JSON.stringify({ error: "Missing required paystub data" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (format === "png" || format === "svg") {
      const svg = buildSvg(data as PaystubRequest, watermark);
      return new Response(svg, {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "image/svg+xml",
          "Content-Disposition": `attachment; filename="paystub_${data.employee.firstName}_${data.employee.lastName}.svg"`,
        },
      });
    }

    // Default: PDF
    const pdfBytes = buildPdf(data as PaystubRequest, watermark);

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="paystub_${data.employee.firstName}_${data.employee.lastName}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Generation error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate paystub", details: String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
