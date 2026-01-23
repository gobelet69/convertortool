import { L as LibreOfficeWasmOptions, a as LibreOfficeConverter, C as ConversionOptions, b as ConversionResult, I as ImageOptions, O as OutputFormat } from './index-BZEjCeYS.cjs';
export { b1 as AllToolName, u as CATEGORY_OUTPUT_FORMATS, a7 as CalcEditor, aD as CalcStructure, aZ as CalcToolName, aA as CellData, aB as CellFormat, av as CellRef, az as CellValue, ax as ColRef, aX as CommonToolName, m as ConversionError, n as ConversionErrorCode, D as DEFAULT_WASM_BASE_URL, z as DocumentCategory, aR as DocumentMetadata, aS as DocumentStructure, b0 as DocumentToolName, aT as DocumentType, a9 as DrawEditor, aN as DrawStructure, a$ as DrawToolName, E as EXTENSION_TO_FORMAT, F as FORMAT_FILTERS, o as FORMAT_MIME_TYPES, aV as FindOptions, t as INPUT_FORMAT_CATEGORY, j as ImageEncodeOptions, a8 as ImpressEditor, aI as ImpressStructure, a_ as ImpressToolName, k as InputFormat, v as LOKDocumentType, _ as LOK_DOCTYPE_DRAWING, $ as LOK_DOCTYPE_OTHER, w as LOK_DOCTYPE_OUTPUT_FORMATS, Z as LOK_DOCTYPE_PRESENTATION, Y as LOK_DOCTYPE_SPREADSHEET, X as LOK_DOCTYPE_TEXT, K as LOK_KEYEVENT_KEYINPUT, M as LOK_KEYEVENT_KEYUP, G as LOK_MOUSEEVENT_BUTTONDOWN, H as LOK_MOUSEEVENT_BUTTONUP, J as LOK_MOUSEEVENT_MOVE, R as LOK_SELTYPE_CELL, N as LOK_SELTYPE_NONE, Q as LOK_SELTYPE_TEXT, U as LOK_SETTEXTSELECTION_END, V as LOK_SETTEXTSELECTION_RESET, T as LOK_SETTEXTSELECTION_START, a5 as OfficeEditor, ap as OpenDocumentOptions, an as OperationResult, aL as PageData, aM as PageInfo, at as Paragraph, P as PdfOptions, aQ as Position, l as ProgressInfo, aw as RangeRef, aO as Rectangle, aU as SelectionRange, aK as ShapeData, aJ as ShapeType, aC as SheetInfo, ay as SheetRef, aP as Size, aG as SlideData, aH as SlideInfo, aE as SlideLayout, S as SubprocessConverter, as as TextFormat, aF as TextFrame, aq as TextPosition, ar as TextRange, aW as ToolDefinition, b2 as ToolParameters, ao as TruncationInfo, A as WasmLoadPhase, B as WasmLoadProgress, W as WorkerConverter, a6 as WriterEditor, au as WriterStructure, aY as WriterToolName, aa as allTools, ae as calcTools, ac as commonTools, a0 as createEditor, d as createSubprocessConverter, y as createWasmPaths, c as createWorkerConverter, ah as documentTools, ag as drawTools, e as encodeImage, am as getAnthropicTools, s as getConversionErrorMessage, al as getOpenAIFunctions, x as getOutputFormatsForDocType, h as getSharp, ai as getToolsForDocumentType, p as getValidOutputFormats, af as impressTools, a2 as isCalcEditor, q as isConversionValid, a4 as isDrawEditor, a3 as isImpressEditor, i as isSharpAvailable, a1 as isWriterEditor, f as rgbaToJpeg, r as rgbaToPng, g as rgbaToWebp, ak as toAnthropicTool, aj as toOpenAIFunction, ab as toolsByName, ad as writerTools } from './index-BZEjCeYS.cjs';
import 'zod';

/**
 * LibreOffice WASM Document Converter
 *
 * A headless document conversion toolkit that uses LibreOffice
 * compiled to WebAssembly. Supports conversion between various
 * document formats without any UI dependencies.
 *
 * @packageDocumentation
 */

/**
 * Image format options for exportAsImage
 */
type ImageFormat = 'png' | 'jpg' | 'svg';
/**
 * Create a configured LibreOffice converter instance
 *
 * @example
 * ```typescript
 * import { createConverter } from '@matbee/libreoffice-converter';
 *
 * const converter = await createConverter({
 *   wasmPath: './wasm',
 *   verbose: true,
 * });
 *
 * const pdfData = await converter.convert(docxBuffer, {
 *   outputFormat: 'pdf',
 * });
 * ```
 */
declare function createConverter(options?: LibreOfficeWasmOptions): Promise<LibreOfficeConverter>;
/**
 * Quick conversion utility - creates converter, converts, then destroys
 *
 * In Node.js, uses SubprocessConverter for clean process exit.
 * In browsers, uses LibreOfficeConverter directly.
 *
 * @example
 * ```typescript
 * import { convertDocument } from '@matbee/libreoffice-converter';
 *
 * const pdfData = await convertDocument(docxBuffer, {
 *   outputFormat: 'pdf',
 *   pdf: { pdfaLevel: 'PDF/A-2b' }
 * });
 * ```
 */
declare function convertDocument(input: Uint8Array | ArrayBuffer | Buffer, options: ConversionOptions, converterOptions?: LibreOfficeWasmOptions): Promise<ConversionResult>;
/**
 * Export document pages as images - creates converter, exports specified pages, then destroys
 *
 * @param input - Document buffer
 * @param pages - Page index or array of page indices to export (0-indexed)
 * @param format - Output format: 'png', 'jpg', or 'svg'
 * @param imageOptions - Image options (width, height, dpi)
 * @param converterOptions - Converter options (wasmPath, etc.)
 * @returns Array of ConversionResult, one per page
 *
 * @example
 * ```typescript
 * import { exportAsImage } from '@matbee/libreoffice-converter';
 *
 * // Export single page (0-indexed)
 * const [cover] = await exportAsImage(docxBuffer, 0, 'png');
 * fs.writeFileSync('cover.png', cover.data);
 *
 * // Export multiple pages
 * const slides = await exportAsImage(pptxBuffer, [0, 1, 2], 'png');
 * slides.forEach((img, i) => fs.writeFileSync(`slide-${i}.png`, img.data));
 *
 * // Export with options
 * const highRes = await exportAsImage(pptxBuffer, [0, 1, 2], 'png', {
 *   dpi: 300,
 *   width: 1920
 * });
 * ```
 */
declare function exportAsImage(input: Uint8Array | ArrayBuffer | Buffer, pages: number | number[], format?: ImageFormat, imageOptions?: Omit<ImageOptions, 'pageIndex' | 'pages'>, converterOptions?: LibreOfficeWasmOptions): Promise<ConversionResult[]>;
/**
 * Check if a format is supported for input
 */
declare function isInputFormatSupported(format: string): boolean;
/**
 * Check if a format is supported for output
 */
declare function isOutputFormatSupported(format: string): boolean;
/**
 * Check if a specific conversion path is supported
 * @param inputFormat The input document format (e.g., 'pdf', 'docx')
 * @param outputFormat The desired output format (e.g., 'pdf', 'docx')
 * @returns true if the conversion is supported
 *
 * @example
 * ```typescript
 * import { isConversionSupported } from '@matbee/libreoffice-converter';
 *
 * isConversionSupported('docx', 'pdf');  // true
 * isConversionSupported('pdf', 'docx');  // false - PDFs can't be converted to DOCX
 * isConversionSupported('xlsx', 'csv');  // true
 * ```
 */
declare function isConversionSupported(inputFormat: string, outputFormat: string): boolean;
/**
 * Get valid output formats for a given input format
 * @param inputFormat The input document format
 * @returns Array of valid output formats
 *
 * @example
 * ```typescript
 * import { getValidOutputFormatsFor } from '@matbee/libreoffice-converter';
 *
 * getValidOutputFormatsFor('docx');  // ['pdf', 'docx', 'doc', 'odt', 'rtf', 'txt', 'html', 'png', 'jpg', 'svg']
 * getValidOutputFormatsFor('pdf');   // ['pdf', 'png', 'jpg', 'svg', 'html']
 * getValidOutputFormatsFor('xlsx');  // ['pdf', 'xlsx', 'xls', 'ods', 'csv', 'html', 'png', 'jpg', 'svg']
 * ```
 */
declare function getValidOutputFormatsFor(inputFormat: string): OutputFormat[];

export { ConversionOptions, ConversionResult, type ImageFormat, ImageOptions, LibreOfficeConverter, LibreOfficeWasmOptions, OutputFormat, convertDocument, createConverter, exportAsImage, getValidOutputFormatsFor, isConversionSupported, isInputFormatSupported, isOutputFormatSupported };
