// Normaliza o import do jspdf-autotable (UMD/CJS): dependendo do empacotamento,
// o default pode vir como a função ou como um objeto { default: função }.
import * as autoTableModule from "jspdf-autotable";

type AutoTableFn = typeof import("jspdf-autotable").default;

const mod: any = autoTableModule;
const autoTable: AutoTableFn =
  typeof mod === "function"
    ? mod
    : typeof mod.default === "function"
      ? mod.default
      : typeof mod.default?.default === "function"
        ? mod.default.default
        : mod.autoTable;

export default autoTable;
