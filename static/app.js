const form = document.getElementById("study-form");
const question = document.getElementById("question");
const imageInput = document.getElementById("image");
const fileName = document.getElementById("file-name");
const submitBtn = document.getElementById("submit-btn");
const submitLabel = document.getElementById("submit-label");
const resultCard = document.getElementById("result-card");
const resultTitle = document.getElementById("result-title");
const answer = document.getElementById("answer");
const loading = document.getElementById("loading");
const errorBox = document.getElementById("error");
const copyBtn = document.getElementById("copy-btn");

const downloadBtn = document.getElementById("download-btn");

let mode = "explain";
const labels = {
  explain: ["Explain my question", "Your explanation"],
  quiz: ["Generate practice quiz", "Your practice quiz"],
  notes: ["Create revision notes", "Your revision notes"]
};

document.querySelectorAll(".mode").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".mode").forEach(item => item.classList.remove("active"));
    button.classList.add("active");
    mode = button.dataset.mode;
    
downloadBtn.hidden = mode !== "notes";
    submitLabel.textContent = labels[mode][0];
  });
});

document.querySelectorAll(".example").forEach(button => {
  button.addEventListener("click", () => {
    question.value = button.dataset.question;
    question.focus();
  });
});

imageInput.addEventListener("change", () => {
  const file = imageInput.files[0];
  fileName.textContent = file ? `Selected: ${file.name}` : "";
});

form.addEventListener("submit", async event => {
  event.preventDefault();
  if (!question.value.trim() && !imageInput.files.length) {
    showError("Type a question or upload an image first.");
    question.focus();
    return;
  }

  const data = new FormData();
  data.append("question", question.value);
  data.append("mode", mode);
  if (imageInput.files[0]) data.append("image", imageInput.files[0]);

  resultCard.hidden = false;
  resultTitle.textContent = labels[mode][1];
  answer.textContent = "";
  errorBox.hidden = true;
  loading.hidden = false;
  submitBtn.disabled = true;
  submitLabel.textContent = "Working…";
  resultCard.scrollIntoView({ behavior: "smooth", block: "start" });

  try {
    const response = await fetch("/api/study", { method: "POST", body: data });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Something went wrong.");
    answer.textContent = result.answer;
  } catch (err) {
    showError(err.message || "Could not connect. Check your connection and try again.");
  } finally {
    loading.hidden = true;
    submitBtn.disabled = false;
    submitLabel.textContent = labels[mode][0];
  }
});

function showError(message) {
  resultCard.hidden = false;
  errorBox.textContent = message;
  errorBox.hidden = false;
  loading.hidden = true;
}

copyBtn.addEventListener("click", async () => {
  if (!answer.textContent) return;
  try {
    await navigator.clipboard.writeText(answer.textContent);
    copyBtn.textContent = "Copied!";
    setTimeout(() => { copyBtn.textContent = "Copy answer"; }, 1500);
  } catch {
    copyBtn.textContent = "Select and copy";
  }
});



downloadBtn.addEventListener("click", () => {
  const content = answer.textContent.trim();
  if (!content) return;

  if (!window.jspdf) {
    alert("PDF library load nahi hui. Internet connection check karo.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 18;
  const usableWidth = pageWidth - margin * 2;
  const date = new Date().toLocaleDateString("en-IN");

  // Header
  pdf.setFillColor(35, 45, 90);
  pdf.rect(0, 0, pageWidth, 38, "F");

  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(20);
  pdf.text("StudyMate AI", margin, 16);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.text("Your Personal AI Study Assistant", margin, 24);
  pdf.text(`Revision Notes | ${date}`, margin, 31);

  // Main content
  pdf.setTextColor(35, 45, 65);
  pdf.setFontSize(11);
  pdf.setFont("helvetica", "normal");

  const paragraphs = content.split(/\n+/);
  let y = 50;

  paragraphs.forEach((paragraph) => {
    const text = paragraph.trim();
    if (!text) return;

    const isHeading =
      text.length < 75 &&
      (/^#{1,6}\s/.test(text) ||
       /^\d+[\.)]\s/.test(text) ||
       /^(introduction|conclusion|summary|key points|important points)\b/i.test(text));

    const cleanText = text
      .replace(/^#{1,6}\s*/, "")
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1");

    pdf.setFont(
      "helvetica",
      isHeading ? "bold" : "normal"
    );
    pdf.setFontSize(isHeading ? 13 : 10.5);

    const lines = pdf.splitTextToSize(cleanText, usableWidth);
    const lineHeight = isHeading ? 7 : 5.5;
    const blockHeight = lines.length * lineHeight + 3;

    if (y + blockHeight > pageHeight - 20) {
      pdf.addPage();
      y = 20;
    }

    pdf.text(lines, margin, y);
    y += blockHeight;
  });

  // Footer with page numbers
  const totalPages = pdf.internal.getNumberOfPages();

  for (let page = 1; page <= totalPages; page++) {
    pdf.setPage(page);
    pdf.setDrawColor(210, 215, 225);
    pdf.line(
      margin,
      pageHeight - 14,
      pageWidth - margin,
      pageHeight - 14
    );

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(100, 105, 120);

    pdf.text(
      "Generated by StudyMate AI",
      margin,
      pageHeight - 8
    );

    pdf.text(
      `Page ${page} of ${totalPages}`,
      pageWidth - margin,
      pageHeight - 8,
      { align: "right" }
    );
  }

  pdf.save("StudyMate-Professional-Notes.pdf");
});