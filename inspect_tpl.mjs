import xlsx from "xlsx";
const wb = xlsx.readFile("C:/Users/tomas/Desktop/VCL/VCL_Template_Evaluacion_Vendors.xlsx", { cellFormula: true, cellStyles: true });
for (const name of wb.SheetNames) {
  const ws = wb.Sheets[name];
  const ref = ws["!ref"];
  // count formula cells
  let formulas = 0, validations = (ws["!dataValidation"]?.length || 0);
  for (const k of Object.keys(ws)) { if (ws[k] && ws[k].f) formulas++; }
  console.log(`${name} | range ${ref} | formulas: ${formulas} | merges: ${ws["!merges"]?.length||0}`);
}
