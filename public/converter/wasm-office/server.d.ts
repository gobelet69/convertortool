import { L as LibreOfficeWasmOptions, a as LibreOfficeConverter, C as ConversionOptions, b as ConversionResult } from './index-BZEjCeYS.js';
export { b1 as AllToolName, u as CATEGORY_OUTPUT_FORMATS, a7 as CalcEditor, aD as CalcStructure, aZ as CalcToolName, aA as CellData, aB as CellFormat, av as CellRef, az as CellValue, ax as ColRef, aX as CommonToolName, m as ConversionError, n as ConversionErrorCode, D as DEFAULT_WASM_BASE_URL, z as DocumentCategory, b9 as DocumentInfo, aR as DocumentMetadata, aS as DocumentStructure, b0 as DocumentToolName, aT as DocumentType, a9 as DrawEditor, aN as DrawStructure, a$ as DrawToolName, E as EXTENSION_TO_FORMAT, bb as EditorOperationResult, ba as EditorSession, bd as EmscriptenFS, bc as EmscriptenModule, F as FORMAT_FILTERS, o as FORMAT_MIME_TYPES, aV as FindOptions, b6 as FullQualityPagePreview, b8 as FullQualityRenderOptions, b3 as ILibreOfficeConverter, t as INPUT_FORMAT_CATEGORY, j as ImageEncodeOptions, I as ImageOptions, a8 as ImpressEditor, aI as ImpressStructure, a_ as ImpressToolName, k as InputFormat, b4 as InputFormatOptions, v as LOKDocumentType, _ as LOK_DOCTYPE_DRAWING, $ as LOK_DOCTYPE_OTHER, w as LOK_DOCTYPE_OUTPUT_FORMATS, Z as LOK_DOCTYPE_PRESENTATION, Y as LOK_DOCTYPE_SPREADSHEET, X as LOK_DOCTYPE_TEXT, K as LOK_KEYEVENT_KEYINPUT, M as LOK_KEYEVENT_KEYUP, G as LOK_MOUSEEVENT_BUTTONDOWN, H as LOK_MOUSEEVENT_BUTTONUP, J as LOK_MOUSEEVENT_MOVE, R as LOK_SELTYPE_CELL, N as LOK_SELTYPE_NONE, Q as LOK_SELTYPE_TEXT, U as LOK_SETTEXTSELECTION_END, V as LOK_SETTEXTSELECTION_RESET, T as LOK_SETTEXTSELECTION_START, a5 as OfficeEditor, ap as OpenDocumentOptions, an as OperationResult, O as OutputFormat, aL as PageData, aM as PageInfo, b5 as PagePreview, at as Paragraph, P as PdfOptions, aQ as Position, l as ProgressInfo, aw as RangeRef, aO as Rectangle, b7 as RenderOptions, aU as SelectionRange, aK as ShapeData, aJ as ShapeType, aC as SheetInfo, ay as SheetRef, aP as Size, aG as SlideData, aH as SlideInfo, aE as SlideLayout, S as SubprocessConverter, as as TextFormat, aF as TextFrame, aq as TextPosition, ar as TextRange, aW as ToolDefinition, b2 as ToolParameters, ao as TruncationInfo, A as WasmLoadPhase, B as WasmLoadProgress, be as WasmLoaderModule, W as WorkerConverter, a6 as WriterEditor, au as WriterStructure, aY as WriterToolName, aa as allTools, ae as calcTools, ac as commonTools, a0 as createEditor, d as createSubprocessConverter, y as createWasmPaths, c as createWorkerConverter, ah as documentTools, ag as drawTools, e as encodeImage, am as getAnthropicTools, s as getConversionErrorMessage, al as getOpenAIFunctions, x as getOutputFormatsForDocType, h as getSharp, ai as getToolsForDocumentType, p as getValidOutputFormats, af as impressTools, a2 as isCalcEditor, q as isConversionValid, a4 as isDrawEditor, a3 as isImpressEditor, i as isSharpAvailable, a1 as isWriterEditor, f as rgbaToJpeg, r as rgbaToPng, g as rgbaToWebp, ak as toAnthropicTool, aj as toOpenAIFunction, ab as toolsByName, ad as writerTools } from './index-BZEjCeYS.js';
import 'zod';

/**
 * LibreOffice WASM Document Converter - Server/Node.js Entry Point
 *
 * This entry point exports all Node.js-specific converters and utilities.
 * Use this for server-side code (API routes, server components, etc.)
 *
 * @example
 * ```typescript
 * // In Next.js API routes or server components
 * import { WorkerConverter, createWorkerConverter } from '@matbee/libreoffice-converter/server';
 *
 * const converter = await createWorkerConverter({ wasmPath: './wasm' });
 * const result = await converter.convert(docxBuffer, { outputFormat: 'pdf' });
 * ```
 *
 * @packageDocumentation
 */

/**
 * Create a configured LibreOffice converter instance
 */
declare function createConverter(options?: LibreOfficeWasmOptions): Promise<LibreOfficeConverter>;
/**
 * Quick conversion utility - creates converter, converts, then destroys
 * Uses SubprocessConverter for clean process exit (no hanging pthread workers)
 */
declare function convertDocument(input: Uint8Array | ArrayBuffer | Buffer, options: ConversionOptions, converterOptions?: LibreOfficeWasmOptions): Promise<ConversionResult>;

export { ConversionOptions, ConversionResult, LibreOfficeConverter, LibreOfficeWasmOptions, convertDocument, createConverter };
