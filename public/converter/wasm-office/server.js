import { Worker } from 'worker_threads';
import { fileURLToPath } from 'url';
import { resolve, dirname, join } from 'path';
import { randomUUID } from 'crypto';
import { existsSync } from 'fs';
import { fork } from 'child_process';
import { deflateSync } from 'zlib';
import { z } from 'zod';

// src/types.ts
var DEFAULT_WASM_BASE_URL = "/wasm/";
function createWasmPaths(baseUrl = DEFAULT_WASM_BASE_URL) {
  const base = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return {
    sofficeJs: `${base}soffice.js`,
    sofficeWasm: `${base}soffice.wasm`,
    sofficeData: `${base}soffice.data`,
    sofficeWorkerJs: `${base}soffice.worker.js`
  };
}
var ConversionErrorCode = /* @__PURE__ */ ((ConversionErrorCode2) => {
  ConversionErrorCode2["UNKNOWN"] = "UNKNOWN";
  ConversionErrorCode2["INVALID_INPUT"] = "INVALID_INPUT";
  ConversionErrorCode2["UNSUPPORTED_FORMAT"] = "UNSUPPORTED_FORMAT";
  ConversionErrorCode2["CORRUPTED_DOCUMENT"] = "CORRUPTED_DOCUMENT";
  ConversionErrorCode2["PASSWORD_REQUIRED"] = "PASSWORD_REQUIRED";
  ConversionErrorCode2["WASM_NOT_INITIALIZED"] = "WASM_NOT_INITIALIZED";
  ConversionErrorCode2["CONVERSION_FAILED"] = "CONVERSION_FAILED";
  ConversionErrorCode2["LOAD_FAILED"] = "LOAD_FAILED";
  return ConversionErrorCode2;
})(ConversionErrorCode || {});
var ConversionError = class extends Error {
  code;
  details;
  constructor(code, message, details) {
    super(message);
    this.name = "ConversionError";
    this.code = code;
    this.details = details;
  }
};
var FORMAT_FILTERS = {
  pdf: "writer_pdf_Export",
  docx: "MS Word 2007 XML",
  doc: "MS Word 97",
  odt: "writer8",
  rtf: "Rich Text Format",
  txt: "Text",
  html: "HTML (StarWriter)",
  xlsx: "Calc MS Excel 2007 XML",
  xls: "MS Excel 97",
  ods: "calc8",
  csv: "Text - txt - csv (StarCalc)",
  pptx: "Impress MS PowerPoint 2007 XML",
  ppt: "MS PowerPoint 97",
  odp: "impress8",
  png: "writer_png_Export",
  jpg: "writer_jpg_Export",
  svg: "writer_svg_Export"
};
var LOKDocumentType = /* @__PURE__ */ ((LOKDocumentType4) => {
  LOKDocumentType4[LOKDocumentType4["TEXT"] = 0] = "TEXT";
  LOKDocumentType4[LOKDocumentType4["SPREADSHEET"] = 1] = "SPREADSHEET";
  LOKDocumentType4[LOKDocumentType4["PRESENTATION"] = 2] = "PRESENTATION";
  LOKDocumentType4[LOKDocumentType4["DRAWING"] = 3] = "DRAWING";
  LOKDocumentType4[LOKDocumentType4["OTHER"] = 4] = "OTHER";
  return LOKDocumentType4;
})(LOKDocumentType || {});
var FORMAT_MIME_TYPES = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  doc: "application/msword",
  odt: "application/vnd.oasis.opendocument.text",
  rtf: "application/rtf",
  txt: "text/plain",
  html: "text/html",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  xls: "application/vnd.ms-excel",
  ods: "application/vnd.oasis.opendocument.spreadsheet",
  csv: "text/csv",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ppt: "application/vnd.ms-powerpoint",
  odp: "application/vnd.oasis.opendocument.presentation",
  png: "image/png",
  jpg: "image/jpeg",
  svg: "image/svg+xml"
};
var EXTENSION_TO_FORMAT = {
  doc: "doc",
  docx: "docx",
  xls: "xls",
  xlsx: "xlsx",
  ppt: "ppt",
  pptx: "pptx",
  odt: "odt",
  ods: "ods",
  odp: "odp",
  odg: "odg",
  odf: "odf",
  rtf: "rtf",
  txt: "txt",
  html: "html",
  htm: "html",
  csv: "csv",
  xml: "xml",
  epub: "epub",
  pdf: "pdf"
};
var LOK_DOCTYPE_OUTPUT_FORMATS = {
  [0 /* TEXT */]: ["pdf", "docx", "doc", "odt", "rtf", "txt", "html", "png"],
  [1 /* SPREADSHEET */]: ["pdf", "xlsx", "xls", "ods", "csv", "html", "png"],
  [2 /* PRESENTATION */]: ["pdf", "pptx", "ppt", "odp", "png", "svg", "html"],
  [3 /* DRAWING */]: ["pdf", "png", "svg", "html"],
  [4 /* OTHER */]: ["pdf"]
};
function getOutputFormatsForDocType(docType) {
  return LOK_DOCTYPE_OUTPUT_FORMATS[docType] || ["pdf"];
}
var OUTPUT_FORMAT_TO_LOK = {
  pdf: "pdf",
  docx: "docx",
  doc: "doc",
  odt: "odt",
  rtf: "rtf",
  txt: "txt",
  html: "html",
  xlsx: "xlsx",
  xls: "xls",
  ods: "ods",
  csv: "csv",
  pptx: "pptx",
  ppt: "ppt",
  odp: "odp",
  png: "png",
  jpg: "jpg",
  svg: "svg"
};
var FORMAT_FILTER_OPTIONS = {
  // PDF options can include things like:
  // - SelectPdfVersion (0=PDF 1.4, 1=PDF/A-1, 2=PDF/A-2, 3=PDF/A-3)
  // - UseLosslessCompression
  // - Quality
  pdf: "",
  // CSV can specify separator, encoding, etc.
  csv: "44,34,76,1,,0,false,true,false,false,false,-1",
  // Text encoding
  txt: "UTF8"
};
var CSV_IMPORT_FILTER_OPTIONS = "FilterName=Text - txt - csv (StarCalc),FilterOptions=44,34,76,1,,1033,false,true,false,false,false,0,true,false,true";
function buildLoadOptions(inputFormat, password) {
  const options = [];
  if (inputFormat?.toLowerCase() === "csv") {
    options.push(CSV_IMPORT_FILTER_OPTIONS);
  }
  if (password) {
    options.push(`Password=${password}`);
  }
  return options.join(",");
}
var INPUT_FORMAT_CATEGORY = {
  // Text/Writer documents
  doc: "text",
  docx: "text",
  odt: "text",
  rtf: "text",
  txt: "text",
  html: "text",
  htm: "text",
  epub: "text",
  xml: "text",
  // Spreadsheet/Calc documents
  xls: "spreadsheet",
  xlsx: "spreadsheet",
  ods: "spreadsheet",
  csv: "spreadsheet",
  // Presentation/Impress documents
  ppt: "presentation",
  pptx: "presentation",
  odp: "presentation",
  // Drawing/Draw documents (PDF imports as Draw)
  odg: "drawing",
  odf: "drawing",
  pdf: "drawing"
  // PDFs are imported as Draw documents
};
var CATEGORY_OUTPUT_FORMATS = {
  // Writer documents can export to (based on aWriterExtensionMap in init.cxx):
  // NOTE: jpg and svg are NOT supported for Writer - only png for images
  text: ["pdf", "docx", "doc", "odt", "rtf", "txt", "html", "png"],
  // Calc documents can export to (based on aCalcExtensionMap in init.cxx):
  // NOTE: jpg and svg are NOT supported for Calc - only png for images
  spreadsheet: ["pdf", "xlsx", "xls", "ods", "csv", "html", "png"],
  // Impress documents can export to (based on aImpressExtensionMap in init.cxx):
  // NOTE: jpg is NOT supported - only png and svg for images
  presentation: ["pdf", "pptx", "ppt", "odp", "png", "svg", "html"],
  // Draw documents (including imported PDFs) can export to (based on aDrawExtensionMap in init.cxx):
  // NOTE: jpg is NOT supported - only png and svg for images
  drawing: ["pdf", "png", "svg", "html"],
  // Other/unknown - try PDF only
  other: ["pdf"]
};
function getValidOutputFormats(inputFormat) {
  const format = inputFormat.toLowerCase();
  const category = INPUT_FORMAT_CATEGORY[format];
  if (!category) {
    return ["pdf"];
  }
  return CATEGORY_OUTPUT_FORMATS[category];
}
function isConversionValid(inputFormat, outputFormat) {
  const validOutputs = getValidOutputFormats(inputFormat);
  return validOutputs.includes(outputFormat.toLowerCase());
}
function getConversionErrorMessage(inputFormat, outputFormat) {
  const input = inputFormat.toLowerCase();
  const output = outputFormat.toLowerCase();
  const validOutputs = getValidOutputFormats(input);
  const category = INPUT_FORMAT_CATEGORY[input] || "unknown";
  let reason = "";
  if (category === "drawing" && ["docx", "doc", "xlsx", "xls", "pptx", "ppt"].includes(output)) {
    reason = `PDF files are imported as Draw documents and cannot be exported to Office formats. `;
  } else if (category === "spreadsheet" && ["docx", "doc", "pptx", "ppt"].includes(output)) {
    reason = `Spreadsheet documents cannot be converted to word processing or presentation formats. `;
  } else if (category === "presentation" && ["docx", "doc", "xlsx", "xls"].includes(output)) {
    reason = `Presentation documents cannot be converted to word processing or spreadsheet formats. `;
  } else if (category === "text" && ["xlsx", "xls", "pptx", "ppt"].includes(output)) {
    reason = `Text documents cannot be converted to spreadsheet or presentation formats. `;
  }
  return `Cannot convert ${input.toUpperCase()} to ${output.toUpperCase()}. ${reason}Valid output formats for ${input.toUpperCase()}: ${validOutputs.join(", ")}`;
}

// src/lok-bindings.ts
var LOK_MOUSEEVENT_BUTTONDOWN = 0;
var LOK_MOUSEEVENT_BUTTONUP = 1;
var LOK_MOUSEEVENT_MOVE = 2;
var LOK_KEYEVENT_KEYINPUT = 0;
var LOK_KEYEVENT_KEYUP = 1;
var LOK_SELTYPE_NONE = 0;
var LOK_SELTYPE_TEXT = 1;
var LOK_SELTYPE_CELL = 2;
var LOK_SETTEXTSELECTION_START = 0;
var LOK_SETTEXTSELECTION_END = 1;
var LOK_SETTEXTSELECTION_RESET = 2;
var LOK_DOCTYPE_TEXT = 0;
var LOK_DOCTYPE_SPREADSHEET = 1;
var LOK_DOCTYPE_PRESENTATION = 2;
var LOK_DOCTYPE_DRAWING = 3;
var LOK_DOCTYPE_OTHER = 4;
var LOK_CALLBACK_INVALIDATE_TILES = 0;
var LOK_CALLBACK_INVALIDATE_VISIBLE_CURSOR = 1;
var LOK_CALLBACK_TEXT_SELECTION = 2;
var LOK_CALLBACK_TEXT_SELECTION_START = 3;
var LOK_CALLBACK_TEXT_SELECTION_END = 4;
var LOK_CALLBACK_CURSOR_VISIBLE = 5;
var LOK_CALLBACK_GRAPHIC_SELECTION = 6;
var LOK_CALLBACK_HYPERLINK_CLICKED = 7;
var LOK_CALLBACK_STATE_CHANGED = 8;
var LOK_CALLBACK_STATUS_INDICATOR_START = 9;
var LOK_CALLBACK_STATUS_INDICATOR_SET_VALUE = 10;
var LOK_CALLBACK_STATUS_INDICATOR_FINISH = 11;
var LOK_CALLBACK_SEARCH_NOT_FOUND = 12;
var LOK_CALLBACK_DOCUMENT_SIZE_CHANGED = 13;
var LOK_CALLBACK_SET_PART = 14;
var LOK_CALLBACK_SEARCH_RESULT_SELECTION = 15;
var LOK_CALLBACK_UNO_COMMAND_RESULT = 16;
var LOK_CALLBACK_CELL_CURSOR = 17;
var LOK_CALLBACK_MOUSE_POINTER = 18;
var LOK_CALLBACK_CELL_FORMULA = 19;
var LOK_CALLBACK_DOCUMENT_PASSWORD = 20;
var LOK_CALLBACK_DOCUMENT_PASSWORD_TO_MODIFY = 21;
var LOK_CALLBACK_CONTEXT_MENU = 22;
var LOK_CALLBACK_INVALIDATE_VIEW_CURSOR = 23;
var LOK_CALLBACK_TEXT_VIEW_SELECTION = 24;
var LOK_CALLBACK_CELL_VIEW_CURSOR = 25;
var LOK_CALLBACK_GRAPHIC_VIEW_SELECTION = 26;
var LOK_CALLBACK_VIEW_CURSOR_VISIBLE = 27;
var LOK_CALLBACK_VIEW_LOCK = 28;
var LOK_CALLBACK_REDLINE_TABLE_SIZE_CHANGED = 29;
var LOK_CALLBACK_REDLINE_TABLE_ENTRY_MODIFIED = 30;
var LOK_CALLBACK_COMMENT = 31;
var LOK_CALLBACK_INVALIDATE_HEADER = 32;
var LOK_CALLBACK_CELL_ADDRESS = 33;
function getCallbackTypeName(type) {
  const names = {
    [LOK_CALLBACK_INVALIDATE_TILES]: "INVALIDATE_TILES",
    [LOK_CALLBACK_INVALIDATE_VISIBLE_CURSOR]: "INVALIDATE_VISIBLE_CURSOR",
    [LOK_CALLBACK_TEXT_SELECTION]: "TEXT_SELECTION",
    [LOK_CALLBACK_TEXT_SELECTION_START]: "TEXT_SELECTION_START",
    [LOK_CALLBACK_TEXT_SELECTION_END]: "TEXT_SELECTION_END",
    [LOK_CALLBACK_CURSOR_VISIBLE]: "CURSOR_VISIBLE",
    [LOK_CALLBACK_GRAPHIC_SELECTION]: "GRAPHIC_SELECTION",
    [LOK_CALLBACK_HYPERLINK_CLICKED]: "HYPERLINK_CLICKED",
    [LOK_CALLBACK_STATE_CHANGED]: "STATE_CHANGED",
    [LOK_CALLBACK_STATUS_INDICATOR_START]: "STATUS_INDICATOR_START",
    [LOK_CALLBACK_STATUS_INDICATOR_SET_VALUE]: "STATUS_INDICATOR_SET_VALUE",
    [LOK_CALLBACK_STATUS_INDICATOR_FINISH]: "STATUS_INDICATOR_FINISH",
    [LOK_CALLBACK_SEARCH_NOT_FOUND]: "SEARCH_NOT_FOUND",
    [LOK_CALLBACK_DOCUMENT_SIZE_CHANGED]: "DOCUMENT_SIZE_CHANGED",
    [LOK_CALLBACK_SET_PART]: "SET_PART",
    [LOK_CALLBACK_SEARCH_RESULT_SELECTION]: "SEARCH_RESULT_SELECTION",
    [LOK_CALLBACK_UNO_COMMAND_RESULT]: "UNO_COMMAND_RESULT",
    [LOK_CALLBACK_CELL_CURSOR]: "CELL_CURSOR",
    [LOK_CALLBACK_MOUSE_POINTER]: "MOUSE_POINTER",
    [LOK_CALLBACK_CELL_FORMULA]: "CELL_FORMULA",
    [LOK_CALLBACK_DOCUMENT_PASSWORD]: "DOCUMENT_PASSWORD",
    [LOK_CALLBACK_DOCUMENT_PASSWORD_TO_MODIFY]: "DOCUMENT_PASSWORD_TO_MODIFY",
    [LOK_CALLBACK_CONTEXT_MENU]: "CONTEXT_MENU",
    [LOK_CALLBACK_INVALIDATE_VIEW_CURSOR]: "INVALIDATE_VIEW_CURSOR",
    [LOK_CALLBACK_TEXT_VIEW_SELECTION]: "TEXT_VIEW_SELECTION",
    [LOK_CALLBACK_CELL_VIEW_CURSOR]: "CELL_VIEW_CURSOR",
    [LOK_CALLBACK_GRAPHIC_VIEW_SELECTION]: "GRAPHIC_VIEW_SELECTION",
    [LOK_CALLBACK_VIEW_CURSOR_VISIBLE]: "VIEW_CURSOR_VISIBLE",
    [LOK_CALLBACK_VIEW_LOCK]: "VIEW_LOCK",
    [LOK_CALLBACK_REDLINE_TABLE_SIZE_CHANGED]: "REDLINE_TABLE_SIZE_CHANGED",
    [LOK_CALLBACK_REDLINE_TABLE_ENTRY_MODIFIED]: "REDLINE_TABLE_ENTRY_MODIFIED",
    [LOK_CALLBACK_COMMENT]: "COMMENT",
    [LOK_CALLBACK_INVALIDATE_HEADER]: "INVALIDATE_HEADER",
    [LOK_CALLBACK_CELL_ADDRESS]: "CELL_ADDRESS"
  };
  return names[type] || `UNKNOWN(${type})`;
}
var LOK_CLASS = {
  nSize: 0,
  destroy: 4,
  documentLoad: 8,
  getError: 12,
  documentLoadWithOptions: 16,
  freeError: 20
};
var DOC_CLASS = {
  nSize: 0,
  destroy: 4,
  saveAs: 8
};
var textEncoder = new TextEncoder();
var textDecoder = new TextDecoder();
var LOKBindings = class {
  module;
  lokPtr = 0;
  verbose;
  useShims;
  constructor(module, verbose = false) {
    this.module = module;
    this.verbose = verbose;
    this.useShims = typeof this.module._lok_documentLoad === "function";
    if (this.useShims) {
      this.log("Using direct LOK shim exports");
    } else {
      this.log("Using vtable traversal (shims not available)");
    }
  }
  log(...args) {
    if (this.verbose) {
      console.log("[LOK]", ...args);
    }
  }
  /**
   * Get fresh heap views (important after memory growth!)
   */
  get HEAPU8() {
    return this.module.HEAPU8;
  }
  get HEAPU32() {
    return this.module.HEAPU32;
  }
  get HEAP32() {
    return this.module.HEAP32;
  }
  /**
   * Allocate a null-terminated string in WASM memory
   */
  allocString(str) {
    const bytes = textEncoder.encode(str + "\0");
    const ptr = this.module._malloc(bytes.length);
    this.HEAPU8.set(bytes, ptr);
    return ptr;
  }
  /**
   * Read a null-terminated string from WASM memory
   */
  readString(ptr) {
    if (ptr === 0) return null;
    const heap = this.HEAPU8;
    let end = ptr;
    while (heap[end] !== 0) end++;
    const slice = heap.slice(ptr, end);
    return textDecoder.decode(slice);
  }
  /**
   * Read a 32-bit pointer from memory (unsigned)
   */
  readPtr(addr) {
    return this.HEAPU32[addr >> 2] || 0;
  }
  /**
   * Get a function from the WASM table (fallback for vtable traversal)
   */
  getFunc(ptr) {
    const wasmTable = this.module.wasmTable;
    return wasmTable.get(ptr);
  }
  /**
   * Initialize LibreOfficeKit
   */
  initialize(installPath = "/instdir/program") {
    this.log("Initializing with path:", installPath);
    const pathPtr = this.allocString(installPath);
    try {
      const hook = this.module._libreofficekit_hook;
      if (typeof hook !== "function") {
        throw new Error("libreofficekit_hook export not found on module");
      }
      this.lokPtr = hook(pathPtr);
      if (this.lokPtr === 0) {
        throw new Error("Failed to initialize LibreOfficeKit");
      }
      this.log("LOK initialized, ptr:", this.lokPtr);
    } finally {
      this.module._free(pathPtr);
    }
  }
  /**
   * Get the last error message
   */
  getError() {
    if (this.lokPtr === 0) return null;
    if (this.useShims && this.module._lok_getError) {
      const errPtr2 = this.module._lok_getError(this.lokPtr);
      return this.readString(errPtr2);
    }
    const lokClassPtr = this.readPtr(this.lokPtr);
    const getErrorPtr = this.readPtr(lokClassPtr + LOK_CLASS.getError);
    if (getErrorPtr === 0) return null;
    const getError = this.getFunc(getErrorPtr);
    const errPtr = getError(this.lokPtr);
    return this.readString(errPtr);
  }
  /**
   * Get version info
   */
  getVersionInfo() {
    return "LibreOffice WASM";
  }
  /**
   * Convert a filesystem path to a file:// URL
   * Required by LibreOffice's getAbsoluteURL() which uses rtl::Uri::convertRelToAbs()
   */
  toFileUrl(path) {
    if (path.startsWith("file://")) return path;
    const absolutePath = path.startsWith("/") ? path : "/" + path;
    return "file://" + absolutePath;
  }
  /**
   * Load a document from the virtual filesystem
   */
  documentLoad(path) {
    if (this.lokPtr === 0) {
      throw new Error("LOK not initialized");
    }
    const fileUrl = this.toFileUrl(path);
    this.log("Loading document:", path, "->", fileUrl);
    const pathPtr = this.allocString(fileUrl);
    try {
      const startTime = Date.now();
      let docPtr;
      if (this.useShims && this.module._lok_documentLoad) {
        docPtr = this.module._lok_documentLoad(this.lokPtr, pathPtr);
      } else {
        const lokClassPtr = this.readPtr(this.lokPtr);
        const documentLoadPtr = this.readPtr(lokClassPtr + LOK_CLASS.documentLoad);
        const documentLoad = this.getFunc(documentLoadPtr);
        docPtr = documentLoad(this.lokPtr, pathPtr);
      }
      this.log("Document loaded in", Date.now() - startTime, "ms, ptr:", docPtr);
      if (docPtr === 0) {
        const error = this.getError();
        throw new Error(`Failed to load document: ${error || "unknown error"}`);
      }
      return docPtr;
    } finally {
      this.module._free(pathPtr);
    }
  }
  /**
   * Load a document with options
   */
  documentLoadWithOptions(path, options) {
    if (this.lokPtr === 0) {
      throw new Error("LOK not initialized");
    }
    const fileUrl = this.toFileUrl(path);
    this.log("Loading document with options:", path, "->", fileUrl, options);
    const pathPtr = this.allocString(fileUrl);
    const optsPtr = this.allocString(options);
    try {
      let docPtr;
      if (this.useShims && this.module._lok_documentLoadWithOptions) {
        docPtr = this.module._lok_documentLoadWithOptions(this.lokPtr, pathPtr, optsPtr);
      } else {
        const lokClassPtr = this.readPtr(this.lokPtr);
        const loadWithOptsPtr = this.readPtr(lokClassPtr + LOK_CLASS.documentLoadWithOptions);
        if (loadWithOptsPtr === 0) {
          return this.documentLoad(path);
        }
        const loadWithOpts = this.getFunc(loadWithOptsPtr);
        docPtr = loadWithOpts(this.lokPtr, pathPtr, optsPtr);
      }
      if (docPtr === 0) {
        const error = this.getError();
        throw new Error(`Failed to load document: ${error || "unknown error"}`);
      }
      this.log("Document loaded, ptr:", docPtr);
      return docPtr;
    } finally {
      this.module._free(pathPtr);
      this.module._free(optsPtr);
    }
  }
  /**
   * Save a document to a different format
   */
  documentSaveAs(docPtr, outputPath, format, filterOptions = "") {
    if (docPtr === 0) {
      throw new Error("Invalid document pointer");
    }
    const fileUrl = this.toFileUrl(outputPath);
    this.log("Saving document to:", outputPath, "->", fileUrl, "format:", format);
    const urlPtr = this.allocString(fileUrl);
    const formatPtr = this.allocString(format);
    const optsPtr = this.allocString(filterOptions);
    try {
      let result;
      if (this.useShims && this.module._lok_documentSaveAs) {
        result = this.module._lok_documentSaveAs(docPtr, urlPtr, formatPtr, optsPtr);
      } else {
        const docClassPtr = this.readPtr(docPtr);
        const saveAsPtr = this.readPtr(docClassPtr + DOC_CLASS.saveAs);
        const saveAs = this.getFunc(saveAsPtr);
        result = saveAs(docPtr, urlPtr, formatPtr, optsPtr);
      }
      this.log("Save result:", result);
      if (result === 0) {
        throw new Error("Failed to save document");
      }
    } finally {
      this.module._free(urlPtr);
      this.module._free(formatPtr);
      this.module._free(optsPtr);
    }
  }
  /**
   * Destroy a document
   */
  documentDestroy(docPtr) {
    if (docPtr === 0) return;
    if (this.useShims && this.module._lok_documentDestroy) {
      this.module._lok_documentDestroy(docPtr);
      this.log("Document destroyed (via shim)");
      return;
    }
    const docClassPtr = this.readPtr(docPtr);
    const destroyPtr = this.readPtr(docClassPtr + DOC_CLASS.destroy);
    if (destroyPtr !== 0) {
      const destroy = this.getFunc(destroyPtr);
      destroy(docPtr);
      this.log("Document destroyed (via vtable)");
    }
  }
  /**
   * Destroy the LOK instance
   */
  destroy() {
    if (this.lokPtr === 0) return;
    try {
      if (this.useShims && this.module._lok_destroy) {
        this.module._lok_destroy(this.lokPtr);
        this.log("LOK destroyed (via shim)");
      } else {
        const lokClassPtr = this.readPtr(this.lokPtr);
        const destroyPtr = this.readPtr(lokClassPtr + LOK_CLASS.destroy);
        if (destroyPtr !== 0) {
          const destroy = this.getFunc(destroyPtr);
          destroy(this.lokPtr);
          this.log("LOK destroyed (via vtable)");
        }
      }
    } catch (error) {
      this.log("LOK destroy error (ignored):", error);
    }
    this.lokPtr = 0;
  }
  /**
   * Check if LOK is initialized
   */
  isInitialized() {
    return this.lokPtr !== 0;
  }
  /**
   * Check if using direct shim exports
   */
  isUsingShims() {
    return this.useShims;
  }
  // ==========================================
  // Page Rendering Methods
  // ==========================================
  /**
   * Get the number of parts (pages/slides) in a document
   */
  documentGetParts(docPtr) {
    if (docPtr === 0) {
      throw new Error("Invalid document pointer");
    }
    if (this.useShims && this.module._lok_documentGetParts) {
      return this.module._lok_documentGetParts(docPtr);
    }
    this.log("documentGetParts: shim not available");
    return 0;
  }
  /**
   * Get the current part (page/slide) index
   */
  documentGetPart(docPtr) {
    if (docPtr === 0) {
      throw new Error("Invalid document pointer");
    }
    if (this.useShims && this.module._lok_documentGetPart) {
      return this.module._lok_documentGetPart(docPtr);
    }
    this.log("documentGetPart: shim not available");
    return 0;
  }
  /**
   * Set the current part (page/slide) index
   */
  documentSetPart(docPtr, part) {
    if (docPtr === 0) {
      throw new Error("Invalid document pointer");
    }
    if (this.useShims && this.module._lok_documentSetPart) {
      this.module._lok_documentSetPart(docPtr, part);
      return;
    }
    this.log("documentSetPart: shim not available");
  }
  /**
   * Get document type (0=text, 1=spreadsheet, 2=presentation, 3=drawing)
   */
  documentGetDocumentType(docPtr) {
    if (docPtr === 0) {
      throw new Error("Invalid document pointer");
    }
    if (this.useShims && this.module._lok_documentGetDocumentType) {
      return this.module._lok_documentGetDocumentType(docPtr);
    }
    this.log("documentGetDocumentType: shim not available");
    return 0;
  }
  /**
   * Get document size in twips (1/1440 inch)
   */
  documentGetDocumentSize(docPtr) {
    this.log(`documentGetDocumentSize called with docPtr: ${docPtr}`);
    if (docPtr === 0) {
      throw new Error("Invalid document pointer");
    }
    if (this.useShims && this.module._lok_documentGetDocumentSize) {
      const sizePtr = this.module._malloc(8);
      try {
        this.module._lok_documentGetDocumentSize(docPtr, sizePtr, sizePtr + 4);
        const width = this.HEAP32[sizePtr >> 2] ?? 0;
        const height = this.HEAP32[sizePtr + 4 >> 2] ?? 0;
        this.log(`documentGetDocumentSize: ${width}x${height} twips`);
        return { width, height };
      } finally {
        this.module._free(sizePtr);
      }
    }
    this.log("documentGetDocumentSize: shim not available");
    return { width: 0, height: 0 };
  }
  /**
   * Initialize document for rendering
   */
  documentInitializeForRendering(docPtr, options = "") {
    if (docPtr === 0) {
      throw new Error("Invalid document pointer");
    }
    if (this.useShims && this.module._lok_documentInitializeForRendering) {
      const optsPtr = this.allocString(options);
      try {
        this.module._lok_documentInitializeForRendering(docPtr, optsPtr);
      } finally {
        this.module._free(optsPtr);
      }
      return;
    }
    this.log("documentInitializeForRendering: shim not available");
  }
  /**
   * Paint a tile of the document to a buffer
   * @param docPtr Document pointer
   * @param canvasWidth Output width in pixels
   * @param canvasHeight Output height in pixels
   * @param tilePosX X position in twips
   * @param tilePosY Y position in twips
   * @param tileWidth Width in twips
   * @param tileHeight Height in twips
   * @returns RGBA pixel data
   */
  documentPaintTile(docPtr, canvasWidth, canvasHeight, tilePosX, tilePosY, tileWidth, tileHeight) {
    if (docPtr === 0) {
      throw new Error("Invalid document pointer");
    }
    if (this.useShims && this.module._lok_documentPaintTile) {
      const bufferSize = canvasWidth * canvasHeight * 4;
      const bufferPtr = this.module._malloc(bufferSize);
      if (bufferPtr === 0) {
        throw new Error(`Failed to allocate ${bufferSize} bytes for tile buffer`);
      }
      try {
        this.module._lok_documentPaintTile(
          docPtr,
          bufferPtr,
          canvasWidth,
          canvasHeight,
          tilePosX,
          tilePosY,
          tileWidth,
          tileHeight
        );
        const result = new Uint8Array(bufferSize);
        result.set(this.HEAPU8.subarray(bufferPtr, bufferPtr + bufferSize));
        return result;
      } finally {
        this.module._free(bufferPtr);
      }
    }
    this.log("documentPaintTile: shim not available");
    return new Uint8Array(0);
  }
  /**
   * Get tile mode (0=RGBA, 1=BGRA)
   */
  documentGetTileMode(docPtr) {
    if (docPtr === 0) {
      throw new Error("Invalid document pointer");
    }
    if (this.useShims && this.module._lok_documentGetTileMode) {
      return this.module._lok_documentGetTileMode(docPtr);
    }
    this.log("documentGetTileMode: shim not available");
    return 0;
  }
  /**
   * Render a page/slide to an image
   * @param docPtr Document pointer
   * @param pageIndex Page/slide index (0-based)
   * @param width Output width in pixels
   * @param height Output height in pixels (0 = auto based on aspect ratio)
   * @returns RGBA pixel data and dimensions
   */
  renderPage(docPtr, pageIndex, width, height = 0, editMode = false) {
    this.documentInitializeForRendering(docPtr);
    const docType = this.documentGetDocumentType(docPtr);
    if (docType === 2 || docType === 3) {
      console.log(`[LOK] Setting part to ${pageIndex} for presentation/drawing`);
      this.documentSetPart(docPtr, pageIndex);
      const currentPart = this.documentGetPart(docPtr);
      console.log(`[LOK] Current part after setPart: ${currentPart}`);
      if (!editMode) {
        this.setEditMode(docPtr, 0);
        console.log(`[LOK] Set edit mode to 0 (view mode) for presentation rendering`);
      }
    }
    const docSize = this.documentGetDocumentSize(docPtr);
    this.log("Document size (twips):", docSize);
    if (docSize.width === 0 || docSize.height === 0) {
      throw new Error("Failed to get document size");
    }
    let tilePosX = 0;
    let tilePosY = 0;
    let tileWidth = docSize.width;
    let tileHeight = docSize.height;
    if (docType === 0 || docType === 1) {
      const pageRectsStr = this.getPartPageRectangles(docPtr);
      if (pageRectsStr) {
        const pageRects = this.parsePageRectangles(pageRectsStr);
        const pageRect = pageRects[pageIndex];
        if (pageRect) {
          tilePosX = pageRect.x;
          tilePosY = pageRect.y;
          tileWidth = pageRect.width;
          tileHeight = pageRect.height;
          this.log(`Page ${pageIndex} rectangle:`, pageRect);
        }
      }
    }
    const aspectRatio = tileHeight / tileWidth;
    const outputWidth = width;
    const outputHeight = height > 0 ? height : Math.round(width * aspectRatio);
    console.log(`[LOK] Calling paintTile: ${outputWidth}x${outputHeight} from tile pos (${tilePosX}, ${tilePosY}) size (${tileWidth}x${tileHeight})`);
    const data = this.documentPaintTile(
      docPtr,
      outputWidth,
      outputHeight,
      tilePosX,
      tilePosY,
      tileWidth,
      tileHeight
    );
    console.log(`[LOK] paintTile returned ${data.length} bytes`);
    return { data, width: outputWidth, height: outputHeight };
  }
  /**
   * Render a page/slide at full quality (native resolution based on DPI)
   *
   * Unlike renderPage which scales to a fixed width, this method renders
   * at the document's native resolution converted to pixels at the specified DPI.
   *
   * @param docPtr Document pointer
   * @param pageIndex Page/slide index (0-based)
   * @param dpi Dots per inch for rendering (default 150, use 300 for print quality)
   * @param maxDimension Optional maximum dimension (width or height) to prevent memory issues
   * @returns RGBA pixel data and dimensions
   *
   * @example
   * // Render at 150 DPI (good for screen)
   * const preview = lokBindings.renderPageFullQuality(docPtr, 0, 150);
   *
   * // Render at 300 DPI (print quality)
   * const highRes = lokBindings.renderPageFullQuality(docPtr, 0, 300);
   *
   * // Render with max dimension cap to prevent memory issues
   * const capped = lokBindings.renderPageFullQuality(docPtr, 0, 300, 4096);
   */
  renderPageFullQuality(docPtr, pageIndex, dpi = 150, maxDimension, editMode = false) {
    this.documentInitializeForRendering(docPtr);
    const docType = this.documentGetDocumentType(docPtr);
    if (docType === 2 || docType === 3) {
      this.log(`Setting part to ${pageIndex} for presentation/drawing`);
      this.documentSetPart(docPtr, pageIndex);
      if (!editMode) {
        this.setEditMode(docPtr, 0);
        this.log(`Set edit mode to 0 (view mode) for presentation rendering`);
      }
    }
    const docSize = this.documentGetDocumentSize(docPtr);
    this.log("Document size (twips):", docSize);
    if (docSize.width === 0 || docSize.height === 0) {
      throw new Error("Failed to get document size");
    }
    let tilePosX = 0;
    let tilePosY = 0;
    let tileWidth = docSize.width;
    let tileHeight = docSize.height;
    if (docType === 0 || docType === 1) {
      const pageRectsStr = this.getPartPageRectangles(docPtr);
      if (pageRectsStr) {
        const pageRects = this.parsePageRectangles(pageRectsStr);
        const pageRect = pageRects[pageIndex];
        if (pageRect) {
          tilePosX = pageRect.x;
          tilePosY = pageRect.y;
          tileWidth = pageRect.width;
          tileHeight = pageRect.height;
          this.log(`Page ${pageIndex} rectangle:`, pageRect);
        }
      }
    }
    const TWIPS_PER_INCH = 1440;
    let outputWidth = Math.round(tileWidth * dpi / TWIPS_PER_INCH);
    let outputHeight = Math.round(tileHeight * dpi / TWIPS_PER_INCH);
    let effectiveDpi = dpi;
    if (maxDimension && (outputWidth > maxDimension || outputHeight > maxDimension)) {
      const scale = maxDimension / Math.max(outputWidth, outputHeight);
      outputWidth = Math.round(outputWidth * scale);
      outputHeight = Math.round(outputHeight * scale);
      effectiveDpi = Math.round(dpi * scale);
      this.log(`Capped dimensions to ${outputWidth}x${outputHeight} (effective DPI: ${effectiveDpi})`);
    }
    console.log(`[LOK] renderPageFullQuality: ${outputWidth}x${outputHeight} at ${effectiveDpi} DPI from tile (${tilePosX}, ${tilePosY}) size (${tileWidth}x${tileHeight}) twips`);
    const data = this.documentPaintTile(
      docPtr,
      outputWidth,
      outputHeight,
      tilePosX,
      tilePosY,
      tileWidth,
      tileHeight
    );
    console.log(`[LOK] renderPageFullQuality returned ${data.length} bytes`);
    return { data, width: outputWidth, height: outputHeight, dpi: effectiveDpi };
  }
  // ==========================================
  // Text Selection and Content Methods
  // ==========================================
  /**
   * Get currently selected text
   * @param docPtr Document pointer
   * @param mimeType Desired MIME type. Must include charset, e.g., 'text/plain;charset=utf-8'
   *                 Note: 'text/plain' without charset is NOT supported by LOK
   * @returns Selected text or null
   */
  getTextSelection(docPtr, mimeType = "text/plain;charset=utf-8") {
    if (docPtr === 0) throw new Error("Invalid document pointer");
    if (this.useShims && this.module._lok_documentGetTextSelection) {
      const mimePtr = this.allocString(mimeType);
      const usedMimePtr = this.module._malloc(4);
      try {
        const resultPtr = this.module._lok_documentGetTextSelection(docPtr, mimePtr, usedMimePtr);
        if (resultPtr === 0) return null;
        const result = this.readString(resultPtr);
        this.module._free(resultPtr);
        return result;
      } finally {
        this.module._free(mimePtr);
        this.module._free(usedMimePtr);
      }
    }
    this.log("getTextSelection: shim not available");
    return null;
  }
  /**
   * Set text selection at coordinates
   * @param docPtr Document pointer
   * @param type Selection type (LOK_SETTEXTSELECTION_START, END, or RESET)
   * @param x X coordinate in twips
   * @param y Y coordinate in twips
   */
  setTextSelection(docPtr, type, x, y) {
    if (docPtr === 0) throw new Error("Invalid document pointer");
    if (this.useShims && this.module._lok_documentSetTextSelection) {
      this.module._lok_documentSetTextSelection(docPtr, type, x, y);
      return;
    }
    this.log("setTextSelection: shim not available");
  }
  /**
   * Get current selection type
   * @param docPtr Document pointer
   * @returns Selection type (LOK_SELTYPE_NONE, TEXT, or CELL)
   */
  getSelectionType(docPtr) {
    if (docPtr === 0) throw new Error("Invalid document pointer");
    if (this.useShims && this.module._lok_documentGetSelectionType) {
      return this.module._lok_documentGetSelectionType(docPtr);
    }
    this.log("getSelectionType: shim not available");
    return 0;
  }
  /**
   * Reset/clear current selection
   * @param docPtr Document pointer
   */
  resetSelection(docPtr) {
    if (docPtr === 0) throw new Error("Invalid document pointer");
    if (this.useShims && this.module._lok_documentResetSelection) {
      this.module._lok_documentResetSelection(docPtr);
      return;
    }
    this.log("resetSelection: shim not available");
  }
  // ==========================================
  // Mouse and Keyboard Event Methods
  // ==========================================
  /**
   * Post a mouse event to the document
   * @param docPtr Document pointer
   * @param type Event type (LOK_MOUSEEVENT_BUTTONDOWN, BUTTONUP, MOVE)
   * @param x X coordinate in twips
   * @param y Y coordinate in twips
   * @param count Click count (1 for single, 2 for double click)
   * @param buttons Button mask (1=left, 2=middle, 4=right)
   * @param modifier Modifier keys mask
   */
  postMouseEvent(docPtr, type, x, y, count = 1, buttons = 1, modifier = 0) {
    if (docPtr === 0) throw new Error("Invalid document pointer");
    if (this.useShims && this.module._lok_documentPostMouseEvent) {
      this.module._lok_documentPostMouseEvent(docPtr, type, x, y, count, buttons, modifier);
      return;
    }
    this.log("postMouseEvent: shim not available");
  }
  /**
   * Post a keyboard event to the document
   * @param docPtr Document pointer
   * @param type Event type (LOK_KEYEVENT_KEYINPUT, KEYUP)
   * @param charCode Character code
   * @param keyCode Key code
   */
  postKeyEvent(docPtr, type, charCode, keyCode) {
    if (docPtr === 0) throw new Error("Invalid document pointer");
    if (this.useShims && this.module._lok_documentPostKeyEvent) {
      this.module._lok_documentPostKeyEvent(docPtr, type, charCode, keyCode);
      return;
    }
    this.log("postKeyEvent: shim not available");
  }
  // ==========================================
  // UNO Command Methods
  // ==========================================
  /**
   * Execute a UNO command
   * @param docPtr Document pointer
   * @param command UNO command (e.g., '.uno:SelectAll', '.uno:Copy')
   * @param args JSON arguments string
   * @param notifyWhenFinished Whether to notify when command completes
   */
  postUnoCommand(docPtr, command, args = "{}", notifyWhenFinished = false) {
    if (docPtr === 0) throw new Error("Invalid document pointer");
    if (this.useShims && this.module._lok_documentPostUnoCommand) {
      const cmdPtr = this.allocString(command);
      const argsPtr = this.allocString(args);
      try {
        this.module._lok_documentPostUnoCommand(docPtr, cmdPtr, argsPtr, notifyWhenFinished ? 1 : 0);
      } finally {
        this.module._free(cmdPtr);
        this.module._free(argsPtr);
      }
      return;
    }
    this.log("postUnoCommand: shim not available");
  }
  /**
   * Get command values (query document state)
   * @param docPtr Document pointer
   * @param command Command to query (e.g., '.uno:CharFontName')
   * @returns JSON string with command values
   */
  getCommandValues(docPtr, command) {
    if (docPtr === 0) throw new Error("Invalid document pointer");
    if (this.useShims && this.module._lok_documentGetCommandValues) {
      const cmdPtr = this.allocString(command);
      try {
        const resultPtr = this.module._lok_documentGetCommandValues(docPtr, cmdPtr);
        if (resultPtr === 0) return null;
        const result = this.readString(resultPtr);
        this.module._free(resultPtr);
        return result;
      } finally {
        this.module._free(cmdPtr);
      }
    }
    this.log("getCommandValues: shim not available");
    return null;
  }
  // ==========================================
  // Page/Part Information Methods
  // ==========================================
  /**
   * Get bounding rectangles for all pages
   * @param docPtr Document pointer
   * @returns String with rectangles "x,y,width,height;x,y,width,height;..."
   */
  getPartPageRectangles(docPtr) {
    this.log(`getPartPageRectangles called with docPtr: ${docPtr}`);
    if (docPtr === 0) throw new Error("Invalid document pointer");
    if (this.useShims && this.module._lok_documentGetPartPageRectangles) {
      this.log("getPartPageRectangles: using shim");
      const resultPtr = this.module._lok_documentGetPartPageRectangles(docPtr);
      this.log(`getPartPageRectangles: resultPtr=${resultPtr}`);
      if (resultPtr === 0) return null;
      const result = this.readString(resultPtr);
      this.log(`getPartPageRectangles: result="${result?.slice(0, 100)}..."`);
      this.module._free(resultPtr);
      return result;
    }
    this.log("getPartPageRectangles: shim not available");
    return null;
  }
  /**
   * Get information about a page/slide
   * @param docPtr Document pointer
   * @param part Part index
   * @returns JSON string with part info
   */
  getPartInfo(docPtr, part) {
    if (docPtr === 0) throw new Error("Invalid document pointer");
    if (this.useShims && this.module._lok_documentGetPartInfo) {
      const resultPtr = this.module._lok_documentGetPartInfo(docPtr, part);
      if (resultPtr === 0) return null;
      const result = this.readString(resultPtr);
      this.module._free(resultPtr);
      return result;
    }
    this.log("getPartInfo: shim not available");
    return null;
  }
  /**
   * Get name of a page/slide
   * @param docPtr Document pointer
   * @param part Part index
   * @returns Part name
   */
  getPartName(docPtr, part) {
    if (docPtr === 0) throw new Error("Invalid document pointer");
    if (this.useShims && this.module._lok_documentGetPartName) {
      const resultPtr = this.module._lok_documentGetPartName(docPtr, part);
      if (resultPtr === 0) return null;
      const result = this.readString(resultPtr);
      this.module._free(resultPtr);
      return result;
    }
    this.log("getPartName: shim not available");
    return null;
  }
  // ==========================================
  // Clipboard Methods
  // ==========================================
  /**
   * Paste content at current cursor position
   * @param docPtr Document pointer
   * @param mimeType MIME type of data
   * @param data Data to paste
   * @returns true if successful
   */
  paste(docPtr, mimeType, data) {
    if (docPtr === 0) throw new Error("Invalid document pointer");
    if (this.useShims && this.module._lok_documentPaste) {
      const mimePtr = this.allocString(mimeType);
      let dataPtr;
      let dataSize;
      if (typeof data === "string") {
        const bytes = new TextEncoder().encode(data);
        dataSize = bytes.length;
        dataPtr = this.module._malloc(dataSize);
        this.HEAPU8.set(bytes, dataPtr);
      } else {
        dataSize = data.length;
        dataPtr = this.module._malloc(dataSize);
        this.HEAPU8.set(data, dataPtr);
      }
      try {
        return this.module._lok_documentPaste(docPtr, mimePtr, dataPtr, dataSize) !== 0;
      } finally {
        this.module._free(mimePtr);
        this.module._free(dataPtr);
      }
    }
    this.log("paste: shim not available");
    return false;
  }
  // ==========================================
  // View and Zoom Methods
  // ==========================================
  /**
   * Set client zoom level
   * @param docPtr Document pointer
   * @param tilePixelWidth Tile width in pixels
   * @param tilePixelHeight Tile height in pixels
   * @param tileTwipWidth Tile width in twips
   * @param tileTwipHeight Tile height in twips
   */
  setClientZoom(docPtr, tilePixelWidth, tilePixelHeight, tileTwipWidth, tileTwipHeight) {
    if (docPtr === 0) throw new Error("Invalid document pointer");
    if (this.useShims && this.module._lok_documentSetClientZoom) {
      this.module._lok_documentSetClientZoom(docPtr, tilePixelWidth, tilePixelHeight, tileTwipWidth, tileTwipHeight);
      return;
    }
    this.log("setClientZoom: shim not available");
  }
  /**
   * Set visible area for the client
   * @param docPtr Document pointer
   * @param x X position in twips
   * @param y Y position in twips
   * @param width Width in twips
   * @param height Height in twips
   */
  setClientVisibleArea(docPtr, x, y, width, height) {
    if (docPtr === 0) throw new Error("Invalid document pointer");
    if (this.useShims && this.module._lok_documentSetClientVisibleArea) {
      this.module._lok_documentSetClientVisibleArea(docPtr, x, y, width, height);
      return;
    }
    this.log("setClientVisibleArea: shim not available");
  }
  // ==========================================
  // Accessibility Methods
  // ==========================================
  /**
   * Get the currently focused paragraph text
   * @param docPtr Document pointer
   * @returns Focused paragraph text
   */
  getA11yFocusedParagraph(docPtr) {
    if (docPtr === 0) throw new Error("Invalid document pointer");
    if (this.useShims && this.module._lok_documentGetA11yFocusedParagraph) {
      const resultPtr = this.module._lok_documentGetA11yFocusedParagraph(docPtr);
      if (resultPtr === 0) return null;
      const result = this.readString(resultPtr);
      this.module._free(resultPtr);
      return result;
    }
    this.log("getA11yFocusedParagraph: shim not available");
    return null;
  }
  /**
   * Get caret position in focused paragraph
   * @param docPtr Document pointer
   * @returns Caret position or -1
   */
  getA11yCaretPosition(docPtr) {
    if (docPtr === 0) throw new Error("Invalid document pointer");
    if (this.useShims && this.module._lok_documentGetA11yCaretPosition) {
      return this.module._lok_documentGetA11yCaretPosition(docPtr);
    }
    this.log("getA11yCaretPosition: shim not available");
    return -1;
  }
  /**
   * Enable/disable accessibility features
   * @param docPtr Document pointer
   * @param viewId View ID
   * @param enabled Whether to enable accessibility
   */
  setAccessibilityState(docPtr, viewId, enabled) {
    if (docPtr === 0) throw new Error("Invalid document pointer");
    if (this.useShims && this.module._lok_documentSetAccessibilityState) {
      this.module._lok_documentSetAccessibilityState(docPtr, viewId, enabled ? 1 : 0);
      return;
    }
    this.log("setAccessibilityState: shim not available");
  }
  // ==========================================
  // Spreadsheet-Specific Methods
  // ==========================================
  /**
   * Get data area for a spreadsheet (last used row/column)
   * @param docPtr Document pointer
   * @param part Sheet index
   * @returns Object with col and row counts
   */
  getDataArea(docPtr, part) {
    if (docPtr === 0) throw new Error("Invalid document pointer");
    if (this.useShims && this.module._lok_documentGetDataArea) {
      const colPtr = this.module._malloc(8);
      const rowPtr = this.module._malloc(8);
      try {
        this.module._lok_documentGetDataArea(docPtr, part, colPtr, rowPtr);
        const col = this.HEAP32[colPtr >> 2] ?? 0;
        const row = this.HEAP32[rowPtr >> 2] ?? 0;
        return { col, row };
      } finally {
        this.module._free(colPtr);
        this.module._free(rowPtr);
      }
    }
    this.log("getDataArea: shim not available");
    return { col: 0, row: 0 };
  }
  // ==========================================
  // Edit Mode Methods
  // ==========================================
  /**
   * Get current edit mode
   * @param docPtr Document pointer
   * @returns Edit mode value
   */
  getEditMode(docPtr) {
    if (docPtr === 0) throw new Error("Invalid document pointer");
    if (this.useShims && this.module._lok_documentGetEditMode) {
      return this.module._lok_documentGetEditMode(docPtr);
    }
    this.log("getEditMode: shim not available");
    return 0;
  }
  /**
   * Set edit mode for the document
   * @param docPtr Document pointer
   * @param mode 0 for view mode, 1 for edit mode
   */
  setEditMode(docPtr, mode) {
    if (docPtr === 0) throw new Error("Invalid document pointer");
    if (this.useShims && this.module._lok_documentSetEditMode) {
      this.log(`setEditMode: setting mode to ${mode}`);
      this.module._lok_documentSetEditMode(docPtr, mode);
      return;
    }
    this.log("setEditMode: shim not available");
  }
  // ==========================================
  // View Management Methods
  // ==========================================
  /**
   * Create a new view for the document
   * @param docPtr Document pointer
   * @returns View ID
   */
  createView(docPtr) {
    if (docPtr === 0) throw new Error("Invalid document pointer");
    if (this.useShims && this.module._lok_documentCreateView) {
      const viewId = this.module._lok_documentCreateView(docPtr);
      this.log(`createView: created view ${viewId}`);
      return viewId;
    }
    this.log("createView: shim not available");
    return -1;
  }
  /**
   * Create a new view with options
   * @param docPtr Document pointer
   * @param options Options string (JSON)
   * @returns View ID
   */
  createViewWithOptions(docPtr, options) {
    if (docPtr === 0) throw new Error("Invalid document pointer");
    if (this.useShims && this.module._lok_documentCreateViewWithOptions) {
      const optionsPtr = this.allocString(options);
      try {
        const viewId = this.module._lok_documentCreateViewWithOptions(docPtr, optionsPtr);
        this.log(`createViewWithOptions: created view ${viewId}`);
        return viewId;
      } finally {
        this.module._free(optionsPtr);
      }
    }
    this.log("createViewWithOptions: shim not available");
    return -1;
  }
  /**
   * Destroy a view
   * @param docPtr Document pointer
   * @param viewId View ID to destroy
   */
  destroyView(docPtr, viewId) {
    if (docPtr === 0) throw new Error("Invalid document pointer");
    if (this.useShims && this.module._lok_documentDestroyView) {
      this.log(`destroyView: destroying view ${viewId}`);
      this.module._lok_documentDestroyView(docPtr, viewId);
      return;
    }
    this.log("destroyView: shim not available");
  }
  /**
   * Set the current active view
   * @param docPtr Document pointer
   * @param viewId View ID to make active
   */
  setView(docPtr, viewId) {
    if (docPtr === 0) throw new Error("Invalid document pointer");
    if (this.useShims && this.module._lok_documentSetView) {
      this.log(`setView: setting active view to ${viewId}`);
      this.module._lok_documentSetView(docPtr, viewId);
      return;
    }
    this.log("setView: shim not available");
  }
  /**
   * Get the current active view ID
   * @param docPtr Document pointer
   * @returns Current view ID
   */
  getView(docPtr) {
    if (docPtr === 0) throw new Error("Invalid document pointer");
    if (this.useShims && this.module._lok_documentGetView) {
      return this.module._lok_documentGetView(docPtr);
    }
    this.log("getView: shim not available");
    return -1;
  }
  /**
   * Get the number of views
   * @param docPtr Document pointer
   * @returns Number of views
   */
  getViewsCount(docPtr) {
    if (docPtr === 0) throw new Error("Invalid document pointer");
    if (this.useShims && this.module._lok_documentGetViewsCount) {
      return this.module._lok_documentGetViewsCount(docPtr);
    }
    this.log("getViewsCount: shim not available");
    return 0;
  }
  // ==========================================
  // Event Loop and Callback Methods
  // ==========================================
  /**
   * Enable synchronous event dispatch (Unipoll mode).
   * This must be called before using postKeyEvent, postMouseEvent, etc.
   * to ensure events are processed immediately instead of being queued.
   *
   * Without this, events posted via postKeyEvent/postMouseEvent are queued
   * via Application::PostUserEvent() and never processed in headless mode.
   */
  enableSyncEvents() {
    if (this.useShims && this.module._lok_enableSyncEvents) {
      this.module._lok_enableSyncEvents();
      this.log("enableSyncEvents: Unipoll mode enabled");
    } else {
      this.log("enableSyncEvents: shim not available");
    }
  }
  /**
   * Disable synchronous event dispatch.
   * Call this when done with event-based operations.
   */
  disableSyncEvents() {
    if (this.useShims && this.module._lok_disableSyncEvents) {
      this.module._lok_disableSyncEvents();
      this.log("disableSyncEvents: Unipoll mode disabled");
    } else {
      this.log("disableSyncEvents: shim not available");
    }
  }
  // ==========================================
  // Callback Queue Methods
  // ==========================================
  /**
   * Register a callback handler for the document.
   * Events are queued and can be retrieved via pollCallback().
   * @param docPtr Document pointer
   */
  registerCallback(docPtr) {
    if (docPtr === 0) throw new Error("Invalid document pointer");
    if (this.useShims && this.module._lok_documentRegisterCallback) {
      this.module._lok_documentRegisterCallback(docPtr);
      this.log("registerCallback: callback registered");
    } else {
      this.log("registerCallback: shim not available");
    }
  }
  /**
   * Unregister the callback handler for the document.
   * @param docPtr Document pointer
   */
  unregisterCallback(docPtr) {
    if (docPtr === 0) throw new Error("Invalid document pointer");
    if (this.useShims && this.module._lok_documentUnregisterCallback) {
      this.module._lok_documentUnregisterCallback(docPtr);
      this.log("unregisterCallback: callback unregistered");
    } else {
      this.log("unregisterCallback: shim not available");
    }
  }
  /**
   * Check if there are any pending callback events.
   * @returns true if events are pending
   */
  hasCallbackEvents() {
    if (this.useShims && this.module._lok_hasCallbackEvents) {
      return this.module._lok_hasCallbackEvents() !== 0;
    }
    return false;
  }
  /**
   * Get the number of pending callback events.
   * @returns Number of events in the queue
   */
  getCallbackEventCount() {
    if (this.useShims && this.module._lok_getCallbackEventCount) {
      return this.module._lok_getCallbackEventCount();
    }
    return 0;
  }
  /**
   * Poll and retrieve the next callback event from the queue.
   * @returns The next event, or null if queue is empty
   */
  pollCallback() {
    if (!this.useShims || !this.module._lok_pollCallback) {
      return null;
    }
    const bufferSize = 4096;
    const payloadBuffer = this.module._malloc(bufferSize);
    const payloadLengthPtr = this.module._malloc(4);
    try {
      const eventType = this.module._lok_pollCallback(payloadBuffer, bufferSize, payloadLengthPtr);
      if (eventType === -1) {
        return null;
      }
      const payloadLength = this.module.HEAP32[payloadLengthPtr >> 2] ?? 0;
      let payload = "";
      if (payloadLength > 0) {
        const len = Math.min(payloadLength, bufferSize - 1);
        const bytes = this.module.HEAPU8.slice(payloadBuffer, payloadBuffer + len);
        payload = textDecoder.decode(bytes);
      }
      return {
        type: eventType,
        typeName: getCallbackTypeName(eventType),
        payload
      };
    } finally {
      this.module._free(payloadBuffer);
      this.module._free(payloadLengthPtr);
    }
  }
  /**
   * Poll all pending callback events.
   * @returns Array of all pending events
   */
  pollAllCallbacks() {
    const events = [];
    let event = this.pollCallback();
    while (event !== null) {
      events.push(event);
      event = this.pollCallback();
    }
    return events;
  }
  /**
   * Clear all pending callback events.
   */
  clearCallbackQueue() {
    if (this.useShims && this.module._lok_clearCallbackQueue) {
      this.module._lok_clearCallbackQueue();
      this.log("clearCallbackQueue: queue cleared");
    }
  }
  /**
   * Force flush pending LOK callbacks for a document.
   * This is needed in WASM because callbacks are queued via PostUserEvent
   * but the event loop doesn't run automatically.
   * Call this after operations that trigger callbacks (e.g., postUnoCommand)
   * to ensure the callback queue is populated.
   * @param docPtr Document pointer
   */
  flushCallbacks(docPtr) {
    if (docPtr === 0) throw new Error("Invalid document pointer");
    const hasShim = !!this.module._lok_flushCallbacks;
    this.log(`flushCallbacks: useShims=${this.useShims}, _lok_flushCallbacks exists=${hasShim}`);
    if (this.useShims && this.module._lok_flushCallbacks) {
      this.module._lok_flushCallbacks(docPtr);
      this.log("flushCallbacks: callbacks flushed");
    } else {
      this.log("flushCallbacks: shim not available");
    }
  }
  /**
   * Poll for STATE_CHANGED callbacks and parse them into a map.
   * STATE_CHANGED payloads are in format: ".uno:CommandName=value"
   * @returns Map of command names to values
   */
  pollStateChanges() {
    const states = /* @__PURE__ */ new Map();
    const events = this.pollAllCallbacks();
    for (const event of events) {
      if (event.type === LOK_CALLBACK_STATE_CHANGED) {
        const eqIndex = event.payload.indexOf("=");
        if (eqIndex !== -1) {
          const key = event.payload.substring(0, eqIndex);
          const value = event.payload.substring(eqIndex + 1);
          states.set(key, value);
        } else {
          states.set(event.payload, "");
        }
      }
    }
    return states;
  }
  // ==========================================
  // High-Level Convenience Methods
  // ==========================================
  /**
   * Click at a position and get text at that location
   * @param docPtr Document pointer
   * @param x X coordinate in twips
   * @param y Y coordinate in twips
   * @returns Text at the clicked position
   */
  clickAndGetText(docPtr, x, y) {
    this.postMouseEvent(docPtr, LOK_MOUSEEVENT_BUTTONDOWN, x, y, 1, 1, 0);
    this.postMouseEvent(docPtr, LOK_MOUSEEVENT_BUTTONUP, x, y, 1, 1, 0);
    return this.getTextSelection(docPtr, "text/plain;charset=utf-8");
  }
  /**
   * Double-click to select a word and get it
   * @param docPtr Document pointer
   * @param x X coordinate in twips
   * @param y Y coordinate in twips
   * @returns Selected word
   */
  doubleClickAndGetWord(docPtr, x, y) {
    this.postMouseEvent(docPtr, LOK_MOUSEEVENT_BUTTONDOWN, x, y, 2, 1, 0);
    this.postMouseEvent(docPtr, LOK_MOUSEEVENT_BUTTONUP, x, y, 2, 1, 0);
    return this.getTextSelection(docPtr, "text/plain;charset=utf-8");
  }
  /**
   * Select all content in the document
   * @param docPtr Document pointer
   */
  selectAll(docPtr) {
    this.postUnoCommand(docPtr, ".uno:SelectAll");
  }
  /**
   * Get all text content from the document
   * @param docPtr Document pointer
   * @returns All text content
   */
  getAllText(docPtr) {
    this.log(`getAllText called with docPtr: ${docPtr}`);
    this.selectAll(docPtr);
    const text = this.getTextSelection(docPtr, "text/plain;charset=utf-8");
    this.log(`getAllText: text="${text?.slice(0, 100)}..."`);
    this.resetSelection(docPtr);
    return text;
  }
  /**
   * Parse page rectangles string into array of objects
   * @param rectanglesStr String from getPartPageRectangles
   * @returns Array of rectangle objects
   */
  parsePageRectangles(rectanglesStr) {
    if (!rectanglesStr) return [];
    return rectanglesStr.split(";").filter((s) => s.trim()).map((rect) => {
      const parts = rect.split(",").map(Number);
      return {
        x: parts[0] ?? 0,
        y: parts[1] ?? 0,
        width: parts[2] ?? 0,
        height: parts[3] ?? 0
      };
    });
  }
};

// src/converter-node.ts
var LibreOfficeConverter = class {
  module = null;
  lokBindings = null;
  initialized = false;
  initializing = false;
  options;
  corrupted = false;
  fsTracked = false;
  constructor(options = {}) {
    this.options = {
      wasmPath: "./wasm",
      verbose: false,
      ...options
    };
  }
  /**
   * Check if an error indicates LOK corruption requiring reinitialization
   */
  isCorruptionError(error) {
    const msg = error instanceof Error ? error.message : error;
    return msg.includes("memory access out of bounds") || msg.includes("ComponentContext is not avail") || msg.includes("unreachable") || msg.includes("table index is out of bounds") || msg.includes("null function");
  }
  /**
   * Force reinitialization of the converter (for recovery from errors)
   */
  async reinitialize() {
    if (this.options.verbose) {
      console.log("[LibreOfficeConverter] Reinitializing due to corruption...");
    }
    if (this.lokBindings) {
      try {
        this.lokBindings.destroy();
      } catch {
      }
      this.lokBindings = null;
    }
    this.module = null;
    this.initialized = false;
    this.corrupted = false;
    await this.initialize();
  }
  /**
   * Initialize with a pre-loaded Emscripten module
   * This is useful for environments like Web Workers that have their own
   * WASM loading mechanism (e.g., importScripts with progress tracking)
   */
  async initializeWithModule(module) {
    if (this.initialized) {
      return;
    }
    if (this.initializing) {
      while (this.initializing) {
        await new Promise((resolve3) => setTimeout(resolve3, 100));
      }
      return;
    }
    this.initializing = true;
    try {
      this.module = module;
      this.setupFileSystem();
      this.initializeLibreOfficeKit();
      this.initialized = true;
      this.options.onReady?.();
    } catch (error) {
      console.error("[LibreOfficeConverter] Initialization error:", error);
      const convError = error instanceof ConversionError ? error : new ConversionError(
        "WASM_NOT_INITIALIZED" /* WASM_NOT_INITIALIZED */,
        `Failed to initialize with module: ${String(error)}`
      );
      this.options.onError?.(convError);
      throw convError;
    } finally {
      this.initializing = false;
    }
  }
  /**
   * Initialize the LibreOffice WASM module
   */
  async initialize() {
    if (this.initialized) {
      return;
    }
    if (this.initializing) {
      while (this.initializing) {
        await new Promise((resolve3) => setTimeout(resolve3, 100));
      }
      return;
    }
    this.initializing = true;
    this.emitProgress("loading", 0, "Loading LibreOffice WASM module...");
    try {
      this.module = await this.loadModule();
      this.emitProgress("initializing", 50, "Setting up virtual filesystem...");
      this.setupFileSystem();
      this.emitProgress("initializing", 60, "Initializing LibreOfficeKit...");
      this.initializeLibreOfficeKit();
      this.emitProgress("initializing", 90, "LibreOfficeKit ready");
      this.initialized = true;
      this.emitProgress("complete", 100, "LibreOffice ready");
      this.options.onReady?.();
    } catch (error) {
      console.error("[LibreOfficeConverter] Initialization error:", error);
      const convError = error instanceof ConversionError ? error : new ConversionError(
        "WASM_NOT_INITIALIZED" /* WASM_NOT_INITIALIZED */,
        `Failed to initialize WASM module: ${String(error)}`
      );
      this.options.onError?.(convError);
      throw convError;
    } finally {
      this.initializing = false;
    }
  }
  /**
   * Load the Emscripten WASM module (Node.js only)
   * Requires wasmLoader option to be provided for bundler compatibility
   */
  async loadModule() {
    console.log("[LibreOfficeConverter] Loading WASM module...", this.options.wasmPath, this.options.workerPath, this.options.wasmLoader);
    if (!this.options.wasmLoader) {
      throw new ConversionError(
        "WASM_NOT_INITIALIZED" /* WASM_NOT_INITIALIZED */,
        'wasmLoader option is required. Import the loader and pass it:\n  import wasmLoader from "@matbee/libreoffice-converter/wasm/loader.cjs";\n  new LibreOfficeConverter({ wasmLoader })'
      );
    }
    const config = {
      verbose: this.options.verbose,
      print: this.options.verbose ? console.log : () => {
      },
      printErr: this.options.verbose ? console.error : () => {
      },
      onProgress: (_phase, percent, message) => {
        this.emitProgress("loading", percent, message);
      }
    };
    return await this.options.wasmLoader.createModule(config);
  }
  /**
   * Set up the virtual filesystem
   */
  setupFileSystem() {
    if (!this.module?.FS) {
      throw new ConversionError(
        "WASM_NOT_INITIALIZED" /* WASM_NOT_INITIALIZED */,
        "Filesystem not available"
      );
    }
    const emFs = this.module.FS;
    const tryMkdir = (dirPath) => {
      try {
        emFs.mkdir(dirPath);
      } catch {
      }
    };
    tryMkdir("/tmp");
    tryMkdir("/tmp/input");
    tryMkdir("/tmp/output");
  }
  /**
   * Initialize LibreOfficeKit
   */
  initializeLibreOfficeKit() {
    if (!this.module) {
      throw new ConversionError(
        "WASM_NOT_INITIALIZED" /* WASM_NOT_INITIALIZED */,
        "Module not loaded"
      );
    }
    if (this.options.verbose && this.module.FS) {
      const emFs2 = this.module.FS;
      if (!this.fsTracked) {
        this.fsTracked = true;
        if (!emFs2.trackingDelegate) {
          emFs2.trackingDelegate = {
            onOpen: (filePath) => {
              console.log("[FS OPEN]", filePath);
            },
            onOpenFile: (filePath) => {
              console.log("[FS OPEN FILE]", filePath);
            }
          };
        }
        if (typeof emFs2.open === "function") {
          const originalOpen = emFs2.open.bind(emFs2);
          emFs2.open = ((filePath, flags, mode) => {
            console.log("[FS OPEN CALL]", filePath);
            try {
              return originalOpen(filePath, flags, mode);
            } catch (err) {
              const error = err;
              if (error?.code === "ENOENT") {
                console.log("[FS ENOENT]", filePath);
              }
              throw err;
            }
          });
        }
      }
      const logDir = (label, dirPath) => {
        try {
          console.log(`[FS] ${label}:`, emFs2.readdir(dirPath));
        } catch (e) {
          console.log(`[FS] ${label}: ERROR -`, e.message);
        }
      };
      logDir("ROOT", "/");
      logDir("PROGRAM DIR", "/instdir/program");
      logDir("SHARE DIR", "/instdir/share");
      logDir("REGISTRY DIR", "/instdir/share/registry");
      logDir("FILTER DIR", "/instdir/share/filter");
      logDir("CONFIG DIR", "/instdir/share/config/soffice.cfg");
      logDir("CONFIG FILTER", "/instdir/share/config/soffice.cfg/filter");
      logDir("IMPRESS MODULES", "/instdir/share/config/soffice.cfg/modules/simpress");
    }
    const emFs = this.module.FS;
    const createDir = (dirPath) => {
      try {
        emFs.mkdir(dirPath);
        if (this.options.verbose) {
          console.log("[FS] Created directory:", dirPath);
        }
      } catch (e) {
        const err = e;
        if (err.code !== "EEXIST") {
          if (this.options.verbose) {
            console.log("[FS] mkdir failed:", dirPath, e.message);
          }
        }
      }
    };
    createDir("/instdir/user");
    createDir("/instdir/user/temp");
    createDir("/instdir/user/temp/embeddedfonts");
    createDir("/instdir/user/temp/embeddedfonts/fromdocs");
    createDir("/instdir/user/temp/embeddedfonts/fromsystem");
    createDir("/instdir/user/registry");
    createDir("/instdir/user/registry/data");
    this.lokBindings = new LOKBindings(this.module, this.options.verbose);
    try {
      this.lokBindings.initialize("/instdir/program");
      if (this.options.verbose) {
        const versionInfo = this.lokBindings.getVersionInfo();
        if (versionInfo) {
          console.log("[LOK] Version:", versionInfo);
        }
      }
    } catch (error) {
      throw new ConversionError(
        "WASM_NOT_INITIALIZED" /* WASM_NOT_INITIALIZED */,
        `Failed to initialize LibreOfficeKit: ${String(error)}`
      );
    }
  }
  /**
   * Convert a document to a different format
   */
  async convert(input, options, filename = "document") {
    if (this.corrupted) {
      await this.reinitialize();
    }
    if (!this.initialized || !this.module) {
      throw new ConversionError(
        "WASM_NOT_INITIALIZED" /* WASM_NOT_INITIALIZED */,
        "LibreOffice WASM not initialized. Call initialize() first."
      );
    }
    const startTime = Date.now();
    const inputData = this.normalizeInput(input);
    if (inputData.length === 0) {
      throw new ConversionError(
        "INVALID_INPUT" /* INVALID_INPUT */,
        "Empty document provided"
      );
    }
    const inputExt = options.inputFormat || this.getExtensionFromFilename(filename) || "docx";
    const outputExt = options.outputFormat;
    if (!FORMAT_FILTERS[outputExt]) {
      throw new ConversionError(
        "UNSUPPORTED_FORMAT" /* UNSUPPORTED_FORMAT */,
        `Unsupported output format: ${outputExt}`
      );
    }
    if (!isConversionValid(inputExt, outputExt)) {
      throw new ConversionError(
        "UNSUPPORTED_FORMAT" /* UNSUPPORTED_FORMAT */,
        getConversionErrorMessage(inputExt, outputExt)
      );
    }
    const inputPath = `/tmp/input/doc.${inputExt}`;
    const outputPath = `/tmp/output/doc.${outputExt}`;
    try {
      this.emitProgress("converting", 10, "Writing input document...");
      this.module.FS.writeFile(inputPath, inputData);
      this.emitProgress("converting", 30, "Converting document...");
      const result = await this.performConversion(inputPath, outputPath, options);
      this.emitProgress("complete", 100, "Conversion complete");
      const baseName = this.getBasename(filename);
      const outputFilename = `${baseName}.${outputExt}`;
      return {
        data: result,
        mimeType: FORMAT_MIME_TYPES[outputExt],
        filename: outputFilename,
        duration: Date.now() - startTime
      };
    } catch (error) {
      if (error instanceof Error && this.isCorruptionError(error)) {
        this.corrupted = true;
        if (this.options.verbose) {
          console.log("[LibreOfficeConverter] Corruption detected, will reinitialize on next convert");
        }
      }
      throw error;
    } finally {
      try {
        this.module?.FS.unlink(inputPath);
      } catch {
      }
      try {
        this.module?.FS.unlink(outputPath);
      } catch {
      }
    }
  }
  /**
   * Perform the actual conversion using LibreOfficeKit
   */
  async performConversion(inputPath, outputPath, options) {
    if (!this.module || !this.lokBindings) {
      throw new ConversionError(
        "WASM_NOT_INITIALIZED" /* WASM_NOT_INITIALIZED */,
        "Module not loaded"
      );
    }
    this.emitProgress("converting", 40, "Loading document...");
    let docPtr = 0;
    try {
      const loadOptions = buildLoadOptions(options.inputFormat, options.password);
      if (this.options.verbose) {
        try {
          const stat = this.module.FS.stat(inputPath);
          console.log("[Convert] File exists before LOK load:", inputPath, "size:", stat.size);
        } catch (e) {
          console.log("[Convert] File NOT found before LOK load:", inputPath, e.message);
        }
        if (loadOptions) {
          console.log("[Convert] Using load options:", loadOptions);
        }
      }
      if (loadOptions) {
        docPtr = this.lokBindings.documentLoadWithOptions(inputPath, loadOptions);
      } else {
        docPtr = this.lokBindings.documentLoad(inputPath);
      }
      if (docPtr === 0) {
        throw new ConversionError(
          "LOAD_FAILED" /* LOAD_FAILED */,
          "Failed to load document"
        );
      }
      this.emitProgress("converting", 60, "Converting format...");
      const lokFormat = OUTPUT_FORMAT_TO_LOK[options.outputFormat];
      let filterOptions = FORMAT_FILTER_OPTIONS[options.outputFormat] || "";
      if (options.outputFormat === "pdf" && options.pdf) {
        const pdfOpts = [];
        if (options.pdf.pdfaLevel) {
          const levelMap = {
            "PDF/A-1b": 1,
            "PDF/A-2b": 2,
            "PDF/A-3b": 3
          };
          pdfOpts.push(`SelectPdfVersion=${levelMap[options.pdf.pdfaLevel] || 0}`);
        }
        if (options.pdf.quality !== void 0) {
          pdfOpts.push(`Quality=${options.pdf.quality}`);
        }
        if (pdfOpts.length > 0) {
          filterOptions = pdfOpts.join(",");
        }
      }
      if (["png", "jpg", "svg"].includes(options.outputFormat) && options.image?.pageIndex !== void 0) {
        const pageNum = options.image.pageIndex + 1;
        if (filterOptions) {
          filterOptions += `;PageRange=${pageNum}-${pageNum}`;
        } else {
          filterOptions = `PageRange=${pageNum}-${pageNum}`;
        }
      }
      this.emitProgress("converting", 70, "Saving document...");
      this.lokBindings.documentSaveAs(docPtr, outputPath, lokFormat, filterOptions);
      this.emitProgress("converting", 90, "Reading output...");
      try {
        const outputData = this.module.FS.readFile(outputPath);
        if (outputData.length === 0) {
          throw new ConversionError(
            "CONVERSION_FAILED" /* CONVERSION_FAILED */,
            "Conversion produced empty output"
          );
        }
        return outputData;
      } catch (fsError) {
        throw new ConversionError(
          "CONVERSION_FAILED" /* CONVERSION_FAILED */,
          `Failed to read converted file: ${String(fsError)}`
        );
      }
    } catch (error) {
      if (error instanceof ConversionError) {
        throw error;
      }
      throw new ConversionError(
        "CONVERSION_FAILED" /* CONVERSION_FAILED */,
        `Conversion failed: ${String(error)}`
      );
    } finally {
      if (docPtr !== 0 && this.lokBindings) {
        try {
          this.lokBindings.documentDestroy(docPtr);
        } catch {
        }
      }
    }
  }
  /**
   * Render page previews (thumbnails) for a document
   */
  async renderPagePreviews(input, options, renderOptions = {}) {
    if (!this.initialized || !this.module || !this.lokBindings) {
      throw new ConversionError(
        "WASM_NOT_INITIALIZED" /* WASM_NOT_INITIALIZED */,
        "Converter not initialized"
      );
    }
    const data = this.normalizeInput(input);
    const inputFormat = (options.inputFormat || "docx").toLowerCase();
    const width = renderOptions.width ?? 256;
    const height = renderOptions.height ?? 0;
    const pageIndices = renderOptions.pageIndices ?? [];
    const inputPath = `/tmp/preview/doc.${inputFormat}`;
    const emFs = this.module.FS;
    try {
      try {
        emFs.mkdir("/tmp/preview");
      } catch {
      }
      emFs.writeFile(inputPath, data);
      const docPtr = this.lokBindings.documentLoad(inputPath);
      if (docPtr === 0) {
        throw new ConversionError(
          "LOAD_FAILED" /* LOAD_FAILED */,
          "Failed to load document for preview"
        );
      }
      try {
        const numParts = this.lokBindings.documentGetParts(docPtr);
        if (this.options.verbose) {
          console.log(`[Preview] Document has ${numParts} pages/parts`);
        }
        const pagesToRender = pageIndices.length > 0 ? pageIndices.filter((i) => i >= 0 && i < numParts) : Array.from({ length: numParts }, (_, i) => i);
        const results = [];
        const editMode = renderOptions.editMode ?? false;
        for (const pageIndex of pagesToRender) {
          if (this.options.verbose) {
            console.log(`[Preview] Rendering page ${pageIndex + 1}/${numParts}`);
          }
          const preview = this.lokBindings.renderPage(docPtr, pageIndex, width, height, editMode);
          results.push({
            page: pageIndex,
            data: preview.data,
            width: preview.width,
            height: preview.height
          });
        }
        return results;
      } finally {
        this.lokBindings.documentDestroy(docPtr);
      }
    } finally {
      try {
        emFs.unlink(inputPath);
      } catch {
      }
      try {
        emFs.rmdir("/tmp/preview");
      } catch {
      }
    }
  }
  /**
   * Render a page at full quality (native resolution based on DPI)
   */
  async renderPageFullQuality(input, options, pageIndex, renderOptions = {}) {
    if (!this.initialized || !this.module || !this.lokBindings) {
      throw new ConversionError(
        "WASM_NOT_INITIALIZED" /* WASM_NOT_INITIALIZED */,
        "Converter not initialized"
      );
    }
    const data = this.normalizeInput(input);
    const inputFormat = (options.inputFormat || "docx").toLowerCase();
    const dpi = renderOptions.dpi ?? 150;
    const maxDimension = renderOptions.maxDimension;
    const inputPath = `/tmp/fullquality/doc.${inputFormat}`;
    const emFs = this.module.FS;
    try {
      try {
        emFs.mkdir("/tmp/fullquality");
      } catch {
      }
      emFs.writeFile(inputPath, data);
      const docPtr = this.lokBindings.documentLoad(inputPath);
      if (docPtr === 0) {
        throw new ConversionError(
          "LOAD_FAILED" /* LOAD_FAILED */,
          "Failed to load document for full quality render"
        );
      }
      try {
        const numParts = this.lokBindings.documentGetParts(docPtr);
        if (pageIndex < 0 || pageIndex >= numParts) {
          throw new ConversionError(
            "CONVERSION_FAILED" /* CONVERSION_FAILED */,
            `Page index ${pageIndex} out of range (0-${numParts - 1})`
          );
        }
        if (this.options.verbose) {
          console.log(`[FullQuality] Rendering page ${pageIndex + 1}/${numParts} at ${dpi} DPI`);
        }
        const editMode = renderOptions.editMode ?? false;
        const preview = this.lokBindings.renderPageFullQuality(docPtr, pageIndex, dpi, maxDimension, editMode);
        return {
          page: pageIndex,
          data: preview.data,
          width: preview.width,
          height: preview.height,
          dpi: preview.dpi
        };
      } finally {
        this.lokBindings.documentDestroy(docPtr);
      }
    } finally {
      try {
        emFs.unlink(inputPath);
      } catch {
      }
      try {
        emFs.rmdir("/tmp/fullquality");
      } catch {
      }
    }
  }
  /**
   * Get the number of pages/parts in a document
   */
  async getPageCount(input, options) {
    if (!this.initialized || !this.module || !this.lokBindings) {
      throw new ConversionError(
        "WASM_NOT_INITIALIZED" /* WASM_NOT_INITIALIZED */,
        "Converter not initialized"
      );
    }
    const data = this.normalizeInput(input);
    const inputFormat = (options.inputFormat || "docx").toLowerCase();
    const inputPath = `/tmp/pagecount/doc.${inputFormat}`;
    const emFs = this.module.FS;
    try {
      try {
        emFs.mkdir("/tmp/pagecount");
      } catch {
      }
      emFs.writeFile(inputPath, data);
      const docPtr = this.lokBindings.documentLoad(inputPath);
      if (docPtr === 0) {
        throw new ConversionError(
          "LOAD_FAILED" /* LOAD_FAILED */,
          "Failed to load document"
        );
      }
      try {
        return this.lokBindings.documentGetParts(docPtr);
      } finally {
        this.lokBindings.documentDestroy(docPtr);
      }
    } finally {
      try {
        emFs.unlink(inputPath);
      } catch {
      }
      try {
        emFs.rmdir("/tmp/pagecount");
      } catch {
      }
    }
  }
  /**
   * Get valid output formats for a document by loading it and checking its type
   */
  async getDocumentInfo(input, options) {
    if (!this.initialized || !this.module || !this.lokBindings) {
      throw new ConversionError(
        "WASM_NOT_INITIALIZED" /* WASM_NOT_INITIALIZED */,
        "Converter not initialized"
      );
    }
    const data = this.normalizeInput(input);
    const inputFormat = (options.inputFormat || "docx").toLowerCase();
    const inputPath = `/tmp/docinfo/doc.${inputFormat}`;
    const emFs = this.module.FS;
    try {
      try {
        emFs.mkdir("/tmp/docinfo");
      } catch {
      }
      emFs.writeFile(inputPath, data);
      const docPtr = this.lokBindings.documentLoad(inputPath);
      if (docPtr === 0) {
        throw new ConversionError(
          "LOAD_FAILED" /* LOAD_FAILED */,
          "Failed to load document"
        );
      }
      try {
        const docType = this.lokBindings.documentGetDocumentType(docPtr);
        const pageCount = this.lokBindings.documentGetParts(docPtr);
        const validOutputFormats = getOutputFormatsForDocType(docType);
        const docTypeNames = {
          [0 /* TEXT */]: "Text Document",
          [1 /* SPREADSHEET */]: "Spreadsheet",
          [2 /* PRESENTATION */]: "Presentation",
          [3 /* DRAWING */]: "Drawing",
          [4 /* OTHER */]: "Other"
        };
        return {
          documentType: docType,
          documentTypeName: docTypeNames[docType] || "Unknown",
          validOutputFormats,
          pageCount
        };
      } finally {
        this.lokBindings.documentDestroy(docPtr);
      }
    } finally {
      try {
        emFs.unlink(inputPath);
      } catch {
      }
      try {
        emFs.rmdir("/tmp/docinfo");
      } catch {
      }
    }
  }
  // ============================================
  // Document Inspection Methods
  // ============================================
  async getDocumentText(input, options) {
    if (!this.initialized || !this.module || !this.lokBindings) {
      throw new ConversionError(
        "WASM_NOT_INITIALIZED" /* WASM_NOT_INITIALIZED */,
        "Converter not initialized"
      );
    }
    const data = this.normalizeInput(input);
    const inputFormat = options.inputFormat?.toLowerCase();
    if (!inputFormat) {
      throw new ConversionError(
        "INVALID_INPUT" /* INVALID_INPUT */,
        "Input format is required"
      );
    }
    const inputPath = `/tmp/inspect/doc.${inputFormat}`;
    const emFs = this.module.FS;
    try {
      try {
        emFs.mkdir("/tmp/inspect");
      } catch {
      }
      emFs.writeFile(inputPath, data);
      const docPtr = this.lokBindings.documentLoad(inputPath);
      if (docPtr === 0) {
        throw new ConversionError(
          "LOAD_FAILED" /* LOAD_FAILED */,
          "Failed to load document"
        );
      }
      try {
        return this.lokBindings.getAllText(docPtr);
      } finally {
        this.lokBindings.documentDestroy(docPtr);
      }
    } finally {
      try {
        emFs.unlink(inputPath);
      } catch {
      }
      try {
        emFs.rmdir("/tmp/inspect");
      } catch {
      }
    }
  }
  async getPageNames(input, options) {
    if (!this.initialized || !this.module || !this.lokBindings) {
      throw new ConversionError(
        "WASM_NOT_INITIALIZED" /* WASM_NOT_INITIALIZED */,
        "Converter not initialized"
      );
    }
    const data = this.normalizeInput(input);
    const inputFormat = options.inputFormat?.toLowerCase();
    if (!inputFormat) {
      throw new ConversionError(
        "INVALID_INPUT" /* INVALID_INPUT */,
        "Input format is required"
      );
    }
    const inputPath = `/tmp/names/doc.${inputFormat}`;
    const emFs = this.module.FS;
    try {
      try {
        emFs.mkdir("/tmp/names");
      } catch {
      }
      emFs.writeFile(inputPath, data);
      const docPtr = this.lokBindings.documentLoad(inputPath);
      if (docPtr === 0) {
        throw new ConversionError(
          "LOAD_FAILED" /* LOAD_FAILED */,
          "Failed to load document"
        );
      }
      try {
        const numParts = this.lokBindings.documentGetParts(docPtr);
        const names = [];
        for (let i = 0; i < numParts; i++) {
          const name = this.lokBindings.getPartName(docPtr, i);
          names.push(name || `Page ${i + 1}`);
        }
        return names;
      } finally {
        this.lokBindings.documentDestroy(docPtr);
      }
    } finally {
      try {
        emFs.unlink(inputPath);
      } catch {
      }
      try {
        emFs.rmdir("/tmp/names");
      } catch {
      }
    }
  }
  async getPageRectangles(input, options) {
    if (!this.initialized || !this.module || !this.lokBindings) {
      throw new ConversionError(
        "WASM_NOT_INITIALIZED" /* WASM_NOT_INITIALIZED */,
        "Converter not initialized"
      );
    }
    const data = this.normalizeInput(input);
    const inputFormat = options.inputFormat?.toLowerCase();
    if (!inputFormat) {
      throw new ConversionError(
        "INVALID_INPUT" /* INVALID_INPUT */,
        "Input format is required"
      );
    }
    const inputPath = `/tmp/rects/doc.${inputFormat}`;
    const emFs = this.module.FS;
    try {
      try {
        emFs.mkdir("/tmp/rects");
      } catch {
      }
      emFs.writeFile(inputPath, data);
      const docPtr = this.lokBindings.documentLoad(inputPath);
      if (docPtr === 0) {
        throw new ConversionError(
          "LOAD_FAILED" /* LOAD_FAILED */,
          "Failed to load document"
        );
      }
      try {
        const rectsStr = this.lokBindings.getPartPageRectangles(docPtr);
        return this.lokBindings.parsePageRectangles(rectsStr || "");
      } finally {
        this.lokBindings.documentDestroy(docPtr);
      }
    } finally {
      try {
        emFs.unlink(inputPath);
      } catch {
      }
      try {
        emFs.rmdir("/tmp/rects");
      } catch {
      }
    }
  }
  async getSpreadsheetDataArea(input, options, sheetIndex = 0) {
    if (!this.initialized || !this.module || !this.lokBindings) {
      throw new ConversionError(
        "WASM_NOT_INITIALIZED" /* WASM_NOT_INITIALIZED */,
        "Converter not initialized"
      );
    }
    const data = this.normalizeInput(input);
    const inputFormat = options.inputFormat?.toLowerCase();
    if (!inputFormat) {
      throw new ConversionError(
        "INVALID_INPUT" /* INVALID_INPUT */,
        "Input format is required"
      );
    }
    const inputPath = `/tmp/dataarea/doc.${inputFormat}`;
    const emFs = this.module.FS;
    try {
      try {
        emFs.mkdir("/tmp/dataarea");
      } catch {
      }
      emFs.writeFile(inputPath, data);
      const docPtr = this.lokBindings.documentLoad(inputPath);
      if (docPtr === 0) {
        throw new ConversionError(
          "LOAD_FAILED" /* LOAD_FAILED */,
          "Failed to load document"
        );
      }
      try {
        return this.lokBindings.getDataArea(docPtr, sheetIndex);
      } finally {
        this.lokBindings.documentDestroy(docPtr);
      }
    } finally {
      try {
        emFs.unlink(inputPath);
      } catch {
      }
      try {
        emFs.rmdir("/tmp/dataarea");
      } catch {
      }
    }
  }
  async executeUnoCommand(input, options, command, args = "{}") {
    if (!this.initialized || !this.module || !this.lokBindings) {
      throw new ConversionError(
        "WASM_NOT_INITIALIZED" /* WASM_NOT_INITIALIZED */,
        "Converter not initialized"
      );
    }
    const data = this.normalizeInput(input);
    const inputFormat = options.inputFormat?.toLowerCase();
    if (!inputFormat) {
      throw new ConversionError(
        "INVALID_INPUT" /* INVALID_INPUT */,
        "Input format is required"
      );
    }
    const inputPath = `/tmp/uno/doc.${inputFormat}`;
    const emFs = this.module.FS;
    try {
      try {
        emFs.mkdir("/tmp/uno");
      } catch {
      }
      emFs.writeFile(inputPath, data);
      const docPtr = this.lokBindings.documentLoad(inputPath);
      if (docPtr === 0) {
        throw new ConversionError(
          "LOAD_FAILED" /* LOAD_FAILED */,
          "Failed to load document"
        );
      }
      try {
        this.lokBindings.postUnoCommand(docPtr, command, args);
      } finally {
        this.lokBindings.documentDestroy(docPtr);
      }
    } finally {
      try {
        emFs.unlink(inputPath);
      } catch {
      }
      try {
        emFs.rmdir("/tmp/uno");
      } catch {
      }
    }
  }
  // ============================================
  // ILibreOfficeConverter Interface Methods
  // ============================================
  async renderPage(input, options, pageIndex, width, height = 0) {
    if (!this.initialized || !this.module || !this.lokBindings) {
      throw new ConversionError(
        "WASM_NOT_INITIALIZED" /* WASM_NOT_INITIALIZED */,
        "Converter not initialized"
      );
    }
    const data = this.normalizeInput(input);
    const inputFormat = (options.inputFormat || "docx").toLowerCase();
    const inputPath = `/tmp/renderpage/doc.${inputFormat}`;
    const emFs = this.module.FS;
    try {
      try {
        emFs.mkdir("/tmp/renderpage");
      } catch {
      }
      emFs.writeFile(inputPath, data);
      const docPtr = this.lokBindings.documentLoad(inputPath);
      if (docPtr === 0) {
        throw new ConversionError(
          "LOAD_FAILED" /* LOAD_FAILED */,
          "Failed to load document"
        );
      }
      try {
        const preview = this.lokBindings.renderPage(docPtr, pageIndex, width, height);
        return {
          page: pageIndex,
          data: preview.data,
          width: preview.width,
          height: preview.height
        };
      } finally {
        this.lokBindings.documentDestroy(docPtr);
      }
    } finally {
      try {
        emFs.unlink(inputPath);
      } catch {
      }
      try {
        emFs.rmdir("/tmp/renderpage");
      } catch {
      }
    }
  }
  openDocument(_input, _options) {
    return Promise.reject(new ConversionError(
      "CONVERSION_FAILED" /* CONVERSION_FAILED */,
      "Editor sessions not supported by LibreOfficeConverter. Use WorkerConverter or WorkerBrowserConverter."
    ));
  }
  editorOperation(_sessionId, _method, _args) {
    return Promise.reject(new ConversionError(
      "CONVERSION_FAILED" /* CONVERSION_FAILED */,
      "Editor operations not supported by LibreOfficeConverter. Use WorkerConverter or WorkerBrowserConverter."
    ));
  }
  closeDocument(_sessionId) {
    return Promise.reject(new ConversionError(
      "CONVERSION_FAILED" /* CONVERSION_FAILED */,
      "Editor sessions not supported by LibreOfficeConverter. Use WorkerConverter or WorkerBrowserConverter."
    ));
  }
  getLokBindings() {
    return this.lokBindings;
  }
  destroy() {
    if (this.lokBindings) {
      try {
        this.lokBindings.destroy();
      } catch {
      }
      this.lokBindings = null;
    }
    if (this.module) {
      try {
        const mod = this.module;
        if (mod.PThread?.terminateAllThreads) {
          mod.PThread.terminateAllThreads();
        }
        if (mod.PThread?.runningWorkers) {
          for (const worker of mod.PThread.runningWorkers) {
            if (worker?.unref) {
              worker.unref();
            }
            if (worker?.terminate) {
              worker.terminate();
            }
          }
          mod.PThread.runningWorkers = [];
        }
        if (mod.PThread?.unusedWorkers) {
          for (const worker of mod.PThread.unusedWorkers) {
            if (worker?.unref) {
              worker.unref();
            }
            if (worker?.terminate) {
              worker.terminate();
            }
          }
          mod.PThread.unusedWorkers = [];
        }
      } catch {
      }
    }
    if (typeof process !== "undefined") {
      try {
        const proc = process;
        if (proc._getActiveHandles) {
          const handles = proc._getActiveHandles();
          for (const handle of handles) {
            if (handle?.unref) {
              const name = handle.constructor?.name ?? "";
              if (name === "MessagePort" || name === "Socket" && !handle.remoteAddress) {
                handle.unref();
              }
            }
          }
        }
      } catch {
      }
    }
    this.module = null;
    this.initialized = false;
    return Promise.resolve();
  }
  isReady() {
    return this.initialized;
  }
  getModule() {
    return this.module;
  }
  static getSupportedInputFormats() {
    return Object.keys(EXTENSION_TO_FORMAT);
  }
  static getSupportedOutputFormats() {
    return Object.keys(FORMAT_FILTERS);
  }
  static getValidOutputFormats(inputFormat) {
    return getValidOutputFormats(inputFormat);
  }
  static isConversionSupported(inputFormat, outputFormat) {
    return isConversionValid(inputFormat, outputFormat);
  }
  // ============================================
  // Private helper methods
  // ============================================
  normalizeInput(input) {
    if (input instanceof Uint8Array) {
      return input;
    }
    if (input instanceof ArrayBuffer) {
      return new Uint8Array(input);
    }
    return new Uint8Array(input);
  }
  getExtensionFromFilename(filename) {
    const parts = filename.split(".");
    if (parts.length > 1) {
      return parts.pop()?.toLowerCase() || null;
    }
    return null;
  }
  getBasename(filename) {
    const lastDot = filename.lastIndexOf(".");
    if (lastDot > 0) {
      return filename.substring(0, lastDot);
    }
    return filename;
  }
  emitProgress(phase, percent, message) {
    this.options.onProgress?.({ phase, percent, message });
  }
};
var WorkerConverter = class {
  worker = null;
  pending = /* @__PURE__ */ new Map();
  options;
  initialized = false;
  initializing = false;
  constructor(options = {}) {
    this.options = {
      wasmPath: "./wasm",
      verbose: false,
      ...options
    };
  }
  /**
   * Initialize the converter
   */
  async initialize() {
    if (this.initialized) {
      return;
    }
    if (this.initializing) {
      while (this.initializing) {
        await new Promise((resolve3) => setTimeout(resolve3, 100));
      }
      return;
    }
    this.initializing = true;
    try {
      let workerPath;
      if (this.options.workerPath) {
        workerPath = resolve(this.options.workerPath);
      } else {
        try {
          const currentDir = dirname(fileURLToPath(import.meta.url));
          workerPath = join(currentDir, "node.worker.cjs");
        } catch {
          workerPath = join(__dirname, "node.worker.cjs");
        }
        if (!existsSync(workerPath)) {
          const distWorkerPath = resolve(process.cwd(), "dist", "node.worker.cjs");
          if (existsSync(distWorkerPath)) {
            workerPath = distWorkerPath;
          }
        }
      }
      this.worker = new Worker(workerPath);
      this.worker.on("message", (response) => {
        if ("type" in response && response.type === "ready") {
          return;
        }
        const res = response;
        const pending = this.pending.get(res.id);
        if (pending) {
          clearTimeout(pending.timeout);
          this.pending.delete(res.id);
          if (res.success) {
            pending.resolve(res.data);
          } else {
            pending.reject(new ConversionError(
              "CONVERSION_FAILED" /* CONVERSION_FAILED */,
              res.error || "Unknown worker error"
            ));
          }
        }
      });
      this.worker.on("error", (error) => {
        for (const [, pending] of this.pending) {
          clearTimeout(pending.timeout);
          pending.reject(error);
        }
        this.pending.clear();
      });
      await new Promise((resolve3) => {
        const handler = (msg) => {
          if (msg.type === "ready") {
            this.worker?.off("message", handler);
            resolve3();
          }
        };
        this.worker?.on("message", handler);
      });
      await this.sendMessage("init", {
        wasmPath: this.options.wasmPath,
        verbose: this.options.verbose
      });
      this.initialized = true;
      this.options.onReady?.();
    } catch (error) {
      const convError = error instanceof ConversionError ? error : new ConversionError(
        "WASM_NOT_INITIALIZED" /* WASM_NOT_INITIALIZED */,
        `Failed to initialize worker: ${String(error)}`
      );
      this.options.onError?.(convError);
      throw convError;
    } finally {
      this.initializing = false;
    }
  }
  /**
   * Send a message to the worker and wait for response
   */
  sendMessage(type, payload) {
    return new Promise((resolve3, reject) => {
      if (!this.worker) {
        reject(new ConversionError(
          "WASM_NOT_INITIALIZED" /* WASM_NOT_INITIALIZED */,
          "Worker not initialized"
        ));
        return;
      }
      const id = randomUUID();
      const timeout = setTimeout(() => {
        const pending = this.pending.get(id);
        if (pending) {
          this.pending.delete(id);
          pending.reject(new ConversionError(
            "CONVERSION_FAILED" /* CONVERSION_FAILED */,
            "Worker operation timeout"
          ));
        }
      }, 3e5);
      this.pending.set(id, { resolve: resolve3, reject, timeout });
      this.worker.postMessage({ type, id, payload });
    });
  }
  /**
   * Convert a document
   */
  async convert(input, options, filename = "document") {
    if (!this.initialized || !this.worker) {
      throw new ConversionError(
        "WASM_NOT_INITIALIZED" /* WASM_NOT_INITIALIZED */,
        "Converter not initialized. Call initialize() first."
      );
    }
    const startTime = Date.now();
    const inputData = this.normalizeInput(input);
    if (inputData.length === 0) {
      throw new ConversionError(
        "INVALID_INPUT" /* INVALID_INPUT */,
        "Empty document provided"
      );
    }
    const inputFormat = options.inputFormat || this.getExtensionFromFilename(filename) || "docx";
    const outputFormat = options.outputFormat;
    const result = await this.sendMessage("convert", {
      inputData,
      inputFormat,
      outputFormat,
      filename
    });
    const baseName = this.getBasename(filename);
    const outputFilename = `${baseName}.${outputFormat}`;
    return {
      data: new Uint8Array(result),
      mimeType: FORMAT_MIME_TYPES[outputFormat],
      filename: outputFilename,
      duration: Date.now() - startTime
    };
  }
  /**
   * Get the number of pages in a document
   */
  async getPageCount(input, options) {
    if (!this.initialized || !this.worker) {
      throw new ConversionError(
        "WASM_NOT_INITIALIZED" /* WASM_NOT_INITIALIZED */,
        "Converter not initialized. Call initialize() first."
      );
    }
    const inputData = this.normalizeInput(input);
    const inputFormat = options.inputFormat || "docx";
    return this.sendMessage("getPageCount", { inputData, inputFormat });
  }
  /**
   * Get document information including type and valid output formats
   */
  async getDocumentInfo(input, options) {
    if (!this.initialized || !this.worker) {
      throw new ConversionError(
        "WASM_NOT_INITIALIZED" /* WASM_NOT_INITIALIZED */,
        "Converter not initialized. Call initialize() first."
      );
    }
    const inputData = this.normalizeInput(input);
    const inputFormat = options.inputFormat || "docx";
    return this.sendMessage("getDocumentInfo", { inputData, inputFormat });
  }
  /**
   * Render a single page as an image
   */
  async renderPage(input, options, pageIndex, width, height = 0) {
    if (!this.initialized || !this.worker) {
      throw new ConversionError(
        "WASM_NOT_INITIALIZED" /* WASM_NOT_INITIALIZED */,
        "Converter not initialized. Call initialize() first."
      );
    }
    const inputData = this.normalizeInput(input);
    const inputFormat = options.inputFormat || "docx";
    const result = await this.sendMessage("renderPage", {
      inputData,
      inputFormat,
      pageIndex,
      width,
      height
    });
    const preview = result;
    return {
      page: pageIndex,
      data: new Uint8Array(preview.data),
      width: preview.width,
      height: preview.height
    };
  }
  /**
   * Render multiple page previews
   */
  async renderPagePreviews(input, options, renderOptions = {}) {
    if (!this.initialized || !this.worker) {
      throw new ConversionError(
        "WASM_NOT_INITIALIZED" /* WASM_NOT_INITIALIZED */,
        "Converter not initialized. Call initialize() first."
      );
    }
    const inputData = this.normalizeInput(input);
    const inputFormat = options.inputFormat || "docx";
    const rawPreviews = await this.sendMessage("renderPagePreviews", {
      inputData,
      inputFormat,
      width: renderOptions.width || 800,
      height: renderOptions.height || 0,
      pageIndices: renderOptions.pageIndices
    });
    return rawPreviews.map((preview) => ({
      page: preview.page,
      data: new Uint8Array(preview.data),
      width: preview.width,
      height: preview.height
    }));
  }
  /**
   * Render a page at full quality (native resolution based on DPI)
   * @param input Document data
   * @param options Must include inputFormat
   * @param pageIndex Zero-based page index to render
   * @param renderOptions DPI and max dimension settings
   * @returns Full quality page preview with RGBA data and DPI info
   */
  async renderPageFullQuality(input, options, pageIndex, renderOptions = {}) {
    if (!this.initialized || !this.worker) {
      throw new ConversionError(
        "WASM_NOT_INITIALIZED" /* WASM_NOT_INITIALIZED */,
        "Converter not initialized. Call initialize() first."
      );
    }
    const inputData = this.normalizeInput(input);
    const inputFormat = options.inputFormat || "docx";
    const rawPreview = await this.sendMessage("renderPageFullQuality", {
      inputData,
      inputFormat,
      pageIndex,
      dpi: renderOptions.dpi ?? 150,
      maxDimension: renderOptions.maxDimension,
      editMode: renderOptions.editMode ?? false
    });
    return {
      page: rawPreview.page,
      data: new Uint8Array(rawPreview.data),
      width: rawPreview.width,
      height: rawPreview.height,
      dpi: rawPreview.dpi
    };
  }
  /**
   * Extract text content from a document
   */
  async getDocumentText(input, inputFormat) {
    if (!this.initialized || !this.worker) {
      throw new ConversionError(
        "WASM_NOT_INITIALIZED" /* WASM_NOT_INITIALIZED */,
        "Converter not initialized. Call initialize() first."
      );
    }
    const inputData = this.normalizeInput(input);
    return this.sendMessage("getDocumentText", { inputData, inputFormat });
  }
  /**
   * Get page/slide names from a document
   */
  async getPageNames(input, inputFormat) {
    if (!this.initialized || !this.worker) {
      throw new ConversionError(
        "WASM_NOT_INITIALIZED" /* WASM_NOT_INITIALIZED */,
        "Converter not initialized. Call initialize() first."
      );
    }
    const inputData = this.normalizeInput(input);
    return this.sendMessage("getPageNames", { inputData, inputFormat });
  }
  // ============================================
  // Editor Operations
  // ============================================
  /**
   * Open a document for editing
   * Returns a session ID that can be used for subsequent editor operations
   */
  async openDocument(input, options) {
    if (!this.initialized || !this.worker) {
      throw new ConversionError(
        "WASM_NOT_INITIALIZED" /* WASM_NOT_INITIALIZED */,
        "Converter not initialized. Call initialize() first."
      );
    }
    const inputData = this.normalizeInput(input);
    const inputFormat = options.inputFormat || "docx";
    return this.sendMessage("openDocument", { inputData, inputFormat });
  }
  /**
   * Execute an editor operation on an open document session
   * @param sessionId - The session ID from openDocument
   * @param method - The editor method to call (e.g., 'insertParagraph', 'getStructure')
   * @param args - Arguments to pass to the method
   */
  async editorOperation(sessionId, method, args) {
    if (!this.initialized || !this.worker) {
      throw new ConversionError(
        "WASM_NOT_INITIALIZED" /* WASM_NOT_INITIALIZED */,
        "Converter not initialized. Call initialize() first."
      );
    }
    return this.sendMessage("editorOperation", { sessionId, method, args: args ?? [] });
  }
  /**
   * Close an editor session and get the modified document
   * @param sessionId - The session ID from openDocument
   * @returns The modified document data, or undefined if save failed
   */
  async closeDocument(sessionId) {
    if (!this.initialized || !this.worker) {
      throw new ConversionError(
        "WASM_NOT_INITIALIZED" /* WASM_NOT_INITIALIZED */,
        "Converter not initialized. Call initialize() first."
      );
    }
    const result = await this.sendMessage("closeDocument", { sessionId });
    return result ? new Uint8Array(result) : void 0;
  }
  /**
   * Destroy the converter and terminate the worker
   */
  async destroy() {
    for (const [, pending] of this.pending) {
      clearTimeout(pending.timeout);
    }
    if (this.worker) {
      try {
        await this.sendMessage("destroy");
      } catch {
      }
      for (const [, pending] of this.pending) {
        clearTimeout(pending.timeout);
      }
      this.worker.removeAllListeners();
      await this.worker.terminate();
      this.worker = null;
    }
    this.initialized = false;
    this.pending.clear();
  }
  /**
   * Check if the converter is ready
   */
  isReady() {
    return this.initialized && this.worker !== null;
  }
  normalizeInput(input) {
    if (input instanceof Uint8Array) {
      return input;
    }
    if (input instanceof ArrayBuffer) {
      return new Uint8Array(input);
    }
    return new Uint8Array(input);
  }
  getExtensionFromFilename(filename) {
    const parts = filename.split(".");
    if (parts.length > 1) {
      return parts.pop()?.toLowerCase() || null;
    }
    return null;
  }
  getBasename(filename) {
    const lastDot = filename.lastIndexOf(".");
    if (lastDot > 0) {
      return filename.substring(0, lastDot);
    }
    return filename;
  }
};
async function createWorkerConverter(options = {}) {
  const converter = new WorkerConverter(options);
  await converter.initialize();
  return converter;
}
var SubprocessConverter = class {
  child = null;
  pending = /* @__PURE__ */ new Map();
  options;
  initialized = false;
  initializing = false;
  workerPath = "";
  constructor(options = {}) {
    this.options = {
      wasmPath: "./wasm",
      verbose: false,
      maxInitRetries: 3,
      maxConversionRetries: 2,
      restartOnMemoryError: true,
      ...options
    };
  }
  isMemoryError(error) {
    const msg = error instanceof Error ? error.message : error;
    return msg.includes("memory access out of bounds") || msg.includes("unreachable") || msg.includes("table index is out of bounds") || msg.includes("null function");
  }
  async spawnWorker() {
    if (!this.workerPath) {
      try {
        const currentDir = dirname(fileURLToPath(import.meta.url));
        if (currentDir.endsWith("/src") || currentDir.endsWith("\\src")) {
          this.workerPath = join(currentDir, "..", "dist", "subprocess.worker.cjs");
        } else {
          this.workerPath = join(currentDir, "subprocess.worker.cjs");
        }
      } catch {
        this.workerPath = join(__dirname, "subprocess.worker.cjs");
      }
    }
    const wasmPath = resolve(this.options.wasmPath || "./wasm");
    this.child = fork(this.workerPath, [], {
      env: { ...process.env, WASM_PATH: wasmPath, VERBOSE: String(this.options.verbose || false) },
      stdio: ["pipe", "pipe", "pipe", "ipc"]
    });
    this.child.stdout?.on("data", (d) => {
      if (this.options.verbose) process.stdout.write(d);
    });
    this.child.stderr?.on("data", (d) => {
      if (this.options.verbose) process.stderr.write(d);
    });
    this.child.on("message", (msg) => {
      if (msg.type === "response" && msg.id) {
        const p = this.pending.get(msg.id);
        if (p) {
          this.pending.delete(msg.id);
          msg.success ? p.resolve(msg.data) : p.reject(new ConversionError("CONVERSION_FAILED" /* CONVERSION_FAILED */, msg.error || "Error"));
        }
      }
    });
    this.child.on("error", (e) => {
      for (const p of this.pending.values()) p.reject(e);
      this.pending.clear();
    });
    this.child.on("exit", (code) => {
      if (code !== 0) {
        for (const p of this.pending.values()) p.reject(new Error(`Exit ${code}`));
        this.pending.clear();
      }
      this.child = null;
      this.initialized = false;
    });
    await new Promise((resolve3, reject) => {
      const t = setTimeout(() => reject(new Error("Subprocess start timeout")), 3e4);
      const h = (msg) => {
        if (msg.type === "ready") {
          clearTimeout(t);
          this.child?.off("message", h);
          resolve3();
        } else if (msg.type === "error") {
          clearTimeout(t);
          this.child?.off("message", h);
          reject(new Error(msg.error));
        }
      };
      this.child?.on("message", h);
    });
    await this.send("init", void 0, 18e4);
  }
  killWorker() {
    if (this.child) {
      try {
        this.child.kill("SIGKILL");
      } catch {
      }
      this.child = null;
    }
    this.initialized = false;
    this.pending.clear();
  }
  async initialize() {
    if (this.initialized) return;
    if (this.initializing) {
      while (this.initializing) await new Promise((r) => setTimeout(r, 100));
      return;
    }
    this.initializing = true;
    const maxRetries = this.options.maxInitRetries || 3;
    let lastError = null;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.killWorker();
        await this.spawnWorker();
        this.initialized = true;
        this.initializing = false;
        this.options.onReady?.();
        return;
      } catch (e) {
        lastError = e instanceof Error ? e : new Error(String(e));
        if (this.options.verbose) {
          console.error(`[SubprocessConverter] Init attempt ${attempt}/${maxRetries} failed:`, lastError.message);
        }
        await this.killWorker();
        if (attempt < maxRetries) {
          await new Promise((r) => setTimeout(r, 500 * attempt));
        }
      }
    }
    this.initializing = false;
    const err = new ConversionError("WASM_NOT_INITIALIZED" /* WASM_NOT_INITIALIZED */, `Init failed after ${maxRetries} attempts: ${lastError?.message}`);
    this.options.onError?.(err);
    throw err;
  }
  send(type, payload, timeout = 3e5) {
    return new Promise((resolve3, reject) => {
      if (!this.child) {
        reject(new ConversionError("WASM_NOT_INITIALIZED" /* WASM_NOT_INITIALIZED */, "No process"));
        return;
      }
      const id = randomUUID();
      this.pending.set(id, { resolve: resolve3, reject });
      this.child.send({ type, id, payload });
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new ConversionError("CONVERSION_FAILED" /* CONVERSION_FAILED */, "Timeout"));
        }
      }, timeout);
    });
  }
  normalizeInput(input) {
    if (input instanceof Uint8Array) {
      return input;
    }
    if (input instanceof ArrayBuffer) {
      return new Uint8Array(input);
    }
    return new Uint8Array(input);
  }
  async convert(input, options, filename = "document") {
    if (!this.initialized || !this.child) throw new ConversionError("WASM_NOT_INITIALIZED" /* WASM_NOT_INITIALIZED */, "Not initialized");
    const start = Date.now();
    const data = this.normalizeInput(input);
    if (data.length === 0) throw new ConversionError("INVALID_INPUT" /* INVALID_INPUT */, "Empty");
    const ext = options.inputFormat || (filename.includes(".") ? filename.slice(filename.lastIndexOf(".") + 1).toLowerCase() : "docx");
    let filter = FORMAT_FILTER_OPTIONS[options.outputFormat] || "";
    if (options.outputFormat === "pdf" && options.pdf) {
      const o = [];
      if (options.pdf.pdfaLevel) o.push(`SelectPdfVersion=${{ "PDF/A-1b": 1, "PDF/A-2b": 2, "PDF/A-3b": 3 }[options.pdf.pdfaLevel] || 0}`);
      if (options.pdf.quality !== void 0) o.push(`Quality=${options.pdf.quality}`);
      if (o.length) filter = o.join(",");
    }
    const maxRetries = this.options.maxConversionRetries || 2;
    let lastError = null;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const r = await this.send("convert", {
          inputData: Array.from(data),
          inputExt: ext,
          outputFormat: OUTPUT_FORMAT_TO_LOK[options.outputFormat],
          filterOptions: filter
        });
        const base = filename.includes(".") ? filename.slice(0, filename.lastIndexOf(".")) : filename;
        return {
          data: new Uint8Array(r),
          mimeType: FORMAT_MIME_TYPES[options.outputFormat],
          filename: `${base}.${options.outputFormat}`,
          duration: Date.now() - start
        };
      } catch (e) {
        lastError = e instanceof Error ? e : new Error(String(e));
        if (this.options.verbose) {
          console.error(`[SubprocessConverter] Conversion attempt ${attempt}/${maxRetries} failed:`, lastError.message);
        }
        if (this.isMemoryError(lastError) && this.options.restartOnMemoryError && attempt < maxRetries) {
          if (this.options.verbose) {
            console.error("[SubprocessConverter] Memory error detected, restarting subprocess...");
          }
          await this.killWorker();
          await this.spawnWorker();
          this.initialized = true;
        } else if (attempt < maxRetries) {
          await new Promise((r) => setTimeout(r, 100));
        }
      }
    }
    throw lastError || new ConversionError("CONVERSION_FAILED" /* CONVERSION_FAILED */, "Conversion failed");
  }
  /**
   * Get the number of pages in a document
   */
  async getPageCount(input, options) {
    if (!this.initialized || !this.child) {
      throw new ConversionError(
        "WASM_NOT_INITIALIZED" /* WASM_NOT_INITIALIZED */,
        "Converter not initialized. Call initialize() first."
      );
    }
    const inputData = this.normalizeInput(input);
    return this.send("getPageCount", {
      inputData: Array.from(inputData),
      inputFormat: options.inputFormat
    });
  }
  /**
   * Get document information including type and valid output formats
   */
  async getDocumentInfo(input, options) {
    if (!this.initialized || !this.child) {
      throw new ConversionError(
        "WASM_NOT_INITIALIZED" /* WASM_NOT_INITIALIZED */,
        "Converter not initialized. Call initialize() first."
      );
    }
    const inputData = this.normalizeInput(input);
    return this.send("getDocumentInfo", {
      inputData: Array.from(inputData),
      inputFormat: options.inputFormat
    });
  }
  /**
   * Render a single page as an image
   */
  async renderPage(input, options, pageIndex, width, height = 0) {
    if (!this.initialized || !this.child) {
      throw new ConversionError(
        "WASM_NOT_INITIALIZED" /* WASM_NOT_INITIALIZED */,
        "Converter not initialized. Call initialize() first."
      );
    }
    const inputData = this.normalizeInput(input);
    const result = await this.send("renderPage", {
      inputData: Array.from(inputData),
      inputFormat: options.inputFormat,
      pageIndex,
      width,
      height
    });
    return {
      page: pageIndex,
      data: new Uint8Array(result.data),
      width: result.width,
      height: result.height
    };
  }
  /**
   * Render multiple page previews
   */
  async renderPagePreviews(input, options, renderOptions = {}) {
    if (!this.initialized || !this.child) {
      throw new ConversionError(
        "WASM_NOT_INITIALIZED" /* WASM_NOT_INITIALIZED */,
        "Converter not initialized. Call initialize() first."
      );
    }
    const inputData = this.normalizeInput(input);
    const result = await this.send("renderPagePreviews", {
      inputData: Array.from(inputData),
      inputFormat: options.inputFormat,
      width: renderOptions.width || 800,
      height: renderOptions.height || 0,
      pageIndices: renderOptions.pageIndices
    });
    return result.map((preview) => ({
      page: preview.page,
      data: new Uint8Array(preview.data),
      width: preview.width,
      height: preview.height
    }));
  }
  /**
   * Render a page at full quality (native resolution based on DPI)
   * @param input Document data
   * @param options Must include inputFormat
   * @param pageIndex Zero-based page index to render
   * @param renderOptions DPI and max dimension settings
   * @returns Full quality page preview with RGBA data and DPI info
   */
  async renderPageFullQuality(input, options, pageIndex, renderOptions = {}) {
    if (!this.initialized || !this.child) {
      throw new ConversionError(
        "WASM_NOT_INITIALIZED" /* WASM_NOT_INITIALIZED */,
        "Converter not initialized. Call initialize() first."
      );
    }
    const inputData = this.normalizeInput(input);
    const result = await this.send("renderPageFullQuality", {
      inputData: Array.from(inputData),
      inputFormat: options.inputFormat,
      pageIndex,
      dpi: renderOptions.dpi ?? 150,
      maxDimension: renderOptions.maxDimension,
      editMode: renderOptions.editMode ?? false
    });
    return {
      page: result.page,
      data: new Uint8Array(result.data),
      width: result.width,
      height: result.height,
      dpi: result.dpi
    };
  }
  /**
   * Extract text content from a document
   */
  async getDocumentText(input, inputFormat) {
    if (!this.initialized || !this.child) {
      throw new ConversionError(
        "WASM_NOT_INITIALIZED" /* WASM_NOT_INITIALIZED */,
        "Converter not initialized. Call initialize() first."
      );
    }
    const inputData = this.normalizeInput(input);
    return this.send("getDocumentText", {
      inputData: Array.from(inputData),
      inputFormat
    });
  }
  /**
   * Get page/slide names from a document
   */
  async getPageNames(input, inputFormat) {
    if (!this.initialized || !this.child) {
      throw new ConversionError(
        "WASM_NOT_INITIALIZED" /* WASM_NOT_INITIALIZED */,
        "Converter not initialized. Call initialize() first."
      );
    }
    const inputData = this.normalizeInput(input);
    return this.send("getPageNames", {
      inputData: Array.from(inputData),
      inputFormat
    });
  }
  // ============================================
  // Editor Operations
  // ============================================
  /**
   * Open a document for editing
   * Returns a session ID that can be used for subsequent editor operations
   */
  async openDocument(input, options) {
    if (!this.initialized || !this.child) {
      throw new ConversionError(
        "WASM_NOT_INITIALIZED" /* WASM_NOT_INITIALIZED */,
        "Converter not initialized. Call initialize() first."
      );
    }
    const inputData = this.normalizeInput(input);
    return this.send("openDocument", {
      inputData: Array.from(inputData),
      inputFormat: options.inputFormat
    });
  }
  /**
   * Execute an editor operation on an open document session
   * @param sessionId - The session ID from openDocument
   * @param method - The editor method to call (e.g., 'insertParagraph', 'getStructure')
   * @param args - Arguments to pass to the method
   */
  async editorOperation(sessionId, method, args) {
    if (!this.initialized || !this.child) {
      throw new ConversionError(
        "WASM_NOT_INITIALIZED" /* WASM_NOT_INITIALIZED */,
        "Converter not initialized. Call initialize() first."
      );
    }
    return this.send("editorOperation", { sessionId, method, args: args ?? [] });
  }
  /**
   * Close an editor session and get the modified document
   * @param sessionId - The session ID from openDocument
   * @returns The modified document data, or undefined if save failed
   */
  async closeDocument(sessionId) {
    if (!this.initialized || !this.child) {
      throw new ConversionError(
        "WASM_NOT_INITIALIZED" /* WASM_NOT_INITIALIZED */,
        "Converter not initialized. Call initialize() first."
      );
    }
    const result = await this.send("closeDocument", { sessionId });
    return result ? new Uint8Array(result) : void 0;
  }
  async destroy() {
    if (this.child) {
      try {
        await this.send("destroy");
      } catch {
      }
      if (this.child) {
        try {
          this.child.kill("SIGKILL");
        } catch {
        }
        this.child = null;
      }
    }
    this.initialized = false;
    this.pending.clear();
  }
  isReady() {
    return this.initialized && this.child !== null;
  }
};
async function createSubprocessConverter(options = {}) {
  const c = new SubprocessConverter(options);
  await c.initialize();
  return c;
}
var sharpModule = void 0;
async function isSharpAvailable() {
  if (sharpModule === void 0) {
    try {
      const mod = await import('sharp');
      sharpModule = mod.default;
    } catch {
      sharpModule = null;
    }
  }
  return sharpModule !== null;
}
async function getSharp() {
  if (sharpModule === void 0) {
    await isSharpAvailable();
  }
  return sharpModule ?? null;
}
async function encodeImage(rgbaData, width, height, options = { format: "png" }) {
  const sharp = await getSharp();
  if (sharp) {
    return encodeWithSharp(sharp, rgbaData, width, height, options);
  }
  if (options.format !== "png") {
    throw new Error(
      `Format '${options.format}' requires sharp to be installed. Install it with: npm install sharp`
    );
  }
  return encodePngFallback(rgbaData, width, height);
}
async function encodeWithSharp(sharp, rgbaData, width, height, options) {
  let pipeline = sharp(Buffer.from(rgbaData), {
    raw: {
      width,
      height,
      channels: 4
    }
  });
  switch (options.format) {
    case "png":
      pipeline = pipeline.png({
        compressionLevel: options.compressionLevel ?? 6
      });
      break;
    case "jpeg":
      pipeline = pipeline.jpeg({
        quality: options.quality ?? 90
      });
      break;
    case "webp":
      pipeline = pipeline.webp({
        quality: options.quality ?? 90
      });
      break;
  }
  return pipeline.toBuffer();
}
function encodePngFallback(rgbaData, width, height) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const crcTable = new Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 3988292384 ^ c >>> 1 : c >>> 1;
    }
    crcTable[n] = c;
  }
  function crc32(data) {
    let crc = 4294967295;
    for (let i = 0; i < data.length; i++) {
      const tableIndex = (crc ^ data[i]) & 255;
      crc = crcTable[tableIndex] ^ crc >>> 8;
    }
    return (crc ^ 4294967295) >>> 0;
  }
  function createChunk(type, data) {
    const typeBytes = Buffer.from(type);
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    const crcData = Buffer.concat([typeBytes, data]);
    const crcValue = Buffer.alloc(4);
    crcValue.writeUInt32BE(crc32(crcData));
    return Buffer.concat([length, typeBytes, data, crcValue]);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const ihdrChunk = createChunk("IHDR", ihdr);
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowSize);
  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0;
    for (let x = 0; x < width; x++) {
      const srcOffset = (y * width + x) * 4;
      const dstOffset = rowOffset + 1 + x * 4;
      rawData[dstOffset] = rgbaData[srcOffset] ?? 0;
      rawData[dstOffset + 1] = rgbaData[srcOffset + 1] ?? 0;
      rawData[dstOffset + 2] = rgbaData[srcOffset + 2] ?? 0;
      rawData[dstOffset + 3] = rgbaData[srcOffset + 3] ?? 0;
    }
  }
  const compressed = deflateSync(rawData);
  const idatChunk = createChunk("IDAT", compressed);
  const iendChunk = createChunk("IEND", Buffer.alloc(0));
  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}
async function rgbaToPng(rgbaData, width, height) {
  return encodeImage(rgbaData, width, height, { format: "png" });
}
async function rgbaToJpeg(rgbaData, width, height, quality = 90) {
  return encodeImage(rgbaData, width, height, { format: "jpeg", quality });
}
async function rgbaToWebp(rgbaData, width, height, quality = 90) {
  return encodeImage(rgbaData, width, height, { format: "webp", quality });
}

// src/editor/base.ts
var OfficeEditor = class {
  lok;
  docPtr;
  options;
  inputPath = "";
  constructor(lok, docPtr, options = {}) {
    this.lok = lok;
    this.docPtr = docPtr;
    this.options = {
      maxResponseChars: options.maxResponseChars ?? 8e3,
      ...options
    };
  }
  // ============================================
  // Accessor methods
  // ============================================
  /**
   * Get the document pointer for low-level LOK operations
   */
  getDocPtr() {
    return this.docPtr;
  }
  /**
   * Get the LOK bindings for low-level operations
   */
  getLokBindings() {
    return this.lok;
  }
  // ============================================
  // Lifecycle methods
  // ============================================
  save() {
    try {
      if (!this.inputPath) {
        return this.createErrorResult("No input path set", "Use saveAs() to specify a path");
      }
      this.lok.postUnoCommand(this.docPtr, ".uno:Save");
      return this.createResult({ path: this.inputPath });
    } catch (error) {
      return this.createErrorResult(`Save failed: ${String(error)}`);
    }
  }
  saveAs(path, format) {
    try {
      this.lok.documentSaveAs(this.docPtr, path, format, "");
      return this.createResult({ path });
    } catch (error) {
      return this.createErrorResult(`SaveAs failed: ${String(error)}`);
    }
  }
  close() {
    try {
      this.lok.documentDestroy(this.docPtr);
      this.docPtr = 0;
      return this.createResult(void 0);
    } catch (error) {
      return this.createErrorResult(`Close failed: ${String(error)}`);
    }
  }
  /**
   * Get the current edit mode of the document
   * @returns 0 = view mode, 1 = edit mode
   */
  getEditMode() {
    return this.lok.getEditMode(this.docPtr);
  }
  /**
   * Attempt to enable edit mode for the document
   * @returns OperationResult with success and verified fields
   */
  enableEditMode() {
    try {
      const beforeMode = this.lok.getEditMode(this.docPtr);
      if (beforeMode === 1) {
        return this.createResult({ editMode: 1 });
      }
      this.lok.postUnoCommand(this.docPtr, ".uno:Edit");
      const afterMode = this.lok.getEditMode(this.docPtr);
      return {
        success: true,
        verified: afterMode === 1,
        data: { editMode: afterMode }
      };
    } catch (error) {
      return this.createErrorResult(`Failed to enable edit mode: ${String(error)}`);
    }
  }
  // ============================================
  // History methods
  // ============================================
  undo() {
    try {
      this.lok.postUnoCommand(this.docPtr, ".uno:Undo");
      return this.createResult(void 0);
    } catch (error) {
      return this.createErrorResult(`Undo failed: ${String(error)}`);
    }
  }
  redo() {
    try {
      this.lok.postUnoCommand(this.docPtr, ".uno:Redo");
      return this.createResult(void 0);
    } catch (error) {
      return this.createErrorResult(`Redo failed: ${String(error)}`);
    }
  }
  // ============================================
  // Search methods
  // ============================================
  find(text, options) {
    try {
      const searchArgs = JSON.stringify({
        "SearchItem.SearchString": { type: "string", value: text },
        "SearchItem.Backward": { type: "boolean", value: false },
        "SearchItem.SearchAll": { type: "boolean", value: true },
        "SearchItem.MatchCase": { type: "boolean", value: options?.caseSensitive ?? false },
        "SearchItem.WordOnly": { type: "boolean", value: options?.wholeWord ?? false }
      });
      this.lok.postUnoCommand(this.docPtr, ".uno:ExecuteSearch", searchArgs);
      const selection = this.lok.getTextSelection(this.docPtr, "text/plain");
      const hasMatch = selection !== null && selection.length > 0;
      return this.createResult({
        matches: hasMatch ? 1 : 0,
        // LOK doesn't provide count, we report if found
        firstMatch: hasMatch ? { x: 0, y: 0 } : void 0
      });
    } catch (error) {
      return this.createErrorResult(`Find failed: ${String(error)}`);
    }
  }
  findAndReplaceAll(find, replace, options) {
    try {
      const searchArgs = JSON.stringify({
        "SearchItem.SearchString": { type: "string", value: find },
        "SearchItem.ReplaceString": { type: "string", value: replace },
        "SearchItem.Command": { type: "long", value: 3 },
        // Replace All
        "SearchItem.MatchCase": { type: "boolean", value: options?.caseSensitive ?? false },
        "SearchItem.WordOnly": { type: "boolean", value: options?.wholeWord ?? false }
      });
      this.lok.postUnoCommand(this.docPtr, ".uno:ExecuteSearch", searchArgs);
      return this.createResult({ replacements: -1 });
    } catch (error) {
      return this.createErrorResult(`Replace failed: ${String(error)}`);
    }
  }
  // ============================================
  // Callback-based state retrieval
  // ============================================
  /**
   * Poll all STATE_CHANGED callback events and return as a map.
   *
   * LOK sends STATE_CHANGED events when formatting state changes (e.g., when
   * the cursor moves over bold text, `.uno:Bold=true` is emitted).
   *
   * Pattern for getting current format state:
   * 1. clearCallbackQueue() - clear any stale events
   * 2. Perform action that triggers state change (e.g., SelectWord)
   * 3. flushCallbacks(docPtr) - force LOK to process callbacks
   * 4. pollStateChanges() - retrieve the events
   *
   * @returns Map of UNO command names to their state values
   *          e.g., Map { '.uno:Bold' => 'true', '.uno:Italic' => 'false' }
   */
  getStateChanges() {
    try {
      const states = this.lok.pollStateChanges();
      return this.createResult(states);
    } catch (error) {
      return this.createErrorResult(`Failed to poll state changes: ${String(error)}`);
    }
  }
  /**
   * Flush pending LOK callbacks and then poll for state changes.
   * Convenience method that combines flushCallbacks + pollStateChanges.
   *
   * @returns Map of UNO command names to their state values
   */
  flushAndPollState() {
    try {
      this.lok.flushCallbacks(this.docPtr);
      const states = this.lok.pollStateChanges();
      return this.createResult(states);
    } catch (error) {
      return this.createErrorResult(`Failed to flush and poll state: ${String(error)}`);
    }
  }
  /**
   * Clear the callback queue, useful before performing operations
   * where you want to capture only new state changes.
   */
  clearCallbackQueue() {
    this.lok.clearCallbackQueue();
  }
  // ============================================
  // Selection methods
  // ============================================
  select(_selection) {
    try {
      const text = this.lok.getTextSelection(this.docPtr, "text/plain");
      return this.createResult({ selected: text || "" });
    } catch (error) {
      return this.createErrorResult(`Select failed: ${String(error)}`);
    }
  }
  getSelection() {
    try {
      const text = this.lok.getTextSelection(this.docPtr, "text/plain");
      return this.createResult({
        text: text || "",
        range: { type: "text", start: { paragraph: 0, character: 0 } }
      });
    } catch (error) {
      return this.createErrorResult(`GetSelection failed: ${String(error)}`);
    }
  }
  clearSelection() {
    try {
      this.lok.resetSelection(this.docPtr);
      return this.createResult(void 0);
    } catch (error) {
      return this.createErrorResult(`ClearSelection failed: ${String(error)}`);
    }
  }
  // ============================================
  // Protected helper methods
  // ============================================
  createResult(data) {
    return {
      success: true,
      verified: true,
      data
    };
  }
  createErrorResult(error, suggestion) {
    return {
      success: false,
      verified: false,
      error,
      suggestion
    };
  }
  createResultWithTruncation(data, truncation) {
    return {
      success: true,
      verified: true,
      data,
      truncated: truncation
    };
  }
  truncateContent(content, maxChars) {
    const limit = maxChars ?? this.options.maxResponseChars;
    const original = content.length;
    if (original <= limit) {
      return { content, truncated: false, original, returned: original };
    }
    let truncated = content.slice(0, limit);
    const lastSpace = truncated.lastIndexOf(" ");
    if (lastSpace > limit * 0.8) {
      truncated = truncated.slice(0, lastSpace);
    }
    return {
      content: truncated,
      truncated: true,
      original,
      returned: truncated.length
    };
  }
  truncateArray(items, maxChars, itemToString) {
    const original = items.length;
    let charCount = 0;
    let includedCount = 0;
    for (const item of items) {
      const itemStr = itemToString(item);
      if (charCount + itemStr.length > maxChars) {
        break;
      }
      charCount += itemStr.length;
      includedCount++;
    }
    return {
      items: items.slice(0, includedCount),
      truncated: includedCount < original,
      original,
      returned: includedCount
    };
  }
  // ============================================
  // Cell address helpers
  // ============================================
  a1ToRowCol(a1) {
    const match = a1.match(/^([A-Z]+)(\d+)$/i);
    if (!match) {
      throw new Error(`Invalid A1 notation: ${a1}`);
    }
    const colStr = match[1].toUpperCase();
    const rowStr = match[2];
    let col = 0;
    for (let i = 0; i < colStr.length; i++) {
      col = col * 26 + (colStr.charCodeAt(i) - 64);
    }
    col -= 1;
    const row = parseInt(rowStr, 10) - 1;
    return { row, col };
  }
  rowColToA1(row, col) {
    let colStr = "";
    let c = col + 1;
    while (c > 0) {
      const remainder = (c - 1) % 26;
      colStr = String.fromCharCode(65 + remainder) + colStr;
      c = Math.floor((c - 1) / 26);
    }
    return `${colStr}${row + 1}`;
  }
  normalizeCellRef(ref) {
    if (typeof ref === "string") {
      return this.a1ToRowCol(ref);
    }
    return ref;
  }
  // ============================================
  // Internal state
  // ============================================
  setInputPath(path) {
    this.inputPath = path;
  }
  isOpen() {
    return this.docPtr !== 0;
  }
};

// src/editor/writer.ts
var WriterEditor = class extends OfficeEditor {
  cachedParagraphs = null;
  getDocumentType() {
    return "writer";
  }
  getStructure(options) {
    try {
      const paragraphs = this.getParagraphsInternal();
      const maxChars = options?.maxResponseChars ?? this.options.maxResponseChars;
      const paragraphInfos = paragraphs.map((text, index) => ({
        index,
        preview: text.slice(0, 100) + (text.length > 100 ? "..." : ""),
        style: "Normal",
        // Would need UNO query to get actual style
        charCount: text.length
      }));
      const truncResult = this.truncateArray(
        paragraphInfos,
        maxChars,
        (p) => JSON.stringify(p)
      );
      const structure = {
        type: "writer",
        paragraphs: truncResult.items,
        pageCount: this.lok.documentGetParts(this.docPtr),
        wordCount: paragraphs.join(" ").split(/\s+/).filter((w) => w.length > 0).length
      };
      if (truncResult.truncated) {
        return this.createResultWithTruncation(structure, {
          original: truncResult.original,
          returned: truncResult.returned,
          message: `Showing ${truncResult.returned} of ${truncResult.original} paragraphs. Use getParagraphs(start, count) to paginate.`
        });
      }
      return this.createResult(structure);
    } catch (error) {
      return this.createErrorResult(`Failed to get structure: ${String(error)}`);
    }
  }
  getParagraph(index) {
    try {
      const paragraphs = this.getParagraphsInternal();
      if (index < 0 || index >= paragraphs.length) {
        return this.createErrorResult(
          `Paragraph index ${index} out of range (0-${paragraphs.length - 1})`,
          `Use getStructure() to see available paragraphs`
        );
      }
      const text = paragraphs[index];
      return this.createResult({
        index,
        text,
        style: "Normal",
        charCount: text.length
      });
    } catch (error) {
      return this.createErrorResult(`Failed to get paragraph: ${String(error)}`);
    }
  }
  getParagraphs(start, count) {
    try {
      const paragraphs = this.getParagraphsInternal();
      if (start < 0 || start >= paragraphs.length) {
        return this.createErrorResult(
          `Start index ${start} out of range`,
          `Valid range: 0-${paragraphs.length - 1}`
        );
      }
      const end = Math.min(start + count, paragraphs.length);
      const result = paragraphs.slice(start, end).map((text, i) => ({
        index: start + i,
        text,
        style: "Normal",
        charCount: text.length
      }));
      return this.createResult(result);
    } catch (error) {
      return this.createErrorResult(`Failed to get paragraphs: ${String(error)}`);
    }
  }
  insertParagraph(text, options) {
    try {
      const paragraphs = this.getParagraphsInternal();
      const insertIndex = options?.afterIndex !== void 0 ? options.afterIndex + 1 : paragraphs.length;
      if (insertIndex > 0 && insertIndex <= paragraphs.length) {
        this.lok.postUnoCommand(this.docPtr, ".uno:GoToEndOfDoc");
      }
      this.lok.postUnoCommand(this.docPtr, ".uno:InsertPara");
      const textArgs = JSON.stringify({
        Text: { type: "string", value: text }
      });
      this.lok.postUnoCommand(this.docPtr, ".uno:InsertText", textArgs);
      if (options?.style && options.style !== "Normal") {
        const styleMap = {
          "Heading 1": "Heading 1",
          "Heading 2": "Heading 2",
          "Heading 3": "Heading 3",
          "List": "List"
        };
        const styleName = styleMap[options.style];
        if (styleName) {
          const styleArgs = JSON.stringify({
            Template: { type: "string", value: styleName },
            Family: { type: "short", value: 2 }
            // Paragraph styles
          });
          this.lok.postUnoCommand(this.docPtr, ".uno:StyleApply", styleArgs);
        }
      }
      this.cachedParagraphs = null;
      const newParagraphs = this.getParagraphsInternal();
      const verified = newParagraphs.length > paragraphs.length;
      return {
        success: true,
        verified,
        data: { index: insertIndex }
      };
    } catch (error) {
      return this.createErrorResult(`Failed to insert paragraph: ${String(error)}`);
    }
  }
  replaceParagraph(index, text) {
    try {
      const paragraphs = this.getParagraphsInternal();
      if (index < 0 || index >= paragraphs.length) {
        return this.createErrorResult(
          `Paragraph index ${index} out of range`,
          `Valid range: 0-${paragraphs.length - 1}`
        );
      }
      const oldText = paragraphs[index];
      const findReplaceArgs = JSON.stringify({
        "SearchItem.SearchString": { type: "string", value: oldText },
        "SearchItem.ReplaceString": { type: "string", value: text },
        "SearchItem.Command": { type: "long", value: 2 }
        // Replace
      });
      this.lok.postUnoCommand(this.docPtr, ".uno:ExecuteSearch", findReplaceArgs);
      this.cachedParagraphs = null;
      return this.createResult({ oldText });
    } catch (error) {
      return this.createErrorResult(`Failed to replace paragraph: ${String(error)}`);
    }
  }
  deleteParagraph(index) {
    try {
      const paragraphs = this.getParagraphsInternal();
      if (index < 0 || index >= paragraphs.length) {
        return this.createErrorResult(
          `Paragraph index ${index} out of range`,
          `Valid range: 0-${paragraphs.length - 1}`
        );
      }
      const deletedText = paragraphs[index];
      const result = this.replaceParagraph(index, "");
      if (!result.success) {
        return this.createErrorResult(result.error || "Failed to delete");
      }
      return this.createResult({ deletedText });
    } catch (error) {
      return this.createErrorResult(`Failed to delete paragraph: ${String(error)}`);
    }
  }
  insertText(text, _position) {
    try {
      const textArgs = JSON.stringify({
        Text: { type: "string", value: text }
      });
      this.lok.postUnoCommand(this.docPtr, ".uno:InsertText", textArgs);
      this.cachedParagraphs = null;
      return this.createResult(void 0);
    } catch (error) {
      return this.createErrorResult(`Failed to insert text: ${String(error)}`);
    }
  }
  deleteText(_start, _end) {
    try {
      const selection = this.lok.getTextSelection(this.docPtr, "text/plain");
      this.lok.postUnoCommand(this.docPtr, ".uno:Delete");
      this.cachedParagraphs = null;
      return this.createResult({ deleted: selection || "" });
    } catch (error) {
      return this.createErrorResult(`Failed to delete text: ${String(error)}`);
    }
  }
  replaceText(find, replace, options) {
    try {
      const command = options?.all ? 3 : 2;
      const searchArgs = JSON.stringify({
        "SearchItem.SearchString": { type: "string", value: find },
        "SearchItem.ReplaceString": { type: "string", value: replace },
        "SearchItem.Command": { type: "long", value: command }
      });
      this.lok.postUnoCommand(this.docPtr, ".uno:ExecuteSearch", searchArgs);
      this.cachedParagraphs = null;
      return this.createResult({ replacements: -1 });
    } catch (error) {
      return this.createErrorResult(`Failed to replace text: ${String(error)}`);
    }
  }
  formatText(_range, format) {
    try {
      if (format.bold !== void 0) {
        this.lok.postUnoCommand(this.docPtr, ".uno:Bold");
      }
      if (format.italic !== void 0) {
        this.lok.postUnoCommand(this.docPtr, ".uno:Italic");
      }
      if (format.underline !== void 0) {
        this.lok.postUnoCommand(this.docPtr, ".uno:Underline");
      }
      if (format.fontSize !== void 0) {
        const args = JSON.stringify({
          FontHeight: { type: "float", value: format.fontSize }
        });
        this.lok.postUnoCommand(this.docPtr, ".uno:FontHeight", args);
      }
      if (format.fontName !== void 0) {
        const args = JSON.stringify({
          CharFontName: { type: "string", value: format.fontName }
        });
        this.lok.postUnoCommand(this.docPtr, ".uno:CharFontName", args);
      }
      return this.createResult(void 0);
    } catch (error) {
      return this.createErrorResult(`Failed to format text: ${String(error)}`);
    }
  }
  /**
   * Get the text formatting at the current selection or cursor position.
   *
   * Uses LOK callback mechanism to retrieve STATE_CHANGED events which contain
   * formatting state like `.uno:Bold=true`, `.uno:Italic=false`, etc.
   *
   * @param _position - Text position (currently unused, uses current selection)
   * @returns TextFormat with bold, italic, underline, fontSize, fontName properties
   */
  getFormat(_position) {
    try {
      this.lok.clearCallbackQueue();
      this.lok.postUnoCommand(this.docPtr, ".uno:CharRightSel");
      this.lok.flushCallbacks(this.docPtr);
      this.lok.postUnoCommand(this.docPtr, ".uno:CharLeft");
      this.lok.flushCallbacks(this.docPtr);
      const states = this.lok.pollStateChanges();
      const format = {};
      const boldState = states.get(".uno:Bold");
      if (boldState !== void 0) {
        format.bold = boldState === "true";
      }
      const italicState = states.get(".uno:Italic");
      if (italicState !== void 0) {
        format.italic = italicState === "true";
      }
      const underlineState = states.get(".uno:Underline");
      if (underlineState !== void 0) {
        format.underline = underlineState === "true";
      }
      const fontSizeState = states.get(".uno:FontHeight");
      if (fontSizeState !== void 0) {
        const size = parseFloat(fontSizeState);
        if (!isNaN(size)) {
          format.fontSize = size;
        }
      }
      const fontNameState = states.get(".uno:CharFontName");
      if (fontNameState !== void 0 && fontNameState.length > 0) {
        format.fontName = fontNameState;
      }
      return this.createResult(format);
    } catch (error) {
      return this.createErrorResult(`Failed to get format: ${String(error)}`);
    }
  }
  /**
   * Get formatting state for the current selection using the callback mechanism.
   * This is the preferred way to get character formatting as it uses LOK's
   * STATE_CHANGED callback events.
   *
   * @returns Map of UNO command names to their state values
   */
  getSelectionFormat() {
    try {
      const existingStates = this.lok.pollStateChanges();
      if (existingStates.size === 0) {
        this.lok.clearCallbackQueue();
        this.lok.postUnoCommand(this.docPtr, ".uno:SelectWord");
        this.lok.flushCallbacks(this.docPtr);
        const states = this.lok.pollStateChanges();
        return this.createResult(states);
      }
      return this.createResult(existingStates);
    } catch (error) {
      return this.createErrorResult(`Failed to get selection format: ${String(error)}`);
    }
  }
  // ============================================
  // Private helpers
  // ============================================
  getParagraphsInternal() {
    if (this.cachedParagraphs) {
      return this.cachedParagraphs;
    }
    const allText = this.lok.getAllText(this.docPtr);
    if (!allText) {
      return [];
    }
    this.cachedParagraphs = allText.split(/\n\n|\r\n\r\n/).map((p) => p.trim()).filter((p) => p.length > 0);
    return this.cachedParagraphs;
  }
};

// src/editor/calc.ts
var CalcEditor = class extends OfficeEditor {
  getDocumentType() {
    return "calc";
  }
  getStructure(_options) {
    try {
      const numSheets = this.lok.documentGetParts(this.docPtr);
      const sheets = [];
      for (let i = 0; i < numSheets; i++) {
        const name = this.lok.getPartName(this.docPtr, i) || `Sheet${i + 1}`;
        const dataArea = this.lok.getDataArea(this.docPtr, i);
        sheets.push({
          index: i,
          name,
          usedRange: dataArea.col > 0 && dataArea.row > 0 ? `A1:${this.rowColToA1(dataArea.row - 1, dataArea.col - 1)}` : "A1",
          rowCount: dataArea.row,
          colCount: dataArea.col
        });
      }
      const structure = {
        type: "calc",
        sheets
      };
      return this.createResult(structure);
    } catch (error) {
      return this.createErrorResult(`Failed to get structure: ${String(error)}`);
    }
  }
  getSheetNames() {
    try {
      const numSheets = this.lok.documentGetParts(this.docPtr);
      const names = [];
      for (let i = 0; i < numSheets; i++) {
        const name = this.lok.getPartName(this.docPtr, i) || `Sheet${i + 1}`;
        names.push(name);
      }
      return this.createResult(names);
    } catch (error) {
      return this.createErrorResult(`Failed to get sheet names: ${String(error)}`);
    }
  }
  // ============================================
  // Cell reading
  // ============================================
  getCell(cell, sheet) {
    try {
      this.selectSheet(sheet);
      const { row, col } = this.normalizeCellRef(cell);
      const address = this.rowColToA1(row, col);
      this.goToCell(address);
      const value = this.getCellValueInternal();
      const formula = this.getCellFormulaInternal();
      return this.createResult({
        address,
        value,
        formula: formula || void 0
      });
    } catch (error) {
      return this.createErrorResult(`Failed to get cell: ${String(error)}`);
    }
  }
  getCells(range, sheet, options) {
    try {
      this.selectSheet(sheet);
      const { startRow, startCol, endRow, endCol } = this.normalizeRangeRef(range);
      const maxChars = options?.maxResponseChars ?? this.options.maxResponseChars;
      const cells = [];
      let charCount = 0;
      let truncated = false;
      for (let r = startRow; r <= endRow && !truncated; r++) {
        const rowData = [];
        for (let c = startCol; c <= endCol && !truncated; c++) {
          const address = this.rowColToA1(r, c);
          this.goToCell(address);
          const value = this.getCellValueInternal();
          const cellData = { address, value };
          const cellStr = JSON.stringify(cellData);
          if (charCount + cellStr.length > maxChars) {
            truncated = true;
            break;
          }
          charCount += cellStr.length;
          rowData.push(cellData);
        }
        if (rowData.length > 0) {
          cells.push(rowData);
        }
      }
      if (truncated) {
        return this.createResultWithTruncation(cells, {
          original: (endRow - startRow + 1) * (endCol - startCol + 1),
          returned: cells.reduce((sum, row) => sum + row.length, 0),
          message: "Range truncated due to size. Use smaller ranges to paginate."
        });
      }
      return this.createResult(cells);
    } catch (error) {
      return this.createErrorResult(`Failed to get cells: ${String(error)}`);
    }
  }
  // ============================================
  // Cell writing
  // ============================================
  setCellValue(cell, value, sheet) {
    try {
      this.selectSheet(sheet);
      const { row, col } = this.normalizeCellRef(cell);
      const address = this.rowColToA1(row, col);
      this.goToCell(address);
      const oldValue = this.getCellValueInternal();
      const valueStr = typeof value === "number" ? value.toString() : value;
      const args = JSON.stringify({
        StringName: { type: "string", value: valueStr }
      });
      this.lok.postUnoCommand(this.docPtr, ".uno:EnterString", args);
      const newValue = this.getCellValueInternal();
      const expectedStr = typeof value === "number" ? value.toString() : value;
      const verified = newValue === expectedStr || newValue === value;
      return {
        success: true,
        verified,
        data: { oldValue, newValue }
      };
    } catch (error) {
      return this.createErrorResult(`Failed to set cell value: ${String(error)}`);
    }
  }
  setCellFormula(cell, formula, sheet) {
    try {
      this.selectSheet(sheet);
      const { row, col } = this.normalizeCellRef(cell);
      const address = this.rowColToA1(row, col);
      this.goToCell(address);
      const args = JSON.stringify({
        StringName: { type: "string", value: formula }
      });
      this.lok.postUnoCommand(this.docPtr, ".uno:EnterString", args);
      const calculatedValue = this.getCellValueInternal();
      return this.createResult({ calculatedValue });
    } catch (error) {
      return this.createErrorResult(`Failed to set formula: ${String(error)}`);
    }
  }
  setCells(range, values, sheet) {
    try {
      this.selectSheet(sheet);
      const { startRow, startCol } = this.normalizeRangeRef(range);
      let cellsUpdated = 0;
      for (let r = 0; r < values.length; r++) {
        const rowValues = values[r];
        if (!rowValues) continue;
        for (let c = 0; c < rowValues.length; c++) {
          const value = rowValues[c];
          if (value === null || value === void 0) continue;
          const address = this.rowColToA1(startRow + r, startCol + c);
          this.goToCell(address);
          const valueStr = typeof value === "number" ? value.toString() : String(value);
          const args = JSON.stringify({
            StringName: { type: "string", value: valueStr }
          });
          this.lok.postUnoCommand(this.docPtr, ".uno:EnterString", args);
          cellsUpdated++;
        }
      }
      return this.createResult({ cellsUpdated });
    } catch (error) {
      return this.createErrorResult(`Failed to set cells: ${String(error)}`);
    }
  }
  // ============================================
  // Clear operations
  // ============================================
  clearCell(cell, sheet) {
    try {
      this.selectSheet(sheet);
      const { row, col } = this.normalizeCellRef(cell);
      const address = this.rowColToA1(row, col);
      this.goToCell(address);
      const oldValue = this.getCellValueInternal();
      this.lok.postUnoCommand(this.docPtr, ".uno:ClearContents");
      return this.createResult({ oldValue });
    } catch (error) {
      return this.createErrorResult(`Failed to clear cell: ${String(error)}`);
    }
  }
  clearRange(range, sheet) {
    try {
      this.selectSheet(sheet);
      const rangeStr = this.normalizeRangeToString(range);
      this.goToCell(rangeStr);
      this.lok.postUnoCommand(this.docPtr, ".uno:ClearContents");
      const { startRow, startCol, endRow, endCol } = this.normalizeRangeRef(range);
      const cellsCleared = (endRow - startRow + 1) * (endCol - startCol + 1);
      return this.createResult({ cellsCleared });
    } catch (error) {
      return this.createErrorResult(`Failed to clear range: ${String(error)}`);
    }
  }
  // ============================================
  // Row/Column operations
  // ============================================
  insertRow(afterRow, sheet) {
    try {
      this.selectSheet(sheet);
      this.goToCell(this.rowColToA1(afterRow + 1, 0));
      this.lok.postUnoCommand(this.docPtr, ".uno:InsertRows");
      return this.createResult(void 0);
    } catch (error) {
      return this.createErrorResult(`Failed to insert row: ${String(error)}`);
    }
  }
  insertColumn(afterCol, sheet) {
    try {
      this.selectSheet(sheet);
      const colNum = typeof afterCol === "string" ? this.a1ToRowCol(afterCol + "1").col + 1 : afterCol + 1;
      this.goToCell(this.rowColToA1(0, colNum));
      this.lok.postUnoCommand(this.docPtr, ".uno:InsertColumns");
      return this.createResult(void 0);
    } catch (error) {
      return this.createErrorResult(`Failed to insert column: ${String(error)}`);
    }
  }
  deleteRow(row, sheet) {
    try {
      this.selectSheet(sheet);
      this.goToCell(this.rowColToA1(row, 0));
      this.lok.postUnoCommand(this.docPtr, ".uno:DeleteRows");
      return this.createResult(void 0);
    } catch (error) {
      return this.createErrorResult(`Failed to delete row: ${String(error)}`);
    }
  }
  deleteColumn(col, sheet) {
    try {
      this.selectSheet(sheet);
      const colNum = typeof col === "string" ? this.a1ToRowCol(col + "1").col : col;
      this.goToCell(this.rowColToA1(0, colNum));
      this.lok.postUnoCommand(this.docPtr, ".uno:DeleteColumns");
      return this.createResult(void 0);
    } catch (error) {
      return this.createErrorResult(`Failed to delete column: ${String(error)}`);
    }
  }
  // ============================================
  // Formatting
  // ============================================
  formatCells(range, format, sheet) {
    try {
      this.selectSheet(sheet);
      const rangeStr = this.normalizeRangeToString(range);
      this.goToCell(rangeStr);
      if (format.bold !== void 0) {
        this.lok.postUnoCommand(this.docPtr, ".uno:Bold");
      }
      if (format.numberFormat !== void 0) {
        const args = JSON.stringify({
          NumberFormatValue: { type: "string", value: format.numberFormat }
        });
        this.lok.postUnoCommand(this.docPtr, ".uno:NumberFormatValue", args);
      }
      if (format.backgroundColor !== void 0) {
        const args = JSON.stringify({
          BackgroundColor: { type: "long", value: this.hexToNumber(format.backgroundColor) }
        });
        this.lok.postUnoCommand(this.docPtr, ".uno:BackgroundColor", args);
      }
      return this.createResult(void 0);
    } catch (error) {
      return this.createErrorResult(`Failed to format cells: ${String(error)}`);
    }
  }
  // ============================================
  // Sheet management
  // ============================================
  addSheet(name) {
    try {
      const args = JSON.stringify({
        Name: { type: "string", value: name }
      });
      this.lok.postUnoCommand(this.docPtr, ".uno:Insert", args);
      const numSheets = this.lok.documentGetParts(this.docPtr);
      return this.createResult({ index: numSheets - 1 });
    } catch (error) {
      return this.createErrorResult(`Failed to add sheet: ${String(error)}`);
    }
  }
  renameSheet(sheet, newName) {
    try {
      this.selectSheet(sheet);
      const args = JSON.stringify({
        Name: { type: "string", value: newName }
      });
      this.lok.postUnoCommand(this.docPtr, ".uno:RenameTable", args);
      return this.createResult(void 0);
    } catch (error) {
      return this.createErrorResult(`Failed to rename sheet: ${String(error)}`);
    }
  }
  deleteSheet(sheet) {
    try {
      this.selectSheet(sheet);
      this.lok.postUnoCommand(this.docPtr, ".uno:Remove");
      return this.createResult(void 0);
    } catch (error) {
      return this.createErrorResult(`Failed to delete sheet: ${String(error)}`);
    }
  }
  // ============================================
  // Private helpers
  // ============================================
  selectSheet(sheet) {
    if (sheet === void 0) return;
    const index = typeof sheet === "number" ? sheet : this.getSheetIndexByName(sheet);
    if (index >= 0) {
      this.lok.documentSetPart(this.docPtr, index);
    }
  }
  getSheetIndexByName(name) {
    const numSheets = this.lok.documentGetParts(this.docPtr);
    for (let i = 0; i < numSheets; i++) {
      if (this.lok.getPartName(this.docPtr, i) === name) {
        return i;
      }
    }
    return -1;
  }
  goToCell(address) {
    const args = JSON.stringify({
      ToPoint: { type: "string", value: address }
    });
    this.lok.postUnoCommand(this.docPtr, ".uno:GoToCell", args);
  }
  getCellValueInternal() {
    const text = this.lok.getTextSelection(this.docPtr, "text/plain");
    if (!text) return null;
    const num = parseFloat(text);
    if (!isNaN(num) && text.trim() === num.toString()) {
      return num;
    }
    if (text.toLowerCase() === "true") return true;
    if (text.toLowerCase() === "false") return false;
    return text;
  }
  getCellFormulaInternal() {
    const result = this.lok.getCommandValues(this.docPtr, ".uno:GetFormulaBarText");
    if (!result) return null;
    try {
      const parsed = JSON.parse(result);
      return parsed.value ?? null;
    } catch {
      return null;
    }
  }
  normalizeRangeRef(range) {
    if (typeof range === "string") {
      const parts = range.split(":");
      const start2 = this.a1ToRowCol(parts[0]);
      const end2 = parts[1] ? this.a1ToRowCol(parts[1]) : start2;
      return {
        startRow: start2.row,
        startCol: start2.col,
        endRow: end2.row,
        endCol: end2.col
      };
    }
    const start = this.normalizeCellRef(range.start);
    const end = this.normalizeCellRef(range.end);
    return {
      startRow: start.row,
      startCol: start.col,
      endRow: end.row,
      endCol: end.col
    };
  }
  normalizeRangeToString(range) {
    if (typeof range === "string") return range;
    const start = this.normalizeCellRef(range.start);
    const end = this.normalizeCellRef(range.end);
    return `${this.rowColToA1(start.row, start.col)}:${this.rowColToA1(end.row, end.col)}`;
  }
  hexToNumber(hex) {
    return parseInt(hex.replace("#", ""), 16);
  }
};

// src/editor/impress.ts
var ImpressEditor = class extends OfficeEditor {
  getDocumentType() {
    return "impress";
  }
  getStructure(_options) {
    try {
      const numSlides = this.lok.documentGetParts(this.docPtr);
      const slides = [];
      for (let i = 0; i < numSlides; i++) {
        const slideData = this.getSlideInfoInternal(i);
        slides.push(slideData);
      }
      const structure = {
        type: "impress",
        slides,
        slideCount: numSlides
      };
      return this.createResult(structure);
    } catch (error) {
      return this.createErrorResult(`Failed to get structure: ${String(error)}`);
    }
  }
  // ============================================
  // Slide reading
  // ============================================
  getSlide(index) {
    try {
      const numSlides = this.lok.documentGetParts(this.docPtr);
      if (index < 0 || index >= numSlides) {
        return this.createErrorResult(
          `Invalid slide index: ${index}. Valid range: 0-${numSlides - 1}`,
          "Use getStructure() to see available slides"
        );
      }
      this.lok.documentSetPart(this.docPtr, index);
      const text = this.lok.getAllText(this.docPtr) || "";
      const textFrames = this.parseTextFrames(text);
      const slideData = {
        index,
        title: textFrames.find((f) => f.type === "title")?.text,
        textFrames,
        hasNotes: false
        // Could detect from LOK if available
      };
      return this.createResult(slideData);
    } catch (error) {
      return this.createErrorResult(`Failed to get slide: ${String(error)}`);
    }
  }
  getSlideCount() {
    try {
      const count = this.lok.documentGetParts(this.docPtr);
      return this.createResult(count);
    } catch (error) {
      return this.createErrorResult(`Failed to get slide count: ${String(error)}`);
    }
  }
  // ============================================
  // Slide management
  // ============================================
  addSlide(options) {
    try {
      const numSlides = this.lok.documentGetParts(this.docPtr);
      if (options?.afterSlide !== void 0) {
        this.lok.documentSetPart(this.docPtr, options.afterSlide);
      } else {
        this.lok.documentSetPart(this.docPtr, numSlides - 1);
      }
      this.lok.postUnoCommand(this.docPtr, ".uno:InsertPage");
      if (options?.layout) {
        this.applySlideLayout(options.layout);
      }
      const newIndex = options?.afterSlide !== void 0 ? options.afterSlide + 1 : numSlides;
      const newNumSlides = this.lok.documentGetParts(this.docPtr);
      const verified = newNumSlides > numSlides;
      return {
        success: true,
        verified,
        data: { index: newIndex }
      };
    } catch (error) {
      return this.createErrorResult(`Failed to add slide: ${String(error)}`);
    }
  }
  deleteSlide(index) {
    try {
      const numSlides = this.lok.documentGetParts(this.docPtr);
      if (numSlides <= 1) {
        return this.createErrorResult(
          "Cannot delete the last slide",
          "A presentation must have at least one slide"
        );
      }
      if (index < 0 || index >= numSlides) {
        return this.createErrorResult(
          `Invalid slide index: ${index}`,
          `Valid range: 0-${numSlides - 1}`
        );
      }
      this.lok.documentSetPart(this.docPtr, index);
      this.lok.postUnoCommand(this.docPtr, ".uno:DeletePage");
      return this.createResult(void 0);
    } catch (error) {
      return this.createErrorResult(`Failed to delete slide: ${String(error)}`);
    }
  }
  duplicateSlide(index) {
    try {
      const numSlides = this.lok.documentGetParts(this.docPtr);
      if (index < 0 || index >= numSlides) {
        return this.createErrorResult(
          `Invalid slide index: ${index}`,
          `Valid range: 0-${numSlides - 1}`
        );
      }
      this.lok.documentSetPart(this.docPtr, index);
      this.lok.postUnoCommand(this.docPtr, ".uno:DuplicatePage");
      return this.createResult({ newIndex: index + 1 });
    } catch (error) {
      return this.createErrorResult(`Failed to duplicate slide: ${String(error)}`);
    }
  }
  moveSlide(fromIndex, toIndex) {
    try {
      const numSlides = this.lok.documentGetParts(this.docPtr);
      if (fromIndex < 0 || fromIndex >= numSlides || toIndex < 0 || toIndex >= numSlides) {
        return this.createErrorResult(
          `Invalid slide indices. Valid range: 0-${numSlides - 1}`,
          "Check slide indices are within bounds"
        );
      }
      if (fromIndex === toIndex) {
        return this.createErrorResult(
          "Source and destination are the same",
          "Provide different indices to move"
        );
      }
      this.lok.documentSetPart(this.docPtr, fromIndex);
      const args = JSON.stringify({
        Position: { type: "long", value: toIndex }
      });
      this.lok.postUnoCommand(this.docPtr, ".uno:MovePageFirst", args);
      return this.createResult(void 0);
    } catch (error) {
      return this.createErrorResult(`Failed to move slide: ${String(error)}`);
    }
  }
  // ============================================
  // Slide content editing
  // ============================================
  setSlideTitle(index, title) {
    try {
      const numSlides = this.lok.documentGetParts(this.docPtr);
      if (index < 0 || index >= numSlides) {
        return this.createErrorResult(`Invalid slide index: ${index}`);
      }
      this.lok.documentSetPart(this.docPtr, index);
      const text = this.lok.getAllText(this.docPtr) || "";
      const frames = this.parseTextFrames(text);
      const oldTitle = frames.find((f) => f.type === "title")?.text;
      this.lok.postUnoCommand(this.docPtr, ".uno:SelectAll");
      const args = JSON.stringify({
        Text: { type: "string", value: title }
      });
      this.lok.postUnoCommand(this.docPtr, ".uno:InsertText", args);
      return this.createResult({ oldTitle });
    } catch (error) {
      return this.createErrorResult(`Failed to set slide title: ${String(error)}`);
    }
  }
  setSlideBody(index, body) {
    try {
      const numSlides = this.lok.documentGetParts(this.docPtr);
      if (index < 0 || index >= numSlides) {
        return this.createErrorResult(`Invalid slide index: ${index}`);
      }
      this.lok.documentSetPart(this.docPtr, index);
      const text = this.lok.getAllText(this.docPtr) || "";
      const frames = this.parseTextFrames(text);
      const oldBody = frames.find((f) => f.type === "body")?.text;
      this.lok.postUnoCommand(this.docPtr, ".uno:NextObject");
      const args = JSON.stringify({
        Text: { type: "string", value: body }
      });
      this.lok.postUnoCommand(this.docPtr, ".uno:InsertText", args);
      return this.createResult({ oldBody });
    } catch (error) {
      return this.createErrorResult(`Failed to set slide body: ${String(error)}`);
    }
  }
  setSlideNotes(index, notes) {
    try {
      const numSlides = this.lok.documentGetParts(this.docPtr);
      if (index < 0 || index >= numSlides) {
        return this.createErrorResult(`Invalid slide index: ${index}`);
      }
      this.lok.documentSetPart(this.docPtr, index);
      this.lok.postUnoCommand(this.docPtr, ".uno:NotesMode");
      const args = JSON.stringify({
        Text: { type: "string", value: notes }
      });
      this.lok.postUnoCommand(this.docPtr, ".uno:InsertText", args);
      this.lok.postUnoCommand(this.docPtr, ".uno:NormalViewMode");
      return this.createResult(void 0);
    } catch (error) {
      return this.createErrorResult(`Failed to set slide notes: ${String(error)}`);
    }
  }
  // ============================================
  // Slide layout
  // ============================================
  setSlideLayout(index, layout) {
    try {
      const numSlides = this.lok.documentGetParts(this.docPtr);
      if (index < 0 || index >= numSlides) {
        return this.createErrorResult(`Invalid slide index: ${index}`);
      }
      this.lok.documentSetPart(this.docPtr, index);
      this.applySlideLayout(layout);
      return this.createResult(void 0);
    } catch (error) {
      return this.createErrorResult(`Failed to set slide layout: ${String(error)}`);
    }
  }
  // ============================================
  // Private helpers
  // ============================================
  getSlideInfoInternal(index) {
    this.lok.documentSetPart(this.docPtr, index);
    const text = this.lok.getAllText(this.docPtr) || "";
    const frames = this.parseTextFrames(text);
    const titleFrame = frames.find((f) => f.type === "title");
    return {
      index,
      title: titleFrame?.text,
      layout: this.detectLayout(frames),
      textFrameCount: frames.length
    };
  }
  parseTextFrames(text) {
    const paragraphs = text.split(/\n\n+/).filter((p) => p.trim());
    const frames = [];
    paragraphs.forEach((para, idx) => {
      const type = idx === 0 ? "title" : idx === 1 ? "body" : "other";
      frames.push({
        index: idx,
        type,
        text: para.trim(),
        bounds: { x: 0, y: 0, width: 0, height: 0 }
        // Would need LOK API for actual bounds
      });
    });
    return frames;
  }
  detectLayout(frames) {
    if (frames.length === 0) return "blank";
    if (frames.length === 1 && frames[0]?.type === "title") return "title";
    if (frames.length >= 2) return "titleContent";
    return "blank";
  }
  applySlideLayout(layout) {
    const layoutMap = {
      blank: 0,
      title: 1,
      titleContent: 2,
      twoColumn: 3
    };
    const layoutId = layoutMap[layout] ?? 0;
    const args = JSON.stringify({
      WhatLayout: { type: "long", value: layoutId }
    });
    this.lok.postUnoCommand(this.docPtr, ".uno:AssignLayout", args);
  }
};

// src/editor/draw.ts
var DrawEditor = class extends OfficeEditor {
  isImportedPdf = false;
  getDocumentType() {
    return "draw";
  }
  setImportedPdf(value) {
    this.isImportedPdf = value;
  }
  getStructure(_options) {
    try {
      const numPages = this.lok.documentGetParts(this.docPtr);
      const pages = [];
      for (let i = 0; i < numPages; i++) {
        const pageInfo = this.getPageInfoInternal(i);
        pages.push(pageInfo);
      }
      const structure = {
        type: "draw",
        pages,
        pageCount: numPages,
        isImportedPdf: this.isImportedPdf
      };
      return this.createResult(structure);
    } catch (error) {
      return this.createErrorResult(`Failed to get structure: ${String(error)}`);
    }
  }
  // ============================================
  // Page reading
  // ============================================
  getPage(index) {
    try {
      const numPages = this.lok.documentGetParts(this.docPtr);
      if (index < 0 || index >= numPages) {
        return this.createErrorResult(
          `Invalid page index: ${index}. Valid range: 0-${numPages - 1}`,
          "Use getStructure() to see available pages"
        );
      }
      this.lok.documentSetPart(this.docPtr, index);
      const size = this.lok.documentGetDocumentSize(this.docPtr);
      const shapes = this.getShapesOnPage();
      const pageData = {
        index,
        shapes,
        size: { width: size.width, height: size.height }
      };
      return this.createResult(pageData);
    } catch (error) {
      return this.createErrorResult(`Failed to get page: ${String(error)}`);
    }
  }
  getPageCount() {
    try {
      const count = this.lok.documentGetParts(this.docPtr);
      return this.createResult(count);
    } catch (error) {
      return this.createErrorResult(`Failed to get page count: ${String(error)}`);
    }
  }
  // ============================================
  // Page management
  // ============================================
  addPage(options) {
    try {
      const numPages = this.lok.documentGetParts(this.docPtr);
      if (options?.afterPage !== void 0) {
        this.lok.documentSetPart(this.docPtr, options.afterPage);
      } else {
        this.lok.documentSetPart(this.docPtr, numPages - 1);
      }
      this.lok.postUnoCommand(this.docPtr, ".uno:InsertPage");
      const newIndex = options?.afterPage !== void 0 ? options.afterPage + 1 : numPages;
      return this.createResult({ index: newIndex });
    } catch (error) {
      return this.createErrorResult(`Failed to add page: ${String(error)}`);
    }
  }
  deletePage(index) {
    try {
      const numPages = this.lok.documentGetParts(this.docPtr);
      if (numPages <= 1) {
        return this.createErrorResult(
          "Cannot delete the last page",
          "A drawing document must have at least one page"
        );
      }
      if (index < 0 || index >= numPages) {
        return this.createErrorResult(
          `Invalid page index: ${index}`,
          `Valid range: 0-${numPages - 1}`
        );
      }
      this.lok.documentSetPart(this.docPtr, index);
      this.lok.postUnoCommand(this.docPtr, ".uno:DeletePage");
      return this.createResult(void 0);
    } catch (error) {
      return this.createErrorResult(`Failed to delete page: ${String(error)}`);
    }
  }
  duplicatePage(index) {
    try {
      const numPages = this.lok.documentGetParts(this.docPtr);
      if (index < 0 || index >= numPages) {
        return this.createErrorResult(
          `Invalid page index: ${index}`,
          `Valid range: 0-${numPages - 1}`
        );
      }
      this.lok.documentSetPart(this.docPtr, index);
      this.lok.postUnoCommand(this.docPtr, ".uno:DuplicatePage");
      return this.createResult({ newIndex: index + 1 });
    } catch (error) {
      return this.createErrorResult(`Failed to duplicate page: ${String(error)}`);
    }
  }
  // ============================================
  // Shape operations
  // ============================================
  addShape(pageIndex, shapeType, bounds, options) {
    try {
      const numPages = this.lok.documentGetParts(this.docPtr);
      if (pageIndex < 0 || pageIndex >= numPages) {
        return this.createErrorResult(`Invalid page index: ${pageIndex}`);
      }
      this.lok.documentSetPart(this.docPtr, pageIndex);
      const shapeCommand = this.getShapeCommand(shapeType);
      const boundsArgs = JSON.stringify({
        X: { type: "long", value: bounds.x },
        Y: { type: "long", value: bounds.y },
        Width: { type: "long", value: bounds.width },
        Height: { type: "long", value: bounds.height }
      });
      this.lok.postUnoCommand(this.docPtr, shapeCommand, boundsArgs);
      if (options?.text) {
        const textArgs = JSON.stringify({
          Text: { type: "string", value: options.text }
        });
        this.lok.postUnoCommand(this.docPtr, ".uno:InsertText", textArgs);
      }
      if (options?.fillColor) {
        const colorArgs = JSON.stringify({
          FillColor: { type: "long", value: this.hexToNumber(options.fillColor) }
        });
        this.lok.postUnoCommand(this.docPtr, ".uno:FillColor", colorArgs);
      }
      if (options?.lineColor) {
        const colorArgs = JSON.stringify({
          LineColor: { type: "long", value: this.hexToNumber(options.lineColor) }
        });
        this.lok.postUnoCommand(this.docPtr, ".uno:XLineColor", colorArgs);
      }
      return this.createResult({ shapeIndex: 0 });
    } catch (error) {
      return this.createErrorResult(`Failed to add shape: ${String(error)}`);
    }
  }
  addLine(pageIndex, start, end, options) {
    try {
      const numPages = this.lok.documentGetParts(this.docPtr);
      if (pageIndex < 0 || pageIndex >= numPages) {
        return this.createErrorResult(`Invalid page index: ${pageIndex}`);
      }
      this.lok.documentSetPart(this.docPtr, pageIndex);
      const args = JSON.stringify({
        StartX: { type: "long", value: start.x },
        StartY: { type: "long", value: start.y },
        EndX: { type: "long", value: end.x },
        EndY: { type: "long", value: end.y }
      });
      this.lok.postUnoCommand(this.docPtr, ".uno:Line", args);
      if (options?.lineColor) {
        const colorArgs = JSON.stringify({
          LineColor: { type: "long", value: this.hexToNumber(options.lineColor) }
        });
        this.lok.postUnoCommand(this.docPtr, ".uno:XLineColor", colorArgs);
      }
      if (options?.lineWidth) {
        const widthArgs = JSON.stringify({
          LineWidth: { type: "long", value: options.lineWidth }
        });
        this.lok.postUnoCommand(this.docPtr, ".uno:LineWidth", widthArgs);
      }
      return this.createResult({ shapeIndex: 0 });
    } catch (error) {
      return this.createErrorResult(`Failed to add line: ${String(error)}`);
    }
  }
  deleteShape(pageIndex, shapeIndex) {
    try {
      this.lok.documentSetPart(this.docPtr, pageIndex);
      this.selectShape(shapeIndex);
      this.lok.postUnoCommand(this.docPtr, ".uno:Delete");
      return this.createResult(void 0);
    } catch (error) {
      return this.createErrorResult(`Failed to delete shape: ${String(error)}`);
    }
  }
  setShapeText(pageIndex, shapeIndex, text) {
    try {
      this.lok.documentSetPart(this.docPtr, pageIndex);
      this.selectShape(shapeIndex);
      this.lok.postUnoCommand(this.docPtr, ".uno:EnterGroup");
      this.lok.postUnoCommand(this.docPtr, ".uno:SelectAll");
      const args = JSON.stringify({
        Text: { type: "string", value: text }
      });
      this.lok.postUnoCommand(this.docPtr, ".uno:InsertText", args);
      this.lok.postUnoCommand(this.docPtr, ".uno:LeaveGroup");
      return this.createResult(void 0);
    } catch (error) {
      return this.createErrorResult(`Failed to set shape text: ${String(error)}`);
    }
  }
  moveShape(pageIndex, shapeIndex, newPosition) {
    try {
      this.lok.documentSetPart(this.docPtr, pageIndex);
      this.selectShape(shapeIndex);
      const args = JSON.stringify({
        X: { type: "long", value: newPosition.x },
        Y: { type: "long", value: newPosition.y }
      });
      this.lok.postUnoCommand(this.docPtr, ".uno:SetObjectPosition", args);
      return this.createResult(void 0);
    } catch (error) {
      return this.createErrorResult(`Failed to move shape: ${String(error)}`);
    }
  }
  resizeShape(pageIndex, shapeIndex, newSize) {
    try {
      this.lok.documentSetPart(this.docPtr, pageIndex);
      this.selectShape(shapeIndex);
      const args = JSON.stringify({
        Width: { type: "long", value: newSize.width },
        Height: { type: "long", value: newSize.height }
      });
      this.lok.postUnoCommand(this.docPtr, ".uno:Size", args);
      return this.createResult(void 0);
    } catch (error) {
      return this.createErrorResult(`Failed to resize shape: ${String(error)}`);
    }
  }
  // ============================================
  // Private helpers
  // ============================================
  getPageInfoInternal(index) {
    this.lok.documentSetPart(this.docPtr, index);
    const size = this.lok.documentGetDocumentSize(this.docPtr);
    const shapes = this.getShapesOnPage();
    return {
      index,
      shapeCount: shapes.length,
      size: { width: size.width, height: size.height }
    };
  }
  getShapesOnPage() {
    const text = this.lok.getAllText(this.docPtr) || "";
    if (!text.trim()) {
      return [];
    }
    return [{
      index: 0,
      type: "text",
      text,
      bounds: { x: 0, y: 0, width: 0, height: 0 }
    }];
  }
  selectShape(shapeIndex) {
    const args = JSON.stringify({
      Index: { type: "long", value: shapeIndex }
    });
    this.lok.postUnoCommand(this.docPtr, ".uno:SelectObject", args);
  }
  getShapeCommand(shapeType) {
    const commands = {
      rectangle: ".uno:Rect",
      ellipse: ".uno:Ellipse",
      line: ".uno:Line",
      text: ".uno:Text",
      image: ".uno:InsertGraphic",
      group: ".uno:FormatGroup",
      other: ".uno:Rect"
      // Default to rectangle
    };
    return commands[shapeType];
  }
  hexToNumber(hex) {
    return parseInt(hex.replace("#", ""), 16);
  }
};
var TextPositionSchema = z.object({
  paragraph: z.number().int().min(0).describe("Zero-based paragraph index"),
  character: z.number().int().min(0).describe("Zero-based character offset within the paragraph")
});
var TextRangeSchema = z.object({
  start: TextPositionSchema.describe("Start position of the range"),
  end: TextPositionSchema.describe("End position of the range")
});
var TextFormatSchema = z.object({
  bold: z.boolean().optional().describe("Apply bold formatting"),
  italic: z.boolean().optional().describe("Apply italic formatting"),
  underline: z.boolean().optional().describe("Apply underline formatting"),
  fontSize: z.number().positive().optional().describe("Font size in points"),
  fontName: z.string().optional().describe('Font family name (e.g., "Arial", "Times New Roman")'),
  color: z.string().optional().describe('Text color as hex string (e.g., "#FF0000")')
});
var CellRefSchema = z.union([
  z.string().describe('A1-style cell reference (e.g., "A1", "B5", "AA100")'),
  z.object({
    row: z.number().int().min(0).describe("Zero-based row index"),
    col: z.number().int().min(0).describe("Zero-based column index")
  })
]);
var RangeRefSchema = z.union([
  z.string().describe('A1-style range (e.g., "A1:B10", "C5:D20")'),
  z.object({
    start: CellRefSchema.describe("Start cell of the range"),
    end: CellRefSchema.describe("End cell of the range")
  })
]);
var SheetRefSchema = z.union([
  z.string().describe("Sheet name"),
  z.number().int().min(0).describe("Zero-based sheet index")
]);
var CellValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null()
]).describe("Cell value: string, number, boolean, or null");
var CellFormatSchema = z.object({
  bold: z.boolean().optional().describe("Apply bold formatting"),
  numberFormat: z.string().optional().describe('Number format string (e.g., "#,##0.00", "0%")'),
  backgroundColor: z.string().optional().describe("Background color as hex string"),
  textColor: z.string().optional().describe("Text color as hex string")
});
var SlideLayoutSchema = z.enum(["blank", "title", "titleContent", "twoColumn"]).describe("Slide layout type");
var ShapeTypeSchema = z.enum(["rectangle", "ellipse", "line", "text", "image", "group", "other"]).describe("Type of shape to create");
var RectangleSchema = z.object({
  x: z.number().describe("X position in twips"),
  y: z.number().describe("Y position in twips"),
  width: z.number().positive().describe("Width in twips"),
  height: z.number().positive().describe("Height in twips")
});
var PositionSchema = z.object({
  x: z.number().describe("X position in twips"),
  y: z.number().describe("Y position in twips")
});
var SizeSchema = z.object({
  width: z.number().positive().describe("Width in twips"),
  height: z.number().positive().describe("Height in twips")
});
var OutputFormatSchema = z.enum([
  "pdf",
  "docx",
  "doc",
  "odt",
  "rtf",
  "txt",
  "html",
  "xlsx",
  "xls",
  "ods",
  "csv",
  "pptx",
  "ppt",
  "odp",
  "png",
  "jpg",
  "svg"
]).describe("Output file format");
var commonTools = {
  // Document Structure
  getStructure: {
    name: "getStructure",
    description: "Get the document structure including paragraphs, sheets, slides, or pages depending on document type. Returns an overview of the document content.",
    parameters: z.object({
      maxResponseChars: z.number().int().positive().optional().describe("Maximum characters to return (default: 8000). Use for large documents.")
    }),
    documentTypes: ["all"]
  },
  // Lifecycle
  save: {
    name: "save",
    description: "Save changes to the document at its original path.",
    parameters: z.object({}),
    documentTypes: ["all"]
  },
  saveAs: {
    name: "saveAs",
    description: "Save the document to a new path with optional format conversion.",
    parameters: z.object({
      path: z.string().describe("Output file path"),
      format: OutputFormatSchema
    }),
    documentTypes: ["all"]
  },
  close: {
    name: "close",
    description: "Close the document and release resources.",
    parameters: z.object({}),
    documentTypes: ["all"]
  },
  // History
  undo: {
    name: "undo",
    description: "Undo the last edit operation.",
    parameters: z.object({}),
    documentTypes: ["all"]
  },
  redo: {
    name: "redo",
    description: "Redo the previously undone operation.",
    parameters: z.object({}),
    documentTypes: ["all"]
  },
  // Search
  find: {
    name: "find",
    description: "Find text in the document. Returns match count and position of first match.",
    parameters: z.object({
      text: z.string().min(1).describe("Text to search for"),
      caseSensitive: z.boolean().optional().describe("Match case exactly"),
      wholeWord: z.boolean().optional().describe("Match whole words only")
    }),
    documentTypes: ["all"]
  },
  findAndReplaceAll: {
    name: "findAndReplaceAll",
    description: "Find all occurrences of text and replace them.",
    parameters: z.object({
      find: z.string().min(1).describe("Text to find"),
      replace: z.string().describe("Replacement text"),
      caseSensitive: z.boolean().optional().describe("Match case exactly"),
      wholeWord: z.boolean().optional().describe("Match whole words only")
    }),
    documentTypes: ["all"]
  },
  // Selection
  getSelection: {
    name: "getSelection",
    description: "Get the currently selected text or range.",
    parameters: z.object({}),
    documentTypes: ["all"]
  },
  clearSelection: {
    name: "clearSelection",
    description: "Clear the current selection.",
    parameters: z.object({}),
    documentTypes: ["all"]
  },
  // Edit mode
  enableEditMode: {
    name: "enableEditMode",
    description: "Enable edit mode for the document. Required before making changes.",
    parameters: z.object({}),
    documentTypes: ["all"]
  },
  getEditMode: {
    name: "getEditMode",
    description: "Get the current edit mode (0 = view, 1 = edit).",
    parameters: z.object({}),
    documentTypes: ["all"]
  }
};
var writerTools = {
  getParagraph: {
    name: "getParagraph",
    description: "Get a single paragraph by its index. Use getStructure() first to see available paragraphs.",
    parameters: z.object({
      index: z.number().int().min(0).describe("Zero-based paragraph index")
    }),
    documentTypes: ["writer"]
  },
  getParagraphs: {
    name: "getParagraphs",
    description: "Get a range of paragraphs. Useful for paginating through large documents.",
    parameters: z.object({
      start: z.number().int().min(0).describe("Starting paragraph index"),
      count: z.number().int().positive().describe("Number of paragraphs to retrieve")
    }),
    documentTypes: ["writer"]
  },
  insertParagraph: {
    name: "insertParagraph",
    description: "Insert a new paragraph with optional styling.",
    parameters: z.object({
      text: z.string().describe("Paragraph text content"),
      afterIndex: z.number().int().min(0).optional().describe("Insert after this paragraph index. Omit to append at end."),
      style: z.enum(["Normal", "Heading 1", "Heading 2", "Heading 3", "List"]).optional().describe("Paragraph style to apply")
    }),
    documentTypes: ["writer"]
  },
  replaceParagraph: {
    name: "replaceParagraph",
    description: "Replace the entire content of a paragraph.",
    parameters: z.object({
      index: z.number().int().min(0).describe("Paragraph index to replace"),
      text: z.string().describe("New paragraph text")
    }),
    documentTypes: ["writer"]
  },
  deleteParagraph: {
    name: "deleteParagraph",
    description: "Delete a paragraph by index.",
    parameters: z.object({
      index: z.number().int().min(0).describe("Paragraph index to delete")
    }),
    documentTypes: ["writer"]
  },
  insertText: {
    name: "insertText",
    description: "Insert text at a specific position within the document.",
    parameters: z.object({
      text: z.string().describe("Text to insert"),
      position: TextPositionSchema.describe("Position to insert at")
    }),
    documentTypes: ["writer"]
  },
  deleteText: {
    name: "deleteText",
    description: "Delete text between two positions.",
    parameters: z.object({
      start: TextPositionSchema.describe("Start position"),
      end: TextPositionSchema.describe("End position")
    }),
    documentTypes: ["writer"]
  },
  replaceText: {
    name: "replaceText",
    description: "Find and replace text within the document.",
    parameters: z.object({
      find: z.string().min(1).describe("Text to find"),
      replace: z.string().describe("Replacement text"),
      paragraph: z.number().int().min(0).optional().describe("Limit to specific paragraph"),
      all: z.boolean().optional().describe("Replace all occurrences (default: false)")
    }),
    documentTypes: ["writer"]
  },
  formatText: {
    name: "formatText",
    description: "Apply formatting to a text range.",
    parameters: z.object({
      range: TextRangeSchema.describe("Text range to format"),
      format: TextFormatSchema.describe("Formatting to apply")
    }),
    documentTypes: ["writer"]
  },
  getFormat: {
    name: "getFormat",
    description: "Get the text formatting at the current cursor position or selection.",
    parameters: z.object({
      position: TextPositionSchema.optional().describe("Position to check (uses current selection if omitted)")
    }),
    documentTypes: ["writer"]
  }
};
var calcTools = {
  getSheetNames: {
    name: "getSheetNames",
    description: "Get the names of all sheets in the workbook.",
    parameters: z.object({}),
    documentTypes: ["calc"]
  },
  getCell: {
    name: "getCell",
    description: "Get the value and formula of a single cell.",
    parameters: z.object({
      cell: CellRefSchema.describe('Cell reference (e.g., "A1" or {row: 0, col: 0})'),
      sheet: SheetRefSchema.optional().describe("Sheet name or index (uses active sheet if omitted)")
    }),
    documentTypes: ["calc"]
  },
  getCells: {
    name: "getCells",
    description: "Get values from a range of cells. Returns a 2D array.",
    parameters: z.object({
      range: RangeRefSchema.describe('Cell range (e.g., "A1:C10")'),
      sheet: SheetRefSchema.optional().describe("Sheet name or index"),
      maxResponseChars: z.number().int().positive().optional().describe("Maximum response size. Use smaller ranges for large data.")
    }),
    documentTypes: ["calc"]
  },
  setCellValue: {
    name: "setCellValue",
    description: "Set the value of a single cell.",
    parameters: z.object({
      cell: CellRefSchema.describe("Cell reference"),
      value: z.union([z.string(), z.number()]).describe("Value to set"),
      sheet: SheetRefSchema.optional().describe("Sheet name or index")
    }),
    documentTypes: ["calc"]
  },
  setCellFormula: {
    name: "setCellFormula",
    description: 'Set a formula in a cell. Formula should start with "=" (e.g., "=SUM(A1:A10)").',
    parameters: z.object({
      cell: CellRefSchema.describe("Cell reference"),
      formula: z.string().describe('Formula starting with "="'),
      sheet: SheetRefSchema.optional().describe("Sheet name or index")
    }),
    documentTypes: ["calc"]
  },
  setCells: {
    name: "setCells",
    description: "Set values for multiple cells at once. Pass a 2D array of values.",
    parameters: z.object({
      range: RangeRefSchema.describe("Starting cell or range"),
      values: z.array(z.array(CellValueSchema)).describe("2D array of values. Rows are outer array, columns are inner."),
      sheet: SheetRefSchema.optional().describe("Sheet name or index")
    }),
    documentTypes: ["calc"]
  },
  clearCell: {
    name: "clearCell",
    description: "Clear the contents of a cell.",
    parameters: z.object({
      cell: CellRefSchema.describe("Cell reference"),
      sheet: SheetRefSchema.optional().describe("Sheet name or index")
    }),
    documentTypes: ["calc"]
  },
  clearRange: {
    name: "clearRange",
    description: "Clear the contents of a range of cells.",
    parameters: z.object({
      range: RangeRefSchema.describe("Cell range to clear"),
      sheet: SheetRefSchema.optional().describe("Sheet name or index")
    }),
    documentTypes: ["calc"]
  },
  insertRow: {
    name: "insertRow",
    description: "Insert a new row after the specified row.",
    parameters: z.object({
      afterRow: z.number().int().min(0).describe("Insert after this row index (0-based)"),
      sheet: SheetRefSchema.optional().describe("Sheet name or index")
    }),
    documentTypes: ["calc"]
  },
  insertColumn: {
    name: "insertColumn",
    description: "Insert a new column after the specified column.",
    parameters: z.object({
      afterCol: z.union([
        z.string().describe('Column letter (e.g., "A", "B", "AA")'),
        z.number().int().min(0).describe("Column index (0-based)")
      ]).describe("Insert after this column"),
      sheet: SheetRefSchema.optional().describe("Sheet name or index")
    }),
    documentTypes: ["calc"]
  },
  deleteRow: {
    name: "deleteRow",
    description: "Delete a row.",
    parameters: z.object({
      row: z.number().int().min(0).describe("Row index to delete"),
      sheet: SheetRefSchema.optional().describe("Sheet name or index")
    }),
    documentTypes: ["calc"]
  },
  deleteColumn: {
    name: "deleteColumn",
    description: "Delete a column.",
    parameters: z.object({
      col: z.union([
        z.string().describe("Column letter"),
        z.number().int().min(0).describe("Column index")
      ]).describe("Column to delete"),
      sheet: SheetRefSchema.optional().describe("Sheet name or index")
    }),
    documentTypes: ["calc"]
  },
  formatCells: {
    name: "formatCells",
    description: "Apply formatting to a range of cells.",
    parameters: z.object({
      range: RangeRefSchema.describe("Cell range to format"),
      format: CellFormatSchema.describe("Formatting to apply"),
      sheet: SheetRefSchema.optional().describe("Sheet name or index")
    }),
    documentTypes: ["calc"]
  },
  addSheet: {
    name: "addSheet",
    description: "Add a new sheet to the workbook.",
    parameters: z.object({
      name: z.string().min(1).describe("Name for the new sheet")
    }),
    documentTypes: ["calc"]
  },
  renameSheet: {
    name: "renameSheet",
    description: "Rename an existing sheet.",
    parameters: z.object({
      sheet: SheetRefSchema.describe("Sheet to rename"),
      newName: z.string().min(1).describe("New sheet name")
    }),
    documentTypes: ["calc"]
  },
  deleteSheet: {
    name: "deleteSheet",
    description: "Delete a sheet from the workbook.",
    parameters: z.object({
      sheet: SheetRefSchema.describe("Sheet to delete")
    }),
    documentTypes: ["calc"]
  }
};
var impressTools = {
  getSlide: {
    name: "getSlide",
    description: "Get detailed content of a specific slide including title and text frames.",
    parameters: z.object({
      index: z.number().int().min(0).describe("Zero-based slide index")
    }),
    documentTypes: ["impress"]
  },
  getSlideCount: {
    name: "getSlideCount",
    description: "Get the total number of slides in the presentation.",
    parameters: z.object({}),
    documentTypes: ["impress"]
  },
  addSlide: {
    name: "addSlide",
    description: "Add a new slide to the presentation.",
    parameters: z.object({
      afterSlide: z.number().int().min(0).optional().describe("Insert after this slide index. Omit to append at end."),
      layout: SlideLayoutSchema.optional().describe("Slide layout to use")
    }),
    documentTypes: ["impress"]
  },
  deleteSlide: {
    name: "deleteSlide",
    description: "Delete a slide from the presentation. Cannot delete the last slide.",
    parameters: z.object({
      index: z.number().int().min(0).describe("Slide index to delete")
    }),
    documentTypes: ["impress"]
  },
  duplicateSlide: {
    name: "duplicateSlide",
    description: "Create a copy of a slide. The copy is inserted after the original.",
    parameters: z.object({
      index: z.number().int().min(0).describe("Slide index to duplicate")
    }),
    documentTypes: ["impress"]
  },
  moveSlide: {
    name: "moveSlide",
    description: "Move a slide to a different position.",
    parameters: z.object({
      fromIndex: z.number().int().min(0).describe("Current slide index"),
      toIndex: z.number().int().min(0).describe("Target position index")
    }),
    documentTypes: ["impress"]
  },
  setSlideTitle: {
    name: "setSlideTitle",
    description: "Set or replace the title text of a slide.",
    parameters: z.object({
      index: z.number().int().min(0).describe("Slide index"),
      title: z.string().describe("New title text")
    }),
    documentTypes: ["impress"]
  },
  setSlideBody: {
    name: "setSlideBody",
    description: "Set or replace the body text of a slide.",
    parameters: z.object({
      index: z.number().int().min(0).describe("Slide index"),
      body: z.string().describe("New body text")
    }),
    documentTypes: ["impress"]
  },
  setSlideNotes: {
    name: "setSlideNotes",
    description: "Set speaker notes for a slide.",
    parameters: z.object({
      index: z.number().int().min(0).describe("Slide index"),
      notes: z.string().describe("Speaker notes text")
    }),
    documentTypes: ["impress"]
  },
  setSlideLayout: {
    name: "setSlideLayout",
    description: "Change the layout of a slide.",
    parameters: z.object({
      index: z.number().int().min(0).describe("Slide index"),
      layout: SlideLayoutSchema.describe("New layout to apply")
    }),
    documentTypes: ["impress"]
  }
};
var drawTools = {
  getPage: {
    name: "getPage",
    description: "Get detailed content of a specific page including shapes.",
    parameters: z.object({
      index: z.number().int().min(0).describe("Zero-based page index")
    }),
    documentTypes: ["draw"]
  },
  getPageCount: {
    name: "getPageCount",
    description: "Get the total number of pages in the document.",
    parameters: z.object({}),
    documentTypes: ["draw"]
  },
  addPage: {
    name: "addPage",
    description: "Add a new page to the document.",
    parameters: z.object({
      afterPage: z.number().int().min(0).optional().describe("Insert after this page index. Omit to append at end.")
    }),
    documentTypes: ["draw"]
  },
  deletePage: {
    name: "deletePage",
    description: "Delete a page from the document. Cannot delete the last page.",
    parameters: z.object({
      index: z.number().int().min(0).describe("Page index to delete")
    }),
    documentTypes: ["draw"]
  },
  duplicatePage: {
    name: "duplicatePage",
    description: "Create a copy of a page. The copy is inserted after the original.",
    parameters: z.object({
      index: z.number().int().min(0).describe("Page index to duplicate")
    }),
    documentTypes: ["draw"]
  },
  addShape: {
    name: "addShape",
    description: "Add a shape to a page.",
    parameters: z.object({
      pageIndex: z.number().int().min(0).describe("Page index"),
      shapeType: ShapeTypeSchema.describe("Type of shape to create"),
      bounds: RectangleSchema.describe("Position and size of the shape"),
      text: z.string().optional().describe("Text content for the shape"),
      fillColor: z.string().optional().describe('Fill color as hex (e.g., "#FF0000")'),
      lineColor: z.string().optional().describe("Line/stroke color as hex")
    }),
    documentTypes: ["draw"]
  },
  addLine: {
    name: "addLine",
    description: "Add a line to a page.",
    parameters: z.object({
      pageIndex: z.number().int().min(0).describe("Page index"),
      start: PositionSchema.describe("Start point of the line"),
      end: PositionSchema.describe("End point of the line"),
      lineColor: z.string().optional().describe("Line color as hex"),
      lineWidth: z.number().positive().optional().describe("Line width in twips")
    }),
    documentTypes: ["draw"]
  },
  deleteShape: {
    name: "deleteShape",
    description: "Delete a shape from a page.",
    parameters: z.object({
      pageIndex: z.number().int().min(0).describe("Page index"),
      shapeIndex: z.number().int().min(0).describe("Shape index on the page")
    }),
    documentTypes: ["draw"]
  },
  setShapeText: {
    name: "setShapeText",
    description: "Set or replace the text content of a shape.",
    parameters: z.object({
      pageIndex: z.number().int().min(0).describe("Page index"),
      shapeIndex: z.number().int().min(0).describe("Shape index"),
      text: z.string().describe("New text content")
    }),
    documentTypes: ["draw"]
  },
  moveShape: {
    name: "moveShape",
    description: "Move a shape to a new position.",
    parameters: z.object({
      pageIndex: z.number().int().min(0).describe("Page index"),
      shapeIndex: z.number().int().min(0).describe("Shape index"),
      position: PositionSchema.describe("New position")
    }),
    documentTypes: ["draw"]
  },
  resizeShape: {
    name: "resizeShape",
    description: "Resize a shape.",
    parameters: z.object({
      pageIndex: z.number().int().min(0).describe("Page index"),
      shapeIndex: z.number().int().min(0).describe("Shape index"),
      size: SizeSchema.describe("New size")
    }),
    documentTypes: ["draw"]
  }
};
var documentTools = {
  convertDocument: {
    name: "convertDocument",
    description: "Convert the entire document to a different format. Returns the converted document as binary data. Use this for format conversions like DOCX to PDF, XLSX to CSV, PPTX to PDF, etc.",
    parameters: z.object({
      outputFormat: OutputFormatSchema.describe("Target format for conversion"),
      options: z.object({
        pdfVersion: z.enum(["PDF/A-1b", "PDF/A-2b", "PDF/A-3b"]).optional().describe("PDF/A compliance level for PDF output"),
        quality: z.number().min(1).max(100).optional().describe("Quality for image formats (1-100)")
      }).optional().describe("Format-specific conversion options")
    }),
    documentTypes: ["all"]
  },
  renderPageToImage: {
    name: "renderPageToImage",
    description: "Render a specific page/slide to an image (PNG, JPG, or WebP). Useful for generating thumbnails, previews, or extracting visual content from documents.",
    parameters: z.object({
      pageIndex: z.number().int().min(0).describe("Zero-based page/slide index to render"),
      format: z.enum(["png", "jpg", "webp"]).default("png").describe("Output image format"),
      width: z.number().int().min(1).max(4096).default(1024).describe("Output image width in pixels"),
      height: z.number().int().min(0).max(4096).default(0).describe("Output image height in pixels (0 = auto based on aspect ratio)"),
      quality: z.number().min(1).max(100).default(90).describe("Quality for JPG/WebP (1-100)")
    }),
    documentTypes: ["all"]
  },
  getPageCount: {
    name: "getPageCount",
    description: "Get the total number of pages, slides, or sheets in the document. For Writer documents, returns page count. For Calc, returns sheet count. For Impress/Draw, returns slide/page count.",
    parameters: z.object({}),
    documentTypes: ["all"]
  },
  exportPageToPdf: {
    name: "exportPageToPdf",
    description: "Export a specific page or range of pages to PDF. Useful for extracting a subset of pages from a larger document.",
    parameters: z.object({
      startPage: z.number().int().min(0).describe("Starting page index (0-based)"),
      endPage: z.number().int().min(0).optional().describe("Ending page index (0-based, inclusive). If omitted, exports only startPage."),
      options: z.object({
        pdfVersion: z.enum(["PDF/A-1b", "PDF/A-2b", "PDF/A-3b"]).optional().describe("PDF/A compliance level")
      }).optional()
    }),
    documentTypes: ["all"]
  },
  getDocumentMetadata: {
    name: "getDocumentMetadata",
    description: "Get document metadata including title, author, creation date, modification date, page count, and document type.",
    parameters: z.object({}),
    documentTypes: ["all"]
  },
  setDocumentMetadata: {
    name: "setDocumentMetadata",
    description: "Set document metadata such as title, author, subject, and keywords.",
    parameters: z.object({
      title: z.string().optional().describe("Document title"),
      author: z.string().optional().describe("Document author"),
      subject: z.string().optional().describe("Document subject"),
      keywords: z.array(z.string()).optional().describe("Document keywords for search/categorization")
    }),
    documentTypes: ["all"]
  },
  exportToHtml: {
    name: "exportToHtml",
    description: "Export the document to HTML format. Useful for web publishing or extracting formatted content.",
    parameters: z.object({
      includeImages: z.boolean().default(true).describe("Whether to embed images in the HTML"),
      inlineStyles: z.boolean().default(true).describe("Whether to use inline CSS styles")
    }),
    documentTypes: ["all"]
  },
  extractText: {
    name: "extractText",
    description: "Extract all text content from the document as plain text. Useful for indexing, searching, or text analysis.",
    parameters: z.object({
      preserveFormatting: z.boolean().default(false).describe("Attempt to preserve basic formatting like paragraphs and lists"),
      pageRange: z.object({
        start: z.number().int().min(0).describe("Start page (0-based)"),
        end: z.number().int().min(0).describe("End page (0-based, inclusive)")
      }).optional().describe("Extract text from specific page range only")
    }),
    documentTypes: ["all"]
  },
  printDocument: {
    name: "printDocument",
    description: "Generate print-ready output. Configures the document for printing with specified settings.",
    parameters: z.object({
      copies: z.number().int().min(1).max(999).default(1).describe("Number of copies"),
      pageRange: z.string().optional().describe('Page range to print (e.g., "1-5", "1,3,5", "all")'),
      orientation: z.enum(["portrait", "landscape"]).optional().describe("Page orientation"),
      paperSize: z.enum(["letter", "a4", "legal", "a3", "a5"]).optional().describe("Paper size")
    }),
    documentTypes: ["all"]
  }
};
var allTools = {
  common: commonTools,
  writer: writerTools,
  calc: calcTools,
  impress: impressTools,
  draw: drawTools,
  document: documentTools
};
var toolsByName = {
  ...commonTools,
  ...writerTools,
  ...calcTools,
  ...impressTools,
  ...drawTools,
  ...documentTools
};
function getToolsForDocumentType(docType) {
  const tools = [];
  for (const tool of Object.values(commonTools)) {
    tools.push(tool);
  }
  for (const tool of Object.values(documentTools)) {
    tools.push(tool);
  }
  const typeTools = {
    writer: writerTools,
    calc: calcTools,
    impress: impressTools,
    draw: drawTools
  }[docType];
  for (const tool of Object.values(typeTools)) {
    tools.push(tool);
  }
  return tools;
}
function zodToJsonSchema(schema) {
  const jsonSchema = z.toJSONSchema(schema, { target: "draft-7" });
  const { $schema: _schema, ...rest } = jsonSchema;
  return rest;
}
function toOpenAIFunction(tool) {
  return {
    name: tool.name,
    description: tool.description,
    parameters: zodToJsonSchema(tool.parameters)
  };
}
function toAnthropicTool(tool) {
  return {
    name: tool.name,
    description: tool.description,
    input_schema: zodToJsonSchema(tool.parameters)
  };
}
function getOpenAIFunctions(docType) {
  return getToolsForDocumentType(docType).map(toOpenAIFunction);
}
function getAnthropicTools(docType) {
  return getToolsForDocumentType(docType).map(toAnthropicTool);
}

// src/editor/index.ts
var LOK_DOCTYPE_TEXT2 = 0;
var LOK_DOCTYPE_SPREADSHEET2 = 1;
var LOK_DOCTYPE_PRESENTATION2 = 2;
var LOK_DOCTYPE_DRAWING2 = 3;
function createEditor(lok, docPtr, options) {
  const docType = lok.documentGetDocumentType(docPtr);
  switch (docType) {
    case LOK_DOCTYPE_TEXT2:
      return new WriterEditor(lok, docPtr, options);
    case LOK_DOCTYPE_SPREADSHEET2:
      return new CalcEditor(lok, docPtr, options);
    case LOK_DOCTYPE_PRESENTATION2:
      return new ImpressEditor(lok, docPtr, options);
    case LOK_DOCTYPE_DRAWING2:
      return new DrawEditor(lok, docPtr, options);
    default:
      throw new Error(`Unsupported document type: ${docType}`);
  }
}
function isWriterEditor(editor) {
  return editor.getDocumentType() === "writer";
}
function isCalcEditor(editor) {
  return editor.getDocumentType() === "calc";
}
function isImpressEditor(editor) {
  return editor.getDocumentType() === "impress";
}
function isDrawEditor(editor) {
  return editor.getDocumentType() === "draw";
}

// src/server.ts
async function createConverter(options) {
  const converter = new LibreOfficeConverter(options);
  await converter.initialize();
  return converter;
}
async function convertDocument(input, options, converterOptions) {
  const converter = await createSubprocessConverter(converterOptions);
  try {
    return await converter.convert(input, options);
  } finally {
    await converter.destroy();
  }
}

export { CATEGORY_OUTPUT_FORMATS, CalcEditor, ConversionError, ConversionErrorCode, DEFAULT_WASM_BASE_URL, DrawEditor, EXTENSION_TO_FORMAT, FORMAT_FILTERS, FORMAT_MIME_TYPES, INPUT_FORMAT_CATEGORY, ImpressEditor, LOKDocumentType, LOK_DOCTYPE_DRAWING, LOK_DOCTYPE_OTHER, LOK_DOCTYPE_OUTPUT_FORMATS, LOK_DOCTYPE_PRESENTATION, LOK_DOCTYPE_SPREADSHEET, LOK_DOCTYPE_TEXT, LOK_KEYEVENT_KEYINPUT, LOK_KEYEVENT_KEYUP, LOK_MOUSEEVENT_BUTTONDOWN, LOK_MOUSEEVENT_BUTTONUP, LOK_MOUSEEVENT_MOVE, LOK_SELTYPE_CELL, LOK_SELTYPE_NONE, LOK_SELTYPE_TEXT, LOK_SETTEXTSELECTION_END, LOK_SETTEXTSELECTION_RESET, LOK_SETTEXTSELECTION_START, LibreOfficeConverter, OfficeEditor, SubprocessConverter, WorkerConverter, WriterEditor, allTools, calcTools, commonTools, convertDocument, createConverter, createEditor, createSubprocessConverter, createWasmPaths, createWorkerConverter, documentTools, drawTools, encodeImage, getAnthropicTools, getConversionErrorMessage, getOpenAIFunctions, getOutputFormatsForDocType, getSharp, getToolsForDocumentType, getValidOutputFormats, impressTools, isCalcEditor, isConversionValid, isDrawEditor, isImpressEditor, isSharpAvailable, isWriterEditor, rgbaToJpeg, rgbaToPng, rgbaToWebp, toAnthropicTool, toOpenAIFunction, toolsByName, writerTools };
//# sourceMappingURL=server.js.map
//# sourceMappingURL=server.js.map