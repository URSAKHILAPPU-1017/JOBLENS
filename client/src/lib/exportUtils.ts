import * as XLSX from "xlsx";
import { AnalysisResult } from "@shared/types";
import { toast } from "sonner";

export function exportCSV(result: AnalysisResult) {
  try {
    const rows = [
      ["JOBLENS CAREER RESUME ANALYSIS REPORT"],
      ["Target Role", result.jobTitle],
      ["Resume File", result.filename],
      ["Date", new Date(result.createdAt).toLocaleString()],
      ["Overall Score", `${result.overallScore}%`],
      ["Skill Match Score", `${result.skillMatchScore}%`],
      ["ATS Keyword Score", `${result.atsScore}%`],
      ["Experience Score", `${result.experienceScore}%`],
      ["Rejection Risk", `${result.rejectionRisk}%`],
      ["Selection Likelihood", result.selectionLikelihood],
      [],
      ["MATCHED SKILLS", result.matchedSkills.join("; ")],
      ["TRANSFERABLE SKILLS", result.transferableSkills.join("; ")],
      ["MISSING SKILLS", result.missingSkills.join("; ")],
      [],
      ["RESUME STRENGTHS"],
      ...result.strengths.map((s) => [s]),
      [],
      ["RESUME GAPS"],
      ...result.gaps.map((g) => [g]),
      [],
      ["RECOMMENDATIONS"],
      ...result.recommendations.map((r) => [r]),
    ];

    const csvContent = rows
      .map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `JOBLENS_Analysis_${result.jobTitle.replace(/\s+/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("CSV report downloaded successfully!");
  } catch (err: any) {
    toast.error("Failed to export CSV report: " + err.message);
  }
}

export function exportExcel(result: AnalysisResult) {
  try {
    const wb = XLSX.utils.book_new();

    // Summary Sheet
    const summaryData = [
      { Metric: "Target Job Role", Value: result.jobTitle },
      { Metric: "Resume File", Value: result.filename },
      { Metric: "Overall Match Score", Value: `${result.overallScore}%` },
      { Metric: "Skill Match Score", Value: `${result.skillMatchScore}%` },
      { Metric: "ATS Keyword Coverage", Value: `${result.atsScore}%` },
      { Metric: "Experience Score", Value: `${result.experienceScore}%` },
      { Metric: "Selection Likelihood", Value: result.selectionLikelihood },
      { Metric: "Rejection Risk Estimate", Value: `${result.rejectionRisk}%` },
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Overview");

    // Skills Sheet
    const skillsData = result.skills.map((s) => ({
      Skill: s.name,
      Status: s.state,
      Details: s.detail,
    }));
    const wsSkills = XLSX.utils.json_to_sheet(skillsData);
    XLSX.utils.book_append_sheet(wb, wsSkills, "Skill Breakdown");

    // Recommendations Sheet
    const recData = result.recommendations.map((rec, idx) => ({
      "#": idx + 1,
      Recommendation: rec,
    }));
    const wsRec = XLSX.utils.json_to_sheet(recData);
    XLSX.utils.book_append_sheet(wb, wsRec, "Recommendations");

    XLSX.writeFile(wb, `JOBLENS_Analysis_${result.jobTitle.replace(/\s+/g, "_")}.xlsx`);
    toast.success("Excel report downloaded successfully!");
  } catch (err: any) {
    toast.error("Failed to export Excel report: " + err.message);
  }
}

export function exportPDFPrint(result: AnalysisResult) {
  try {
    window.print();
    toast.info("Opened browser print dialog. Select 'Save as PDF' to save your report.");
  } catch (err: any) {
    toast.error("Failed to trigger print dialog: " + err.message);
  }
}
