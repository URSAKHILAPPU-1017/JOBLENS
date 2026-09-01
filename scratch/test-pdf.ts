import { parseResumeBuffer } from "../server/parser";

async function runTests() {
  console.log("--- TEST 1: Valid PDF Buffer ---");
  const validPdf = Buffer.from("%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n4 0 obj\n<< /Length 44 >>\nstream\nBT /F1 12 Tf 100 700 Td (Hello World) Tj ET\nendstream\nendobj\n5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\nxref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n00000000115 00000 n \n00000000261 00000 n \n00000000354 00000 n \ntrailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n435\n%%EOF");
  try {
    const res1 = await parseResumeBuffer(validPdf, "sample.pdf", "application/pdf");
    console.log("SUCCESS 1:", res1.filename, "extracted length:", res1.extractedText.length);
  } catch (err: any) {
    console.error("FAIL 1:", err.message);
  }

  console.log("\n--- TEST 2: Corrupted PDF Buffer ---");
  const corruptPdf = Buffer.from("NOT_A_PDF_FILE_CORRUPTED_DATA");
  try {
    const res2 = await parseResumeBuffer(corruptPdf, "corrupt.pdf", "application/pdf");
    console.log("SUCCESS 2:", res2);
  } catch (err: any) {
    console.error("FAIL 2 (Expected error):", err.message);
  }

  console.log("\n--- TEST 3: TXT File ---");
  const txtBuffer = Buffer.from("John Doe\nSoftware Engineer\nSkills: React, Node.js, TypeScript");
  try {
    const res3 = await parseResumeBuffer(txtBuffer, "resume.txt", "text/plain");
    console.log("SUCCESS 3:", res3.filename, "extracted length:", res3.extractedText.length);
  } catch (err: any) {
    console.error("FAIL 3:", err.message);
  }
}

runTests();
